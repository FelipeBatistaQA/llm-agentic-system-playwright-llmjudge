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
}

interface DashboardOptions {
  csvPath: string;
  outputDir: string;
  width: number;
  height: number;
}

export class DashboardGenerator {
  private data: JudgeResult[] = [];
  private options: DashboardOptions;

  constructor(options: DashboardOptions) {
    this.options = options;
  }

  async generateDashboard(): Promise<void> {
    // Ler dados do CSV
    await this.loadCSVData();
    
    // Criar diretório de saída se não existir
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    console.log(`📊 Generating complete dashboard...`);
    await this.generateDashboardChart();
  }

  private async loadCSVData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const results: JudgeResult[] = [];
      
      fs.createReadStream(this.options.csvPath)
        .pipe(csv())
        .on('data', (row: any) => {
          // Mapear colunas do CSV para interface
          const result: JudgeResult = {
            timestamp: row.timestamp,
            testName: row.test_name,
            rating: parseInt(row.rating) || 0,
            status: row.status as 'PASS' | 'FAIL',
            prompt: row.prompt,
            output: row.output
          };
          results.push(result);
        })
        .on('end', () => {
          this.data = results.filter(r => r.testName && r.testName !== 'test_name');
          console.log(`📈 Loaded ${this.data.length} records`);
          resolve();
        })
        .on('error', reject);
    });
  }

  private async generateDashboardChart(): Promise<void> {
    // Criar um dashboard único com todas as informações - layout vertical
    const canvas = createCanvas(this.options.width * 1.5, this.options.height * 2.5);
    const ctx = canvas.getContext('2d');

    // Configurar fundo dark moderno
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título principal - dark theme
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LLM Judge System - Test Results', canvas.width / 2, 50);

    // Estatísticas principais no topo
    const totalTests = this.data.length;
    const passCount = this.data.filter(item => item.status === 'PASS').length;
    const failCount = totalTests - passCount;
    const avgRating = this.data.reduce((sum, item) => sum + item.rating, 0) / totalTests;
    const successRate = (passCount / totalTests * 100).toFixed(1);
    const maxRating = Math.max(...this.data.map(item => item.rating));
    const minRating = Math.min(...this.data.map(item => item.rating));

    // Caixas de estatísticas - dark theme
    const statBoxes = [
      { label: 'Total Tests', value: totalTests.toString(), color: '#2563eb', textColor: 'white' },
      { label: 'Success Rate', value: `${successRate}%`, color: '#10b981', textColor: 'white' },
      { label: 'Average Rating', value: avgRating.toFixed(1), color: '#f59e0b', textColor: 'white' },
      { label: 'Range', value: `${minRating}-${maxRating}`, color: '#8b5cf6', textColor: 'white' }
    ];

    // Desenhar caixas de estatísticas
    const boxWidth = 200;
    const boxHeight = 100;
    const startX = (canvas.width - (statBoxes.length * boxWidth + (statBoxes.length - 1) * 30)) / 2;
    
    statBoxes.forEach((stat, index) => {
      const x = startX + index * (boxWidth + 30);
      const y = 80;
      
      // Fundo da caixa com bordas arredondadas
      ctx.fillStyle = stat.color;
      ctx.fillRect(x, y, boxWidth, boxHeight);
      
      // Borda
      ctx.strokeStyle = stat.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, boxWidth, boxHeight);
      
      // Texto do valor
      ctx.fillStyle = stat.textColor;
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(stat.value, x + boxWidth / 2, y + 45);
      
      // Texto do label
      ctx.font = 'bold 16px Arial';
      ctx.fillText(stat.label, x + boxWidth / 2, y + 70);
    });

    // Layout vertical - 3 gráficos um embaixo do outro (nova ordem)
    const chartWidth = canvas.width - 100; // Largura total menos margens
    const chartHeight = Math.floor((canvas.height - 450) / 3); // Dividir altura restante por 3
    const chartSpacing = 30;
    const chartStartX = 50;
    let currentY = 220;

    // Distribution (topo)
    const distributionCanvas = createCanvas(chartWidth, chartHeight);
    const distributionConfig = this.createDistributionConfig();
    const distributionChart = new Chart(distributionCanvas.getContext('2d') as any, distributionConfig);
    ctx.drawImage(distributionCanvas, chartStartX, currentY);
    distributionChart.destroy();
    currentY += chartHeight + chartSpacing;

    // Recent Performance Trend (meio)
    const trendCanvas = createCanvas(chartWidth, chartHeight);
    const trendConfig = this.createTestTrendConfig();
    const trendChart = new Chart(trendCanvas.getContext('2d') as any, trendConfig);
    ctx.drawImage(trendCanvas, chartStartX, currentY);
    trendChart.destroy();
    currentY += chartHeight + chartSpacing;

    // Status pie chart (baixo - último)
    const statusCanvas = createCanvas(chartWidth, chartHeight);
    const statusConfig = this.createStatusConfig();
    const statusChart = new Chart(statusCanvas.getContext('2d') as any, statusConfig);
    ctx.drawImage(statusCanvas, chartStartX, currentY);
    statusChart.destroy();

    // Rodapé com informações - dark theme
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    const now = new Date().toLocaleString('en-US');
    ctx.fillText(`Generated on: ${now} | Total Records: ${totalTests}`, canvas.width / 2, canvas.height - 30);

    // Salvar o dashboard completo
    const buffer = canvas.toBuffer('image/png');
    const filePath = path.join('./chart-generator', 'llm_judge_dashboard.png');
    fs.writeFileSync(filePath, buffer);
    
    console.log(`  ✅ llm_judge_dashboard.png saved in chart-generator folder`);
  }

  private createDistributionConfig(): ChartConfiguration {
    const ratingCounts = new Array(11).fill(0);
    this.data.forEach(item => {
      if (item.rating >= 0 && item.rating <= 10) {
        ratingCounts[item.rating]++;
      }
    });

    return {
      type: 'bar',
      data: {
        labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        datasets: [{
          label: 'Count',
          data: ratingCounts,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1
        }]
      },
      options: {
        responsive: false,
        plugins: {
          title: { display: true, text: 'Rating Distribution', font: { size: 16, weight: 'bold' }, color: '#ffffff' },
          legend: { display: false }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: '#374151' },
            ticks: { color: '#d1d5db' },
            title: { display: true, text: 'Count', color: '#d1d5db' }
          },
          x: { 
            title: { display: true, text: 'Rating', color: '#d1d5db' }, 
            grid: { color: '#374151' },
            ticks: { color: '#d1d5db' }
          }
        }
      }
    };
  }

  private createStatusConfig(): ChartConfiguration {
    const statusCounts = this.data.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
          title: { display: true, text: 'PASS/FAIL Ratio', font: { size: 16, weight: 'bold' }, color: '#ffffff' },
          legend: { 
            display: true, 
            position: 'bottom',
            labels: { color: '#d1d5db' }
          }
        }
      }
    };
  }

  private createTestTrendConfig(): ChartConfiguration {
    // Mostrar tendência de performance ao longo do tempo (sequência de testes)
    const sortedData = [...this.data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const labels = sortedData.map((_, index) => `Test ${index + 1}`);
    const ratings = sortedData.map(item => item.rating);

    return {
      type: 'line',
      data: {
        labels: labels.slice(-20), // Mostrar últimos 20 testes
        datasets: [{
          label: 'Performance Trend',
          data: ratings.slice(-20),
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
          title: { display: true, text: 'Recent Performance Trend', font: { size: 16, weight: 'bold' }, color: '#ffffff' },
          legend: { display: false }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            max: 10, 
            grid: { color: '#374151' },
            ticks: { color: '#d1d5db' },
            title: { display: true, text: 'Rating', color: '#d1d5db' }
          },
          x: { 
            ticks: { maxTicksLimit: 10, color: '#d1d5db' },
            grid: { color: '#374151' },
            title: { display: true, text: 'Test Sequence', color: '#d1d5db' }
          }
        }
      }
    };
  }
}
