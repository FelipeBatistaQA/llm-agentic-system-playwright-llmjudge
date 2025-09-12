import { PlaywrightLogger } from './PlaywrightLogger';
import { CSVJudgeLogger } from './CSVJudgeLogger';
import * as fs from 'fs';
import * as path from 'path';

export class JudgeLogger {
    private static logFile = path.join(process.cwd(), 'logSystem', 'logs', 'judge.log');
    private static currentTestName: string | null = null;
    
    static setCurrentTestName(testName: string) {
        const cleanName = testName
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        this.currentTestName = cleanName;
        console.log(`[CSV DEBUG] Test name set to: ${cleanName}`);
    }
    
    static ensureLogDir() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }
    
    static logEvaluation(prompt: string, response: string, rating: number, explanation: string, criteria?: {
        helpfulness: number;
        relevance: number;
        accuracy: number;
        depth: number;
        creativity: number;
        levelOfDetail: number;
    }) {
        const timestamp = new Date().toISOString();
        const status = rating >= 7 ? 'PASS' : 'FAIL';
        
        console.log(`[CSV DEBUG] About to log evaluation - Test: ${this.currentTestName || 'NULL'}`);
        
        console.log('┌─ JUDGE ────────────────────────────────────────────────────────────────┐');
        console.log(`│ Rating: ${rating}/10 | Status: ${status}${' '.repeat(Math.max(0, 51 - rating.toString().length - status.length))} │`);
        console.log(`│ Question: ${this.truncate(prompt, 57)}${' '.repeat(Math.max(0, 57 - Math.min(57, prompt.length)))} │`);
        if (criteria) {
            console.log(`│ Criteria: H:${criteria.helpfulness} R:${criteria.relevance} A:${criteria.accuracy} D:${criteria.depth} C:${criteria.creativity} LoD:${criteria.levelOfDetail}${' '.repeat(Math.max(0, 42 - `H:${criteria.helpfulness} R:${criteria.relevance} A:${criteria.accuracy} D:${criteria.depth} C:${criteria.creativity} LoD:${criteria.levelOfDetail}`.length))} │`);
        }
        console.log('└────────────────────────────────────────────────────────────────────────┘');
        console.log('');
        
        PlaywrightLogger.addJudgeLog({
            timestamp,
            question: prompt,
            answer: response,
            rating,
            status: status as 'PASS' | 'FAIL',
            explanation,
            criteria,
        });
        
        const criteriaText = criteria ? 
            `[${timestamp}] [JUDGE] Criteria Scores:
[${timestamp}] [JUDGE]   • Helpfulness: ${criteria.helpfulness}/10
[${timestamp}] [JUDGE]   • Relevance: ${criteria.relevance}/10
[${timestamp}] [JUDGE]   • Accuracy: ${criteria.accuracy}/10
[${timestamp}] [JUDGE]   • Depth: ${criteria.depth}/10
[${timestamp}] [JUDGE]   • Creativity: ${criteria.creativity}/10
[${timestamp}] [JUDGE]   • Level of Detail: ${criteria.levelOfDetail}/10
` : '';

        const fileLogEntry = `[${timestamp}] [JUDGE] === EVALUATION RESULT ===
[${timestamp}] [JUDGE] Rating: ${rating}/10
[${timestamp}] [JUDGE] Status: ${status} (threshold: 7)
[${timestamp}] [JUDGE] Question: ${prompt}
[${timestamp}] [JUDGE] Answer: ${response}
${criteriaText}[${timestamp}] [JUDGE] Explanation: ${explanation}
[${timestamp}] [JUDGE] === END EVALUATION ===

`;
        
        this.ensureLogDir();
        fs.appendFileSync(this.logFile, fileLogEntry);
        
        CSVJudgeLogger.logJudgeResult({
            timestamp,
            testName: this.currentTestName || 'unknown-test',
            rating,
            status: status as 'PASS' | 'FAIL',
            prompt,
            output: response,
            criteria
        });
    }
    
    static logJudgeRequest(prompt: string, response: string) {
        const timestamp = new Date().toISOString();
        
        console.log('┌─ JUDGE REQUEST ────────────────────────────────────────────────────────┐');
        console.log(`│ Evaluating response for: ${this.truncate(prompt, 45)}${' '.repeat(Math.max(0, 45 - Math.min(45, prompt.length)))} │`);
        console.log('└────────────────────────────────────────────────────────────────────────┘');
        
        const fileLogEntry = `[${timestamp}] [JUDGE] Sending evaluation request...
[${timestamp}] [JUDGE] Question: ${prompt}
[${timestamp}] [JUDGE] Answer to evaluate: ${response}

`;
        
        this.ensureLogDir();
        fs.appendFileSync(this.logFile, fileLogEntry);
    }
    
    static logJudgeError(prompt: string, response: string, error: any) {
        const timestamp = new Date().toISOString();
        
        console.log('┌─ JUDGE ERROR ──────────────────────────────────────────────────────────┐');
        console.log(`│ Evaluation failed: ${error.message}${' '.repeat(Math.max(0, 50 - error.message.length))} │`);
        console.log(`│ Question: ${this.truncate(prompt, 58)}${' '.repeat(Math.max(0, 58 - Math.min(58, prompt.length)))} │`);
        console.log('└────────────────────────────────────────────────────────────────────────┘');
        console.log('');
        
        CSVJudgeLogger.logJudgeResult({
            timestamp,
            testName: this.currentTestName || 'unknown-test',
            rating: 0,
            status: 'FAIL',
            prompt: prompt,
            output: `ERROR: ${error.message}`
        });
        
        const fileLogEntry = `[${timestamp}] [JUDGE ERROR] Evaluation failed: ${error.message}
[${timestamp}] [JUDGE ERROR] Question: ${prompt}
[${timestamp}] [JUDGE ERROR] Answer: ${response}

`;
        
        this.ensureLogDir();
        fs.appendFileSync(this.logFile, fileLogEntry);
    }
    
    private static truncate(text: string, maxLength: number): string {
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    }
}