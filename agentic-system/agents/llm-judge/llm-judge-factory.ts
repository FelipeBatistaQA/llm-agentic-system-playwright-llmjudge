import { LlmJudge, LlmJudgeOptions } from './judge-agent';
import singlePrompts from './config/prompts.json';
import conversationPrompts from './config/conversation-prompts.json';

export class LlmJudgeFactory {
  /**
   * Create judge for single message evaluation
   */
  static forSingleMessage(options?: LlmJudgeOptions): LlmJudge {
    return new LlmJudge(singlePrompts, options);
  }
  
  /**
   * Create judge for conversation evaluation
   */
  static forConversation(options?: LlmJudgeOptions): LlmJudge {
    return new LlmJudge(conversationPrompts, options);
  }
}