import { ProcessedData, GeneratorOptions } from './ReportData';

export abstract class BaseGenerator {
  protected options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    this.options = options;
  }

  abstract generate(data: ProcessedData): Promise<string | Buffer>;
  
  protected ensureOutputDir(): void {
    const fs = require('fs');
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }
}
