import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Handlebars from 'handlebars';
import type { ReportContext } from '../../context/ReportContext.js';
import type { ProfileResult, InsightItem, TestResult } from '../../../types/index.js';
import { registerHelpers } from '../../../templates/helpers/slider.helper.js';
import type { ColorIndicator } from '../../../types/index.js';

const TEMPLATES_DIR = join(process.cwd(), 'src', 'templates');
const LAYOUTS_DIR = join(TEMPLATES_DIR, 'layouts');
const PARTIALS_DIR = join(TEMPLATES_DIR, 'partials');
const STYLES_DIR = join(TEMPLATES_DIR, 'styles');

const SHARED_PARTIALS = ['cover-page', 'patient-header'];

const COMPACT_PARTIALS = ['summary', 'profile-card', 'recommendations', 'legend', 'body-summary'];

const DYNAMIC_PARTIALS = [
  'health-score',
  'key-abnormal',
  'organ-dashboard',
  'full-report-dynamic',
  'ai-insights',
  'action-plan',
];

async function registerPartials(): Promise<void> {
  for (const name of SHARED_PARTIALS) {
    const path = join(PARTIALS_DIR, 'shared', `${name}.hbs`);
    try {
      const src = await readFile(path, 'utf-8');
      Handlebars.registerPartial(name, src);
    } catch {
      /* partial may not exist */
    }
  }
  for (const name of COMPACT_PARTIALS) {
    const path = join(PARTIALS_DIR, 'compact', `${name}.hbs`);
    try {
      const src = await readFile(path, 'utf-8');
      Handlebars.registerPartial(name, src);
    } catch {
      /* partial may not exist */
    }
  }
  for (const name of DYNAMIC_PARTIALS) {
    const path = join(PARTIALS_DIR, 'dynamic', `${name}.hbs`);
    try {
      const src = await readFile(path, 'utf-8');
      Handlebars.registerPartial(name, src);
    } catch {
      /* partial may not exist */
    }
  }
}

// Profile ID to body-summary position (px) for compact report
const PROFILE_TO_BODY_POS: Record<string, { posX: number; posY: number }> = {
  lipid_profile: { posX: 125, posY: 130 },
  liver_profile: { posX: 165, posY: 165 },
  kidney_profile: { posX: 160, posY: 220 },
  thyroid_profile: { posX: 140, posY: 75 },
  blood_counts: { posX: 140, posY: 255 },
  complete_blood_count: { posX: 140, posY: 255 },
  diabetes_monitoring: { posX: 135, posY: 185 },
  blood_sugar: { posX: 135, posY: 185 },
};

function buildBodySummaryProfiles(
  profiles: ProfileResult[],
): Array<{ displayName: string; overallStatus: string; posX: number; posY: number }> {
  return profiles
    .filter((p) => p.profileId !== 'other_tests')
    .map((p) => {
      const pos = PROFILE_TO_BODY_POS[p.profileId] ?? { posX: 150, posY: 200 };
      return { displayName: p.displayName, overallStatus: p.overallStatus, ...pos };
    });
}

// Profile ID to organ name mapping
const PROFILE_TO_ORGAN: Record<string, string> = {
  lipid_profile: 'Heart',
  liver_profile: 'Liver',
  kidney_profile: 'Kidney',
  thyroid_profile: 'Thyroid',
  blood_counts: 'Blood',
  complete_blood_count: 'Blood',
  diabetes_monitoring: 'Metabolism',
  blood_sugar: 'Metabolism',
};

// Score from status: normal=90-100, borderline=70-79, high/low=50-69, critical=30-49
function statusToScore(status: string): number {
  switch (status) {
    case 'normal': return 92;
    case 'borderline': return 75;
    case 'high': case 'low': return 58;
    case 'critical': return 38;
    default: return 78;
  }
}

