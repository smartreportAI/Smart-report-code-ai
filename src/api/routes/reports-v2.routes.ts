/**
 * Report Generation API Routes (Phase 2)
 * Mounted at: /api/v1/reports/v2
 *
 * Endpoints:
 * - POST /api/v1/reports/v2/generate - Generate a new report (HTML)
 * - GET /api/v1/reports/v2/health - Health check
 * - POST /api/v1/reports/v2/pdf - Generate PDF report
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { reportService } from '../../services/ReportService';
import type { ReportInput } from '../../controllers/BaseReportController';

interface GenerateReportRequest {
    Body: ReportInput & {
        reportType?: 'dynamic' | 'compact';
    };
}

interface GetReportRequest {
    Params: {
        id: string;
    };
}

export async function reportRoutes(fastify: FastifyInstance) {
    /**
     * Generate a new report
     * POST /api/v1/reports/generate
     */
    fastify.post<GenerateReportRequest>(
        '/generate',
        {
            schema: {
                description: 'Generate a medical laboratory report',
                tags: ['Reports'],
                body: {
                    type: 'object',
                    required: ['clientId', 'reportLang', 'PName', 'LabNo', 'results'],
                    properties: {
                        org: { type: 'string' },
                        Centre: { type: 'string' },
                        clientId: { type: 'string' },
                        reportLang: { type: 'string', enum: ['en', 'hi', 'cz', 'ar'], description: 'Report language: en (English), hi (Hindi), cz (Czech), ar (Arabic/RTL)' },
                        reportType: { type: 'string', enum: ['dynamic', 'compact'] },
                        WorkOrderID: { type: 'string' },
                        LabNo: { type: 'string' },
                        PName: { type: 'string' },
                        Gender: { type: 'string' },
                        Age: { type: 'string' },
                        Date: { type: 'string' },
                        ReferredBy: { type: 'string' },
                        qrURL: { type: 'string' },
                        hasPastData: { type: 'boolean' },
                        results: {
                            type: 'array',
                            items: { type: 'object' }
                        }
                    }
                },
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            data: {
                                type: 'object',
                                properties: {
                                    html: { type: 'string' },
                                    metadata: { type: 'object' }
                                }
                            }
                        }
                    }
                }
            }
        },
        async (request: FastifyRequest<GenerateReportRequest>, reply: FastifyReply) => {
            try {
                const { reportType, ...input } = request.body;

                const output = await reportService.generateReport(input, reportType);

                return reply.code(200).send({
                    success: true,
                    data: output
                });
            } catch (error) {
                fastify.log.error(error);
                return reply.code(500).send({
                    success: false,
                    error: 'Failed to generate report',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    );

    /**
     * Health check for reports API
     * GET /api/v1/reports/health
     */
    fastify.get('/health', async (request, reply) => {
        return reply.code(200).send({
            success: true,
            message: 'Reports API is healthy',
            timestamp: new Date().toISOString()
        });
    });

    /**
     * Generate PDF report
     * POST /api/v1/reports/pdf
     */
    fastify.post<GenerateReportRequest>(
        '/pdf',
        {
            schema: {
                description: 'Generate a medical laboratory report as PDF',
                tags: ['Reports']
            }
        },
        async (request: FastifyRequest<GenerateReportRequest>, reply: FastifyReply) => {
            try {
                const { reportType, ...input } = request.body;

                const output = await reportService.generatePDFReport(input, reportType);

                // Set headers for PDF download
                const filename = `report_${input.LabNo}_${Date.now()}.pdf`;
                reply.header('Content-Type', 'application/pdf');
                reply.header('Content-Disposition', `attachment; filename="${filename}"`);

                return reply.code(200).send(output.pdf);
            } catch (error) {
                fastify.log.error(error);
                return reply.code(500).send({
                    success: false,
                    error: 'Failed to generate PDF report',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
    );
}
