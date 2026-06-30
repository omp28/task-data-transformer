import * as fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { Claim, SourceType, ExtractionMethod, DocumentPosition } from '../../../shared/types';

export class ResumeExtractor {
  async extract(filePath: string, fileType: SourceType): Promise<Claim[]> {
    const fileName = filePath.split('/').pop() || 'unknown';
    let text = '';

    if (fileType === SourceType.PDF) {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (fileType === SourceType.DOCX) {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    }

    const claims: Claim[] = [];
    
    claims.push(...this.extractContact(text, fileName));
    claims.push(...this.extractExperience(text, fileName));
    claims.push(...this.extractEducation(text, fileName));
    claims.push(...this.extractSkills(text, fileName));

    return claims;
  }

  private extractContact(text: string, fileName: string): Claim[] {
    const claims: Claim[] = [];
    const lines = text.split('\n').slice(0, 20);
    const contactBlock = lines.join(' ');

    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = contactBlock.match(emailRegex);
    if (emailMatches) {
      const cleanedEmails = emailMatches
        .map(email => {
          const cleanEmail = email.split('|')[0].trim();
          return cleanEmail.replace(/[,;:|].*$/, '').trim();
        })
        .filter(email => email.includes('@') && email.length > 5);
      
      const uniqueEmails = [...new Set(cleanedEmails)];
      uniqueEmails.forEach(email => {
        claims.push({
          field: 'email',
          value: email.toLowerCase(),
          source: fileName,
          sourceType: SourceType.PDF,
          method: ExtractionMethod.REGEX_CONTACT,
          position: DocumentPosition.CONTACT_BLOCK,
          confidence: 0.90
        });
      });
    }

    const phoneRegex = /\+?\d{10,}/g;
    const phoneMatches = contactBlock.match(phoneRegex);
    if (phoneMatches) {
      const cleanedPhones = phoneMatches
        .map(phone => phone.split(/[|\s,]/)[0].trim())
        .filter(phone => phone.length >= 10);
      
      const uniquePhones = [...new Set(cleanedPhones)];
      uniquePhones.forEach(phone => {
        claims.push({
          field: 'phone',
          value: phone,
          source: fileName,
          sourceType: SourceType.PDF,
          method: ExtractionMethod.REGEX_CONTACT,
          position: DocumentPosition.CONTACT_BLOCK,
          confidence: 0.85
        });
      });
    }

    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
    const linkedinMatch = text.match(linkedinRegex);
    if (linkedinMatch && linkedinMatch[0]) {
      claims.push({
        field: 'linkedin',
        value: linkedinMatch[0],
        source: fileName,
        sourceType: SourceType.PDF,
        method: ExtractionMethod.REGEX_CONTACT,
        position: DocumentPosition.CONTACT_BLOCK,
        confidence: 0.95
      });
    }

    const githubRegex = /github\.com\/[\w-]+/gi;
    const githubMatch = text.match(githubRegex);
    if (githubMatch && githubMatch[0]) {
      claims.push({
        field: 'github',
        value: githubMatch[0],
        source: fileName,
        sourceType: SourceType.PDF,
        method: ExtractionMethod.REGEX_CONTACT,
        position: DocumentPosition.CONTACT_BLOCK,
        confidence: 0.95
      });
    }

    const nameMatch = lines[0]?.trim();
    if (nameMatch && nameMatch.length < 50 && /^[A-Za-z\s.'-]+$/.test(nameMatch)) {
      claims.push({
        field: 'fullName',
        value: nameMatch,
        source: fileName,
        sourceType: SourceType.PDF,
        method: ExtractionMethod.HEURISTIC,
        position: DocumentPosition.CONTACT_BLOCK,
        confidence: 0.80
      });
    }

    return claims;
  }

  private extractExperience(text: string, fileName: string): Claim[] {
    const claims: Claim[] = [];
    
    const expSectionRegex = /(?:work\s+experience|experience|employment\s+history|professional\s+experience)(.*?)(?=education|skills|projects|$)/is;
    const expMatch = text.match(expSectionRegex);
    
    if (expMatch) {
      const expText = expMatch[1];
      
      const dateRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current)/gi;
      const dateMatches = expText.match(dateRegex);
      
      if (dateMatches) {
        const lines = expText.split('\n');
        for (const dateMatch of dateMatches) {
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(dateMatch)) {
              const companyLine = lines[i].replace(dateMatch, '').trim();
              const company = companyLine.split(/[|•·]/)[0].trim();
              
              if (company && company.length > 2 && company.length < 100) {
                claims.push({
                  field: 'experience',
                  value: {
                    company,
                    dateRange: dateMatch.trim()
                  },
                  source: fileName,
                  sourceType: SourceType.PDF,
                  method: ExtractionMethod.REGEX_SECTION,
                  position: DocumentPosition.SECTION,
                  confidence: 0.75
                });
              }
              break;
            }
          }
        }
      }
    }

