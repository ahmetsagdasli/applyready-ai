import { z } from 'zod';

import { extractTextFromPdf } from '../services/parser/pdfParser.js';
import { parseCvTextToJson } from '../agents/cvParserAgent.js';
import { analyzeJobTextToJson } from '../agents/jobAnalyzerAgent.js';
import { scoreCvAgainstJob } from '../agents/matchScorerAgent.js';
import { writeTailoredCv } from '../agents/cvWriterAgent.js';
import { writeCoverLetter } from '../agents/coverLetterAgent.js';
import { generateLinkedInProfile } from '../agents/linkedinAgent.js';
import { generateGapBullets } from '../agents/gapInterviewAgent.js';
import { buildGapQuestions } from '../services/gap/gapQuestions.js';
import { saveGapResponses } from '../services/gapStore.js';
import {
  checkTailoredCvAgainstSource,
  checkCoverLetterAgainstSource,
} from '../services/quality/antiHallucinationCheck.js';
import {
  createApplication,
  listApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
} from '../services/applicationStore.js';
import {
  canRunAiAnalysis,
  recordUsage,
  getUsageSummary,
  AI_ANALYSIS_ACTION,
} from '../services/usageStore.js';

const PREVIEW_MAX_LENGTH = 700;
// OpenAI'a gonderilecek CV metni icin ust sinir (token/maliyet kontrolu).
const AI_INPUT_MAX_LENGTH = 12000;

// multipart/form-data alanlari string olarak gelir.
const analyzeApplicationSchema = z.object({
  cvText: z.string().optional().default(''),
  jobText: z.string().trim().min(1, 'Is ilani metni zorunludur.'),
  targetPosition: z
    .string()
    .trim()
    .min(1, 'Hedef pozisyon zorunludur.')
    .max(200, 'Hedef pozisyon en fazla 200 karakter olabilir.'),
  language: z.enum(['tr', 'en'], {
    errorMap: () => ({ message: 'Dil sadece tr veya en olabilir.' }),
  }),
  style: z.enum(['sade', 'kurumsal', 'yazilimci'], {
    errorMap: () => ({ message: 'Tarz sade, kurumsal veya yazilimci olabilir.' }),
  }),
});

function buildPreview(text) {
  const trimmed = text.trim();
  if (trimmed.length <= PREVIEW_MAX_LENGTH) return trimmed;
  return `${trimmed.slice(0, PREVIEW_MAX_LENGTH)}...`;
}

// Response'un geriye uyumlu ust seviye alanlarini baslatir.
// AI pipeline tamamlandiktan sonra bu alanlar gercek ajan ciktilariyla ezilir.
function buildInitialResult({ targetPosition, language }) {
  const isTr = language === 'tr';

  const generatedCv = isTr
    ? `${targetPosition} pozisyonu icin ilana ozel uretilmis CV metni hazirlaniyor.\n\n` +
      `Profesyonel Ozet: ${targetPosition} rolune uygun, basari odakli ozet.\n` +
      `Deneyim: Ilgili deneyim maddeleri burada yer alacak.\n` +
      `Beceriler: Ilan anahtar kelimeleriyle eslestirilmis beceriler.`
    : `CV tailored for the ${targetPosition} position is being prepared.\n\n` +
      `Professional Summary: An achievement-focused summary aligned with the ${targetPosition} role.\n` +
      `Experience: Relevant experience bullet points will appear here.\n` +
      `Skills: Skills mapped to the job posting keywords.`;

  const coverLetter = isTr
    ? `Sayin Yetkili,\n\n${targetPosition} pozisyonu icin hazirlanmis on yazi metni burada yer alacak. ` +
      `Bu metin AI ile ilana ozel uretilecek.\n\nSaygilarimla.`
    : `Dear Hiring Manager,\n\nThis cover letter is prepared for the ${targetPosition} position. ` +
      `It will be generated with AI tailored to the job posting.\n\nSincerely.`;

  return {
    atsScore: 78,
    missingKeywords: ['React', 'Node.js', 'ATS', 'API Integration'],
    strengths: isTr
      ? [
          "Mevcut deneyim hedef pozisyonla kismen uyumlu.",
          "Teknik proje gecmisi CV'de vurgulanabilir.",
          'Ilan metnine gore profil yeniden konumlandirilabilir.',
        ]
      : [
          'Current experience is partially aligned with the target position.',
          'Technical project history can be highlighted in the CV.',
          'The profile can be repositioned according to the job posting.',
        ],
    weaknesses: isTr
      ? [
          "CV'de olculebilir basari ifadeleri az.",
          'Ilan anahtar kelimelerinin bazilari eksik.',
          'Profesyonel ozet hedef pozisyona gore yeniden yazilmali.',
        ]
      : [
          'The CV has few measurable achievement statements.',
          'Some of the job posting keywords are missing.',
          'The professional summary should be rewritten for the target position.',
        ],
    generatedCv,
    coverLetter,
  };
}

