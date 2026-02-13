/**
 * ClientConfig - Client-specific configuration for report customization
 * 
 * Allows each client to customize:
 * - Branding (logo, colors)
 * - Report features (what to show/hide)
 * - Custom text and disclaimers
 * - Header/footer content
 */

export interface BrandColors {
    primary: string;      // Main brand color
    secondary: string;    // Secondary color
    accent: string;       // Accent color for highlights
    success: string;      // Color for normal/good results
    warning: string;      // Color for borderline results
    danger: string;       // Color for abnormal/critical results
}

export interface ReportFeatures {
    showTestDescriptions: boolean;
    showRecommendations: boolean;
    showAccreditation: boolean;
    showProfileIcons: boolean;
    showSummaryStats: boolean;
    showCoverPage: boolean;
    showQRCode: boolean;
    showPastDataComparison: boolean;
    showAnalytics: boolean;
}

export interface HeaderConfig {
    logoUrl?: string;
    labName: string;
    labAddress?: string;
    labContact?: string;
    labEmail?: string;
    labWebsite?: string;
    showPatientPhoto?: boolean;
}

export interface FooterConfig {
    disclaimer?: string;
    customText?: string;
    showSignature?: boolean;
    signatureText?: string;
    signatureImageUrl?: string;
}

export interface ClientConfig {
    clientId: string;
    clientName: string;

    // Branding
    branding: {
        colors: BrandColors;
        header: HeaderConfig;
        footer: FooterConfig;
    };

    // Features
    features: ReportFeatures;

    // Report Settings
    reportSettings: {
        defaultReportType: 'dynamic' | 'compact';
        defaultLanguage: string;
        pageSize: 'A4' | 'Letter';
        includeWatermark: boolean;
        watermarkText?: string;
    };

    // Custom Content
    customContent?: {
        welcomeMessage?: string;
        healthTips?: string[];
        emergencyContact?: string;
        additionalInfo?: string;
    };

    // Metadata
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    };
}

/**
 * Default configuration template
 */
export const DEFAULT_CLIENT_CONFIG: Omit<ClientConfig, 'clientId' | 'clientName'> = {
    branding: {
        colors: {
            primary: '#1976D2',
            secondary: '#424242',
            accent: '#FFA726',
            success: '#4CAF50',
            warning: '#FFA726',
            danger: '#F44336'
        },
        header: {
            labName: 'Medical Laboratory',
            showPatientPhoto: false
        },
        footer: {
            disclaimer: 'This report is computer-generated and for informational purposes only. Please consult your healthcare provider for medical advice.',
            showSignature: false
        }
    },
    features: {
        showTestDescriptions: true,
        showRecommendations: true,
        showAccreditation: true,
        showProfileIcons: true,
        showSummaryStats: true,
        showCoverPage: true,
        showQRCode: false,
        showPastDataComparison: false,
        showAnalytics: false
    },
    reportSettings: {
        defaultReportType: 'dynamic',
        defaultLanguage: 'en',
        pageSize: 'A4',
        includeWatermark: false
    },
    metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
    }
};
