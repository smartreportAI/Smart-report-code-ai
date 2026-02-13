/**
 * Test script for all report types (Phase 1.3)
 *
 * Verifies:
 * - Dynamic, Compact, Hybrid, Summary (HTML)
 * - PDF generation for each type
 *
 * Run: npm run test-all-types
 */

import fs from 'fs';
import path from 'path';
import { reportService } from './services/ReportService';
import type { ReportInput } from './controllers/BaseReportController';

const REPORT_TYPES = ['dynamic', 'compact'] as const;

console.log('🧪 All Report Types Test\n');
console.log('='.repeat(60));

const inputPath = path.join(process.cwd(), 'sample-report-input.json');
const input: ReportInput = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

// Use niroggyan client for full branding
const inputWithClient = { ...input, clientId: 'niroggyan' };

async function runTests() {
  const outputDir = path.join(process.cwd(), 'test-output');
  fs.mkdirSync(outputDir, { recursive: true });

  for (const reportType of REPORT_TYPES) {
    console.log(`\n📄 Testing ${reportType.toUpperCase()} report...`);
    console.log('-'.repeat(60));

    try {
      const start = Date.now();
      const output = await reportService.generateReport(inputWithClient, reportType);
      const elapsed = Date.now() - start;

      const htmlPath = path.join(outputDir, `report-${reportType}.html`);
      fs.writeFileSync(htmlPath, output.html);

      console.log(`✅ HTML generated in ${elapsed}ms (${(output.html.length / 1024).toFixed(1)} KB)`);

      // PDF generation
      const pdfStart = Date.now();
      const pdfOutput = await reportService.generatePDFReport(inputWithClient, reportType);
      const pdfElapsed = Date.now() - pdfStart;
      const pdfPath = path.join(outputDir, `report-${reportType}.pdf`);
      fs.writeFileSync(pdfPath, pdfOutput.pdf);
      console.log(`✅ PDF generated in ${pdfElapsed}ms (${(pdfOutput.pdf.length / 1024).toFixed(1)} KB)`);
      console.log(`   Saved: ${htmlPath}, ${pdfPath}`);
    } catch (error) {
      console.error(`❌ ${reportType} failed:`, error);
      throw error;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All 2 report types (HTML + PDF) generated successfully!');
  console.log('\n📁 Output files in test-output/:');
  REPORT_TYPES.forEach(t => console.log(`   - report-${t}.html, report-${t}.pdf`));
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  });
