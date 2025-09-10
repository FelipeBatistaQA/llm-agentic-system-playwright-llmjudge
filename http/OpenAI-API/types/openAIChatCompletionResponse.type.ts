export interface OpenAIChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
      index: number;
      message: {
        role: string;
        content: string;
      };
      finish_reason: string;
    }>;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
}

// Interface for conversation messages
export interface ConversationMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// Interface for conversation result (response + updated conversation)
export interface ConversationResult {
    response: OpenAIChatCompletionResponse;
    conversation: ConversationMessage[];
    lastMessage: string; // Last message for convenience
}