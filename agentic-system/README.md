# Agentic System

A modular agent management system built on the @openai/agents SDK for LLM testing and evaluation.

## Overview

This system provides a structured approach to creating and managing AI agents with shared tools and consistent interfaces. It features inheritance-based architecture with a base agent class and specialized agent implementations for LLM evaluation, human interaction simulation, and comprehensive test analytics with intelligent anomaly detection.

## Architecture

```
agentic-system/
├── agents/                    # Agent implementations
│   ├── base-agent.ts         # Base class for all agents
│   ├── llm-judge/            # LLM evaluation agent
│   │   ├── judge-agent.ts    # Main judge implementation
│   │   ├── llm-judge-factory.ts # Factory for different judge types
│   │   ├── types.ts          # Type definitions
│   │   └── config/
│   │       ├── prompts.json  # Single message evaluation prompts
│   │       └── conversation-prompts.json # Conversation evaluation prompts
│   ├── history-enthusiast/   # Human interaction simulation agent
│   │   ├── history-agent.ts  # Main enthusiast implementation
│   │   ├── types.ts          # Type definitions
│   │   └── config/
│   │       └── prompts.json  # Question generation prompts
│   └── ai-analitycs-report/  # AI analytics and anomaly detection
│       ├── anomaly-detector-agent.ts # Multi-agent anomaly detection
│       ├── csv-data-processor.ts # Test data processing
│       ├── sumarry-reporter-agent.ts # Executive summary generation
│       ├── types.ts          # Type definitions and schemas
│       └── config/
│           ├── anomaly-detector-prompts.json # Anomaly detection rules
│           ├── anomaly-validator-prompts.json # Validation criteria
│           └── summary-reporter-prompts.json # Summary generation
├── tools/                    # Shared tools for agents
│   └── chatgpt-tool.ts      # ChatGPT REST API interface
└── index.ts                 # Main exports
```

## Core Components

### Base Agent
**Purpose**: Foundation class providing common functionality for all agents

**Features**:
- OpenAI API integration and configuration
- Prompt configuration management from JSON files
- Model and token settings
- Instruction building utilities
- Consistent initialization patterns

```typescript
export abstract class BaseAgent {
  protected buildInstructions(prompts: PromptConfig): string;
  isEnabled(): boolean;
  getModel(): string;
}
```

## Agents

### LLM Judge Agent

**Purpose**: Evaluates and rates LLM responses for quality, relevance, and accuracy using a 1-10 scale.

**Key Features**:
- Single message evaluation (question-answer pairs)
- Full conversation analysis
- Structured JSON output with explanations
- Factory pattern for different evaluation modes
- Integrated logging and error handling

**Rating System**:
- **9-10**: Excellent - Accurate, relevant, clear, highly useful
- **7-8**: Good - Generally accurate with minor issues
- **5-6**: Satisfactory - Correct but lacks clarity/completeness
- **3-4**: Below Average - Accuracy issues or partially relevant
- **1-2**: Poor - Significant problems with accuracy/relevance

**Usage**:
```typescript
import { LlmJudgeFactory } from './agentic-system';

// For single message evaluation
const singleJudge = LlmJudgeFactory.forSingleMessage();
const result = await singleJudge.judgeRelevance(question, answer);
// Returns: { ok: boolean, rating: number, explanation: string }

// For conversation evaluation  
const conversationJudge = LlmJudgeFactory.forConversation();
const result = await conversationJudge.judgeConversation(messages);
```

**Configuration**:
- Temperature: 0 (deterministic evaluation)
- Max Tokens: 1200 (configurable)
- Output validation via Zod schema
- JSON-based prompt configuration with examples

### History Enthusiast Agent

**Purpose**: Simulates human interactions with LLMs through progressive geography question sequences to test LLM behavior at scale.

**Key Features**:
- Progressive 2-question sequences that build on each other
- Random geographic theme selection
- Dynamic question building using ChatGPT responses
- Full conversation context tracking
- Educational and engaging content generation

