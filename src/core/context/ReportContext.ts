import { randomUUID } from 'node:crypto';
import type {
  ReportInput,
  ParsedTest,
  TestResult,
  ProfileResult,
  InsightItem,
} from '../../types/index.js';
import type { ResolvedConfig } from '../config/loadConfig.js';

export interface ReportContext {
  reportId: string;
  pdfFileName: string;
  language: string;
  config: ResolvedConfig;
  input: ReportInput;
  parsedTests: ParsedTest[];
  mappedTests: TestResult[];
  profiles: ProfileResult[];
  insights: InsightItem[];
  html: string;
  pdfBuffer: Buffer | null;
}

export function createContext(
  input: ReportInput,
  config?: ResolvedConfig,
  language?: string,
): ReportContext {
  const reportId = randomUUID();
  return {
    reportId,
    pdfFileName: `${reportId}.pdf`,
    language: language ?? (config?.stateData?.curLang as string | undefined) ?? 'en',
    config: config ?? getDefaultConfig(),
    input,
    parsedTests: [],
    mappedTests: [],
    profiles: [],
    insights: [],
    html: '',
    pdfBuffer: null,
  };
}

function getDefaultConfig(): ResolvedConfig {
  return {
    colors: {
      colored: {
        normal: '#0F9D58',
        borderline: '#F4B400',
        high: '#DB4437',
        low: '#DB4437',
        critical: '#C26564',
      },
      greyscaled: {
        normal: '#D2D2D2',
        borderline: '#969696',
        high: '#111111',
        low: '#111111',
        critical: '#444444',
      },
    },
    stateData: {},
  };
}
