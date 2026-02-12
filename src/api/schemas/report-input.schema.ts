import { z } from 'zod';

/**
 * Comprehensive input validation schemas for report generation
 * Prevents crashes from malformed input and provides clear error messages
 */

// Test result schema - individual biomarker value
export const TestSchema = z.object({
    name: z.string().min(1, 'Test name is required').max(200, 'Test name too long'),
    value: z.union([
        z.string().max(100, 'Test value too long'),
        z.number(),
        z.boolean(),
    ]),
    unit: z.string().max(50, 'Unit too long').optional(),
    id: z.string().max(100, 'Test ID too long').optional(),
    min: z.union([z.number(), z.string()]).optional(),
    max: z.union([z.number(), z.string()]).optional(),
    referenceRange: z.string().max(200, 'Reference range too long').optional(),
});

// Package/Profile grouping schema
export const PackageSchema = z.object({
    Package_name: z.string().optional(),
    package_name: z.string().optional(),
    tests: z.array(TestSchema).optional(),
    results: z.array(TestSchema).optional(),
});

// Patient information schema
export const PatientSchema = z.object({
    name: z.string().min(1, 'Patient name is required').max(200, 'Name too long'),
    age: z.union([
        z.number().int().min(0, 'Age must be positive').max(150, 'Age must be realistic'),
        z.string().regex(/^\d+$/, 'Age must be a number'),
    ]).transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val)),
    gender: z.enum(['Male', 'Female', 'Other', 'male', 'female', 'other']).transform((val) =>
        val.toLowerCase() === 'male' ? 'Male' : val.toLowerCase() === 'female' ? 'Female' : 'Other'
    ),
    contact: z.string().max(50, 'Contact too long').optional(),
    email: z.string().email('Invalid email').optional(),
});

// Order information schema
export const OrderSchema = z.object({
    labNo: z.string().min(1, 'Lab number is required').max(100, 'Lab number too long'),
    workOrderId: z.string().max(100, 'Work order ID too long').optional(),
    org: z.string().max(100, 'Organization ID too long').optional(),
    centre: z.string().max(100, 'Centre ID too long').optional(),
    sampleDate: z.string().optional(),
    reportDate: z.string().optional(),
    collectionDate: z.string().optional(),
});

// Report options schema
export const ReportOptionsSchema = z.object({
    reportType: z.enum(['compact', 'advanced', 'hybrid', 'summary', 'dynamic']).default('dynamic'),
    language: z.enum(['en', 'hi', 'ar', 'cz']).default('en'),
    generateCoverPage: z.boolean().default(true),
    generatePrintPdf: z.boolean().default(true),
    showBodySummary: z.boolean().default(true),
    showRecommendations: z.boolean().default(true),
    showHistorical: z.boolean().default(false),
    showRiskScore: z.boolean().default(false),
});

// Main report input schema (canonical nested format)
export const ReportInputSchemaV2 = z.object({
    version: z.string().default('2.0'),
    clientId: z.string().max(100, 'Client ID too long').optional(),
    patient: PatientSchema,
    order: OrderSchema,
    options: ReportOptionsSchema.optional().default({}),
    tests: z.array(TestSchema).min(1, 'At least one test result is required'),
    results: z.array(PackageSchema).optional(), // Legacy support
    data: z.array(z.unknown()).optional(), // Legacy support
});

// Legacy flat format schema (for backward compatibility)
export const ReportInputSchemaV1 = z.object({
    org: z.string().optional(),
    Centre: z.string().optional(),
    LabNo: z.string().min(1, 'Lab number is required'),
    WorkOrderID: z.string().optional(),
    PatientName: z.string().min(1, 'Patient name is required'),
    Age: z.union([z.number(), z.string()]).transform((val) =>
        typeof val === 'string' ? parseInt(val, 10) : val
    ),
    Gender: z.enum(['Male', 'Female', 'Other', 'male', 'female', 'other']),
    reportType: z.enum(['compact', 'advanced', 'hybrid', 'summary', 'dynamic']).optional(),
    reportLang: z.enum(['en', 'hi', 'ar', 'cz']).optional(),
    tests: z.array(TestSchema).min(1, 'At least one test result is required'),
    results: z.array(PackageSchema).optional(),
    data: z.array(z.unknown()).optional(),
}).passthrough(); // Allow unknown fields for legacy compatibility

/**
 * Unified schema that accepts both v1 (legacy) and v2 (canonical) formats
 * Automatically detects format and normalizes to v2 structure
 */
export const UnifiedReportInputSchema = z.union([
    ReportInputSchemaV2,
    ReportInputSchemaV1,
]);

/**
 * Type inference from schemas
 */
export type ReportInputV2 = z.infer<typeof ReportInputSchemaV2>;
export type ReportInputV1 = z.infer<typeof ReportInputSchemaV1>;
export type Test = z.infer<typeof TestSchema>;
export type Patient = z.infer<typeof PatientSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type ReportOptions = z.infer<typeof ReportOptionsSchema>;

/**
 * Normalize legacy v1 input to v2 canonical format
 */
export function normalizeLegacyInput(input: ReportInputV1): ReportInputV2 {
    return {
        version: '2.0',
        clientId: input.org,
        patient: {
            name: input.PatientName,
            age: input.Age as number,
            gender: (input.Gender.charAt(0).toUpperCase() + input.Gender.slice(1).toLowerCase()) as 'Male' | 'Female' | 'Other',
        },
        order: {
            labNo: input.LabNo,
            workOrderId: input.WorkOrderID,
            org: input.org,
            centre: input.Centre,
        },
        options: {
            reportType: input.reportType || 'dynamic',
            language: input.reportLang || 'en',
            generateCoverPage: true,
            generatePrintPdf: true,
            showBodySummary: true,
            showRecommendations: true,
            showHistorical: false,
            showRiskScore: false,
        },
        tests: input.tests,
        results: input.results,
        data: input.data,
    };
}

/**
 * Validate and normalize report input
 * Accepts both legacy and canonical formats
 */
export function validateReportInput(rawInput: unknown): ReportInputV2 {
    const parsed = UnifiedReportInputSchema.parse(rawInput);

    // Check if it's legacy format (has PatientName instead of patient.name)
    if ('PatientName' in parsed) {
        return normalizeLegacyInput(parsed as ReportInputV1);
    }

    return parsed as ReportInputV2;
}
