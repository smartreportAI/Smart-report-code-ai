/**
 * SVGChartGenerator - Generates SVG charts for reports
 * Phase 1.5: Pure SVG, no external dependencies, PDF-friendly
 *
 * Chart types:
 * - Gauge: semi-circle health score (0-100)
 * - Bar: horizontal bar showing value vs reference range
 * - RiskBar: horizontal bar for risk level
 */

import type { HealthScore } from '../services/AnalyticsService';

export class SVGChartGenerator {
  /**
   * Generate semi-circle gauge SVG for health score
   */
  static gauge(config: {
    score: number;
    maxScore?: number;
    color: string;
    label: string;
    width?: number;
    height?: number;
  }): string {
    const width = config.width ?? 160;
    const height = config.height ?? 100;
    const maxScore = config.maxScore ?? 100;
    const score = Math.min(config.score, maxScore);
    const normalized = score / maxScore;

    // Semi-circle: 0 at left, 100 at right. Arc goes from 180° to 0°
    const cx = width / 2;
    const r = (width / 2) - 10;
    const strokeWidth = 10;
    const bgStroke = '#E0E0E0';
    const valueStroke = config.color;

    // Background arc (full semi-circle)
    const bgArc = this.describeArc(cx, height - 5, r, 180, 0);
    // Value arc (partial)
    const endAngle = 180 - (normalized * 180);
    const valueArc = this.describeArc(cx, height - 5, r, 180, endAngle);

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="display: block;">
        <path d="${bgArc}" fill="none" stroke="${bgStroke}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
        <path d="${valueArc}" fill="none" stroke="${valueStroke}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
        <text x="${cx}" y="${height - 25}" text-anchor="middle" font-size="24" font-weight="bold" fill="${valueStroke}">${Math.round(score)}</text>
        <text x="${cx}" y="${height - 8}" text-anchor="middle" font-size="11" fill="#666">${config.label}</text>
      </svg>
    `;
  }

  private static describeArc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ): string {
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = x + radius * Math.cos(rad(startAngle));
    const y1 = y + radius * Math.sin(rad(startAngle));
    const x2 = x + radius * Math.cos(rad(endAngle));
    const y2 = y + radius * Math.sin(rad(endAngle));
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} ${startAngle > endAngle ? 0 : 1} ${x2} ${y2}`;
  }

  /**
   * Horizontal bar: value within min-max range
   */
  static horizontalBar(config: {
    value: number;
    min: number;
    max: number;
    unit: string;
    label: string;
    valueColor: string;
    width?: number;
    height?: number;
  }): string {
    const w = config.width ?? 200;
    const h = config.height ?? 28;
    const pad = 4;
    const range = config.max - config.min || 1;
    const span = Math.max(range, Math.abs(config.value - config.min), Math.abs(config.value - config.max));
    const lo = Math.min(config.min, config.value) - 0.1 * span;
    const hi = Math.max(config.max, config.value) + 0.1 * span;
    const scale = (v: number) => pad + ((v - lo) / (hi - lo)) * (w - 2 * pad);

    const minX = scale(config.min);
    const maxX = scale(config.max);
    const valX = Math.max(pad, Math.min(w - pad, scale(config.value)));

    return `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display: block;">
        <rect x="${pad}" y="${h / 2 - 3}" width="${w - 2 * pad}" height="6" rx="3" fill="#E0E0E0"/>
        <rect x="${minX}" y="${h / 2 - 3}" width="${maxX - minX}" height="6" rx="3" fill="#C8E6C9"/>
        <line x1="${valX}" y1="${h / 2 - 8}" x2="${valX}" y2="${h / 2 + 8}" stroke="${config.valueColor}" stroke-width="3"/>
        <text x="${pad}" y="${h - 2}" font-size="10" fill="#333">${config.label}: ${config.value} ${config.unit}</text>
      </svg>
    `;
  }

  /**
   * Simple risk level bar (LOW / MODERATE / HIGH)
   */
  static riskBar(level: 'LOW' | 'MODERATE' | 'HIGH', width: number = 80): string {
    const colors = { LOW: '#4CAF50', MODERATE: '#FFA726', HIGH: '#F44336' };
    const pct = level === 'LOW' ? 33 : level === 'MODERATE' ? 66 : 100;
    const color = colors[level];

    return `
      <svg width="${width}" height="12" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${width}" height="12" rx="6" fill="#E0E0E0"/>
        <rect x="0" y="0" width="${(width * pct) / 100}" height="12" rx="6" fill="${color}"/>
      </svg>
    `;
  }
}
