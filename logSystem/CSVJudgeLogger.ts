import * as fs from 'fs';
import * as path from 'path';

interface CSVJudgeEntry {
    timestamp: string;
    testName: string;
    rating: number;
    status: 'PASS' | 'FAIL';
    prompt: string;
    output: string;
}

export class CSVJudgeLogger {
    private static csvFile = path.join(process.cwd(), 'logSystem', 'logs', 'judge_results.csv');
    private static initLock = false;
    
    static ensureLogDir() {
        const logDir = path.dirname(this.csvFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }
    
    static ensureCSVReady() {
        if (this.initLock) return;
        this.initLock = true;
        
        this.ensureLogDir();
        
        try {
            if (!fs.existsSync(this.csvFile)) {
                const header = 'timestamp,test_name,rating,status,prompt,output';
                fs.writeFileSync(this.csvFile, header + '\n', 'utf8');
                console.log(`[CSV] Created new file: ${this.csvFile}`);
            } else {
                const content = fs.readFileSync(this.csvFile, 'utf8');
                if (!content.includes('timestamp,test_name,rating')) {
                    const header = 'timestamp,test_name,rating,status,prompt,output';
                    fs.writeFileSync(this.csvFile, header + '\n', 'utf8');
                    console.log(`[CSV] Fixed header in: ${this.csvFile}`);
                }
            }
        } catch (error: any) {
            console.log(`[CSV ERROR] Failed to initialize: ${error.message}`);
        }
    }
    
    static logJudgeResult(entry: CSVJudgeEntry) {
        try {
            this.ensureCSVReady();
            
            const csvRow = [
                entry.timestamp,
                entry.testName,
                entry.rating,
                entry.status,
                this.escapeCSV(entry.prompt),
                this.escapeCSV(entry.output)
            ].join(',');
            
            fs.appendFileSync(this.csvFile, csvRow + '\n', 'utf8');
            
            console.log(`[CSV] Added: ${entry.testName} - ${entry.rating}/10`);
        } catch (error: any) {
            console.log(`[CSV ERROR] Failed to log: ${error.message}`);
        }
    }
    
    private static escapeCSV(text: string): string {
        if (!text) return '""';
        
        const escaped = text.replace(/"/g, '""');
        return `"${escaped}"`;
    }
}