import { tool } from '@openai/agents';
import { z } from 'zod';
import { HttpHandler } from '../../http/httpHandler';
import { ConversationMessage } from '../../http/OpenAI-API/types/openAIChatCompletionResponse.type';

export const ChatGPTToolInputSchema = z.object({
  message: z.string().describe('Message to send to ChatGPT'),
  conversation: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })).describe('Previous conversation context (empty array for new conversation)')
})

export const ChatGPTToolOutputSchema = z.object({
  response: z.string(),
  updatedConversation: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  success: z.boolean(),
  error: z.string().optional(),
  messageCount: z.number().optional()
});

export type ChatGPTToolInput = z.infer<typeof ChatGPTToolInputSchema>;
export type ChatGPTToolOutput = z.infer<typeof ChatGPTToolOutputSchema>;

export const createChatGPTTool = <Context = unknown>(httpHandler: HttpHandler) =>

  tool<typeof ChatGPTToolInputSchema, Context, ChatGPTToolOutput>({
    name: 'chat_with_gpt',
    description: 'Send a message to ChatGPT and receive a response with full conversation context',
    parameters: ChatGPTToolInputSchema,
    execute: async ({ message, conversation }: ChatGPTToolInput): Promise<ChatGPTToolOutput> => {
      try {
        const messages: ConversationMessage[] = [
          ...conversation,
          { role: 'user', content: message }
        ];

        const result = await httpHandler.openaiAPI.chatCompletion(messages, {
          maxTokens: 800,
          temperature: 0.3
        });

        return {
          response: result.lastMessage,
          updatedConversation: result.conversation,
          success: true,
          messageCount: result.conversation.length
        };
      } catch (error: any) {
        return {
          response: '',
          updatedConversation: conversation,
          success: false,
          error: error.message || 'Failed to communicate with ChatGPT',
          messageCount: conversation.length
        };
      }
    }
  });
