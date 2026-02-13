/**
 * ChartConfig - Chart type mapping and display configuration
 * Phase 1.5: Visualization system
 */

import type { TestReportCondensed } from '../models/TestReportCondensed';

export type ChartType = 'bar' | 'gauge' | 'horizontalBar';

/**
 * Map test parameter to chart type (from testsDatabase chartType)
 */
export function getChartTypeForTest(test: TestReportCondensed): ChartType {
  const ct = test.testDefaults?.chartType;
  if (ct === 'BC') return 'bar';
  if (ct === 'GC') return 'gauge';
  if (ct === 'LC' || ct === 'PC') return 'bar';
  return 'bar'; // default
}

/**
 * Color for value status
 */
export function getColorForIndicator(indicator: string): string {
  const colors: Record<string, string> = {
    normal: '#4CAF50',
    oneFromNormal: '#FFA726',
    twoFromNormal: '#FF7043',
    threeFromNormal: '#F44336',
    finalCritical: '#B71C1C'
  };
  return colors[indicator] ?? '#9E9E9E';
}

export interface GaugeConfig {
  width: number;
  height: number;
  value: number;
  maxValue: number;
  color: string;
  label: string;
  showValue: boolean;
}

export interface BarChartConfig {
  width: number;
  height: number;
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  valueColor: string;
  showRange: boolean;
}
