import { Agent, run } from '@openai/agents';
import { GeographySequenceSchema, HistoryEnthusiastOptions, HistoryEnthusiastResult, ChatGPTInteractionLog } from './types';
import prompts from './config/prompts.json';
import { createChatGPTTool, type ChatGPTToolOutput } from '../../tools/chatgpt-tool';
import { HttpHandler } from '../../../http/httpHandler';
import { BaseAgent } from '../base-agent';

export class HistoryEnthusiastAgent extends BaseAgent {
  private readonly agent: Agent<unknown, typeof GeographySequenceSchema> | null;
  private readonly httpHandler: HttpHandler | null;

  constructor(options: HistoryEnthusiastOptions = {}) {
    super(options);
    this.httpHandler = options.httpHandler || null;
    
    
      const chatGPTTool = createChatGPTTool(this.httpHandler as HttpHandler);
      
      this.agent = new Agent({
        name: 'HistoryEnthusiast',
        instructions: this.buildInstructions(prompts),
        model: this.model,
        tools: [chatGPTTool],
        outputType: GeographySequenceSchema,
        modelSettings: {
          temperature: 0.7,
          maxTokens: prompts.maxTokens || 800,
        },
      });
    
  }

  async generateQuestionSequence(theme?: string): Promise<HistoryEnthusiastResult> {
    const input = theme
      ? `Generate a 2-question geography sequence focused on the theme: "${theme}".`
      : `Generate a 2-question geography sequence. First, randomly choose an interesting and creative geographic theme, then create the questions.`;

    const result = await run(this.agent!, input + ' Use the chat_with_gpt tool to interact with ChatGPT and build progressive questions based on the responses.', {
      context: { openaiApiKey: process.env.OPENAI_API_KEY },
    });

    const sequence = result.finalOutput || null;
    const conversationLogs = this.extractConversationLogs(result);

    return {
      ok: sequence?.completed === true,
      sequence,
      conversationLogs,
      totalQuestions: sequence?.questions?.length || 0,
    };
  }

  private extractConversationLogs(result: any): ChatGPTInteractionLog[] {
    const generatedItems = result?.state?._generatedItems || [];

    if (generatedItems.length === 0) {
      console.log('[DEBUG] No generated items found in result.state._generatedItems');
      return [];
    }

    const toolOutputItems = generatedItems.filter((item: any) =>
      item.type === 'tool_call_output_item' &&
      item.rawItem?.name === 'chat_with_gpt'
    );

    if (toolOutputItems.length === 0) {
      return [];
    }

    const lastToolOutput = toolOutputItems[toolOutputItems.length - 1];

    try {
      let outputData: ChatGPTToolOutput;
      if (typeof lastToolOutput.output === 'string') {
        outputData = JSON.parse(lastToolOutput.output) as ChatGPTToolOutput;
      } else if (typeof lastToolOutput.output === 'object') {
        outputData = lastToolOutput.output as ChatGPTToolOutput;
      } else {
        outputData = { response: '', updatedConversation: [], success: false };
      }

      return [{
        fullConversation: outputData.updatedConversation || [],
        success: outputData.success !== false,
        error: outputData.error || undefined
      }];
    } catch (error) {
      console.log('[DEBUG] Error parsing tool output:', error);
      return [{
        fullConversation: [],
        success: false,
        error: 'Failed to parse final conversation'
      }];
    }
  }

}
