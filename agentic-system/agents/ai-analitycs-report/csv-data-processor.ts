import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { TestRunData, TestRunDataSchema } from './types';

function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

function safeParseNumber(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value);
  return isValidNumber(num) ? num : null;
}

interface CSVRow {
  timestamp: string;
  test_name: string;
  rating: string;
  status: string;
  prompt: string;
  output: string;
  helpfulness?: string;
  relevance?: string;
  accuracy?: string;
  depth?: string;
  level_of_detail?: string;
}

export async function csvDataProcessor(csvPath: string): Promise<TestRunData> {
  const results: CSVRow[] = [];
  
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row: CSVRow) => {
        results.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Separar dados válidos e inválidos
  const invalidEntries: string[] = [];
  const validResults = results.filter(r => {
    // Filtrar cabeçalho
    if (r.test_name === 'test_name') return false;
    
    // Verificar se é uma entrada inválida
    const isInvalid = !r.test_name || 
                      isNaN(parseFloat(r.rating)) || 
                      !['PASS', 'FAIL'].includes(r.status) ||
                      parseFloat(r.rating) < 0 || 
                      parseFloat(r.rating) > 10;
    
    if (isInvalid) {
      invalidEntries.push(r.test_name || 'unknown-test');
      return false;
    }
    
    return true;
  });

  if (validResults.length === 0) {
    throw new Error(`No valid test data found in CSV: ${csvPath}`);
  }

  // Calcular metadados básicos
  const totalTests = validResults.length;
  const passCount = validResults.filter(r => r.status === 'PASS').length;
  const ratings = validResults.map(r => parseFloat(r.rating));
  const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / totalTests;
  const successRate = `${((passCount / totalTests) * 100).toFixed(1)}%`;
  
  // Análise estatística detalhada dos ratings
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const ratingRange = maxRating - minRating;
  const variance = ratings.reduce((sum, rating) => sum + Math.pow(rating - avgRating, 2), 0) / totalTests;
  const standardDeviation = Math.sqrt(variance);
  
  // Distribuição de ratings INTEGER tradicional (1-10)
  const ratingDistribution = Array(10).fill(0);
  ratings.forEach(rating => {
    const ratingIndex = Math.floor(rating) - 1;
    if (ratingIndex >= 0 && ratingIndex < 10) {
      ratingDistribution[ratingIndex]++;
    }
  });
  
  // Análise DECIMAL detalhada - novo!
  const decimalDistribution: Record<string, number> = {};
  let mostFrequentRating = { value: 0, count: 0 };
  
  ratings.forEach(rating => {
    const key = rating.toString();
    decimalDistribution[key] = (decimalDistribution[key] || 0) + 1;
    
    if (decimalDistribution[key] > mostFrequentRating.count) {
      mostFrequentRating = {
        value: rating,
        count: decimalDistribution[key]
      };
    }
  });
  
  const detailedRatingAnalysis = {
    decimalDistribution,
    mostFrequentRating: {
      ...mostFrequentRating,
      percentage: (mostFrequentRating.count / totalTests) * 100
    },
    isNarrowRange: ratingRange < 1.0
  };
  
  // Calcular médias de critérios
  const criteriaAverages = calculateCriteriaAverages(validResults);
  
  // Detectar critérios PERFEITOS (10.0)
  const perfectCriteria: string[] = [];
  if (criteriaAverages) {
    Object.entries(criteriaAverages).forEach(([criterion, average]) => {
      if (Math.abs(average - 10.0) < 0.001) { // Considerando precision float
        perfectCriteria.push(criterion);
      }
    });
  }
  
  // Quality assurance dos dados
  const dataQuality = {
    invalidEntriesFound: invalidEntries.length,
    invalidEntries: invalidEntries.slice(0, 5) // Max 5 exemplos
  };
  
  // Mapear testes individuais
  const individualTests = validResults.map(row => ({
    testName: row.test_name,
    rating: parseFloat(row.rating),
    status: row.status as 'PASS' | 'FAIL',
    criteria: (row.helpfulness && row.relevance && row.accuracy && row.depth && row.level_of_detail) ? {
      helpfulness: safeParseNumber(row.helpfulness) || 0,
      relevance: safeParseNumber(row.relevance) || 0,
      accuracy: safeParseNumber(row.accuracy) || 0,
      depth: safeParseNumber(row.depth) || 0,
      levelOfDetail: safeParseNumber(row.level_of_detail) || 0
    } : null
  }));

  const testRunData: TestRunData = {
    metadata: {
      totalTests,
      passCount,
      avgRating,
      successRate,
      testDate: new Date().toISOString(),
      ratingRange: {
        min: minRating,
        max: maxRating,
        range: ratingRange,
        standardDeviation
      },
      dataQuality
    },
    ratingDistribution,
    detailedRatingAnalysis,
    criteriaAverages,
    perfectCriteria,
    individualTests
  };

  // Validar com Zod
  return TestRunDataSchema.parse(testRunData);
}

function calculateCriteriaAverages(results: CSVRow[]): { helpfulness: number; relevance: number; accuracy: number; depth: number; levelOfDetail: number } | null {
  const withCriteria = results.filter(r => 
    r.helpfulness && r.relevance && r.accuracy && r.depth && r.level_of_detail &&
    isValidNumber(r.helpfulness) && isValidNumber(r.relevance) && 
    isValidNumber(r.accuracy) && isValidNumber(r.depth) && isValidNumber(r.level_of_detail)
  );
  
  if (withCriteria.length === 0) {
    return null;
  }

  const totals = {
    helpfulness: 0,
    relevance: 0,
    accuracy: 0,
    depth: 0,
    levelOfDetail: 0
  };

  withCriteria.forEach(row => {
    totals.helpfulness += safeParseNumber(row.helpfulness!) || 0;
    totals.relevance += safeParseNumber(row.relevance!) || 0;
    totals.accuracy += safeParseNumber(row.accuracy!) || 0;
    totals.depth += safeParseNumber(row.depth!) || 0;
    totals.levelOfDetail += safeParseNumber(row.level_of_detail!) || 0;
  });

  const count = withCriteria.length;
  return {
    helpfulness: totals.helpfulness / count,
    relevance: totals.relevance / count,
    accuracy: totals.accuracy / count,
    depth: totals.depth / count,
    levelOfDetail: totals.levelOfDetail / count
  };
}
