import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readFixtureFile(relativePath) {
  return readFileSync(join(__dirname, relativePath), 'utf-8');
}

// Golden dataset: gercek (anonim/kurgu) CV + is ilani ciftleri. Her fixture
// pipeline'in TUMUNU (parser -> analyzer -> scorer -> writer -> cover letter)
// gercek OpenAI cagrilariyla kosar. knownGaps: adayin GERCEKTEN sahip
// OLMADIGI, ilanda istenen bir beceri — bu beceri ciktida "sahip" gibi
// gecerse halusinasyon regresyonu olarak isaretlenir (deterministik kontrol,
// LLM judge'a ihtiyac duymaz).
export const fixtures = [
  {
    id: 'frontend-tr',
    description: 'TR frontend CV vs senior frontend ilani (iyi eslesen, temiz vaka).',
    cvText: readFixtureFile('../../test-results/sample-cv.txt'),
    jobText: readFixtureFile('../../test-results/sample-job.txt'),
    targetPosition: 'Senior Frontend Developer',
    language: 'tr',
    style: 'kurumsal',
    knownGaps: [],
  },
  {
    id: 'backend-en',
    description:
      'EN backend CV vs Kubernetes gerektiren ilan; aday ACIKCA Kubernetes deneyimi OLMADIGINI yaziyor.',
    cvText: readFixtureFile('./fixtures/backend-en-cv.txt'),
    jobText: readFixtureFile('./fixtures/backend-en-job.txt'),
    targetPosition: 'Senior Backend Engineer',
    language: 'en',
    style: 'sade',
    knownGaps: ['Kubernetes'],
  },
];
