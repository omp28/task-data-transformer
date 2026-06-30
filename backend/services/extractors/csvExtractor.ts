import * as fs from 'fs';
import csvParser from 'csv-parser';
import { Claim, SourceType, ExtractionMethod, DocumentPosition } from '../../../shared/types';

export class CSVExtractor {
  async extract(filePath: string): Promise<Claim[]> {
    const claims: Claim[] = [];
    const fileName = filePath.split('/').pop() || 'unknown.csv';

    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => rows.push(row))
        .on('end', () => {
          for (const row of rows) {
            const rowClaims = this.extractFromRow(row, fileName);
            claims.push(...rowClaims);
          }
          resolve(claims);
        })
        .on('error', reject);
    });
  }

  private extractFromRow(row: any, fileName: string): Claim[] {
    const claims: Claim[] = [];
    const columnMap: Record<string, string[]> = {
      fullName: ['name', 'full_name', 'fullname', 'candidate_name', 'full name'],
      email: ['email', 'email_address', 'primary_email', 'e-mail'],
      phone: ['phone', 'phone_number', 'mobile', 'contact', 'phonenumber'],
      location: ['location', 'city', 'address', 'current_location'],
      company: ['company', 'current_company', 'organization', 'employer'],
      title: ['title', 'job_title', 'position', 'role', 'designation'],
      linkedin: ['linkedin', 'linkedin_url', 'linkedin_profile'],
      github: ['github', 'github_url', 'github_profile'],
      skills: ['skills', 'technical_skills', 'skill_set', 'technologies']
    };

    for (const [canonicalField, variants] of Object.entries(columnMap)) {
      for (const header of Object.keys(row)) {
        const normalizedHeader = header.toLowerCase().trim().replace(/[_\s-]/g, '');
        const matchedVariant = variants.find(v => 
          v.replace(/[_\s-]/g, '') === normalizedHeader
        );

        if (matchedVariant && row[header]) {
          const value = row[header].toString().trim();
          if (value) {
            claims.push({
              field: canonicalField,
              value,
              source: fileName,
              sourceType: SourceType.CSV,
              method: ExtractionMethod.COLUMN_MAP,
              position: DocumentPosition.HEADER,
              confidence: 0.95
            });
          }
          break;
        }
      }
    }

    return claims;
  }
}
