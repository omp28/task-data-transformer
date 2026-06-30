# Candidate Data Transformer - Technical Design

**Author**: Om Kumar Patel | **Date**: June 29, 2026

## 1. Pipeline Architecture

```
Input Files → Detection → Extraction → Normalization → Arbitration → 
Canonical Building → Projection → Validation → JSON Output
```

**7 Stages**:
1. **Detection** - File type identification (CSV/PDF/DOCX)
2. **Extraction** - Raw claims with confidence scores (CSV: 0.95, Resume: 0.70-0.90)
3. **Normalization** - E.164 phones, canonical skills, date parsing
4. **Arbitration** - Conflict resolution via confidence scoring + corroboration (+0.15 per source)
5. **Canonical Building** - SHA-256 ID generation, unified profile
6. **Projection** - Runtime field mapping (dot-notation paths)
7. **Validation** - Zod schema enforcement

## 2. Data Models

**Claim**: `{ field, value, source, sourceType, method, position, confidence }`

**Canonical Profile**: `{ candidateId, fullName, emails[], phones[], location, links, headline, yearsExperience, skills[], experience[], education[], provenance[], overallConfidence, processedAt, warnings[] }`

## 3. Confidence Scoring

`confidence = sourceWeight × methodWeight × positionWeight × matchMultiplier`

- Source: CSV (1.00), PDF/DOCX (0.70)
- Method: Column map (1.00), Regex (0.95-0.85), Heuristic (0.70)
- Corroboration: `+0.15` per additional source

## 4. Experience Timeline Merging

Range union algorithm: merge overlapping intervals, sum months.
- Example: Job A (Jan-Dec 2020) + Job B (Jun 2020-May 2021) = 17 months total

## 5. Skills Taxonomy

370+ canonical skills. Matching: Exact → Alias → Fuzzy (85% threshold)
- Example: "py" → "Python", "javascrpt" → "JavaScript"

## 6. Edge Cases

- Scanned PDFs: Character density detection
- Overlapping timelines: Range union merge
- Ongoing employment: "Present" → current date
- Phone variations: E.164 normalization
- Conflicts: Provenance tracking

## 7. Tech Stack

- **Backend**: Node.js, TypeScript, Express, pdf-parse, mammoth, csv-parser, libphonenumber-js, fuzzball, Zod
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **CLI**: Commander.js

## 8. Key Design Decisions

1. **TypeScript**: Type safety, reduced runtime errors
2. **Evidence Arbitration**: Transparent provenance tracking, confidence scoring
3. **Configurable Projection**: Runtime output reshaping without code changes
4. **Range Union**: Prevents inflated experience from overlapping jobs
5. **Skills Taxonomy**: Exact + Alias + Fuzzy matching for robustness
