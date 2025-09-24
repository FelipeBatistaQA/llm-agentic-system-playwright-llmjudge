import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { JudgeResult, ReportStats, CriteriaAverages, CriteriaDistribution, CriteriaTrend, ErrorStats, ProcessedData, RatingGroup, StructuredLogs, HttpLogInfo, LlmLogInfo, JudgeLogInfo, ConversationEntry } from './ReportData';

export class DataProcessor {
  private data: JudgeResult[] = [];
  private errors: JudgeResult[] = [];

  async loadFromCSV(csvPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const results: JudgeResult[] = [];
      let lineNumber = 1; // Começar em 1 (header)
      
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row: any) => {
          lineNumber++; // Incrementar para cada linha de dados
          
          const result: JudgeResult = {
            timestamp: row.timestamp,
            testName: row.test_name,
            rating: parseFloat(row.rating) || 0,
            status: row.status as 'PASS' | 'FAIL',
            prompt: row.prompt,
            output: row.output,
            explanation: row.explanation || '',
            lineNumber: lineNumber
          };
          
          // Adicionar critérios se disponíveis
          if (row.helpfulness || row.relevance || row.accuracy || row.depth || row.level_of_detail) {
            result.criteria = {
              helpfulness: parseInt(row.helpfulness) || 0,
              relevance: parseInt(row.relevance) || 0,
              accuracy: parseInt(row.accuracy) || 0,
              depth: parseInt(row.depth) || 0,
              levelOfDetail: parseInt(row.level_of_detail) || 0,
            };
          }
          
          results.push(result);
        })
        .on('end', () => {
          // Separar dados válidos de erros
          const allData = results.filter(r => r.testName && r.testName !== 'test_name');
          this.data = allData.filter(r => r.rating > 0); // Só dados válidos
          this.errors = allData.filter(r => r.rating === 0); // Só erros
          
          console.log(`   📈 Loaded ${this.data.length} valid records`);
          console.log(`   ❌ Found ${this.errors.length} errors`);
          resolve();
        })
        .on('error', reject);
    });
  }

  calculateStats(): ReportStats {
    const totalTests = this.data.length + this.errors.length; // Incluir erros no total
    const passCount = this.data.filter(item => item.status === 'PASS').length;
    const avgRating = this.data.length > 0 ? this.data.reduce((sum, item) => sum + item.rating, 0) / this.data.length : 0;
    const successRate = (passCount / totalTests * 100).toFixed(1);
    const maxRating = this.data.length > 0 ? Math.max(...this.data.map(item => item.rating)) : 0;
    const minRating = this.data.length > 0 ? Math.min(...this.data.map(item => item.rating)) : 0;
    return { totalTests, passCount, avgRating, successRate, maxRating, minRating };
  }

  getErrorStats(): ErrorStats | null {
    if (this.errors.length === 0) return null;
    
    // Capturar TODA informação possível sobre erros - sem hardcoding
    const errorDetails = this.errors.map(e => ({
      timestamp: new Date(e.timestamp).toLocaleString(),
      testName: e.testName,
      rating: e.rating,
      status: e.status,
      prompt: e.prompt.length > 60 ? e.prompt.substring(0, 60) + '...' : e.prompt,
      fullMessage: e.output,
      shortMessage: e.output.length > 120 ? e.output.substring(0, 120) + '...' : e.output,
      lineNumber: e.lineNumber || 'Unknown'
    }));
    
    // Categorizar de forma simples para o gráfico com exemplos de mensagens
    const categoryData = errorDetails.reduce((acc, err) => {
      let category = 'Other';
      if (err.fullMessage.includes('Zod field')) category = 'Schema';
      else if (err.fullMessage.includes('Rate limit')) category = 'API Limit';
      else if (err.fullMessage.includes('timeout')) category = 'Timeout';
      else if (err.fullMessage.includes('Invalid output')) category = 'Invalid Output';
      else if (err.fullMessage.includes('parse')) category = 'Parse Error';
      
      if (!acc[category]) {
        acc[category] = { count: 0, example: err.fullMessage };
      }
      acc[category].count++;
      return acc;
    }, {} as Record<string, {count: number, example: string}>);
    
    return {
      totalErrors: this.errors.length,
      errorRate: ((this.errors.length / (this.data.length + this.errors.length)) * 100).toFixed(1),
      errorTypes: Object.keys(categoryData),
      errorCounts: Object.values(categoryData).map(data => data.count),
      errorExamples: Object.values(categoryData).map(data => data.example),
      errorDetails: errorDetails.slice(-15), // Últimos 15 erros com TODA informação
    };
  }

  calculateCriteriaAverages(): CriteriaAverages | null {
    const dataWithCriteria = this.data.filter(item => item.criteria);
    if (dataWithCriteria.length === 0) return null;
    
    const totals = {
      helpfulness: 0,
      relevance: 0,
      accuracy: 0,
      depth: 0,
      creativity: 0,
      levelOfDetail: 0
    };
    
    dataWithCriteria.forEach(item => {
      if (item.criteria) {
        totals.helpfulness += item.criteria.helpfulness;
        totals.relevance += item.criteria.relevance;
        totals.accuracy += item.criteria.accuracy;
        totals.depth += item.criteria.depth;
        totals.levelOfDetail += item.criteria.levelOfDetail;
      }
    });
    
    const count = dataWithCriteria.length;
    return {
      helpfulness: (totals.helpfulness / count).toFixed(1),
      relevance: (totals.relevance / count).toFixed(1),
      accuracy: (totals.accuracy / count).toFixed(1),
      depth: (totals.depth / count).toFixed(1),
      levelOfDetail: (totals.levelOfDetail / count).toFixed(1)
    };
  }

  getCriteriaDistribution(): CriteriaDistribution[] | null {
    const dataWithCriteria = this.data.filter(item => item.criteria);
    if (dataWithCriteria.length === 0) return null;
    
    const criteriaNames = ['helpfulness', 'relevance', 'accuracy', 'depth', 'levelOfDetail'];
    const distribution = criteriaNames.map(criteriaName => {
      const values = dataWithCriteria.map(item => item.criteria![criteriaName as keyof typeof item.criteria]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      const nameMap: Record<string, string> = {
        helpfulness: 'Helpfulness',
        relevance: 'Relevance', 
        accuracy: 'Accuracy',
        depth: 'Depth',
        levelOfDetail: 'Level of Detail'
      };
      
      return {
        name: nameMap[criteriaName] || criteriaName,
        min,
        max,
        avg: avg.toFixed(1)
      };
    });
    
    return distribution;
  }

  getCriteriaTrend(): CriteriaTrend | null {
    const dataWithCriteria = this.data.filter(item => item.criteria);
    if (dataWithCriteria.length < 5) return null;
    
    const sortedData = dataWithCriteria.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const recent = sortedData; // USAR TODOS OS DADOS ao invés de slice(-15)
    
    const testLabels = recent.map((_, index) => `Test ${index + 1}`);
    const testNames = recent.map(item => item.testName); // ADICIONAR NOMES REAIS
    const criteria = {
      helpfulness: recent.map(item => item.criteria!.helpfulness),
      relevance: recent.map(item => item.criteria!.relevance),
      accuracy: recent.map(item => item.criteria!.accuracy),
      depth: recent.map(item => item.criteria!.depth),
      levelOfDetail: recent.map(item => item.criteria!.levelOfDetail)
    };
    
    return { testLabels, testNames, criteria };
  }

  getRatingCounts(): number[] {
    const ratingCounts = new Array(11).fill(0);
    this.data.forEach(item => {
      if (item.rating >= 0 && item.rating <= 10) ratingCounts[item.rating]++;
    });
    return ratingCounts;
  }

  getStatusCounts(): Record<string, number> {
    return this.data.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  getTrendData(): { testLabels: string[]; testNames: string[]; ratings: number[] } {
    const sortedData = [...this.data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const testLabels = sortedData.map((_, index) => `Test ${index + 1}`);
    const testNames = sortedData.map(item => item.testName); // ADICIONAR NOMES REAIS
    const ratings = sortedData.map(item => item.rating);
    return { testLabels, testNames, ratings };
  }

  getRatingGroups(): RatingGroup[] {
    const groups = new Map<string, JudgeResult[]>();
    
    this.data.forEach(item => {
      const ratingKey = item.rating.toFixed(1);
      if (!groups.has(ratingKey)) {
        groups.set(ratingKey, []);
      }
      groups.get(ratingKey)!.push(item);
    });
    
    return Array.from(groups.entries())
      .map(([rating, tests]) => ({
        rating,
        count: tests.length,
        tests: tests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }))
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  }

  private loadLogsForTest(testName: string, timestamp: string): StructuredLogs {
    const logs: StructuredLogs = {
      http: [],
      llm: [],
      judge: []
    };
    
    try {
      const playwrightResults = this.loadPlaywrightResults();
      if (!playwrightResults) {
        console.log(`[DEBUG] No Playwright results loaded`);
        return logs;
      }
      
      const testAttachments = this.findTestAttachments(playwrightResults, testName);
      if (!testAttachments) {
        console.log(`[DEBUG] No attachments found for test: ${testName}`);
        return logs;
      }
      
      logs.http = this.parseAttachmentContent(testAttachments, 'HTTP Logs', 'http');
      logs.llm = this.parseAttachmentContent(testAttachments, 'LLM Logs', 'llm');
      logs.judge = this.parseAttachmentContent(testAttachments, 'Judge Logs', 'judge');
      
      console.log(`[DEBUG] Extracted logs for ${testName} - HTTP: ${logs.http.length}, LLM: ${logs.llm.length}, Judge: ${logs.judge.length}`);
      
    } catch (error) {
      console.warn(`[DEBUG] Failed to load logs for test ${testName}:`, error);
    }
    
    return logs;
  }

  private loadPlaywrightResults(): any {
    try {
      const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
      console.log(`[DEBUG] Looking for results.json at: ${resultsPath}`);
      
      if (!fs.existsSync(resultsPath)) {
        console.warn(`[DEBUG] Playwright results.json not found at: ${resultsPath}`);
        return null;
      }
      
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      console.log(`[DEBUG] Loaded Playwright results with ${results.suites?.length || 0} suites`);
      return results;
    } catch (error) {
      console.warn('[DEBUG] Failed to load Playwright results:', error);
      return null;
    }
  }

  private findTestAttachments(results: any, testName: string): any[] | null {
    try {
      console.log(`[DEBUG] Looking for attachments for test: ${testName}`);
      
      for (const topSuite of results.suites || []) {
        console.log(`[DEBUG] Checking top suite: ${topSuite.title}`);
        
        for (const nestedSuite of topSuite.suites || []) {
          console.log(`[DEBUG] Checking nested suite: ${nestedSuite.title}`);
          
          for (const spec of nestedSuite.specs || []) {
            console.log(`[DEBUG] Checking spec: "${spec.title}"`);
            
            const isExactMatch = this.isTestMatch(testName, spec.title);
            
            if (isExactMatch) {
              console.log(`[DEBUG] EXACT MATCH: "${spec.title}" ← "${testName}"`);
              
              for (const test of spec.tests || []) {
                for (const result of test.results || []) {
                  if (result.attachments && result.attachments.length > 0) {
                    console.log(`[DEBUG] Found ${result.attachments.length} attachments:`, result.attachments.map((a: any) => a.name));
                    return result.attachments;
                  }
                }
              }
            }
          }
        }
      }
      
      console.log(`[DEBUG] No attachments found for test: ${testName}`);
      return null;
    } catch (error) {
      console.warn('[DEBUG] Failed to find test attachments:', error);
      return null;
    }
  }

  private isTestMatch(csvTestName: string, specTitle: string): boolean {
    const normalizedCsv = csvTestName.toLowerCase().replace(/-/g, ' ');
    const normalizedSpec = specTitle.toLowerCase();
    
    // Caso especial: geography-sequence test
    if (csvTestName.includes('should-generate-a-valid-2-question-geography-sequence')) {
      return normalizedSpec.includes('should generate a valid 2-question geography sequence');
    }
    
    // Geografia questions - match exato por número e tópico
    if (csvTestName.startsWith('geography-question-')) {
      const questionNumber = csvTestName.match(/geography-question-(\d+)/)?.[1];
      const questionTopic = csvTestName.replace(/geography-question-\d+-/, '').replace(/-/g, ' ');
      
      if (questionNumber && questionTopic) {
        return normalizedSpec.includes(`geography question ${questionNumber}:`) && 
               normalizedSpec.includes(questionTopic);
      }
    }
    
    // Fallback para outros casos
    return normalizedSpec === normalizedCsv;
  }

  private detectTestType(testName: string, prompt: string): 'simple' | 'conversation' {
    if (prompt.includes('[user]:') && prompt.includes('[assistant]:')) {
      return 'conversation';
    }
    return 'simple';
  }

  private extractConversationFromLogs(logs: StructuredLogs): string {
    if (logs.llm.length === 0) return 'Conversação não encontrada nos logs';
    
    let conversation = '';
    logs.llm.forEach((log, index) => {
      const userPrompt = this.extractUserPrompt(log.prompt);
      const assistantResponse = this.cleanLogContent(log.response);
      
      if (index === 0) {
        conversation += `[user]: ${userPrompt}\n[assistant]: ${assistantResponse}`;
      } else {
        conversation += `\n\n[user]: ${userPrompt}\n[assistant]: ${assistantResponse}`;
      }
    });
    
    return conversation;
  }

  private extractFinalResponseFromLogs(logs: StructuredLogs): string {
    if (logs.llm.length === 0) return 'Resposta não encontrada nos logs';
    
    const lastLlm = logs.llm[logs.llm.length - 1];
    return this.cleanLogContent(lastLlm.response);
  }

  private extractExplanationFromLogs(logs: StructuredLogs, csvExplanation: string): string {
    if (csvExplanation && csvExplanation.trim()) return csvExplanation;
    
    const judgeLog = logs.judge[0];
    return judgeLog?.explanation || 'Não disponível';
  }

  private extractUserPrompt(promptContent: string): string {
    return promptContent.replace(/^║\s*/, '').trim();
  }

  private cleanLogContent(content: string): string {
    return content.replace(/^║\s*/, '').replace(/\n║\s*/g, '\n').trim();
  }

  private extractConversationEntries(logs: StructuredLogs): ConversationEntry[] {
    return logs.llm.map(log => ({
      userMessage: this.extractUserPrompt(log.prompt),
      assistantResponse: this.cleanLogContent(log.response),
      timestamp: log.timestamp,
      tokens: log.tokens
    }));
  }

  private parseAttachmentContent(attachments: any[], attachmentName: string, type: 'http' | 'llm' | 'judge'): any[] {
    try {
      console.log(`[DEBUG] Looking for attachment: ${attachmentName}`);
      const attachment = attachments.find(att => att.name === attachmentName);
      
      if (!attachment) {
        console.log(`[DEBUG] Attachment "${attachmentName}" not found`);
        return [];
      }
      
      if (!attachment.body) {
        console.log(`[DEBUG] Attachment "${attachmentName}" has no body`);
        return [];
      }
      
      console.log(`[DEBUG] Found attachment "${attachmentName}" with body length: ${attachment.body.length}`);
      const content = Buffer.from(attachment.body, 'base64').toString('utf8');
      console.log(`[DEBUG] Decoded content length: ${content.length}, first 100 chars: ${content.substring(0, 100)}`);
      
      let result: any[] = [];
      switch (type) {
        case 'http':
          result = this.parseHttpContent(content);
          break;
        case 'llm':
          result = this.parseLlmContent(content);
          break;
        case 'judge':
          result = this.parseJudgeContent(content);
          break;
        default:
          result = [];
      }
      
      console.log(`[DEBUG] Parsed ${result.length} entries from ${attachmentName}`);
      return result;
    } catch (error) {
      console.warn(`[DEBUG] Failed to parse ${attachmentName}:`, error);
      return [];
    }
  }

  private parseHttpContent(content: string): HttpLogInfo[] {
    const logs: HttpLogInfo[] = [];
    const sections = content.split('╔══ HTTP REQUEST');
    
    for (const section of sections) {
      if (!section.trim()) continue;
      
      const timestampMatch = section.match(/\[([^\]]+)\]/);
      const methodMatch = section.match(/(POST|GET|PUT|DELETE|PATCH)\s+(https?:\/\/[^\s]+)/);
      const statusMatch = section.match(/Status:\s*(\d+)/);
      
      const payloadMatch = section.match(/── PAYLOAD ──\s*([\s\S]*?)(?=── RESPONSE ──|╚)/);
      const responseMatch = section.match(/── RESPONSE ──\s*([\s\S]*?)(?=╚)/);
      
      let model: string | undefined = undefined;
      let tokens: { total: number; prompt: number; completion: number } | undefined = undefined;
      
      if (payloadMatch) {
        const modelMatch = payloadMatch[1].match(/"model":\s*"([^"]+)"/);
        if (modelMatch) model = modelMatch[1];
      }
      
      if (responseMatch) {
        const tokensMatch = responseMatch[1].match(/"total_tokens":\s*(\d+).*"prompt_tokens":\s*(\d+).*"completion_tokens":\s*(\d+)/s);
        if (tokensMatch) {
          tokens = {
            total: parseInt(tokensMatch[1]),
            prompt: parseInt(tokensMatch[2]),
            completion: parseInt(tokensMatch[3])
          };
        }
      }
      
      if (timestampMatch && methodMatch) {
        logs.push({
          timestamp: timestampMatch[1],
          method: methodMatch[1],
          url: methodMatch[2],
          status: statusMatch ? parseInt(statusMatch[1]) : 0,
          model,
          payload: payloadMatch ? payloadMatch[1].trim().replace(/║\s*/g, '').trim() : undefined,
          response: responseMatch ? responseMatch[1].trim().replace(/║\s*/g, '').trim() : undefined,
          tokens
        });
      }
    }
    
    return logs;
  }

  private parseLlmContent(content: string): LlmLogInfo[] {
    const logs: LlmLogInfo[] = [];
    const sections = content.split('╔══ LLM INTERACTION');
    
    sections.forEach(section => {
      if (!section.trim()) return;
      
      const timestampMatch = section.match(/\[([^\]]+)\]/);
      if (!timestampMatch) return;
      
      const modelMatch = section.match(/║ Model:\s*([^\n]+)/);
      const finishMatch = section.match(/║ Finish reason:\s*([^\n]+)/);
      const tokensMatch = section.match(/║ Tokens:\s*(\d+)\/(\d+)\/(\d+)/);
      
      // Extrair prompt completo (tudo entre ── PROMPT ── e ── RESPONSE ──)
      const promptMatch = section.match(/── PROMPT ──\s*([\s\S]*?)(?=── RESPONSE ──)/);
      
      // Extrair response completo (tudo entre ── RESPONSE ── e ╚)
      const responseMatch = section.match(/── RESPONSE ──\s*([\s\S]*?)(?=╚|$)/);
      
      if (timestampMatch && modelMatch && promptMatch && responseMatch) {
        logs.push({
          timestamp: timestampMatch[1],
          model: modelMatch[1].trim(),
          prompt: this.cleanLogContent(promptMatch[1]),
          response: this.cleanLogContent(responseMatch[1]),
          tokens: tokensMatch ? {
            prompt: parseInt(tokensMatch[1]),
            completion: parseInt(tokensMatch[2]),
            total: parseInt(tokensMatch[3])
          } : { prompt: 0, completion: 0, total: 0 },
          finishReason: finishMatch ? finishMatch[1].trim() : 'unknown'
        });
      }
    });
    
    return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  private parseJudgeContent(content: string): JudgeLogInfo[] {
    const logs: JudgeLogInfo[] = [];
    const sections = content.split('╔══ JUDGE EVALUATION');
    
    for (const section of sections) {
      if (!section.trim()) continue;
      
      const timestampMatch = section.match(/\[([^\]]+)\]/);
      const ratingMatch = section.match(/Rating:\s*([\d.]+)\/10/);
      const statusMatch = section.match(/Status:\s*([^\n]+)/);
      
      const questionMatch = section.match(/── QUESTION ──\s*([^\n]*)/);
      const answerMatch = section.match(/── ANSWER ──\s*([\s\S]*?)(?=── CRITERIA|── EXPLANATION|╚)/);
      const explanationMatch = section.match(/── EXPLANATION ──\s*([\s\S]*?)(?=╚════════════|$)/);
      
      const criteriaMatch = section.match(/── CRITERIA SCORES ──\s*([\s\S]*?)(?=── EXPLANATION)/);
      let criteria: { helpfulness: number; relevance: number; accuracy: number; depth: number; levelOfDetail: number; } | undefined = undefined;
      if (criteriaMatch) {
        const helpfulnessMatch = criteriaMatch[1].match(/Helpfulness:\s*(\d+)\/10/);
        const relevanceMatch = criteriaMatch[1].match(/Relevance:\s*(\d+)\/10/);
        const accuracyMatch = criteriaMatch[1].match(/Accuracy:\s*(\d+)\/10/);
        const depthMatch = criteriaMatch[1].match(/Depth:\s*(\d+)\/10/);
        const detailMatch = criteriaMatch[1].match(/Level of Detail:\s*(\d+)\/10/);
        
        if (helpfulnessMatch && relevanceMatch && accuracyMatch && depthMatch && detailMatch) {
          criteria = {
            helpfulness: parseInt(helpfulnessMatch[1]),
            relevance: parseInt(relevanceMatch[1]),
            accuracy: parseInt(accuracyMatch[1]),
            depth: parseInt(depthMatch[1]),
            levelOfDetail: parseInt(detailMatch[1])
          };
        }
      }
      
      if (timestampMatch && ratingMatch) {
        logs.push({
          timestamp: timestampMatch[1],
          rating: parseFloat(ratingMatch[1]),
          status: statusMatch ? statusMatch[1].trim() : 'UNKNOWN',
          question: questionMatch ? questionMatch[1].trim() : '',
          answer: answerMatch ? answerMatch[1].trim().replace(/║\s*/g, '').trim() : '',
          explanation: explanationMatch ? explanationMatch[1].trim().replace(/║\s*/g, '').trim() : '',
          criteria
        });
      }
    }
    
    return logs;
  }

  private parseHttpLogs(content: string, testName: string, testTimestamp: string): HttpLogInfo[] {
    const logs: HttpLogInfo[] = [];
    const entries = content.split('[HTTP]').filter(entry => entry.trim());
    const testTime = new Date(testTimestamp).getTime();
    
    entries.forEach(entry => {
      const timestampMatch = entry.match(/\[([^\]]+)\]/);
      if (!timestampMatch) return;
      
      const logTime = new Date(timestampMatch[1]).getTime();
      const timeDiff = Math.abs(logTime - testTime);
      
      // Filtrar logs próximos ao teste (±5 minutos)
      if (timeDiff > 300000) return;
      
      const methodMatch = entry.match(/(GET|POST|PUT|DELETE|PATCH)\s+(https?:\/\/[^\s]+)/);
      const statusMatch = entry.match(/Status:\s*(\d+)/);
      const modelMatch = entry.match(/"model":\s*"([^"]+)"/);
      const tokensMatch = entry.match(/"total_tokens":\s*(\d+).*"prompt_tokens":\s*(\d+).*"completion_tokens":\s*(\d+)/s);
      
      if (methodMatch) {
        logs.push({
          timestamp: timestampMatch[1],
          method: methodMatch[1],
          url: methodMatch[2],
          status: statusMatch ? parseInt(statusMatch[1]) : 0,
          model: modelMatch ? modelMatch[1] : undefined,
          tokens: tokensMatch ? {
            total: parseInt(tokensMatch[1]),
            prompt: parseInt(tokensMatch[2]),
            completion: parseInt(tokensMatch[3])
          } : undefined
        });
      }
    });
    
    return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  private parseLlmLogs(content: string, testName: string, testTimestamp: string): LlmLogInfo[] {
    const logs: LlmLogInfo[] = [];
    const entries = content.split('[LLM]').filter(entry => entry.trim());
    const testTime = new Date(testTimestamp).getTime();
    
    entries.forEach(entry => {
      const timestampMatch = entry.match(/\[([^\]]+)\]/);
      if (!timestampMatch) return;
      
      const logTime = new Date(timestampMatch[1]).getTime();
      const timeDiff = Math.abs(logTime - testTime);
      
      // Filtrar logs próximos ao teste (±5 minutos)
      if (timeDiff > 300000) return;
      
      const modelMatch = entry.match(/Model:\s*([^\n]+)/);
      const promptMatch = entry.match(/Prompt:\s*([^\n]+)/);
      const responseMatch = entry.match(/Response:\s*([\s\S]*?)(?=\[|Tokens:|$)/);
      const tokensMatch = entry.match(/Tokens:\s*(\d+)\/(\d+)\/(\d+)/);
      const finishMatch = entry.match(/Finish reason:\s*([^\n]+)/);
      
      if (modelMatch) {
        logs.push({
          timestamp: timestampMatch[1],
          model: modelMatch[1].trim(),
          prompt: promptMatch ? promptMatch[1].trim() : 'N/A',
          response: responseMatch ? responseMatch[1].trim() : 'N/A',
          tokens: tokensMatch ? {
            prompt: parseInt(tokensMatch[1]),
            completion: parseInt(tokensMatch[2]),
            total: parseInt(tokensMatch[3])
          } : { prompt: 0, completion: 0, total: 0 },
          finishReason: finishMatch ? finishMatch[1].trim() : 'N/A'
        });
      }
    });
    
    return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  private parseJudgeLogs(content: string, testName: string, testTimestamp: string): JudgeLogInfo[] {
    const logs: JudgeLogInfo[] = [];
    const entries = content.split('=== EVALUATION RESULT ===').filter(entry => entry.trim());
    const testTime = new Date(testTimestamp).getTime();
    
    entries.forEach(entry => {
      const timestampMatch = entry.match(/\[([^\]]+)\]/);
      if (!timestampMatch) return;
      
      const logTime = new Date(timestampMatch[1]).getTime();
      const timeDiff = Math.abs(logTime - testTime);
      
      // Filtrar logs próximos ao teste (±5 minutos)
      if (timeDiff > 300000) return;
      
      const ratingMatch = entry.match(/Rating:\s*([\d.]+)\/10/);
      const statusMatch = entry.match(/Status:\s*([^\n]+)/);
      const questionMatch = entry.match(/Question:\s*([^\n]+)/);
      const answerMatch = entry.match(/Answer:\s*([\s\S]*?)(?=Criteria|Explanation|$)/);
      const explanationMatch = entry.match(/Explanation:\s*([\s\S]*?)(?===|$)/);
      
      // Critérios
      const helpfulnessMatch = entry.match(/Helpfulness:\s*(\d+)\/10/);
      const relevanceMatch = entry.match(/Relevance:\s*(\d+)\/10/);
      const accuracyMatch = entry.match(/Accuracy:\s*(\d+)\/10/);
      const depthMatch = entry.match(/Depth:\s*(\d+)\/10/);
      const levelOfDetailMatch = entry.match(/Level of Detail:\s*(\d+)\/10/);
      
      if (ratingMatch) {
        logs.push({
          timestamp: timestampMatch[1],
          rating: parseFloat(ratingMatch[1]),
          status: statusMatch ? statusMatch[1].trim() : 'N/A',
          question: questionMatch ? questionMatch[1].trim() : 'N/A',
          answer: answerMatch ? answerMatch[1].trim() : 'N/A',
          explanation: explanationMatch ? explanationMatch[1].trim() : 'N/A',
          criteria: (helpfulnessMatch && relevanceMatch && accuracyMatch && depthMatch && levelOfDetailMatch) ? {
            helpfulness: parseInt(helpfulnessMatch[1]),
            relevance: parseInt(relevanceMatch[1]),
            accuracy: parseInt(accuracyMatch[1]),
            depth: parseInt(depthMatch[1]),
            levelOfDetail: parseInt(levelOfDetailMatch[1])
          } : undefined
        });
      }
    });
    
    return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  getTestDetails(): JudgeResult[] {
    return [...this.data].map(item => {
      const testType = this.detectTestType(item.testName, item.prompt);
      const logs = this.loadLogsForTest(item.testName, item.timestamp);
      
      console.log(`[DEBUG] Test ${item.testName} detected as ${testType}`);
      
      if (testType === 'conversation') {
        // CASE 2: Extract data from logs for conversation tests
        return {
          ...item,
          prompt: `Conversation with ${logs.llm.length} interactions`,
          output: `Conversation evaluated with ${logs.llm.length} interactions - see complete details in Prompt and Judge tabs`,
          explanation: this.extractExplanationFromLogs(logs, item.explanation || ''),
          conversationEntries: this.extractConversationEntries(logs),
          logs
        };
      } else {
        // CASO 1: Usar CSV + completar com logs para testes simples
        return {
          ...item,
          explanation: this.extractExplanationFromLogs(logs, item.explanation || ''),
          logs
        };
      }
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getProcessedData(): ProcessedData {
    return {
      stats: this.calculateStats(),
      ratingCounts: this.getRatingCounts(),
      statusCounts: this.getStatusCounts(),
      trendData: this.getTrendData(),
      criteriaAverages: this.calculateCriteriaAverages(),
      criteriaDistribution: this.getCriteriaDistribution(),
      criteriaTrend: this.getCriteriaTrend(),
      errorStats: this.getErrorStats(),
      ratingGroups: this.getRatingGroups(),
      testDetails: this.getTestDetails()
    };
  }
}
