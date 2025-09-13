import * as fs from 'fs';
import * as path from 'path';
import { DataProcessor } from './core/DataProcessor';
import { HTMLGenerator } from './generators/HTMLGenerator';
import { PNGGenerator } from './generators/PNGGenerator';
import { PDFGenerator } from './generators/PDFGenerator';
import { GeneratorOptions, ProcessedData } from './core/ReportData';


export class UnifiedReportGenerator {

  private processor: DataProcessor;
  private htmlGenerator: HTMLGenerator;
  private pngGenerator: PNGGenerator;
  private pdfGenerator: PDFGenerator;
  private options: GeneratorOptions;
  private processedData: ProcessedData | null = null;

  constructor(options: GeneratorOptions) {
    this.options = options;
    this.processor = new DataProcessor();
    this.htmlGenerator = new HTMLGenerator(options);
    this.pngGenerator = new PNGGenerator(options);
    this.pdfGenerator = new PDFGenerator(options);
  }

  private async loadData(): Promise<ProcessedData> {
    if (!this.processedData) {
      console.log(`🚀 Loading data from: ${this.options.csvPath}`);
      await this.processor.loadFromCSV(this.options.csvPath);
      this.processedData = this.processor.getProcessedData();
    }
    return this.processedData;
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  /**
   * 🚀 Princpal method - Generate ALL formats simultaneously
   * HTML + PNG + PDF in parallel for maximum efficiency
   */
  async generateReports(): Promise<{ html: string; png: string; pdf: string }> {
    const data = await this.loadData();
    this.ensureOutputDir();

    console.log(`🚀 Generating ALL formats (HTML + PNG + PDF)...`);

    // Generate all formats in parallel using the class properties
    const [htmlPath, pngPath, pdfPath] = await Promise.all([
      this.htmlGenerator.generate(data),
      this.pngGenerator.generate(data),
      this.pdfGenerator.generate(data)
    ]);

    // Final logs with all formats
    console.log(`✅ All reports generated successfully!`);
    console.log(`   🌐 HTML Report: ${htmlPath}`);
    console.log(`   🖼️ PNG Report: ${pngPath}`);
    console.log(`   📄 PDF Report: ${pdfPath}`);

    return {
      html: htmlPath,
      png: pngPath,
      pdf: pdfPath
    };
  }

}

