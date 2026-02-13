/**
 * ProfileService - Manages profile definitions and test grouping
 * 
 * This service:
 * - Loads profile definitions
 * - Groups tests into appropriate profiles
 * - Provides profile information in multiple languages
 */

import profileDefinitions from '../data/profileDefinitions.json';
import { ProfileModel, type ProfileDefinition } from '../models/ProfileModel';
import type { TestReportCondensed } from '../models/TestReportCondensed';

export class ProfileService {
    private static instance: ProfileService;
    private profiles: ProfileDefinition[];

    private constructor() {
        this.profiles = profileDefinitions.profiles as ProfileDefinition[];
    }

    /**
     * Get singleton instance
     */
    static getInstance(): ProfileService {
        if (!ProfileService.instance) {
            ProfileService.instance = new ProfileService();
        }
        return ProfileService.instance;
    }

    /**
     * Group tests into profiles
     */
    groupTestsIntoProfiles(
        tests: TestReportCondensed[],
        language: string = 'en'
    ): ProfileModel[] {
        const profileModels: ProfileModel[] = [];
        const assignedTests = new Set<string>();

        // Group tests by profile
        for (const profileDef of this.profiles) {
            const profileTests: TestReportCondensed[] = [];

            for (const test of tests) {
                // Check if test belongs to this profile
                if (this.testBelongsToProfile(test.testName, profileDef)) {
                    profileTests.push(test);
                    assignedTests.add(test.testId);
                }
            }

            // Create profile model if it has tests
            if (profileTests.length > 0) {
                const profileModel = new ProfileModel(profileDef, profileTests, language);
                profileModels.push(profileModel);
            }
        }

        // Create "Other Tests" profile for unassigned tests
        const unassignedTests = tests.filter(t => !assignedTests.has(t.testId));
        if (unassignedTests.length > 0) {
            const otherProfileDef: ProfileDefinition = {
                name: 'other_tests',
                displayName: {
                    en: 'Other Tests',
                    hi: 'अन्य परीक्षण',
                    cz: 'Ostatní testy',
                    ar: 'اختبارات أخرى'
                },
                testIds: [],
                icon: '📋'
            };
            profileModels.push(new ProfileModel(otherProfileDef, unassignedTests, language));
        }

        return profileModels;
    }

    /**
     * Check if a test belongs to a profile
     */
    private testBelongsToProfile(testName: string, profile: ProfileDefinition): boolean {
        const lowerTestName = testName.toLowerCase();

        // Exact match
        if (profile.testIds.some(id => id.toLowerCase() === lowerTestName)) {
            return true;
        }

        // Partial match
        return profile.testIds.some(id =>
            lowerTestName.includes(id.toLowerCase()) ||
            id.toLowerCase().includes(lowerTestName)
        );
    }

    /**
     * Get profile definition by name
     */
    getProfileDefinition(profileName: string): ProfileDefinition | null {
        return this.profiles.find(p => p.name === profileName) || null;
    }

    /**
     * Get all profile definitions
     */
    getAllProfiles(): ProfileDefinition[] {
        return this.profiles;
    }

    /**
     * Get profile display name in specified language
     */
    getProfileDisplayName(profileName: string, language: string = 'en'): string {
        const profile = this.getProfileDefinition(profileName);
        if (!profile) return profileName;

        return profile.displayName[language as keyof typeof profile.displayName]
            || profile.displayName.en
            || profileName;
    }

    /**
     * Get profile description in specified language
     */
    getProfileDescription(profileName: string, language: string = 'en'): string {
        const profile = this.getProfileDefinition(profileName);
        if (!profile?.description) return '';

        return profile.description[language as keyof typeof profile.description]
            || profile.description.en
            || '';
    }

    /**
     * Get total number of profiles
     */
    getProfileCount(): number {
        return this.profiles.length;
    }

    /**
     * Find which profile a test belongs to
     */
    findProfileForTest(testName: string): ProfileDefinition | null {
        for (const profile of this.profiles) {
            if (this.testBelongsToProfile(testName, profile)) {
                return profile;
            }
        }
        return null;
    }
}

// Export singleton instance
export const profileService = ProfileService.getInstance();
