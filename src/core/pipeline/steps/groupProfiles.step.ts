import { Profile } from '../../../models/profile.model.js';
import { Mapping } from '../../../models/mapping.model.js';
import type { ReportContext } from '../../context/ReportContext.js';
import type { ReportInput } from '../../../types/index.js';
import type { TestResult, ProfileResult, ColorIndicator } from '../../../types/index.js';

const PRIORITY: Record<ColorIndicator, number> = {
  critical: 0,
  high: 1,
  low: 2,
  borderline: 3,
  normal: 4,
};

function determineProfileStatus(tests: TestResult[]): ColorIndicator {
  if (tests.length === 0) return 'normal';
  return tests.reduce<ColorIndicator>((worst, test) => {
    return PRIORITY[test.colorIndicator] < PRIORITY[worst] ? test.colorIndicator : worst;
  }, 'normal');
}

export async function groupProfiles(ctx: ReportContext): Promise<ReportContext> {
  const byProfile = new Map<string, TestResult[]>();
  for (const test of ctx.mappedTests) {
    const pid = test.profileId || 'all_other_tests';
    if (!byProfile.has(pid)) byProfile.set(pid, []);
    byProfile.get(pid)!.push(test);
  }

  const profileIds = Array.from(byProfile.keys());
  const profileDocs = await Profile.find({ profileId: { $in: profileIds } }).lean();
  const profileMap = new Map(profileDocs.map((p) => [p.profileId, p]));

  const lang = ctx.language ?? 'en';
  const profiles: ProfileResult[] = [];

  const enableProfileOrder = ctx.config?.stateData?.enableProfileOrder === true;
  const enableParameterOrder = ctx.config?.stateData?.enableParameterOrder === true;
  const clientId = (ctx.input as ReportInput).clientId ?? '';
  const mapping =
    (enableProfileOrder || enableParameterOrder) && clientId
      ? await Mapping.findOne({ clientId }).lean()
      : null;

  const parameterOrder = mapping?.parameterOrder ?? [];
  const profileOrder = mapping?.profileOrder ?? [];

  for (const [profileId, tests] of byProfile) {
    let testResults = [...tests];
    if (enableParameterOrder && parameterOrder.length > 0) {
      testResults.sort((a, b) => {
        const idxA = parameterOrder.indexOf(a.biomarkerId);
        const idxB = parameterOrder.indexOf(b.biomarkerId);
        const posA = idxA >= 0 ? idxA : 999999;
        const posB = idxB >= 0 ? idxB : 999999;
        return posA - posB;
      });
    }

    const doc = profileMap.get(profileId);
    const fallbackName = profileId === 'other_tests' ? 'Other Tests' : profileId.replace(/_/g, ' ');
    const displayName = doc?.displayName?.[lang] ?? doc?.displayName?.en ?? fallbackName;
    const contentEn = doc?.content?.en ?? doc?.content ?? {};
    const about = (contentEn as { about?: string }).about ?? '';
    const tipsObj = (contentEn as { tips?: { normal?: string; abnormal?: string } }).tips;
    const tips = tipsObj?.abnormal ?? tipsObj?.normal ?? '';

    profiles.push({
      profileId,
      displayName: String(displayName),
      overallStatus: determineProfileStatus(testResults),
      testResults,
      content: { about, tips },
    });
  }

  if (enableProfileOrder && profileOrder.length > 0) {
    profiles.sort((a, b) => {
      if (a.profileId === 'other_tests' || a.profileId === 'all_other_tests') return 1;
      if (b.profileId === 'other_tests' || b.profileId === 'all_other_tests') return -1;
      const idxA = profileOrder.indexOf(a.profileId);
      const idxB = profileOrder.indexOf(b.profileId);
      const posA = idxA >= 0 ? idxA : 999999;
      const posB = idxB >= 0 ? idxB : 999999;
      return posA - posB;
    });
  } else {
    profiles.sort((a, b) => {
      if (a.profileId === 'other_tests' || a.profileId === 'all_other_tests') return 1;
      if (b.profileId === 'other_tests' || b.profileId === 'all_other_tests') return -1;
      const orderA = profileMap.get(a.profileId)?.sortOrder ?? 999;
      const orderB = profileMap.get(b.profileId)?.sortOrder ?? 999;
      return orderA - orderB;
    });
  }

  ctx.profiles = profiles;
  return ctx;
}
