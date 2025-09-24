import * as fs from 'fs';
import * as path from 'path';
import { DataProcessor } from './core/DataProcessor';
import { HTMLGenerator } from './generators/HTMLGenerator';
import { PNGGenerator } from './generators/PNGGenerator';
import { PDFGenerator } from './generators/PDFGenerator';
import { GeneratorOptions, ProcessedData } from './core/ReportData';
import { AIAnalitycsReport } from '../agentic-system/agents/ai-analitycs-report';


export class UnifiedReportGenerator {

  private processor: DataProcessor;
  private htmlGenerator: HTMLGenerator;
  private pngGenerator: PNGGenerator;
  private pdfGenerator: PDFGenerator;
  private aiAnalytics: AIAnalitycsReport;
  private options: GeneratorOptions;
  private processedData: ProcessedData | null = null;

  constructor(options: GeneratorOptions) {
    this.options = options;
    this.processor = new DataProcessor();
    this.htmlGenerator = new HTMLGenerator(options);
    this.pngGenerator = new PNGGenerator(options);
    this.pdfGenerator = new PDFGenerator(options);
    this.aiAnalytics = new AIAnalitycsReport();
  }

  private async loadData(): Promise<ProcessedData> {
    if (!this.processedData) {
      console.log(`🚀 Loading data from: ${this.options.csvPath}`);
      
      // 1. Carregar dados básicos (estatísticas tradicionais)
      await this.processor.loadFromCSV(this.options.csvPath);
      const basicData = this.processor.getProcessedData();
      
      // 2. Executar AI Analytics
      console.log(`🤖 Running AI Analytics...`);
      const aiResults = await this.aiAnalytics.analyzeTestRun(this.options.csvPath);
      
      // 3. Combinar dados básicos com AI Analytics
      this.processedData = {
        ...basicData,
        aiAnalytics: aiResults
      };
    }
    return this.processedData;
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  /**
   * 🚀 Principal method - Generate ALL formats simultaneously with AI Analytics
   * HTML + PNG + PDF in parallel for maximum efficiency
   */
  async generateReports(): Promise<{ html: string; png: string; pdf: string }> {
    const data = await this.loadData();
    this.ensureOutputDir();

    console.log(`🚀 Generating enhanced reports with AI Analytics (HTML + PNG + PDF)...`);

    // Generate all formats in parallel using the enriched data
    const [htmlPath, pngPath, pdfPath] = await Promise.all([
      this.htmlGenerator.generate(data),
      this.pngGenerator.generate(data),
      this.pdfGenerator.generate(data)
    ]);

    // Final logs with AI Analytics summary
    console.log(`✅ Enhanced reports generated successfully!`);
    console.log(`   🌐 HTML Report: ${htmlPath} (with AI insights)`);
    console.log(`   🖼️ PNG Report: ${pngPath} (with anomaly detection)`);
    console.log(`   📄 PDF Report: ${pdfPath} (with executive summary)`);
    
    if (data.aiAnalytics?.anomalies.hasAnomalies) {
      console.log(`⚠️  AI detected ${data.aiAnalytics.anomalies.anomalies.length} anomalies - check reports for details`);
    } else {
      console.log(`✅ AI Analysis: No system anomalies detected`);
    }

    return {
      html: htmlPath,
      png: pngPath,
      pdf: pdfPath
    };
  }

}

