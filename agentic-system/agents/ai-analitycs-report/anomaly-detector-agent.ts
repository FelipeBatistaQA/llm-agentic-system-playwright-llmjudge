import { Agent, run, handoff } from '@openai/agents';
import { RECOMMENDED_PROMPT_PREFIX } from '@openai/agents-core/extensions';
import { BaseAgent } from '../base-agent';
import { AnomalyDetectionSchema, AnomalyDetection, TestRunData, AnalyticsOptions, AnomalyHandoffDataSchema } from './types';
import anomalyPrompts from './config/anomaly-detector-prompts.json';
import validatorPrompts from './config/anomaly-validator-prompts.json';

export class AnomalyDetectorAgent extends BaseAgent {
    
    private readonly detectorAgent: Agent<unknown, typeof AnomalyDetectionSchema>;
    private readonly validatorAgent: Agent<unknown, typeof AnomalyDetectionSchema>;
    
    constructor(options: AnalyticsOptions = {}) {
        super(options);
        
        // Criar agente validador interno
        this.validatorAgent = new Agent({
            name: 'Anomaly Validator',
            instructions: this.buildInstructions(validatorPrompts),
            model: this.model,
            outputType: AnomalyDetectionSchema,
            modelSettings: {
                temperature: 0,
                maxTokens: 1200
            }
        });
        
        // Criar agente detector principal com handoff
        this.detectorAgent = Agent.create({
            name: 'Anomaly Detector',
            instructions: this.buildInstructions(anomalyPrompts),
            model: this.model,
            outputType: AnomalyDetectionSchema,
            handoffs: [
                handoff(this.validatorAgent, {
                    toolNameOverride: 'transfer_to_validator',
                    toolDescriptionOverride: 'Transfer to validator to verify anomalies and reject false positives',
                    inputType: AnomalyHandoffDataSchema,
                    onHandoff: (ctx, input) => {
                        console.log('🔄 Handoff to validator for validation...');
                        if (input) {
                            console.log(`   Reason: ${input.reason}`);
                            console.log(`   Anomalies to validate: ${input.anomaliesCount}`);
                            console.log(`   Context: ${input.validationContext}`);
                        }
                    }
                })
            ],
            modelSettings: {
                temperature: 0,
                maxTokens: 1500
            }
        });
    }

    async detectAnomalies(testRunData: TestRunData): Promise<AnomalyDetection> {
        const analysisPrompt = this.buildAnalysisPrompt(testRunData);
        
        const result = await run(this.detectorAgent, analysisPrompt, {
            context: { openaiApiKey: this.apiKey }
        });

        const finalResult = result.finalOutput as AnomalyDetection;
        
        // debug logs anomalies
        if (finalResult.validationDetails) {
            console.log('🔍 Validation Results:');
            console.log(`   Potential: ${finalResult.validationDetails.totalPotentialAnomalies}`);
            console.log(`   Validated: ${finalResult.validationDetails.validatedAnomalies}`);
            console.log(`   Rejected: ${finalResult.validationDetails.rejectedAnomalies}`);
            
            finalResult.validationDetails.validationDecisions.forEach((decision, idx) => {
                const statusIcon = decision.decision === 'VALIDATED' ? '✅' : '❌';
                console.log(`   ${statusIcon} Decision #${idx + 1}: ${decision.decision} - ${decision.potentialAnomaly}`);
                console.log(`      Reason: ${decision.reason}`);
                if (decision.mathematicalCheck) {
                    console.log(`      Math: ${decision.mathematicalCheck}`);
                }
                console.log(`      Confidence: ${decision.confidence}/10`);
            });
        }

        return finalResult;
    }

    private buildAnalysisPrompt(data: TestRunData): string {
        const { metadata, detailedRatingAnalysis, criteriaAverages, perfectCriteria } = data;
        
        // Build detailed rating distribution from decimal analysis
        const decimalDistribution = Object.entries(detailedRatingAnalysis.decimalDistribution)
            .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
            .map(([rating, count]) => `Rating ${rating}: ${count} tests (${((count / metadata.totalTests) * 100).toFixed(1)}%)`)
            .join('\n');
        
        return `Analyze the following LLM test run data for anomalies:

## Test Summary:
- Total Tests: ${metadata.totalTests}
- Pass Rate: ${metadata.successRate}
- Average Rating: ${metadata.avgRating.toFixed(2)}/10

## Rating Analysis:
- Rating Range: ${metadata.ratingRange.range.toFixed(1)} points (${metadata.ratingRange.min}-${metadata.ratingRange.max})
- Standard Deviation: ${metadata.ratingRange.standardDeviation.toFixed(3)}
- Most Frequent Rating: ${detailedRatingAnalysis.mostFrequentRating.value} (${detailedRatingAnalysis.mostFrequentRating.percentage.toFixed(1)}% of tests)
- Narrow Range: ${detailedRatingAnalysis.isNarrowRange ? 'Yes' : 'No'} (range < 1.0)

## Detailed Rating Distribution:
${decimalDistribution}

## LLM Judge Criteria Context:
${criteriaAverages ? `
- Helpfulness (${criteriaAverages.helpfulness.toFixed(2)}/10): How useful and actionable the response is for the user
- Relevance (${criteriaAverages.relevance.toFixed(2)}/10): How well the response addresses the specific question asked
- Accuracy (${criteriaAverages.accuracy.toFixed(2)}/10): Factual correctness and reliability of information
- Depth (${criteriaAverages.depth.toFixed(2)}/10): Thoroughness and comprehensiveness of analysis
- Level of Detail (${criteriaAverages.levelOfDetail.toFixed(2)}/10): Appropriate specificity and detail level

🏆 Perfect Criteria Achievements (10.0/10): ${perfectCriteria.length > 0 ? perfectCriteria.join(', ') : 'None achieved'}
` : 'Detailed criteria data not available'}

## Individual Test Performance Analysis:
${data.individualTests.map(test => 
    `- ${test.testName}: ${test.rating}/10 ${test.criteria ? 
        `[H:${test.criteria.helpfulness} R:${test.criteria.relevance} A:${test.criteria.accuracy} D:${test.criteria.depth} LD:${test.criteria.levelOfDetail}]` : '[No criteria data]'}`
).join('\n')}

## Data Quality Assessment:
- Invalid Entries Found: ${metadata.dataQuality.invalidEntriesFound}
${metadata.dataQuality.invalidEntries.length > 0 ? 
`- Examples of Invalid Entries: ${metadata.dataQuality.invalidEntries.join(', ')}` : ''}

## ANALYSIS INSTRUCTIONS:
Context: This is a ${metadata.avgRating >= 9.0 ? 'HIGH-PERFORMANCE' : metadata.avgRating >= 7.0 ? 'GOOD-PERFORMANCE' : 'MIXED-PERFORMANCE'} test run (avg: ${metadata.avgRating.toFixed(2)}).
Focus on GENUINE anomalies that represent actual risks or systematic issues.

## HANDOFF REQUIREMENT:
If you detect ANY potential anomalies, you MUST use the transfer_to_validator tool with:
- reason: "Found potential anomalies requiring validation to avoid false positives"
- anomaliesCount: [number of anomalies detected]
- validationContext: "Analysis of ${metadata.totalTests} tests with ${metadata.avgRating.toFixed(2)} avg rating"

The validator will receive this entire conversation context and can re-examine all data.

If no genuine issues are found, return hasAnomalies: false directly.

DO NOT return anomalies without validation handoff.`;
    }
}