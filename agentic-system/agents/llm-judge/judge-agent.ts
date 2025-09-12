import { Agent, run } from '@openai/agents';
import OpenAI from 'openai';
import { JudgeResultSchema, LlmJudgeOptions, LlmJudgeResult, JudgeResult } from './types';
import { JudgeLogger } from '../../../logSystem/JudgeLogger';
import { BaseAgent, PromptConfig } from '../base-agent';

export class LlmJudge extends BaseAgent {
  
  private readonly agent: Agent<unknown, typeof JudgeResultSchema>;
  private readonly client: OpenAI;
  private readonly promptConfig: PromptConfig;

  constructor(promptConfig: PromptConfig, options: LlmJudgeOptions = {}) {
    super(options);
    this.promptConfig = promptConfig;
    this.client = new OpenAI({ apiKey: this.apiKey });
    this.agent = new Agent({
      name: 'LlmJudge',
      instructions: this.buildInstructions(promptConfig),
      model: this.model,
      outputType: JudgeResultSchema,
      modelSettings: {
        temperature: 0,
        maxTokens: promptConfig.maxTokens || 1200,
      },
    });
  }

  // Generic judge method that works with any input
  private async judge(input: string): Promise<LlmJudgeResult> {
    try {
      const result = await run(this.agent, input, {
        context: { openaiApiKey: this.client.apiKey },
      });

      const judgeResult = result.finalOutput as JudgeResult;

      // Calculate rating as rounded average of criteria scores
      const criteriaValues = [
        judgeResult.criteria.helpfulness,
        judgeResult.criteria.relevance,
        judgeResult.criteria.accuracy,
        judgeResult.criteria.depth,
        judgeResult.criteria.creativity,
        judgeResult.criteria.levelOfDetail,
      ];
      
      const calculatedRating = Math.round(
        criteriaValues.reduce((sum, value) => sum + value, 0) / criteriaValues.length
      );

      JudgeLogger.logEvaluation('CONVERSATION_JUDGE', `Judge analysis of conversation with ${input.split('\n').length} lines`, calculatedRating, judgeResult.explanation, judgeResult.criteria);

      return {
        ok: calculatedRating >= 8,
        rating: calculatedRating,
        reason: judgeResult.explanation,
        explanation: judgeResult.explanation,
        criteria: judgeResult.criteria,
      };
    } catch (error: any) {
      
      JudgeLogger.logJudgeError('JUDGE', input, error);
      throw error; 
    }
  }

  // Backward compatibility method for single messages
  async judgeRelevance(prompt: string, reply: string): Promise<LlmJudgeResult> {
    JudgeLogger.logJudgeRequest(prompt, reply);

    const input = [
      `Question: ${prompt}`,
      `Assistant's Answer: ${reply}`,
      'Please evaluate this response and return JSON with explanation and rating (1-10).'
    ].join('\n');

    const result = await this.judge(input);

    if (result.ok) {
      JudgeLogger.logEvaluation(prompt, reply, result.rating, result.explanation || '', result.criteria);
    }

    return result;
  }

  // Convenience method for conversations
  async judgeConversation(conversation: Array<{ role: string, content: string }>): Promise<LlmJudgeResult> {
    const conversationText = conversation
      .map(msg => `[${msg.role}]: ${msg.content}`)
      .join('\n');

    const input = `Analyze this conversation:\n${conversationText}\n\nPlease evaluate this conversation and return JSON with explanation and rating (1-10).`;

    return this.judge(input);
  }
}

export { LlmJudgeOptions };