**Question Themes**:
- Political Geography (countries, territories, borders)
- Physical Geography (mountains, rivers, climate zones)
- Ecosystems (deserts, forests, marine environments)
- Geological Features (volcanoes, tectonic activity)
- Human Geography (cities, populations, cultures)

**Usage**:
```typescript
import { HistoryEnthusiastAgent } from './agentic-system';

const enthusiast = new HistoryEnthusiastAgent({
  httpHandler: myHttpHandler,
  model: 'gpt-4o-mini'
});

// Generate random theme sequence
const result = await enthusiast.generateQuestionSequence();

// Generate specific theme sequence
const result = await enthusiast.generateQuestionSequence('Arctic Geography');
// Returns: { ok: boolean, sequence: GeographySequence, conversationLogs: [] }
```

**Output Structure**:
```typescript
{
  theme: "Arctic Geography",
  questions: [
    {
      question: "Which countries have territory in the Arctic Circle?",
      rationale: "Starting with political geography of the Arctic region"
    },
    {
      question: "What is permafrost and how does it affect these Arctic territories?",
      rationale: "Building on Arctic countries to explore geological features"
    }
  ],
  completed: true
}
```

**Configuration**:
- Temperature: 0.7 (creative but controlled)
- Max Tokens: 800 (optimized for question generation)
- Requires HttpHandler for ChatGPT tool access
- Structured output validation with Zod schemas

### AI Analytics Report Agent

**Purpose**: Comprehensive analysis of LLM test run results with intelligent anomaly detection through multi-agent validation system.

**Key Features**:
- Automated CSV test data processing and statistical analysis
- Multi-agent anomaly detection with handoff architecture
- Mathematical validation of rating calculations
- Statistical outlier and data quality analysis
- Executive summary generation with AI insights
- Validation decision logging with detailed explanations

**Anomaly Detection Types**:
- **Mathematical Inconsistencies**: Rating vs criteria average discrepancies
- **Statistical Outliers**: Unusual performance patterns or distributions
- **Data Quality Issues**: Invalid entries, timestamp duplicates, range violations
- **Temporal Anomalies**: Time-based pattern inconsistencies

**Multi-Agent Architecture**:
```typescript
// Detector Agent → identifies potential anomalies
// Handoff via OpenAI SDK → transfers validation context
// Validator Agent → confirms or rejects anomalies with explanations
```

**Usage**:
```typescript
import { AiAnalyticsReport } from './agentic-system';

const analytics = new AiAnalyticsReport({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini'
});

const testRunData = await csvProcessor.processCSV('test_results.csv');
const analysis = await analytics.analyzeTestRun(testRunData);
// Returns: AiAnalyticsResponse with anomalies and summary
```

**Output Structure**:
```typescript
{
  executiveSummary: "Perfect success rate with 9.50 avg rating...",
  assessment: "excellent" | "good" | "concerning" | "poor",
  anomalies: {
    hasAnomalies: boolean,
    anomalies: Array<{
      type: "statistical" | "criteria-inconsistency" | "temporal" | "outlier",
      severity: "low" | "medium" | "high",
      title: string,
      description: string,
      evidence: string[],
      recommendation: string,
      affectedTests: string[]
    }>,
    overallRisk: "low" | "medium" | "high",
    confidence: number,
    validationDetails: {
      totalPotentialAnomalies: number,
      validatedAnomalies: number,
      rejectedAnomalies: number,
      validationDecisions: Array<{
        potentialAnomaly: string,
        decision: "VALIDATED" | "REJECTED",
        reason: string,
        mathematicalCheck: string,
        confidence: number
      }>
    }
  },
  insights: {
    keyFindings: string[],
    performanceHighlights: string[],
    concerns: string[],
    recommendations: string[]
  }
}
```

**Configuration**:
- Detector Temperature: 0 (precise analysis)
- Validator Temperature: 0 (strict validation)
- Max Tokens: 1500 (comprehensive analysis)
- Mathematical threshold: Any difference ≥0.2 validates as calculation error
- Handoff architecture with OpenAI Agent SDK
- Zod schema validation for all outputs

## Tools

### ChatGPT Tool

**Purpose**: Exposes ChatGPT REST API as a shared agent tool with conversation context management.

