import { test, expect } from '../logSystem/fixtures';
import { HistoryEnthusiastAgent } from '../agentic-system/agents/history-enthusiast';
import { LlmJudgeFactory } from '../agentic-system/agents/llm-judge/llm-judge-factory';
import { HttpHandler } from '../http/httpHandler';

test.describe('History Enthusiast Agent', () => {
  
  test('should generate a valid 2-question geography sequence', async ({ request }) => {

    const http = new HttpHandler(request);
    const agent = new HistoryEnthusiastAgent({ httpHandler: http });

    const result = await agent.generateQuestionSequence();

    expect(result.ok).toBe(true);
    expect(result.sequence).toBeTruthy();
    expect(result.sequence?.questions).toHaveLength(2);
    expect(result.sequence?.theme).toBeTruthy();
    expect(result.sequence?.completed).toBe(true);

    const conversationJudge = LlmJudgeFactory.forConversation();

    const conversation = result.conversationLogs[0].fullConversation;
    const judgeResult = await conversationJudge.judgeConversation(conversation);

    console.log(`Judge Rating: ${judgeResult.rating}/10`);
    console.log(`Judge Feedback: ${judgeResult.explanation}`);

    // Validate that the judge worked
    expect(judgeResult.ok).toBeDefined();
    expect(judgeResult.rating).toBeGreaterThanOrEqual(8); // 8+ is excellent
    expect(judgeResult.rating).toBeLessThanOrEqual(10);
    
    expect(judgeResult.explanation).toBeTruthy();

  });
});
