export interface JudgeResult {
  timestamp: string;
  testName: string;
  rating: number;
  status: 'PASS' | 'FAIL';
  prompt: string;
  output: string;
  lineNumber?: number;
  criteria?: {
    helpfulness: number;
    relevance: number;
    accuracy: number;
    depth: number;
    levelOfDetail: number;
  };
}

export interface ReportStats {
  totalTests: number;
  passCount: number;
  avgRating: number;
  successRate: string;
  maxRating: number;
  minRating: number;
}

export interface CriteriaAverages {
  helpfulness: string;
  relevance: string;
  accuracy: string;
  depth: string;
  levelOfDetail: string;
}

export interface CriteriaDistribution {
  name: string;
  min: number;
  max: number;
  avg: string;
}

export interface CriteriaTrend {
  testLabels: string[];
  testNames: string[];
  criteria: {
    helpfulness: number[];
    relevance: number[];
    accuracy: number[];
    depth: number[];
    levelOfDetail: number[];
  };
}

export interface ErrorStats {
  totalErrors: number;
  errorRate: string;
  errorTypes: string[];
  errorCounts: number[];
  errorExamples: string[];
  errorDetails: Array<{
    timestamp: string;
    testName: string;
    rating: number;
    status: string;
    prompt: string;
    fullMessage: string;
    shortMessage: string;
    lineNumber: string | number;
  }>;
}

export interface ProcessedData {
  stats: ReportStats;
  ratingCounts: number[];
  statusCounts: Record<string, number>;
  trendData: {
    testLabels: string[];
    testNames: string[];
    ratings: number[];
  };
  criteriaAverages: CriteriaAverages | null;
  criteriaDistribution: CriteriaDistribution[] | null;
  criteriaTrend: CriteriaTrend | null;
  errorStats: ErrorStats | null;
}

export interface GeneratorOptions {
  csvPath: string;
  outputDir: string;
  width?: number;
  height?: number;
  formats?: string[];
}
