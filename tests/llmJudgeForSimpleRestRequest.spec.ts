import { test, expect } from '../logSystem/fixtures';
import { LlmJudgeFactory } from '../agentic-system/agents/llm-judge/llm-judge-factory';
import { HttpHandler } from '../http/httpHandler';

const geographyQuestions = [
  {
    question: 'What is the capital of Japan?',
    expectedAnswer: 'tokyo',
    description: 'Capital of Japan'
  },
  {
    question: 'What is the largest country in the world by area?',
    expectedAnswer: 'russia',
    description: 'Largest country by area'
  },
  {
    question: 'Which river is the longest in the world?',
    expectedAnswer: 'nile',
    description: 'Longest river'
  },
  {
    question: 'What is the capital of Australia?',
    expectedAnswer: 'canberra',
    description: 'Capital of Australia'
  },
  {
    question: 'Which mountain range contains Mount Everest?',
    expectedAnswer: 'himalaya',
    description: 'Mount Everest location'
  },
  {
    question: 'What is the smallest country in the world?',
    expectedAnswer: 'vatican',
    description: 'Smallest country'
  },
  {
    question: 'Which ocean is the largest?',
    expectedAnswer: 'pacific',
    description: 'Largest ocean'
  },
  {
    question: 'What is the capital of Brazil?',
    expectedAnswer: 'brasília',
    description: 'Capital of Brazil'
  },
  {
    question: 'Which desert is the largest in the world?',
    expectedAnswer: 'antarctic',
    description: 'Largest desert'
  },
  {
    question: 'What is the deepest lake in the world?',
    expectedAnswer: 'baikal',
    description: 'Deepest lake'
  }
];

test.describe('Geography Questions via OpenAI REST API', () => {
  
  geographyQuestions.forEach((testData, index) => {
    test(`Geography Question ${index + 1}: ${testData.description}`, async ({ request }) => {
      
      const http = new HttpHandler(request);
      const judge = LlmJudgeFactory.forSingleMessage();
      
      const data = await http.openaiAPI.openAICompletion(testData.question);
      http.openaiAPI.validator.validateResponseContractForChatCompletion(data);

      const chatgptAnswer = data.choices[0]?.message?.content || '';

      const judgeResult = await judge.judgeRelevance(testData.question, chatgptAnswer);

      expect.soft(chatgptAnswer).toBeTruthy();
      expect.soft(chatgptAnswer.toLowerCase()).toContain(testData.expectedAnswer.toLowerCase());
      
      expect.soft(judgeResult.ok).toBe(true);
      expect.soft(judgeResult.rating).toBeGreaterThanOrEqual(8); // 8+ is excellent
      expect.soft(judgeResult.rating).toBeLessThanOrEqual(10);
      expect.soft(judgeResult.explanation).toBeTruthy(); 
      expect.soft(judgeResult.reason).toBeTruthy(); 
    });
  });
});