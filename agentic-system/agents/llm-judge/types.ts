import { z } from 'zod';
import { BaseAgentOptions } from '../base-agent';

// Schema of the judge result with Zod validation - Scale 1-10
export const JudgeResultSchema = z.object({
  explanation: z.string().max(500),
  rating: z.number().int().min(1).max(10),
  criteria: z.object({
    helpfulness: z.number().int().min(1).max(10),
    relevance: z.number().int().min(1).max(10),
    accuracy: z.number().int().min(1).max(10),
    depth: z.number().int().min(1).max(10),
    creativity: z.number().int().min(1).max(10),
    levelOfDetail: z.number().int().min(1).max(10),
  }),
  testedItem: z.object({
    question: z.string().nullable(),
    expectedResponse: z.string().nullable(),
    actualResponse: z.string().nullable(),
    description: z.string().nullable(),
    testType: z.string().nullable(),
  }).nullable(),
});

export type JudgeResult = z.infer<typeof JudgeResultSchema>;

export interface LlmJudgeOptions extends BaseAgentOptions {
  // Specific fields for the judge can be added here if necessary
}

export interface LlmJudgeResult {
  ok: boolean;
  rating: number;
  errorCode?: 'CLIENT_NOT_CONFIGURED' | 'INVALID_INPUT' | 'INVALID_RESPONSE' | 'API_ERROR';
  errorMessage?: string;
  reason?: string;
  explanation?: string;
  criteria: {
    helpfulness: number;
    relevance: number;
    accuracy: number;
    depth: number;
    creativity: number;
    levelOfDetail: number;
  };
  testedItem?: {
    question?: string;
    expectedResponse?: string;
    actualResponse?: string;
    description?: string;
    testType?: string;
  };
}