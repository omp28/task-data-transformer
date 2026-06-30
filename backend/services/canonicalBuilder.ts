import { createHash } from 'crypto';
import { CanonicalProfile, Experience, Education, Skill, ProvenanceRecord } from '../../shared/types';

export class CanonicalBuilder {
  build(
    mergedClaims: Record<string, any>,
    provenance: ProvenanceRecord[],
    overallConfidence: number,
    warnings: string[]
  ): CanonicalProfile {
    const primaryEmail = Array.isArray(mergedClaims.email) ? mergedClaims.email[0] : mergedClaims.email;
    const candidateId = this.generateId(primaryEmail || '');

    return {
      candidateId,
      fullName: mergedClaims.fullName,
      emails: Array.isArray(mergedClaims.email) ? mergedClaims.email : 
              mergedClaims.email ? [mergedClaims.email] : [],
      phones: Array.isArray(mergedClaims.phone) ? mergedClaims.phone :
              mergedClaims.phone ? [mergedClaims.phone] : [],
      location: mergedClaims.location ? {
        city: mergedClaims.location.city,
        region: mergedClaims.location.region,
        country: mergedClaims.location.country
      } : undefined,
      links: {
        linkedin: mergedClaims.linkedin,
        github: mergedClaims.github,
        portfolio: mergedClaims.portfolio ? (Array.isArray(mergedClaims.portfolio) ? 
                   mergedClaims.portfolio : [mergedClaims.portfolio]) : undefined,
        other: mergedClaims.other ? (Array.isArray(mergedClaims.other) ? 
               mergedClaims.other : [mergedClaims.other]) : undefined
      },
      headline: mergedClaims.headline,
      yearsExperience: mergedClaims.yearsExperience,
      skills: mergedClaims.skills || [],
      experience: mergedClaims.experience || [],
      education: mergedClaims.education || [],
      provenance,
      overallConfidence,
      processedAt: new Date().toISOString(),
      warnings
    };
  }

  private generateId(email: string): string {
    return createHash('sha256').update(email.toLowerCase()).digest('hex');
  }
}
