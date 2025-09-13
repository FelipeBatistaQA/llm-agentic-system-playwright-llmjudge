import * as fs from 'fs';
import * as path from 'path';
import { createCanvas } from 'canvas';
import { Chart, ChartConfiguration } from 'chart.js';
import { BaseGenerator } from '../core/BaseGenerator';
import { ProcessedData } from '../core/ReportData';

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

export class PNGGenerator extends BaseGenerator {
  async generate(data: ProcessedData): Promise<string> {
    this.ensureOutputDir();
    
    console.log(`🖼️ Generating comprehensive PNG report...`);
    
    const canvas = createCanvas(this.options.width || 1800, this.options.height || 3000);
    const ctx = canvas.getContext('2d');

    // Fundo dark
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let currentY = 50;

    // 1. Título
    currentY = this.drawTitle(ctx, currentY);

    // 2. Estatísticas
    currentY = this.drawStats(ctx, data.stats, data.errorStats, currentY);

    // 3. Gráficos principais
    currentY = await this.drawMainCharts(ctx, data, currentY);

    // 4. Gráficos de critérios (se disponíveis)
    if (data.criteriaAverages) {
      currentY = await this.drawCriteriaCharts(ctx, data, currentY);
    }

    // 5. Análise de erros (se existirem)
    if (data.errorStats) {
      currentY = await this.drawErrorSection(ctx, data.errorStats, currentY);
    }

    // 6. Rodapé
    this.drawFooter(ctx, data.stats);

    // Salvar PNG
    const buffer = canvas.toBuffer('image/png');
    const filePath = path.join(this.options.outputDir, 'llm_judge_report.png');
    fs.writeFileSync(filePath, buffer);
    
    console.log(`✅ PNG Report generated: ${filePath}`);
    return filePath;
  }

  private drawTitle(ctx: any, y: number): number {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LLM Judge System - Comprehensive Results', ctx.canvas.width / 2, y + 40);
    return y + 80;
  }

  private drawStats(ctx: any, stats: any, errorStats: any, y: number): number {
    const statBoxes = [
      { label: 'Total Tests', value: stats.totalTests.toString(), color: '#2563eb' },
      { label: 'Success Rate', value: `${stats.successRate}%`, color: '#10b981' },
      { label: 'Average Rating', value: stats.avgRating.toFixed(1), color: '#f59e0b' },
      { label: 'Range', value: `${stats.minRating}-${stats.maxRating}`, color: '#8b5cf6' }
    ];

    if (errorStats) {
      statBoxes.push({ label: 'Errors', value: errorStats.totalErrors.toString(), color: '#ef4444' });
    }

    const boxWidth = 200;
    const boxHeight = 100;
    const spacing = 30;
    const totalWidth = statBoxes.length * boxWidth + (statBoxes.length - 1) * spacing;
    const startX = (ctx.canvas.width - totalWidth) / 2;
    
    statBoxes.forEach((stat, index) => {
      const x = startX + index * (boxWidth + spacing);
      
      // Fundo
      ctx.fillStyle = stat.color;
      ctx.fillRect(x, y, boxWidth, boxHeight);
      
      // Borda
      ctx.strokeStyle = stat.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, boxWidth, boxHeight);
      
      // Valor
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(stat.value, x + boxWidth / 2, y + 50);
      
      // Label
      ctx.font = 'bold 16px Arial';
      ctx.fillText(stat.label, x + boxWidth / 2, y + 75);
    });

