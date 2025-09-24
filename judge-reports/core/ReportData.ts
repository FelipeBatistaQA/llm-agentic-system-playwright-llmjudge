export interface HttpLogInfo {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  model?: string;
  payload?: string;
  response?: string;
  tokens?: { total: number; prompt: number; completion: number };
}

export interface LlmLogInfo {
  timestamp: string;
  model: string;
  prompt: string;
  response: string;
  tokens: { total: number; prompt: number; completion: number };
  finishReason: string;
}

export interface JudgeLogInfo {
  timestamp: string;
  rating: number;
  status: string;
  question: string;
  answer: string;
  explanation: string;
  criteria?: {
    helpfulness: number;
    relevance: number;
    accuracy: number;
    depth: number;
    levelOfDetail: number;
  };
}

export interface ConversationEntry {
  userMessage: string;
  assistantResponse: string;
  timestamp: string;
  tokens: { prompt: number; completion: number; total: number };
}

export interface StructuredLogs {
  http: HttpLogInfo[];
  llm: LlmLogInfo[];
  judge: JudgeLogInfo[];
}

export interface JudgeResult {
  timestamp: string;
  testName: string;
  rating: number;
  status: 'PASS' | 'FAIL';
  prompt: string;
  output: string;
  lineNumber?: number;
  explanation?: string;
  criteria?: {
    helpfulness: number;
    relevance: number;
    accuracy: number;
    depth: number;
    levelOfDetail: number;
  };
  logs?: StructuredLogs;
  conversationEntries?: ConversationEntry[];
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

export interface RatingGroup {
  rating: string;
  count: number;
  tests: JudgeResult[];
}

export interface AIAnalyticsData {
  anomalies: {
    hasAnomalies: boolean;
    anomalies: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      title: string;
      description: string;
      evidence: string[];
      recommendation: string;
      affectedTests: string[] | null;
    }>;
    overallRisk: 'low' | 'medium' | 'high';
    confidence: number;
  };
  summary: {
    overallAssessment: 'excellent' | 'good' | 'concerning' | 'poor';
    executiveSummary: string;
    keyFindings: string[];
    performanceHighlights: string[];
    areasOfConcern: string[];
    recommendations: string[];
    confidence: number;
  };
  metadata: {
    analysisDate: string;
    csvPath: string;
    processingTime: number;
  };
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
  ratingGroups?: RatingGroup[];
  testDetails?: JudgeResult[];
  // Nova seção AI Analytics
  aiAnalytics?: AIAnalyticsData;
}

export interface GeneratorOptions {
  csvPath: string;
  outputDir: string;
  width?: number;
  height?: number;
  formats?: string[];
}
