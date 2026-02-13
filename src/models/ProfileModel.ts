/**
 * ProfileModel - Groups related tests into profiles
 * Based on Remedies profileModel.js
 * 
 * This model groups related test parameters into logical profiles such as:
 * - Lipid Profile
 * - Liver Function Test
 * - Kidney Function Test
 * - Thyroid Profile
 * - Complete Blood Count
 * etc.
 */

import { TestReportCondensed } from './TestReportCondensed';

export interface ProfileDefinition {
    name: string;
    displayName: {
        en: string;
        hi?: string;
        cz?: string;
        ar?: string;
    };
    testIds: string[];
    description?: {
        en: string;
        hi?: string;
        cz?: string;
        ar?: string;
    };
    icon?: string;
}

export class ProfileModel {
    profileName: string;
    displayName: string;
    tests: TestReportCondensed[];
    language: string;
    definition: ProfileDefinition;

    constructor(definition: ProfileDefinition, tests: TestReportCondensed[], language: string = 'en') {
        this.definition = definition;
        this.profileName = definition.name;
        this.displayName = definition.displayName[language as keyof typeof definition.displayName]
            || definition.displayName.en;
        this.tests = tests;
        this.language = language;
    }

    /**
     * Get all abnormal tests in this profile
     */
    getAbnormalTests(): TestReportCondensed[] {
        return this.tests.filter(test => test.isAbnormal());
    }

    /**
     * Get count of abnormal tests
     */
    getAbnormalCount(): number {
        return this.getAbnormalTests().length;
    }

    /**
     * Get total test count
     */
    getTotalCount(): number {
        return this.tests.length;
    }

    /**
     * Check if profile has any abnormal tests
     */
    hasAbnormalTests(): boolean {
        return this.getAbnormalCount() > 0;
    }

    /**
     * Get profile status based on test results
     * - normal: All tests in normal range
     * - attention: Some tests abnormal but not critical
     * - critical: One or more critical tests
     */
    getStatus(): 'normal' | 'attention' | 'critical' {
        const abnormalCount = this.getAbnormalCount();
        const criticalCount = this.tests.filter(t =>
            t.colorIndicator === 'finalCritical' || t.colorIndicator === 'threeFromNormal'
        ).length;

        if (criticalCount > 0) return 'critical';
        if (abnormalCount > 0) return 'attention';
        return 'normal';
    }

    /**
     * Get profile description in current language
     */
    getDescription(): string {
        if (!this.definition.description) return '';
        return this.definition.description[this.language as keyof typeof this.definition.description]
            || this.definition.description.en
            || '';
    }

    /**
     * Get summary text for the profile
     */
    getSummary(): string {
        const total = this.getTotalCount();
        const abnormal = this.getAbnormalCount();
        const status = this.getStatus();

        if (status === 'normal') {
            return `All ${total} tests in normal range`;
        }
        if (status === 'critical') {
            return `${abnormal} of ${total} tests require immediate attention`;
        }
        return `${abnormal} of ${total} tests need attention`;
    }

    /**
     * Get color for profile status
     */
    getStatusColor(): string {
        const status = this.getStatus();
        const colors = {
            normal: '#4CAF50',
            attention: '#FFA726',
            critical: '#F44336'
        };
        return colors[status];
    }

    /**
     * Get icon for profile (if defined)
     */
    getIcon(): string {
        return this.definition.icon || '📊';
    }

    /**
     * Convert to JSON for API response
     */
    toJSON() {
        return {
            profileName: this.profileName,
            displayName: this.displayName,
            description: this.getDescription(),
            status: this.getStatus(),
            statusColor: this.getStatusColor(),
            summary: this.getSummary(),
            totalTests: this.getTotalCount(),
            abnormalTests: this.getAbnormalCount(),
            icon: this.getIcon(),
            tests: this.tests.map(t => t.toJSON())
        };
    }
}
