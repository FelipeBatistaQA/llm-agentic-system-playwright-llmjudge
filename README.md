# LLM-JUDGE

AI-based testing framework integrating agentic systems with automated non-deterministic validation for LLM features, built on modern test automation foundations.

## Overview
This project combines **agentic test automation** with **semantic validation** to enable scalable testing of AI-based features. The framework integrates intelligent agents that simulate human preferences with comprehensive validation layers, providing both deterministic API testing and non-deterministic AI behavior validation.

### Key Innovation
- **Agentic Test Generation**: AI agents create dynamic test scenarios, scaling from dozens to thousands of tests
- **Non-Deterministic Validation**: Semantic similarity and LLM judge evaluation for AI response quality
- **Modern Integration**: Built on Playwright with comprehensive logging and OpenAI dashboard integration

## Architecture

```
LLM-JUDGE/
├── agentic-system/           # AI agents for test generation and evaluation
├── http/                     # REST API testing infrastructure  
├── logSystem/               # Comprehensive logging with Playwright integration
├── semantic-analizer/       # Transformer-based semantic validation
├── tests/                   # Multi-layered test suites
└── README.md               # This file
```

## Core Components

### 🤖 [Agentic System](./agentic-system/README.md)
AI agents built on @openai/agents SDK for intelligent test automation:
- **LLM Judge**: Evaluates response quality with 1-10 scoring and explanations
- **History Enthusiast**: Simulates human interactions, generates progressive question sequences
- **Base Agent**: Inheritance-based architecture with JSON prompt configuration

### 🌐 [HTTP Module](./http/README.md)
POM-inspired REST API testing infrastructure:
- **HttpHandler**: Centralized API management with Playwright integration
- **OpenAI API**: Complete conversation management with context preservation
- **Contract Validation**: Comprehensive response structure and type validation

### 📊 [Log System](./logSystem/README.md)
Multi-layered observability with segregated log attachments:
- **HTTP Logs**: Request/response tracking with payloads
- **LLM Logs**: Interaction tracking with token usage and model info
- **Judge Logs**: Evaluation results with ratings and explanations
- **CSV Export**: Structured data for large-scale analysis

### 🧠 [Semantic Analyzer](./semantic-analizer/README.md)
Transformer-based semantic validation using @xenova/transformers:
- **Sentence Embeddings**: 384-dimensional vectors with all-MiniLM-L6-v2
- **Cosine Similarity**: Mathematical precision in meaning comparison
- **Threshold Validation**: Configurable similarity requirements (0.6-0.9)

### 🧪 [Test Suites](./tests/README.md)
Multi-modal validation across four distinct approaches:
- **API Functional**: HTTP API behavior and contract compliance
- **Agentic Automation**: Scalable test generation with human simulation
- **Judge Evaluation**: Quality assessment with expected results
- **Semantic Analysis**: Deep meaning preservation validation

## Integration with Modern Test Automation

### Playwright Foundation
Built on Playwright's robust testing infrastructure:
- **Native APIRequestContext**: Seamless HTTP testing integration
- **Automatic Log Attachments**: Segregated logs per test in reports
- **Fixtures System**: Auto-configuration and cleanup
- **Parallel Execution**: Scalable test execution

