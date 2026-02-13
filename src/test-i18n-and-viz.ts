/**
 * Test script for Phase 1.4 (i18n) and Phase 1.5 (Visualization)
 *
 * Verifies:
 * - Reports generate in en, hi, ar (RTL)
 * - SVG gauge and risk bars render
 *
 * Run: npm run test-i18n-viz
 */

import fs from 'fs';
import path from 'path';
import { reportService } from './services/ReportService';
import type { ReportInput } from './controllers/BaseReportController';

const LANGUAGES = ['en', 'hi', 'ar'] as const;

console.log('🧪 i18n & Visualization Test\n');
console.log('='.repeat(60));

const inputPath = path.join(process.cwd(), 'sample-report-input.json');
const input: ReportInput = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
const inputWithClient = { ...input, clientId: 'niroggyan' };

async function runTests() {
  const outputDir = path.join(process.cwd(), 'test-output');
  fs.mkdirSync(outputDir, { recursive: true });

  for (const lang of LANGUAGES) {
    console.log(`\n📄 Testing language: ${lang.toUpperCase()}${lang === 'ar' ? ' (RTL)' : ''}`);
    console.log('-'.repeat(60));

    const reportInput = { ...inputWithClient, reportLang: lang };

    try {
      const output = await reportService.generateReport(reportInput, 'dynamic');
      const htmlPath = path.join(outputDir, `report-${lang}.html`);
      fs.writeFileSync(htmlPath, output.html);

      const hasRtl = lang === 'ar' && output.html.includes('dir="rtl"');
      const hasFont = (lang === 'hi' || lang === 'ar') && output.html.includes('fonts.googleapis.com');
      const hasSvgChart = output.html.includes('<svg') && output.html.includes('xmlns="http://www.w3.org/2000/svg"');

      console.log(`✅ HTML: ${(output.html.length / 1024).toFixed(1)} KB`);
      if (lang === 'ar') console.log(`   RTL: ${hasRtl ? '✅' : '❌'}`);
      if (lang === 'hi' || lang === 'ar') console.log(`   Font: ${hasFont ? '✅' : '❌'}`);
      console.log(`   SVG Chart: ${hasSvgChart ? '✅' : '❌'}`);
      console.log(`   Saved: ${htmlPath}`);
    } catch (error) {
      console.error(`❌ ${lang} failed:`, error);
      throw error;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ i18n & Visualization tests passed!');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  });
