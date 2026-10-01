import { z } from 'zod';

// Her ajanin beklenen cikti semasi. Prompt dosyalarindaki ("# CIKTI BICIMI")
// JSON ornekleriyle birebir eslesir.
//
// Amac: OpenAI'in response_format:"json_object" modu TIP garantisi vermez
// (orn. atsScore bazen "85" string olarak donebilir, missingKeywords bazen
// dizi yerine tek string olabilir). Bu semalar modelin ciktisini TIP
// seviyesinde dogrular; basarisiz olursa safeGenerateJson bunu loglar ve
// (akisi kirmamak icin) var olan normalize*() fonksiyonlarina devreder —
// yani "validate-and-log", "validate-and-block" degil. Boylece hem model
// guvenilirligi olculebilir hem de uretim akisi kirilgan hale gelmez.
//
// .passthrough() objelerde modelin beklenmeyen ekstra alan eklemesine izin
// verir (bu bir hata degildir); .optional() alanlarin bazen eksik gelmesine
// karsi toleranslidir (normalize*() zaten varsayilan deger atar).

const confidenceSchema = z.union([z.number(), z.record(z.string(), z.number())]);

const metaSchema = z
  .object({
    missing_fields: z.array(z.string()).optional(),
    confidence: confidenceSchema.optional(),
  })
  .passthrough()
  .optional();

export const parsedCvSchema = z
  .object({
    name: z.string().optional(),
    contact: z.object({}).passthrough().optional(),
    summary: z.string().optional(),
    experience: z.array(z.object({}).passthrough()).optional(),
    education: z.array(z.object({}).passthrough()).optional(),
    skills: z.array(z.any()).optional(),
    projects: z.array(z.object({}).passthrough()).optional(),
    certifications: z.array(z.any()).optional(),
    languages: z.array(z.any()).optional(),
    _meta: metaSchema,
  })
  .passthrough();

export const jobAnalysisSchema = z
  .object({
    targetPosition: z.string().optional(),
    detectedJobTitle: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    workMode: z.string().optional(),
    seniority: z.string().optional(),
    employmentType: z.string().optional(),
    positionType: z.string().optional(),
    industry: z.string().optional(),
    requiredSkills: z.array(z.any()).optional(),
    preferredSkills: z.array(z.any()).optional(),
    technicalSkills: z.array(z.any()).optional(),
    softSkills: z.array(z.any()).optional(),
    responsibilities: z.array(z.any()).optional(),
    qualifications: z.array(z.any()).optional(),
    atsKeywords: z.array(z.any()).optional(),
    toolsAndTechnologies: z.array(z.any()).optional(),
    languages: z.array(z.any()).optional(),
    educationRequirements: z.array(z.any()).optional(),
    experienceRequirements: z.array(z.any()).optional(),
    redFlagsOrNotes: z.array(z.any()).optional(),
    _meta: metaSchema,
  })
  .passthrough();

export const matchResultSchema = z
  .object({
    atsScore: z.number().optional(),
    scoreBreakdown: z.record(z.string(), z.number()).optional(),
    missingKeywords: z.array(z.any()).optional(),
    matchedKeywords: z.array(z.any()).optional(),
    keywordBreakdown: z.array(z.object({}).passthrough()).optional(),
    strongMatches: z.array(z.any()).optional(),
    weakMatches: z.array(z.any()).optional(),
    gaps: z.array(z.any()).optional(),
    extraStrengths: z.array(z.any()).optional(),
    recommendations: z.array(z.any()).optional(),
    rewriteFocus: z.array(z.any()).optional(),
    _meta: z
      .object({
        confidence: confidenceSchema.optional(),
        notes: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const tailoredCvSchema = z
  .object({
    title: z.string().optional(),
    professionalSummary: z.string().optional(),
    contact: z.object({}).passthrough().optional(),
    skills: z
      .object({
        highlighted: z.array(z.any()).optional(),
        technical: z.array(z.any()).optional(),
        domain: z.array(z.any()).optional(),
        soft: z.array(z.any()).optional(),
      })
      .passthrough()
      .optional(),
    experience: z.array(z.object({}).passthrough()).optional(),
    projects: z.array(z.object({}).passthrough()).optional(),
    education: z.array(z.object({}).passthrough()).optional(),
    certifications: z.array(z.any()).optional(),
    languages: z.array(z.any()).optional(),
    additionalSections: z.array(z.any()).optional(),
    sectionOrder: z.array(z.string()).optional(),
    plainText: z.string().optional(),
    _meta: z.object({}).passthrough().optional(),
  })
  .passthrough();

export const coverLetterSchema = z
  .object({
    subject: z.string().optional(),
    greeting: z.string().optional(),
    body: z.string().optional(),
    closing: z.string().optional(),
    plainText: z.string().optional(),
    _meta: z.object({}).passthrough().optional(),
  })
  .passthrough();

export const linkedinProfileSchema = z
  .object({
    headline: z.string().optional(),
    about: z.string().optional(),
    featuredSuggestions: z.array(z.any()).optional(),
    skillsToHighlight: z.array(z.any()).optional(),
    experienceRewriteSuggestions: z.array(z.object({}).passthrough()).optional(),
    profileChecklist: z.array(z.any()).optional(),
    recommendedLearningAreas: z.array(z.any()).optional(),
    _meta: z.object({}).passthrough().optional(),
  })
  .passthrough();

export const gapBulletsSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            keyword: z.string().optional(),
            bullet: z.string().optional(),
            section: z.string().optional(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();
