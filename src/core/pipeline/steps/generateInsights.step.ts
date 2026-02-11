import type { ReportContext } from '../../context/ReportContext.js';
import type { InsightItem, ColorIndicator } from '../../../types/index.js';

const SEVERITY_ORDER: Record<ColorIndicator, number> = {
  critical: 0,
  high: 1,
  low: 2,
  borderline: 3,
  normal: 4,
};

export async function generateInsights(ctx: ReportContext): Promise<ReportContext> {
  const insights: InsightItem[] = [];

  for (const profile of ctx.profiles) {
    if (profile.overallStatus === 'normal') continue;
    const abnormal = profile.testResults.filter(
      (t) => t.colorIndicator !== 'normal',
    );
    for (const t of abnormal) {
      insights.push({
        testName: t.standardName,
        value: t.value,
        unit: t.unit,
        severity: t.colorIndicator,
        tip: t.content.tip || `Consult your doctor about your ${t.standardName} levels.`,
      });
    }
  }

  // Sort by severity: critical first, then high, low, borderline
  insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  ctx.insights = insights;
  return ctx;
}
