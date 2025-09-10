import { APIResponse } from "@playwright/test";
import { PlaywrightLogger } from './PlaywrightLogger';
import * as fs from 'fs';
import * as path from 'path';

export class HttpLogger {
    private static logFile = path.join(process.cwd(), 'logSystem', 'logs', 'http.log');
    
    static ensureLogDir() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }
    
    static async logRequest(method: string, url: string, payload?: any, response?: APIResponse) {
        const timestamp = new Date().toISOString();
        
        console.log('┌─ HTTP ─────────────────────────────────────────────────────────────────┐');
        console.log(`│ ${method} ${url.padEnd(66)} │`);
        console.log(`│ Status: ${response?.status() || 'N/A'}${' '.repeat(60)} │`);
        console.log('└────────────────────────────────────────────────────────────────────────┘');
        console.log('');
        
        let responseData = null;
        if (response) {
            try {
                responseData = await response.json();
            } catch (e) {
                responseData = await response.text();
            }
        }
        
        PlaywrightLogger.addHttpLog({
            timestamp,
            method,
            url,
            payload,
            status: response?.status() || 0,
            response: responseData
        });
        
        let fileLogEntry = `[${timestamp}] [HTTP] ${method} ${url}\n`;
        if (payload) {
            fileLogEntry += `[${timestamp}] [HTTP] Payload: ${JSON.stringify(payload, null, 2)}\n`;
        }
        if (response) {
            fileLogEntry += `[${timestamp}] [HTTP] Status: ${response.status()}\n`;
            if (responseData) {
                fileLogEntry += `[${timestamp}] [HTTP] Response: ${typeof responseData === 'string' ? responseData : JSON.stringify(responseData)}\n`;
            }
        }
        fileLogEntry += '\n';
        
        this.ensureLogDir();
        fs.appendFileSync(this.logFile, fileLogEntry);
    }
    
    static logError(method: string, url: string, error: any, payload?: any) {
        const timestamp = new Date().toISOString();
        
        console.log('┌─ HTTP ERROR ───────────────────────────────────────────────────────────┐');
        console.log(`│ ${method} ${url}${' '.repeat(Math.max(0, 66 - method.length - url.length))} │`);
        console.log(`│ Error: ${error.message}${' '.repeat(Math.max(0, 59 - error.message.length))} │`);
        console.log('└────────────────────────────────────────────────────────────────────────┘');
        console.log('');
        
        PlaywrightLogger.addHttpLog({
            timestamp,
            method,
            url,
            payload,
            status: 0,
            error: error.message
        });
        
        let fileLogEntry = `[${timestamp}] [HTTP ERROR] ${method} ${url} - ${error.message}\n`;
        if (payload) {
            fileLogEntry += `[${timestamp}] [HTTP ERROR] Payload: ${JSON.stringify(payload, null, 2)}\n`;
        }
        fileLogEntry += '\n';
        
        this.ensureLogDir();
        fs.appendFileSync(this.logFile, fileLogEntry);
    }
}