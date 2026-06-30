import * as fs from 'fs';
import * as path from 'path';
import { SourceDetector } from './sourceDetector';
import { CSVExtractor } from './extractors/csvExtractor';
import { ResumeExtractor } from './extractors/resumeExtractor';
import { Normalizer, SkillTaxonomy } from './normalizer';
import { ArbitrationEngine } from './arbitration';
import { CanonicalBuilder } from './canonicalBuilder';
import { ProjectionEngine } from './projector';
import { Claim, PipelineResult, ProjectionConfig, SourceType } from '../../shared/types';

export class Pipeline {
  private sourceDetector: SourceDetector;
  private csvExtractor: CSVExtractor;
  private resumeExtractor: ResumeExtractor;
  private normalizer: Normalizer;
  private arbitrationEngine: ArbitrationEngine;
  private canonicalBuilder: CanonicalBuilder;
  private projectionEngine: ProjectionEngine;
  private warnings: string[] = [];

  constructor(taxonomyPath: string = 'data/skills_taxonomy.json') {
    let taxonomy: SkillTaxonomy = {};
    
    const possiblePaths = [
      taxonomyPath,
      path.join(__dirname, '../../', taxonomyPath),
      path.join(process.cwd(), taxonomyPath),
      path.join(process.cwd(), 'data/skills_taxonomy.json')
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          taxonomy = JSON.parse(fs.readFileSync(p, 'utf-8'));
          break;
        } catch (error) {
          this.warnings.push(`Failed to load taxonomy from ${p}: ${error}`);
        }
      }
    }

    this.sourceDetector = new SourceDetector();
    this.csvExtractor = new CSVExtractor();
    this.resumeExtractor = new ResumeExtractor();
    this.normalizer = new Normalizer(taxonomy);
    this.arbitrationEngine = new ArbitrationEngine(this.normalizer);
    this.canonicalBuilder = new CanonicalBuilder();
    this.projectionEngine = new ProjectionEngine();
  }

  async run(
    csvPath?: string,
    resumePath?: string,
    configPath?: string,
    originalNames?: { csv?: string; resume?: string; config?: string }
  ): Promise<PipelineResult> {
    this.warnings = [];

    try {
      if (!csvPath && !resumePath) {
        return {
          success: false,
          error: 'At least one input file (CSV or resume) must be provided',
          warnings: this.warnings
        };
      }

      const claims: Claim[] = [];

      if (csvPath) {
        const csvMeta = await this.sourceDetector.detect(csvPath, originalNames?.csv);
        if (csvMeta.warning) this.warnings.push(csvMeta.warning);
        
        if (csvMeta.readable) {
          try {
            const csvClaims = await this.csvExtractor.extract(csvPath);
            claims.push(...csvClaims);
          } catch (error) {
            this.warnings.push(`CSV extraction failed: ${error}`);
          }
        }
      }

      if (resumePath) {
        const resumeMeta = await this.sourceDetector.detect(resumePath, originalNames?.resume);
        if (resumeMeta.warning) this.warnings.push(resumeMeta.warning);
        
        if (resumeMeta.readable) {
          try {
            const resumeClaims = await this.resumeExtractor.extract(resumePath, resumeMeta.type);
            claims.push(...resumeClaims);
          } catch (error) {
            this.warnings.push(`Resume extraction failed: ${error}`);
          }
        }
      }

      if (claims.length === 0) {
        return {
          success: false,
          error: 'No data could be extracted from the provided files',
          warnings: this.warnings
        };
      }

      const normalizedClaims = this.normalizer.normalizeClaims(claims);

      const { mergedClaims, provenance, overallConfidence } = 
        this.arbitrationEngine.arbitrate(normalizedClaims);

      if (mergedClaims.experience) {
        const yearsExp = this.arbitrationEngine.calculateYearsExperience(mergedClaims.experience);
        mergedClaims.yearsExperience = yearsExp;
      }

      const profile = this.canonicalBuilder.build(
        mergedClaims,
        provenance,
        overallConfidence,
        this.warnings
      );

      let projected: any = undefined;
      if (configPath && fs.existsSync(configPath)) {
        try {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          projected = this.projectionEngine.project(profile, configData);
        } catch (error) {
          this.warnings.push(`Config projection failed: ${error}`);
        }
      }

      return {
        success: true,
        profile,
        projected,
        warnings: this.warnings
      };

    } catch (error) {
      return {
        success: false,
        error: `Pipeline error: ${error}`,
        warnings: this.warnings
      };
    }
  }
}
