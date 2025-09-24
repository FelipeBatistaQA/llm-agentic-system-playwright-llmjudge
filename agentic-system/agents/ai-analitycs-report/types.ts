import { z } from 'zod';
import { BaseAgentOptions } from '../base-agent';

// schema for structured test data
export const TestRunDataSchema = z.object({
  metadata: z.object({
    totalTests: z.number(),
    passCount: z.number(),
    avgRating: z.number(),
    successRate: z.string(),
    testDate: z.string(),
    ratingRange: z.object({
      min: z.number(),
      max: z.number(),
      range: z.number(),
      standardDeviation: z.number()
    }),
    dataQuality: z.object({
      invalidEntriesFound: z.number(),
      invalidEntries: z.array(z.string())
    })
  }),
  ratingDistribution: z.array(z.number()),
  detailedRatingAnalysis: z.object({
    decimalDistribution: z.record(z.number()),
    mostFrequentRating: z.object({
      value: z.number(),
      count: z.number(),
      percentage: z.number()
    }),
    isNarrowRange: z.boolean()
  }),
  criteriaAverages: z.object({
    helpfulness: z.number(),
    relevance: z.number(), 
    accuracy: z.number(),
    depth: z.number(),
    levelOfDetail: z.number()
  }).nullable(),
  perfectCriteria: z.array(z.string()),
  individualTests: z.array(z.object({
    testName: z.string(),
    rating: z.number(),
    status: z.enum(['PASS', 'FAIL']),
    criteria: z.object({
      helpfulness: z.number(),
      relevance: z.number(),
      accuracy: z.number(),
      depth: z.number(),
      levelOfDetail: z.number()
    }).nullable()
  }))
});

// schema for anomaly detection with validation
export const AnomalyDetectionSchema = z.object({
  hasAnomalies: z.boolean(),
  anomalies: z.array(z.object({
    type: z.enum(['statistical', 'criteria-inconsistency', 'temporal', 'outlier']),
    severity: z.enum(['low', 'medium', 'high']),
    title: z.string().max(100),
    description: z.string().max(300),
    evidence: z.array(z.string()).max(5),
    recommendation: z.string().max(200),
    affectedTests: z.array(z.string()).nullable()
  })),
  overallRisk: z.enum(['low', 'medium', 'high']),
  confidence: z.number().int().min(1).max(10),
  validationDetails: z.object({
    totalPotentialAnomalies: z.number(),
    validatedAnomalies: z.number(),
    rejectedAnomalies: z.number(),
    validationDecisions: z.array(z.object({
      potentialAnomaly: z.string().max(100),
      decision: z.enum(['VALIDATED', 'REJECTED']),
      reason: z.string().max(200),
      mathematicalCheck: z.string().max(150).nullable(),
      confidence: z.number().int().min(1).max(10)
    }))
  }).nullable()
});

// schema for summary report
export const SummaryReportSchema = z.object({
  overallAssessment: z.enum(['excellent', 'good', 'concerning', 'poor']),
  executiveSummary: z.string().max(500),
  keyFindings: z.array(z.string()).min(1).max(5),
  performanceHighlights: z.array(z.string()).max(3),
  areasOfConcern: z.array(z.string()).max(3),
  recommendations: z.array(z.string()).max(5),
  confidence: z.number().int().min(1).max(10)
});

// schema for final result
export const AnalysisResultSchema = z.object({
  anomalies: AnomalyDetectionSchema,
  summary: SummaryReportSchema,
  metadata: z.object({
    analysisDate: z.string(),
    csvPath: z.string(),
    processingTime: z.number()
  })
});

// types inferred
export type TestRunData = z.infer<typeof TestRunDataSchema>;
export type AnomalyDetection = z.infer<typeof AnomalyDetectionSchema>;
export type SummaryReport = z.infer<typeof SummaryReportSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// schema for handoff (following OpenAI documentation)
export const AnomalyHandoffDataSchema = z.object({
  reason: z.string(),
  anomaliesCount: z.number(),
  validationContext: z.string()
});

export type AnomalyHandoffData = z.infer<typeof AnomalyHandoffDataSchema>;

// options for agents
export interface AnalyticsOptions extends BaseAgentOptions {
  // specific options can be added here
}
