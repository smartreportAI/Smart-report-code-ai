import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { getBrowser } from '../../../services/pdf/browser-pool.service.js';
import type { ReportContext } from '../../context/ReportContext.js';

export async function generatePdf(ctx: ReportContext): Promise<ReportContext> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(ctx.html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });
    ctx.pdfBuffer = Buffer.from(pdfBuffer);

    const reportsDir = join(process.cwd(), 'reports');
    await mkdir(reportsDir, { recursive: true });
    const outputPath = join(reportsDir, 'sample.pdf');
    await writeFile(outputPath, ctx.pdfBuffer);
  } finally {
    await page.close();
  }
  return ctx;
}
