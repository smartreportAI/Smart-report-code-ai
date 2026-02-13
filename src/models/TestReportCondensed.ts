/**
 * TestReportCondensed - Core model for individual test parameters
 * Based on Remedies baseModel.js
 * 
 * This model represents a single test parameter with:
 * - Test value and reference range
 * - Color-coded health indicators
 * - Multi-language support
 * - Accreditation badges (NABL, CAP, NGSP)
 * - Recommendations based on results
 */

import { testDatabaseService } from '../services/TestDatabaseService';
import { MappingService } from '../services/MappingService';

export interface TestObservation {
    name: string;
    id: string;
    value: string;
    MinValue: string;
    MaxValue: string;
    unit: string;
    method?: string;
    isNabl?: string;
    isCap?: string;
    isNGSP?: string;
}

export interface TestDefaults {
    displayName: {
        en: string;
        hi?: string;
        cz?: string;
        ar?: string;
    };
    sliderType: 'LNH' | 'LH' | 'NH' | 'N';
    chartType: 'BC' | 'LC' | 'PC' | 'GC';
    text?: {
        en: string;
        hi?: string;
        cz?: string;
        ar?: string;
    };
    recommendations?: {
        low?: string[];
        high?: string[];
        normal?: string[];
    };
}

export type ColorIndicator =
    | 'normal'
    | 'oneFromNormal'
    | 'twoFromNormal'
    | 'threeFromNormal'
    | 'finalCritical';

export class TestReportCondensed {
    // Core properties
    testName: string;
    testId: string;
    testResultValue: number;
    minParameterValue: number;
    maxParameterValue: number;
    testMeasuringUnit: string;
    testMethod: string;

    // Indicators
    colorIndicator: ColorIndicator;
    signalText: string;

    // Accreditation
    isNabl: boolean;
    isCap: boolean;
    isNgsp: boolean;
    showSvg: boolean;
    accreditationHtml: string;

    // Test defaults from database
    testDefaults: TestDefaults | null;

    // Language
    currentLanguage: string;

    constructor(observation: TestObservation, language: string = 'en') {
        // Resolve client parameter name to standard name via MappingService (branded SRA IDs)
        const mapping = MappingService.getInstance().resolveParameter(observation.name);
        this.testName = mapping?.standardName ?? observation.name;
        this.testId = observation.id;
        this.testResultValue = parseFloat(observation.value) || 0;
        this.minParameterValue = parseFloat(observation.MinValue) || 0;
        this.maxParameterValue = parseFloat(observation.MaxValue) || 0;
        this.testMeasuringUnit = observation.unit || '';
        this.testMethod = observation.method || '';
        this.currentLanguage = language;

        // Accreditation
        this.isNabl = observation.isNabl === 'Y';
        this.isCap = observation.isCap === 'Y';
        this.isNgsp = observation.isNGSP === 'Y';
        this.showSvg = this.isNabl || this.isCap || this.isNgsp;
        this.accreditationHtml = this.generateAccreditationHtml();

        // Load test defaults from database
        this.testDefaults = this.loadTestDefaults();

        // Calculate color indicator
        this.colorIndicator = this.calculateColorIndicator();
        this.signalText = this.getSignalText();
    }

    /**
   * Load test defaults from database
   */
    private loadTestDefaults(): TestDefaults | null {
        return testDatabaseService.findTestDefaults(this.testName);
    }

