import { z } from 'zod';
import { BaseAgentOptions } from '../base-agent';

// Schema of the judge result with Zod validation - Scale 1-10
export const JudgeResultSchema = z.object({
  explanation: z.string().max(500),
  rating: z.number().int().min(1).max(10),
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
}