export interface ReportInput {
  patientName: string;
  age: number;
  gender: string;
  labNo?: string;
  workOrderId?: string;
  org?: string;
  Centre?: string;
  results?: unknown[];
  data?: unknown[];
  tests?: unknown[];
}

export type ColorIndicator = 'normal' | 'borderline' | 'low' | 'high' | 'critical';

export interface ParsedTest {
  name: string;
  value: string | number;
  unit: string;
  min?: string | number;
  max?: string | number;
  id?: string;
}

export interface TestResult {
  inputName: string;
  standardName: string;
  biomarkerId: string;
  value: number | string;
  numericValue: number | null;
  unit: string;
  referenceRange: { min: number; max: number } | null;
  colorIndicator: ColorIndicator;
  sliderPosition: number;
  profileId: string;
  content: { about: string; tip: string };
}

export interface ProfileResult {
  profileId: string;
  displayName: string;
  overallStatus: ColorIndicator;
  testResults: TestResult[];
  content: { about: string; tips: string };
}

export interface InsightItem {
  testName: string;
  value: string | number;
  unit: string;
  severity: ColorIndicator;
  tip: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}
