import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { ChartConfiguration, Chart } from 'chart.js';
import { createCanvas } from 'canvas';

// Registrar componentes do Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
  DoughnutController
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
  DoughnutController
);

interface JudgeResult {
  timestamp: string;
  testName: string;
  rating: number;
  status: 'PASS' | 'FAIL';
  prompt: string;
  output: string;
  lineNumber?: number;
  criteria?: {
    helpfulness: number;
    relevance: number;
    accuracy: number;
    depth: number;
    creativity: number;
    levelOfDetail: number;
  };
}

interface GeneratorOptions {
  csvPath: string;
  outputDir: string;
  width: number;
  height: number;
}

export class UnifiedReportGenerator {
  private data: JudgeResult[] = [];
  private errors: JudgeResult[] = [];
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    this.options = options;
  }

  async generateReports(): Promise<void> {
    console.log(`🚀 Loading data from: ${this.options.csvPath}`);
    await this.loadCSVData();
    
    // Criar diretório de saída se não existir
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    console.log(`📊 Generating PNG report...`);
    await this.generatePNGReport();
    
    console.log(`🌐 Generating HTML report...`);
    await this.generateHTMLReport();
    
    console.log(`✅ Both reports generated successfully!`);
    console.log(`   📄 PNG Report: ${path.join(this.options.outputDir, 'llm_judge_report.png')}`);
    console.log(`   🌐 HTML Report: ${path.join(this.options.outputDir, 'llm_judge_report.html')}`);
  }

  private async loadCSVData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const results: JudgeResult[] = [];
      let lineNumber = 1; // Começar em 1 (header)
      
      fs.createReadStream(this.options.csvPath)
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
          if (row.helpfulness || row.relevance || row.accuracy || row.depth || row.creativity || row.level_of_detail) {
            result.criteria = {
              helpfulness: parseInt(row.helpfulness) || 0,
              relevance: parseInt(row.relevance) || 0,
              accuracy: parseInt(row.accuracy) || 0,
              depth: parseInt(row.depth) || 0,
              creativity: parseInt(row.creativity) || 0,
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

  private async generatePNGReport(): Promise<void> {
    const canvas = createCanvas(this.options.width * 1.5, this.options.height * 2.5);
    const ctx = canvas.getContext('2d');

    // Fundo dark
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LLM Judge System - Test Results', canvas.width / 2, 50);

    // Estatísticas
    const stats = this.calculateStats();
    const statBoxes = [
      { label: 'Total Tests', value: stats.totalTests.toString(), color: '#2563eb' },
      { label: 'Success Rate', value: `${stats.successRate}%`, color: '#10b981' },
      { label: 'Average Rating', value: stats.avgRating.toFixed(1), color: '#f59e0b' },
      { label: 'Range', value: `${stats.minRating}-${stats.maxRating}`, color: '#8b5cf6' }
    ];

    this.drawStatBoxes(ctx, statBoxes);

    // Gráficos verticais
    const chartWidth = canvas.width - 100;
    const chartHeight = Math.floor((canvas.height - 450) / 3);
    const chartSpacing = 30;
    const chartStartX = 50;
    let currentY = 220;

    // Distribution
    const distributionCanvas = createCanvas(chartWidth, chartHeight);
    const distributionChart = new Chart(distributionCanvas.getContext('2d') as any, this.createDistributionConfig());
    ctx.drawImage(distributionCanvas, chartStartX, currentY);
    distributionChart.destroy();
    currentY += chartHeight + chartSpacing;

    // Trend
    const trendCanvas = createCanvas(chartWidth, chartHeight);
    const trendChart = new Chart(trendCanvas.getContext('2d') as any, this.createTrendConfig());
    ctx.drawImage(trendCanvas, chartStartX, currentY);
    trendChart.destroy();
    currentY += chartHeight + chartSpacing;

    // Status
    const statusCanvas = createCanvas(chartWidth, chartHeight);
    const statusChart = new Chart(statusCanvas.getContext('2d') as any, this.createStatusConfig());
    ctx.drawImage(statusCanvas, chartStartX, currentY);
    statusChart.destroy();

    // Rodapé
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Generated on: ${new Date().toLocaleString('en-US')} | Total Records: ${stats.totalTests}`, canvas.width / 2, canvas.height - 30);

    // Salvar PNG
    const buffer = canvas.toBuffer('image/png');
    const filePath = path.join(this.options.outputDir, 'llm_judge_report.png');
    fs.writeFileSync(filePath, buffer);
  }

  private async generateHTMLReport(): Promise<void> {
    const stats = this.calculateStats();
    const ratingCounts = this.getRatingCounts();
    const statusCounts = this.getStatusCounts();
    const { testLabels, testNames, ratings } = this.getTrendData();
    const criteriaAverages = this.calculateCriteriaAverages();
    const criteriaDistribution = this.getCriteriaDistribution();
    const criteriaTrend = this.getCriteriaTrend();
    const errorStats = this.getErrorStats();

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LLM Judge System - Test Results</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body { background-color: #1a1a1a; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; margin: 0; color: #ffffff; font-weight: bold; }
        .stats-container { display: flex; justify-content: center; gap: 20px; margin-bottom: 40px; flex-wrap: wrap; }
        .stat-box { background: linear-gradient(135deg, var(--bg-color), var(--bg-color-dark)); padding: 20px; border-radius: 12px; text-align: center; min-width: 150px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); }
        .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 0.9em; opacity: 0.9; }
        .chart-container { margin-bottom: 40px; background: #262626; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .chart-title { text-align: center; font-size: 1.4em; margin-bottom: 20px; color: #ffffff; font-weight: bold; }
        .footer { text-align: center; color: #9ca3af; font-size: 0.9em; margin-top: 30px; }
        .error-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.85em; }
        .error-table th, .error-table td { padding: 8px; text-align: left; border-bottom: 1px solid #374151; vertical-align: top; }
        .error-table th { background: #1f2937; color: #f9fafb; font-weight: bold; }
        .error-table td { background: #111827; }
        .error-message { max-width: 200px; word-wrap: break-word; font-size: 0.8em; }
        .error-line { color: #fbbf24; font-weight: bold; }
        .error-test { color: #60a5fa; font-weight: bold; }
        .clickable { cursor: pointer; transition: transform 0.2s ease; }
        .clickable:hover { transform: scale(1.05); }
        .error-page { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #1a1a1a; z-index: 1000; overflow-y: auto; padding: 20px; }
        .error-page.active { display: block; }
        .back-button { background: #374151; color: #ffffff; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1em; margin-bottom: 20px; }
        .back-button:hover { background: #4b5563; }
    </style>
</head>
<body>
    <div class="header"><h1>LLM Judge System - Test Results</h1></div>
    <div class="stats-container">
        <div class="stat-box" style="--bg-color: #2563eb; --bg-color-dark: #1d4ed8;"><div class="stat-value">${stats.totalTests}</div><div class="stat-label">Total Tests</div></div>
        <div class="stat-box" style="--bg-color: #10b981; --bg-color-dark: #059669;"><div class="stat-value">${stats.successRate}%</div><div class="stat-label">Success Rate</div></div>
        <div class="stat-box" style="--bg-color: #f59e0b; --bg-color-dark: #d97706;"><div class="stat-value">${stats.avgRating.toFixed(1)}</div><div class="stat-label">Average Rating</div></div>
        <div class="stat-box" style="--bg-color: #8b5cf6; --bg-color-dark: #7c3aed;"><div class="stat-value">${stats.minRating}-${stats.maxRating}</div><div class="stat-label">Range</div></div>
        ${errorStats ? '<div class="stat-box clickable" style="--bg-color: #ef4444; --bg-color-dark: #dc2626;" onclick="showErrorPage()"><div class="stat-value">' + errorStats.totalErrors + '</div><div class="stat-label">Errors</div></div>' : ''}
    </div>
    <div class="chart-container"><div class="chart-title">Rating Distribution</div><div id="distributionChart"></div></div>
    <div class="chart-container"><div class="chart-title">PASS/FAIL Ratio</div><div id="statusChart"></div></div>
    <div class="chart-container"><div class="chart-title">Recent Performance Trend</div><div id="trendChart"></div></div>
    ${criteriaTrend ? '<div class="chart-container"><div class="chart-title">📈 Criteria Trends</div><div id="criteriaTrendChart"></div></div>' : ''}
    ${criteriaAverages ? '<div class="chart-container"><div class="chart-title">Criteria Average Scores</div><div id="criteriaChart"></div></div>' : ''}
    ${criteriaAverages ? '<div class="chart-container"><div class="chart-title">Criteria Breakdown</div><div id="criteriaBarChart"></div></div>' : ''}
    ${criteriaDistribution ? '<div class="chart-container"><div class="chart-title">📊 Criteria Distribution (Min/Avg/Max)</div><div id="criteriaDistChart"></div></div>' : ''}
    <div class="footer">Generated on: ${new Date().toLocaleString('en-US')} | Total Records: ${stats.totalTests}</div>
    
    <!-- Página separada de erros -->
    ${errorStats ? '<div id="errorPage" class="error-page"><button class="back-button" onclick="hideErrorPage()">← Back to Dashboard</button><div class="header"><h1>❌ Error Analysis</h1><p style="color: #9ca3af;">Found ' + errorStats.totalErrors + ' errors (' + errorStats.errorRate + '% error rate)</p></div><div class="chart-container" style="border: 2px solid #ef4444;"><div class="chart-title">📊 Error Categories</div><div id="errorChartPage"></div></div><div class="chart-container"><div class="chart-title">📋 Complete Error Details</div><table class="error-table"><thead><tr><th>Line</th><th>Time</th><th>Test Name</th><th>Prompt</th><th>Full Error Message</th></tr></thead><tbody>' + errorStats.errorDetails.map(err => '<tr><td class="error-line">' + err.lineNumber + '</td><td>' + err.timestamp + '</td><td class="error-test">' + err.testName + '</td><td class="error-message">' + err.prompt + '</td><td class="error-message">' + err.fullMessage + '</td></tr>').join('') + '</tbody></table></div></div>' : ''}
    <script>
        const darkLayout = { paper_bgcolor: '#262626', plot_bgcolor: '#1a1a1a', font: { color: '#ffffff' }, xaxis: { gridcolor: '#374151', zerolinecolor: '#374151', color: '#d1d5db' }, yaxis: { gridcolor: '#374151', zerolinecolor: '#374151', color: '#d1d5db' } };
        const config = { responsive: true, displayModeBar: true, modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d'], displaylogo: false };
        
        Plotly.newPlot('distributionChart', [{x: ['0','1','2','3','4','5','6','7','8','9','10'], y: ${JSON.stringify(ratingCounts)}, type: 'bar', marker: {color: '#10b981', line: {color: '#059669', width: 2}}, hovertemplate: 'Rating: %{x}<br>Count: %{y}<extra></extra>'}], {...darkLayout, xaxis: {...darkLayout.xaxis, title: 'Rating'}, yaxis: {...darkLayout.yaxis, title: 'Count'}, margin: {l: 60, r: 40, t: 40, b: 60}}, config);
        
        Plotly.newPlot('statusChart', [{labels: ${JSON.stringify(Object.keys(statusCounts))}, values: ${JSON.stringify(Object.values(statusCounts))}, type: 'pie', hole: 0.4, marker: {colors: ['#10b981', '#ef4444'], line: {color: '#ffffff', width: 2}}, textfont: {color: '#ffffff', size: 14}, hovertemplate: '%{label}: %{value}<br>%{percent}<extra></extra>'}], {...darkLayout, margin: {l: 40, r: 40, t: 40, b: 40}, showlegend: true, legend: {font: {color: '#d1d5db'}, orientation: 'h', x: 0.5, xanchor: 'center', y: -0.1}}, config);
        
        Plotly.newPlot('trendChart', [{x: ${JSON.stringify(testLabels.slice(-50))}, y: ${JSON.stringify(ratings.slice(-50))}, customdata: ${JSON.stringify(testNames.slice(-50))}, type: 'scatter', mode: 'lines+markers', line: {color: '#f59e0b', width: 3}, marker: {color: '#f59e0b', size: 8, line: {color: '#d97706', width: 2}}, hovertemplate: '<b>%{x}</b><br><span style="color:#f59e0b">🎯 Rating: %{y}/10</span><br><span style="color:#60a5fa">📋 %{customdata}</span><extra></extra>', hoverlabel: {bgcolor: '#1f2937', bordercolor: '#f59e0b', font: {color: '#ffffff', size: 12}}}], {...darkLayout, xaxis: {...darkLayout.xaxis, title: 'Test Sequence (Last 50)'}, yaxis: {...darkLayout.yaxis, title: 'Rating', range: [0, 10]}, margin: {l: 60, r: 40, t: 40, b: 80}}, config);
        
        ${criteriaAverages ? `
        Plotly.newPlot('criteriaChart', [{
            type: 'scatterpolar',
            r: [${criteriaAverages.helpfulness}, ${criteriaAverages.relevance}, ${criteriaAverages.accuracy}, ${criteriaAverages.depth}, ${criteriaAverages.creativity}, ${criteriaAverages.levelOfDetail}],
            theta: ['Helpfulness', 'Relevance', 'Accuracy', 'Depth', 'Creativity', 'Level of Detail'],
            fill: 'toself',
            fillcolor: 'rgba(16, 185, 129, 0.2)',
            line: { color: '#10b981', width: 3 },
            marker: { color: '#10b981', size: 8, line: { color: '#059669', width: 2 } },
            hovertemplate: '%{theta}: %{r}<extra></extra>'
        }], {
            ...darkLayout,
            polar: {
                radialaxis: {
                    visible: true,
                    range: [0, 10],
                    gridcolor: '#374151',
                    tickcolor: '#d1d5db'
                },
                angularaxis: {
                    tickcolor: '#d1d5db',
                    gridcolor: '#374151'
                },
                bgcolor: 'rgba(0,0,0,0)'
            },
            margin: { l: 60, r: 60, t: 40, b: 40 }
        }, config);` : ''}
        
        ${criteriaAverages ? `
        Plotly.newPlot('criteriaBarChart', [{
            x: ['Helpfulness', 'Relevance', 'Accuracy', 'Depth', 'Creativity', 'Level of Detail'],
            y: [${criteriaAverages.helpfulness}, ${criteriaAverages.relevance}, ${criteriaAverages.accuracy}, ${criteriaAverages.depth}, ${criteriaAverages.creativity}, ${criteriaAverages.levelOfDetail}],
            type: 'bar',
            marker: {color: '#8b5cf6', line: {color: '#7c3aed', width: 2}},
            hovertemplate: '%{x}: %{y}/10<extra></extra>'
        }], {
            ...darkLayout,
            xaxis: {...darkLayout.xaxis, title: 'Criteria'},
            yaxis: {...darkLayout.yaxis, title: 'Average Score', range: [0, 10]},
            margin: {l: 60, r: 40, t: 40, b: 80}
        }, config);` : ''}
        
        ${criteriaDistribution ? `
        Plotly.newPlot('criteriaDistChart', [
            {
                x: ['Helpfulness', 'Relevance', 'Accuracy', 'Depth', 'Creativity', 'Level of Detail'],
                y: [${criteriaDistribution.map(c => c.min).join(', ')}],
                name: 'Minimum',
                type: 'bar',
                marker: {color: '#ef4444'}
            },
            {
                x: ['Helpfulness', 'Relevance', 'Accuracy', 'Depth', 'Creativity', 'Level of Detail'],
                y: [${criteriaDistribution.map(c => c.avg).join(', ')}],
                name: 'Average',
                type: 'bar',
                marker: {color: '#10b981'}
            },
            {
                x: ['Helpfulness', 'Relevance', 'Accuracy', 'Depth', 'Creativity', 'Level of Detail'],
                y: [${criteriaDistribution.map(c => c.max).join(', ')}],
                name: 'Maximum',
                type: 'bar',
                marker: {color: '#f59e0b'}
            }
        ], {
            ...darkLayout,
            xaxis: {...darkLayout.xaxis, title: 'Criteria'},
            yaxis: {...darkLayout.yaxis, title: 'Score', range: [0, 10]},
            margin: {l: 60, r: 40, t: 40, b: 80},
            barmode: 'group'
        }, config);` : ''}
        
        ${criteriaTrend ? `
        Plotly.newPlot('criteriaTrendChart', [
            {
                x: ${JSON.stringify(criteriaTrend.testLabels)},
                y: ${JSON.stringify(criteriaTrend.criteria.helpfulness)},
                name: 'Helpfulness',
                type: 'scatter',
                mode: 'lines+markers',
                line: {color: '#10b981', width: 2},
                hovertemplate: 'Helpfulness: %{y}/10<extra></extra>'
            },
            {
                x: ${JSON.stringify(criteriaTrend.testLabels)},
                y: ${JSON.stringify(criteriaTrend.criteria.relevance)},
                name: 'Relevance',
                type: 'scatter',
                mode: 'lines+markers',
                line: {color: '#f59e0b', width: 2},
                hovertemplate: 'Relevance: %{y}/10<extra></extra>'
            },
            {
                x: ${JSON.stringify(criteriaTrend.testLabels)},
                y: ${JSON.stringify(criteriaTrend.criteria.accuracy)},
                name: 'Accuracy',
                type: 'scatter',
                mode: 'lines+markers',
                line: {color: '#8b5cf6', width: 2},
                hovertemplate: 'Accuracy: %{y}/10<extra></extra>'
            },
            {
                x: ${JSON.stringify(criteriaTrend.testLabels)},
                y: ${JSON.stringify(criteriaTrend.criteria.depth)},
                name: 'Depth',
                type: 'scatter',
                mode: 'lines+markers',
                line: {color: '#ef4444', width: 2},
                hovertemplate: 'Depth: %{y}/10<extra></extra>'
            },
            {
                x: ${JSON.stringify(criteriaTrend.testLabels)},
                y: ${JSON.stringify(criteriaTrend.criteria.creativity)},
                name: 'Creativity',
                type: 'scatter',
                mode: 'lines+markers',
                line: {color: '#06b6d4', width: 2},
                hovertemplate: 'Creativity: %{y}/10<extra></extra>'
            },
            {
                x: ${JSON.stringify(criteriaTrend.testLabels)},
                y: ${JSON.stringify(criteriaTrend.criteria.levelOfDetail)},
                name: 'Level of Detail',
                type: 'scatter',
                mode: 'lines+markers',
                line: {color: '#84cc16', width: 2},
                hovertemplate: 'Level of Detail: %{y}/10<extra></extra>'
            }
        ], {
            ...darkLayout,
            xaxis: {...darkLayout.xaxis, title: 'Test Sequence'},
            yaxis: {...darkLayout.yaxis, title: 'Score', range: [0, 10]},
            margin: {l: 60, r: 40, t: 40, b: 80},
            legend: {font: {color: '#d1d5db'}, orientation: 'h', x: 0.5, xanchor: 'center', y: -0.2},
            hovermode: 'x unified'
        }, config);` : ''}
        
        
        // Funções para navegação entre páginas
        function showErrorPage() {
            document.getElementById('errorPage').classList.add('active');
            
            // Gerar gráfico de erros na página separada
            ${errorStats ? `
            Plotly.newPlot('errorChartPage', [{
                x: ${JSON.stringify(errorStats.errorTypes)},
                y: ${JSON.stringify(errorStats.errorCounts)},
                customdata: ${JSON.stringify(errorStats.errorExamples)},
                type: 'bar',
                marker: {color: '#ef4444', line: {color: '#dc2626', width: 2}},
                hovertemplate: '<b>%{x}</b><br>Count: %{y}<br><br><i>Example Error:</i><br>%{customdata}<extra></extra>',
                hoverlabel: {bgcolor: '#1f2937', bordercolor: '#ef4444', font: {color: '#ffffff', size: 10}, namelength: -1}
            }], {
                ...darkLayout,
                xaxis: {...darkLayout.xaxis, title: 'Error Types'},
                yaxis: {...darkLayout.yaxis, title: 'Count'},
                margin: {l: 60, r: 40, t: 40, b: 100}
            }, config);` : ''}
        }
        
        function hideErrorPage() {
            document.getElementById('errorPage').classList.remove('active');
        }
    </script>
</body>
</html>`;

    const filePath = path.join(this.options.outputDir, 'llm_judge_report.html');
    fs.writeFileSync(filePath, htmlContent, 'utf8');
  }

  private calculateStats() {
    const totalTests = this.data.length + this.errors.length; // Incluir erros no total
    const passCount = this.data.filter(item => item.status === 'PASS').length;
    const avgRating = this.data.length > 0 ? this.data.reduce((sum, item) => sum + item.rating, 0) / this.data.length : 0;
    const successRate = (passCount / totalTests * 100).toFixed(1);
    const maxRating = this.data.length > 0 ? Math.max(...this.data.map(item => item.rating)) : 0;
    const minRating = this.data.length > 0 ? Math.min(...this.data.map(item => item.rating)) : 0;
    return { totalTests, passCount, avgRating, successRate, maxRating, minRating };
  }

  private getErrorStats() {
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

  private calculateCriteriaAverages() {
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
        totals.creativity += item.criteria.creativity;
        totals.levelOfDetail += item.criteria.levelOfDetail;
      }
    });
    
    const count = dataWithCriteria.length;
    return {
      helpfulness: (totals.helpfulness / count).toFixed(1),
      relevance: (totals.relevance / count).toFixed(1),
      accuracy: (totals.accuracy / count).toFixed(1),
      depth: (totals.depth / count).toFixed(1),
      creativity: (totals.creativity / count).toFixed(1),
      levelOfDetail: (totals.levelOfDetail / count).toFixed(1)
    };
  }

  private getCriteriaDistribution() {
    const dataWithCriteria = this.data.filter(item => item.criteria);
    if (dataWithCriteria.length === 0) return null;
    
    const criteriaNames = ['helpfulness', 'relevance', 'accuracy', 'depth', 'creativity', 'levelOfDetail'];
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
        creativity: 'Creativity',
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

  private getCriteriaTrend() {
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
      creativity: recent.map(item => item.criteria!.creativity),
      levelOfDetail: recent.map(item => item.criteria!.levelOfDetail)
    };
    
    return { testLabels, testNames, criteria };
  }

  private getRatingCounts() {
    const ratingCounts = new Array(11).fill(0);
    this.data.forEach(item => {
      if (item.rating >= 0 && item.rating <= 10) ratingCounts[item.rating]++;
    });
    return ratingCounts;
  }

  private getStatusCounts() {
    return this.data.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTrendData() {
    const sortedData = [...this.data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const testLabels = sortedData.map((_, index) => `Test ${index + 1}`);
    const testNames = sortedData.map(item => item.testName); // ADICIONAR NOMES REAIS
    const ratings = sortedData.map(item => item.rating);
    return { testLabels, testNames, ratings };
  }

  private drawStatBoxes(ctx: any, statBoxes: any[]) {
    const boxWidth = 200;
    const boxHeight = 100;
    const startX = (ctx.canvas.width - (statBoxes.length * boxWidth + (statBoxes.length - 1) * 30)) / 2;
    
    statBoxes.forEach((stat, index) => {
      const x = startX + index * (boxWidth + 30);
      const y = 80;
      
      ctx.fillStyle = stat.color;
      ctx.fillRect(x, y, boxWidth, boxHeight);
      ctx.strokeStyle = stat.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, boxWidth, boxHeight);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(stat.value, x + boxWidth / 2, y + 45);
      ctx.font = 'bold 16px Arial';
      ctx.fillText(stat.label, x + boxWidth / 2, y + 70);
    });
  }

  private createDistributionConfig(): ChartConfiguration {
    const ratingCounts = this.getRatingCounts();
    return {
      type: 'bar',
      data: {
        labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        datasets: [{ label: 'Count', data: ratingCounts, backgroundColor: '#10b981', borderColor: '#059669', borderWidth: 1 }]
      },
      options: {
        responsive: false,
        plugins: { title: { display: true, text: 'Rating Distribution', font: { size: 16, weight: 'bold' }, color: '#ffffff' }, legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#d1d5db' }, title: { display: true, text: 'Count', color: '#d1d5db' } }, x: { title: { display: true, text: 'Rating', color: '#d1d5db' }, grid: { color: '#374151' }, ticks: { color: '#d1d5db' } } }
      }
    };
  }

  private createTrendConfig(): ChartConfiguration {
    const { testLabels, ratings } = this.getTrendData();
    return {
      type: 'line',
      data: {
        labels: testLabels.slice(-20),
        datasets: [{ label: 'Performance Trend', data: ratings.slice(-20), borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', tension: 0.3, pointBackgroundColor: '#f59e0b', pointBorderColor: '#d97706', pointRadius: 4, pointHoverRadius: 6 }]
      },
      options: {
        responsive: false,
        plugins: { title: { display: true, text: 'Recent Performance Trend', font: { size: 16, weight: 'bold' }, color: '#ffffff' }, legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 10, grid: { color: '#374151' }, ticks: { color: '#d1d5db' }, title: { display: true, text: 'Rating', color: '#d1d5db' } }, x: { ticks: { maxTicksLimit: 10, color: '#d1d5db' }, grid: { color: '#374151' }, title: { display: true, text: 'Test Sequence', color: '#d1d5db' } } }
      }
    };
  }

  private createStatusConfig(): ChartConfiguration {
    const statusCounts = this.getStatusCounts();
    return {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#10b981', '#ef4444'], borderColor: ['#059669', '#dc2626'], borderWidth: 3 }]
      },
      options: {
        responsive: false,
        plugins: { title: { display: true, text: 'PASS/FAIL Ratio', font: { size: 16, weight: 'bold' }, color: '#ffffff' }, legend: { display: true, position: 'bottom', labels: { color: '#d1d5db' } } }
      }
    };
  }
}
