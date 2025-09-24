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
    const { stats, ratingCounts, statusCounts, trendData, criteriaAverages, criteriaDistribution, criteriaTrend, errorStats, ratingGroups = [], testDetails = [], aiAnalytics } = data;

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
        ${this.getMainPageHTML(stats, errorStats, criteriaAverages, criteriaTrend, criteriaDistribution, aiAnalytics)}
    </div>
    
    <!-- PÁGINA DE TESTES POR RATING -->
    <div id="testsPage" class="page">
        ${this.getTestsPageHTML()}
    </div>
    
    <!-- PÁGINA DE DETALHES DO TESTE -->
    <div id="testDetailPage" class="page">
        ${this.getTestDetailPageHTML()}
    </div>
    
    <!-- PÁGINA DE ANOMALIAS -->
    ${aiAnalytics ? this.getAnomaliesPageHTML(aiAnalytics) : ''}
    
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
        
        /* Page system */
        .page { display: none; }
        .page.active { display: block; }
        
        /* Existing styling */
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 2.5em; margin: 0; color: #ffffff; font-weight: bold; }
        .stats-container { display: flex; justify-content: center; gap: 20px; margin-bottom: 40px; flex-wrap: wrap; }
        .stat-box { background: linear-gradient(135deg, var(--bg-color), var(--bg-color-dark)); padding: 20px; border-radius: 12px; text-align: center; min-width: 150px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); }
        .stat-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .stat-label { font-size: 0.9em; opacity: 0.9; }
        .chart-container { margin-bottom: 40px; background: #262626; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .chart-title { text-align: center; font-size: 1.4em; margin-bottom: 20px; color: #ffffff; font-weight: bold; }
        .footer { text-align: center; color: #9ca3af; font-size: 0.9em; margin-top: 30px; }
        
        /* Existing error table */
        .error-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.85em; }
        .error-table th, .error-table td { padding: 8px; text-align: left; border-bottom: 1px solid #374151; vertical-align: top; }
        .error-table th { background: #1f2937; color: #f9fafb; font-weight: bold; }
        .error-table td { background: #111827; }
        .error-message { max-width: 200px; word-wrap: break-word; font-size: 0.8em; }
        .error-line { color: #fbbf24; font-weight: bold; }
        .error-test { color: #60a5fa; font-weight: bold; }
        .error-page { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #1a1a1a; z-index: 1000; overflow-y: auto; padding: 20px; }
        .error-page.active { display: block; }
        
        /* Back button */
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
        
        /* Visual criteria */
        .criteria-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .criteria-item { background: #2d3748; padding: 15px; border-radius: 8px; border: 1px solid #4a5568; }
        .criteria-name { display: block; color: #e2e8f0; font-weight: bold; margin-bottom: 8px; }
        .criteria-value { color: #4299e1; font-weight: bold; float: right; }
        .criteria-bar { width: 100%; height: 8px; background: #4a5568; border-radius: 4px; overflow: hidden; margin-top: 8px; clear: both; }
        .criteria-fill { height: 100%; background: linear-gradient(90deg, #f56565, #ed8936, #ecc94b, #48bb78, #38b2ac); transition: width 0.3s ease; }
        
        /* Sistema de tabs para logs */
        .logs-tabs { display: flex; margin-bottom: 20px; border-bottom: 2px solid #4a5568; }
        .tab-button { background: transparent; color: #a0aec0; border: none; padding: 12px 20px; cursor: pointer; font-size: 1em; transition: all 0.3s; border-bottom: 2px solid transparent; }
        .tab-button:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); }
        .tab-button.active { color: #4299e1; border-bottom-color: #4299e1; background: rgba(66, 153, 225, 0.1); }
        
        .logs-container { margin-top: 20px; }
        .log-tab-content { display: none; }
        .log-tab-content.active { display: block; }
        .log-entry { background: #1a1a1a; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #4299e1; }
        .log-entry.HTTP { border-left-color: #f59e0b; }
        .log-entry.LLM { border-left-color: #10b981; }
        .log-entry.JUDGE { border-left-color: #8b5cf6; }
        .log-timestamp { color: #a0aec0; font-size: 0.9em; margin-bottom: 8px; }
        .log-content { white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 0.85em; line-height: 1.4; }
        .log-info { }
        .log-item { margin-bottom: 8px; color: #e2e8f0; }
        .log-item strong { color: #4299e1; }
        .log-text { background: #2d3748; padding: 10px; border-radius: 6px; margin: 5px 0; font-family: 'Courier New', monospace; font-size: 0.85em; line-height: 1.4; border: 1px solid #4a5568; max-height: 200px; overflow-y: auto; }
        .status-success { color: #10b981; font-weight: bold; }
        .status-error { color: #ef4444; font-weight: bold; }
        .rating-value { color: #f59e0b; font-weight: bold; font-size: 1.1em; }
        .criteria-mini { display: flex; gap: 10px; margin-top: 5px; }
        .criteria-mini span { background: #4a5568; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; color: #e2e8f0; }
        
        /* Expandable dropdowns */
        .dropdown-container { margin: 10px 0; }
        .dropdown-toggle { 
            background: #4a5568; color: #e2e8f0; border: none; padding: 8px 12px; 
            border-radius: 6px; cursor: pointer; width: 100%; text-align: left;
            transition: background 0.3s; display: flex; justify-content: space-between; align-items: center;
        }
        .dropdown-toggle:hover { background: #2d3748; }
        .dropdown-content { 
            display: none; margin-top: 8px; background: #1a1a1a; 
            border: 1px solid #4a5568; border-radius: 6px; padding: 10px; max-height: 300px; overflow-y: auto;
        }
        .dropdown-content.open { display: block; }
        .json-content { 
            color: #a0aec0; font-family: 'Courier New', monospace; 
            font-size: 0.85em; white-space: pre-wrap; margin: 0;
        }
        .dropdown-icon { font-size: 0.8em; }
        
        /* Individual conversation - Elegant design */
        .conversation-entries { margin-top: 20px; }
        .conversation-entry { 
            background: linear-gradient(135deg, #1e293b, #0f172a); 
            border-radius: 16px; padding: 25px; margin-bottom: 20px; 
            border: 1px solid #334155; box-shadow: 0 8px 25px rgba(0,0,0,0.4);
            position: relative; overflow: hidden;
        }
        .conversation-entry::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg, #3b82f6, #10b981, #f59e0b);
        }
        .conversation-header { 
            color: #3b82f6; font-weight: bold; margin-bottom: 20px; font-size: 1.2em; 
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid #334155; padding-bottom: 10px;
        }
        .conversation-meta { 
            color: #94a3b8; font-size: 0.85em; 
            background: #0f172a; padding: 6px 12px; border-radius: 20px;
            border: 1px solid #1e293b;
        }
        .user-message, .assistant-message { margin-bottom: 18px; position: relative; }
        .user-message strong { 
            color: #f59e0b; display: flex; align-items: center; gap: 8px; 
            font-size: 1.05em; margin-bottom: 10px;
        }
        .assistant-message strong { 
            color: #10b981; display: flex; align-items: center; gap: 8px; 
            font-size: 1.05em; margin-bottom: 10px;
        }
        .message-content { 
            background: linear-gradient(135deg, #334155, #1e293b); 
            padding: 20px; border-radius: 12px; margin: 8px 0; 
            white-space: pre-wrap; font-family: 'Inter', 'Segoe UI', sans-serif; 
            border: 1px solid #475569; line-height: 1.6; font-size: 0.95em;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .message-timeline {
            position: absolute; left: -15px; top: 50%; 
            width: 8px; height: 8px; background: #3b82f6; 
            border-radius: 50%; border: 3px solid #1e293b;
        }
        .user-message .message-timeline { background: #f59e0b; }
        .assistant-message .message-timeline { background: #10b981; }
        
        .clickable { cursor: pointer; transition: transform 0.2s ease; }
        .clickable:hover { transform: scale(1.05); }

        /* Executive Summary Section */
        .executive-summary-section {
          margin: 20px 0;
        }

        /* AI Insights Dropdown */
        .ai-insights-dropdown {
          margin-top: 15px;
        }

        .ai-dropdown-toggle {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 15px 20px;
          border-radius: 10px;
          cursor: pointer;
          width: 100%;
          font-size: 1.1em;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .ai-dropdown-toggle:hover {
          background: linear-gradient(135deg, #2563eb, #1e40af);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .ai-insights-content {
          display: none;
          margin-top: 15px;
          padding: 20px;
          background: linear-gradient(135deg, #1f2937, #111827);
          border-radius: 12px;
          border: 1px solid #374151;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .ai-insights-content.open {
          display: block;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Anomalies Section */
        .anomalies-section {
          margin: 20px 0;
          padding: 20px 0;
        }

        .ai-card {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          border-radius: 12px;
          padding: 20px;
          margin: 15px 0;
          border-left: 4px solid #3b82f6;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .ai-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        }

        .ai-card-header {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          gap: 12px;
        }

        .ai-icon {
          font-size: 24px;
          min-width: 32px;
        }

        .ai-card h2, .ai-card h3 {
          margin: 0;
          flex-grow: 1;
          font-weight: 600;
        }

        .ai-card h2 {
          font-size: 1.4em;
          color: #f3f4f6;
        }

        .ai-card h3 {
          font-size: 1.2em;
          color: #e5e7eb;
        }

        /* Assessment and Risk Badges */
        .assessment-badge, .risk-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .assessment-badge.excellent { background: #10b981; color: white; }
        .assessment-badge.good { background: #3b82f6; color: white; }
        .assessment-badge.concerning { background: #f59e0b; color: white; }
        .assessment-badge.poor { background: #ef4444; color: white; }

        .risk-badge.low { background: #10b981; color: white; }
        .risk-badge.medium { background: #f59e0b; color: white; }
        .risk-badge.high { background: #ef4444; color: white; }

        /* Executive Summary */
        .executive-summary {
          border-left-color: #8b5cf6;
        }

        .executive-text {
          font-size: 1.1em;
          line-height: 1.6;
          color: #d1d5db;
          margin: 0;
        }

        /* Anomalies Section */
        .anomalies {
          border-left-color: #ef4444;
        }

        .anomalies.no-issues {
          border-left-color: #10b981;
        }

        .anomaly-item {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 15px;
          margin: 10px 0;
          border-left: 3px solid;
        }

        .anomaly-item.severity-low { border-left-color: #10b981; }
        .anomaly-item.severity-medium { border-left-color: #f59e0b; }
        .anomaly-item.severity-high { border-left-color: #ef4444; }

        .anomaly-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .anomaly-header h4 {
          margin: 0;
          color: #f3f4f6;
          font-size: 1.1em;
        }

        .severity-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75em;
          font-weight: 600;
          text-transform: uppercase;
        }

        .severity-badge.low { background: #10b981; color: white; }
        .severity-badge.medium { background: #f59e0b; color: white; }
        .severity-badge.high { background: #ef4444; color: white; }

        .anomaly-description {
          color: #d1d5db;
          margin: 8px 0;
          line-height: 1.5;
        }

        .anomaly-evidence, .anomaly-recommendation, .affected-tests {
          margin: 12px 0;
          padding: 8px 0;
          border-top: 1px solid #374151;
        }

        .anomaly-evidence ul, .findings-list, .highlights-list, .concerns-list, .recommendations-list {
          margin: 8px 0;
          padding-left: 20px;
        }

        .anomaly-evidence li, .findings-list li, .highlights-list li, .concerns-list li, .recommendations-list li {
          color: #d1d5db;
          margin: 4px 0;
          line-height: 1.4;
        }

        .no-anomalies p {
          color: #10b981;
          font-size: 1.1em;
          text-align: center;
          margin: 20px 0;
        }

        /* Insights Grid */
        .ai-insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }

        .insights { border-left-color: #3b82f6; }
        .highlights { border-left-color: #10b981; }
        .concerns { border-left-color: #f59e0b; }
        .recommendations { border-left-color: #8b5cf6; }

        /* AI Metadata */
        .ai-metadata {
          text-align: center;
          margin-top: 20px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          border: 1px solid #374151;
        }

        .ai-metadata p {
          margin: 0;
          color: #9ca3af;
          font-size: 0.9em;
        }

        /* Anomalies Page Specific Styles */
        .anomaly-overview {
          margin: 20px 0;
        }

        .anomaly-stats {
          display: flex;
          justify-content: space-around;
          gap: 20px;
          flex-wrap: wrap;
        }

        .anomaly-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          flex: 1;
          min-width: 120px;
        }

        .stat-number {
          font-size: 2em;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .stat-number.severity-high { color: #ef4444; }
        .stat-number.severity-medium { color: #f59e0b; }
        .stat-number.severity-low { color: #10b981; }

        .stat-label {
          font-size: 0.9em;
          color: #9ca3af;
        }

        .anomalies-detailed {
          margin: 30px 0;
        }

        .anomalies-detailed h2 {
          color: #f3f4f6;
          margin-bottom: 20px;
          font-size: 1.5em;
        }

        .anomaly-card-detailed {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          border-radius: 12px;
          margin: 20px 0;
          overflow: hidden;
          border-left: 4px solid;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .anomaly-card-detailed.severity-high { border-left-color: #ef4444; }
        .anomaly-card-detailed.severity-medium { border-left-color: #f59e0b; }
        .anomaly-card-detailed.severity-low { border-left-color: #10b981; }

        .anomaly-card-header {
          display: flex;
          align-items: center;
          padding: 20px;
          gap: 15px;
          border-bottom: 1px solid #374151;
          background: rgba(0, 0, 0, 0.2);
        }

        .anomaly-number {
          background: #4b5563;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.1em;
        }

        .anomaly-title-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .anomaly-title-section h3 {
          margin: 0;
          color: #f3f4f6;
          font-size: 1.3em;
        }

        .anomaly-type {
          background: #6b7280;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          align-self: flex-start;
        }

        .anomaly-card-content {
          padding: 20px;
        }

        .anomaly-card-content h4 {
          color: #3b82f6;
          margin: 20px 0 10px 0;
          font-size: 1.1em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .anomaly-card-content h4:first-child {
          margin-top: 0;
        }

        .anomaly-description p,
        .anomaly-recommendation p {
          color: #d1d5db;
          line-height: 1.6;
          margin: 0;
        }

        .anomaly-evidence ul {
          color: #d1d5db;
          margin: 10px 0;
          padding-left: 20px;
        }

        .anomaly-evidence li {
          margin: 6px 0;
          line-height: 1.4;
        }

        .test-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .test-tag {
          background: #374151;
          color: #d1d5db;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9em;
          transition: background 0.2s ease;
        }

        .test-tag:hover {
          background: #4b5563;
          color: #f3f4f6;
        }

        /* No Anomalies Page */
        .no-anomalies-page {
          margin: 40px 0;
          text-align: center;
        }

        .health-status {
          text-align: center;
          padding: 20px;
        }

        .health-icon {
          font-size: 4em;
          margin-bottom: 20px;
        }

        .health-status h3 {
          color: #10b981;
          font-size: 1.8em;
          margin-bottom: 15px;
        }

        .health-status p {
          color: #9ca3af;
          font-size: 1.1em;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto 30px auto;
        }

        .health-metrics {
          display: flex;
          justify-content: center;
          gap: 40px;
          flex-wrap: wrap;
        }

        .health-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .health-metric .metric-value {
          font-size: 2.5em;
          font-weight: bold;
          color: #10b981;
          margin-bottom: 5px;
        }

        .health-metric .metric-label {
          color: #6b7280;
          font-size: 0.9em;
        }

        /* Validation Logs Section */
        .validation-logs-section {
          margin: 30px 0;
        }

        /* Process Explanation */
        .process-explanation {
          margin: 20px 0;
        }

        .process-explanation .ai-card {
          border-left-color: #6b7280;
        }

        .process-explanation p {
          color: #d1d5db;
          line-height: 1.6;
          margin: 0;
        }

        .process-explanation strong {
          color: #f3f4f6;
        }

        .process-explanation em {
          color: #9ca3af;
          font-size: 0.9em;
        }

        .validation-logs {
          border-left-color: #3b82f6;
        }

        .validation-badge {
          background: #1f2937;
          color: #d1d5db;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8em;
          border: 1px solid #374151;
        }

        .process-summary {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin: 20px 0;
          flex-wrap: wrap;
        }

        .process-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          min-width: 100px;
        }

        .process-stat.validated {
          border: 2px solid #10b981;
        }

        .process-stat.rejected {
          border: 2px solid #ef4444;
        }

        .process-number {
          font-size: 2em;
          font-weight: bold;
          margin-bottom: 5px;
          color: #f3f4f6;
        }

        .process-label {
          font-size: 0.9em;
          color: #9ca3af;
        }

        .process-arrow {
          font-size: 2em;
          color: #6b7280;
          font-weight: bold;
        }

        .validation-decisions {
          margin-top: 30px;
        }

        .validation-decisions h3 {
          color: #f3f4f6;
          margin-bottom: 20px;
          font-size: 1.3em;
        }

        .validation-decision {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          border-radius: 12px;
          margin: 15px 0;
          overflow: hidden;
          border-left: 4px solid;
        }

        .validation-decision.validated {
          border-left-color: #10b981;
        }

        .validation-decision.rejected {
          border-left-color: #ef4444;
        }

        .decision-header {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          gap: 15px;
          border-bottom: 1px solid #374151;
          background: rgba(0, 0, 0, 0.2);
        }

        .decision-number {
          background: #4b5563;
          color: white;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1em;
        }

        .decision-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .decision-info h4 {
          margin: 0;
          color: #f3f4f6;
          font-size: 1.1em;
        }

        .decision-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75em;
          font-weight: 600;
          text-transform: uppercase;
          align-self: flex-start;
        }

        .decision-badge.validated {
          background: #10b981;
          color: white;
        }

        .decision-badge.rejected {
          background: #ef4444;
          color: white;
        }

        .confidence-badge {
          background: #374151;
          color: #d1d5db;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.9em;
          font-weight: 600;
        }

        .decision-content {
          padding: 20px;
        }

        .decision-reason, .mathematical-check {
          margin: 12px 0;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          border-left: 3px solid #374151;
        }

        .decision-reason strong, .mathematical-check strong {
          color: #3b82f6;
          display: block;
          margin-bottom: 8px;
        }

        .mathematical-check {
          border-left-color: #f59e0b;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .ai-insights-grid {
            grid-template-columns: 1fr;
          }
          
          .ai-card {
            padding: 15px;
            margin: 10px 0;
          }
          
          .ai-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .anomaly-stats {
            flex-direction: column;
          }

          .anomaly-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .health-metrics {
            flex-direction: column;
            gap: 20px;
          }
        }
    `;
  }

  private getMainPageHTML(stats: ReportStats, errorStats: ErrorStats | null, criteriaAverages: any, criteriaTrend: any, criteriaDistribution: any, aiAnalytics: any): string {
    return `
    <div class="header"><h1>LLM Judge System - Test Results</h1></div>
      
    <div class="stats-container">
          <div class="stat-box clickable" style="--bg-color: #2563eb; --bg-color-dark: #1d4ed8;" onclick="showAllTests()">
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
          ${aiAnalytics ? `<div class="stat-box clickable anomaly-button" style="--bg-color: ${aiAnalytics.anomalies.hasAnomalies ? '#ef4444' : '#3b82f6'}; --bg-color-dark: ${aiAnalytics.anomalies.hasAnomalies ? '#dc2626' : '#1d4ed8'};" onclick="showAnomaliesPage()" title="${aiAnalytics.anomalies.hasAnomalies ? `${aiAnalytics.anomalies.anomalies.length} validated anomalies detected (${aiAnalytics.anomalies.overallRisk} risk) - Click for details` : aiAnalytics.anomalies.validationDetails ? `${aiAnalytics.anomalies.validationDetails.totalPotentialAnomalies} potential anomalies analyzed, ${aiAnalytics.anomalies.validationDetails.rejectedAnomalies} rejected as false positives - Click to see validation process` : 'No anomaly analysis performed'}"><div class="stat-value">${aiAnalytics.anomalies.hasAnomalies ? '⚠️' : aiAnalytics.anomalies.validationDetails ? '🔍' : '✅'}</div><div class="stat-label">Anomalies</div></div>` : ''}
          ${errorStats ? `<div class="stat-box clickable" style="--bg-color: #ef4444; --bg-color-dark: #dc2626;" onclick="showErrorPage()"><div class="stat-value">${errorStats.totalErrors}</div><div class="stat-label">Errors</div></div>` : ''}
      </div>
      
      ${aiAnalytics ? this.getExecutiveSummarySection(aiAnalytics) : ''}
      
      <div class="chart-container">
          <div class="chart-title">📊 Rating Distribution (Click bars to see details)</div>
          <div id="distributionChart"></div>
    </div>
      
    <div class="chart-container"><div class="chart-title">PASS/FAIL Ratio</div><div id="statusChart"></div></div>
    <div class="chart-container"><div class="chart-title">Recent Performance Trend</div><div id="trendChart"></div></div>
    ${criteriaTrend ? '<div class="chart-container"><div class="chart-title">📈 Criteria Trends</div><div id="criteriaTrendChart"></div></div>' : ''}
    ${criteriaAverages ? '<div class="chart-container"><div class="chart-title">Criteria Average Scores</div><div id="criteriaChart"></div></div>' : ''}
    ${criteriaAverages ? '<div class="chart-container"><div class="chart-title">Criteria Breakdown</div><div id="criteriaBarChart"></div></div>' : ''}
    ${criteriaDistribution ? '<div class="chart-container"><div class="chart-title">📊 Criteria Distribution (Min/Avg/Max)</div><div id="criteriaDistChart"></div></div>' : ''}
    <div class="footer">Generated on: ${new Date().toLocaleString('en-US')} | Total Records: ${stats.totalTests}</div>
    `;
  }

  private getExecutiveSummarySection(aiAnalytics: any): string {
    return `
    <!-- Executive Summary -->
    <div class="executive-summary-section">
      <div class="ai-card executive-summary">
        <div class="ai-card-header">
          <span class="ai-icon">🎯</span>
          <h2>Executive Summary</h2>
          <span class="assessment-badge ${aiAnalytics.summary.overallAssessment}">${aiAnalytics.summary.overallAssessment}</span>
        </div>
        <div class="ai-card-content">
          <p class="executive-text">${aiAnalytics.summary.executiveSummary}</p>
        </div>
      </div>

      <!-- AI Insights Dropdown -->
      <div class="ai-insights-dropdown">
        <button class="ai-dropdown-toggle" onclick="toggleAIInsights()">
          <span class="ai-icon">💡</span>
          <span>AI Analysis Details</span>
          <span id="ai-insights-icon" class="dropdown-icon">▼</span>
        </button>
        <div id="ai-insights-content" class="ai-insights-content">
          <div class="ai-insights-grid">
            <!-- Key Findings -->
            <div class="ai-card insights">
              <div class="ai-card-header">
                <span class="ai-icon">💡</span>
                <h3>Key Findings</h3>
              </div>
              <div class="ai-card-content">
                <ul class="findings-list">
                  ${aiAnalytics.summary.keyFindings.map((finding: string) => `<li>${finding}</li>`).join('')}
                </ul>
              </div>
            </div>

            <!-- Performance Highlights -->
            <div class="ai-card highlights">
              <div class="ai-card-header">
                <span class="ai-icon">⭐</span>
                <h3>Performance Highlights</h3>
              </div>
              <div class="ai-card-content">
                <ul class="highlights-list">
                  ${aiAnalytics.summary.performanceHighlights.map((highlight: string) => `<li>${highlight}</li>`).join('')}
                </ul>
              </div>
            </div>

            ${aiAnalytics.summary.areasOfConcern.length > 0 ? `
              <!-- Areas of Concern -->
              <div class="ai-card concerns">
                <div class="ai-card-header">
                  <span class="ai-icon">⚠️</span>
                  <h3>Areas of Concern</h3>
                </div>
                <div class="ai-card-content">
                  <ul class="concerns-list">
                    ${aiAnalytics.summary.areasOfConcern.map((concern: string) => `<li>${concern}</li>`).join('')}
                  </ul>
                </div>
              </div>
            ` : ''}

            <!-- Recommendations -->
            <div class="ai-card recommendations">
              <div class="ai-card-header">
                <span class="ai-icon">🔧</span>
                <h3>Recommendations</h3>
              </div>
              <div class="ai-card-content">
                <ul class="recommendations-list">
                  ${aiAnalytics.summary.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>

          <!-- AI Analytics Metadata -->
          <div class="ai-metadata">
            <p>🤖 AI Analysis completed on ${new Date(aiAnalytics.metadata.analysisDate).toLocaleString()} | 
            Processing time: ${(aiAnalytics.metadata.processingTime / 1000).toFixed(1)}s | 
            Confidence: ${aiAnalytics.summary.confidence}/10</p>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  private getAnomaliesPageHTML(aiAnalytics: any): string {
    return `
    <!-- PÁGINA DE ANOMALIAS -->
    <div id="anomaliesPage" class="page">
      <button class="back-button" onclick="showMainPage()">← Back to Dashboard</button>
      
      <div class="header">
        <h1>${aiAnalytics.anomalies.hasAnomalies ? '🚨' : '✅'} System Anomaly Analysis</h1>
        <p style="color: #9ca3af; margin-top: 10px;">
          Risk Level: <span class="risk-badge ${aiAnalytics.anomalies.overallRisk}" style="margin-left: 8px;">${aiAnalytics.anomalies.overallRisk}</span>
          | Confidence: ${aiAnalytics.anomalies.confidence}/10
          | Analysis Date: ${new Date(aiAnalytics.metadata.analysisDate).toLocaleString()}
        </p>
      </div>
      
      <!-- Validation Process Logs (always show if validation occurred) -->
      ${aiAnalytics.anomalies.validationDetails ? this.getValidationLogsSection(aiAnalytics.anomalies.validationDetails) : ''}
      
      ${aiAnalytics.anomalies.hasAnomalies ? `
        <!-- Summary Overview -->
        <div class="anomaly-overview">
          <div class="ai-card">
            <div class="ai-card-header">
              <span class="ai-icon">📊</span>
              <h2>Validated Anomalies Summary</h2>
            </div>
            <div class="ai-card-content">
              <div class="anomaly-stats">
                <div class="anomaly-stat">
                  <span class="stat-number">${aiAnalytics.anomalies.anomalies.length}</span>
                  <span class="stat-label">Validated Anomalies</span>
                </div>
                <div class="anomaly-stat">
                  <span class="stat-number severity-high">${aiAnalytics.anomalies.anomalies.filter((a: any) => a.severity === 'high').length}</span>
                  <span class="stat-label">High Severity</span>
                </div>
                <div class="anomaly-stat">
                  <span class="stat-number severity-medium">${aiAnalytics.anomalies.anomalies.filter((a: any) => a.severity === 'medium').length}</span>
                  <span class="stat-label">Medium Severity</span>
                </div>
                <div class="anomaly-stat">
                  <span class="stat-number severity-low">${aiAnalytics.anomalies.anomalies.filter((a: any) => a.severity === 'low').length}</span>
                  <span class="stat-label">Low Severity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Process Explanation -->
        <div class="process-explanation">
          <div class="ai-card" style="border-left-color: #6b7280;">
            <div class="ai-card-header">
              <span class="ai-icon">📝</span>
              <h3>Validation Process Explanation</h3>
            </div>
            <div class="ai-card-content">
              <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p style="color: #d1d5db; margin: 0; line-height: 1.6;">
                  🔍 <strong>Detector Agent</strong> found ${aiAnalytics.anomalies.validationDetails?.totalPotentialAnomalies || 0} potential anomalies<br>
                  ✅ <strong>Validator Agent</strong> confirmed ${aiAnalytics.anomalies.validationDetails?.validatedAnomalies || 0} as genuine system issues<br>
                  ❌ <strong>Validator Agent</strong> rejected ${aiAnalytics.anomalies.validationDetails?.rejectedAnomalies || 0} as false positives<br><br>
                  <em>Only validated anomalies are shown below and count toward the final anomaly count.</em>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Detailed Validated Anomalies -->
        <div class="anomalies-detailed">
          <h2>🔍 Validated Anomalies (Final Results)</h2>
          <p style="color: #9ca3af; margin-bottom: 20px; font-style: italic;">These are the anomalies that passed validation and require attention:</p>
          ${aiAnalytics.anomalies.anomalies.map((anomaly: any, index: number) => `
            <div class="anomaly-card-detailed severity-${anomaly.severity}">
              <div class="anomaly-card-header">
                <div class="anomaly-number">#${index + 1}</div>
                <div class="anomaly-title-section">
                  <h3>${anomaly.title}</h3>
                  <span class="severity-badge ${anomaly.severity}">${anomaly.severity} severity</span>
                  <span class="anomaly-type">${anomaly.type}</span>
                </div>
              </div>
              
              <div class="anomaly-card-content">
                <div class="anomaly-description">
                  <h4>📋 Description</h4>
                  <p>${anomaly.description}</p>
                </div>
                
                <div class="anomaly-evidence">
                  <h4>🔬 Evidence</h4>
                  <ul>
                    ${anomaly.evidence.map((evidence: string) => `<li>${evidence}</li>`).join('')}
                  </ul>
                </div>
                
                <div class="anomaly-recommendation">
                  <h4>💡 Recommendation</h4>
                  <p>${anomaly.recommendation}</p>
                </div>
                
                ${anomaly.affectedTests ? `
                  <div class="affected-tests">
                    <h4>🎯 Affected Tests</h4>
                    <div class="test-tags">
                      ${anomaly.affectedTests.map((testName: string) => `
                        <span class="test-tag" onclick="searchTestByName('${testName}')">${testName}</span>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <!-- No Validated Anomalies (but validation occurred) -->
        ${aiAnalytics.anomalies.validationDetails ? `
          <div class="validation-results-page">
            <div class="ai-card" style="border-left-color: #10b981;">
              <div class="ai-card-header">
                <span class="ai-icon">🔍</span>
                <h2>Validation Complete: All Potential Anomalies Rejected</h2>
              </div>
              <div class="ai-card-content">
                <div class="health-status">
                  <div class="health-icon" style="color: #10b981;">✅</div>
                  <h3>No Validated Anomalies</h3>
                  <p>The AI Validator reviewed ${aiAnalytics.anomalies.validationDetails.totalPotentialAnomalies} potential anomalies and determined all were false positives. The system is functioning correctly.</p>
                  
                  <div class="validation-summary" style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: left;">
                    <h4 style="color: #3b82f6; margin-bottom: 15px; font-size: 1.2em;">📊 Validation Summary:</h4>
                    <div style="display: flex; justify-content: space-around; gap: 20px; flex-wrap: wrap;">
                      <div style="text-align: center;">
                        <span style="font-size: 2em; font-weight: bold; color: #f59e0b; display: block;">${aiAnalytics.anomalies.validationDetails.totalPotentialAnomalies}</span>
                        <span style="color: #9ca3af; font-size: 0.9em;">Potential Detected</span>
                      </div>
                      <div style="text-align: center;">
                        <span style="font-size: 2em; font-weight: bold; color: #10b981; display: block;">0</span>
                        <span style="color: #9ca3af; font-size: 0.9em;">Validated</span>
                      </div>
                      <div style="text-align: center;">
                        <span style="font-size: 2em; font-weight: bold; color: #ef4444; display: block;">${aiAnalytics.anomalies.validationDetails.rejectedAnomalies}</span>
                        <span style="color: #9ca3af; font-size: 0.9em;">Rejected as False Positives</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="health-metrics">
                    <div class="health-metric">
                      <span class="metric-value">100%</span>
                      <span class="metric-label">System Integrity</span>
                    </div>
                    <div class="health-metric">
                      <span class="metric-value">${aiAnalytics.anomalies.confidence}/10</span>
                      <span class="metric-label">Analysis Confidence</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ` : `
          <!-- No Analysis Performed -->
          <div class="no-anomalies-page">
            <div class="ai-card">
              <div class="ai-card-header">
                <span class="ai-icon">✅</span>
                <h2>System Health: Excellent</h2>
              </div>
              <div class="ai-card-content">
                <div class="health-status">
                  <div class="health-icon">🎉</div>
                  <h3>No System Anomalies Detected</h3>
                  <p>All testing processes are functioning normally. The LLM Judge system is operating within expected parameters and no issues were identified during the analysis.</p>
                  
                  <div class="health-metrics">
                    <div class="health-metric">
                      <span class="metric-value">100%</span>
                      <span class="metric-label">System Integrity</span>
                    </div>
                    <div class="health-metric">
                      <span class="metric-value">${aiAnalytics.anomalies.confidence}/10</span>
                      <span class="metric-label">Analysis Confidence</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `}
      `}
    </div>
    `;
  }

  private getValidationLogsSection(validationDetails: any): string {
    return `
    <!-- Validation Process Logs -->
    <div class="validation-logs-section">
      <div class="ai-card validation-logs">
        <div class="ai-card-header">
          <span class="ai-icon">🔍</span>
          <h2>AI Validation Process</h2>
          <span class="validation-badge">
            ${validationDetails.validatedAnomalies}/${validationDetails.totalPotentialAnomalies} validated
          </span>
        </div>
        <div class="ai-card-content">
          
          <!-- Process Summary -->
          <div class="process-summary">
            <div class="process-stat">
              <span class="process-number">${validationDetails.totalPotentialAnomalies}</span>
              <span class="process-label">Potential Detected</span>
            </div>
            <div class="process-arrow">→</div>
            <div class="process-stat validated">
              <span class="process-number">${validationDetails.validatedAnomalies}</span>
              <span class="process-label">Validated</span>
            </div>
            <div class="process-stat rejected">
              <span class="process-number">${validationDetails.rejectedAnomalies}</span>
              <span class="process-label">Rejected</span>
            </div>
          </div>
          
          <!-- Detailed Validation Decisions -->
          <div class="validation-decisions">
            <h3>📋 Validation Decisions</h3>
            ${validationDetails.validationDecisions.map((decision: any, index: number) => `
              <div class="validation-decision ${decision.decision.toLowerCase()}">
                <div class="decision-header">
                  <div class="decision-number">#${index + 1}</div>
                  <div class="decision-info">
                    <h4>${decision.potentialAnomaly}</h4>
                    <span class="decision-badge ${decision.decision.toLowerCase()}">${decision.decision}</span>
                  </div>
                  <div class="confidence-badge">
                    ${decision.confidence}/10
                  </div>
                </div>
                
                <div class="decision-content">
                  <div class="decision-reason">
                    <strong>🎯 Reason:</strong> ${decision.reason}
                  </div>
                  
                  ${decision.mathematicalCheck ? `
                    <div class="mathematical-check">
                      <strong>🔢 Mathematical Check:</strong> ${decision.mathematicalCheck}
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    `;
  }

  private getTestsPageHTML(): string {
    return `
      <button class="back-button" onclick="showMainPage()">← Back to Dashboard</button>
      <div class="header">
          <h2 id="testsPageTitle">Tests with Rating X.X</h2>
      </div>
      
      <div class="tests-container">
          <div id="testsGrid" class="tests-grid">
              <!-- Will be populated by JavaScript -->
          </div>
      </div>
    `;
  }

  private getTestDetailPageHTML(): string {
    return `
      <button class="back-button" onclick="showTestsPage()">← Back to Tests</button>
      
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
                  <h3>🤖 Response</h3>
                  <div id="testOutput" class="content-box"></div>
              </div>
              
              <div class="test-section" id="criteriaSection">
                  <h3>📊 Evaluation Criteria</h3>
                  <div id="testCriteria" class="criteria-grid"></div>
              </div>
              
              <div class="test-section">
                  <h3>💭 Judge Explanation</h3>
                  <div id="testExplanation" class="content-box"></div>
              </div>
              
              <div class="test-section" id="logsSection">
                  <h3>📋 Detailed Logs</h3>
                  <div class="logs-tabs">
                      <button class="tab-button active" onclick="showLogTab('http')">HTTP</button>
                      <button class="tab-button" onclick="showLogTab('llm')">LLM</button>
                      <button class="tab-button" onclick="showLogTab('judge')">Judge</button>
                  </div>
                  <div id="testLogs" class="logs-container">
                      <div id="httpLogs" class="log-tab-content active"></div>
                      <div id="llmLogs" class="log-tab-content"></div>
                      <div id="judgeLogs" class="log-tab-content"></div>
                  </div>
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
      
      // Chart configurations
        const darkLayout = { paper_bgcolor: '#262626', plot_bgcolor: '#1a1a1a', font: { color: '#ffffff' }, xaxis: { gridcolor: '#374151', zerolinecolor: '#374151', color: '#d1d5db' }, yaxis: { gridcolor: '#374151', zerolinecolor: '#374151', color: '#d1d5db' } };
        const config = { responsive: true, displayModeBar: true, modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d'], displaylogo: false };
        
      // Interactive distribution chart
      function createInteractiveRatingChart() {
          const chartData = {
              x: ratingGroups.map(g => parseFloat(g.rating)),
              y: ratingGroups.map(g => g.count),
              type: 'bar',
              marker: {
                  color: ratingGroups.map(g => g.count > 0 ? '#10b981' : '#6b7280'),
                  line: {color: '#059669', width: 2}
              },
              hovertemplate: 'Rating: %{x:.1f}<br>Tests: %{y}<br><b>Click to see details</b><extra></extra>',
              customdata: ratingGroups.map(g => g.rating)
          };

          const layout = {
              ...darkLayout,
              xaxis: {
                  ...darkLayout.xaxis,
                  title: 'Rating (with decimals)',
                  tickformat: '.1f',
                  dtick: 0.5
              },
              yaxis: {...darkLayout.yaxis, title: 'Number of Tests'},
              margin: {l: 60, r: 40, t: 40, b: 60}
          };

          Plotly.newPlot('distributionChart', [chartData], layout, config);
          
          // Evento de clique nas barras
          document.getElementById('distributionChart').on('plotly_click', function(data) {
              const rating = data.points[0].customdata;
              showTestsForRating(rating);
          });
      }
      
      // Page navigation
      function showPage(pageId) {
          document.querySelectorAll('.page').forEach(page => {
              page.classList.remove('active');
          });
          document.getElementById(pageId).classList.add('active');
      }
      
      function showMainPage() { showPage('mainPage'); }
      function showTestsPage() { showPage('testsPage'); }
      
      // Show tests for specific rating
      function showTestsForRating(rating) {
          const ratingGroup = ratingGroups.find(g => g.rating === rating);
          if (!ratingGroup) return;
          
          document.getElementById('testsPageTitle').textContent = \`Tests with Rating \${rating} (\${ratingGroup.count} tests)\`;
          
          const testsGrid = document.getElementById('testsGrid');
          testsGrid.innerHTML = ratingGroup.tests.map(test => \`
              <div class="test-card \${test.status.toLowerCase()}" onclick="showTestDetail('\${test.testName}', '\${test.timestamp}')">
                  <div class="test-card-header">
                      <span class="test-name">\${test.testName}</span>
                      <span class="test-rating">\${parseFloat(test.rating).toFixed(1)}/10</span>
                  </div>
                  <div class="test-card-meta">
                      <span class="test-status \${test.status.toLowerCase()}">\${test.status}</span>
                      <span class="test-time">\${new Date(test.timestamp).toLocaleString('en-US')}</span>
                  </div>
                  <div class="test-preview">
                      \${test.prompt.substring(0, 100)}...
                  </div>
              </div>
          \`).join('');
          
          showPage('testsPage');
      }
      
      // Mostrar todos os testes
      function showAllTests() {
          document.getElementById('testsPageTitle').textContent = \`All Tests (\${testDetails.length} tests)\`;
          
          const testsGrid = document.getElementById('testsGrid');
          testsGrid.innerHTML = testDetails.map(test => \`
              <div class="test-card \${test.status.toLowerCase()}" onclick="showTestDetail('\${test.testName}', '\${test.timestamp}')">
                  <div class="test-card-header">
                      <span class="test-name">\${test.testName}</span>
                      <span class="test-rating">\${parseFloat(test.rating).toFixed(1)}/10</span>
                  </div>
                  <div class="test-card-meta">
                      <span class="test-status \${test.status.toLowerCase()}">\${test.status}</span>
                      <span class="test-time">\${new Date(test.timestamp).toLocaleString('en-US')}</span>
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
          document.querySelector('.test-timestamp').textContent = new Date(test.timestamp).toLocaleString('en-US');
          
          // Detect if conversation or simple test
          if (test.conversationEntries && test.conversationEntries.length > 0) {
              // CASE 2: Conversation test
              document.getElementById('testPrompt').innerHTML = \`
                  <div class="conversation-entries">
                      \${test.conversationEntries.map((entry, index) => \`
                          <div class="conversation-entry">
                              <div class="conversation-header">
                                  <span>💬 Interaction \${index + 1}</span>
                                  <span class="conversation-meta">
                                      📅 \${new Date(entry.timestamp).toLocaleString('en-US')} | 
                                      🎯 \${entry.tokens.total} tokens
                                  </span>
                              </div>
                              <div class="user-message">
                                  <div class="message-timeline"></div>
                                  <strong>👤 User</strong>
                                  <div class="message-content">\${entry.userMessage.replace(/║/g, '')}</div>
                              </div>
                              <div class="assistant-message">
                                  <div class="message-timeline"></div>
                                  <strong>🤖 Assistant</strong>
                                  <div class="message-content">\${entry.assistantResponse}</div>
                              </div>
                          </div>
                      \`).join('')}
                  </div>
              \`;
              document.getElementById('testOutput').textContent = test.output;
          } else {
              // CASE 1: Simple test
              document.getElementById('testPrompt').textContent = test.prompt;
              document.getElementById('testOutput').textContent = test.output;
          }
          
          // Explanation
          document.getElementById('testExplanation').textContent = test.explanation || 'Not available';
          
          // Criteria
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
          
          // Logs estruturados
          if (test.logs) {
              // HTTP Logs
              document.getElementById('httpLogs').innerHTML = test.logs.http.length > 0 
                  ? test.logs.http.map((log, index) => \`
                      <div class="log-entry HTTP">
                          <div class="log-timestamp">\${new Date(log.timestamp).toLocaleString('en-US')}</div>
                          <div class="log-info">
                              <div class="log-item"><strong>Method:</strong> \${log.method}</div>
                              <div class="log-item"><strong>URL:</strong> \${log.url}</div>
                              <div class="log-item"><strong>Status:</strong> <span class="status-\${log.status >= 200 && log.status < 300 ? 'success' : 'error'}">\${log.status}</span></div>
                              \${log.model ? \`<div class="log-item"><strong>Model:</strong> \${log.model}</div>\` : ''}
                              \${log.tokens ? \`<div class="log-item"><strong>Tokens:</strong> \${log.tokens.total} (prompt: \${log.tokens.prompt}, completion: \${log.tokens.completion})</div>\` : ''}
                              
                              \${log.payload ? \`
                                  <div class="dropdown-container">
                                      <button class="dropdown-toggle" onclick="toggleDropdown('payload-\${index}')">
                                          📤 View Payload <span id="payload-\${index}-icon" class="dropdown-icon">▼</span>
                                      </button>
                                      <div id="payload-\${index}" class="dropdown-content">
                                          <pre class="json-content">\${log.payload}</pre>
                                      </div>
                                  </div>
                              \` : ''}
                              
                              \${log.response ? \`
                                  <div class="dropdown-container">
                                      <button class="dropdown-toggle" onclick="toggleDropdown('response-\${index}')">
                                          📥 View Response <span id="response-\${index}-icon" class="dropdown-icon">▼</span>
                                      </button>
                                      <div id="response-\${index}" class="dropdown-content">
                                          <pre class="json-content">\${log.response}</pre>
                                      </div>
                                  </div>
                              \` : ''}
                          </div>
                      </div>
                  \`).join('')
                  : '<div class="log-entry"><div class="log-content">No HTTP requests found.</div></div>';
              
              // LLM Logs
              document.getElementById('llmLogs').innerHTML = test.logs.llm.length > 0
                  ? test.logs.llm.map(log => \`
                      <div class="log-entry LLM">
                          <div class="log-timestamp">\${new Date(log.timestamp).toLocaleString('en-US')}</div>
                          <div class="log-info">
                              <div class="log-item"><strong>Model:</strong> \${log.model}</div>
                              <div class="log-item"><strong>Finish Reason:</strong> \${log.finishReason}</div>
                              <div class="log-item"><strong>Tokens:</strong> \${log.tokens.total} (prompt: \${log.tokens.prompt}, completion: \${log.tokens.completion})</div>
                              <div class="log-item"><strong>Prompt:</strong></div>
                              <div class="log-text">\${log.prompt}</div>
                              <div class="log-item"><strong>Response:</strong></div>
                              <div class="log-text">\${log.response}</div>
                          </div>
                      </div>
                  \`).join('')
                  : '<div class="log-entry"><div class="log-content">No LLM interactions found.</div></div>';
              
              // Judge Logs
              document.getElementById('judgeLogs').innerHTML = test.logs.judge.length > 0
                  ? test.logs.judge.map(log => \`
                      <div class="log-entry JUDGE">
                          <div class="log-timestamp">\${new Date(log.timestamp).toLocaleString('en-US')}</div>
                          <div class="log-info">
                              <div class="log-item"><strong>Rating:</strong> <span class="rating-value">\${log.rating}/10</span></div>
                              <div class="log-item"><strong>Status:</strong> <span class="status-\${log.status.includes('PASS') ? 'success' : 'error'}">\${log.status}</span></div>
                              \${!test.conversationEntries ? \`
                                  <div class="log-item"><strong>Question:</strong></div>
                                  <div class="log-text">\${log.question}</div>
                                  <div class="log-item"><strong>Evaluated Response:</strong></div>
                                  <div class="log-text">\${log.answer}</div>
                              \` : \`
                                  <div class="log-item"><strong>Complete Conversation:</strong></div>
                                  <div class="log-text">\${test.conversationEntries.map((entry, idx) => 
                                      \`💬 Interaction \${idx + 1}:\\n[user]: \${entry.userMessage.replace(/║/g, '').trim()}\\n[assistant]: \${entry.assistantResponse.trim()}\`
                                  ).join('\\n\\n───────────────\\n\\n')}</div>
                                  <div class="log-item"><strong>Evaluation Focus:</strong></div>
                                  <div class="log-text">Overall conversation quality, coherence, and response relevance across multiple interactions</div>
                              \`}
                              \${log.criteria ? \`
                                  <div class="log-item"><strong>Criteria:</strong></div>
                                  <div class="criteria-mini">
                                      <span>H:\${log.criteria.helpfulness}</span>
                                      <span>R:\${log.criteria.relevance}</span>
                                      <span>A:\${log.criteria.accuracy}</span>
                                      <span>D:\${log.criteria.depth}</span>
                                      <span>LoD:\${log.criteria.levelOfDetail}</span>
                                  </div>
                              \` : ''}
                              <div class="log-item"><strong>Explanation:</strong></div>
                              <div class="log-text" style="max-height: none; white-space: pre-wrap;">\${log.explanation}</div>
                          </div>
                      </div>
                  \`).join('')
                  : '<div class="log-entry"><div class="log-content">No judge evaluations found.</div></div>';
          } else {
              document.getElementById('httpLogs').innerHTML = '<div class="log-entry"><div class="log-content">Logs not available.</div></div>';
              document.getElementById('llmLogs').innerHTML = '<div class="log-entry"><div class="log-content">Logs not available.</div></div>';
              document.getElementById('judgeLogs').innerHTML = '<div class="log-entry"><div class="log-content">Logs not available.</div></div>';
          }
          
          showPage('testDetailPage');
      }
      
      // Function to switch between log tabs
      function showLogTab(tabName) {
          // Remove active from all buttons and contents
          document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
          document.querySelectorAll('.log-tab-content').forEach(content => content.classList.remove('active'));
          
          // Activate selected tab
          document.querySelector(\`button[onclick="showLogTab('\${tabName}')"]\`).classList.add('active');
          document.getElementById(\`\${tabName}Logs\`).classList.add('active');
      }
      
      // Function to control expandable dropdowns
      function toggleDropdown(dropdownId) {
          const content = document.getElementById(dropdownId);
          const icon = document.getElementById(dropdownId + '-icon');
          
          if (content.classList.contains('open')) {
              content.classList.remove('open');
              icon.textContent = '▼';
          } else {
              content.classList.add('open');
              icon.textContent = '▲';
          }
      }
      
      // Existing charts
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
        
      // Functions for error page
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
        
        // Functions for AI Analytics UI
        function toggleAIInsights() {
          const content = document.getElementById('ai-insights-content');
          const icon = document.getElementById('ai-insights-icon');
          
          if (content.classList.contains('open')) {
            content.classList.remove('open');
            icon.textContent = '▼';
          } else {
            content.classList.add('open');
            icon.textContent = '▲';
          }
        }
        
        function showAnomaliesPage() {
          showPage('anomaliesPage');
        }
        
        function searchTestByName(testName) {
          // Find the test and show its details
          const test = testDetails.find(t => t.testName === testName);
          if (test) {
            showTestDetail(testName, test.timestamp);
          }
        }
        
        function hideErrorPage() {
            document.getElementById('errorPage').classList.remove('active');
        }
      
      // Initialization
      document.addEventListener('DOMContentLoaded', function() {
          createInteractiveRatingChart();
      });
    `;
  }
}