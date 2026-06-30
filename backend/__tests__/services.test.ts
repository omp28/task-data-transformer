import { CSVExtractor } from '../services/extractors/csvExtractor';
import { Normalizer } from '../services/normalizer';
import { ArbitrationEngine } from '../services/arbitration';
import * as fs from 'fs';
import * as path from 'path';

describe('CSVExtractor', () => {
  it('should extract claims from CSV file', async () => {
    const extractor = new CSVExtractor();
    const testCSV = path.join(__dirname, '../../sample_data/candidates.csv');
    
    if (fs.existsSync(testCSV)) {
      const claims = await extractor.extract(testCSV);
      expect(claims.length).toBeGreaterThan(0);
      expect(claims[0]).toHaveProperty('field');
      expect(claims[0]).toHaveProperty('confidence');
    }
  });
});

describe('Normalizer', () => {
  const taxonomy = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../data/skills_taxonomy.json'), 'utf-8')
  );
  const normalizer = new Normalizer(taxonomy);

  it('should normalize phone numbers to E.164', () => {
    const phone = normalizer['normalizePhone']('(555) 123-4567');
    expect(phone).toMatch(/^\+\d+/);
  });

  it('should normalize email to lowercase', () => {
    const email = normalizer['normalizeEmail']('Test@Example.COM');
    expect(email).toBe('test@example.com');
  });

  it('should title case names', () => {
    const name = normalizer['normalizeName']('john doe');
    expect(name).toBe('John Doe');
  });
});

describe('ArbitrationEngine', () => {
  const taxonomy = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../data/skills_taxonomy.json'), 'utf-8')
  );
  const normalizer = new Normalizer(taxonomy);
  const engine = new ArbitrationEngine(normalizer);

  it('should calculate years of experience from non-overlapping intervals', () => {
    const experiences = [
      { company: 'A', title: 'Dev', start: 'Jan 2020', end: 'Dec 2020', sources: ['test'], confidence: 0.9 },
      { company: 'B', title: 'Dev', start: 'Jan 2021', end: 'Dec 2021', sources: ['test'], confidence: 0.9 }
    ];
    
    const years = engine.calculateYearsExperience(experiences);
    expect(years).toBeGreaterThan(1.5);
  });
});
