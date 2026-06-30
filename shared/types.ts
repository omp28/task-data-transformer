export enum SourceType {
  CSV = 'csv',
  PDF = 'pdf',
  DOCX = 'docx',
  UNKNOWN = 'unknown'
}

export enum ExtractionMethod {
  COLUMN_MAP = 'column_map',
  REGEX_CONTACT = 'regex_contact',
  REGEX_SECTION = 'regex_section',
  HEURISTIC = 'heuristic',
  OCR = 'ocr'
}

export enum DocumentPosition {
  HEADER = 'header',
  CONTACT_BLOCK = 'contact_block',
  SECTION = 'section',
  BODY = 'body'
}

export interface Claim {
  field: string;
  value: any;
  source: string;
  sourceType: SourceType;
  method: ExtractionMethod;
  position: DocumentPosition;
  confidence: number;
}

export interface SkillClaim extends Claim {
  canonicalName: string;
  matchType: 'exact' | 'alias' | 'fuzzy';
  fuzzyScore?: number;
}

export interface Location {
  city?: string;
  region?: string;
  country?: string;
}

export interface Links {
  linkedin?: string;
  github?: string;
  portfolio?: string[];
  other?: string[];
}

export interface Experience {
  company: string;
  title: string;
  start?: string;
  end?: string;
  summary?: string;
  sources: string[];
  confidence: number;
}

export interface Education {
  institution: string;
  degree?: string;
  field?: string;
  endYear?: number;
  sources: string[];
  confidence: number;
}

export interface Skill {
  name: string;
  confidence: number;
  sources: string[];
}

export interface ProvenanceRecord {
  field: string;
  value: any;
  sources: Array<{
    file: string;
    method: string;
    confidence: number;
  }>;
  conflicts?: Array<{
    value: any;
    confidence: number;
  }>;
}

export interface CanonicalProfile {
  candidateId: string;
  fullName?: string;
  emails: string[];
  phones: string[];
  location?: Location;
  links?: Links;
  headline?: string;
  yearsExperience?: number;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  provenance?: ProvenanceRecord[];
  overallConfidence: number;
  processedAt: string;
  warnings: string[];
}

export interface ProjectionField {
  path: string;
  from?: string;
  type: 'string' | 'number' | 'boolean' | 'string[]' | 'object' | 'object[]';
  required?: boolean;
  normalize?: 'E164' | 'canonical' | 'uppercase' | 'lowercase';
}

export interface ProjectionConfig {
  fields: ProjectionField[];
  includeConfidence: boolean;
  includeProvenance: boolean;
  onMissing: 'null' | 'omit' | 'error';
}

export interface PipelineResult {
  success: boolean;
  profile?: CanonicalProfile;
  projected?: any;
  error?: string;
  warnings: string[];
}