    return y + boxHeight + 60;
  }

  private async drawMainCharts(ctx: any, data: ProcessedData, y: number): Promise<number> {
    const chartWidth = ctx.canvas.width - 100;
    const chartHeight = 300;
    const chartSpacing = 50;
    const chartStartX = 50;

    // Rating Distribution
    const distributionCanvas = createCanvas(chartWidth, chartHeight);
    const distributionChart = new Chart(distributionCanvas.getContext('2d') as any, this.createDistributionConfig(data.ratingCounts));
    ctx.drawImage(distributionCanvas, chartStartX, y);
    distributionChart.destroy();
    y += chartHeight + chartSpacing;

    // Trend Chart
    const trendCanvas = createCanvas(chartWidth, chartHeight);
    const trendChart = new Chart(trendCanvas.getContext('2d') as any, this.createTrendConfig(data.trendData));
    ctx.drawImage(trendCanvas, chartStartX, y);
    trendChart.destroy();
    y += chartHeight + chartSpacing;

    // Status Chart
    const statusCanvas = createCanvas(chartWidth, chartHeight);
    const statusChart = new Chart(statusCanvas.getContext('2d') as any, this.createStatusConfig(data.statusCounts));
    ctx.drawImage(statusCanvas, chartStartX, y);
    statusChart.destroy();
    y += chartHeight + chartSpacing;

    return y;
  }

  private async drawCriteriaCharts(ctx: any, data: ProcessedData, y: number): Promise<number> {
    if (!data.criteriaAverages) return y;

    const chartWidth = ctx.canvas.width - 100;
    const chartHeight = 300;
    const chartSpacing = 50;
    const chartStartX = 50;

    // Criteria Bar Chart
    const criteriaCanvas = createCanvas(chartWidth, chartHeight);
    const criteriaChart = new Chart(criteriaCanvas.getContext('2d') as any, this.createCriteriaBarConfig(data.criteriaAverages));
    ctx.drawImage(criteriaCanvas, chartStartX, y);
    criteriaChart.destroy();
    y += chartHeight + chartSpacing;

    // Criteria Distribution (Min/Max/Avg)
    if (data.criteriaDistribution) {
      const distributionCanvas = createCanvas(chartWidth, chartHeight);
      const distributionChart = new Chart(distributionCanvas.getContext('2d') as any, this.createCriteriaDistributionConfig(data.criteriaDistribution));
      ctx.drawImage(distributionCanvas, chartStartX, y);
      distributionChart.destroy();
      y += chartHeight + chartSpacing;
    }

    return y;
  }

  private async drawErrorSection(ctx: any, errorStats: any, y: number): Promise<number> {
    // Título da seção de erros
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`❌ Error Analysis (${errorStats.totalErrors} errors - ${errorStats.errorRate}% rate)`, ctx.canvas.width / 2, y + 30);
    
    // Gráfico de erros
    const chartWidth = ctx.canvas.width - 100;
    const chartHeight = 300;
    const chartStartX = 50;
    
    const errorCanvas = createCanvas(chartWidth, chartHeight);
    const errorChart = new Chart(errorCanvas.getContext('2d') as any, this.createErrorConfig(errorStats));
    ctx.drawImage(errorCanvas, chartStartX, y + 50);
    errorChart.destroy();
    
    return y + chartHeight + 100;
  }

  private drawFooter(ctx: any, stats: any): void {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Generated on: ${new Date().toLocaleString('en-US')} | Total Records: ${stats.totalTests}`, ctx.canvas.width / 2, ctx.canvas.height - 30);
  }

  // Chart configurations
  private createDistributionConfig(ratingCounts: number[]): ChartConfiguration {
    return {
      type: 'bar',
      data: {
        labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        datasets: [{ label: 'Count', data: ratingCounts, backgroundColor: '#10b981', borderColor: '#059669', borderWidth: 1 }]
      },
      options: {
        responsive: false,
        plugins: { 
          title: { display: true, text: 'Rating Distribution', font: { size: 18, weight: 'bold' }, color: '#ffffff' }, 
          legend: { display: false } 
        },
        scales: { 
          y: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#d1d5db' }, title: { display: true, text: 'Count', color: '#d1d5db' } }, 
          x: { title: { display: true, text: 'Rating', color: '#d1d5db' }, grid: { color: '#374151' }, ticks: { color: '#d1d5db' } } 
        }
      }
    };
  }

  private createTrendConfig(trendData: any): ChartConfiguration {
    return {
      type: 'line',
      data: {
        labels: trendData.testLabels.slice(-20),
        datasets: [{ 
          label: 'Performance Trend', 
          data: trendData.ratings.slice(-20), 
          borderColor: '#f59e0b', 
          backgroundColor: 'rgba(245, 158, 11, 0.1)', 
          tension: 0.3, 
          pointBackgroundColor: '#f59e0b', 
          pointBorderColor: '#d97706', 
          pointRadius: 4, 
          pointHoverRadius: 6 
        }]
      },
      options: {
        responsive: false,
        plugins: { 
          title: { display: true, text: 'Recent Performance Trend', font: { size: 18, weight: 'bold' }, color: '#ffffff' }, 
          legend: { display: false } 
        },
        scales: { 
          y: { beginAtZero: true, max: 10, grid: { color: '#374151' }, ticks: { color: '#d1d5db' }, title: { display: true, text: 'Rating', color: '#d1d5db' } }, 
          x: { ticks: { maxTicksLimit: 10, color: '#d1d5db' }, grid: { color: '#374151' }, title: { display: true, text: 'Test Sequence', color: '#d1d5db' } } 
        }
      }
    };
  }

  private createStatusConfig(statusCounts: Record<string, number>): ChartConfiguration {
    return {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{ 
          data: Object.values(statusCounts), 
          backgroundColor: ['#10b981', '#ef4444'], 
          borderColor: ['#059669', '#dc2626'], 
          borderWidth: 3 
        }]
      },
      options: {
        responsive: false,
        plugins: { 
          title: { display: true, text: 'PASS/FAIL Ratio', font: { size: 18, weight: 'bold' }, color: '#ffffff' }, 
          legend: { display: true, position: 'bottom', labels: { color: '#d1d5db' } } 
        }
      }
    };
  }

  private createCriteriaBarConfig(criteriaAverages: any): ChartConfiguration {
    return {
      type: 'bar',
      data: {
        labels: ['Helpfulness', 'Relevance', 'Accuracy', 'Depth', 'Level of Detail'],
        datasets: [{ 
          label: 'Average Score', 
          data: [
            parseFloat(criteriaAverages.helpfulness),
            parseFloat(criteriaAverages.relevance),
            parseFloat(criteriaAverages.accuracy),
            parseFloat(criteriaAverages.depth),
            parseFloat(criteriaAverages.levelOfDetail)
          ],
          backgroundColor: '#8b5cf6', 
          borderColor: '#7c3aed', 
          borderWidth: 2 
        }]
      },
      options: {
        responsive: false,
        plugins: { 
          title: { display: true, text: 'Criteria Average Scores', font: { size: 18, weight: 'bold' }, color: '#ffffff' }, 
          legend: { display: false } 
        },
        scales: { 
          y: { beginAtZero: true, max: 10, grid: { color: '#374151' }, ticks: { color: '#d1d5db' }, title: { display: true, text: 'Score', color: '#d1d5db' } }, 
          x: { grid: { color: '#374151' }, ticks: { color: '#d1d5db' } } 
        }
      }
    };
  }

  private createCriteriaDistributionConfig(criteriaDistribution: any[]): ChartConfiguration {
    return {
      type: 'bar',
      data: {
        labels: criteriaDistribution.map(c => c.name),
        datasets: [
          { 
            label: 'Minimum', 
            data: criteriaDistribution.map(c => c.min),
            backgroundColor: '#ef4444',
            borderColor: '#dc2626',
            borderWidth: 1
          },
          { 
            label: 'Average', 
            data: criteriaDistribution.map(c => parseFloat(c.avg)),
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1
          },
          { 
            label: 'Maximum', 
            data: criteriaDistribution.map(c => c.max),
            backgroundColor: '#f59e0b',
            borderColor: '#d97706',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: false,
        plugins: { 
          title: { display: true, text: 'Criteria Distribution (Min/Avg/Max)', font: { size: 18, weight: 'bold' }, color: '#ffffff' }, 
          legend: { display: true, position: 'top', labels: { color: '#d1d5db' } } 
        },
        scales: { 
          y: { beginAtZero: true, max: 10, grid: { color: '#374151' }, ticks: { color: '#d1d5db' }, title: { display: true, text: 'Score', color: '#d1d5db' } }, 
          x: { grid: { color: '#374151' }, ticks: { color: '#d1d5db', maxRotation: 45 } } 
        }
      }
    };
  }

  private createErrorConfig(errorStats: any): ChartConfiguration {
    return {
      type: 'bar',
      data: {
        labels: errorStats.errorTypes,
        datasets: [{ 
          label: 'Error Count', 
          data: errorStats.errorCounts,
          backgroundColor: '#ef4444', 
          borderColor: '#dc2626', 
          borderWidth: 2 
        }]
      },
      options: {
        responsive: false,
        plugins: { 
          title: { display: true, text: 'Error Categories', font: { size: 18, weight: 'bold' }, color: '#ffffff' }, 
          legend: { display: false } 
        },
        scales: { 
          y: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#d1d5db' }, title: { display: true, text: 'Count', color: '#d1d5db' } }, 
          x: { grid: { color: '#374151' }, ticks: { color: '#d1d5db' } } 
        }
      }
    };
  }
}
