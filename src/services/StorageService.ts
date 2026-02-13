/**
 * Storage Service
 * 
 * Handles storage and retrieval of generated reports (HTML & PDF)
 * Currently implements local file system storage.
 * Designed to be extensible for S3 or other cloud storage.
 */

import fs from 'fs/promises';
import path from 'path';

export interface StoredReport {
    id: string;
    clientId: string;
    type: 'html' | 'pdf';
    path: string;
    url: string; // Public accessible URL (or local path)
    createdAt: Date;
}

export class StorageService {
    private static instance: StorageService;
    private storageDir: string;
    private baseUrl: string;

    private constructor() {
        this.storageDir = path.join(process.cwd(), 'storage', 'reports');
        this.baseUrl = '/api/v1/storage/reports';
        this.initStorage();
    }

    static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    private async initStorage() {
        try {
            await fs.mkdir(this.storageDir, { recursive: true });
        } catch (error) {
            console.error('Failed to initialize local storage:', error);
        }
    }

    /**
     * Save a report file
     */
    async saveReport(
        clientId: string,
        reportId: string,
        content: string | Buffer,
        type: 'html' | 'pdf'
    ): Promise<StoredReport> {
        const filename = `${reportId}.${type}`;
        const filePath = path.join(this.storageDir, filename);

        // Ensure directory exists (initStorage may not have completed)
        await fs.mkdir(this.storageDir, { recursive: true });

        // Determine if content is string (HTML) or Buffer (PDF)
        if (typeof content === 'string') {
            await fs.writeFile(filePath, content, 'utf-8');
        } else {
            await fs.writeFile(filePath, content);
        }

        return {
            id: reportId,
            clientId,
            type,
            path: filePath,
            url: `${this.baseUrl}/${filename}`,
            createdAt: new Date()
        };
    }

    /**
     * getReportPath
     */
    getReportPath(filename: string): string {
        return path.join(this.storageDir, filename);
    }
}

export const storageService = StorageService.getInstance();
