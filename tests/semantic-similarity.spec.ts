import { test, expect } from '../logSystem/fixtures';
import { SemanticAnalyzer } from '../semantic-analizer/semantic-analyzer';
import { HttpHandler } from '../http/httpHandler';

const historicalQuestions = [
  {
    prompt: 'What year did World War II begin?',
    expected: 'World War II began in 1939.',
    description: 'World War II start year'
  },
  {
    prompt: 'Who was the first man to walk on the moon?',
    expected: 'Neil Armstrong was the first man to walk on the moon.',
    description: 'First man on the moon'
  },
  {
    prompt: 'Which empire built the Colosseum?',
    expected: 'The Roman Empire built the Colosseum.',
    description: 'Colosseum builders'
  },
  {
    prompt: 'In what year did Brazil become independent?',
    expected: 'Brazil became independent in 1822.',
    description: 'Brazil independence year'
  },
  {
    prompt: 'Who was a leader of the French Revolution?',
    expected: 'Robespierre was one of the main leaders of the French Revolution.',
    description: 'French Revolution leader'
  },
  {
    prompt: 'On which continent did Egyptian civilization originate?',
    expected: 'Egyptian civilization originated in Africa.',
    description: 'Egyptian civilization origin'
  },
  {
    prompt: 'When did the Berlin Wall fall?',
    expected: 'The Berlin Wall fell in 1989.',
    description: 'Berlin Wall fall date'
  },
];

test.describe('Semantic Similarity Tests - Historical Questions', () => {
  historicalQuestions.forEach((testData, index) => {
    test(`Historical Question ${index + 1}: ${testData.description}`, async ({ request }) => {
      
      const httpHandler = new HttpHandler(request);
      const analyzer = new SemanticAnalyzer();
      
      const response = await httpHandler.openaiAPI.openAICompletion(testData.prompt);
      
      expect(response).toHaveProperty('choices');
      expect(response.choices[0]).toHaveProperty('message');
      expect(response.choices[0].message).toHaveProperty('content');

      const chatgptAnswer = response.choices[0].message.content;
      const similarity = await analyzer.semanticSimilarity(testData.expected, chatgptAnswer);
      
      expect(similarity).toBeGreaterThanOrEqual(0.8);
    });
  });
});

test.describe('On-Topic Validation Tests', () => {
  test('on-topic: prompt vs output (similarity >= 0.7)', async ({ request }) => {
    
    const prompt = 'What year did World War II begin?';

    const httpHandler = new HttpHandler(request);
    const analyzer = new SemanticAnalyzer();

    const response = await httpHandler.openaiAPI.openAICompletion(prompt);
    
    expect(response).toHaveProperty('choices');
    expect(response.choices[0]).toHaveProperty('message');
    expect(response.choices[0].message).toHaveProperty('content');

    const chatgptAnswer = response.choices[0].message.content;
    
    const similarity = await analyzer.semanticSimilarity(prompt, chatgptAnswer);
    expect(similarity).toBeGreaterThanOrEqual(0.7);
  });
});