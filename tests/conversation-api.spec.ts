import { test, expect } from '../logSystem/fixtures';
import { HttpHandler } from '../http/httpHandler';
import { ConversationResult } from '../http/OpenAI-API/types/openAIChatCompletionResponse.type';

test.describe('OpenAI Conversation API', () => {
  
  test('should maintain backward compatibility with openAICompletion', async ({ request }) => {
    const http = new HttpHandler(request);
    const response = await http.openaiAPI.openAICompletion('What is the capital of Japan?');
    
    expect(response.choices[0].message.content.toLowerCase()).toContain('tokyo');
    expect(response.model).toBeTruthy();
    expect(response.usage.total_tokens).toBeGreaterThan(0);
  });

  test('should return updated conversation with chatCompletion', async ({ request }) => {
    const http = new HttpHandler(request);
    const result: ConversationResult = await http.openaiAPI.chatCompletion({
      role: 'user',
      content: 'What is the capital of France?'
    });
    
    expect(result.response.choices[0].message.content.toLowerCase()).toContain('paris');
    expect(result.lastMessage.toLowerCase()).toContain('paris');
    
    expect(result.conversation).toHaveLength(2); // user + assistant
    expect(result.conversation[0].role).toBe('user');
    expect(result.conversation[0].content).toBe('What is the capital of France?');
    expect(result.conversation[1].role).toBe('assistant');
    expect(result.conversation[1].content).toBe(result.lastMessage);
  });

  test('should maintain context in multi-turn conversation', async ({ request }) => {
    // First question
    const http = new HttpHandler(request);
    let result = await http.openaiAPI.chatCompletion({
      role: 'user',
      content: 'What is the largest country in the world?'
    });
    
    expect(result.lastMessage.toLowerCase()).toContain('russ');
    expect(result.conversation).toHaveLength(2);
    
    // Second question using previous conversation
    const followUpConversation = [
      ...result.conversation,
      { role: 'user' as const, content: 'How many time zones does this country have?' }
    ];
    
    result = await http.openaiAPI.chatCompletion(followUpConversation);
    
    expect(result.lastMessage.toLowerCase()).toMatch(/(time|zone|hour)/i);
    expect(result.conversation).toHaveLength(4); // 2 previous + new question + new response
    
    expect(result.conversation[2].role).toBe('user');
    expect(result.conversation[2].content).toBe('How many time zones does this country have?');
    expect(result.conversation[3].role).toBe('assistant');
  });

  test('should work with manual conversation building', async ({ request }) => {
    const http = new HttpHandler(request);
    const conversation = [
      { role: 'system' as const, content: 'You are a geography expert. Be concise.' },
      { role: 'user' as const, content: 'Tell me 3 characteristics of Brazil' }
    ];
    
    const result = await http.openaiAPI.chatCompletion(conversation, {
      temperature: 0.7,
      maxTokens: 200
    });
    
    expect(result.conversation).toHaveLength(3); // system + user + assistant
    expect(result.conversation[0].role).toBe('system');
    expect(result.conversation[1].role).toBe('user');
    expect(result.conversation[2].role).toBe('assistant');
    
    expect(result.lastMessage.toLowerCase()).toContain('brazil');
  });

  test('should validate messages correctly', async ({ request }) => {
    const http = new HttpHandler(request);
    // Test invalid role
    await expect(
      http.openaiAPI.chatCompletion({
        role: 'invalid' as any,
        content: 'test'
      })
    ).rejects.toThrow('Invalid role');
    
    // Test empty content
    await expect(
      http.openaiAPI.chatCompletion({
        role: 'user',
        content: ''
      })
    ).rejects.toThrow('Message content cannot be empty');
    
    // Test empty array
    await expect(
      http.openaiAPI.chatCompletion([])
    ).rejects.toThrow('At least one message must be provided');
  });

  test('should work with system messages', async ({ request }) => {
    const http = new HttpHandler(request);
    const conversation = [
      { role: 'system' as const, content: 'You are a specialized assistant' },
      { role: 'user' as const, content: 'What is geography?' }
    ];
    
    const result = await http.openaiAPI.chatCompletion(conversation);
    
    expect(result.conversation).toHaveLength(3); // system + user + assistant
    expect(result.conversation[0].role).toBe('system');
    expect(result.conversation[0].content).toBe('You are a specialized assistant');
    expect(result.lastMessage.toLowerCase()).toMatch(/(geography|study|earth)/i);
  });
});
