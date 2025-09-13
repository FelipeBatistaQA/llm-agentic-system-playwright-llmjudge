#!/usr/bin/env node

import { Command } from 'commander';
import { UnifiedReportGenerator } from './unified-generator';
import * as path from 'path';

const program = new Command();

program
  .name('llm-judge-reports')
  .description('LLM Judge System - Unified Report Generator')
  .version('2.0.0');

program
  .command('generate')
  .description('Generate ALL reports from CSV file (HTML + PNG + PDF)')
  .argument('<csv-file>', 'Path to CSV file')
  .option('-o, --output <dir>', 'Output directory for reports', './judge-reports/reports')
  .option('-w, --width <number>', 'PNG report width in pixels', '1800')
  .option('-h, --height <number>', 'PNG report height in pixels', '3000')
  .action(async (csvFile: string, options) => {
    try {
      const generator = new UnifiedReportGenerator({
        csvPath: path.resolve(csvFile),
        outputDir: path.resolve(options.output),
        width: parseInt(options.width),
        height: parseInt(options.height)
      });

      console.log(`📊 LLM Judge System - All Formats Report Generator`);
      console.log(`📁 Output directory: ${options.output}`);
      console.log(`🎯 Formats: HTML + PNG + PDF\n`);
      
      const results = await generator.generateReports();
      
      console.log(`\n🎉 All reports ready!`);
      console.log(`   🌐 HTML Report: Open in browser for interactive charts`);
      console.log(`   🖼️ PNG Report: High-resolution static report`);
      console.log(`   📄 PDF Report: Professional document ready for printing`);
      
    } catch (error) {
      console.error('❌ Error generating reports:', error);
      process.exit(1);
    }
  });

program.parse();