    /**
     * Calculate color indicator based on value and reference range
     * 
     * Logic:
     * - Normal: Within reference range
     * - Borderline (oneFromNormal): 0-15% outside range
     * - Abnormal (twoFromNormal): 15-30% outside range
     * - High Risk (threeFromNormal): 30-50% outside range
     * - Critical (finalCritical): >50% outside range
     */
    private calculateColorIndicator(): ColorIndicator {
        const value = this.testResultValue;
        const min = this.minParameterValue;
        const max = this.maxParameterValue;

        // Normal range
        if (value >= min && value <= max) {
            return 'normal';
        }

        // Below minimum
        if (value < min) {
            const percentBelow = ((min - value) / min) * 100;
            if (percentBelow > 50) return 'finalCritical';
            if (percentBelow > 30) return 'threeFromNormal';
            if (percentBelow > 15) return 'twoFromNormal';
            return 'oneFromNormal';
        }

        // Above maximum
        if (value > max) {
            const percentAbove = ((value - max) / max) * 100;
            if (percentAbove > 50) return 'finalCritical';
            if (percentAbove > 30) return 'threeFromNormal';
            if (percentAbove > 15) return 'twoFromNormal';
            return 'oneFromNormal';
        }

        return 'normal';
    }

    /**
     * Get signal text based on color indicator
     */
    private getSignalText(): string {
        const signals: Record<ColorIndicator, string> = {
            normal: 'Normal',
            oneFromNormal: 'Borderline',
            twoFromNormal: 'Abnormal',
            threeFromNormal: 'High Risk',
            finalCritical: 'Critical'
        };
        return signals[this.colorIndicator];
    }

    /**
     * Generate accreditation HTML badges
     */
    private generateAccreditationHtml(): string {
        const badges: string[] = [];

        if (this.isNabl) {
            badges.push('<span class="badge badge-nabl">NABL</span>');
        }
        if (this.isCap) {
            badges.push('<span class="badge badge-cap">CAP</span>');
        }
        if (this.isNgsp) {
            badges.push('<span class="badge badge-ngsp">NGSP</span>');
        }

        return badges.join(' ');
    }

    /**
     * Get test name in current language
     */
    getTestName(): string {
        if (!this.testDefaults) return this.testName;
        return this.testDefaults.displayName[this.currentLanguage as keyof typeof this.testDefaults.displayName]
            || this.testDefaults.displayName.en
            || this.testName;
    }

    /**
     * Get test description in current language
     */
    getTestDescription(): string {
        if (!this.testDefaults?.text) return '';
        return this.testDefaults.text[this.currentLanguage as keyof typeof this.testDefaults.text]
            || this.testDefaults.text.en
            || '';
    }

    /**
     * Check if test result is abnormal
     */
    isAbnormal(): boolean {
        return this.colorIndicator !== 'normal';
    }

    /**
     * Get recommendations based on result
     */
    getRecommendations(): string[] {
        if (!this.testDefaults?.recommendations) return [];

        if (this.testResultValue < this.minParameterValue) {
            return this.testDefaults.recommendations.low || [];
        }
        if (this.testResultValue > this.maxParameterValue) {
            return this.testDefaults.recommendations.high || [];
        }
        return this.testDefaults.recommendations.normal || [];
    }

    /**
     * Get color hex code for indicator
     */
    getColorHex(): string {
        const colors: Record<ColorIndicator, string> = {
            normal: '#4CAF50',
            oneFromNormal: '#FFA726',
            twoFromNormal: '#FF7043',
            threeFromNormal: '#F44336',
            finalCritical: '#B71C1C'
        };
        return colors[this.colorIndicator];
    }

    /**
     * Get chart type for visualization
     */
    getChartType(): string {
        return this.testDefaults?.chartType || 'BC';
    }

    /**
     * Get slider type for visualization
     */
    getSliderType(): string {
        return this.testDefaults?.sliderType || 'LNH';
    }

    /**
     * Convert to JSON for API response
     */
    toJSON() {
        return {
            testName: this.getTestName(),
            testId: this.testId,
            value: this.testResultValue,
            unit: this.testMeasuringUnit,
            referenceRange: {
                min: this.minParameterValue,
                max: this.maxParameterValue
            },
            colorIndicator: this.colorIndicator,
            signalText: this.signalText,
            color: this.getColorHex(),
            isAbnormal: this.isAbnormal(),
            accreditation: {
                nabl: this.isNabl,
                cap: this.isCap,
                ngsp: this.isNgsp
            },
            description: this.getTestDescription(),
            recommendations: this.getRecommendations()
        };
    }
}
