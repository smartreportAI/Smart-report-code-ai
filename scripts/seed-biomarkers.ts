/**
 * Seed biomarkers and profiles from legacy JS files into MongoDB.
 * Run: npm run seed
 * Requires: legacy-data/testsDatabase.js, legacy-data/profileBaseDynamic.js
 * Optional: legacy-data/testsContentBase.js (rich content: about text, tips, additionalSections)
 */

import 'dotenv/config';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { Biomarker } from '../src/models/biomarker.model.js';
import { Profile } from '../src/models/profile.model.js';
import type { IBiomarker, IReferenceRange } from '../src/models/biomarker.model.js';
import type { IProfile } from '../src/models/profile.model.js';

const require = createRequire(import.meta.url);
const projectRoot = process.cwd();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'unknown';
}

function loadLegacyTestsDatabase(): {
  TEST_DATABASE: Record<string, Record<string, unknown>>;
  TEST_DATABASE_MAPPING: Record<string, string>;
  biomarkerProdfileMap: Record<string, string>;
  TEST_DATABASE_MAPPING_BLAL?: Record<string, string>;
} {
  const path = join(projectRoot, 'legacy-data', 'testsDatabase.js');
  const mod = require(path);
  return {
    TEST_DATABASE: mod.TEST_DATABASE ?? {},
    TEST_DATABASE_MAPPING: mod.TEST_DATABASE_MAPPING ?? {},
    biomarkerProdfileMap: mod.biomarkerProdfileMap ?? {},
    TEST_DATABASE_MAPPING_BLAL: mod.TEST_DATABASE_MAPPING_BLAL,
  };
}

function loadLegacyProfiles(): Record<string, Record<string, unknown>> {
  const path = join(projectRoot, 'legacy-data', 'profileBaseDynamic.js');
  const mod = require(path);
  return mod.profilesInfo ?? {};
}

function loadLegacyContent(): Record<string, Record<string, unknown>> | null {
  try {
    const path = join(projectRoot, 'legacy-data', 'testsContentBase.js');
    const mod = require(path);
    return mod.TEST_CONTENTBASE ?? null;
  } catch {
    console.log('  testsContentBase.js not found -- skipping content enrichment.');
    return null;
  }
}

function buildReferenceRanges(entry: Record<string, unknown>): IReferenceRange[] {
  const low = entry.lowThreshold as number | undefined;
  const high = entry.highThreshold as number | undefined;
  const border = entry.boderline as number | undefined;
  if (low == null && high == null && border == null) return [];
  const normalMin = typeof low === 'number' ? low : (border != null ? 0 : 0);
  const normalMax = typeof high === 'number' ? high : (border != null ? border : 100);
  const range: IReferenceRange = {
    gender: 'any',
    ageRange: { min: 0, max: 120 },
    normal: { min: normalMin, max: normalMax },
    methodology: 'default',
  };
  if (typeof border === 'number') {
    range.borderline = {
      low: { min: Math.min(normalMin, border - 0.01), max: border },
      high: { min: border, max: Math.max(normalMax, border + 0.01) },
    };
  }
  return [range];
}

function extractContent(entry: Record<string, unknown>): Record<string, { displayName?: string; about?: string; tips?: { normal?: string; low?: string; high?: string } }> {
  const displayName = entry.displayName as Record<string, string> | undefined;
  if (!displayName) return { en: {} };
  const result: Record<string, { displayName?: string; about?: string; tips?: { normal?: string; low?: string; high?: string } }> = {};
  for (const [lang, name] of Object.entries(displayName)) {
    result[lang] = { displayName: name };
  }
  return result;
}

async function seedBiomarkers(): Promise<number> {
  const { TEST_DATABASE, TEST_DATABASE_MAPPING, biomarkerProdfileMap, TEST_DATABASE_MAPPING_BLAL } = loadLegacyTestsDatabase();
  const idToName: Record<string, string> = TEST_DATABASE_MAPPING;
  const nameToId: Record<string, string> = {};
  for (const [id, name] of Object.entries(idToName)) {
    nameToId[name] = id;
  }
  const nameToAliases: Record<string, string[]> = {};
  if (TEST_DATABASE_MAPPING_BLAL) {
    for (const [alias, standardName] of Object.entries(TEST_DATABASE_MAPPING_BLAL)) {
      if (!nameToAliases[standardName]) nameToAliases[standardName] = [];
      if (alias !== standardName && !nameToAliases[standardName].includes(alias)) {
        nameToAliases[standardName].push(alias);
      }
    }
  }

  let count = 0;
  for (const [standardName, entry] of Object.entries(TEST_DATABASE)) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const biomarkerId = nameToId[standardName] ?? `LEGACY_${slugify(standardName).slice(0, 20)}`;
    const profileName = biomarkerProdfileMap[standardName];
    const profiles = profileName ? [slugify(profileName)] : [];
    const unitPrimary = (e.unit as string) ?? '';
    const referenceRanges = buildReferenceRanges(e);
    const content = extractContent(e);

    const doc: Partial<IBiomarker> = {
      biomarkerId,
      standardName,
      aliases: nameToAliases[standardName] ?? [standardName],
      profiles,
      unit: { primary: unitPrimary },
      referenceRanges,
      content,
      visualization: e.sliderType ? { sliderType: e.sliderType as string } : undefined,
      metadata: { isActive: true },
    };

    await Biomarker.findOneAndUpdate(
      { biomarkerId },
      { $set: { ...doc, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true }
    );
    count++;
    if (count % 100 === 0) console.log(`  Biomarkers: ${count}...`);
  }
  return count;
}

