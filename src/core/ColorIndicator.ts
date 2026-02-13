/**
 * ColorIndicator - Manages color coding for test results
 * 
 * This system provides a consistent color coding scheme across all reports:
 * - Normal (Green): Within reference range
 * - Borderline (Orange): Slightly outside range (0-15%)
 * - Abnormal (Deep Orange): Moderately outside range (15-30%)
 * - High Risk (Red): Significantly outside range (30-50%)
 * - Critical (Dark Red): Dangerously outside range (>50%)
 */

export type ColorIndicator =
    | 'normal'
    | 'oneFromNormal'
    | 'twoFromNormal'
    | 'threeFromNormal'
    | 'finalCritical';

export interface ColorConfig {
    normal: string;
    oneFromNormal: string;
    twoFromNormal: string;
    threeFromNormal: string;
    finalCritical: string;
}

export class ColorIndicatorSystem {
    /**
     * Default color scheme (Material Design inspired)
     */
    private static defaultColors: ColorConfig = {
        normal: '#4CAF50',        // Green
        oneFromNormal: '#FFA726',  // Orange
        twoFromNormal: '#FF7043',  // Deep Orange
        threeFromNormal: '#F44336', // Red
        finalCritical: '#B71C1C'   // Dark Red
    };

    /**
     * Calculate color indicator based on value and reference range
     * 
     * @param value - The test result value
     * @param min - Minimum reference value
     * @param max - Maximum reference value
     * @returns ColorIndicator
     */
    static calculate(
        value: number,
        min: number,
        max: number
    ): ColorIndicator {
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
        const percentAbove = ((value - max) / max) * 100;
        if (percentAbove > 50) return 'finalCritical';
        if (percentAbove > 30) return 'threeFromNormal';
        if (percentAbove > 15) return 'twoFromNormal';
        return 'oneFromNormal';
    }

    /**
     * Get color hex code for indicator
     * 
     * @param indicator - The color indicator
     * @param customColors - Optional custom color configuration
     * @returns Hex color code
     */
    static getColor(
        indicator: ColorIndicator,
        customColors?: Partial<ColorConfig>
    ): string {
        const colors = { ...this.defaultColors, ...customColors };
        return colors[indicator];
    }

    /**
     * Get signal text for indicator
     * 
     * @param indicator - The color indicator
     * @returns Human-readable signal text
     */
    static getSignalText(indicator: ColorIndicator): string {
        const signals: Record<ColorIndicator, string> = {
            normal: 'Normal',
            oneFromNormal: 'Borderline',
            twoFromNormal: 'Abnormal',
            threeFromNormal: 'High Risk',
            finalCritical: 'Critical'
        };
        return signals[indicator];
    }

    /**
     * Check if indicator represents abnormal value
     * 
     * @param indicator - The color indicator
     * @returns true if abnormal, false if normal
     */
    static isAbnormal(indicator: ColorIndicator): boolean {
        return indicator !== 'normal';
    }

    /**
     * Get severity level (0-4) for indicator
     * 
     * @param indicator - The color indicator
     * @returns Severity level (0 = normal, 4 = critical)
     */
    static getSeverityLevel(indicator: ColorIndicator): number {
        const levels: Record<ColorIndicator, number> = {
            normal: 0,
            oneFromNormal: 1,
            twoFromNormal: 2,
            threeFromNormal: 3,
            finalCritical: 4
        };
        return levels[indicator];
    }

    /**
     * Get CSS class name for indicator
     * 
     * @param indicator - The color indicator
     * @returns CSS class name
     */
    static getCssClass(indicator: ColorIndicator): string {
        return `indicator-${indicator}`;
    }

    /**
     * Get all available colors
     * 
     * @param customColors - Optional custom color configuration
     * @returns Complete color configuration
     */
    static getAllColors(customColors?: Partial<ColorConfig>): ColorConfig {
        return { ...this.defaultColors, ...customColors };
    }
}
