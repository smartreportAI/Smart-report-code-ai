import { ReportConfig, DEFAULT_COLORS } from '../../models/reportConfig.model.js';
import type { IColorObj, IReportConfig } from '../../models/reportConfig.model.js';
import { Client } from '../../models/client.model.js';
import type { IClient } from '../../models/client.model.js';

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
  /** LIS field mappings from Client (Level 1) for future parseInput use */
  lisFieldMappings?: Record<string, string>;
  /** Dispatch config from Client for future webhook flow */
  dispatch?: {
    type?: string;
    webhookUrl?: string;
    webhookHeaders?: Record<string, string>;
    retryPolicy?: { maxRetries?: number; backoffMs?: number };
  };
}

/**
 * Load report configuration for a client.
 * Merges: System defaults (L0) → Client (L1) → ReportConfig (L2).
 * If no clientId or no config found, returns system defaults.
 */
export async function loadConfig(clientId?: string): Promise<ResolvedConfig> {
  const defaults: ResolvedConfig = {
    colors: { ...DEFAULT_COLORS },
    stateData: {
      reportType: 'dynamic',
      generateCoverPage: true,
      showBodySummary: true,
      showSummary: true,
      showRecommendations: true,
      curLang: 'en',
      fallbackLang: 'en',
    },
  };

  if (!clientId) return defaults;

  const [clientDoc, configDoc] = await Promise.all([
    Client.findOne({ clientId }).lean<IClient>(),
    ReportConfig.findOne({ clientId }).lean<IReportConfig>(),
  ]);

  let config: ResolvedConfig = { ...defaults };

  if (clientDoc) {
    config = {
      ...config,
      stateData: {
        ...config.stateData,
        ...(clientDoc.lis?.inputFormat != null ? { inputFormat: clientDoc.lis.inputFormat } : {}),
      },
      lisFieldMappings: clientDoc.lis?.fieldMappings ?? undefined,
      dispatch: clientDoc.dispatch ?? undefined,
    };
  }

  if (configDoc) {
    config = {
      ...config,
      colors: {
        colored: {
          ...config.colors.colored,
          ...(configDoc.colorObj?.colored ?? {}),
        },
        greyscaled: {
          ...config.colors.greyscaled,
          ...(configDoc.colorObj?.greyscaled ?? {}),
        },
        reportColors: configDoc.colorObj?.reportColors ?? config.colors.reportColors,
      },
      stateData: {
        ...config.stateData,
        ...(configDoc.stateData ?? {}),
      },
      fonts: configDoc.fonts ?? config.fonts,
      headerFooter: configDoc.headerFooter ?? config.headerFooter,
      coverPage: configDoc.coverPage ?? config.coverPage,
      patientDetailsData: configDoc.patientDetailsData ?? config.patientDetailsData,
    };
  }

  return config;
}
