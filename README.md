# LLM-JUDGE

AI-based testing framework integrating agentic systems with automated non-deterministic validation for LLM features, built on modern test automation foundations.

## Overview
This project combines **agentic test automation** with **semantic validation** to enable scalable testing of AI-based features. The framework integrates intelligent agents that simulate human preferences with comprehensive validation layers, providing both deterministic API testing and non-deterministic AI behavior validation.

### Key Innovation
- **Agentic Test Generation**: AI agents create dynamic test scenarios, scaling from dozens to thousands of tests
- **Non-Deterministic Validation**: Semantic similarity and LLM judge evaluation for AI response quality
- **AI-Powered Analytics**: Multi-agent report generation with executive summaries and intelligent anomaly detection
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

### 📈 Enhanced Report Generation
AI-powered comprehensive reports with intelligent analytics and anomaly detection:
- **Multi-Format Output**: HTML (interactive), PNG (static), PDF (professional)
- **Executive Summaries**: Humanized AI-generated insights and assessments
- **Anomaly Detection**: Multi-agent validation system for mathematical and statistical inconsistencies
- **Performance Analytics**: Automated trend analysis and quality metrics visualization

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

![OpenAI Usage Dashboard](https://github.com/user-attachments/assets/fccc2a56-2ba2-46a7-ac0b-51dc62b15f85)

![OpenAI Usage Dashboard](https://github.com/user-attachments/assets/9b67360a-9457-44ea-9dbf-6b13c1238a8a)

**Features**:
- **Token Usage Tracking**: Detailed input/output token consumption
- **Model Performance**: Response times and success rates
- **Cost Analytics**: Spend tracking across different models
- **Request Patterns**: Usage trends and peak analysis

## Enhanced Report Generation System

### AI-Powered Analytics Reports

The framework includes a sophisticated report generation system that transforms raw test data into comprehensive, professional reports with AI-driven insights and anomaly detection.

#### Multi-Format Report Output
```bash
# Generate comprehensive reports
npm run reports

# Output formats:
# → HTML Report: Interactive charts and AI insights
# → PNG Report: High-resolution static visualization  
# → PDF Report: Professional document for stakeholders
```

#### AI Analytics Integration

**Executive Summary Generation**:
The system uses specialized AI agents to analyze test results and generate humanized executive summaries:

```typescript
// Generated executive summary example:
"The LLM test run achieved a perfect success rate of 100.0% with an 
impressive average rating of 9.50/10. Notably, 50.0% of the tests 
received a rating of 9.6, indicating strong consistency in performance."
```

**Performance Assessment Categories**:
- **Excellent** (9.0-10.0): Perfect system performance
- **Good** (7.0-8.9): Solid performance with minor issues
- **Concerning** (5.0-6.9): Performance issues requiring attention  
- **Poor** (<5.0): Critical issues requiring immediate action

#### Intelligent Anomaly Detection

**Multi-Agent Validation System**:
```
Detector Agent → Identifies potential anomalies in test data
       ↓
Handoff Process → Transfers context via OpenAI Agent SDK
       ↓  
Validator Agent → Confirms or rejects anomalies with explanations
       ↓
Final Report → Shows validated anomalies and validation process
```

**Anomaly Types Detected**:
- **Mathematical Inconsistencies**: Rating vs criteria average discrepancies (≥0.2 difference)
- **Statistical Outliers**: Unusual performance patterns or extreme deviations
- **Data Quality Issues**: Invalid entries, timestamp duplicates, out-of-range values
- **Temporal Anomalies**: Time-based inconsistencies and pattern breaks

**Validation Process**:
```typescript
// Example validation decision:
{
  "potentialAnomaly": "geography-question-test",
  "decision": "REJECTED", 
  "reason": "Perfect calculation, no error detected",
  "mathematicalCheck": "Expected Rating = (9 + 6 + 10 + 8 + 9) / 5 = 8.4; Actual Rating = 8.8; Difference = 0.4",
  "confidence": 8
}
```

#### Report Features

**Interactive Dashboard**:
- **Statistical Overview**: Success rates, average ratings, performance ranges
- **Visual Analytics**: Distribution charts, trend analysis, criteria breakdowns
- **Anomaly Insights**: Clickable anomaly button with detailed validation logs
- **AI Analysis Dropdown**: Expandable insights with key findings and recommendations

**LLM Judge Metrics Integration**:
- **Rating Distribution**: Visual breakdown of 1-10 rating scale results
- **Criteria Analysis**: Helpfulness, relevance, accuracy, depth, level of detail
- **Performance Trends**: Time-series analysis of test quality over time
- **Quality Metrics**: Pass/fail ratios and threshold analysis

**Report Generation Command**:
```bash
# Generate all formats from judge results
npm run reports

# Console output example:
📊 LLM Judge System - All Formats Report Generator
🚀 Loading data from: logSystem/logs/judge_results.csv
📈 Loaded 150 valid records | ❌ Found 2 errors
🤖 Running AI Analytics...
🔍 Analyzing anomalies...
🔄 Handoff to validator for validation...
✅ Analysis completed successfully
📄 Enhanced reports generated successfully!
```

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

### Generating Enhanced Reports
```bash
# Generate AI-powered comprehensive reports with anomaly detection
npm run reports

# Output files created:
# → judge-reports/reports/llm_judge_report.html  # Interactive dashboard
# → judge-reports/reports/llm_judge_report.png   # Static visualization
# → judge-reports/reports/llm_judge_report.pdf   # Professional document

# Reports include:
# ✓ AI-generated executive summaries
# ✓ Anomaly detection with validation logs  
# ✓ Statistical analysis and trend visualization
# ✓ LLM Judge metrics integration
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
- **AI-Generated Reports**: Executive summaries with humanized insights and assessments
- **Multi-Agent Analysis**: Intelligent anomaly detection with validation explanations
- **Multi-Format Output**: Interactive HTML, static PNG, and professional PDF reports
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
- **Chatbot Quality**: Validate conversational AI responses with automated reports
- **Content Generation**: Ensure AI-generated content meets standards with executive summaries
- **Recommendation Systems**: Test AI recommendation accuracy with anomaly detection

### Regression Testing
- **Model Updates**: Detect performance changes across model versions with trend analysis
- **Prompt Engineering**: Validate prompt modifications impact through comprehensive analytics
- **Semantic Drift**: Monitor meaning preservation over time with AI-powered insights

### Large-Scale Validation
- **Batch Processing**: Test thousands of scenarios automatically with intelligent report generation
- **Quality Assurance**: Comprehensive AI system validation with multi-agent anomaly detection
- **Performance Monitoring**: Track AI system health and metrics with professional dashboard reports

### Business Intelligence & Reporting
- **Executive Dashboards**: AI-generated summaries for stakeholder reporting
- **Quality Metrics**: Statistical analysis with visual charts and trends
- **Anomaly Monitoring**: Automated detection of system issues with validation explanations
- **Performance Insights**: Multi-format reports for different audiences (technical/business)

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

### Enhanced Reports Workflow
```bash
# Complete testing and reporting workflow

# 1. Run your LLM tests
npx playwright test

# 2. Generate AI-powered comprehensive reports
npm run reports

# Reports automatically generated include:
# → HTML Report: Interactive dashboard with anomaly detection
# → PNG Report: High-resolution static visualization
# → PDF Report: Professional document for stakeholders
# → CSV Data: Structured results in logSystem/logs/judge_results.csv

# 3. View results
# - Open HTML report in browser for interactive analysis
# - Share PDF reports with stakeholders
# - Use CSV data for custom analytics
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run AI Tests
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: npx playwright test
    
- name: Generate AI Reports
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: npm run reports
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: ai-test-results
    path: |
      playwright-report/
      judge-reports/reports/
      logSystem/logs/judge_results.csv
```

## Benefits

- **🎯 Quality Assurance**: Multi-layered validation ensures AI feature reliability
- **📊 AI-Powered Reports**: Automated executive summaries and anomaly detection with professional multi-format output
- **🤖 Intelligent Analysis**: Multi-agent validation system provides detailed insights and mathematical verification
- **📈 Data-Driven**: CSV export enables large-scale analysis and insights  
- **🔧 Developer-Friendly**: Seamless integration with modern testing workflows
- **💰 Cost-Effective**: Efficient token usage with detailed monitoring
- **🚀 Scalable**: From prototype to production-scale AI testing

## Contributing

1. **Setup Development Environment**
   ```bash
   git clone <repository>
   cd llm-agentic-system-playwright-llmjudge

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
