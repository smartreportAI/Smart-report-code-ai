/**
 * TestDatabaseService - Manages test database and provides test defaults
 * 
 * This service loads the test database and provides methods to:
 * - Look up test defaults by test name
 * - Get test information in different languages
 * - Retrieve recommendations based on test results
 */

import testsDatabase from '../data/testsDatabase.json';
import type { TestDefaults } from '../models/TestReportCondensed';

export class TestDatabaseService {
    private static instance: TestDatabaseService;
    private database: Record<string, any>;

    private constructor() {
        this.database = testsDatabase;
    }

    /**
     * Get singleton instance
     */
    static getInstance(): TestDatabaseService {
        if (!TestDatabaseService.instance) {
            TestDatabaseService.instance = new TestDatabaseService();
        }
        return TestDatabaseService.instance;
    }

    /**
     * Find test defaults by test name
     * Supports fuzzy matching and aliases
     */
    findTestDefaults(testName: string): TestDefaults | null {
        // Direct match
        if (this.database[testName]) {
            return this.database[testName] as TestDefaults;
        }

        // Case-insensitive match
        const lowerTestName = testName.toLowerCase();
        for (const [key, value] of Object.entries(this.database)) {
            if (key.toLowerCase() === lowerTestName) {
                return value as TestDefaults;
            }
        }

        // Partial match (contains)
        for (const [key, value] of Object.entries(this.database)) {
            if (key.toLowerCase().includes(lowerTestName) ||
                lowerTestName.includes(key.toLowerCase())) {
                return value as TestDefaults;
            }
        }

        return null;
    }

    /**
     * Get test display name in specified language
     */
    getTestDisplayName(testName: string, language: string = 'en'): string {
        const defaults = this.findTestDefaults(testName);
        if (!defaults) return testName;

        return defaults.displayName[language as keyof typeof defaults.displayName]
            || defaults.displayName.en
            || testName;
    }

    /**
     * Get test description in specified language
     */
    getTestDescription(testName: string, language: string = 'en'): string {
        const defaults = this.findTestDefaults(testName);
        if (!defaults?.text) return '';

        return defaults.text[language as keyof typeof defaults.text]
            || defaults.text.en
            || '';
    }

    /**
     * Get recommendations for a test result
     */
    getRecommendations(
        testName: string,
        value: number,
        min: number,
        max: number
    ): string[] {
        const defaults = this.findTestDefaults(testName);
        if (!defaults?.recommendations) return [];

        if (value < min) {
            return defaults.recommendations.low || [];
        }
        if (value > max) {
            return defaults.recommendations.high || [];
        }
        return defaults.recommendations.normal || [];
    }

    /**
     * Get all tests in a category
     */
    getTestsByCategory(category: string): string[] {
        const tests: string[] = [];
        for (const [testName, testData] of Object.entries(this.database)) {
            if ((testData as any).category === category) {
                tests.push(testName);
            }
        }
        return tests;
    }

    /**
     * Get all available categories
     */
    getAllCategories(): string[] {
        const categories = new Set<string>();
        for (const testData of Object.values(this.database)) {
            if ((testData as any).category) {
                categories.add((testData as any).category);
            }
        }
        return Array.from(categories);
    }

    /**
     * Check if test exists in database
     */
    hasTest(testName: string): boolean {
        return this.findTestDefaults(testName) !== null;
    }

    /**
     * Get total number of tests in database
     */
    getTestCount(): number {
        return Object.keys(this.database).length;
    }
}

// Export singleton instance
export const testDatabaseService = TestDatabaseService.getInstance();