**Features**:
- Type-safe input/output validation
- Conversation context preservation
- Error handling and recovery
- Message count tracking
- Configurable temperature and tokens

**Schema**:
```typescript
Input: {
  message: string,
  conversation: Array<{role: 'system'|'user'|'assistant', content: string}>
}

Output: {
  response: string,
  updatedConversation: Array<{role, content}>,
  success: boolean,
  error?: string,
  messageCount?: number
}
```

**Integration**:
```typescript
const chatGPTTool = createChatGPTTool(httpHandler);

const agent = new Agent({
  tools: [chatGPTTool],
  // ... other config
});
```

## Configuration Management

### JSON-Based Prompts
All agents use external JSON configuration files for:
- **System Prompts**: Agent role and behavior definition
- **Rules**: Step-by-step instructions and constraints
- **Examples**: Sample inputs/outputs for consistency
- **Max Tokens**: Response length limits

### Agent Options
```typescript
interface BaseAgentOptions {
  apiKey?: string;      // OpenAI API key (defaults to env)
  model?: string;       // Model name (defaults to gpt-4o-mini)
  enabled?: boolean;    // Agent enabled state
}

interface LlmJudgeOptions extends BaseAgentOptions {
  // Judge-specific options
}

interface HistoryEnthusiastOptions extends BaseAgentOptions {
  httpHandler?: HttpHandler;  // Required for ChatGPT tool access
}
```

## Type Safety & Validation

### Zod Schemas
- **Judge Output**: `JudgeResultSchema` - rating (1-10) and explanation (max 500 chars)
- **Geography Questions**: `GeographyQuestionSchema` - question and rationale
- **Geography Sequence**: `GeographySequenceSchema` - theme, 2 questions, completion status
- **AI Analytics**: `AiAnalyticsResponseSchema` - executive summary, anomalies, and insights
- **Anomaly Detection**: `AnomalyDetectionSchema` - anomaly validation with detailed logging
- **Anomaly Handoff**: `AnomalyHandoffDataSchema` - simplified data transfer between agents
- **Tool I/O**: Comprehensive input/output validation for all tools

### TypeScript Integration
- Full type safety across all components
- Exported types for external usage
- Interface segregation for different agent types

## Integration & Usage

### Project Integration
```typescript
import { 
  LlmJudgeFactory, 
  HistoryEnthusiastAgent,
  AiAnalyticsReport,
  BaseAgent 
} from './agentic-system';

// Create judge for evaluating responses
const judge = LlmJudgeFactory.forSingleMessage();
const evaluation = await judge.judgeRelevance(prompt, response);

// Create enthusiast for generating test conversations
const enthusiast = new HistoryEnthusiastAgent({ httpHandler });
const sequence = await enthusiast.generateQuestionSequence();

// Create analytics for comprehensive test analysis
const analytics = new AiAnalyticsReport();
const testData = await csvProcessor.processCSV('judge_results.csv');
const analysis = await analytics.analyzeTestRun(testData);
```

### Logging Integration
- Automatic evaluation logging via `JudgeLogger`
- Conversation tracking and analysis
- Error monitoring and debug information
- CSV export of judge results

### HTTP Handler Dependency
- Required for ChatGPT tool functionality
- Manages OpenAI API communication
- Handles conversation state and message formatting
- Provides error handling and recovery

## Key Features

- **Inheritance-based Design**: All agents extend BaseAgent for consistency
- **Multi-Agent Orchestration**: Agent handoffs via OpenAI SDK for complex workflows
- **Tool Sharing**: Common tools available across multiple agents
- **External Configuration**: JSON-based prompts for easy versioning and A/B testing
- **Type Safety**: Full TypeScript support with Zod validation
- **Conversation Management**: Context-aware interactions with LLMs
- **Intelligent Anomaly Detection**: Multi-agent validation system with mathematical verification
- **Comprehensive Analytics**: Executive summaries, insights, and performance analysis
- **Error Handling**: Graceful failure recovery and detailed error reporting
- **Logging Integration**: Comprehensive tracking and analysis capabilities
- **Modular Architecture**: Clean separation of concerns and reusable components