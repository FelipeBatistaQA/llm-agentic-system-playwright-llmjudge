import { expect } from "@playwright/test";
import { OpenAIChatCompletionResponse } from "./types/openAIChatCompletionResponse.type";

export class OpenAIAPIValidator {

    /**
     * Valida o contrato e tipos essenciais da resposta da OpenAI API
     */
    validateResponseContractForChatCompletion(data: OpenAIChatCompletionResponse): void {
        // Estrutura básica com validação de tipos
        expect.soft(data).toBeDefined();
        expect.soft(typeof data).toBe('object');
        expect.soft(data.object).toBe('chat.completion');
        expect.soft(typeof data.id).toBe('string');
        expect.soft(data.id).toBeTruthy();
        expect.soft(typeof data.model).toBe('string');
        expect.soft(data.model).toBeTruthy();
        expect.soft(typeof data.created).toBe('number');
        expect.soft(data.created).toBeGreaterThan(0);

        // Choices array com validação de tipos
        expect.soft(data.choices).toBeDefined();
        expect.soft(Array.isArray(data.choices)).toBe(true);
        expect.soft(data.choices).toHaveLength(1);
        
        const choice = data.choices[0];
        expect.soft(typeof choice).toBe('object');
        expect.soft(typeof choice.index).toBe('number');
        expect.soft(choice.index).toBe(0);
        expect.soft(typeof choice.message).toBe('object');
        expect.soft(typeof choice.message.role).toBe('string');
        expect.soft(choice.message.role).toBe('assistant');
        expect.soft(typeof choice.message.content).toBe('string');
        expect.soft(choice.message.content).toBeTruthy();
        expect.soft(typeof choice.finish_reason).toBe('string');
        expect.soft(choice.finish_reason).toBeTruthy();

        // Usage tokens com validação de tipos
        expect.soft(data.usage).toBeDefined();
        expect.soft(typeof data.usage).toBe('object');
        expect.soft(typeof data.usage.prompt_tokens).toBe('number');
        expect.soft(data.usage.prompt_tokens).toBeGreaterThan(0);
        expect.soft(typeof data.usage.completion_tokens).toBe('number');
        expect.soft(data.usage.completion_tokens).toBeGreaterThan(0);
        expect.soft(typeof data.usage.total_tokens).toBe('number');
        expect.soft(data.usage.total_tokens).toBeGreaterThan(0);
        
        // Validação aritmética dos tokens
        expect.soft(data.usage.total_tokens).toBe(
            data.usage.prompt_tokens + data.usage.completion_tokens
        );
    }
}
