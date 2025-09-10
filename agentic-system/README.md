# Agentic System

A modular agent management system built on the @openai/agents SDK for LLM testing and evaluation.

## Overview

This system provides a structured approach to creating and managing AI agents with shared tools and consistent interfaces. It features inheritance-based architecture with a base agent class and specialized agent implementations for LLM evaluation and human interaction simulation.

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
│   └── history-enthusiast/   # Human interaction simulation agent
│       ├── history-agent.ts  # Main enthusiast implementation
│       ├── types.ts          # Type definitions
│       └── config/
│           └── prompts.json  # Question generation prompts
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
  BaseAgent 
} from './agentic-system';

// Create judge for evaluating responses
const judge = LlmJudgeFactory.forSingleMessage();
const evaluation = await judge.judgeRelevance(prompt, response);

// Create enthusiast for generating test conversations
const enthusiast = new HistoryEnthusiastAgent({ httpHandler });
const sequence = await enthusiast.generateQuestionSequence();
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
- **Tool Sharing**: Common tools available across multiple agents
- **External Configuration**: JSON-based prompts for easy versioning and A/B testing
- **Type Safety**: Full TypeScript support with Zod validation
- **Conversation Management**: Context-aware interactions with LLMs
- **Error Handling**: Graceful failure recovery and detailed error reporting
- **Logging Integration**: Comprehensive tracking and analysis capabilities
- **Modular Architecture**: Clean separation of concerns and reusable components