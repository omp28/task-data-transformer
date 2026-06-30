import { z } from 'zod';

export const LocationSchema = z.object({
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional()
});

export const LinksSchema = z.object({
  linkedin: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.array(z.string()).optional(),
  other: z.array(z.string()).optional()
});

export const ExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  start: z.string().optional(),
  end: z.string().optional(),
  summary: z.string().optional(),
  sources: z.array(z.string()),
  confidence: z.number()
});

export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string().optional(),
  field: z.string().optional(),
  endYear: z.number().optional(),
  sources: z.array(z.string()),
  confidence: z.number()
});

export const SkillSchema = z.object({
  name: z.string(),
  confidence: z.number(),
  sources: z.array(z.string())
});

export const ProvenanceRecordSchema = z.object({
  field: z.string(),
  value: z.any(),
  sources: z.array(z.object({
    file: z.string(),
    method: z.string(),
    confidence: z.number()
  })),
  conflicts: z.array(z.object({
    value: z.any(),
    confidence: z.number()
  })).optional()
});

export const CanonicalProfileSchema = z.object({
  candidateId: z.string(),
  fullName: z.string().optional(),
  emails: z.array(z.string()),
  phones: z.array(z.string()),
  location: LocationSchema.optional(),
  links: LinksSchema.optional(),
  headline: z.string().optional(),
  yearsExperience: z.number().optional(),
  skills: z.array(SkillSchema),
  experience: z.array(ExperienceSchema),
  education: z.array(EducationSchema),
  provenance: z.array(ProvenanceRecordSchema).optional(),
  overallConfidence: z.number(),
  processedAt: z.string(),
  warnings: z.array(z.string())
});

export const ProjectionFieldSchema = z.object({
  path: z.string(),
  from: z.string().optional(),
  type: z.enum(['string', 'number', 'boolean', 'string[]', 'object', 'object[]']),
  required: z.boolean().optional(),
  normalize: z.enum(['E164', 'canonical', 'uppercase', 'lowercase']).optional()
});

export const ProjectionConfigSchema = z.object({
  fields: z.array(ProjectionFieldSchema),
  includeConfidence: z.boolean(),
  includeProvenance: z.boolean(),
  onMissing: z.enum(['null', 'omit', 'error'])
});
