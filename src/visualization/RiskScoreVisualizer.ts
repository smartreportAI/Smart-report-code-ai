/**
 * RiskScoreVisualizer - Health score and risk visualization for reports
 * Phase 1.5: Integrates with AnalyticsService
 */

import type { HealthScore, RiskFactor } from '../services/AnalyticsService';
import { SVGChartGenerator } from './SVGChartGenerator';

export class RiskScoreVisualizer {
  /**
   * Generate HTML for health score gauge + risk factors
   */
  static renderAnalyticsSection(
    healthScore: HealthScore,
    risks: RiskFactor[],
    biomarkerCount: number,
    t: (key: string, params?: Record<string, string | number>) => string
  ): string {
    const gaugeSvg = SVGChartGenerator.gauge({
      score: healthScore.score,
      maxScore: 100,
      color: healthScore.color,
      label: healthScore.status,
      width: 140,
      height: 90
    });

    let risksHtml = '';
    if (risks.length > 0) {
      risksHtml = risks
        .map(
          (risk) => `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding: 12px; border-radius: 6px; background: ${risk.level === 'HIGH' ? '#FFEBEE' : risk.level === 'MODERATE' ? '#FFF3E0' : '#E8F5E9'}; border-left: 4px solid ${risk.level === 'HIGH' ? '#F44336' : risk.level === 'MODERATE' ? '#FFA726' : '#4CAF50'};">
          <div style="flex-shrink: 0;">${SVGChartGenerator.riskBar(risk.level)}</div>
          <div>
            <div style="font-weight: 600; font-size: 14px;">${risk.category}</div>
            <div style="font-size: 12px; color: #555;">${risk.description}</div>
          </div>
        </div>
      `
        )
        .join('');
    } else {
      risksHtml = `
        <div style="padding: 20px; background: #E8F5E9; border-radius: 6px; text-align: center; color: #2E7D32;">
          <strong>${t('report.noRiskFactors')}</strong>
          <p style="font-size: 13px; margin-top: 5px;">${t('report.keepUpLifestyle')}</p>
        </div>
      `;
    }

    return `
      <div class="page-break"></div>
      <div class="analytics-section" style="margin-top: 30px; margin-bottom: 30px;">
        <h3 style="color: var(--primary); border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">
          📈 ${t('report.healthInsights')}
        </h3>
        
        <div style="display: flex; gap: 30px; margin-bottom: 30px; flex-wrap: wrap;">
          <div style="flex: 0 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="color: #666; margin-bottom: 15px;">${t('report.overallHealthScore')}</h4>
            <div style="display: inline-block;">
              ${gaugeSvg}
            </div>
            <p style="margin-top: 10px; font-size: 13px; color: #888;">
              ${t('report.basedOnBiomarkers', { count: biomarkerCount })}
            </p>
          </div>
          
          <div style="flex: 1; min-width: 200px;">
            <h4 style="color: #666; margin-bottom: 15px;">${t('report.riskAssessment')}</h4>
            ${risksHtml}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Compact analytics (for Hybrid report)
   */
  static renderCompactAnalytics(
    healthScore: HealthScore,
    risks: RiskFactor[],
    biomarkerCount: number,
    t: (key: string, params?: Record<string, string | number>) => string
  ): string {
    const gaugeSvg = SVGChartGenerator.gauge({
      score: healthScore.score,
      color: healthScore.color,
      label: healthScore.status,
      width: 120,
      height: 80
    });

    let risksHtml = '';
    if (risks.length > 0) {
      risksHtml = risks
        .map(
          (risk) => `
        <div style="margin-bottom: 8px; padding: 10px; border-radius: 4px; background: ${risk.level === 'HIGH' ? '#FFEBEE' : risk.level === 'MODERATE' ? '#FFF3E0' : '#E8F5E9'}; border-left: 3px solid ${risk.level === 'HIGH' ? '#F44336' : risk.level === 'MODERATE' ? '#FFA726' : '#4CAF50'};">
          <strong>${risk.category}</strong> <span style="font-size: 11px;">(${risk.level})</span>
          <div style="font-size: 12px; color: #555; margin-top: 4px;">${risk.description}</div>
        </div>
      `
        )
        .join('');
    } else {
      risksHtml = `<div style="padding: 15px; background: #E8F5E9; border-radius: 4px; color: #2E7D32; font-size: 13px;">${t('report.noRiskFactors')}</div>`;
    }

    return `
      <div class="page-break"></div>
      <div style="margin-top: 25px; margin-bottom: 25px;">
        <h3 style="color: var(--primary); border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">
          📈 ${t('report.healthInsights')}
        </h3>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div style="flex: 0 0 auto; background: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center;">
            <h4 style="color: #666; margin-bottom: 10px; font-size: 14px;">${t('report.overallHealthScore')}</h4>
            ${gaugeSvg}
            <p style="margin-top: 5px; font-size: 12px; color: #888;">${t('report.basedOnBiomarkers', { count: biomarkerCount })}</p>
          </div>
          <div style="flex: 1; min-width: 180px;">${risksHtml}</div>
        </div>
      </div>
    `;
  }
}
