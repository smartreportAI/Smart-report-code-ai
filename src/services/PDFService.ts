/**
 * PDF Generation Service
 * 
 * Uses Puppeteer to convert HTML reports to PDF
 * Supports custom page sizes, headers, footers, and watermarks
 */

import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

export interface PDFGenerationOptions {
    format?: 'A4' | 'Letter';
    landscape?: boolean;
    printBackground?: boolean;
    margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
}

export class PDFService {
    private static instance: PDFService;
    private browser: Browser | null = null;

    private constructor() { }

    static getInstance(): PDFService {
        if (!PDFService.instance) {
            PDFService.instance = new PDFService();
        }
        return PDFService.instance;
    }

    /**
     * Initialize Puppeteer browser
     */
    private async initBrowser(): Promise<Browser> {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
        return this.browser;
    }

    /**
     * Generate PDF from HTML content
     */
    async generatePDF(
        html: string,
        options: PDFGenerationOptions = {}
    ): Promise<Buffer> {
        const browser = await this.initBrowser();
        const page = await browser.newPage();

        try {
            // Set content
            await page.setContent(html, {
                waitUntil: 'networkidle0'
            });

            // Default PDF options
            const pdfOptions: PDFOptions = {
                format: options.format || 'A4',
                landscape: options.landscape || false,
                printBackground: options.printBackground !== false,
                margin: options.margin || {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                },
                displayHeaderFooter: options.displayHeaderFooter || false,
                headerTemplate: options.headerTemplate || '',
                footerTemplate: options.footerTemplate || ''
            };

            // Generate PDF
            const pdfBuffer = await page.pdf(pdfOptions);

            return Buffer.from(pdfBuffer);
        } finally {
            await page.close();
        }
    }

    /**
     * Generate PDF and save to file
     */
    async generateAndSavePDF(
        html: string,
        outputPath: string,
        options: PDFGenerationOptions = {}
    ): Promise<string> {
        const pdfBuffer = await this.generatePDF(html, options);

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });

        // Write file
        await fs.writeFile(outputPath, pdfBuffer);

        return outputPath;
    }

    /**
     * Close browser instance
     */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

export const pdfService = PDFService.getInstance();
