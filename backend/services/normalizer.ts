import { parsePhoneNumber, CountryCode } from 'libphonenumber-js';
import { parse, format } from 'date-fns';
import { extract } from 'fuzzball';
import { Claim, SkillClaim } from '../../shared/types';

export interface SkillTaxonomy {
  [key: string]: {
    canonical: string;
    aliases: string[];
    category: string;
  };
}

export class Normalizer {
  private taxonomy: SkillTaxonomy;

  constructor(taxonomy: SkillTaxonomy) {
    this.taxonomy = taxonomy;
  }

  normalizeClaims(claims: Claim[]): Claim[] {
    return claims.map(claim => {
      switch (claim.field) {
        case 'phone':
          return { ...claim, value: this.normalizePhone(claim.value) };
        case 'email':
          return { ...claim, value: this.normalizeEmail(claim.value) };
        case 'fullName':
          return { ...claim, value: this.normalizeName(claim.value) };
        case 'skills':
          return this.normalizeSkill(claim);
        case 'experience':
          return { ...claim, value: this.normalizeExperience(claim.value) };
        default:
          return claim;
      }
    });
  }

  private normalizePhone(phone: string): string {
    try {
      const cleaned = phone.replace(/[^\d+]/g, '');
      
      const countries: CountryCode[] = ['IN', 'US', 'GB'];
      for (const country of countries) {
        try {
          const phoneNumber = parsePhoneNumber(cleaned, country);
          if (phoneNumber && phoneNumber.isValid()) {
            return phoneNumber.format('E.164');
          }
        } catch {}
      }
      
      const phoneNumber = parsePhoneNumber('+' + cleaned);
      if (phoneNumber && phoneNumber.isValid()) {
        return phoneNumber.format('E.164');
      }
    } catch {}
    
    return phone;
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private normalizeName(name: string): string {
    return name
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private normalizeSkill(claim: Claim): SkillClaim {
    const skillText = claim.value.toString().toLowerCase().trim();
    
    for (const [key, data] of Object.entries(this.taxonomy)) {
      if (key === skillText) {
        return {
          ...claim,
          value: data.canonical,
          canonicalName: data.canonical,
          matchType: 'exact',
          confidence: claim.confidence * 1.0
        } as SkillClaim;
      }
      
      if (data.aliases.some(alias => alias.toLowerCase() === skillText)) {
        return {
          ...claim,
          value: data.canonical,
          canonicalName: data.canonical,
          matchType: 'alias',
          confidence: claim.confidence * 0.95
        } as SkillClaim;
      }
    }
    
    const fuzzyMatches = extract(
      skillText,
      Object.values(this.taxonomy).map(t => t.canonical),
      { limit: 1, cutoff: 85 }
    );
    
    if (fuzzyMatches.length > 0) {
      const [match, score] = fuzzyMatches[0];
      return {
        ...claim,
        value: match,
        canonicalName: match,
        matchType: 'fuzzy',
        fuzzyScore: score,
        confidence: claim.confidence * 0.75
      } as SkillClaim;
    }
    
    return {
      ...claim,
      canonicalName: skillText,
      matchType: 'exact',
      confidence: claim.confidence * 0.5
    } as SkillClaim;
  }

  private normalizeExperience(value: any): any {
    if (value.dateRange) {
      const normalized = value.dateRange
        .replace(/present|current|now|ongoing/gi, format(new Date(), 'MMM yyyy'));
      
      return {
        ...value,
        dateRange: normalized
      };
    }
    return value;
  }

  parseDate(dateStr: string): Date | null {
    const formats = [
      'MMM yyyy',
      'MMMM yyyy',
      'MM/yyyy',
      'yyyy-MM',
      'yyyy'
    ];

    for (const fmt of formats) {
      try {
        return parse(dateStr, fmt, new Date());
      } catch {}
    }

    return null;
  }
}
