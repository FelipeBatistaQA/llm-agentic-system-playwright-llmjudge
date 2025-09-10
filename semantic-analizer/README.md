# Semantic Analyzer

Advanced semantic similarity analysis using transformer-based embeddings to evaluate meaning preservation and content relevance in LLM responses.

## Overview

This module provides semantic analysis capabilities using the **@xenova/transformers** library, enabling precise measurement of semantic similarity between texts through sentence embeddings and cosine similarity calculations. It's designed to detect when LLM responses maintain semantic meaning regardless of surface-level textual differences.

## Core Technology

### @xenova/transformers Library

**@xenova/transformers** is a JavaScript implementation of Hugging Face's Transformers library, enabling client-side execution of transformer models without server dependencies. It provides:

- **Browser & Node.js compatibility** for versatile deployment
- **Pre-trained model access** from Hugging Face Hub
- **Feature extraction pipelines** for embedding generation
- **Optimized inference** with WebAssembly and WebGL acceleration
- **No external API calls** - fully self-contained execution

### Sentence Embeddings

**Embeddings** are dense vector representations that capture semantic meaning of text in high-dimensional space. Unlike traditional keyword matching, embeddings understand context, synonyms, and conceptual relationships.

**How it works:**
1. **Tokenization**: Text is broken into tokens (words, subwords)
2. **Encoding**: Transformer model processes tokens through attention layers
3. **Pooling**: Token embeddings are aggregated into a single sentence vector
4. **Normalization**: Vector is normalized for consistent similarity calculations

**Example embedding vector** (384 dimensions for all-MiniLM-L6-v2):
```
[ 0.0134, -0.0914,  0.0785,  0.1140,  0.0630, -0.0380, -0.1067, ...]
```

**Key properties:**
- **Semantic preservation**: Similar meanings produce similar vectors
- **Context awareness**: Understands word relationships and context
- **Language understanding**: Captures grammatical and semantic nuances
- **Dimensionality**: Fixed-size vectors regardless of text length

### Semantic Similarity

**Semantic similarity** measures how closely two texts align in meaning, not just in words. It uses **cosine similarity** to compare embedding vectors.

**Cosine Similarity Formula:**
```
similarity = (A · B) / (||A|| × ||B||)
```

**Similarity Scale:**
- **1.0**: Identical meaning (perfect alignment)
- **0.8-0.99**: Very similar meaning with minor variations
- **0.6-0.79**: Related meaning with some differences
- **0.4-0.59**: Somewhat related but different focus
- **0.0-0.39**: Different meanings or unrelated content

**Real-world example:**
```
Text A: "I love cats"
Text B: "Cats are my favorite"
Similarity: ~0.85 (high semantic similarity despite different words)

Text A: "The Earth orbits the Sun"
Text B: "The Sun orbits the Earth"  
Similarity: ~0.45 (low similarity - factually opposite meaning)
```

## Architecture

```
semantic-analizer/
├── semantic-analyzer.ts    # Main analyzer implementation
└── index.ts               # Module exports
```

## Implementation

### SemanticAnalyzer Class

**Model Used**: `Xenova/all-MiniLM-L6-v2`
- **Type**: Sentence-BERT (SBERT) based transformer
- **Dimensions**: 384-dimensional embeddings
- **Performance**: Optimized for semantic similarity tasks
- **Size**: Lightweight (~23MB) for fast initialization

```typescript
export class SemanticAnalyzer {
  private extractor: FeatureExtractionPipeline | null = null;
  
  // Lazy initialization of embedding pipeline
  private async getExtractor(): Promise<FeatureExtractionPipeline>;
  
  // Generate embedding vector for text
  async embed(text: string): Promise<number[]>;
  
  // Calculate semantic similarity between two texts
  async semanticSimilarity(expected: string, actual: string): Promise<number>;
}
```

### Core Methods

#### `embed(text: string): Promise<number[]>`
**Purpose**: Converts text into semantic embedding vector

**Process**:
1. Initialize transformer pipeline (lazy loading)
2. Process text through SBERT model
3. Apply mean pooling and normalization
4. Return 384-dimensional float array

**Features**:
- **Performance logging** with timing and dimensions
- **Text preview** for debugging (truncated at 80 chars)
- **Normalized vectors** for consistent similarity calculations

**Example output:**
```
[SemanticAnalyzer] embed: len=45 dims=384 elapsedMs=127 preview="What is the capital of France?"
```

#### `semanticSimilarity(expected: string, actual: string): Promise<number>`
**Purpose**: Measures semantic similarity between two texts

**Process**:
1. Generate embeddings for both texts in parallel
2. Calculate cosine similarity between vectors
3. Return similarity score (0-1 range)

**Performance optimization**:
- **Parallel embedding** generation using `Promise.all`
- **Efficient cosine calculation** with single-pass algorithm
- **Detailed logging** with similarity scores and timing

**Example output:**
```
[SemanticAnalyzer] similarity: sim=0.847 elapsedMs=234
```

### Cosine Similarity Implementation

