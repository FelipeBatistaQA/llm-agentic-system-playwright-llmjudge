#!/usr/bin/env node

import { Command } from 'commander';
import { DashboardGenerator } from './chart-generator';
import * as path from 'path';

const program = new Command();

program
  .name('llm-judge-dashboard')
  .description('LLM Judge System Dashboard Generator')
  .version('2.0.0');

program
  .command('generate')
  .description('Generate complete dashboard from CSV file')
  .argument('<csv-file>', 'Path to CSV file')
  .option('-o, --output <dir>', 'Output directory for dashboard', './dashboard')
  .option('-w, --width <number>', 'Dashboard width in pixels', '1200')
  .option('-h, --height <number>', 'Dashboard height in pixels', '800')
  .action(async (csvFile: string, options) => {
    try {
      const generator = new DashboardGenerator({
        csvPath: path.resolve(csvFile),
        outputDir: path.resolve(options.output),
        width: parseInt(options.width),
        height: parseInt(options.height)
      });

      console.log(`🚀 Generating dashboard from: ${csvFile}`);
      console.log(`📁 Saving to: ${options.output}`);
      
      await generator.generateDashboard();
      
      console.log('✅ Dashboard generated successfully!');
    } catch (error) {
      console.error('❌ Error generating dashboard:', error);
      process.exit(1);
    }
  });

program.parse();
