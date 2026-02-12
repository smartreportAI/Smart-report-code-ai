import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { logger } from '../../utils/logger.js';

/**
 * S3 service for uploading and managing report PDFs and assets
 * Replaces local file storage with cloud-based object storage
 */
export class S3Service {
    private client: S3Client | null = null;
    private isEnabled = false;

    constructor(
        private readonly region?: string,
        private readonly accessKeyId?: string,
        private readonly secretAccessKey?: string,
    ) { }

    /**
     * Initialize S3 client
     * Falls back gracefully if AWS credentials are not configured
     */
    initialize(): void {
        try {
            if (!this.region || !this.accessKeyId || !this.secretAccessKey) {
                logger.warn('AWS S3 credentials not configured - PDF upload to S3 disabled');
                return;
            }

            this.client = new S3Client({
                region: this.region,
                credentials: {
                    accessKeyId: this.accessKeyId,
                    secretAccessKey: this.secretAccessKey,
                },
            });

            this.isEnabled = true;
            logger.info({ region: this.region }, 'S3 client initialized successfully');
        } catch (error) {
            logger.error({ error }, 'Failed to initialize S3 client');
            this.client = null;
        }
    }

    /**
     * Upload PDF to S3
     * @returns S3 URL or null if upload fails
     */
    async uploadPdf(
        clientId: string,
        labNo: string,
        pdfBuffer: Buffer,
        bucket = 'niroggyansmartreports',
    ): Promise<string | null> {
        if (!this.client || !this.isEnabled) {
            logger.warn('S3 upload skipped - service not enabled');
            return null;
        }

        try {
            const timestamp = Date.now();
            const key = `${clientId}/${labNo}_${timestamp}.pdf`;

            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: pdfBuffer,
                ContentType: 'application/pdf',
                Metadata: {
                    clientId,
                    labNo,
                    uploadedAt: new Date().toISOString(),
                },
            });

            await this.client.send(command);

            const s3Url = `s3://${bucket}/${key}`;
            logger.info({ clientId, labNo, s3Url }, 'PDF uploaded to S3 successfully');

            return s3Url;
        } catch (error) {
            logger.error({ error, clientId, labNo }, 'Failed to upload PDF to S3');
            return null;
        }
    }

    /**
     * Upload input JSON to S3
     */
    async uploadJson(
        clientId: string,
        labNo: string,
        jsonData: unknown,
        bucket = 'inputjson',
    ): Promise<string | null> {
        if (!this.client || !this.isEnabled) {
            logger.warn('S3 upload skipped - service not enabled');
            return null;
        }

        try {
            const timestamp = Date.now();
            const key = `${clientId}/${labNo}_${timestamp}.json`;

            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: JSON.stringify(jsonData, null, 2),
                ContentType: 'application/json',
                Metadata: {
                    clientId,
                    labNo,
                    uploadedAt: new Date().toISOString(),
                },
            });

            await this.client.send(command);

            const s3Url = `s3://${bucket}/${key}`;
            logger.info({ clientId, labNo, s3Url }, 'JSON uploaded to S3 successfully');

            return s3Url;
        } catch (error) {
            logger.error({ error, clientId, labNo }, 'Failed to upload JSON to S3');
            return null;
        }
    }

    /**
     * Download file from S3
     */
    async downloadFile(bucket: string, key: string): Promise<Buffer | null> {
        if (!this.client || !this.isEnabled) {
            logger.warn('S3 download skipped - service not enabled');
            return null;
        }

        try {
            const command = new GetObjectCommand({ Bucket: bucket, Key: key });
            const response = await this.client.send(command);

            if (!response.Body) {
                logger.warn({ bucket, key }, 'S3 object has no body');
                return null;
            }

            const chunks: Uint8Array[] = [];
            for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
                chunks.push(chunk);
            }

            return Buffer.concat(chunks);
        } catch (error) {
            logger.error({ error, bucket, key }, 'Failed to download file from S3');
            return null;
        }
    }

    /**
     * Delete file from S3
     */
    async deleteFile(bucket: string, key: string): Promise<boolean> {
        if (!this.client || !this.isEnabled) {
            logger.warn('S3 delete skipped - service not enabled');
            return false;
        }

        try {
            const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
            await this.client.send(command);

            logger.info({ bucket, key }, 'File deleted from S3 successfully');
            return true;
        } catch (error) {
            logger.error({ error, bucket, key }, 'Failed to delete file from S3');
            return false;
        }
    }

    /**
     * Generate public URL for S3 object (assumes bucket is public or has proper ACL)
     */
    getPublicUrl(bucket: string, key: string): string {
        return `https://${bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }
}

// Singleton instance
export const s3Service = new S3Service(
    process.env.AWS_REGION,
    process.env.AWS_ACCESS_KEY_ID,
    process.env.AWS_SECRET_ACCESS_KEY,
);
