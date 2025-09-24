import { Agent, run } from '@openai/agents';
import { BaseAgent } from '../base-agent';
import { SummaryReportSchema, SummaryReport, TestRunData, AnomalyDetection, AnalyticsOptions } from './types';
import summaryPrompts from './config/summary-reporter-prompts.json';

export class SummaryReporterAgent extends BaseAgent {
    
    private readonly agent: Agent<unknown, typeof SummaryReportSchema>;
    
    constructor(options: AnalyticsOptions = {}) {
        super(options);
        this.agent = new Agent({
            name: 'SummaryReporter',
            instructions: this.buildInstructions(summaryPrompts),
            model: this.model,
            outputType: SummaryReportSchema,
            modelSettings: {
                temperature: 0.1,
                maxTokens: 2000
            }
        });
    }

    async generateSummary(testRunData: TestRunData, anomalies: AnomalyDetection): Promise<SummaryReport> {
        const summaryPrompt = this.buildSummaryPrompt(testRunData, anomalies);
        
        const result = await run(this.agent, summaryPrompt, {
            context: { openaiApiKey: this.apiKey }
        });

        return result.finalOutput as SummaryReport;
    }

    private buildSummaryPrompt(data: TestRunData, anomalies: AnomalyDetection): string {
        const { metadata, detailedRatingAnalysis, criteriaAverages, perfectCriteria } = data;
        
        const anomalyContext = anomalies.hasAnomalies ? 
            `\n## Detected Anomalies:\n${anomalies.anomalies.map(a => 
                `- ${a.title} (${a.severity}): ${a.description}`
            ).join('\n')}` : '\n## No significant anomalies detected';

        // build detailed rating distribution
        const decimalDistribution = Object.entries(detailedRatingAnalysis.decimalDistribution)
            .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
            .map(([rating, count]) => `Rating ${rating}: ${count} tests (${((count / metadata.totalTests) * 100).toFixed(1)}%)`)
            .join('\n');

        return `Create an executive summary for this LLM test run:

## Test Performance:
- Tests: ${metadata.totalTests} (${metadata.passCount} passed) 
- Success Rate: ${metadata.successRate}
- Average Rating: ${metadata.avgRating.toFixed(2)}/10

## Rating Analysis:
- Rating Range: ${metadata.ratingRange.range.toFixed(1)} points (${metadata.ratingRange.min}-${metadata.ratingRange.max})
- Standard Deviation: ${metadata.ratingRange.standardDeviation.toFixed(3)} (consistency measure)
- Most Frequent Rating: ${detailedRatingAnalysis.mostFrequentRating.value} (${detailedRatingAnalysis.mostFrequentRating.percentage.toFixed(1)}% of tests)

## Detailed Rating Distribution:
${decimalDistribution}

## Criteria Performance Analysis:
${criteriaAverages ? `
- Helpfulness: ${criteriaAverages.helpfulness.toFixed(2)}/10
- Relevance: ${criteriaAverages.relevance.toFixed(2)}/10
- Accuracy: ${criteriaAverages.accuracy.toFixed(2)}/10  
- Depth: ${criteriaAverages.depth.toFixed(2)}/10
- Level of Detail: ${criteriaAverages.levelOfDetail.toFixed(2)}/10

🏆 Perfect Criteria Achievements (10.0/10): ${perfectCriteria.length > 0 ? perfectCriteria.join(', ') : 'None achieved'}
` : 'Detailed criteria data not available'}

## Data Quality Assessment:
- Data Integrity: ${metadata.dataQuality.invalidEntriesFound === 0 ? 'Clean dataset' : `${metadata.dataQuality.invalidEntriesFound} invalid entries detected and excluded`}
${anomalyContext}

Generate a comprehensive executive summary in the specified JSON format, emphasizing perfect criteria scores and using exact numerical evidence.`;
    }
}