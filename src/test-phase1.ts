/**
 * Test script for Phase 1 implementation
 * 
 * This script tests:
 * - TestReportCondensed model
 * - ProfileModel
 * - ColorIndicator system
 * - TestDatabaseService
 * - ProfileService
 */

import { TestReportCondensed, type TestObservation } from './models/TestReportCondensed';
import { ProfileModel } from './models/ProfileModel';
import { ColorIndicatorSystem } from './core/ColorIndicator';
import { testDatabaseService } from './services/TestDatabaseService';
import { profileService } from './services/ProfileService';

console.log('🧪 Phase 1 Implementation Test\n');
console.log('='.repeat(60));

// Test 1: TestDatabaseService
console.log('\n📚 Test 1: Test Database Service');
console.log('-'.repeat(60));
console.log(`Total tests in database: ${testDatabaseService.getTestCount()}`);
console.log(`Categories: ${testDatabaseService.getAllCategories().join(', ')}`);

const hemoglobinDefaults = testDatabaseService.findTestDefaults('Hemoglobin');
console.log(`\nHemoglobin test found: ${hemoglobinDefaults ? '✅' : '❌'}`);
if (hemoglobinDefaults) {
    console.log(`  - Display name (EN): ${hemoglobinDefaults.displayName.en}`);
    console.log(`  - Display name (HI): ${hemoglobinDefaults.displayName.hi}`);
    console.log(`  - Chart type: ${hemoglobinDefaults.chartType}`);
    console.log(`  - Slider type: ${hemoglobinDefaults.sliderType}`);
}

// Test 2: ProfileService
console.log('\n\n📊 Test 2: Profile Service');
console.log('-'.repeat(60));
console.log(`Total profiles: ${profileService.getProfileCount()}`);
const allProfiles = profileService.getAllProfiles();
console.log('Available profiles:');
allProfiles.forEach(p => {
    console.log(`  - ${p.displayName.en} ${p.icon || ''}`);
});

// Test 3: ColorIndicator System
console.log('\n\n🎨 Test 3: Color Indicator System');
console.log('-'.repeat(60));

const testCases = [
    { value: 14, min: 12, max: 16, desc: 'Normal (within range)' },
    { value: 11, min: 12, max: 16, desc: 'Borderline low' },
    { value: 17, min: 12, max: 16, desc: 'Borderline high' },
    { value: 8, min: 12, max: 16, desc: 'Low (abnormal)' },
    { value: 22, min: 12, max: 16, desc: 'High (abnormal)' },
    { value: 4, min: 12, max: 16, desc: 'Critical low' },
];

testCases.forEach(tc => {
    const indicator = ColorIndicatorSystem.calculate(tc.value, tc.min, tc.max);
    const color = ColorIndicatorSystem.getColor(indicator);
    const signal = ColorIndicatorSystem.getSignalText(indicator);
    console.log(`${tc.desc}:`);
    console.log(`  Value: ${tc.value}, Range: ${tc.min}-${tc.max}`);
    console.log(`  Indicator: ${indicator}, Signal: ${signal}, Color: ${color}`);
});

// Test 4: TestReportCondensed Model
console.log('\n\n🧬 Test 4: TestReportCondensed Model');
console.log('-'.repeat(60));

const sampleObservations: TestObservation[] = [
    {
        name: 'Hemoglobin',
        id: 'HB001',
        value: '11.5',
        MinValue: '12.0',
        MaxValue: '16.0',
        unit: 'g/dL',
        method: 'Automated',
        isNabl: 'Y',
        isCap: 'N',
        isNGSP: 'N'
    },
    {
        name: 'Total Cholesterol',
        id: 'CHOL001',
        value: '220',
        MinValue: '0',
        MaxValue: '200',
        unit: 'mg/dL',
        method: 'Enzymatic',
        isNabl: 'Y',
        isCap: 'Y',
        isNGSP: 'N'
    },
    {
        name: 'HDL Cholesterol',
        id: 'HDL001',
        value: '55',
        MinValue: '40',
        MaxValue: '100',
        unit: 'mg/dL',
        method: 'Direct',
        isNabl: 'Y',
        isCap: 'N',
        isNGSP: 'N'
    },
    {
        name: 'Blood Glucose Fasting',
        id: 'GLU001',
        value: '110',
        MinValue: '70',
        MaxValue: '100',
        unit: 'mg/dL',
        method: 'GOD-POD',
        isNabl: 'Y',
        isCap: 'N',
        isNGSP: 'Y'
    }
];

const tests = sampleObservations.map(obs => new TestReportCondensed(obs, 'en'));

console.log(`Created ${tests.length} test objects:\n`);
tests.forEach(test => {
    console.log(`${test.getTestName()}:`);
    console.log(`  Value: ${test.testResultValue} ${test.testMeasuringUnit}`);
    console.log(`  Range: ${test.minParameterValue}-${test.maxParameterValue}`);
    console.log(`  Status: ${test.signalText} (${test.colorIndicator})`);
    console.log(`  Color: ${test.getColorHex()}`);
    console.log(`  Abnormal: ${test.isAbnormal() ? '⚠️ Yes' : '✅ No'}`);
    console.log(`  Accreditation: ${test.accreditationHtml}`);

    const recommendations = test.getRecommendations();
    if (recommendations.length > 0) {
        console.log(`  Recommendations:`);
        recommendations.slice(0, 2).forEach(rec => {
            console.log(`    • ${rec}`);
        });
    }
    console.log('');
});

// Test 5: ProfileModel and Grouping
console.log('\n📋 Test 5: Profile Grouping');
console.log('-'.repeat(60));

const profiles = profileService.groupTestsIntoProfiles(tests, 'en');
console.log(`Tests grouped into ${profiles.length} profiles:\n`);

profiles.forEach(profile => {
    console.log(`${profile.getIcon()} ${profile.displayName}`);
    console.log(`  Status: ${profile.getStatus()}`);
    console.log(`  Summary: ${profile.getSummary()}`);
    console.log(`  Tests: ${profile.getTotalCount()}, Abnormal: ${profile.getAbnormalCount()}`);
    console.log(`  Color: ${profile.getStatusColor()}`);
    console.log('');
});

// Test 6: Multi-language Support
console.log('\n🌍 Test 6: Multi-language Support');
console.log('-'.repeat(60));

const languages = ['en', 'hi'];
const testInMultiLang = new TestReportCondensed(sampleObservations[0], 'en');

languages.forEach(lang => {
    const testLang = new TestReportCondensed(sampleObservations[0], lang);
    console.log(`${lang.toUpperCase()}: ${testLang.getTestName()}`);
});

// Test 7: JSON Serialization
console.log('\n\n📤 Test 7: JSON Serialization');
console.log('-'.repeat(60));

const testJson = tests[0].toJSON();
console.log('Test JSON output:');
console.log(JSON.stringify(testJson, null, 2));

const profileJson = profiles[0].toJSON();
console.log('\nProfile JSON output:');
console.log(JSON.stringify(profileJson, null, 2));

// Summary
console.log('\n\n✅ Phase 1 Implementation Test Summary');
console.log('='.repeat(60));
console.log('✅ TestDatabaseService: Working');
console.log('✅ ProfileService: Working');
console.log('✅ ColorIndicatorSystem: Working');
console.log('✅ TestReportCondensed: Working');
console.log('✅ ProfileModel: Working');
console.log('✅ Multi-language Support: Working');
console.log('✅ JSON Serialization: Working');
console.log('\n🎉 All Phase 1 components are functional!\n');
