# HTTP Module

Page Object Model (POM) implementation adapted for REST API endpoints. Provides structured segregation of all HTTP interactions required by the testing framework.

## Overview

This module implements a POM-inspired architecture for REST API testing, featuring handler classes, support utilities, and contract validation for endpoints. It centralizes HTTP communication patterns and provides consistent interfaces for external API interactions.

## Architecture

```
http/
├── httpHandler.ts              # Main HTTP handler (orchestrator)
├── HttpSupport.ts             # HTTP utilities and assertions
└── OpenAI-API/               # OpenAI API implementation
    ├── openAIAPI.ts          # OpenAI endpoint implementation
    ├── openAIAPIValidator.ts # Contract validation
    └── types/
        └── openAIChatCompletionResponse.type.ts # Type definitions
```

## Core Components

### HTTP Handler (`httpHandler.ts`)
**Purpose**: Main orchestrator class that manages API implementations

**Features**:
- Centralized API management
- Playwright APIRequestContext integration
- Dependency injection for API implementations
- Clean separation of concerns

```typescript
export class HttpHandler {
  private readonly request: APIRequestContext;
  readonly openaiAPI: OpenAIAPI;
  
  constructor(request: APIRequestContext) {
    this.request = request;
    this.openaiAPI = new OpenAIAPI(request);
  }
}
```

**Usage**:
```typescript
import { HttpHandler } from './http/httpHandler';

const httpHandler = new HttpHandler(request);
const result = await httpHandler.openaiAPI.chatCompletion(messages);
```

### HTTP Support (`HttpSupport.ts`)
**Purpose**: Utility class providing common HTTP testing functionality

**Features**:
- Status code validation with soft assertions
- Consistent error handling patterns
- Reusable HTTP testing utilities

```typescript
export class HttpSupport {
  static async checkStatusCode(response: APIResponse, expectedStatusCode?: number): Promise<void>;
}
```

**Usage**:
```typescript
import { HttpSupport } from './http/HttpSupport';

await HttpSupport.checkStatusCode(response, 200);
```

## API Implementations

### OpenAI API (`OpenAI-API/`)

**Purpose**: Complete OpenAI Chat Completion API implementation with conversation management

#### Main API Class (`openAIAPI.ts`)

**Key Features**:
- Full conversation context management
- Message validation and formatting
- Backward compatibility methods
- Integrated logging (HTTP and LLM loggers)
- Flexible parameter configuration

**Primary Method**:
```typescript
async chatCompletion(
  messages: ConversationMessage | ConversationMessage[],
  options: {
    model?: string;           // Default: 'gpt-4o-mini'
    temperature?: number;     // Default: 1.0
    maxTokens?: number;       // Optional token limit
    expectedStatusCode?: number; // Default: 200
  } = {}
): Promise<ConversationResult>
```

**Conversation Management**:
- Maintains full conversation history
- Automatic message role validation
- Context preservation across interactions
- Structured conversation results

**Usage Examples**:
```typescript
// Single message
const result = await openaiAPI.chatCompletion(
  { role: 'user', content: 'What is AI?' }
);

// Conversation with context
const conversation = [
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'Explain machine learning' }
];
const result = await openaiAPI.chatCompletion(conversation);

// With custom options
const result = await openaiAPI.chatCompletion(messages, {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 500
});
```

#### Contract Validator (`openAIAPIValidator.ts`)

**Purpose**: Comprehensive contract validation for OpenAI API responses

**Features**:
- Type safety validation
- Response structure verification
- Token usage arithmetic validation
- Soft assertions for non-blocking validation

**Validation Coverage**:
- Response object structure (`id`, `object`, `created`, `model`)
- Choices array format and content
- Message role and content validation
- Usage tokens consistency check
- Arithmetic validation (total = prompt + completion tokens)

```typescript
export class OpenAIAPIValidator {
  validateResponseContractForChatCompletion(data: OpenAIChatCompletionResponse): void;
}
```

#### Type Definitions (`types/openAIChatCompletionResponse.type.ts`)

**Core Interfaces**:

```typescript
// OpenAI API Response
interface OpenAIChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Conversation Management
interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ConversationResult {
  response: OpenAIChatCompletionResponse;
  conversation: ConversationMessage[];
  lastMessage: string;
}
```

## Integration Features

### Logging Integration
- **HTTP Logger**: Request/response logging for debugging
- **LLM Logger**: Conversation tracking and analysis
- Structured logging format for easy analysis

### Error Handling
- Message validation with descriptive errors
- Status code verification
- Graceful failure handling
- Detailed error context

### Playwright Integration
- Native APIRequestContext usage
- Consistent with Playwright testing patterns
- Built-in assertion support
- Request/response interception capabilities

## Usage Patterns

### Basic API Testing
```typescript
// Setup
const httpHandler = new HttpHandler(request);

// Single request
const response = await httpHandler.openaiAPI.openAICompletion(
  "Explain quantum computing",
  200
);

// Validate contract
httpHandler.openaiAPI.validator.validateResponseContractForChatCompletion(response);
```

### Conversation Testing
```typescript
// Multi-turn conversation
const messages: ConversationMessage[] = [
  { role: 'system', content: 'You are a geography expert' },
  { role: 'user', content: 'What is the capital of France?' }
];

const result = await httpHandler.openaiAPI.chatCompletion(messages);

// Continue conversation
const updatedMessages = [
  ...result.conversation,
  { role: 'user', content: 'What about Germany?' }
];

const nextResult = await httpHandler.openaiAPI.chatCompletion(updatedMessages);
```

### Agent Integration
```typescript
// Used by agentic system
const chatGPTTool = createChatGPTTool(httpHandler);

// Tool automatically handles conversation context
const toolResult = await chatGPTTool.execute({
  message: "New question",
  conversation: previousMessages
});
```

## Configuration

### Environment Variables
```bash
OPENAI_API_KEY=your-api-key-here
```

### Default Settings
- **Model**: `gpt-4o-mini`
- **Temperature**: `1.0`
- **Expected Status Code**: `200`
- **Endpoint**: `https://api.openai.com/v1/chat/completions`

## Extension Points

### Adding New APIs
1. Create API implementation class in dedicated directory
2. Add validator class for contract validation
3. Define TypeScript interfaces for request/response
4. Integrate with HttpHandler constructor
5. Add logging integration

### Custom Validation
- Extend validator classes for specific requirements
- Add custom assertion methods to HttpSupport
- Implement domain-specific validation logic

## Key Benefits

- **Separation of Concerns**: Clean architecture with distinct responsibilities
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Testability**: Built for testing with Playwright integration
- **Extensibility**: Easy to add new API implementations
- **Logging**: Comprehensive request/response tracking
- **Validation**: Contract-based testing with detailed assertions
- **Conversation Management**: Stateful interaction support for complex testing scenarios
