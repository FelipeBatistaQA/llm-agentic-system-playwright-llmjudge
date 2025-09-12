#!/usr/bin/env node

import { Command } from 'commander';
import { UnifiedReportGenerator } from './unified-generator';
import * as path from 'path';

const program = new Command();

program
  .name('llm-judge-reports')
  .description('LLM Judge System - Unified Report Generator')
  .version('3.0.0');

program
  .command('generate')
  .description('Generate both PNG and HTML reports from CSV file')
  .argument('<csv-file>', 'Path to CSV file')
  .option('-o, --output <dir>', 'Output directory for reports', './chart-generator')
  .option('-w, --width <number>', 'PNG report width in pixels', '1200')
  .option('-h, --height <number>', 'PNG report height in pixels', '800')
  .action(async (csvFile: string, options) => {
    try {
      const generator = new UnifiedReportGenerator({
        csvPath: path.resolve(csvFile),
        outputDir: path.resolve(options.output),
        width: parseInt(options.width),
        height: parseInt(options.height)
      });

      console.log(`📊 LLM Judge System - Report Generator`);
      console.log(`📁 Output directory: ${options.output}`);
      console.log(``);
      
      await generator.generateReports();
      
      console.log(``);
      console.log(`🎉 Reports ready!`);
      console.log(`   🖼️ PNG Report: Open the PNG file for static view`);
      console.log(`   🌐 HTML Report: Open the HTML file in browser for interactive charts`);
    } catch (error) {
      console.error('❌ Error generating reports:', error);
      process.exit(1);
    }
  });

program.parse();
