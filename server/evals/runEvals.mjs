#!/usr/bin/env node
// AI pipeline eval harness.
//
// Ne yapar: golden dataset (fixtures.js) uzerinde TUM AI pipeline'ini
// (parser -> job analyzer -> match scorer -> CV writer -> cover letter)
// gercek OpenAI cagrilariyla kosar ve ciktiyi coklu katmanda dogrular:
//
//   1) Yapisal gecerlilik  — Zod semasi (agents/schemas.js) ile tip kontrolu.
//   2) Deterministik halusinasyon kontrolu — antiHallucinationCheck.js
//      (substring + embedding-tabanli semantic kontrol).
//   3) "Known gap" sizintisi — fixture'da aday'in SAHIP OLMADIGI acikca
//      belirtilen bir beceri (orn. Kubernetes), uretilen CV/on yazida
//      "sahip" gibi geciyor mu? (en kritik, en somut halusinasyon testi)
//   4) LLM-as-judge faithfulness skoru — ikinci bir modelin genel "uydurma
//      var mi" degerlendirmesi (judge.js).
//   5) Maliyet/latency/regresyon — bu kosunun metrikleri onceki baseline
//      (baseline.json) ile karsilastirilir; buyuk sapmalar uyari olarak
//      raporlanir.
//
// Neden onemli: prompt/model degisikliklerinin ciktida sessizce kaliteyi
// dusurup dusurmedigini olculebilir, tekrarlanabilir bir sekilde gosterir —
// "test altyapisi yok" bosluguna karsi somut bir cevap.
//
// Kullanim:
//   npm run eval                  -> fixtures'i kosar, raporlar, baseline
//                                     ile karsilastirir (baseline'i YAZMAZ).
//   npm run eval -- --update-baseline
//                                  -> kosar VE baseline.json'u guncel
//                                     metriklerle YENIDEN YAZAR.
//
// NOT: Bu script GERCEK OpenAI API cagrilari yapar (parasal maliyeti vardir,
// ~2 fixture x ~7 cagri = kucuk ama sifir degil). CI'da her commit'te
// otomatik calistirmak yerine, prompt/model degisikliklerinden SONRA elle
// calistirilmasi onerilir.

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { fixtures } from './fixtures.js';
import { judgeFaithfulness } from './judge.js';
import { parseCvTextToJson } from '../src/agents/cvParserAgent.js';
import { analyzeJobTextToJson } from '../src/agents/jobAnalyzerAgent.js';
import { scoreCvAgainstJob } from '../src/agents/matchScorerAgent.js';
import { writeTailoredCv } from '../src/agents/cvWriterAgent.js';
import { writeCoverLetter } from '../src/agents/coverLetterAgent.js';
import {
  checkTailoredCvAgainstSource,
  checkCoverLetterAgainstSource,
} from '../src/services/quality/antiHallucinationCheck.js';
import {
  parsedCvSchema,
  jobAnalysisSchema,
  matchResultSchema,
  tailoredCvSchema,
  coverLetterSchema,
} from '../src/agents/schemas.js';
import { getUsageSummary } from '../src/llm/telemetry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = join(__dirname, 'baseline.json');
const UPDATE_BASELINE = process.argv.includes('--update-baseline');

// Regresyon toleranslari — bu esiklerin asilmasi uyari (WARN) basar, ama
// scripti FAIL etmez (asil FAIL kriterleri assertSchema/hallucination/
// knownGap'tir, cunku onlar objektif dogru/yanlistir; skor driftleri ise
// modelin dogal varyansi olabilir).
const REGRESSION_TOLERANCE = {
  atsScore: 20,
  faithfulnessScore: 0.15,
};