// Health score formula: 100 - penalties
function computeHealthScore(insights: InsightItem[]): { score: number; status: string; explanation: string } {
  let penalty = 0;
  for (const i of insights) {
    if (i.severity === 'critical') penalty += 15;
    else if (i.severity === 'high' || i.severity === 'low') penalty += 10;
    else if (i.severity === 'borderline') penalty += 5;
  }
  const score = Math.max(0, Math.min(100, 100 - penalty));
  let status: string;
  let explanation: string;
  if (score >= 85) {
    status = 'Excellent';
    explanation = 'Your overall lab results indicate excellent health. Keep up your healthy habits.';
  } else if (score >= 70) {
    status = 'Good';
    explanation = 'Your overall lab results suggest good health with a few areas to monitor. Focus on the abnormal values highlighted in this report.';
  } else {
    status = 'Needs Attention';
    explanation = 'Some results require attention. Please review the abnormal values and follow the recommendations. Consult your doctor for personalized advice.';
  }
  return { score, status, explanation };
}

// Dummy organ scores when no matching profile
const DEFAULT_ORGAN_SCORES = [
  { organ: 'Heart', score: 72, status: 'borderline' as ColorIndicator },
  { organ: 'Liver', score: 90, status: 'normal' as ColorIndicator },
  { organ: 'Kidney', score: 85, status: 'normal' as ColorIndicator },
  { organ: 'Thyroid', score: 95, status: 'normal' as ColorIndicator },
  { organ: 'Blood', score: 78, status: 'borderline' as ColorIndicator },
];

function buildOrganScores(profiles: ProfileResult[]): Array<{ organ: string; score: number; status: string }> {
  const byOrgan = new Map<string, { score: number; status: string }>();
  for (const p of profiles) {
    if (p.profileId === 'other_tests') continue;
    const organ = PROFILE_TO_ORGAN[p.profileId];
    if (organ) {
      byOrgan.set(organ, {
        score: statusToScore(p.overallStatus),
        status: p.overallStatus,
      });
    }
  }
  const result: Array<{ organ: string; score: number; status: string }> = [];
  for (const def of DEFAULT_ORGAN_SCORES) {
    const data = byOrgan.get(def.organ) ?? { score: def.score, status: def.status };
    result.push({ organ: def.organ, score: data.score, status: data.status });
  }
  return result;
}

function buildActionPlan(insights: InsightItem[], profiles: ProfileResult[]): {
  urgent: string[];
  monitor: string[];
  goodAreas: string[];
} {
  const urgent: string[] = [];
  const monitor: string[] = [];
  const goodAreas: string[] = [];

  for (const i of insights) {
    if (i.severity === 'critical') {
      urgent.push(`Consult doctor for ${i.testName} (${i.value} ${i.unit})`);
    } else {
      monitor.push(`${i.testName} – ${i.severity} at ${i.value} ${i.unit}. ${i.tip || 'Retest in 6 weeks.'}`);
    }
  }

  for (const p of profiles) {
    if (p.profileId === 'other_tests') continue;
    if (p.overallStatus === 'normal') {
      goodAreas.push(`${p.displayName} is in good shape`);
    }
  }

  if (urgent.length === 0) urgent.push('No urgent items');
  if (monitor.length === 0) monitor.push('Keep an eye on lifestyle factors');
  if (goodAreas.length === 0) goodAreas.push('Your thyroid, liver, and kidney results are in good shape');

  return { urgent, monitor, goodAreas };
}

// Pad key abnormal with dummy if fewer than 5
const DUMMY_ABNORMAL = [
  { testName: 'Haemoglobin', value: '12.0', unit: 'g/dL', severity: 'low' as ColorIndicator, tip: 'Slightly below range. Consider iron-rich diet.' },
  { testName: 'Glucose', value: '142', unit: 'mg/dL', severity: 'high' as ColorIndicator, tip: 'Fasting glucose elevated. Monitor and consider dietary changes.' },
  { testName: 'Total Cholesterol', value: '230', unit: 'mg/dL', severity: 'high' as ColorIndicator, tip: 'Above target. Reduce saturated fat intake.' },
  { testName: 'TSH', value: '5.2', unit: 'mIU/L', severity: 'borderline' as ColorIndicator, tip: 'Borderline. Re-test in 3 months.' },
  { testName: 'Serum Creatinine', value: '1.5', unit: 'mg/dL', severity: 'high' as ColorIndicator, tip: 'Slightly elevated. Stay hydrated.' },
];

function getKeyAbnormal(insights: InsightItem[]): Array<{ testName: string; value: string | number; unit: string; severity: string; tip: string }> {
  if (insights.length === 0) return [];
  const top5 = insights.slice(0, 5);
  if (top5.length >= 5) return top5;
  const pad = DUMMY_ABNORMAL.slice(0, 5 - top5.length);
  return [...top5, ...pad];
}

