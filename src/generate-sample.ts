/**
 * Standalone script to generate a sample PDF report.
 * Run with: npm run generate
 *
 * Requires: MongoDB running and seeded (npm run seed).
 * Uses standard biomarker names so mapping and profiles work.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { ReportPipeline } from './core/pipeline/ReportPipeline.js';
import type { ReportInput } from './types/index.js';

const sampleInput: ReportInput = {
  patientName: 'Ravi Sharma',
  age: 35,
  gender: 'male',
  labNo: 'LAB-2026-001',
  tests: [
    // Lipid Profile (4 tests -- 1 abnormal: Total Cholesterol high)
    { name: 'Total Cholesterol', value: '245', unit: 'mg/dL', min: '0', max: '200' },
    { name: 'HDL Cholesterol', value: '52', unit: 'mg/dL', min: '40', max: '60' },
    { name: 'LDL Cholesterol', value: '155', unit: 'mg/dL', min: '0', max: '130' },
    { name: 'Triglycerides', value: '180', unit: 'mg/dL', min: '0', max: '150' },

    // Liver Profile (3 tests -- all normal)
    { name: 'SGPT (ALT)', value: '28', unit: 'IU/L', min: '0', max: '55' },
    { name: 'SGOT (AST)', value: '22', unit: 'IU/L', min: '0', max: '40' },
    { name: 'Total Bilirubin', value: '0.8', unit: 'mg/dL', min: '0.1', max: '1.2' },

    // Kidney Profile (2 tests -- normal)
    { name: 'Serum Creatinine', value: '1.0', unit: 'mg/dL', min: '0.7', max: '1.3' },
    { name: 'Blood Urea', value: '28', unit: 'mg/dL', min: '15', max: '45' },

    // Thyroid Profile (1 test -- normal)
    { name: 'TSH', value: '2.5', unit: 'mIU/L', min: '0.4', max: '4.0' },

    // Blood Counts (4 tests -- 1 borderline: Haemoglobin slightly low)
    { name: 'Haemoglobin', value: '12.8', unit: 'g/dL', min: '13.5', max: '17.5' },
    { name: 'RBC count', value: '4.8', unit: 'million/cumm', min: '4.5', max: '5.5' },
    { name: 'Total Leukocyte Count', value: '7500', unit: '/cumm', min: '4000', max: '10000' },
    { name: 'Platelet Count', value: '250000', unit: '/cumm', min: '150000', max: '400000' },

    // Diabetes Monitoring (1 test -- borderline)
    { name: 'Blood Sugar (Fasting)', value: '110', unit: 'mg/dL', min: '70', max: '100' },

    // Unmapped test (for "Other Tests" fallback)
    { name: 'ESR (Westergren)', value: '12', unit: 'mm/hr', min: '0', max: '20' },
    { name: 'CRP (C-Reactive Protein)', value: '3.2', unit: 'mg/L', min: '0', max: '5' },
  ],
};

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is required. Set it in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Starting report generation...');
  console.log('Input:', JSON.stringify({
    patient: sampleInput.patientName,
    age: sampleInput.age,
    gender: sampleInput.gender,
    testCount: sampleInput.tests?.length,
  }, null, 2));

  const pipeline = new ReportPipeline();
  const ctx = await pipeline.generate(sampleInput);

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
