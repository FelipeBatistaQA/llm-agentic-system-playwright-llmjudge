import { z } from 'zod';
import { BaseAgentOptions } from '../base-agent';
import { HttpHandler } from '../../../http/httpHandler';
import { ConversationMessage } from '../../../http/OpenAI-API/types/openAIChatCompletionResponse.type';

// Schema for individual geography questions
export const GeographyQuestionSchema = z.object({
  question: z.string().describe('The geography question to ask'),
  rationale: z.string().describe('Why this question follows from the previous response')
});

// Schema for the complete geography sequence
export const GeographySequenceSchema = z.object({
  theme: z.string().describe('The geographic theme connecting all questions'),
  questions: z.array(GeographyQuestionSchema).length(2).describe('Exactly 2 progressive questions'),
  completed: z.boolean().describe('Whether the full sequence was completed successfully')
});

export type GeographyQuestion = z.infer<typeof GeographyQuestionSchema>;
export type GeographySequence = z.infer<typeof GeographySequenceSchema>;

// Configuration options for the History Enthusiast Agent
export interface HistoryEnthusiastOptions extends BaseAgentOptions {
  httpHandler?: HttpHandler;
}

// Log of individual ChatGPT interactions
export interface ChatGPTInteractionLog {
  fullConversation: ConversationMessage[];
  success: boolean;
  error?: string;
}

// Result of the complete history enthusiast sequence generation
export interface HistoryEnthusiastResult {
  ok: boolean;
  sequence: GeographySequence | null;
  conversationLogs: ChatGPTInteractionLog[];
  totalQuestions?: number;
  errorCode?: 'CLIENT_NOT_CONFIGURED' | 'INVALID_INPUT' | 'API_ERROR';
  errorMessage?: string;
}
