import { OpenAIChatCompletionResponse } from "../http/OpenAI-API/types/openAIChatCompletionResponse.type";
import { PlaywrightLogger } from './PlaywrightLogger';
import * as fs from 'fs';
import * as path from 'path';

export class LlmLogger {
    private static logFile = path.join(process.cwd(), 'logSystem', 'logs', 'llm.log');
    
    static ensureLogDir() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }
    
    static logInteraction(prompt: string, response: OpenAIChatCompletionResponse) {
        const timestamp = new Date().toISOString();
        const content = response.choices[0]?.message?.content || 'No response';
        
        console.log('┌─ LLM ──────────────────────────────────────────────────────────────────┐');
        console.log(`│ Model: ${response.model}${' '.repeat(Math.max(0, 58 - response.model.length))} │`);
        console.log(`│ Tokens: ${response.usage.total_tokens} | Prompt: ${this.truncate(prompt, 45)}${' '.repeat(Math.max(0, 67 - response.usage.total_tokens.toString().length - 20 - Math.min(45, prompt.length)))} │`);
        console.log('└────────────────────────────────────────────────────────────────────────┘');
        console.log('');
        
        PlaywrightLogger.addLlmLog({
            timestamp,
            model: response.model,
            prompt,
            response: content,
            tokens: {
                prompt: response.usage.prompt_tokens,
                completion: response.usage.completion_tokens,
                total: response.usage.total_tokens
            },
            finishReason: response.choices[0]?.finish_reason || 'N/A',
            responseId: response.id
        });
        
        const fileLogEntry = `[${timestamp}] [LLM] Model: ${response.model}
[${timestamp}] [LLM] Prompt: ${prompt}
[${timestamp}] [LLM] Response: ${content}
[${timestamp}] [LLM] Tokens: ${response.usage.prompt_tokens}/${response.usage.completion_tokens}/${response.usage.total_tokens}
[${timestamp}] [LLM] Finish reason: ${response.choices[0]?.finish_reason || 'N/A'}

`;
        
        this.ensureLogDir();
        fs.appendFileSync(this.logFile, fileLogEntry);
    }
    
    private static truncate(text: string, maxLength: number): string {
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    }
}