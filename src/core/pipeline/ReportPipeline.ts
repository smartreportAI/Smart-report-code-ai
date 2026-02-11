import type { ReportInput } from '../../types/index.js';
import type { ReportContext } from '../context/ReportContext.js';
import type { ResolvedConfig } from '../config/loadConfig.js';
import { createContext } from '../context/ReportContext.js';
import { parseInput } from './steps/parseInput.step.js';
import { mapParameters } from './steps/mapParameters.step.js';
import { groupProfiles } from './steps/groupProfiles.step.js';
import { generateInsights } from './steps/generateInsights.step.js';
import { renderHtml } from './steps/renderHtml.step.js';
import { generatePdf } from './steps/generatePdf.step.js';

export type PipelineStep = (ctx: ReportContext) => Promise<ReportContext>;

export interface PipelineOptions {
  config?: ResolvedConfig;
  language?: string;
}

export class ReportPipeline {
  private steps: PipelineStep[] = [
    parseInput,
    mapParameters,
    groupProfiles,
    generateInsights,
    renderHtml,
    generatePdf,
  ];

  async generate(input: ReportInput, options?: PipelineOptions): Promise<ReportContext> {
    let ctx = createContext(input, options?.config, options?.language);
    for (const step of this.steps) {
      ctx = await step(ctx);
    }
    return ctx;
  }
}