```typescript
private static cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;      // Dot product
  let na = 0;       // Norm of vector a
  let nb = 0;       // Norm of vector b
  
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];           // Accumulate dot product
    na += a[i] * a[i];            // Accumulate squared norm a
    nb += b[i] * b[i];            // Accumulate squared norm b
  }
  
  return dot / (Math.sqrt(na) * Math.sqrt(nb));  // Cosine similarity
}
```

## Usage Patterns

### Basic Similarity Check
```typescript
import { SemanticAnalyzer } from './semantic-analizer';

const analyzer = new SemanticAnalyzer();

const similarity = await analyzer.semanticSimilarity(
  "The capital of France is Paris",
  "Paris is France's capital city"
);

console.log(`Similarity: ${similarity.toFixed(3)}`); // ~0.892
```

### LLM Response Validation
```typescript
const prompt = "What year did World War II begin?";
const expectedAnswer = "World War II began in 1939";
const llmResponse = "The Second World War started in 1939";

const similarity = await analyzer.semanticSimilarity(expectedAnswer, llmResponse);

if (similarity >= 0.8) {
  console.log("✅ Response maintains semantic meaning");
} else {
  console.log("❌ Response may have semantic issues");
}
```

### Content Quality Assessment
```typescript
// Check if response stays on-topic
const topicSimilarity = await analyzer.semanticSimilarity(prompt, response);

// Check if response matches expected content
const contentSimilarity = await analyzer.semanticSimilarity(expected, response);

const isValid = topicSimilarity >= 0.7 && contentSimilarity >= 0.8;
```

## Test Integration

### Historical Questions Test Suite
```typescript
test('Historical Question: World War II start year', async ({ request }) => {
  const httpHandler = new HttpHandler(request);
  const analyzer = new SemanticAnalyzer();
  
  const response = await httpHandler.openaiAPI.openAICompletion(
    'What year did World War II begin?'
  );
  
  const similarity = await analyzer.semanticSimilarity(
    'World War II began in 1939',
    response.choices[0].message.content
  );
  
  expect(similarity).toBeGreaterThanOrEqual(0.8);
});
```

### On-Topic Validation
```typescript
test('on-topic validation', async ({ request }) => {
  const prompt = 'What year did World War II begin?';
  const response = await httpHandler.openaiAPI.openAICompletion(prompt);
  
  const similarity = await analyzer.semanticSimilarity(
    prompt, 
    response.choices[0].message.content
  );
  
  expect(similarity).toBeGreaterThanOrEqual(0.7);
});
```

## Similarity Thresholds

### Recommended Thresholds
- **≥ 0.9**: Nearly identical meaning - strict content matching
- **≥ 0.8**: High semantic similarity - good answer quality
- **≥ 0.7**: Moderate similarity - on-topic responses
- **≥ 0.6**: Basic relevance - loose content matching
- **< 0.6**: Poor similarity - potential issues

### Use Case Guidelines
- **Factual accuracy**: Use ≥ 0.8 threshold
- **Topic relevance**: Use ≥ 0.7 threshold  
- **Content quality**: Use ≥ 0.6 threshold
- **Semantic drift detection**: Monitor < 0.5 scores

## Performance Characteristics

### Initialization
- **First call**: ~2-3 seconds (model loading)
- **Subsequent calls**: Instant (cached pipeline)
- **Memory usage**: ~50MB for model weights
- **Model size**: 23MB download

### Embedding Generation
- **Speed**: ~50-150ms per text (depends on length)
- **Batch processing**: Parallel execution supported
- **Memory**: Minimal per-request overhead
- **Accuracy**: High semantic understanding

### Similarity Calculation
- **Speed**: <1ms for cosine similarity
- **Precision**: Float32 precision
- **Consistency**: Deterministic results
- **Scale**: 0-1 normalized range

## Error Scenarios Detection

### Semantic Drift
```typescript
// Original: "The Earth orbits the Sun"
// Corrupted: "The Sun orbits the Earth"
// Similarity: ~0.45 (detects factual error)
```

### Topic Deviation
```typescript
// Question: "What is the capital of France?"
// Off-topic: "I like French cuisine very much"
// Similarity: ~0.3 (detects topic deviation)
```

### Gibberish Detection
```typescript
// Expected: "Paris is the capital of France"
// Gibberish: "Xlkjf qwerty asdfgh zxcvbn"
// Similarity: ~0.05 (detects nonsensical content)
```

## Integration Benefits

- **Quality Assurance**: Automated semantic validation in test suites
- **Content Verification**: Ensure LLM responses maintain meaning
- **Topic Adherence**: Validate responses stay on-topic
- **Regression Testing**: Detect semantic degradation over time
- **Threshold Tuning**: Flexible similarity thresholds for different use cases
- **Performance Monitoring**: Track semantic consistency across test runs

## Key Advantages

- **No External Dependencies**: Fully self-contained execution
- **High Accuracy**: Transformer-based semantic understanding
- **Performance Optimized**: Efficient embedding and similarity calculations
- **Flexible Thresholds**: Configurable similarity requirements
- **Comprehensive Logging**: Detailed performance and debugging information
- **Test Framework Integration**: Seamless Playwright test integration
- **Semantic Focus**: Meaning-based evaluation beyond keyword matching
