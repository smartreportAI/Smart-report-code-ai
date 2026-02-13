/**
 * ClientConfigService - Manages client configurations
 * 
 * Provides methods to:
 * - Load client configurations
 * - Get configuration by client ID
 * - Apply default values
 * - Validate configurations
 */

import clientConfigsData from '../data/clientConfigs.json';
import { ClientConfig, DEFAULT_CLIENT_CONFIG } from '../models/ClientConfig';

export class ClientConfigService {
    private static instance: ClientConfigService;
    private configs: Map<string, ClientConfig>;

    private constructor() {
        this.configs = new Map();
        this.loadConfigurations();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): ClientConfigService {
        if (!ClientConfigService.instance) {
            ClientConfigService.instance = new ClientConfigService();
        }
        return ClientConfigService.instance;
    }

    /**
     * Load all client configurations from JSON
     */
    private loadConfigurations(): void {
        const data = clientConfigsData as unknown as { clients: any[] };

        for (const rawConfig of data.clients) {
            // Create a copy to avoid mutating the original import
            const config = JSON.parse(JSON.stringify(rawConfig));

            // Convert date strings to Date objects
            if (config.metadata) {
                config.metadata.createdAt = new Date(config.metadata.createdAt);
                config.metadata.updatedAt = new Date(config.metadata.updatedAt);
            }

            this.configs.set(config.clientId, config as ClientConfig);
        }
    }

    /**
     * Get configuration for a specific client
     * Returns default config if client not found
     */
    getConfig(clientId: string): ClientConfig {
        const config = this.configs.get(clientId);

        if (!config) {
            console.warn(`Client config not found for ${clientId}, using default`);
            return this.getDefaultConfig(clientId);
        }

        if (!config.metadata.isActive) {
            console.warn(`Client ${clientId} is inactive, using default config`);
            return this.getDefaultConfig(clientId);
        }

        return config;
    }

    /**
     * Get default configuration with client ID
     */
    private getDefaultConfig(clientId: string): ClientConfig {
        return {
            clientId,
            clientName: 'Default Laboratory',
            ...DEFAULT_CLIENT_CONFIG
        };
    }

    /**
     * Check if client exists
     */
    hasClient(clientId: string): boolean {
        return this.configs.has(clientId);
    }

    /**
     * Get all active clients
     */
    getAllActiveClients(): ClientConfig[] {
        return Array.from(this.configs.values())
            .filter(config => config.metadata.isActive);
    }

    /**
     * Get client count
     */
    getClientCount(): number {
        return this.configs.size;
    }

    /**
     * Get client branding colors
     */
    getClientColors(clientId: string) {
        const config = this.getConfig(clientId);
        return config.branding.colors;
    }

    /**
     * Get client features
     */
    getClientFeatures(clientId: string) {
        const config = this.getConfig(clientId);
        return config.features;
    }

    /**
     * Get client header config
     */
    getClientHeader(clientId: string) {
        const config = this.getConfig(clientId);
        return config.branding.header;
    }

    /**
     * Get client footer config
     */
    getClientFooter(clientId: string) {
        const config = this.getConfig(clientId);
        return config.branding.footer;
    }

    /**
     * Get report settings
     */
    getReportSettings(clientId: string) {
        const config = this.getConfig(clientId);
        return config.reportSettings;
    }

    /**
     * Get custom content
     */
    getCustomContent(clientId: string) {
        const config = this.getConfig(clientId);
        return config.customContent;
    }

    /**
     * Generate CSS variables from client colors
     */
    generateCSSVariables(clientId: string): string {
        const colors = this.getClientColors(clientId);

        return `
      :root {
        --color-primary: ${colors.primary};
        --color-secondary: ${colors.secondary};
        --color-accent: ${colors.accent};
        --color-success: ${colors.success};
        --color-warning: ${colors.warning};
        --color-danger: ${colors.danger};
      }
    `;
    }

    /**
     * Validate client configuration
     */
    validateConfig(config: ClientConfig): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Required fields
        if (!config.clientId) errors.push('clientId is required');
        if (!config.clientName) errors.push('clientName is required');

        // Validate colors (hex format)
        const hexColorRegex = /^#[0-9A-F]{6}$/i;
        const colors = config.branding.colors;

        Object.entries(colors).forEach(([key, value]) => {
            if (!hexColorRegex.test(value)) {
                errors.push(`Invalid color format for ${key}: ${value}`);
            }
        });

        // Validate report type
        const validTypes = ['dynamic', 'compact'];
        if (!validTypes.includes(config.reportSettings.defaultReportType)) {
            errors.push('Invalid defaultReportType: must be dynamic or compact');
        }

        // Validate page size
        if (!['A4', 'Letter'].includes(config.reportSettings.pageSize)) {
            errors.push('Invalid pageSize');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Export singleton instance
export const clientConfigService = ClientConfigService.getInstance();
