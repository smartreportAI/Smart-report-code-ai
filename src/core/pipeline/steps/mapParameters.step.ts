import { Biomarker } from '../../../models/biomarker.model.js';
import type { IBiomarker, IReferenceRange } from '../../../models/biomarker.model.js';
import type { ReportContext } from '../../context/ReportContext.js';
import type {
  ParsedTest,
  TestResult,
  ColorIndicator,
} from '../../../types/index.js';

function parseNumericValue(value: string | number): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    const num = parseFloat(cleaned);
    return Number.isNaN(num) ? null : num;
  }
  return null;
}

function resolveRange(
  ranges: IReferenceRange[],
  gender: string,
  age: number
): IReferenceRange | null {
  const g = gender?.toLowerCase() ?? '';
  const isMale = g === 'male' || g === 'm';
  const isFemale = g === 'female' || g === 'f';
  let best: IReferenceRange | null = null;
  for (const r of ranges) {
    const ageMin = r.ageRange?.min ?? 0;
    const ageMax = r.ageRange?.max ?? 120;
    if (age < ageMin || age > ageMax) continue;
    if (r.gender === 'any') best = r;
    if (r.gender === 'male' && isMale) best = r;
    if (r.gender === 'female' && isFemale) best = r;
  }
  return best ?? ranges[0] ?? null;
}

function classifyResult(value: number, range: IReferenceRange): ColorIndicator {
  const { normal, borderline, critical } = range;
  const critLow = critical?.low ?? normal.min - 1000;
  const critHigh = critical?.high ?? normal.max + 1000;

  if (value < critLow || value > critHigh) return 'critical';
  if (value >= normal.min && value <= normal.max) return 'normal';

  if (borderline?.low && value >= borderline.low.min && value <= borderline.low.max) return 'borderline';
  if (borderline?.high && value >= borderline.high.min && value <= borderline.high.max) return 'borderline';

  if (value < normal.min) return 'low';
  return 'high';
}

function calculateSliderPosition(value: number, range: IReferenceRange): number {
  const critLow = range.critical?.low ?? range.normal.min - 1000;
  const critHigh = range.critical?.high ?? range.normal.max + 1000;
  const totalRange = critHigh - critLow;
  if (totalRange <= 0) return 50;
  const position = ((value - critLow) / totalRange) * 100;
  return Math.max(5, Math.min(95, position));
}

function resolveContent(biomarker: IBiomarker, color: ColorIndicator, lang: string): { about: string; tip: string } {
  const content = biomarker.content?.[lang] ?? biomarker.content?.en ?? {};
  const about = content.about ?? '';
  const tips = content.tips;
  let tipText = tips?.normal ?? '';
  if (color === 'low' && tips?.low) tipText = tips.low;
  else if ((color === 'high' || color === 'critical') && tips?.high) tipText = tips.high;
  else if (color === 'borderline') tipText = tips?.normal ?? tipText;
  return { about, tip: tipText };
}

async function findBiomarker(parsed: ParsedTest): Promise<IBiomarker | null> {
  const name = parsed.name?.trim() ?? '';
  if (!name) return null;
  const byStandard = await Biomarker.findOne({ standardName: name }).lean();
  if (byStandard) return byStandard as IBiomarker;
  const byStandardCaseInsensitive = await Biomarker.findOne({
    standardName: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  }).lean();
  if (byStandardCaseInsensitive) return byStandardCaseInsensitive as IBiomarker;
  const byAliasExact = await Biomarker.findOne({ aliases: name }).lean();
  if (byAliasExact) return byAliasExact as IBiomarker;
  const byAliasCaseInsensitive = await Biomarker.findOne({
    aliases: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  }).lean();
  if (byAliasCaseInsensitive) return byAliasCaseInsensitive as IBiomarker;
  return null;
}

export async function mapParameters(ctx: ReportContext): Promise<ReportContext> {
  const gender = ctx.input.gender ?? '';
  const age = typeof ctx.input.age === 'number' ? ctx.input.age : parseInt(String(ctx.input.age ?? '0'), 10) || 0;
  const lang = ctx.language ?? 'en';
  const mapped: TestResult[] = [];

  for (const parsed of ctx.parsedTests) {
    const biomarker = await findBiomarker(parsed);

    if (!biomarker) {
      // Unmapped test fallback: include with minimal data and "other_tests" profile
      const numericValue = parseNumericValue(parsed.value);
      let referenceRange: { min: number; max: number } | null = null;
      const minVal = parseNumericValue(parsed.min ?? '');
      const maxVal = parseNumericValue(parsed.max ?? '');
      if (minVal !== null && maxVal !== null) {
        referenceRange = { min: minVal, max: maxVal };
      }

      mapped.push({
        inputName: parsed.name,
        standardName: parsed.name,
        biomarkerId: '',
        value: parsed.value,
        numericValue,
        unit: parsed.unit || '',
        referenceRange,
        colorIndicator: 'normal',
        sliderPosition: 50,
        profileId: 'other_tests',
        content: { about: '', tip: '' },
      });
      continue;
    }

    const numericValue = parseNumericValue(parsed.value);
    const range = resolveRange(biomarker.referenceRanges, gender, age);
    let colorIndicator: ColorIndicator = 'normal';
    let sliderPosition = 50;
    let referenceRange: { min: number; max: number } | null = null;

    if (range) {
      referenceRange = { min: range.normal.min, max: range.normal.max };
      if (numericValue !== null) {
        colorIndicator = classifyResult(numericValue, range);
        sliderPosition = calculateSliderPosition(numericValue, range);
      }
    }

    const profileId = biomarker.profiles?.[0] ?? 'other_tests';
    const content = resolveContent(biomarker, colorIndicator, lang);

    mapped.push({
      inputName: parsed.name,
      standardName: biomarker.standardName,
      biomarkerId: biomarker.biomarkerId,
      value: parsed.value,
      numericValue,
      unit: parsed.unit || biomarker.unit?.primary || '',
      referenceRange,
      colorIndicator,
      sliderPosition,
      profileId,
      content,
    });
  }

  ctx.mappedTests = mapped;
  return ctx;
}
