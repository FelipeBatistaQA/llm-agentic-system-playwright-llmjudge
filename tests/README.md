# Tests

Comprehensive test suite for LLM evaluation framework covering direct HTTP API testing, agentic test automation, judge evaluation, and semantic similarity analysis.

## Test Architecture

```
tests/
├── conversation-api.spec.ts           # Direct HTTP API conversation testing
├── history-enthusiast-agent.spec.ts   # Agentic test automation & scaling
├── llmJudgeForSimpleRestRequest.spec.ts # Judge evaluation with expected results
└── semantic-similarity.spec.ts        # Semantic analysis validation
```

## Test Files Overview

### `conversation-api.spec.ts` - API Functional Testing
**Purpose**: Functional testing of the HTTP API implementation itself, validating API behavior, conversation management, and contract compliance rather than LLM response quality.

**Key Features**:
- **API functionality testing** of conversation endpoints
- **Contract validation** ensuring proper response structure
- **Conversation state management** across multi-turn interactions
- **Parameter handling** (temperature, maxTokens, roles)
- **Error handling** for invalid inputs and edge cases

**Test Cases**:
```typescript
// Backward compatibility validation
test('should maintain backward compatibility with openAICompletion', async ({ request }) => {
  const response = await http.openaiAPI.openAICompletion('What is the capital of Japan?');
  expect(response.choices[0].message.content.toLowerCase()).toContain('tokyo');
});

// Context preservation in conversations
test('should maintain context in multi-turn conversation', async ({ request }) => {
  let result = await http.openaiAPI.chatCompletion({
    role: 'user', content: 'What is the largest country in the world?'
  });
  
  const followUpConversation = [
    ...result.conversation,
    { role: 'user', content: 'How many time zones does this country have?' }
  ];
  
  result = await http.openaiAPI.chatCompletion(followUpConversation);
  expect(result.conversation).toHaveLength(4); // Full conversation maintained
});
```

**Validation Focus**:
- **API response structure** and data types
- **Conversation array management** and state preservation
- **Context handling** across multiple API calls
- **Parameter processing** (temperature, maxTokens, roles)
- **Input validation** and error response handling

---

### `history-enthusiast-agent.spec.ts` - Agentic Test Automation
**Purpose**: Demonstrates scaling LLM testing from dozens to thousands through agentic test automation, using an agent to simulate human preferences and interactions with validation via LLM judge.

**Key Features**:
- **Agentic test generation** creating dynamic test scenarios
- **Human preference simulation** through intelligent agent behavior  
- **Scale testing** enabling thousands of automated test cases
- **LLM Judge validation** for quality assessment
- **Progressive question sequences** building contextual interactions

**Test Implementation**:
```typescript
test('should generate a valid 2-question geography sequence', async ({ request }) => {
  const http = new HttpHandler(request);
  const agent = new HistoryEnthusiastAgent({ httpHandler: http });
  
  // Agent generates dynamic test scenario
  const result = await agent.generateQuestionSequence();
  
  expect(result.ok).toBe(true);
  expect(result.sequence?.questions).toHaveLength(2);
  expect(result.sequence?.completed).toBe(true);
  
  // Judge evaluates the generated conversation
  const conversationJudge = LlmJudgeFactory.forConversation();
  const judgeResult = await conversationJudge.judgeConversation(
    result.conversationLogs[0].fullConversation
  );
  
  expect(judgeResult.rating).toBeGreaterThanOrEqual(8); // High quality threshold
});
```

**Scaling Benefits**:
- **Automated test generation** reduces manual test creation
- **Dynamic scenarios** provide better coverage than static tests
- **Human-like interactions** simulate real user behavior
- **Quality validation** through LLM judge ensures test reliability
- **Thousands of tests** can be generated and executed automatically

---

### `llmJudgeForSimpleRestRequest.spec.ts` - Judge Evaluation with Expected Results
**Purpose**: Uses LLM Judge to evaluate questions that have predefined expected results, comparing both question-answer relevance and validating response contains expected content.

**Key Features**:
- **Predefined expected answers** for factual geography questions
- **Dual validation approach**: hardcoded assertions + judge evaluation
- **Quality scoring** with 1-10 rating scale
- **Contract validation** ensuring API response structure
- **Comprehensive test coverage** across multiple question types

**Test Structure**:
```typescript
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
  }
  // ... more test cases
];

geographyQuestions.forEach((testData, index) => {
  test(`Geography Question ${index + 1}: ${testData.description}`, async ({ request }) => {
    const response = await http.openaiAPI.openAICompletion(testData.question);
    const chatgptAnswer = response.choices[0]?.message?.content || '';
    
    // Hardcoded validation
    expect(chatgptAnswer.toLowerCase()).toContain(testData.expectedAnswer.toLowerCase());
    
    // Judge evaluation
    const judgeResult = await judge.judgeRelevance(testData.question, chatgptAnswer);
    expect(judgeResult.ok).toBe(true);
    expect(judgeResult.rating).toBeGreaterThanOrEqual(8);
  });
});
```

