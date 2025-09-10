import { test } from '@playwright/test';

interface HttpLogEntry {
    timestamp: string;
    method: string;
    url: string;
    payload?: any;
    status: number;
    response?: any;
    error?: string;
}

interface LlmLogEntry {
    timestamp: string;
    model: string;
    prompt: string;
    response: string;
    tokens: { prompt: number; completion: number; total: number };
    finishReason: string;
    responseId: string;
}

interface JudgeLogEntry {
    timestamp: string;
    question: string;
    answer: string;
    rating: number; 
    status: 'PASS' | 'FAIL';
    explanation: string; 
}

export class PlaywrightLogger {
    private static testLogs: Map<string, {
        http: HttpLogEntry[];
        llm: LlmLogEntry[];
        judge: JudgeLogEntry[];
    }> = new Map();
    
    private static currentTestName: string | null = null;

    static setCurrentTestName(testName: string) {
        this.currentTestName = testName;
    }
    
    static getCurrentTestName(): string | null {
        return this.currentTestName;
    }

    static initTestLogs(testName: string) {
        this.testLogs.set(testName, {
            http: [],
            llm: [],
            judge: []
        });
    }

    static addHttpLog(entry: HttpLogEntry) {
        if (!this.currentTestName) return;
        
        const logs = this.testLogs.get(this.currentTestName);
        if (logs) {
            logs.http.push(entry);
        }
    }

    static addLlmLog(entry: LlmLogEntry) {
        if (!this.currentTestName) return;
        
        const logs = this.testLogs.get(this.currentTestName);
        if (logs) {
            logs.llm.push(entry);
        }
    }

    static addJudgeLog(entry: JudgeLogEntry) {
        if (!this.currentTestName) return;
        
        // Debug: Log explanation details
        console.log('[DEBUG] Adding judge log - explanation length:', entry.explanation?.length || 0);
        console.log('[DEBUG] Full explanation in addJudgeLog:', entry.explanation);
        
        const logs = this.testLogs.get(this.currentTestName);
        if (logs) {
            logs.judge.push(entry);
        }
    }

    static async attachLogsToTest(testName: string) {
        const logs = this.testLogs.get(testName);
        if (!logs) return;

        if (logs.http.length > 0) {
            const formatted = this.formatHttpLogs(logs.http);
            await test.info().attach('HTTP Logs', {
                body: formatted,
                contentType: 'text/plain'
            });
        }

        if (logs.llm.length > 0) {
            const formatted = this.formatLlmLogs(logs.llm);
            await test.info().attach('LLM Logs', {
                body: formatted,
                contentType: 'text/plain'
            });
        }

        if (logs.judge.length > 0) {
            const formatted = this.formatJudgeLogs(logs.judge);
            await test.info().attach('Judge Logs', {
                body: formatted,
                contentType: 'text/plain'
            });
        }

        this.testLogs.delete(testName);
        this.currentTestName = null;
    }

    private static formatHttpLogs(entries: HttpLogEntry[]): string {
        return entries.map(entry => {
            let log = `╔══ HTTP REQUEST [${entry.timestamp}] ══════════════════════════════════
║ ${entry.method} ${entry.url}
║ Status: ${entry.status}`;
            
            if (entry.payload) {
                log += `
║ 
║ ── PAYLOAD ──
${JSON.stringify(entry.payload, null, 2).split('\n').map(line => `║ ${line}`).join('\n')}`;
            }
            
            if (entry.response) {
                log += `
║ 
║ ── RESPONSE ──
${JSON.stringify(entry.response, null, 2).split('\n').map(line => `║ ${line}`).join('\n')}`;
            }
            
            if (entry.error) {
                log += `
║ 
║ ── ERROR ──
║ ${entry.error}`;
            }
            
            log += `
╚════════════════════════════════════════════════════════════════════════`;
            
            return log;
        }).join('\n\n');
    }

    private static formatLlmLogs(entries: LlmLogEntry[]): string {
        return entries.map(entry => `╔══ LLM INTERACTION [${entry.timestamp}] ════════════════════════════════
║ Model: ${entry.model}
║ Response ID: ${entry.responseId}
║ Tokens: ${entry.tokens.prompt}/${entry.tokens.completion}/${entry.tokens.total} (prompt/completion/total)
║ Finish Reason: ${entry.finishReason}
║ 
║ ── PROMPT ──
║ ${entry.prompt}
║ 
║ ── RESPONSE ──
║ ${entry.response}
╚════════════════════════════════════════════════════════════════════════`).join('\n\n');
    }

    private static formatJudgeLogs(entries: JudgeLogEntry[]): string {
        return entries.map(entry => {
            // Break long explanation into multiple lines for better attachment display
            const formattedExplanation = this.formatLongText(entry.explanation);
            const formattedAnswer = this.formatLongText(entry.answer);
            
            return `╔══ JUDGE EVALUATION [${entry.timestamp}] ════════════════════════════════
║ Rating: ${entry.rating}/10
║ Status: ${entry.status} (threshold: 7)
║ 
║ ── QUESTION ──
║ ${entry.question}
║ 
║ ── ANSWER ──
${formattedAnswer}
║ 
║ ── EXPLANATION ──
${formattedExplanation}
╚════════════════════════════════════════════════════════════════════════`;
        }).join('\n\n');
    }
    
    private static formatLongText(text: string): string {
        if (!text) return '║ (empty)';
        
        // Break into lines of max 70 characters to fit in log format
        const maxLineLength = 70;
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        for (const word of words) {
            if (currentLine.length + word.length + 1 <= maxLineLength) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) {
                    lines.push('║ ' + currentLine);
                    currentLine = word;
                } else {
                    // Word is too long, break it
                    lines.push('║ ' + word);
                }
            }
        }
        
        if (currentLine) {
            lines.push('║ ' + currentLine);
        }
        
        return lines.join('\n');
    }
}