async function seedProfiles(): Promise<number> {
  const profilesInfo = loadLegacyProfiles();
  const profileNameToId = new Map<string, string>();
  let sortOrder = 0;
  let count = 0;

  for (const [profileDisplayName, info] of Object.entries(profilesInfo)) {
    if (!info || typeof info !== 'object') continue;
    const others = (info as Record<string, unknown>).others as { href?: string } | undefined;
    const compact = (info as Record<string, unknown>).compact as Record<string, unknown> | undefined;
    const profileId = others?.href ? slugify(others.href) : slugify(profileDisplayName);
    if (profileNameToId.has(profileDisplayName)) continue;
    profileNameToId.set(profileDisplayName, profileId);

    const about = compact?.about as Record<string, unknown> | undefined;
    const header = about?.header as Record<string, string> | undefined;
    const text = about?.text as Record<string, string> | undefined;
    const displayName: Record<string, string> = header ? { ...header } : { en: profileDisplayName };
    const content: IProfile['content'] = {};
    if (text) {
      for (const [lang, t] of Object.entries(text)) {
        content[lang] = { about: t, description: t };
      }
    }
    if (!content.en) content.en = { about: (text?.en as string) ?? '', description: '' };

    const doc: Partial<IProfile> = {
      profileId,
      displayName,
      sortOrder: sortOrder++,
      biomarkers: [],
      content,
      bodySummary: { displayInBodyMap: true },
      riskScore: { enabled: false },
      isActive: true,
    };

    await Profile.findOneAndUpdate(
      { profileId },
      { $set: { ...doc, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true }
    );
    count++;
  }
  return count;
}

async function seedContent(): Promise<number> {
  const contentBase = loadLegacyContent();
  if (!contentBase) return 0;

  let count = 0;
  for (const [standardName, entry] of Object.entries(contentBase)) {
    if (!entry || typeof entry !== 'object') continue;

    const textObj = (entry as Record<string, unknown>).text as Record<string, string> | undefined;
    const additionalSections = (entry as Record<string, unknown>).additionalSections as unknown[] | undefined;

    if (!textObj && !additionalSections) continue;

    // Build per-language content update
    const contentUpdate: Record<string, Record<string, unknown>> = {};

    // Extract about text per language from the `text` field
    if (textObj && typeof textObj === 'object') {
      for (const [lang, aboutText] of Object.entries(textObj)) {
        if (typeof aboutText !== 'string') continue;
        // Strip HTML tags for plain-text about
        const cleanAbout = aboutText.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (!contentUpdate[lang]) contentUpdate[lang] = {};
        contentUpdate[lang].about = cleanAbout;
      }
    }

    // Extract tips from additionalSections (didYouKnow, recommendations, etc.)
    if (Array.isArray(additionalSections)) {
      for (const section of additionalSections) {
        const sec = section as Record<string, unknown>;
        const list = sec.list as Array<{ text?: Record<string, string> }> | undefined;
        if (!Array.isArray(list) || list.length === 0) continue;

        // Collect list item texts per language as tip text
        for (const item of list) {
          if (!item.text || typeof item.text !== 'object') continue;
          for (const [lang, tipText] of Object.entries(item.text)) {
            if (typeof tipText !== 'string') continue;
            const cleanTip = tipText.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            if (!contentUpdate[lang]) contentUpdate[lang] = {};
            // Append multiple tips into one string separated by '. '
            const existing = (contentUpdate[lang].tipsNormal as string) ?? '';
            contentUpdate[lang].tipsNormal = existing ? `${existing} ${cleanTip}` : cleanTip;
          }
        }
      }
    }

    // Build $set paths for the content update
    const setOps: Record<string, unknown> = {};
    for (const [lang, data] of Object.entries(contentUpdate)) {
      if (data.about) setOps[`content.${lang}.about`] = data.about;
      if (data.tipsNormal) setOps[`content.${lang}.tips.normal`] = data.tipsNormal;
    }

    if (Object.keys(setOps).length === 0) continue;

    const result = await Biomarker.updateOne(
      { standardName },
      { $set: { ...setOps, updatedAt: new Date() } },
    );
    if (result.modifiedCount > 0 || result.matchedCount > 0) count++;
    if (count % 100 === 0 && count > 0) console.log(`  Content: ${count}...`);
  }
  return count;
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is required');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Seeding biomarkers...');
  const biomarkerCount = await seedBiomarkers();
  console.log('Seeding profiles...');
  const profileCount = await seedProfiles();
  console.log('Enriching biomarker content from testsContentBase...');
  const contentCount = await seedContent();
  console.log(`\nDone. Seeded ${biomarkerCount} biomarkers, ${profileCount} profiles, enriched ${contentCount} with content.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
