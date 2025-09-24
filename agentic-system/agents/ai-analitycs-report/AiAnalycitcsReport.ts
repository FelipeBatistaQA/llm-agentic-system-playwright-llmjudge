import { AnomalyDetectorAgent } from './anomaly-detector-agent';
import { SummaryReporterAgent } from './sumarry-reporter-agent';
import { csvDataProcessor } from './csv-data-processor';
import { TestRunData, AnalysisResult, AnalysisResultSchema, AnalyticsOptions } from './types';

export class AIAnalitycsReport {
  
  private anomalyAgent: AnomalyDetectorAgent;
  private summaryAgent: SummaryReporterAgent;

  constructor(options: AnalyticsOptions = {}) {
    this.anomalyAgent = new AnomalyDetectorAgent(options);
    this.summaryAgent = new SummaryReporterAgent(options);
  }

  async analyzeTestRun(csvPath: string = 'logSystem/logs/judge_results.csv'): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    console.log('📊 Processing CSV data...');
    const testRunData: TestRunData = await csvDataProcessor(csvPath);
    
    console.log('🔍 Analyzing anomalies...');
    const anomalyResults = await this.anomalyAgent.detectAnomalies(testRunData);
    
    console.log('📝 Generating summary...');
    const summaryResults = await this.summaryAgent.generateSummary(testRunData, anomalyResults);
    
    const result: AnalysisResult = {
      anomalies: anomalyResults,
      summary: summaryResults,
      metadata: {
        analysisDate: new Date().toISOString(),
        csvPath: csvPath,
        processingTime: Date.now() - startTime
      }
    };
    
    console.log('✅ Analysis completed successfully');
      
      // Validar com Zod
    return AnalysisResultSchema.parse(result);
  }
}