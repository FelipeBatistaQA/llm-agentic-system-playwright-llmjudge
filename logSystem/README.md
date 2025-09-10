# Log System

Comprehensive logging infrastructure for LLM testing framework with structured logging across HTTP protocols, LLM interactions, and judge evaluations. Features segregated logs automatically attached to Playwright test reports and CSV archival for large-scale analysis.

## Overview

Multi-layered observability system providing real-time console output, file persistence, automatic Playwright test integration with segregated log attachments, and CSV export for scalable analysis.

## Architecture

```
logSystem/
├── HttpLogger.ts              # HTTP protocol logging
├── LlmLogger.ts              # LLM interaction logging  
├── JudgeLogger.ts            # Judge evaluation logging
├── CSVJudgeLogger.ts         # CSV archival for judge results
├── PlaywrightLogger.ts       # Playwright test integration
├── fixtures.ts               # Test configuration injection
├── index.ts                  # Module exports
└── logs/                     # Log file outputs
    ├── http.log              # HTTP request/response logs
    ├── llm.log               # LLM interaction logs
    ├── judge.log             # Judge evaluation logs
    └── judge_results.csv     # Structured judge results
```

## Core Loggers

### HTTP Logger (`HttpLogger.ts`)
**Purpose**: Logs HTTP protocol interactions with requests, responses, and errors

**Features**: Request/response payloads, status codes, ASCII console output, file persistence, Playwright integration

**Console Output**:
```
┌─ HTTP ─────────────────────────────────────────────────────────────────┐
│ POST https://api.openai.com/v1/chat/completions                        │
│ Status: 200                                                            │
└────────────────────────────────────────────────────────────────────────┘
```

### LLM Logger (`LlmLogger.ts`)
**Purpose**: Tracks LLM interactions with prompts, responses, and token usage

**Features**: Model tracking, token statistics, response correlation, console output with statistics

**Console Output**:
```
┌─ LLM ──────────────────────────────────────────────────────────────────┐
│ Model: gpt-4o-mini                                                     │
│ Tokens: 150 | Prompt: What is the capital of France?                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Judge Logger (`JudgeLogger.ts`)
**Purpose**: Logs LLM judge evaluations with ratings, explanations, and pass/fail status

**Features**: Rating scale (1-10), pass/fail status (threshold: 7), detailed explanations, CSV export integration

**Console Output**:
```
┌─ JUDGE ────────────────────────────────────────────────────────────────┐
│ Rating: 9/10 | Status: PASS                                           │
│ Question: What is the capital of France?                              │
└────────────────────────────────────────────────────────────────────────┘
```

## CSV Archival System

### CSV Judge Logger (`CSVJudgeLogger.ts`)
**Purpose**: Archives judge results in structured CSV format for large-scale analysis

**Features**: Human-readable format, system-parseable data, automatic header management, analytics integration

**CSV Structure** (`logs/judge_results.csv`):
```csv
timestamp,test_name,rating,status,prompt,output
"2025-01-01T12:00:00.000Z","geography-test",9,"PASS","What is the capital of France?","Paris"
"2025-01-01T12:00:01.000Z","history-test",7,"PASS","Who was Napoleon?","French military leader"
"2025-01-01T12:00:02.000Z","science-test",4,"FAIL","Explain quantum physics","Very small things"
```

**Analytics Benefits**: Excel/Sheets import, trend analysis, quality metrics, large-scale evaluation insights

## Playwright Integration

### Playwright Logger (`PlaywrightLogger.ts`)
**Purpose**: Integrates all logging with Playwright test framework with segregated log attachments

**Features**: Test-scoped collection, automatic attachment to reports, structured formatting, memory management

**Segregated Log Attachments**: Each test automatically receives separate HTTP, LLM, and Judge log attachments in the Playwright test report, as shown below:

![Segregated Log Attachments](https://github.com/user-attachments/assets/8b5c4c5d-2f1a-4b6e-8c45-3d2e1a7f9b0c)

**Log Attachment Formats**:

**Structured Attachment Format**:
- **HTTP Logs**: Request/response with payloads and status codes
- **LLM Logs**: Model, tokens, prompts, and responses with correlation IDs
- **Judge Logs**: Ratings, explanations, and evaluation details with pass/fail status

## Test Configuration & Fixtures

### Fixtures (`fixtures.ts`)
**Purpose**: Automatic logging configuration injection for all tests

**Features**: Auto-initialization, test name normalization, log attachment, memory management

**Usage**:
```typescript
import { test, expect } from './logSystem/fixtures';

test('my test', async ({ page }) => {
  // All logs automatically captured and attached to test report
});
```

## Usage Patterns

### Automatic Integration
```typescript
import { test, expect } from './logSystem';

test('llm evaluation test', async ({ request }) => {
  // All HTTP, LLM, and Judge logs automatically captured and attached
  const httpHandler = new HttpHandler(request);
  const judge = LlmJudgeFactory.forSingleMessage();
  
  const response = await httpHandler.openaiAPI.chatCompletion(messages);
  const evaluation = await judge.judgeRelevance(question, answer);
  
  expect(evaluation.ok).toBe(true);
});
```

### Manual Usage
```typescript
import { HttpLogger, LlmLogger, JudgeLogger } from './logSystem';

await HttpLogger.logRequest('POST', url, payload, response);
LlmLogger.logInteraction(prompt, openaiResponse);
JudgeLogger.logEvaluation(question, answer, rating, explanation);
```

## Configuration

**File Locations**: Logs automatically created in `logSystem/logs/` directory
- `http.log` - HTTP requests/responses
- `llm.log` - LLM interactions  
- `judge.log` - Judge evaluations
- `judge_results.csv` - Structured results for analysis

## Key Benefits

- **Segregated Attachments**: Separate HTTP, LLM, and Judge logs per test in Playwright reports
- **Large-Scale Analysis**: CSV export for analytics on thousands of evaluations
- **Developer Experience**: Rich console output with ASCII formatting
- **Automatic Integration**: Seamless Playwright integration via fixtures
- **Multi-Format Output**: Console, files, test reports, and CSV for different use cases
- **Quality Metrics**: Pass/fail rates, evaluation trends, and performance monitoring
