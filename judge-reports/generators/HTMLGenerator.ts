import * as fs from 'fs';
import * as path from 'path';
import { BaseGenerator } from '../core/BaseGenerator';
import { ProcessedData, ReportStats, ErrorStats, CriteriaAverages, CriteriaTrend, CriteriaDistribution } from '../core/ReportData';

export class HTMLGenerator extends BaseGenerator {
  async generate(data: ProcessedData): Promise<string> {
    this.ensureOutputDir();
    
    console.log(`🌐 Generating HTML report...`);
    
    const htmlContent = this.buildHTML(data);
    const filePath = path.join(this.options.outputDir, 'llm_judge_report.html');
    
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    console.log(`✅ HTML Report generated: ${filePath}`);
    
    return filePath;
  }

  private buildHTML(data: ProcessedData): string {
    const { stats, ratingCounts, statusCounts, trendData, criteriaAverages, criteriaDistribution, criteriaTrend, errorStats, ratingGroups = [], testDetails = [] } = data;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LLM Judge System - Test Results</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        ${this.getEnhancedCSS()}
    </style>
</head>
<body>
    <!-- PÁGINA PRINCIPAL -->
    <div id="mainPage" class="page active">
        ${this.getMainPageHTML(stats, errorStats, criteriaAverages, criteriaTrend, criteriaDistribution)}
    </div>
    
    <!-- PÁGINA DE TESTES POR RATING -->
    <div id="testsPage" class="page">
        ${this.getTestsPageHTML()}
    </div>
    
    <!-- PÁGINA DE DETALHES DO TESTE -->
    <div id="testDetailPage" class="page">
        ${this.getTestDetailPageHTML()}
    </div>
    
    ${errorStats ? `<div id="errorPage" class="error-page"><button class="back-button" onclick="hideErrorPage()">← Back to Dashboard</button><div class="header"><h1>❌ Error Analysis</h1><p style="color: #9ca3af;">Found ${errorStats.totalErrors} errors (${errorStats.errorRate}% error rate)</p></div><div class="chart-container" style="border: 2px solid #ef4444;"><div class="chart-title">📊 Error Categories</div><div id="errorChartPage"></div></div><div class="chart-container"><div class="chart-title">📋 Complete Error Details</div><table class="error-table"><thead><tr><th>Line</th><th>Time</th><th>Test Name</th><th>Prompt</th><th>Full Error Message</th></tr></thead><tbody>${errorStats.errorDetails.map(err => `<tr><td class="error-line">${err.lineNumber}</td><td>${err.timestamp}</td><td class="error-test">${err.testName}</td><td class="error-message">${err.prompt}</td><td class="error-message">${err.fullMessage}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
    
    <script>
        ${this.getEnhancedJavaScript(data, ratingCounts, statusCounts, trendData, criteriaAverages, criteriaTrend, criteriaDistribution, errorStats)}
    </script>
</body>
</html>`;
  }

  private getEnhancedCSS(): string {
    return `
        body { background-color: #1a1a1a; color: #ffffff; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; }
        
        /* Sistema de páginas */
        .page { display: none; }
        .page.active { display: block; }
        
        /* Styling existente */
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; margin: 0; color: #ffffff; font-weight: bold; }
        .stats-container { display: flex; justify-content: center; gap: 20px; margin-bottom: 40px; flex-wrap: wrap; }
        .stat-box { background: linear-gradient(135deg, var(--bg-color), var(--bg-color-dark)); padding: 20px; border-radius: 12px; text-align: center; min-width: 150px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); }
        .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 0.9em; opacity: 0.9; }
        .chart-container { margin-bottom: 40px; background: #262626; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .chart-title { text-align: center; font-size: 1.4em; margin-bottom: 20px; color: #ffffff; font-weight: bold; }
        .footer { text-align: center; color: #9ca3af; font-size: 0.9em; margin-top: 30px; }
        
        /* Tabela de erro existente */
        .error-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.85em; }
        .error-table th, .error-table td { padding: 8px; text-align: left; border-bottom: 1px solid #374151; vertical-align: top; }
        .error-table th { background: #1f2937; color: #f9fafb; font-weight: bold; }
        .error-table td { background: #111827; }
        .error-message { max-width: 200px; word-wrap: break-word; font-size: 0.8em; }
        .error-line { color: #fbbf24; font-weight: bold; }
        .error-test { color: #60a5fa; font-weight: bold; }
        .error-page { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #1a1a1a; z-index: 1000; overflow-y: auto; padding: 20px; }
        .error-page.active { display: block; }
        
        /* Botão de voltar */
        .back-button { background: #374151; color: #ffffff; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1em; margin-bottom: 20px; transition: background 0.3s; }
        .back-button:hover { background: #4b5563; }
        
        /* Grid de testes */
        .tests-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; margin-top: 20px; }
        .test-card { background: #2d3748; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s ease; border: 2px solid transparent; }
        .test-card:hover { transform: translateY(-5px); border-color: #4299e1; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .test-card.pass { border-left: 4px solid #48bb78; }
        .test-card.fail { border-left: 4px solid #f56565; }
        .test-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .test-name { font-weight: bold; color: #e2e8f0; }
        .test-rating { background: #4299e1; color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 0.9em; }
        .test-card-meta { display: flex; gap: 10px; margin-bottom: 10px; }
        .test-status { padding: 2px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .test-status.pass { background: #48bb78; color: #fff; }
        .test-status.fail { background: #f56565; color: #fff; }
        .test-time { font-size: 0.8em; color: #a0aec0; }
        .test-preview { font-size: 0.9em; color: #cbd5e0; line-height: 1.4; }
        
        /* Detalhes do teste */
        .test-detail-container { max-width: 1200px; margin: 0 auto; }
        .test-header { text-align: center; margin-bottom: 30px; }
        .test-meta { display: flex; justify-content: center; gap: 20px; margin-top: 15px; }
        .test-section { margin-bottom: 30px; }
        .test-section h3 { color: #4299e1; margin-bottom: 15px; font-size: 1.2em; }
        .content-box { background: #2d3748; padding: 20px; border-radius: 8px; white-space: pre-wrap; font-family: 'Courier New', monospace; border: 1px solid #4a5568; }
        
        /* Critérios visuais */
        .criteria-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .criteria-item { background: #2d3748; padding: 15px; border-radius: 8px; border: 1px solid #4a5568; }
        .criteria-name { display: block; color: #e2e8f0; font-weight: bold; margin-bottom: 8px; }
        .criteria-value { color: #4299e1; font-weight: bold; float: right; }
        .criteria-bar { width: 100%; height: 8px; background: #4a5568; border-radius: 4px; overflow: hidden; margin-top: 8px; clear: both; }
        .criteria-fill { height: 100%; background: linear-gradient(90deg, #f56565, #ed8936, #ecc94b, #48bb78, #38b2ac); transition: width 0.3s ease; }
        
        .clickable { cursor: pointer; transition: transform 0.2s ease; }
        .clickable:hover { transform: scale(1.05); }
    `;
  }

  private getMainPageHTML(stats: ReportStats, errorStats: ErrorStats | null, criteriaAverages: any, criteriaTrend: any, criteriaDistribution: any): string {
    return `
      <div class="header"><h1>LLM Judge System - Test Results</h1></div>
      
      <div class="stats-container">
          <div class="stat-box" style="--bg-color: #2563eb; --bg-color-dark: #1d4ed8;">
              <div class="stat-value">${stats.totalTests}</div>
              <div class="stat-label">Total Tests</div>
          </div>
          <div class="stat-box" style="--bg-color: #10b981; --bg-color-dark: #059669;">
              <div class="stat-value">${stats.successRate}%</div>
              <div class="stat-label">Success Rate</div>
          </div>
          <div class="stat-box" style="--bg-color: #f59e0b; --bg-color-dark: #d97706;">
              <div class="stat-value">${stats.avgRating.toFixed(1)}</div>
              <div class="stat-label">Average Rating</div>
          </div>
          <div class="stat-box" style="--bg-color: #8b5cf6; --bg-color-dark: #7c3aed;">
              <div class="stat-value">${stats.minRating.toFixed(1)}-${stats.maxRating.toFixed(1)}</div>
              <div class="stat-label">Range</div>
          </div>
          ${errorStats ? `<div class="stat-box clickable" style="--bg-color: #ef4444; --bg-color-dark: #dc2626;" onclick="showErrorPage()"><div class="stat-value">${errorStats.totalErrors}</div><div class="stat-label">Errors</div></div>` : ''}
      </div>
      
      <div class="chart-container">
          <div class="chart-title">📊 Rating Distribution (Clique nas barras para ver detalhes)</div>
          <div id="distributionChart"></div>
      </div>
      
      <div class="chart-container"><div class="chart-title">PASS/FAIL Ratio</div><div id="statusChart"></div></div>
      <div class="chart-container"><div class="chart-title">Recent Performance Trend</div><div id="trendChart"></div></div>
      ${criteriaTrend ? '<div class="chart-container"><div class="chart-title">📈 Criteria Trends</div><div id="criteriaTrendChart"></div></div>' : ''}
      ${criteriaAverages ? '<div class="chart-container"><div class="chart-title">Criteria Average Scores</div><div id="criteriaChart"></div></div>' : ''}
      ${criteriaAverages ? '<div class="chart-container"><div class="chart-title">Criteria Breakdown</div><div id="criteriaBarChart"></div></div>' : ''}
      ${criteriaDistribution ? '<div class="chart-container"><div class="chart-title">📊 Criteria Distribution (Min/Avg/Max)</div><div id="criteriaDistChart"></div></div>' : ''}
      <div class="footer">Generated on: ${new Date().toLocaleString('pt-BR')} | Total Records: ${stats.totalTests}</div>
    `;
  }

  private getTestsPageHTML(): string {
    return `
      <button class="back-button" onclick="showMainPage()">← Voltar ao Dashboard</button>
      <div class="header">
          <h2 id="testsPageTitle">Testes com Rating X.X</h2>
      </div>
      
      <div class="tests-container">
          <div id="testsGrid" class="tests-grid">
              <!-- Será populado pelo JavaScript -->
          </div>
      </div>
    `;
  }

  private getTestDetailPageHTML(): string {
    return `
      <button class="back-button" onclick="showTestsPage()">← Voltar aos Testes</button>
      
      <div class="test-detail-container">
          <div class="test-header">
              <h2 id="testDetailTitle"></h2>
              <div class="test-meta">
                  <span class="test-rating"></span>
                  <span class="test-status"></span>
                  <span class="test-timestamp"></span>
              </div>
          </div>
          
          <div class="test-content">
              <div class="test-section">
                  <h3>📝 Prompt</h3>
                  <div id="testPrompt" class="content-box"></div>
              </div>
              
              <div class="test-section">
                  <h3>🤖 Resposta</h3>
                  <div id="testOutput" class="content-box"></div>
              </div>
              
              <div class="test-section" id="criteriaSection">
                  <h3>📊 Critérios de Avaliação</h3>
                  <div id="testCriteria" class="criteria-grid"></div>
              </div>
          </div>
      </div>
    `;
  }

  private getEnhancedJavaScript(data: ProcessedData, ratingCounts: number[], statusCounts: Record<string, number>, trendData: any, criteriaAverages: any, criteriaTrend: any, criteriaDistribution: any, errorStats: any): string {
    const { ratingGroups = [], testDetails = [] } = data;

    return `
      // Dados globais
      const ratingGroups = ${JSON.stringify(ratingGroups)};
      const testDetails = ${JSON.stringify(testDetails)};
      
      // Configurações do gráfico
      const darkLayout = { paper_bgcolor: '#262626', plot_bgcolor: '#1a1a1a', font: { color: '#ffffff' }, xaxis: { gridcolor: '#374151', zerolinecolor: '#374151', color: '#d1d5db' }, yaxis: { gridcolor: '#374151', zerolinecolor: '#374151', color: '#d1d5db' } };
      const config = { responsive: true, displayModeBar: true, modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d'], displaylogo: false };
      
      // Gráfico interativo de distribuição
      function createInteractiveRatingChart() {
          const chartData = {
              x: ratingGroups.map(g => parseFloat(g.rating)),
              y: ratingGroups.map(g => g.count),
              type: 'bar',
              marker: {
                  color: ratingGroups.map(g => g.count > 0 ? '#10b981' : '#6b7280'),
                  line: {color: '#059669', width: 2}
              },
              hovertemplate: 'Rating: %{x:.1f}<br>Testes: %{y}<br><b>Clique para ver detalhes</b><extra></extra>',
              customdata: ratingGroups.map(g => g.rating)
          };

          const layout = {
              ...darkLayout,
              xaxis: {
                  ...darkLayout.xaxis,
                  title: 'Rating (com decimais)',
                  tickformat: '.1f',
                  dtick: 0.5
              },
              yaxis: {...darkLayout.yaxis, title: 'Quantidade de Testes'},
              margin: {l: 60, r: 40, t: 40, b: 60}
          };

          Plotly.newPlot('distributionChart', [chartData], layout, config);
          
          // Evento de clique nas barras
          document.getElementById('distributionChart').on('plotly_click', function(data) {
              const rating = data.points[0].customdata;
              showTestsForRating(rating);
          });
      }
      
      // Navegação entre páginas
      function showPage(pageId) {
          document.querySelectorAll('.page').forEach(page => {
              page.classList.remove('active');
          });
          document.getElementById(pageId).classList.add('active');
      }
      
      function showMainPage() { showPage('mainPage'); }
      function showTestsPage() { showPage('testsPage'); }
      
      // Mostrar testes para um rating específico
      function showTestsForRating(rating) {
          const ratingGroup = ratingGroups.find(g => g.rating === rating);
          if (!ratingGroup) return;
          
          document.getElementById('testsPageTitle').textContent = \`Testes com Rating \${rating} (\${ratingGroup.count} testes)\`;
          
          const testsGrid = document.getElementById('testsGrid');
          testsGrid.innerHTML = ratingGroup.tests.map(test => \`
              <div class="test-card \${test.status.toLowerCase()}" onclick="showTestDetail('\${test.testName}', '\${test.timestamp}')">
                  <div class="test-card-header">
                      <span class="test-name">\${test.testName}</span>
                      <span class="test-rating">\${parseFloat(test.rating).toFixed(1)}/10</span>
                  </div>
                  <div class="test-card-meta">
                      <span class="test-status \${test.status.toLowerCase()}">\${test.status}</span>
                      <span class="test-time">\${new Date(test.timestamp).toLocaleString('pt-BR')}</span>
                  </div>
                  <div class="test-preview">
                      \${test.prompt.substring(0, 100)}...
                  </div>
              </div>
          \`).join('');
          
          showPage('testsPage');
      }
      
      // Mostrar detalhes do teste
      function showTestDetail(testName, timestamp) {
          const test = testDetails.find(t => 
              t.testName === testName && t.timestamp === timestamp
          );
          if (!test) return;
          
          // Preencher dados do teste
          document.getElementById('testDetailTitle').textContent = test.testName;
          document.querySelector('.test-rating').textContent = \`\${parseFloat(test.rating).toFixed(1)}/10\`;
          document.querySelector('.test-status').textContent = test.status;
          document.querySelector('.test-timestamp').textContent = new Date(test.timestamp).toLocaleString('pt-BR');
          
          document.getElementById('testPrompt').textContent = test.prompt;
          document.getElementById('testOutput').textContent = test.output;
          
          // Critérios
          if (test.criteria) {
              const criteriaGrid = document.getElementById('testCriteria');
              criteriaGrid.innerHTML = Object.entries(test.criteria)
                  .map(([key, value]) => \`
                      <div class="criteria-item">
                          <span class="criteria-name">\${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                          <span class="criteria-value">\${value}/10</span>
                          <div class="criteria-bar">
                              <div class="criteria-fill" style="width: \${value * 10}%"></div>
                          </div>
                      </div>
                  \`).join('');
          }
          
          showPage('testDetailPage');
      }
      
      // Gráficos existentes
      Plotly.newPlot('statusChart', [{labels: ${JSON.stringify(Object.keys(statusCounts))}, values: ${JSON.stringify(Object.values(statusCounts))}, type: 'pie', hole: 0.4, marker: {colors: ['#10b981', '#ef4444'], line: {color: '#ffffff', width: 2}}, textfont: {color: '#ffffff', size: 14}, hovertemplate: '%{label}: %{value}<br>%{percent}<extra></extra>'}], {...darkLayout, margin: {l: 40, r: 40, t: 40, b: 40}, showlegend: true, legend: {font: {color: '#d1d5db'}, orientation: 'h', x: 0.5, xanchor: 'center', y: -0.1}}, config);
      
      Plotly.newPlot('trendChart', [{x: ${JSON.stringify(trendData.testLabels.slice(-50))}, y: ${JSON.stringify(trendData.ratings.slice(-50))}, customdata: ${JSON.stringify(trendData.testNames.slice(-50))}, type: 'scatter', mode: 'lines+markers', line: {color: '#f59e0b', width: 3}, marker: {color: '#f59e0b', size: 8, line: {color: '#d97706', width: 2}}, hovertemplate: '<b>%{x}</b><br><span style="color:#f59e0b">🎯 Rating: %{y}/10</span><br><span style="color:#60a5fa">📋 %{customdata}</span><extra></extra>', hoverlabel: {bgcolor: '#1f2937', bordercolor: '#f59e0b', font: {color: '#ffffff', size: 12}}}], {...darkLayout, xaxis: {...darkLayout.xaxis, title: 'Test Sequence (Last 50)'}, yaxis: {...darkLayout.yaxis, title: 'Rating', range: [0, 10]}, margin: {l: 60, r: 40, t: 40, b: 80}}, config);
      
      ${criteriaAverages ? `
      Plotly.newPlot('criteriaChart', [{
          type: 'scatterpolar',
          r: [${criteriaAverages.helpfulness}, ${criteriaAverages.relevance}, ${criteriaAverages.accuracy}, ${criteriaAverages.depth}, ${criteriaAverages.levelOfDetail}],
          theta: ['Helpfulness', 'Relevance', 'Accuracy', 'Depth', 'Level of Detail'],
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
      }, config);
      
      Plotly.newPlot('criteriaBarChart', [{
          x: ['Helpfulness', 'Relevance', 'Accuracy', 'Depth', 'Level of Detail'],
          y: [${criteriaAverages.helpfulness}, ${criteriaAverages.relevance}, ${criteriaAverages.accuracy}, ${criteriaAverages.depth}, ${criteriaAverages.levelOfDetail}],
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
              x: ['Helpfulness', 'Relevance', 'Accuracy', 'Depth', 'Level of Detail'],
              y: [${criteriaDistribution.map((c: any) => c.min).join(', ')}],
              name: 'Minimum',
              type: 'bar',
              marker: {color: '#ef4444'}
          },
          {
              x: ['Helpfulness', 'Relevance', 'Accuracy', 'Depth', 'Level of Detail'],
              y: [${criteriaDistribution.map((c: any) => c.avg).join(', ')}],
              name: 'Average',
              type: 'bar',
              marker: {color: '#10b981'}
          },
          {
              x: ['Helpfulness', 'Relevance', 'Accuracy', 'Depth', 'Level of Detail'],
              y: [${criteriaDistribution.map((c: any) => c.max).join(', ')}],
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
      
      // Funções para página de erros
      function showErrorPage() {
          document.getElementById('errorPage').classList.add('active');
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
      
      // Inicialização
      document.addEventListener('DOMContentLoaded', function() {
          createInteractiveRatingChart();
      });
    `;
  }
}