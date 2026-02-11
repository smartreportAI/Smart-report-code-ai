import { ReportConfig, DEFAULT_COLORS } from '../../models/reportConfig.model.js';
import type { IColorObj, IReportConfig } from '../../models/reportConfig.model.js';

export interface ResolvedConfig {
  colors: IColorObj;
  stateData: Record<string, unknown>;
  fonts?: {
    primaryUrl?: string;
    primaryFamily?: string;
    fontSize?: string;
  };
  headerFooter?: {
    headerUrl?: string;
    footerUrl?: string;
    headerHeight?: string;
    footerHeight?: string;
  };
  coverPage?: {
    type?: string;
    imageUrl?: string;
  };
  patientDetailsData?: {
    fieldOrder?: string[];
    customLabels?: Record<string, string>;
    dateFormat?: string;
  };
}

/**
 * Load report configuration for a client.
 * Merges client overrides with system defaults.
 * If no clientId or no config found, returns system defaults.
 */
export async function loadConfig(clientId?: string): Promise<ResolvedConfig> {
  const defaults: ResolvedConfig = {
    colors: { ...DEFAULT_COLORS },
    stateData: {
      reportType: 'compact',
      generateCoverPage: true,
      showBodySummary: true,
      showSummary: true,
      showRecommendations: true,
      curLang: 'en',
      fallbackLang: 'en',
    },
  };

  if (!clientId) return defaults;

  const doc = await ReportConfig.findOne({ clientId }).lean<IReportConfig>();
  if (!doc) return defaults;

  return {
    colors: {
      colored: {
        ...defaults.colors.colored,
        ...(doc.colorObj?.colored ?? {}),
      },
      greyscaled: {
        ...defaults.colors.greyscaled,
        ...(doc.colorObj?.greyscaled ?? {}),
      },
      reportColors: doc.colorObj?.reportColors,
    },
    stateData: {
      ...defaults.stateData,
      ...(doc.stateData ?? {}),
    },
    fonts: doc.fonts,
    headerFooter: doc.headerFooter,
    coverPage: doc.coverPage,
    patientDetailsData: doc.patientDetailsData,
  };
}
