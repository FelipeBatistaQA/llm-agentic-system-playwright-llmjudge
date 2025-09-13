import * as fs from 'fs';
import * as path from 'path';
import { BaseGenerator } from '../core/BaseGenerator';
import { ProcessedData } from '../core/ReportData';

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
    const { stats, ratingCounts, statusCounts, trendData, criteriaAverages, criteriaDistribution, criteriaTrend, errorStats } = data;

    return `<!DOCTYPE html>
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
        }, config);` : ''}
        
        ${criteriaAverages ? `
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
                y: [${criteriaDistribution.map(c => c.min).join(', ')}],
                name: 'Minimum',
                type: 'bar',
                marker: {color: '#ef4444'}
            },
            {
                x: ['Helpfulness', 'Relevance', 'Accuracy', 'Depth', 'Level of Detail'],
                y: [${criteriaDistribution.map(c => c.avg).join(', ')}],
                name: 'Average',
                type: 'bar',
                marker: {color: '#10b981'}
            },
            {
                x: ['Helpfulness', 'Relevance', 'Accuracy', 'Depth', 'Level of Detail'],
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
  }
}
