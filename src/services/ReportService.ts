/**
 * ReportService - Orchestrates report generation
 * 
 * Responsibilities:
 * - Validate input data
 * - Retrieve client configuration
 * - Select appropriate report controller (Dynamic/Compact)
 * - Generate HTML report
 * - (Future) Generate PDF
 * - (Future) Store report
 */

import { BaseReportController, ReportInput, ReportOutput } from '../controllers/BaseReportController';
import { DynamicReportController } from '../controllers/DynamicReportController';
import { CompactReportController } from '../controllers/CompactReportController';
import { clientConfigService } from './ClientConfigService';
import { pdfService, PDFGenerationOptions } from './PDFService';
import { storageService } from './StorageService';
import { randomUUID } from 'crypto';

export interface PDFReportOutput {
    pdf: Buffer;
    metadata: ReportOutput['metadata'];
}

export class ReportService {
    private static instance: ReportService;

    private constructor() { }

    static getInstance(): ReportService {
        if (!ReportService.instance) {
            ReportService.instance = new ReportService();
        }
        return ReportService.instance;
    }

    /**
     * Generate a report based on input and client configuration
     */
    async generateReport(
        input: ReportInput,
        reportType?: 'dynamic' | 'compact'
    ): Promise<ReportOutput> {
        // 1. Get client config to determine default report type if not specified
        const config = clientConfigService.getConfig(input.clientId);
        const type = (reportType || config.reportSettings.defaultReportType) as 'dynamic' | 'compact';

        // 2. Select controller (compact or dynamic only)
        const controller: BaseReportController =
            type === 'compact'
                ? new CompactReportController(input)
                : new DynamicReportController(input);

        // 3. Generate report
        console.log(`Generating ${type} report for client ${config.clientName} (${input.clientId})`);
        const output = await controller.generate();

        // 4. Save HTML report
        // Use WorkOrderID as ID or generate new one
        const reportId = input.WorkOrderID || randomUUID();
        await storageService.saveReport(input.clientId, reportId, output.html, 'html');

        return output;
    }

    /**
     * Generate a PDF report
     */
    async generatePDFReport(
        input: ReportInput,
        reportType?: 'dynamic' | 'compact',
        pdfOptions?: PDFGenerationOptions
    ): Promise<PDFReportOutput> {
        // 1. Generate HTML report
        const htmlReport = await this.generateReport(input, reportType);

        // 2. Get client config for PDF settings
        const config = clientConfigService.getConfig(input.clientId);
        const pageSize = config.reportSettings.pageSize || 'A4';

        // 3. Generate PDF
        const pdfBuffer = await pdfService.generatePDF(htmlReport.html, {
            format: pageSize as 'A4' | 'Letter',
            printBackground: true,
            ...pdfOptions
        });

        // 4. Save PDF report
        const reportId = input.WorkOrderID || randomUUID();
        await storageService.saveReport(input.clientId, reportId, pdfBuffer, 'pdf');

        return {
            pdf: pdfBuffer,
            metadata: htmlReport.metadata
        };
    }
}

export const reportService = ReportService.getInstance();