    return claims;
  }

  private extractEducation(text: string, fileName: string): Claim[] {
    const claims: Claim[] = [];
    
    const eduSectionRegex = /(?:education|academic\s+background|qualifications)(.*?)(?=experience|skills|projects|certifications|$)/is;
    const eduMatch = text.match(eduSectionRegex);
    
    if (eduMatch) {
      const eduText = eduMatch[1];
      
      const yearRegex = /\b(19|20)\d{2}\b/g;
      const years = eduText.match(yearRegex);
      
      const degreeRegex = /\b(?:bachelor|master|phd|b\.?s\.?|m\.?s\.?|b\.?tech|m\.?tech|b\.?e\.?|m\.?b\.?a\.?|diploma)\b/gi;
      const degrees = eduText.match(degreeRegex);
      
      const institutionRegex = /(?:university|college|institute|school|iit|nit)\s+(?:of\s+)?[\w\s]+/gi;
      const institutions = eduText.match(institutionRegex);
      
      if (institutions) {
        institutions.forEach((institution, idx) => {
          claims.push({
            field: 'education',
            value: {
              institution: institution.trim(),
              degree: degrees?.[idx]?.trim(),
              year: years?.[idx]
            },
            source: fileName,
            sourceType: SourceType.PDF,
            method: ExtractionMethod.REGEX_SECTION,
            position: DocumentPosition.SECTION,
            confidence: 0.70
          });
        });
      }
    }

    return claims;
  }

  private extractSkills(text: string, fileName: string): Claim[] {
    const claims: Claim[] = [];
    
    const skillsSectionRegex = /(?:skills|technical\s+skills|technologies|expertise|proficiencies)(.*?)(?=experience|education|projects|certifications|$)/is;
    const skillsMatch = text.match(skillsSectionRegex);
    
    if (skillsMatch) {
      const skillsText = skillsMatch[1];
      
      const cleanedText = skillsText
        .replace(/(?:languages?|frameworks?|libraries?|tools?|platforms?|devops?|infrastructure|cloud|development|testing|databases?)[\s:]+/gi, '')
        .replace(/&\s+/g, '');
      
      const skillTokens = cleanedText
        .split(/[,•·|\n()]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => {
          if (s.length < 2 || s.length > 50) return false;
          if (/^\d{4}$/.test(s)) return false;
          if (/^(and|or|the|with|using|for|in|on|at|to|of)$/i.test(s)) return false;
          if (/^(languages?|frameworks?|libraries?|tools?|platforms?)$/i.test(s)) return false;
          return true;
        });
      
      const uniqueSkills = [...new Set(skillTokens)];
      
      for (const token of uniqueSkills) {
        claims.push({
          field: 'skills',
          value: token,
          source: fileName,
          sourceType: SourceType.PDF,
          method: ExtractionMethod.REGEX_SECTION,
          position: DocumentPosition.SECTION,
          confidence: 0.70
        });
      }
    }

    return claims;
  }
}
