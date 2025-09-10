import { APIRequestContext } from "@playwright/test";
import { HttpSupport } from "../HttpSupport";
import { OpenAIChatCompletionResponse, ConversationMessage, ConversationResult } from "./types/openAIChatCompletionResponse.type";
import { OpenAIAPIValidator } from "./openAIAPIValidator";
import { HttpLogger } from "../../logSystem/HttpLogger";
import { LlmLogger } from "../../logSystem/LlmLogger";

export class OpenAIAPI {
    private readonly request: APIRequestContext
    private readonly endpoint: string = 'https://api.openai.com/v1/chat/completions';
    readonly validator: OpenAIAPIValidator

    constructor(request: APIRequestContext) {
        this.request = request;
        this.validator = new OpenAIAPIValidator();  
    }

    /**
     * Main method for chat completion with conversation support, using openAI Rest API as a Sample Implementation
     * Returns both response and updated conversation
     */
    async chatCompletion(
        messages: ConversationMessage | ConversationMessage[],
        options: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            expectedStatusCode?: number;
        } = {}
    ): Promise<ConversationResult> {
        
        const messagesArray = Array.isArray(messages) ? messages : [messages];
        
        if (messagesArray.length === 0) {
            throw new Error('At least one message must be provided');
        }

        this.validateMessages(messagesArray);

        const {
            model = 'gpt-4o-mini',
            temperature = 1.0,
            maxTokens,
            expectedStatusCode = 200
        } = options;

        const payload: any = {
            model,
            messages: messagesArray,
            temperature
        };

        if (maxTokens) {
            payload.max_tokens = maxTokens;
        }

        const response = await this.request.post(this.endpoint, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            data: payload
        });

        await HttpLogger.logRequest('POST', this.endpoint, payload, response);
        
        await HttpSupport.checkStatusCode(response, expectedStatusCode);
        const responseData = await response.json();
        
        const conversationContext = this.formatConversationForLog(messagesArray);
        LlmLogger.logInteraction(conversationContext, responseData);

        const assistantMessage = responseData.choices[0]?.message?.content || '';
        const updatedConversation: ConversationMessage[] = [
            ...messagesArray,
            {
                role: 'assistant',
                content: assistantMessage
            }
        ];

        return {
            response: responseData,
            conversation: updatedConversation,
            lastMessage: assistantMessage
        };
    }

    /**
     * Backward compatibility method
     */
    async openAICompletion(prompt: string, expectedStatusCode: number = 200): Promise<OpenAIChatCompletionResponse> {
        const result = await this.chatCompletion(
            { role: 'user', content: prompt },
            { expectedStatusCode }
        );
        
        return result.response;
    }

    // Message validation
    private validateMessages(messages: ConversationMessage[]): void {
        for (const message of messages) {
            if (!message.role || !['system', 'user', 'assistant'].includes(message.role)) {
                throw new Error(`Invalid role: ${message.role}. Must be 'system', 'user' or 'assistant'`);
            }
            if (!message.content || message.content.trim() === '') {
                throw new Error('Message content cannot be empty');
            }
        }
    }

    private formatConversationForLog(messages: ConversationMessage[]): string {
        if (messages.length === 1) {
            return messages[0].content;
        }
        
        const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0];
        return `[Conversation ${messages.length} msgs] Last: ${lastUserMsg?.content || 'N/A'}`;
    }
}