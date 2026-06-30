import { CanonicalProfile, ProjectionConfig, ProjectionField } from '../../shared/types';

export class ProjectionEngine {
  project(profile: CanonicalProfile, config: ProjectionConfig): any {
    if (!config.fields || config.fields.length === 0) {
      const result: any = { ...profile };
      
      if (!config.includeConfidence) {
        this.removeConfidenceFields(result);
      }
      
      if (!config.includeProvenance) {
        delete result.provenance;
      }
      
      return result;
    }

    const projected: any = {};

    for (const fieldConfig of config.fields) {
      const sourcePath = fieldConfig.from || fieldConfig.path;
      let value = this.getValueByPath(profile, sourcePath);

      if (value === undefined || value === null) {
        value = this.handleMissing(config.onMissing, fieldConfig);
      }

      if (value !== undefined) {
        if (fieldConfig.normalize) {
          value = this.applyNormalization(value, fieldConfig.normalize);
        }
        
        this.setValueByPath(projected, fieldConfig.path, value);
      }
    }

    if (config.includeConfidence) {
      projected.overallConfidence = profile.overallConfidence;
    }

    if (config.includeProvenance && profile.provenance) {
      const relevantProvenance = profile.provenance.filter(p => 
        config.fields.some(f => (f.from || f.path).startsWith(p.field))
      );
      if (relevantProvenance.length > 0) {
        projected.provenance = relevantProvenance;
      }
    }

    return projected;
  }

  private getValueByPath(obj: any, path: string): any {
    const arrayMatch = path.match(/^(.*?)\[(.*?)\](.*)$/);
    
    if (arrayMatch) {
      const [, beforeBracket, indexOrEmpty, afterBracket] = arrayMatch;
      const baseValue = this.getValueByPath(obj, beforeBracket || path.substring(0, path.indexOf('[')));
      
      if (!Array.isArray(baseValue)) return undefined;
      
      if (indexOrEmpty === '') {
        if (afterBracket) {
          const extracted = afterBracket.startsWith('.') ? afterBracket.substring(1) : afterBracket;
          return baseValue.map(item => this.getValueByPath(item, extracted));
        }
        return baseValue;
      }
      
      const index = parseInt(indexOrEmpty);
      if (isNaN(index) || index < 0 || index >= baseValue.length) return undefined;
      
      const item = baseValue[index];
      if (afterBracket) {
        const extracted = afterBracket.startsWith('.') ? afterBracket.substring(1) : afterBracket;
        return this.getValueByPath(item, extracted);
      }
      return item;
    }

    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    
    return current;
  }

  private setValueByPath(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
  }

  private handleMissing(strategy: 'null' | 'omit' | 'error', field: ProjectionField): any {
    switch (strategy) {
      case 'null':
        return null;
      case 'omit':
        return undefined;
      case 'error':
        if (field.required) {
          throw new Error(`Required field ${field.path} is missing`);
        }
        return null;
    }
  }

  private applyNormalization(value: any, normalization: string): any {
    switch (normalization) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'canonical':
        if (Array.isArray(value)) {
          return value;
        }
        return value;
      case 'E164':
        return value;
      default:
        return value;
    }
  }

  private removeConfidenceFields(obj: any): void {
    if (Array.isArray(obj)) {
      obj.forEach(item => this.removeConfidenceFields(item));
    } else if (obj && typeof obj === 'object') {
      delete obj.confidence;
      delete obj.overallConfidence;
      Object.values(obj).forEach(value => this.removeConfidenceFields(value));
    }
  }
}
