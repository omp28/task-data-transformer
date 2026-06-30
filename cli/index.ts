#!/usr/bin/env node

import { Command } from 'commander';
import { Pipeline } from '../backend/services/pipeline';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('candidate-transformer')
  .description('Multi-source candidate data transformer')
  .version('1.0.0');

program
  .command('transform')
  .description('Transform candidate data from multiple sources')
  .option('-c, --csv <path>', 'Path to CSV file')
  .option('-r, --resume <path>', 'Path to resume file (PDF/DOCX)')
  .option('--config <path>', 'Path to projection config JSON')
  .option('-o, --output <path>', 'Output JSON file path')
  .action(async (options) => {
    try {
      if (!options.csv && !options.resume) {
        console.error('Error: At least one input file (--csv or --resume) must be provided');
        process.exit(1);
      }

      console.log('Starting candidate transformation pipeline...\n');
      
      if (options.csv) console.log(`CSV: ${options.csv}`);
      if (options.resume) console.log(`Resume: ${options.resume}`);
      if (options.config) console.log(`Config: ${options.config}`);
      console.log('');

      const pipeline = new Pipeline();
      const result = await pipeline.run(options.csv, options.resume, options.config);

      if (result.success) {
        console.log('✓ Pipeline completed successfully\n');
        
        const output = result.projected || result.profile;
        
        if (options.output) {
          fs.writeFileSync(options.output, JSON.stringify(output, null, 2));
          console.log(`Output written to: ${options.output}`);
        } else {
          console.log(JSON.stringify(output, null, 2));
        }

        if (result.warnings.length > 0) {
          console.log('\nWarnings:');
          result.warnings.forEach(w => console.log(`  - ${w}`));
        }
      } else {
        console.error('✗ Pipeline failed');
        console.error(`Error: ${result.error}`);
        
        if (result.warnings.length > 0) {
          console.error('\nWarnings:');
          result.warnings.forEach(w => console.error(`  - ${w}`));
        }
        
        process.exit(1);
      }
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  });

program.parse();