![Segregated Log Attachments](https://github.com/user-attachments/assets/f3c911e5-b3ca-4719-bf6a-0af7105c6d9b)

### OpenAI Dashboard Integration
Comprehensive usage monitoring and analytics:

![OpenAI Usage Dashboard](https://github.com/user-attachments/assets/f1e2d3c4-b5a6-7c8d-9e0f-1a2b3c4d5e6f)

**Features**:
- **Token Usage Tracking**: Detailed input/output token consumption
- **Model Performance**: Response times and success rates
- **Cost Analytics**: Spend tracking across different models
- **Request Patterns**: Usage trends and peak analysis

## Non-Deterministic Testing Approach

### Traditional vs AI-Based Testing
```
Traditional Testing          →    AI-Based Testing
├── Deterministic            →    ├── Non-Deterministic
├── Fixed Assertions         →    ├── Semantic Validation
├── Static Test Cases        →    ├── Dynamic Generation
└── Keyword Matching         →    └── Meaning Preservation
```

### Validation Layers
1. **API Contract**: Structure and type validation
2. **Content Quality**: LLM Judge evaluation (1-10 scale)
3. **Semantic Similarity**: Transformer-based meaning analysis
4. **Topic Adherence**: Context relevance validation

## Quick Start

### Prerequisites
```bash
# Node.js 18+ required
node --version

# Install dependencies
npm install
```

### Environment Setup
```bash
# Create .env file in project root
cp .env.example .env

# Edit .env file with your configuration:
# OPENAI_API_KEY=your-openai-api-key
# OPENAI_MODEL=gpt-4o-mini (optional)
```

### Running Tests
```bash
# Run all test suites
npx playwright test

# Run specific test categories
npx playwright test tests/conversation-api.spec.ts      # API functional tests
npx playwright test tests/history-enthusiast-agent.spec.ts  # Agentic automation
npx playwright test tests/llmJudgeForSimpleRestRequest.spec.ts  # Judge evaluation
npx playwright test tests/semantic-similarity.spec.ts   # Semantic validation

# Generate HTML report with segregated logs
npx playwright show-report
```

### Project Structure
```typescript
// Basic usage example
import { test, expect } from './logSystem/fixtures';
import { HttpHandler } from './http/httpHandler';
import { LlmJudgeFactory } from './agentic-system';
import { SemanticAnalyzer } from './semantic-analizer';

test('AI feature validation', async ({ request }) => {
  // Automatic logging configuration
  const httpHandler = new HttpHandler(request);
  const judge = LlmJudgeFactory.forSingleMessage();
  const analyzer = new SemanticAnalyzer();
  
  // API interaction with automatic logging
  const response = await httpHandler.openaiAPI.chatCompletion(messages);
  
  // Multi-layer validation
  const judgeResult = await judge.judgeRelevance(question, response.lastMessage);
  const similarity = await analyzer.semanticSimilarity(expected, actual);
  
  // Non-deterministic assertions
  expect(judgeResult.rating).toBeGreaterThanOrEqual(8);
  expect(similarity).toBeGreaterThanOrEqual(0.8);
});
```

## Key Features

### 🚀 Scalable Test Generation
- **Agent-Driven**: AI creates thousands of dynamic test scenarios
- **Human Simulation**: Realistic interaction patterns and preferences
- **Progressive Conversations**: Context-aware multi-turn interactions

### 📈 Comprehensive Analytics
- **CSV Export**: Large-scale evaluation data for trend analysis
- **OpenAI Integration**: Real-time usage and cost monitoring
- **Performance Metrics**: Token usage, response times, success rates

### 🔍 Deep Validation
- **Semantic Understanding**: Beyond keyword matching to meaning preservation
- **Quality Scoring**: Detailed explanations for evaluation decisions
- **Multiple Thresholds**: Configurable validation requirements

### 🛠️ Developer Experience
- **Modern Tooling**: TypeScript, Playwright, comprehensive logging
- **Easy Integration**: Drop-in compatibility with existing test suites
- **Rich Debugging**: Detailed logs, traces, and visual reports

## Use Cases

### AI Feature Testing
- **Chatbot Quality**: Validate conversational AI responses
- **Content Generation**: Ensure AI-generated content meets standards
- **Recommendation Systems**: Test AI recommendation accuracy

### Regression Testing
- **Model Updates**: Detect performance changes across model versions
- **Prompt Engineering**: Validate prompt modifications impact
- **Semantic Drift**: Monitor meaning preservation over time

### Large-Scale Validation
- **Batch Processing**: Test thousands of scenarios automatically
- **Quality Assurance**: Comprehensive AI system validation
- **Performance Monitoring**: Track AI system health and metrics

## Integration Examples

### Existing Test Suites
```typescript
// Extend existing Playwright tests
test.describe('AI-Enhanced Features', () => {
  test('chatbot responds accurately', async ({ request }) => {
    const httpHandler = new HttpHandler(request);
    const judge = LlmJudgeFactory.forSingleMessage();
    
    // Your existing test logic
    const userMessage = "What is the capital of France?";
    const response = await httpHandler.openaiAPI.chatCompletion({
      role: 'user', content: userMessage
    });
    
    // Add AI validation
    const evaluation = await judge.judgeRelevance(userMessage, response.lastMessage);
    expect(evaluation.ok).toBe(true);
  });
});
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run AI Tests
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: npx playwright test
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: ai-test-results
    path: |
      playwright-report/
      logSystem/logs/judge_results.csv
```

## Benefits

- **🎯 Quality Assurance**: Multi-layered validation ensures AI feature reliability
- **📊 Data-Driven**: CSV export enables large-scale analysis and insights  
- **🔧 Developer-Friendly**: Seamless integration with modern testing workflows
- **💰 Cost-Effective**: Efficient token usage with detailed monitoring
- **🚀 Scalable**: From prototype to production-scale AI testing

## Contributing

1. **Setup Development Environment**
   ```bash
   git clone <repository>
   cd LLM-JUDGE
   npm install
   cp .env.example .env  # Configure OPENAI_API_KEY in .env file
   ```

2. **Run Development Tests**
   ```bash
   npm test
   npx playwright test --ui  # Interactive mode
   ```

3. **Module Documentation**
   - Each module has detailed README files
   - Follow existing patterns for new features
   - Ensure comprehensive logging integration

## License

MIT License - See LICENSE file for details.

---

**LLM-JUDGE** - Where AI meets rigorous testing standards. Built for the future of AI-powered applications.
