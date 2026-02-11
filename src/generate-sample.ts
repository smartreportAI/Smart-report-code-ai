/**
 * Standalone script to generate a sample PDF report.
 * Run with: npm run generate
 * Optional: npm run generate path/to/input.json
 *
 * By default reads from sample-input.json (canonical format per doc/Report-Input-JSON-Spec.md).
 * Requires: MongoDB running and seeded (npm run seed).
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { ReportPipeline } from './core/pipeline/ReportPipeline.js';
import { loadConfig } from './core/config/loadConfig.js';

const SAMPLE_INPUT_PATH = join(process.cwd(), 'sample-input.json');

async function loadSampleInput(path: string = SAMPLE_INPUT_PATH): Promise<Record<string, unknown>> {
  const raw = await readFile(path, 'utf-8');
  const data = JSON.parse(raw) as Record<string, unknown>;
  if (!data.tests || !Array.isArray(data.tests)) {
    throw new Error('sample-input.json must have a "tests" array. See doc/Report-Input-JSON-Spec.md');
  }
  return data;
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is required. Set it in .env');
    process.exit(1);
  }

  const inputPath = process.argv[2] || SAMPLE_INPUT_PATH;
  console.log('Loading input from:', inputPath);

  const sampleInput = await loadSampleInput(inputPath);

  const patient = sampleInput.patient as Record<string, unknown> | undefined;
  const patientName = patient?.name ?? sampleInput.patientName ?? 'Unknown';
  const testCount = Array.isArray(sampleInput.tests) ? sampleInput.tests.length : 0;

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Starting report generation...');
  console.log('Input:', JSON.stringify({
    patient: patientName,
    testCount,
    format: patient ? 'canonical' : 'flat',
  }, null, 2));

  const clientId = (sampleInput.clientId as string) ?? undefined;
  const config = await loadConfig(clientId);

  const pipeline = new ReportPipeline();
  const ctx = await pipeline.generate(sampleInput, { config });

  console.log('\nPipeline completed:');
  console.log('  - Report ID:', ctx.reportId);
  console.log('  - Parsed tests:', ctx.parsedTests.length, 'items');
  console.log('  - Mapped tests:', ctx.mappedTests.length, 'items');
  console.log('  - Profiles:', ctx.profiles.length);
  for (const p of ctx.profiles) {
    const abnormal = p.testResults.filter(t => t.colorIndicator !== 'normal').length;
    console.log(`    * ${p.displayName} (${p.overallStatus}) -- ${p.testResults.length} tests, ${abnormal} abnormal`);
  }
  console.log('  - Insights:', ctx.insights.length, 'items');
  console.log('  - HTML length:', ctx.html.length, 'chars');
  console.log('  - PDF buffer:', ctx.pdfBuffer?.length ?? 0, 'bytes');
  console.log('\nPDF saved to: reports/sample.pdf');

  // Close browser pool
  const { closeBrowser } = await import('./services/pdf/browser-pool.service.js');
  await closeBrowser();
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed to generate report:', err);
  process.exit(1);
});
