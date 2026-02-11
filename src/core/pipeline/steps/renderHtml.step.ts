import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Handlebars from 'handlebars';
import type { ReportContext } from '../../context/ReportContext.js';
import type { ProfileResult } from '../../../types/index.js';
import { registerHelpers } from '../../../templates/helpers/slider.helper.js';
import { Profile } from '../../../models/profile.model.js';

const TEMPLATES_DIR = join(process.cwd(), 'src', 'templates');
const LAYOUTS_DIR = join(TEMPLATES_DIR, 'layouts');
const PARTIALS_DIR = join(TEMPLATES_DIR, 'partials');
const STYLES_DIR = join(TEMPLATES_DIR, 'styles');

const PARTIAL_NAMES = [
  'cover-page',
  'patient-header',
  'summary',
  'profile-card',
  'body-summary',
  'recommendations',
  'legend',
];

// Body position mapping for known organ profiles
const ORGAN_POSITIONS: Record<string, { x: number; y: number }> = {
  thyroid_profile: { x: 200, y: 75 },
  thyroid_function: { x: 200, y: 75 },
  complete_blood_count: { x: 40, y: 100 },
  blood_counts: { x: 40, y: 100 },
  cardiac_risk: { x: 80, y: 130 },
  lipid_profile: { x: 40, y: 175 },
  liver_profile: { x: 230, y: 160 },
  liver_function: { x: 230, y: 160 },
  kidney_profile: { x: 40, y: 220 },
  kidney_function: { x: 40, y: 220 },
  diabetes_monitoring: { x: 230, y: 190 },
  blood_sugar: { x: 230, y: 190 },
  electrolyte_profile: { x: 230, y: 220 },
  vitamin_profile: { x: 40, y: 260 },
  vitamin_d: { x: 40, y: 290 },
  iron_studies: { x: 230, y: 260 },
  bone_profile: { x: 230, y: 300 },
  urine_analysis: { x: 40, y: 320 },
};

interface BodySummaryProfile {
  displayName: string;
  overallStatus: string;
  posX: number;
  posY: number;
}

async function buildBodySummaryProfiles(profiles: ProfileResult[]): Promise<BodySummaryProfile[]> {
  const result: BodySummaryProfile[] = [];

  for (const profile of profiles) {
    if (profile.profileId === 'other_tests') continue;

    // Check hardcoded positions first
    const pos = ORGAN_POSITIONS[profile.profileId];
    if (pos) {
      result.push({
        displayName: profile.displayName,
        overallStatus: profile.overallStatus,
        posX: pos.x,
        posY: pos.y,
      });
      continue;
    }

    // Try loading from profile doc bodySummary position
    const doc = await Profile.findOne({ profileId: profile.profileId }).select('bodySummary').lean();
    if (doc?.bodySummary?.position?.x != null && doc?.bodySummary?.position?.y != null) {
      result.push({
        displayName: profile.displayName,
        overallStatus: profile.overallStatus,
        posX: doc.bodySummary.position.x * 3.2, // Scale from 0-100 to pixel space
        posY: doc.bodySummary.position.y * 4.4,
      });
    }
  }

  return result;
}

export async function renderHtml(ctx: ReportContext): Promise<ReportContext> {
  // Register custom helpers
  registerHelpers();

  const styles = await readFile(join(STYLES_DIR, 'base.css'), 'utf-8');
  const layoutSource = await readFile(join(LAYOUTS_DIR, 'report.hbs'), 'utf-8');

  for (const name of PARTIAL_NAMES) {
    const partialSource = await readFile(join(PARTIALS_DIR, `${name}.hbs`), 'utf-8');
    Handlebars.registerPartial(name, partialSource);
  }

  // Build body summary data
  const bodySummaryProfiles = await buildBodySummaryProfiles(ctx.profiles);
  const showBodySummary = bodySummaryProfiles.length >= 3;

  // Inject client config color overrides as CSS custom properties
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

  const template = Handlebars.compile(layoutSource);
  const html = template({
    patientName: ctx.input.patientName ?? '',
    age: ctx.input.age ?? 0,
    gender: ctx.input.gender ?? '',
    labNo: ctx.input.labNo ?? '',
    reportDate: new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    profiles: ctx.profiles,
    insights: ctx.insights ?? [],
    showBodySummary,
    bodySummaryProfiles,
    styles: combinedStyles,
  });

  ctx.html = html;
  return ctx;
}
