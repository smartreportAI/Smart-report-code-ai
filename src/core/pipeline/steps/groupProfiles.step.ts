import { Profile } from '../../../models/profile.model.js';
import type { ReportContext } from '../../context/ReportContext.js';
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

  for (const [profileId, testResults] of byProfile) {
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

  // Sort: known profiles by sortOrder, "other_tests" always last
  profiles.sort((a, b) => {
    if (a.profileId === 'other_tests') return 1;
    if (b.profileId === 'other_tests') return -1;
    const orderA = profileMap.get(a.profileId)?.sortOrder ?? 999;
    const orderB = profileMap.get(b.profileId)?.sortOrder ?? 999;
    return orderA - orderB;
  });

  ctx.profiles = profiles;
  return ctx;
}
