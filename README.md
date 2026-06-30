# Candidate Data Transformer

Multi-source ETL pipeline: CSV + PDF/DOCX → Unified candidate profiles with confidence scoring.

## Quick Start

**Install**:
```bash
npm install
```

**Run Web UI**:
```bash
npm run dev
```
→ Frontend: http://localhost:5173 | Backend: http://localhost:3000

**Run CLI**:
```bash
npm run cli -- transform --csv sample_data/candidates.csv --output output.json
```

**Run Tests**:
```bash
npm test
```

## Pipeline

Detection → Extraction → Normalization → Arbitration → Canonical Building → Projection → Validation

## Config Examples

**Default** (full profile): `{ "fields": [], "includeConfidence": true }`

**Custom** (projected): `{ "fields": [{ "path": "primary_email", "from": "emails[0]" }] }`

## Output

**Canonical Profile**: `{ candidateId, fullName, emails[], phones[], location, links, yearsExperience, skills[],
 experience[], education[], provenance[], overallConfidence, processedAt, warnings[] }`

## API

**POST /api/transform** - multipart/form-data (csv, resume, config)

**Response**: `{ success, profile, projected, warnings }`

## Structure

```
backend/services/  - Pipeline stages (detector, extractors, normalizer, arbitration, builder, projector)
frontend/src/      - React UI components
cli/               - Commander CLI
shared/            - Types & schemas
data/              - Skills taxonomy (370+ skills)
sample_data/       - Test data & configs
```

## Key Features

- **Skills Taxonomy**: Exact + Alias + Fuzzy matching (85% threshold)
- **Timeline Merging**: Range union prevents inflated experience
- **Confidence Scoring**: Source trust + corroboration bonus
- **Edge Cases**: Handles scanned PDFs, overlapping jobs, phone variations, missing files