**Validation Layers**:
1. **API Contract**: Response structure validation
2. **Content Assertion**: Expected keyword presence
3. **Judge Evaluation**: Semantic quality assessment (8+ rating)
4. **Explanation Quality**: Judge provides reasoning for rating

---

### `semantic-similarity.spec.ts` - Semantic Analysis Validation  
**Purpose**: Performs semantic analysis comparing response against expected results and question-response relevance using transformer-based embeddings.

**Key Features**:
- **Semantic similarity measurement** using @xenova/transformers
- **Dual comparison approach**: expected vs actual, question vs response
- **Transformer-based analysis** with all-MiniLM-L6-v2 model
- **Threshold-based validation** for different similarity requirements
- **Historical question dataset** for comprehensive testing

**Test Implementation**:
```typescript
const historicalQuestions = [
  {
    prompt: 'What year did World War II begin?',
    expected: 'World War II began in 1939.',
    description: 'World War II start year'
  }
  // ... more historical questions
];

test.describe('Semantic Similarity Tests - Historical Questions', () => {
  historicalQuestions.forEach((testData, index) => {
    test(`Historical Question ${index + 1}: ${testData.description}`, async ({ request }) => {
      const response = await httpHandler.openaiAPI.openAICompletion(testData.prompt);
      const chatgptAnswer = response.choices[0].message.content;
      
      // Semantic similarity validation
      const similarity = await analyzer.semanticSimilarity(testData.expected, chatgptAnswer);
      expect(similarity).toBeGreaterThanOrEqual(0.8); // High semantic similarity
    });
  });
});

// On-topic validation
test('on-topic: prompt vs output (similarity >= 0.7)', async ({ request }) => {
  const prompt = 'What year did World War II begin?';
  const response = await httpHandler.openaiAPI.openAICompletion(prompt);
  
  const similarity = await analyzer.semanticSimilarity(prompt, chatgptAnswer);
  expect(similarity).toBeGreaterThanOrEqual(0.7); // Topic relevance threshold
});
```

**Similarity Thresholds**:
- **≥ 0.8**: High semantic similarity (expected vs actual)
- **≥ 0.7**: Topic relevance (question vs response)
- **Vector analysis**: 384-dimensional embeddings for meaning comparison
- **Cosine similarity**: Mathematical precision in semantic measurement

## Test Strategy Overview

### **API Functional Testing** (`conversation-api.spec.ts`)
- **Scope**: HTTP API implementation and conversation management
- **Validation**: Contract compliance, structure validation, parameter handling
- **Coverage**: API functionality, conversation state, error handling

### **Agentic Automation** (`history-enthusiast-agent.spec.ts`)  
- **Scope**: Scalable test generation and human simulation
- **Validation**: LLM Judge evaluation of generated interactions
- **Coverage**: Dynamic scenarios, contextual conversations

### **Judge Evaluation** (`llmJudgeForSimpleRestRequest.spec.ts`)
- **Scope**: Quality assessment with known expected results
- **Validation**: Content assertions + semantic quality scoring
- **Coverage**: Factual accuracy, response relevance

### **Semantic Analysis** (`semantic-similarity.spec.ts`)
- **Scope**: Deep semantic understanding and meaning preservation
- **Validation**: Transformer-based similarity measurement
- **Coverage**: Semantic drift detection, topic adherence

## Integration Benefits

### **Comprehensive Coverage**
- **API Layer**: Functional testing ensures HTTP API reliability and contract compliance
- **Agent Layer**: Agentic automation provides scalable test generation
- **Quality Layer**: Judge evaluation ensures response quality
- **Semantic Layer**: Deep analysis catches meaning drift

### **Scaling Capabilities**
- **Manual to Automated**: From hardcoded tests to agent-generated scenarios
- **Dozens to Thousands**: Agentic approach enables massive scale testing
- **Static to Dynamic**: Agents create varied, contextual test cases
- **Quality Assurance**: Multiple validation layers ensure reliability

### **Multi-Modal Validation**
- **Functional**: API behavior and contract compliance validation
- **Content**: Expected result matching and keyword validation  
- **Quality**: LLM Judge scoring with explanations
- **Semantic**: Deep meaning analysis with similarity thresholds

## Key Testing Principles

1. **Layered Validation**: Multiple validation approaches for comprehensive coverage
2. **Scale Through Automation**: Agentic test generation for massive scale
3. **Quality Focus**: Judge evaluation ensures high-quality responses
4. **Semantic Precision**: Deep analysis catches subtle meaning changes
5. **Real-World Simulation**: Human preference modeling through agents
