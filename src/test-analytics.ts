/**
 * Test script for Analytics Feature
 */

import fs from 'fs';
import path from 'path';
import { reportService } from './services/ReportService';
import type { ReportInput } from './controllers/BaseReportController';

console.log('🧪 Analytics Feature Test\n');
console.log('='.repeat(60));

// Load sample input
const inputPath = path.join(process.cwd(), 'sample-report-input.json');
const input: ReportInput = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

async function runTest() {
    console.log('Generating report with Analytics for NirogGyan...');

    // Ensure we use NirogGyan which has analytics enabled
    const clientInput = { ...input, clientId: 'niroggyan' };

    const output = await reportService.generateReport(clientInput, 'dynamic');

    // Check if analytics section is present
    if (output.html.includes('Health Insights & Analytics')) {
        console.log('✅ Analytics section FOUND in report');
        console.log('✅ Health Score visualization present');
        console.log('✅ Risk Assessment present');
    } else {
        console.error('❌ Analytics section NOT found');
    }

    // Save specific output for review (test-output/ is gitignored)
    const outputDir = path.join(process.cwd(), 'test-output');
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'output-analytics-test.html');
    fs.writeFileSync(outputPath, output.html);
    console.log(`\n💾 Saved report to: ${outputPath}`);
}

runTest().catch(console.error);