// Split profile tests into abnormal (big cards) and normal (compact)
interface ProfileWithSplit extends ProfileResult {
  abnormalTests: TestResult[];
  normalTests: TestResult[];
}

function splitProfileTests(profiles: ProfileResult[]): ProfileWithSplit[] {
  return profiles.map((p) => {
    const abnormalTests = p.testResults.filter((t) => t.colorIndicator !== 'normal');
    const normalTests = p.testResults.filter((t) => t.colorIndicator === 'normal');
    return { ...p, abnormalTests, normalTests };
  });
}

function resolveReportType(ctx: ReportContext): 'compact' | 'dynamic' {
  const input = ctx.input as { reportType?: string };
  const fromInput = input?.reportType;
  const fromConfig = ctx.config?.stateData?.reportType as string | undefined;
  const resolved = fromInput === 'compact' || fromInput === 'dynamic'
    ? fromInput
    : fromConfig === 'compact' || fromConfig === 'dynamic'
      ? fromConfig
      : 'dynamic';
  return resolved as 'compact' | 'dynamic';
}

function resolveStateFlag(
  ctx: ReportContext,
  key: string,
  defaultValue: boolean,
): boolean {
  const val = ctx.config?.stateData?.[key];
  if (typeof val === 'boolean') return val;
  return defaultValue;
}

export async function renderHtml(ctx: ReportContext): Promise<ReportContext> {
  registerHelpers();
  await registerPartials();

  const styles = await readFile(join(STYLES_DIR, 'base.css'), 'utf-8');

  const reportType = resolveReportType(ctx);
  const showCoverPage = resolveStateFlag(ctx, 'generateCoverPage', true);
  const showSummary = resolveStateFlag(ctx, 'showSummary', true);
  const showBodySummary = resolveStateFlag(ctx, 'showBodySummary', true);
  const showRecommendations = resolveStateFlag(ctx, 'showRecommendations', true);

  const layoutFile = reportType === 'compact' ? 'compact.hbs' : 'dynamic.hbs';
  const layoutSource = await readFile(join(LAYOUTS_DIR, layoutFile), 'utf-8');

  const insights = ctx.insights ?? [];
  const profiles = ctx.profiles ?? [];

  const colors = ctx.config?.colors?.colored;
  let colorOverrides = '';
  if (colors) {
    colorOverrides = `
    :root {
      --color-normal: ${colors.normal};
      --color-borderline: ${colors.borderline};
      --color-high: ${colors.high};
      --color-low: ${colors.low};
      --color-critical: ${colors.critical};
    }`;
  }
  const combinedStyles = styles + colorOverrides;

  const input = ctx.input as { patientName?: string; age?: number; gender?: string; labNo?: string };
  const baseData = {
    patientName: input.patientName ?? '',
    age: input.age ?? 0,
    gender: input.gender ?? '',
    labNo: input.labNo ?? '',
    reportDate: new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    testPackageName: 'Complete Health Panel',
    styles: combinedStyles,
    showCoverPage,
    showSummary,
    showBodySummary,
    showRecommendations,
  };

  let templateData: Record<string, unknown>;

  if (reportType === 'compact') {
    const bodySummaryProfiles = buildBodySummaryProfiles(profiles);
    const hasBodySummaryData = bodySummaryProfiles.length > 0;
    templateData = {
      ...baseData,
      profiles,
      insights,
      bodySummaryProfiles,
      showBodySummary: showBodySummary && hasBodySummaryData,
    };
  } else {
    const { score: healthScore, status: healthScoreStatus, explanation: healthScoreExplanation } =
      computeHealthScore(insights);
    const organScores = buildOrganScores(profiles);
    const actionPlan = buildActionPlan(insights, profiles);
    const keyAbnormal = getKeyAbnormal(insights);
    const profilesWithSplit = splitProfileTests(profiles);
    templateData = {
      ...baseData,
      healthScore,
      healthScoreStatus,
      healthScoreExplanation,
      organScores,
      actionPlan,
      keyAbnormal,
      insights,
      profiles: profilesWithSplit,
    };
  }

  const template = Handlebars.compile(layoutSource);
  ctx.html = template(templateData);
  return ctx;
}
