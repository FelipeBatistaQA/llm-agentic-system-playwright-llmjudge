export interface PromptConfig {
  systemPrompt?: string;
  rules?: string[];
  examples?: string[];
  maxTokens?: number;
}

export interface BaseAgentOptions {
  apiKey?: string;
  model?: string;
  enabled?: boolean;
}

export abstract class BaseAgent {
  protected readonly apiKey?: string;
  protected readonly enabled: boolean;
  protected readonly model: string;

  constructor(options: BaseAgentOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    this.enabled = options.enabled ?? Boolean(this.apiKey);
    this.model = options.model ?? 'gpt-4o-mini';
  }

  // Build instructions from prompt configuration inherited by all agents
  protected buildInstructions(prompts: PromptConfig): string {
    const parts: string[] = [];
    
    if (prompts.systemPrompt) {
      parts.push(prompts.systemPrompt);
    }
    
    if (prompts.rules && prompts.rules.length > 0) {
      parts.push(...prompts.rules);
    }
    
    if (prompts.examples && prompts.examples.length > 0) {
      parts.push('Examples:');
      parts.push(...prompts.examples);
    }
    
    return parts.join(' ');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getModel(): string {
    return this.model;
  }
}
