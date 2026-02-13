/**
 * Analytics Service
 * 
 * Provides enhanced insights:
 * - Health Score Calculation (0-100)
 * - Risk Assessment
 * - Trend Analysis (if historical data is available)
 */

import { TestReportCondensed } from '../models/TestReportCondensed';
import { ProfileModel } from '../models/ProfileModel';

export interface HealthScore {
    score: number;
    status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    color: string;
}

export interface RiskFactor {
    category: string;
    level: 'LOW' | 'MODERATE' | 'HIGH';
    description: string;
    relatedTests: string[];
}

export class AnalyticsService {
    private static instance: AnalyticsService;

    private constructor() { }

    static getInstance(): AnalyticsService {
        if (!AnalyticsService.instance) {
            AnalyticsService.instance = new AnalyticsService();
        }
        return AnalyticsService.instance;
    }

    /**
     * Calculate overall health score based on test results
     * 
     * Formula:
     * Base Score: 100
     * Deductions:
     * - Critical abnormal: -15
     * - High/Low abnormal: -10
     * - Borderline: -5
     * Minimum Score: 0
     */
    calculateHealthScore(tests: TestReportCondensed[]): HealthScore {
        let score = 100;

        for (const test of tests) {
            if (test.colorIndicator === 'finalCritical') {
                score -= 15;
            } else if (test.colorIndicator === 'threeFromNormal' || test.colorIndicator === 'twoFromNormal') {
                score -= 10;
            } else if (test.colorIndicator === 'oneFromNormal') {
                score -= 5;
            }
        }

        // Ensure score is within bounds
        score = Math.max(0, Math.min(100, score));

        let status: HealthScore['status'] = 'POOR';
        let color = '#F44336'; // Red

        if (score >= 90) {
            status = 'EXCELLENT';
            color = '#4CAF50'; // Green
        } else if (score >= 75) {
            status = 'GOOD';
            color = '#8BC34A'; // Light Green
        } else if (score >= 60) {
            status = 'FAIR';
            color = '#FFC107'; // Amber
        }

        return { score, status, color };
    }

    /**
     * Identify risk factors based on profiles
     */
    identifyRiskFactors(profiles: ProfileModel[]): RiskFactor[] {
        const risks: RiskFactor[] = [];

        for (const profile of profiles) {
            const abnormalCount = profile.getAbnormalCount();
            const totalTests = profile.tests.length;

            if (abnormalCount === 0) continue;

            const percentage = (abnormalCount / totalTests) * 100;
            let level: RiskFactor['level'] = 'LOW';

            if (percentage > 50) level = 'HIGH';
            else if (percentage > 25) level = 'MODERATE';

            // Determine category based on profile name (simple heuristic for now)
            let category = 'General Health';
            let description = 'General health markers showing deviations.';

            const name = profile.displayName.toLowerCase();
            if (name.includes('lipid') || name.includes('heart') || name.includes('cardiac')) {
                category = 'Cardiovascular Health';
                description = 'Markers related to heart health and cholesterol levels.';
            } else if (name.includes('liver') || name.includes('hepatic')) {
                category = 'Liver Function';
                description = 'Markers indicating liver health and function.';
            } else if (name.includes('kidney') || name.includes('renal')) {
                category = 'Kidney Function';
                description = 'Markers indicating kidney health and filtration.';
            } else if (name.includes('sugar') || name.includes('glucose') || name.includes('diabetes')) {
                category = 'Diabetes Risk';
                description = 'Blood sugar levels and related markers.';
            } else if (name.includes('thyroid')) {
                category = 'Thyroid Function';
                description = 'Hormone levels regulating metabolism.';
            } else if (name.includes('blood') || name.includes('hemogram') || name.includes('cbc')) {
                category = 'Blood Health';
                description = 'Complete blood count and related markers.';
            }

            risks.push({
                category,
                level,
                description,
                relatedTests: profile.getAbnormalTests().map(t => t.getTestName())
            });
        }

        return risks;
    }
}

export const analyticsService = AnalyticsService.getInstance();