function flattenTextForGapCheck(tailoredCv, coverLetter) {
  const skills = tailoredCv?.skills || {};
  const skillText = [
    ...(skills.highlighted || []),
    ...(skills.technical || []),
    ...(skills.domain || []),
    ...(skills.soft || []),
  ].join(' | ');
  return [
    tailoredCv?.plainText,
    skillText,
    coverLetter?.plainText,
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();
}

async function runFixture(fixture) {
  const errors = []; // FAIL — objektif, blocking
  const warnings = []; // WARN — bilgilendirici

  const usageBefore = getUsageSummary().totals;

  const [parsedCv, jobAnalysis] = await Promise.all([
    parseCvTextToJson(fixture.cvText),
    analyzeJobTextToJson(fixture.jobText, fixture.targetPosition),
  ]);
  const matchResult = await scoreCvAgainstJob(
    parsedCv,
    jobAnalysis,
    fixture.targetPosition
  );
  const tailoredCv = await writeTailoredCv({
    parsedCv,
    jobAnalysis,
    matchResult,
    targetPosition: fixture.targetPosition,
    language: fixture.language,
    style: fixture.style,
  });
  const coverLetter = await writeCoverLetter({
    parsedCv,
    jobAnalysis,
    matchResult,
    tailoredCv,
    targetPosition: fixture.targetPosition,
    language: fixture.language,
    style: fixture.style,
  });

  // 1) Yapisal gecerlilik
  const schemaChecks = [
    ['parsedCv', parsedCvSchema, parsedCv],
    ['jobAnalysis', jobAnalysisSchema, jobAnalysis],
    ['matchResult', matchResultSchema, matchResult],
    ['tailoredCv', tailoredCvSchema, tailoredCv],
    ['coverLetter', coverLetterSchema, coverLetter],
  ];
  for (const [name, schema, value] of schemaChecks) {
    const result = schema.safeParse(value);
    if (!result.success) {
      errors.push(
        `[schema] ${name} semaya uymuyor: ${result.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`
      );
    }
  }

  // 2) Deterministik halusinasyon kontrolu (mevcut production kontrolu)
  const cvQuality = checkTailoredCvAgainstSource({ parsedCv, tailoredCv, matchResult });
  const clQuality = await checkCoverLetterAgainstSource({
    parsedCv,
    jobAnalysis,
    matchResult,
    coverLetterResult: coverLetter,
  });
  for (const w of [...cvQuality.warnings, ...clQuality.warnings]) {
    errors.push(`[hallucination-check] ${w}`);
  }

  // 3) Known-gap sizintisi (fixture'a ozel, deterministik, en somut test)
  const combinedText = flattenTextForGapCheck(tailoredCv, coverLetter);
  for (const gap of fixture.knownGaps || []) {
    if (combinedText.includes(gap.toLowerCase())) {
      errors.push(
        `[known-gap-leak] Aday "${gap}" deneyimine SAHIP OLMADIGINI belirtmisken, ` +
          `uretilen ciktida bu kelime geciyor.`
      );
    }
  }

  // 4) LLM-as-judge faithfulness
  let judge;
  try {
    judge = await judgeFaithfulness({
      sourceCvText: fixture.cvText,
      tailoredCv,
      coverLetter,
    });
  } catch (err) {
    warnings.push(`[judge] Judge cagrisi basarisiz oldu: ${err.message}`);
    judge = { faithfulnessScore: null, violations: [] };
  }
  if (judge.faithfulnessScore !== null && judge.faithfulnessScore < 0.85) {
    errors.push(
      `[judge] faithfulnessScore ${judge.faithfulnessScore} < 0.85. ` +
        `Violations: ${(judge.violations || []).join('; ') || '(belirtilmedi)'}`
    );
  }

  const usageAfter = getUsageSummary().totals;
  const metrics = {
    atsScore: matchResult.atsScore,
    faithfulnessScore: judge.faithfulnessScore,
    costUsd: Number((usageAfter.costUsd - usageBefore.costUsd).toFixed(6)),
    latencyMs: usageAfter.latencyMsSum - usageBefore.latencyMsSum,
    llmCalls: usageAfter.calls - usageBefore.calls,
  };

  return { id: fixture.id, errors, warnings, metrics, judge };
}

function compareToBaseline(id, metrics, baseline) {
  const prev = baseline?.fixtures?.[id];
  if (!prev) return [`[baseline] "${id}" icin onceki baseline yok (ilk kosu).`];

  const drifts = [];
  if (
    typeof prev.atsScore === 'number' &&
    Math.abs(prev.atsScore - metrics.atsScore) > REGRESSION_TOLERANCE.atsScore
  ) {
    drifts.push(
      `[regression] atsScore ${prev.atsScore} -> ${metrics.atsScore} ` +
        `(fark > ${REGRESSION_TOLERANCE.atsScore})`
    );
  }
  if (
    typeof prev.faithfulnessScore === 'number' &&
    typeof metrics.faithfulnessScore === 'number' &&
    prev.faithfulnessScore - metrics.faithfulnessScore > REGRESSION_TOLERANCE.faithfulnessScore
  ) {
    drifts.push(
      `[regression] faithfulnessScore ${prev.faithfulnessScore} -> ${metrics.faithfulnessScore} ` +
        `(dusus > ${REGRESSION_TOLERANCE.faithfulnessScore})`
    );
  }
  return drifts;
}

async function main() {
  const baseline = existsSync(BASELINE_PATH)
    ? JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'))
    : null;

  const newBaseline = { generatedAt: new Date().toISOString(), fixtures: {} };
  let hasHardFailure = false;

  console.log(`\n=== AI Pipeline Eval — ${fixtures.length} fixture ===\n`);

  for (const fixture of fixtures) {
    console.log(`--- ${fixture.id} ---  ${fixture.description}`);
    const { errors, warnings, metrics } = await runFixture(fixture);
    const driftWarnings = compareToBaseline(fixture.id, metrics, baseline);

    console.log(
      `  atsScore=${metrics.atsScore} faithfulness=${metrics.faithfulnessScore} ` +
        `cost=$${metrics.costUsd} latency=${metrics.latencyMs}ms llmCalls=${metrics.llmCalls}`
    );
    for (const w of [...warnings, ...driftWarnings]) console.log(`  WARN  ${w}`);
    for (const e of errors) console.log(`  FAIL  ${e}`);
    if (errors.length === 0 && warnings.length === 0 && driftWarnings.length === 0) {
      console.log('  OK');
    }
    console.log('');

    if (errors.length > 0) hasHardFailure = true;
    newBaseline.fixtures[fixture.id] = metrics;
  }

  if (UPDATE_BASELINE) {
    writeFileSync(BASELINE_PATH, JSON.stringify(newBaseline, null, 2));
    console.log(`Baseline guncellendi: ${BASELINE_PATH}\n`);
  } else if (!baseline) {
    console.log(
      'Ipucu: ilk kosu icin baseline yok. Sonuclar makul gorunuyorsa ' +
        '"npm run eval -- --update-baseline" ile baseline olustur.\n'
    );
  }

  if (hasHardFailure) {
    console.log('SONUC: FAIL (yukaridaki FAIL satirlarina bakin)\n');
    process.exitCode = 1;
  } else {
    console.log('SONUC: PASS\n');
  }
}

main().catch((err) => {
  console.error('Eval harness beklenmeyen hata ile durdu:', err);
  process.exitCode = 1;
});
