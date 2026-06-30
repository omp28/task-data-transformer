import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { SourceType } from '../../shared/types';

export interface SourceMetadata {
  type: SourceType;
  readable: boolean;
  fileName: string;
  fileSize: number;
  warning?: string;
}

export class SourceDetector {
  async detect(filePath: string, originalName?: string): Promise<SourceMetadata> {
    const fileName = originalName || path.basename(filePath);
    
    if (!fs.existsSync(filePath)) {
      return {
        type: SourceType.UNKNOWN,
        readable: false,
        fileName,
        fileSize: 0,
        warning: 'File does not exist'
      };
    }

    const fileSize = fs.statSync(filePath).size;
    const ext = path.extname(originalName || filePath).toLowerCase();
    
    if (ext === '.csv') {
      return { type: SourceType.CSV, readable: true, fileName, fileSize };
    }
    
    if (ext === '.pdf') {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        
        const charCount = pdfData.text.substring(0, 1000).length;
        const isScanned = charCount < 100;
        
        return {
          type: SourceType.PDF,
          readable: true,
          fileName,
          fileSize,
          warning: isScanned ? 'Scanned PDF detected - extraction may be limited' : undefined
        };
      } catch (error) {
        return {
          type: SourceType.PDF,
          readable: false,
          fileName,
          fileSize,
          warning: `PDF parsing error: ${error}`
        };
      }
    }
    
    if (ext === '.docx') {
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        return {
          type: SourceType.DOCX,
          readable: true,
          fileName,
          fileSize,
          warning: result.messages.length > 0 ? 'DOCX has warnings' : undefined
        };
      } catch (error) {
        return {
          type: SourceType.DOCX,
          readable: false,
          fileName,
          fileSize,
          warning: `DOCX parsing error: ${error}`
        };
      }
    }

    return {
      type: SourceType.UNKNOWN,
      readable: false,
      fileName,
      fileSize,
      warning: 'Unsupported file type'
    };
  }
}
