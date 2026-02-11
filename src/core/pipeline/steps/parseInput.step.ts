import type { ReportContext } from '../../context/ReportContext.js';
import type { ReportInput, ParsedTest } from '../../../types/index.js';

const MAX_NAME_LENGTH = 50;
const MAX_VALUE_LENGTH = 40;
const INVALID_NAMES = new Set(['Gender', '-', '']);
const INVALID_VALUES = new Set(['', '-']);

function isInvalidTest(name: string, value: unknown): boolean {
  if (INVALID_NAMES.has(name?.trim?.() ?? '')) return true;
  if (typeof name === 'string' && name.length > MAX_NAME_LENGTH) return true;
  const valueStr = value != null ? String(value).trim() : '';
  if (INVALID_VALUES.has(valueStr)) return true;
  if (valueStr.length > MAX_VALUE_LENGTH) return true;
  return false;
}

function extractValue(obj: Record<string, unknown>, ...keys: string[]): string | number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return v as string | number;
  }
  return undefined;
}

function normalizeTestFromStandard(test: unknown): ParsedTest | null {
  if (!test || typeof test !== 'object') return null;
  const t = test as Record<string, unknown>;
  const name = extractValue(t, 'name', 'Name', 'ELEMENT_NAME', 'ELEMENT_NAME_ORIGINAL');
  const value = extractValue(t, 'value', 'Value', 'result', 'RESULT');
  if (name == null || value == null) return null;
  const unit = (extractValue(t, 'unit', 'Unit', 'measurement_unit', 'UOM') as string) ?? '';
  const min = extractValue(t, 'min', 'minParameterValue', 'references.0.min');
  const max = extractValue(t, 'max', 'maxParameterValue', 'references.0.max');
  let minVal: string | number | undefined = min;
  let maxVal: string | number | undefined = max;
  if (t.references && Array.isArray(t.references) && (t.references as Record<string, unknown>[])[0]) {
    const ref = (t.references as Record<string, unknown>[])[0];
    minVal = minVal ?? extractValue(ref as Record<string, unknown>, 'min', 'minParameterValue');
    maxVal = maxVal ?? extractValue(ref as Record<string, unknown>, 'max', 'maxParameterValue');
  }
  const id = (extractValue(t, 'id', 'id', 'ELEMENT_CODE', 'PRODUCT_CODE') as string) ?? undefined;
  const nameStr = String(name);
  if (isInvalidTest(nameStr, value)) return null;
  return {
    name: nameStr,
    value,
    unit: String(unit ?? ''),
    min: minVal,
    max: maxVal,
    id,
  };
}

function normalizeInput(raw: unknown): ReportInput {
  let obj = raw as Record<string, unknown>;
  if (Array.isArray(obj?.data) && obj.data.length > 0) {
    obj = (obj.data as Record<string, unknown>[])[0] as Record<string, unknown>;
  }
  const patientName =
    (obj.patientName as string) ?? (obj.PatientName as string) ?? (obj.Patient_Name as string) ?? '';
  const ageRaw = obj.age ?? obj.Age ?? obj.AGE;
  const age = typeof ageRaw === 'number' ? ageRaw : typeof ageRaw === 'string' ? parseInt(ageRaw, 10) || 0 : 0;
  const gender =
    (obj.gender as string) ?? (obj.Gender as string) ?? (obj.GENDER as string) ?? (obj.Sex as string) ?? '';
  let tests: unknown[] = (obj.tests as unknown[]) ?? (obj.Tests as unknown[]) ?? [];
  if (tests.length === 0 && Array.isArray(obj.results)) {
    const collected: unknown[] = [];
    for (const r of obj.results as Record<string, unknown>[]) {
      const inner = (r.tests as unknown[]) ?? (r.Tests as unknown[]) ?? [];
      collected.push(...inner);
    }
    tests = collected;
  }
  return {
    patientName: String(patientName ?? ''),
    age: Number.isFinite(age) ? age : 0,
    gender: String(gender ?? ''),
    labNo: (obj.labNo ?? obj.LabNo ?? obj.LabID) as string | undefined,
    workOrderId: (obj.workOrderId ?? obj.WorkOrderID) as string | undefined,
    org: (obj.org ?? obj.Organisation) as string | undefined,
    Centre: (obj.Centre ?? obj.centre) as string | undefined,
    tests,
  };
}

export async function parseInput(ctx: ReportContext): Promise<ReportContext> {
  const input = normalizeInput(ctx.input);
  ctx.input = input;
  const parsed: ParsedTest[] = [];
  for (const test of input.tests ?? []) {
    const normalized = normalizeTestFromStandard(test);
    if (normalized) parsed.push(normalized);
  }
  ctx.parsedTests = parsed;
  return ctx;
}
