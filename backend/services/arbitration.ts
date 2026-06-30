import { differenceInMonths } from 'date-fns';
import { Claim, Experience, Education, Skill, ProvenanceRecord } from '../../shared/types';
import { Normalizer } from './normalizer';

interface ArbitrationResult {
  mergedClaims: Record<string, any>;
  provenance: ProvenanceRecord[];
  overallConfidence: number;
}

export class ArbitrationEngine {
  private normalizer: Normalizer;

  constructor(normalizer: Normalizer) {
    this.normalizer = normalizer;
  }

  arbitrate(claims: Claim[]): ArbitrationResult {
    const groupedClaims = this.groupByField(claims);
    const mergedClaims: Record<string, any> = {};
    const provenance: ProvenanceRecord[] = [];
    
    for (const [field, fieldClaims] of Object.entries(groupedClaims)) {
      const result = this.arbitrateField(field, fieldClaims);
      mergedClaims[field] = result.value;
      provenance.push(result.provenance);
    }

    const overallConfidence = this.calculateOverallConfidence(provenance);

    return { mergedClaims, provenance, overallConfidence };
  }

  private groupByField(claims: Claim[]): Record<string, Claim[]> {
    const grouped: Record<string, Claim[]> = {};
    
    for (const claim of claims) {
      if (!grouped[claim.field]) {
        grouped[claim.field] = [];
      }
      grouped[claim.field].push(claim);
    }
    
    return grouped;
  }

  private arbitrateField(field: string, claims: Claim[]): {
    value: any;
    provenance: ProvenanceRecord;
  } {
    const listFields = ['email', 'phone', 'skills', 'experience', 'education'];
    
    if (listFields.includes(field)) {
      return this.arbitrateList(field, claims);
    } else {
      return this.arbitrateSingle(field, claims);
    }
  }

  private arbitrateList(field: string, claims: Claim[]): {
    value: any;
    provenance: ProvenanceRecord;
  } {
    const valueMap = new Map<string, { claim: Claim; count: number }>();
    
    for (const claim of claims) {
      const key = JSON.stringify(claim.value);
      const existing = valueMap.get(key);
      
      if (existing) {
        existing.count++;
        existing.claim.confidence += 0.15;
      } else {
        valueMap.set(key, { claim: { ...claim }, count: 1 });
      }
    }
    
    const uniqueClaims = Array.from(valueMap.values())
      .map(v => v.claim)
      .sort((a, b) => b.confidence - a.confidence);

    let value: any;
    
    if (field === 'experience') {
      value = this.mergeExperience(uniqueClaims);
    } else if (field === 'education') {
      value = this.mergeEducation(uniqueClaims);
    } else if (field === 'skills') {
      value = this.mergeSkills(uniqueClaims);
    } else {
      value = uniqueClaims.map(c => c.value);
    }

    const provenance: ProvenanceRecord = {
      field,
      value,
      sources: uniqueClaims.map(c => ({
        file: c.source,
        method: c.method,
        confidence: c.confidence
      }))
    };

    return { value, provenance };
  }

  private arbitrateSingle(field: string, claims: Claim[]): {
    value: any;
    provenance: ProvenanceRecord;
  } {
    const sortedClaims = [...claims].sort((a, b) => b.confidence - a.confidence);
    const winner = sortedClaims[0];
    const conflicts = sortedClaims.slice(1)
      .filter(c => c.value !== winner.value && Math.abs(c.confidence - winner.confidence) <= 0.05)
      .map(c => ({ value: c.value, confidence: c.confidence }));

    const provenance: ProvenanceRecord = {
      field,
      value: winner.value,
      sources: sortedClaims.map(c => ({
        file: c.source,
        method: c.method,
        confidence: c.confidence
      })),
      conflicts: conflicts.length > 0 ? conflicts : undefined
    };

    return { value: winner.value, provenance };
  }

  private mergeExperience(claims: Claim[]): Experience[] {
    const experiences: Experience[] = [];
    
    for (const claim of claims) {
      const exp = claim.value;
      experiences.push({
        company: exp.company || 'Unknown',
        title: exp.title || '',
        start: this.extractStartDate(exp.dateRange),
        end: this.extractEndDate(exp.dateRange),
        summary: exp.summary,
        sources: [claim.source],
        confidence: claim.confidence
      });
    }
    
    return experiences;
  }

  private mergeEducation(claims: Claim[]): Education[] {
    const education: Education[] = [];
    
    for (const claim of claims) {
      const edu = claim.value;
      education.push({
        institution: edu.institution || 'Unknown',
        degree: edu.degree,
        field: edu.field,
        endYear: edu.year ? parseInt(edu.year) : undefined,
        sources: [claim.source],
        confidence: claim.confidence
      });
    }
    
    return education;
  }

  private mergeSkills(claims: Claim[]): Skill[] {
    const skillMap = new Map<string, Skill>();
    
    for (const claim of claims) {
      const skillName = claim.value;
      const existing = skillMap.get(skillName);
      
      if (existing) {
        existing.sources.push(claim.source);
        existing.confidence = Math.max(existing.confidence, claim.confidence);
      } else {
        skillMap.set(skillName, {
          name: skillName,
          confidence: claim.confidence,
          sources: [claim.source]
        });
      }
    }
    
    return Array.from(skillMap.values());
  }

  calculateYearsExperience(experiences: Experience[]): number {
    const intervals: Array<[Date, Date]> = [];
    
    for (const exp of experiences) {
      const start = exp.start ? this.normalizer.parseDate(exp.start) : null;
      const end = exp.end ? this.normalizer.parseDate(exp.end) : new Date();
      
      if (start && end) {
        intervals.push([start, end]);
      }
    }
    
    if (intervals.length === 0) return 0;
    
    intervals.sort((a, b) => a[0].getTime() - b[0].getTime());
    
    const merged: Array<[Date, Date]> = [intervals[0]];
    
    for (let i = 1; i < intervals.length; i++) {
      const last = merged[merged.length - 1];
      const current = intervals[i];
      
      if (current[0] <= last[1]) {
        last[1] = new Date(Math.max(last[1].getTime(), current[1].getTime()));
      } else {
        merged.push(current);
      }
    }
    
    const totalMonths = merged.reduce((sum, [start, end]) => {
      return sum + differenceInMonths(end, start);
    }, 0);
    
    return Math.round((totalMonths / 12) * 10) / 10;
  }

  private extractStartDate(dateRange?: string): string | undefined {
    if (!dateRange) return undefined;
    const parts = dateRange.split(/[-–]/);
    return parts[0]?.trim();
  }

  private extractEndDate(dateRange?: string): string | undefined {
    if (!dateRange) return undefined;
    const parts = dateRange.split(/[-–]/);
    return parts[1]?.trim();
  }

  private calculateOverallConfidence(provenance: ProvenanceRecord[]): number {
    if (provenance.length === 0) return 0;
    
    const total = provenance.reduce((sum, p) => {
      const maxConfidence = Math.max(...p.sources.map(s => s.confidence));
      return sum + maxConfidence;
    }, 0);
    
    return Math.round((total / provenance.length) * 100) / 100;
  }
}