// ---- SSE (Server-Sent Events) yardimcilari — adim adim ilerleme akisi ----
function sseInit(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // nginx vb. proxy buffer'ini kapat
  });
  res.flushHeaders?.();
}
function sseSend(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data ?? {})}\n\n`);
}

export async function analyzeApplication(req, res, next) {
  // ?stream=1 ise sonuc tek JSON yerine adim adim SSE olarak akar.
  const wantsStream = req.query.stream === '1';
  let streaming = false; // SSE basligi gonderildikten SONRA true olur
  const STEPS_TOTAL = 5;
  const progress = (step, label) => {
    if (streaming) sseSend(res, 'progress', { step, total: STEPS_TOTAL, label });
  };

  try {
    const parsed = analyzeApplicationSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Gecersiz istek.';
      return res.status(400).json({ status: 'error', message });
    }

    const { cvText, jobText, targetPosition, language, style } = parsed.data;
    const hasCvText = cvText.trim().length > 0;
    const hasCvFile = Boolean(req.file);

    if (!hasCvText && !hasCvFile) {
      return res.status(400).json({
        status: 'error',
        message: 'CV metni veya PDF dosyasindan en az biri zorunludur.',
      });
    }

    // Girisli kullanicida AI pipeline'dan ONCE kullanim limitini kontrol et.
    // Girissiz analizde limit uygulanmaz.
    if (req.user) {
      const usageCheck = await canRunAiAnalysis({ userId: req.user.id });
      if (!usageCheck.allowed) {
        return res.status(402).json({
          status: 'error',
          code: 'USAGE_LIMIT_REACHED',
          message:
            'Aylik analiz hakkiniz doldu. Devam etmek icin planinizi yukseltmeniz gerekir.',
        });
      }
    }

    // Manuel metin oncelikli; yoksa PDF'ten cikar.
    let usedCvText;
    let inputSource;
    if (hasCvText) {
      usedCvText = cvText;
      inputSource = 'manual';
    } else {
      usedCvText = await extractTextFromPdf(req.file.buffer);
      inputSource = 'pdf';
    }

    // Gercek AI ajanlari. Cok uzun metinler ilk 12000 karakterle sinirli (token/maliyet).
    const finalCvTextForAi = usedCvText.slice(0, AI_INPUT_MAX_LENGTH);
    const jobTextForAi = jobText.slice(0, AI_INPUT_MAX_LENGTH);

    // Buradan itibaren AI pipeline calisir. Stream istendiyse SSE'ye gec —
    // validation/usage hatalari yukarida normal JSON (400/402) olarak dondu.
    if (wantsStream) {
      sseInit(res);
      streaming = true;
    }

    // CV Parser ve Job Analyzer birbirinden bagimsiz; paralel calistirilir.
    progress(1, 'CV ve ilan analiz ediliyor');
    const [parsedCv, jobAnalysis] = await Promise.all([
      parseCvTextToJson(finalCvTextForAi),
      analyzeJobTextToJson(jobTextForAi, targetPosition),
    ]);

    // Match Scorer parsedCv + jobAnalysis'e bagimli; bu yuzden sonra calisir.
    progress(2, 'Eslesme ve ATS skoru hesaplaniyor');
    const matchResult = await scoreCvAgainstJob(
      parsedCv,
      jobAnalysis,
      targetPosition
    );

    // CV Writer matchResult'a bagimli; bu yuzden ondan sonra calisir.
    // Stream modundaysa model ciktisi token-token SSE 'token' event'i olarak
    // akar (UI'da "canli yaziliyor" efekti); degilse davranis degismez.
    progress(3, 'Ilana ozel CV yaziliyor');
    const tailoredCv = await writeTailoredCv({
      parsedCv,
      jobAnalysis,
      matchResult,
      targetPosition,
      language,
      style,
      onToken: streaming
        ? (delta) => sseSend(res, 'token', { agent: 'cvWriter', delta })
        : undefined,
    });

    // Anti-halusinasyon kontrolu (akisi durdurmaz; uyari uretir).
    const tailoredCvQuality = checkTailoredCvAgainstSource({
      parsedCv,
      tailoredCv,
      matchResult,
    });
    if (tailoredCvQuality.warnings.length) {
      tailoredCv._meta.sourceWarnings = [
        ...tailoredCv._meta.sourceWarnings,
        ...tailoredCvQuality.warnings,
      ];
    }

    // Cover Letter ve LinkedIn ikisi de tailoredCv'ye bagimli ama birbirinden
    // bagimsiz; paralel calistirilir.
    progress(4, 'On yazi ve LinkedIn hazirlaniyor');
    const [coverLetterResult, linkedinProfile] = await Promise.all([
      writeCoverLetter({
        parsedCv,
        jobAnalysis,
        matchResult,
        tailoredCv,
        targetPosition,
        language,
        style,
      }),
      generateLinkedInProfile({
        parsedCv,
        jobAnalysis,
        matchResult,
        tailoredCv,
        targetPosition,
        language,
        style,
      }),
    ]);

    // Anti-halusinasyon kontrolu (akisi durdurmaz; uyari uretir).
    const coverLetterQuality = await checkCoverLetterAgainstSource({
      parsedCv,
      jobAnalysis,
      matchResult,
      coverLetterResult,
    });
    if (coverLetterQuality.warnings.length) {
      coverLetterResult._meta.sourceWarnings = [
        ...coverLetterResult._meta.sourceWarnings,
        ...coverLetterQuality.warnings,
      ];
    }

    // Tum analiz ve uretim alanlari gercek AI ciktilariyla doldurulur.
    const result = buildInitialResult({ targetPosition, language, style });
    result.inputSource = inputSource;
    result.cvTextPreview = buildPreview(usedCvText);
    result.parsedCv = parsedCv;
    result.jobAnalysis = jobAnalysis;
    result.matchResult = matchResult;
    result.tailoredCv = tailoredCv;
    result.coverLetterResult = coverLetterResult;
    result.linkedinProfile = linkedinProfile;
    result.qualityChecks = {
      tailoredCv: tailoredCvQuality,
      coverLetter: coverLetterQuality,
    };

    // Gorev 1 — Gap interview: CV'de karsilanmayan ilan keyword'leri icin
    // kullaniciya sorulacak yapilandirilmis sorular (LLM cagrisi yok).
    result.gapQuestions = buildGapQuestions({
      matchResult,
      jobAnalysis,
      language,
    });

    // Ust seviye ozet alanlari gercek matchResult'tan beslenir.
    result.atsScore = matchResult.atsScore;
    result.missingKeywords = matchResult.missingKeywords;
    result.strengths = matchResult.strongMatches;
    result.weaknesses =
      matchResult.gaps?.length ? matchResult.gaps : matchResult.weakMatches;

    // generatedCv ve coverLetter ajan ciktilarindan beslenir.
    result.generatedCv = tailoredCv.plainText;
    result.coverLetter = coverLetterResult.plainText;

    // Giris yapilmissa basvuruyu kaydet; degilse kayitsiz sonuc doner.
    progress(5, 'Sonuc hazirlaniyor');
    result.applicationId = null;
    result.usage = null;
    if (req.user) {
      try {
        const saved = await createApplication({
          userId: req.user.id,
          payload: {
            target_position: targetPosition,
            language,
            style,
            input_source: inputSource,
            cv_text_preview: result.cvTextPreview,
            parsed_cv: parsedCv,
            job_analysis: jobAnalysis,
            match_result: matchResult,
            tailored_cv: tailoredCv,
            cover_letter_result: coverLetterResult,
            linkedin_profile: linkedinProfile,
            quality_checks: result.qualityChecks,
            editable_cv: tailoredCv.plainText,
            editable_cover_letter: coverLetterResult.plainText,
          },
        });
        result.applicationId = saved.id;
      } catch (saveErr) {
        // Kayit hatasi pahali AI sonucunu kaybettirmesin; sonuc yine doner.
        console.error('[applications] kayit hatasi:', saveErr.message);
        result.saveError = 'Basvuru kaydedilemedi (analiz sonucu gosteriliyor).';
      }

      // AI pipeline calistigi icin kullanim her durumda sayilir (kayit basarisiz olsa bile).
      try {
        await recordUsage({
          userId: req.user.id,
          action: AI_ANALYSIS_ACTION,
          applicationId: result.applicationId,
        });
      } catch (usageErr) {
        console.error('[usage] kayit hatasi:', usageErr.message);
      }

      // Guncel kullanim ozeti (kaydedilen kullanimi yansitir).
      try {
        result.usage = await getUsageSummary({ userId: req.user.id });
      } catch (summaryErr) {
        console.error('[usage] ozet hatasi:', summaryErr.message);
      }
    }

    if (streaming) {
      sseSend(res, 'result', result);
      sseSend(res, 'done', {});
      return res.end();
    }
    return res.json(result);
  } catch (err) {
    // SSE basligi gonderildiyse artik HTTP status degistiremeyiz; hatayi
    // SSE 'error' event'i olarak iletip akisi kapatiriz.
    if (streaming) {
      try {
        sseSend(res, 'error', {
          message: err?.message || 'Analiz sirasinda bir hata olustu.',
          code: err?.code || null,
        });
      } catch {
        /* yazma hatasi yutulur */
      }
      return res.end();
    }
    return next(err);
  }
}

// ============================================================
// Gorev 1 — Refine: gap-interview cevaplariyla CV/on yazi/LinkedIn'i
// yeniden uretir. Onaylanmis cevaplar ATS bullet'a cevrilip dogrulanmis
// ek bilgi olarak ajanlara verilir. "Yok" denen keyword'e dokunulmaz.
// ============================================================
// Agir AI durumu (parsedCv/jobAnalysis vb.) authed + applicationId akisinda
// SUNUCUDA DB'den okunur; istemci gondermek zorunda degil. Bu alanlar yalnizca
// guest (applicationId'siz) akista zorunludur. matchResult artik istenmez:
// refine zaten newMatchResult'i bastan hesapliyor (eski alan kullanilmiyordu).
const refineSchema = z.object({
  parsedCv: z.object({}).passthrough().optional(),
  jobAnalysis: z.object({}).passthrough().optional(),
  targetPosition: z.string().trim().min(1, 'Hedef pozisyon zorunludur.').optional(),
  language: z.enum(['tr', 'en']).optional(),
  style: z.enum(['sade', 'kurumsal', 'yazilimci']).optional(),
  applicationId: z.string().uuid().optional().nullable(),
  gapAnswers: z
    .array(
      z.object({
        keyword: z.string(),
        answer: z.string().optional().nullable(),
        hasIt: z.boolean().optional().nullable(),
      })
    )
    .default([]),
});

export async function refineApplication(req, res, next) {
  try {
    const parsed = refineSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Gecersiz istek.';
      return res.status(400).json({ status: 'error', message });
    }

    const {
      parsedCv: bodyParsedCv,
      jobAnalysis: bodyJobAnalysis,
      targetPosition: bodyTargetPosition,
      language: bodyLanguage,
      style: bodyStyle,
      applicationId,
      gapAnswers,
    } = parsed.data;

    // Authed + applicationId: agir analiz durumunu istemciye guvenmek yerine
    // sunucuda DB'den (kullaniciya scope'lu) oku. Bu hem istemci yukunu kaldirir
    // hem de ara AI ciktilarinin tarayici uzerinden round-trip yapmasini onler.
    let parsedCv = bodyParsedCv;
    let jobAnalysis = bodyJobAnalysis;
    let targetPosition = bodyTargetPosition;
    let language = bodyLanguage;
    let style = bodyStyle;

    if (req.user && applicationId) {
      const row = await getApplicationById({
        userId: req.user.id,
        applicationId,
      });
      parsedCv = row.parsed_cv;
      jobAnalysis = row.job_analysis;
      targetPosition = row.target_position;
      language = row.language;
      style = row.style;
    }

    // Guest akista (ya da eksik state) gerekli alanlar body'den gelmeli.
    if (!parsedCv || !jobAnalysis || !targetPosition || !language || !style) {
      return res.status(400).json({
        status: 'error',
        message: 'Eksik analiz durumu. Lutfen basvuruyu yeniden olusturun.',
      });
    }

    // Kullanicinin "var" dedigi ve dolu cevap girdigi gap'ler.
    const answered = gapAnswers.filter(
      (a) => a.hasIt === true && a.answer && a.answer.trim().length > 0
    );

    if (answered.length === 0) {
      return res.status(400).json({
        status: 'error',
        message:
          'Entegre edilecek cevap yok. En az bir eksik için "var" deyip açıklama girin.',
      });
    }

    // 1) Cevaplari dogrulanmis ATS bullet'larina cevir (uydurma yok).
    const verifiedFacts = await generateGapBullets({
      answers: answered.map((a) => ({ keyword: a.keyword, answer: a.answer })),
      parsedCv,
      language,
      style,
    });

    // 2) Onaylanan keyword'leri parsedCv.skills'e ekleyip skoru yeniden hesapla
    //    (kullanici onayladigi icin dogru; ATS iyilesmesini yansitir).
    const augmentedCv = {
      ...parsedCv,
      skills: [
        ...(Array.isArray(parsedCv.skills) ? parsedCv.skills : []),
        ...answered.map((a) => a.keyword),
      ],
    };
    const newMatchResult = await scoreCvAgainstJob(
      augmentedCv,
      jobAnalysis,
      targetPosition
    );

    // 3) CV'yi dogrulanmis ek bilgilerle yeniden uret.
    const tailoredCv = await writeTailoredCv({
      parsedCv: augmentedCv,
      jobAnalysis,
      matchResult: newMatchResult,
      targetPosition,
      language,
      style,
      verifiedFacts,
    });

    const tailoredCvQuality = checkTailoredCvAgainstSource({
      parsedCv: augmentedCv,
      tailoredCv,
      matchResult: newMatchResult,
    });
    if (tailoredCvQuality.warnings.length) {
      tailoredCv._meta.sourceWarnings = [
        ...tailoredCv._meta.sourceWarnings,
        ...tailoredCvQuality.warnings,
      ];
    }

    // 4) On yazi + LinkedIn'i de ayni dogrulanmis bilgilerle yeniden uret.
    const [coverLetterResult, linkedinProfile] = await Promise.all([
      writeCoverLetter({
        parsedCv: augmentedCv,
        jobAnalysis,
        matchResult: newMatchResult,
        tailoredCv,
        targetPosition,
        language,
        style,
        verifiedFacts,
      }),
      generateLinkedInProfile({
        parsedCv: augmentedCv,
        jobAnalysis,
        matchResult: newMatchResult,
        tailoredCv,
        targetPosition,
        language,
        style,
        verifiedFacts,
      }),
    ]);

    const coverLetterQuality = await checkCoverLetterAgainstSource({
      parsedCv: augmentedCv,
      jobAnalysis,
      matchResult: newMatchResult,
      coverLetterResult,
    });
    if (coverLetterQuality.warnings.length) {
      coverLetterResult._meta.sourceWarnings = [
        ...coverLetterResult._meta.sourceWarnings,
        ...coverLetterQuality.warnings,
      ];
    }

    // 5) gap_responses kaydet (var + yok hepsini; accepted bayragiyla).
    if (req.user) {
      const bulletByKeyword = new Map(
        verifiedFacts.map((f) => [String(f.keyword || '').toLowerCase(), f.bullet])
      );
      const rows = gapAnswers.map((a) => {
        const isAccepted = a.hasIt === true && Boolean(a.answer && a.answer.trim());
        return {
          keyword: a.keyword,
          user_answer: a.answer || null,
          generated_bullet: isAccepted
            ? bulletByKeyword.get(String(a.keyword).toLowerCase()) || null
            : null,
          accepted: isAccepted,
        };
      });
      await saveGapResponses({ userId: req.user.id, applicationId, rows });
    }

    const result = {
      atsScore: newMatchResult.atsScore,
      missingKeywords: newMatchResult.missingKeywords,
      strengths: newMatchResult.strongMatches,
      weaknesses: newMatchResult.gaps?.length
        ? newMatchResult.gaps
        : newMatchResult.weakMatches,
      matchResult: newMatchResult,
      tailoredCv,
      coverLetterResult,
      linkedinProfile,
      generatedCv: tailoredCv.plainText,
      coverLetter: coverLetterResult.plainText,
      verifiedFacts,
      qualityChecks: {
        tailoredCv: tailoredCvQuality,
        coverLetter: coverLetterQuality,
      },
      gapQuestions: buildGapQuestions({
        matchResult: newMatchResult,
        jobAnalysis,
        language,
      }),
    };

    // 6) Giris + applicationId varsa kaydi guncelle.
    if (req.user && applicationId) {
      try {
        const saved = await updateApplication({
          userId: req.user.id,
          applicationId,
          updates: {
            match_result: newMatchResult,
            tailored_cv: tailoredCv,
            cover_letter_result: coverLetterResult,
            linkedin_profile: linkedinProfile,
            quality_checks: result.qualityChecks,
            editable_cv: tailoredCv.plainText,
            editable_cover_letter: coverLetterResult.plainText,
          },
        });
        result.applicationId = saved.id;
      } catch (saveErr) {
        console.error('[applications] refine kayit hatasi:', saveErr.message);
        result.saveError = 'Güncelleme kaydedilemedi (sonuç gösteriliyor).';
      }
    }

    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

// DB satirini (snake_case) frontend dostu camelCase nesneye cevirir.
function mapApplicationRow(row) {
  return {
    id: row.id,
    targetPosition: row.target_position,
    language: row.language,
    style: row.style,
    inputSource: row.input_source,
    cvTextPreview: row.cv_text_preview,
    parsedCv: row.parsed_cv,
    jobAnalysis: row.job_analysis,
    matchResult: row.match_result,
    tailoredCv: row.tailored_cv,
    coverLetterResult: row.cover_letter_result,
    linkedinProfile: row.linkedin_profile,
    qualityChecks: row.quality_checks,
    editableCv: row.editable_cv,
    editableCoverLetter: row.editable_cover_letter,
    atsScore: row.match_result?.atsScore ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/applications  (auth zorunlu) - kisa ozet listesi
export async function listApplicationsHandler(req, res, next) {
  try {
    const rows = await listApplications({ userId: req.user.id });
    const summaries = rows.map((row) => ({
      id: row.id,
      targetPosition: row.target_position,
      language: row.language,
      style: row.style,
      atsScore: row.match_result?.atsScore ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    return res.json({ applications: summaries });
  } catch (err) {
    return next(err);
  }
}

// GET /api/applications/:id  (auth zorunlu) - detay
export async function getApplicationHandler(req, res, next) {
  try {
    const row = await getApplicationById({
      userId: req.user.id,
      applicationId: req.params.id,
    });
    return res.json({ application: mapApplicationRow(row) });
  } catch (err) {
    return next(err);
  }
}

const updateSchema = z.object({
  editableCv: z.string().max(30000).optional(),
  editableCoverLetter: z.string().max(30000).optional(),
});

// PUT /api/applications/:id  (auth zorunlu) - sadece editable alanlar
export async function updateApplicationHandler(req, res, next) {
  try {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Gecersiz istek.';
      return res.status(400).json({ status: 'error', message });
    }

    const updates = {};
    if (parsed.data.editableCv !== undefined)
      updates.editable_cv = parsed.data.editableCv;
    if (parsed.data.editableCoverLetter !== undefined)
      updates.editable_cover_letter = parsed.data.editableCoverLetter;

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Guncellenecek alan yok.' });
    }

    const row = await updateApplication({
      userId: req.user.id,
      applicationId: req.params.id,
      updates,
    });
    return res.json({ application: mapApplicationRow(row) });
  } catch (err) {
    return next(err);
  }
}

// DELETE /api/applications/:id  (auth zorunlu)
export async function deleteApplicationHandler(req, res, next) {
  try {
    await deleteApplication({
      userId: req.user.id,
      applicationId: req.params.id,
    });
    return res.json({ status: 'ok' });
  } catch (err) {
    return next(err);
  }
}
