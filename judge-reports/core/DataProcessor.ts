import * as fs from 'fs';
import csv from 'csv-parser';
import { JudgeResult, ReportStats, CriteriaAverages, CriteriaDistribution, CriteriaTrend, ErrorStats, ProcessedData } from './ReportData';

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
            rating: parseInt(row.rating) || 0,
            status: row.status as 'PASS' | 'FAIL',
            prompt: row.prompt,
            output: row.output,
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

  getProcessedData(): ProcessedData {
    return {
      stats: this.calculateStats(),
      ratingCounts: this.getRatingCounts(),
      statusCounts: this.getStatusCounts(),
      trendData: this.getTrendData(),
      criteriaAverages: this.calculateCriteriaAverages(),
      criteriaDistribution: this.getCriteriaDistribution(),
      criteriaTrend: this.getCriteriaTrend(),
      errorStats: this.getErrorStats()
    };
  }
}
