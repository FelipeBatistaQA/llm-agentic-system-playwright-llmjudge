import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { BaseGenerator } from '../core/BaseGenerator';
import { ProcessedData } from '../core/ReportData';
import { HTMLGenerator } from './HTMLGenerator';

export class PDFGenerator extends BaseGenerator {
  async generate(data: ProcessedData): Promise<string> {
    this.ensureOutputDir();
    
    console.log(`📄 Generating PDF from HTML...`);
    
    // 1. Gerar HTML temporário
    const htmlGen = new HTMLGenerator(this.options);
    const htmlPath = await htmlGen.generate(data);
    
    // 2. Converter HTML → PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Configurar viewport para melhor qualidade
    await page.setViewport({ width: 1200, height: 800 });
    
    // Carregar HTML local
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Aguardar gráficos carregarem
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Gerar PDF
    const pdfPath = path.join(this.options.outputDir, 'llm_judge_report.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { 
        top: '1cm', 
        bottom: '1cm', 
        left: '1cm', 
        right: '1cm' 
      },
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">LLM Judge System - Report</div>',
      footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    });
    
    await browser.close();
    console.log(`✅ PDF Report generated: ${pdfPath}`);
    
    return pdfPath;
  }
}
