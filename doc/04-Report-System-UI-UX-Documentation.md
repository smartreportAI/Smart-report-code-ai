# 📘 Document 4: Remedies Report System – UI, Report Types & User Experience

## Remedies – Next Generation Platform

**Version:** 2.0 | **Last Updated:** February 11, 2026 | **Status:** Comprehensive Report System Documentation

---

## Table of Contents

1. [Report Types Overview](#1-report-types-overview)
2. [Report Page Structure & Feature Breakdown](#2-report-page-structure--feature-breakdown)
3. [Data & Mapping Architecture](#3-data--mapping-architecture)
4. [Report UI/UX Improvement Opportunities](#4-report-uiux-improvement-opportunities)
5. [New Page & Feature Recommendations](#5-new-page--feature-recommendations)
6. [Technical Implementation & Libraries](#6-technical-implementation--libraries)

---

## 1. Report Types Overview

The Remedies platform supports **four primary report types**, each designed for a specific use case and audience. The report type is determined by the `reportType` flag in the client configuration (`state.stateVariable.reportType`).

### Report Type Selection Logic (from `niro.js`)

```javascript
// niro.js — Lines 2460–2464
if (state.stateVariable.reportType === 'dynamic') {
  view = require('./views/hybridReportView');
} else if (state.stateVariable.reportType === 'advanced') {
  view = require('./views/advancedReportView');
}
// Default: compact (via compactReportView)
```

---

### 1.1 Dynamic Report (Hybrid)

**Primary View:** `views/hybridReportView.js` (481 lines)  
**Controller:** `controllers/hybridReportControler.js`  
**Internal Name:** `dynamic` / `hybrid`

#### Purpose & Use Cases

The Dynamic Report is the **most feature-rich and recommended** report type. It intelligently combines elements from both Compact and Advanced views, making decisions about layout based on the nature of each test result:

- **Abnormal results** are displayed with rich visual cards (sliders, gauges, historical charts)
- **Normal results** are displayed in a condensed summary format
- **Special profiles** (e.g., Urinalysis, Allergy Panel) receive custom visual treatment

This is the default report type for most enterprise clients who want a professional, comprehensive, yet easy-to-read report.

#### Key Features

| Feature | Description |
|---------|-------------|
| **Smart Layout Selection** | Automatically chooses card layout (full-width, half-width, third-width) based on test count and grouping |
| **Abnormal-First Display** | Abnormal results are rendered prominently at the top of each profile |
| **Normal Test Summary** | Normal tests are condensed into a compact table-like summary |
| **Profile Summary Card** | Shows normal vs. abnormal test counts with happy/sad face icons |
| **Dynamic Card Grouping** | Groups related tests (e.g., bilirubin triplet, paired tests) into visual card layouts |
| **Special Grouping Types** | Supports `pos/neg`, `bilirubin`, `triplet`, `pair`, and `pairSpe` groupings |
| **Historical Charts** | When enabled, shows trend charts for tests with past observations |
| **Unique Card Arrangements** | Uses `cardUniqueArrangementsHtml` for specialized visual layouts for specific test groups |
| **Legend Display** | Shows Normal/Borderline/High color legend; removes legend for COVID profiles |

#### How Dynamic Content Is Generated

```
Input: Profile Array with test reports
   │
   ├── Step 1: Separate into abnormalDynamic, abnormalWithoutDynamic, normalTest
   │           (via _profile.get*TestReports() methods)
   │
   ├── Step 2: For abnormal tests with dynamic card → generateReportTestOutsideHtmlDynamic()
   │           • bigDynamicCard type → fullWidthArrangementHtmlDynamicBreak()
   │           • uniqueCard with dynamicUniqueGrouping → Unique grouped layout
   │           • Standard tests → generateReportTestOutsideDynamic()
   │
   ├── Step 3: For abnormal tests without dynamic → generateReportTestOutsideHtml()
   │           • Each test → cardArrangementHtml.generateFullWidthCards()
   │
   ├── Step 4: For grouped tests → generateGroupingHtml()
   │           • pos/neg → generatePresentAbsentAllHtml()
   │           • bilirubin → cardSpecialArrangementHtml.generateBilurubinTestReportHtml()
   │           • triplet → cardArrangementHtml.generateThirdWidthCards()
   │           • pair → cardArrangementHtml.generateHalfWidthCards()
   │           • pairSpe → cardArrangementHtml.generatePairedReportOneSlider()
   │
   ├── Step 5: For paired special tests → generateGroupingSpecialPairedHtml()
   │
   ├── Step 6: For normal tests → generateThirdWidthsHtml() (3 per row)
   │
   ├── Step 7: For positive/negative tests → generateGroupingHtml()
   │
   └── Step 8: For remaining normal tests → generateCompactHtml()
               (Uses summaryController.generateNormalTestSummary)
```

#### Data Sources & APIs

| Data Source | Purpose |
|-------------|---------|
| `testsDatabase.js` | Biomarker definitions, reference ranges, profile mappings |
| `profileBaseDynamic.js` | Profile definitions, tips, about text, icons |
| `smartreport/templates/cardArrangementsHtml` | Card layout templates (NPM package) |
| `smartreport/templates/historicalCardUniqueArrangementsHtml` | Historical trend card layouts |
| `smartreport/summary/bodySummary` | Body diagram summary generation |
| MongoDB `clientData` | Client-specific configuration and state overrides |

---

### 1.2 Compact Report

**Primary View:** `views/compactReportView.js` (482 lines)  
**Controller:** `controllers/compactReportControler.js`  
**Internal Name:** `compact` (default)

#### Purpose & Use Cases

The Compact Report provides a **clean, space-efficient layout** where every test result is displayed as a card with an inline slider showing the result's position on the reference range. It's the simplest report type, designed for:

- Labs wanting a straightforward, no-frills report
- Clients with limited page count requirements
- Reports with a large number of tests where space efficiency matters
- Print-first use cases where visual complexity needs to be minimized

#### Key Features

| Feature | Description |
|---------|-------------|
| **Inline Slider SVG** | Each test shows an SVG slider bar indicating where the value falls on the reference range |
| **Color-Coded Border** | Left border of each card is color-coded based on result status (green/yellow/red) |
| **Test Icons** | Optional SVG icons displayed alongside test names |
| **Multi-Language Name** | Shows test name in primary language with fallback language subtitle |
| **Reference Range Table** | Displays ranges when slider is not applicable (e.g., stratified ranges, male/female ranges) |
| **RTL Support** | Full right-to-left layout support for Arabic and similar languages |
| **Urine Chemicals Section** | Special "Found/Not Found" display for urinalysis profiles |
| **Column Headers** | Shows "Test Name | Result | Range" header row per profile |
| **Clinical Remarks** | Displays clinical remarks for tests without slider (e.g., PBS results) |

#### UI Layout Design

```
┌──────────────────────────────────────────────────┐
│ ┌ Legend: ● Normal  ● Borderline  ● High        │
│ │                                                │
│ │  Test Name    │  Result  │     Range/Slider     │
│ ├────────────────────────────────────────────────│
│ │ ▌ Haemoglobin │ 14.5     │ ═══════◆═══════    │
│ │ ▌ g/dL        │          │ 13.0    │   17.5    │
│ ├────────────────────────────────────────────────│
│ │ ▌ WBC Count   │ 11200    │ ══════════◆════    │
│ │ ▌ /cumm       │          │ 4000    │   10000   │
│ ├────────────────────────────────────────────────│
│ │ ▌ Platelet    │ 250000   │ ════◆══════════    │
│ │ ▌ /cumm       │          │ 150K    │   400K    │
│ └────────────────────────────────────────────────│
│                                                  │
│ Slider Types:                                    │
│  • SVG continuous slider (default)               │
│  • footerRanges (table below card)               │
│  • STRATIFIED_RANGES (categorized range table)   │
│  • STRATIFIED_MALE_FEMALE_RANGES (gender split)  │
│  • POSITIVE_NEGETIVE (found/not-found display)   │
│  • No slider for long text results (>20 chars)   │
└──────────────────────────────────────────────────┘
```

#### Slider Type Decision Logic

```javascript
// compactReportView.js — Lines 158–210
const boxWithSlider = (curReport) => {
  let ranges = sliderSvg(curReport, 'compact');          // Default SVG slider
  
  if (curReport.testDefaults.sliderType == 'footerRanges')
    ranges = generateWhiteRangeTable(curReport);          // Footer ranges
    
  if (curReport.testDefaults.sliderType == 'STRATIFIED_RANGES')
    ranges = generateRangeTable(curReport);               // Stratified ranges
    
  if (curReport.testDefaults.sliderType == 'STRATIFIED_MALE_FEMALE_RANGES')
    ranges = generateMaleFemaleRangeTable(curReport);     // Gender-specific
    
  // Render with/without slider based on result value length
  if (curReport.testResultValue.length > 20) withSlider = false;
};
```

#### Card Background Coloring

```javascript
// Controlled by state.stateVariable.showcardBackgroundColor
let cardBackgroundColor = state.stateVariable.cardBackgroundColorColored;
if (state.stateVariable.showcardBackgroundColor) {
  cardBackgroundColor = curReport.colorIndicator
    ? color.reportColors.parameter[curReport.colorIndicator]
    : cardBackgroundColor;
}
```

---

### 1.3 Advanced Report

**Primary View:** `views/advancedReportView.js` (441 lines)  
**Controller:** `controllers/advancedReportControler.js`  
**Internal Name:** `advanced`

#### Purpose & Use Cases

The Advanced Report uses **rich visual cards** for every test — not just abnormal ones. It provides the most detailed and visually engaging presentation:

- Premium clients wanting a high-end visual experience  
- Clients where every test result deserves rich visualization
- Reports with historical data where trend charts add value
- Marketing and showcase purposes

#### Key Features

| Feature | Description |
|---------|-------------|
| **Rich Cards for All Tests** | Every test gets a full visual card with slider, tooltip, and icons |
| **Intelligent Grouping** | Tests are grouped into visual clusters (full-width, half-width, third-width) based on count |
| **Historical Unique Cards** | If past observations exist, uses `historicalCardUniqueArrangementsHtml` for trend visualization |
| **Unique Card Layouts** | Special named layouts via `cardUniqueArrangementsHtml` for test-specific visual treatments |
| **Auto Card Sizing** | 1 test = full-width, 2 tests = half-width, 3 tests = third-width |
| **Smart Grouping Reuse** | Tests marked as `grouping = 'used'` are skipped to prevent duplicate rendering |

#### Card Arrangement Decision Tree

```
For each test in profile:
  │
  ├── grouping == 'used' → SKIP (already rendered in a group)
  │
  ├── uniqueCard && !pastFlagger → generateUniqueGroupedTestReport()
  │   │                             Uses cardUniqueArrangementsHtml
  │   └── historicalUniqueCard   → Also uses historicalCardUniqueArrangementsHtml
  │
  ├── grouping exists → generateGroupedTestReport()
  │   ├── 1 test  → generateFullWidthCards()
  │   ├── 2 tests → generateHalfWidthCards()
  │   └── 3 tests → generateThirdWidthCards()
  │
  └── No grouping → generateFullWidthCards() (standard single card)
```

---

### 1.4 Summary Report (Summary/PCOS)

**Primary View:** `views/summaryView.js` (711 lines)  
**Controller:** `controllers/summaryController.js`  
**Internal Name:** Determined by `summaryType` flag (1, 2, or default)

#### Purpose & Use Cases

The Summary Report is not a standalone report type — it's an **additional section** that can be prepended to any report type. It provides a high-level overview of all test results before the detailed profile-by-profile breakdown:

- Provides "at a glance" health overview
- Groups test results by profile with abnormal/normal categorization
- Supports multiple summary layouts (PCOS-specific, single-column, two-column)

#### Summary Type Selection

```javascript
// summaryView.js — Lines 693–700
if (state.stateVariable.summaryType === 1) {
  generateSummaryHtml = generatePCOSsummary;        // PCOS-specific summary
} else if (state.stateVariable.summaryType === 2) {
  generateSummaryHtml = generateFullWidthSingleCollumn;  // Single column (default)
} else {
  generateSummaryHtml = generateFullWidthTwoCollumn;     // Two column layout
}
```

#### Summary Page Components

| Component | Function | Description |
|-----------|----------|-------------|
| **Introduction** | `generateIntroduction()` | Personalized greeting with patient name, age, gender |
| **UX Steps** | `generateUxSteps()` | Step-by-step guide on how to read the report |
| **Summary of Summary** | `generateSummaryOfSummary()` | Quick overview badges for each profile |
| **Abnormal Profile Items** | `generateAbnormalProfileItemHtml()` | Detailed abnormal test display with sliders |
| **Normal Profile Items** | `generateNormalItemHtml()` | Condensed normal test listing |
| **Profile Tips** | `generateProfileTips()` | Health tips based on profile results |
| **Doctor Signatures** | `addSign()` | Doctor signature images with name and designation |

---

### 1.5 Report Type Comparison Matrix

| Feature | Compact | Advanced | Dynamic (Hybrid) | Summary |
|---------|---------|----------|-------------------|---------|
| **Abnormal Test Cards** | ✅ Inline slider | ✅ Rich visual card | ✅ Rich visual card | ✅ Badge summary |
| **Normal Test Cards** | ✅ Same as abnormal | ✅ Rich visual card | ⚡ Condensed table | ✅ Name list |
| **Historical Trends** | ❌ | ✅ If available | ✅ If available | ❌ |
| **Visual Grouping** | ❌ Flat list | ✅ 1/2/3 width | ✅ Smart sizing | ❌ |
| **Slider Visualization** | ✅ SVG inline | ✅ In card | ✅ In card | ❌ |
| **RTL Language Support** | ✅ Full | ⚠️ Partial | ⚠️ Partial | ✅ Full |
| **Multi-Language** | ✅ | ✅ | ✅ | ✅ |
| **Page Efficiency** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Visual Richness** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Use Case** | Simple labs | Premium clients | Enterprise default | Add-on section |
| **File** | `compactReportView.js` | `advancedReportView.js` | `hybridReportView.js` | `summaryView.js` |

---

## 2. Report Page Structure & Feature Breakdown

Each generated PDF report is assembled from multiple pages/sections. Below is the complete page-by-page breakdown with implementation details.

### 2.1 Cover Page

**File:** `common/generateCoverPage.js` (969 lines)  
**Toggle:** `state.stateVariable.generateCovePage`

#### Purpose

The cover page is the first page of the PDF report. It displays the lab's branding, patient information, and medical report metadata. It establishes the visual identity of the report.

#### UI Components

- Lab logo and branding (from S3 or base64)
- Patient details block (name, age, gender, lab number, date)
- Package/test name display
- Background image or gradient
- Optional barcode/QR code

#### Implementation Approach

```javascript
// generateCoverPage.js exports a single function:
module.exports = async (outPath, navPath, browser, path, reportDetails, tests, isPrint = false) => {
  // 1. Load HTML template with all CSS
  // 2. Inject patient details using generateFieldHtml()
  // 3. Apply client-specific cover page styling
  // 4. Render HTML via Puppeteer to a PDF page
  // 5. Return PDF buffer
};
```

#### Cover Page Types

| Type | Config | Description |
|------|--------|-------------|
| **Dynamic Cover** | `dynamicCoverPage: true` | Fetches pre-designed cover page PDF from S3 |
| **Generated Cover** | `dynamicCoverPage: false` | Generates cover page from HTML template with patient data |
| **Inner Page** | `generateCoverInnerPage: true` | Additional page after cover (e.g., lab terms and conditions) |

#### Data Mapping Logic

- Patient name → `reportDetails.patientName`
- Lab number → Derived from input JSON `LabNo` field
- Date → Either from input JSON or `new Date()`
- Logo → From S3 bucket `niroggyan-assets/{center}/`

---

### 2.2 Intro Page (Quick Summary Dashboard)

**File:** `common/introPage.js` (329 lines)  
**Toggle:** `state.stateVariable.showIntroPage`

#### Purpose

The Intro Page is an optional dashboard-style page that provides a visual health summary with risk scores and a QR code linking to an interactive VizApp.

#### UI Components

| Component | Function | Description |
|-----------|----------|-------------|
| **Risk Score Gauges** | `getRiskScoreSection()` | ECharts-rendered gauge charts showing health risk by category |
| **QR Code** | `generateQrCode()` | QR code linking to VizApp interactive dashboard |
| **Additional Content** | `getAdditionalSections()` | Client-specific supplementary content blocks |
| **Health Overview** | `generateIntoPage()` | Combined summary of all health indicators |

#### Data Sources

- Risk score calculation: Calls external API `utils.getRiskScore(tests, reportDetails)`
- VizApp URL: Generated via JWT-encoded URL with patient data (`generateUrl()`)

#### Risk Score Generation

```javascript
// introPage.js — generateUrl()
const generateUrl = (reportDetails, tests) => {
  const payload = {
    org: reportDetails.org,
    labNo: reportDetails.labNo,
    name: reportDetails.patientName,
    age: reportDetails.age,
    gender: getGender(reportDetails.gender),
    // ... test data
  };
  const token = jwt.sign(payload, secret);
  return `${vizAppBaseUrl}?token=${token}`;
};
```

---

### 2.3 Body Summary Page

**File:** `common/newBodySummary.js` (274 lines) + `smartreport/summary/bodySummary` (NPM package)  
**Toggle:** `state.stateVariable.showbodySummary`

#### Purpose

The Body Summary is a **visual health dashboard** that maps test results to body organs. It uses a human body diagram with color-coded indicators showing which organ systems are normal or abnormal.

#### UI Components

- Human body SVG diagram with organ positioning
- Color-coded profile status indicators (Normal/Abnormal)
- Profile name labels positioned next to relevant body parts
- Abnormal test count badges
- Health summary legend

#### Body Summary Types

| Type | Config | Renderer |
|------|--------|----------|
| **Type 1** | `bodySummaryType: 1` | `bodySummary.generateBodySummary()` — Classic SVG body map |
| **Type 2** | `bodySummaryType: 2` | `generateBodySummaryType2()` — Table-based with color bars |

#### Supported Profiles in Body Map

The body summary supports the following profiles (from `summary_table.js` and `generateProfiles.js`):

| Profile | SVG Location | Body Position |
|---------|-------------|---------------|
| Blood Counts | Left side, top | `bloodCount.svg` |
| Urinalysis | Left side, second | `urinalysis_copy.svg` |
| Lipid Profile | Left side, middle | `lipidProfile.svg` |
| Kidney Profile | Left side, lower-middle | `kidneyProfile.svg` |
| Diabetes Monitoring | Left side, lower | `diabetesMonitoring.svg` |
| Thyroid Profile | Right side, top | `thyroid-gland.svg` |
| Electrolyte Profile | Right side, second | `kidneys.svg` |
| Vitamin D | Right side, middle | `vitamin.svg` |
| Liver Profile | Right side, lower-middle | `liver.svg` |
| Vitamin Profile | Left side, bottom | `vitamin.svg` |
| Anemia Studies | Right side, lower | `hemoglobin.svg` |
| Arthritis Screening | Right side, bottom | `x-ray.svg` |

#### Sufficient Profiles Check

```javascript
// generateProfiles.js — hasSufficientProfiles()
const hasSufficientProfiles = () => {
  const bodySummaryProfiles = [
    'Blood Counts', 'Lipid Profile', 'Kidney Profile',
    'Electrolyte Profile', 'Vitamin Profile', 'Thyroid Profile',
    'Diabetes Monitoring', 'Liver Profile', 'Vitamin D',
    'Anemia Studies', 'Arthritis Screening'
  ];
  let filteredProfiles = profileArray.filter(each =>
    bodySummaryProfiles.includes(each.profileName)
  );
  // Need at least 3 matching profiles (or 1 if removeBodySummaryLimit is enabled)
  if (state.stateVariable.removeBodySummaryLimit && filteredProfiles?.length >= 1) return true;
  return filteredProfiles?.length >= 3;
};
```

---

### 2.4 Report Summary Page

**File:** `views/summaryView.js` (711 lines)  
**Controller:** `controllers/summaryController.js`  
**Toggle:** `state.stateVariable.showSummary`

#### Purpose

The Report Summary page provides a **profile-by-profile overview** of all test results. Each profile is displayed as a card showing abnormal and normal test counts, colors, and values. This helps the patient quickly identify which areas need attention.

#### UI Components

| Component | Function | Key Feature |
|-----------|----------|-------------|
| **Report Summary Header** | Via `generateHeader()` | Patient details + "REPORT SUMMARY" heading |
| **Profile Cards** | `generateProfileHtml()` | Per-profile abnormal/normal test summary |
| **Abnormal Item Display** | `generateAbnormalProfileItemHtml()` | Color-coded test cards with slider values |
| **Normal Item List** | `generateNormalItemHtml()` | Compact list of normal tests with green indicators |
| **Profile Tips** | `generateProfileTips()` | Health tips from biomarker database |
| **Summary Box (With/Without Range)** | `summaryBoxWithRangeValue()` / `summaryBoxWithoutRangeValue()` | Detailed value display |
| **Doctor Signatures** | `addSign()` | Doctor signature + name at summary end |
| **Accreditation Badges** | `generateAccreditionHtml()` | NABL/CAP/NGSP badges |
| **Barcode** | JsBarcode | Optional barcode at top of summary |

#### Summary Rendering Logic

```javascript
// summaryController.js
const readyTemplates = (profileArray, reportDetails) => {
  const htmlTemplate = summaryView.generateSummaryHtml(profileArray, reportDetails);
  return color.insertColorValue(htmlTemplate);
  // insertColorValue replaces color placeholders with actual hex values
};
```

---

### 2.5 Profile Detail Pages

**Files:** Report type view files (compactReportView, advancedReportView, hybridReportView)  
**Generated in:** `common/generateProfiles.js` (1,214 lines — main export function)

#### Purpose

Profile detail pages form the **core of the report**. Each health profile (e.g., "Complete Blood Count", "Lipid Profile") gets its own section with detailed test results, sliders, tips, and recommendations.

#### Page Assembly (from `generateProfiles.js`)

For each profile in `profileArray`, the system generates:

```
┌─────────────────────────────────────────────────────────────┐
│  ┌── Patient Header (repeating table header for each page)  │
│  │   Name | Age | Gender | Lab No | Sample Date             │
│  ├──────────────────────────────────────────────────────────│
│  │   Accreditation Badges (NABL/CAP)                        │
│  │   Barcode (optional)                                     │
│  ├──────────────────────────────────────────────────────────│
│  │   Profile Heading (e.g., "Complete Blood Count")         │
│  │   Color Legend (Normal ● | Borderline ● | High ●)       │
│  ├──────────────────────────────────────────────────────────│
│  │   Risk Score Gauge (if showRiskScore enabled)            │
│  ├──────────────────────────────────────────────────────────│
│  │   Test Cards (per report type view - compact/adv/hybrid) │
│  │   ├── Test 1: Haemoglobin   14.5 g/dL  [═══◆═══]       │
│  │   ├── Test 2: WBC Count     11200 /mm³  [══════◆]       │
│  │   └── Test 3: Platelets     250K /mm³   [═◆══════]      │
│  ├──────────────────────────────────────────────────────────│
│  │   Tips Section (if tipsFlag = true)                      │
│  │   "Your CBC results indicate..."                         │
│  ├──────────────────────────────────────────────────────────│
│  │   Patient Intro (first profile only, if enabled)         │
│  ├──────────────────────────────────────────────────────────│
│  │   Doctor Remarks (if available)                          │
│  ├──────────────────────────────────────────────────────────│
│  │   Doctor Signature(s)                                    │
│  │   Terms & Conditions (if enabled)                        │
│  │   End of Report marker (last profile only)               │
│  └──────────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────┘
```

---

### 2.6 Risk Score Section

**File:** `common/generateRiskScoreHtml.js` (423 lines)  
**Toggle:** `state.stateVariable.showRiskScore`

#### Purpose

The Risk Score section provides **calculated health risk assessments** for specific profiles. It uses ECharts to render gauge charts and generates QR codes linking to external risk calculators.

#### Supported Profiles for Risk Score

| Profile | Risk Levels | Colors |
|---------|------------|--------|
| **Lipid Profile** | Low / Intermediate / High | Green / Yellow / Red |
| **Diabetes Monitoring** | Low / Medium / High | Green / Yellow / Red |

#### Risk Gauge Implementation

```javascript
// generateRiskScoreHtml.js — getRiskGaugeImageUrl()
const getRiskGaugeImageUrl = (profile) => {
  const canvas = createCanvas(400, 400);
  const chart = echarts.init(canvas);
  chart.setOption({
    series: [{
      type: 'gauge',
      detail: { formatter: '{value}' },
      data: [{ value: profile.riskScore }]
    }]
  });
  return canvas.toDataURL();   // Returns base64 data URL for embedding in HTML
};
```

---

### 2.7 Recommendations & Next Steps Page

**File:** `common/generateNextStepRecommendations.js` (549 lines)  
**Toggle:** `state.stateVariable.showAdditionalRecommendationsPage`

#### Purpose

Provides actionable health recommendations based on abnormal test results. This page is generated from an external AI/ML API response that analyzes the report data.

#### UI Components

| Component | Function | Description |
|-----------|----------|-------------|
| **Next Steps Header** | `generateNextStepsHeader()` | Section title with icon |
| **Single Abnormal Grid** | `generateSingleAbnormalGrid()` | Cards for profiles with one abnormal test |
| **Multiple Abnormalities Grid** | `generateMultipleAbnormalitiesGrid()` | Cards for profiles with multiple abnormals |
| **QR Code Banner** | `generateQRCodeHtml()` | QR code linking to interactive report with CTA button |
| **Badge** | `renderBadge()` | Visual indicator for recommendation category |

#### Data Flow

```
Profile Array → createExternalReportObj() → Upload to S3
                      ↓
         API Call: getNextStepRecommendations()
                      ↓
         Response: { single: [...], multiple: [...] }
                      ↓
         extractRecommendationBuckets() → single/multiple arrays
                      ↓
         Render grids → HTML page → PDF
```

#### Icon System

```javascript
// generateNextStepRecommendations.js — getIconForProfile()
const iconMap = {
  'blood': 'blood-cell.png',
  'liver': 'liver.png',
  'kidney': 'kidneys.png',
  'thyroid': 'thyroid-gland.png',
  'diabetes': 'diabetes.png',
  'vitamin': 'vitamin.png',
  'lipid': 'lipid.png',
  'heart': 'heart.png',
  // 20+ more mappings...
};
```

---

### 2.8 Additional Pages

| Page | File | Toggle | Description |
|------|------|--------|-------------|
| **Booking Recommendations** | `smartreport/recommendations/generateadditionalpage` | `showAdditionalBookingsPage` | Follow-up test booking suggestions |
| **Back Page** | Loaded from file path | `showBackPage` | Static back cover PDF (marketing, disclaimer) |
| **References Page** | Loaded from file path | `showReferencesPage` | Lab methodology and reference standards |
| **Cover Inner Page** | Loaded from file path | `generateCoverInnerPage` | Terms & conditions after cover |

---

## 3. Data & Mapping Architecture

### 3.1 Data Types Used for Report Generation

| Data Category | Source | Size | Purpose |
|---------------|--------|------|---------|
| **Input JSON** | API request body | 1-50 KB | Raw patient test results from LIS |
| **Biomarker Database** | `testsDatabase.js` | 988 KB | Standard test definitions, ranges, profiles |
| **Profile Definitions** | `profileBaseDynamic.js` | 266 KB | Profile groupings, tips, icons, order |
| **Test Content** | `testsContentBase.js` | 299 KB | Educational content per test (multi-lang) |
| **Client Config** | MongoDB + `state.js` | 2-10 KB | Client-specific settings and overrides |
| **Report Details** | Extracted from input | 1-5 KB | Patient metadata, doctor info |
| **Brand Assets** | S3 bucket | Variable | Logos, headers, footers, signatures |
| **Color Config** | `color.js` | 18 KB | Color schemes, legends, placeholders |

### 3.2 Data Transformation Pipeline

```
Step 1: INPUT PARSING
  Raw JSON → destructure() → Normalized test array
  Handles formats: standard | SRL/Max | element-based | wrapped

Step 2: PARAMETER MAPPING
  Test name/ID → mapping.js lookup → Standard biomarker ID
  Chain: idMapping → nameMapping → fuzzy alias → fallback

Step 3: TEST OBJECT CREATION
  Raw test data → baseModel.js → TestReport object
  Includes: value, unit, ranges, color indicator, icon

Step 4: PROFILE GROUPING
  TestReport[] → testsDatabase.biomarkerProdfileMap → Profile[]
  Handles: multi-profile membership, custom ordering

Step 5: COLOR CLASSIFICATION
  Value + Range → color.js → Color indicator (normal/borderline/high/low/critical)
  Produces: colorIndicator, signalIndicator, sliderPosition

Step 6: CONTENT ENRICHMENT
  TestReport + language → testsContentBase → Tips, about text, recommendations
  Falls back to English if requested language unavailable

Step 7: HTML RENDERING
  Profile[] + ReportType → View generator → HTML string
  Template system: JavaScript string concatenation (current)

Step 8: PDF GENERATION
  HTML string → Puppeteer/Chromium → PDF buffer
  Options: page size, margins, header/footer injection
```

### 3.3 Color Classification System

**File:** `common/color.js` (581 lines)

```javascript
// Color Indicator Hierarchy
const colorIndicators = {
  normal: 'normal',           // Within reference range
  oneFromNormal: 'oneFromNormal',  // Borderline (1 zone from normal)
  twoFromNormal: 'twoFromNormal',  // Moderately abnormal
  finalCritial: 'finalCritial',    // High/Low (outside range)
  threeFromNormal: 'threeFromNormal' // Critical
};

// Color Placeholder System — allows runtime color injection
const colorPlaceholder = {
  normal: '{{COLOR_GREEN}}',
  oneFromNormal: '{{COLOR_YELLOW}}',
  twoFromNormal: '{{COLOR_ORANGE}}',
  finalCritial: '{{COLOR_RED}}',
  threeFromNormal: '{{COLOR_DARK_RED}}'
};

// insertColorValue() replaces all placeholders with actual hex values
// This enables colored + grayscale PDF variants from the same HTML
```

### 3.4 Error Handling & Fallback Strategies

| Scenario | Fallback |
|----------|----------|
| **Unmapped test** | Rendered in "All Other Tests" profile using `fallbackTestView.js` |
| **Missing reference range** | Test displayed without slider; shows raw value and unit |
| **Missing content/tips** | Empty string; no tips section rendered |
| **Missing language** | Falls back to `fallbackLang` (usually English) |
| **Missing doctor signature** | Signature section hidden via `onerror="this.style.display='none'"` |
| **Missing cover page S3 asset** | Skips cover page entirely (`coverPage = ''`) |
| **API recommendation failure** | Caught in try/catch; recommendations page not generated |

---

## 4. Report UI/UX Improvement Opportunities

### 4.1 Visual Design Improvements

| Area | Current State | Proposed Improvement | Impact |
|------|--------------|---------------------|--------|
| **Typography** | System fonts, inconsistent sizing | Google Fonts (Inter/Nunito Sans), typographic scale system | ⭐⭐⭐⭐ |
| **Color System** | Hardcoded hex values with placeholders | CSS custom properties, HSL-based design tokens | ⭐⭐⭐⭐ |
| **Card Design** | Basic border-left colored cards | Rounded corners, subtle shadows, gradient accents | ⭐⭐⭐ |
| **Slider Design** | Basic SVG bar | Animated gradient slider with marker tooltip | ⭐⭐⭐⭐⭐ |
| **Icons** | Static PNG/SVG files | Consistent icon library (Lucide/Phosphor) | ⭐⭐⭐ |
| **Spacing** | Inconsistent margin/padding | 4px base grid system | ⭐⭐⭐ |
| **Information Hierarchy** | Flat structure | Visual weight hierarchy (size, color, position) | ⭐⭐⭐⭐ |

### 4.2 Summary Section Improvements

| Current | Proposed |
|---------|----------|
| Text-heavy abnormal/normal lists | Visual badge pills with color-coded test names |
| Simple text profile status | Radial progress indicators per profile |
| Basic body diagram | Interactive SVG with hover tooltips showing test counts |
| No overall health score | Aggregate health score (0-100) with gauge chart |
| Static recommendation text | Prioritized action cards with severity ranking |

### 4.3 Readability & Information Hierarchy

| Improvement | Description |
|-------------|-------------|
| **Progressive Disclosure** | Show summary first, detailed results on subsequent pages |
| **Visual Anchors** | Use icons and color bars to help the eye navigate quickly |
| **Consistent Layouts** | Standardize card widths, heights, and spacing across all report types |
| **Whitespace** | Increase padding between sections for better scanability |
| **Font Weight Hierarchy** | Bold for headings, medium for values, regular for labels |
| **Data Density Controls** | Allow configuration of information density per client |

### 4.4 Mobile & Digital Experience

| Current | Proposed |
|---------|----------|
| PDF only — not mobile optimized | Responsive HTML report (VizApp already exists, but could be enhanced) |
| No interactive elements in PDF | Interactive VizApp with drill-down capabilities |
| Static slider images | Animated sliders with touch interaction |
| No dark mode | Dark mode toggle for VizApp digital view |
| No accessibility features | WCAG 2.1 AA compliance for digital versions |

### 4.5 Performance Optimization

| Area | Current Issue | Proposed Fix | Expected Gain |
|------|--------------|------------- |---------------|
| **PDF Size** | 2-8 MB average | Compress images, subset fonts, optimize SVGs | 40-60% reduction |
| **Render Time** | 15-30s | Browser pooling, template pre-compilation, parallel page rendering | 3-5x faster |
| **HTML Generation** | String concatenation | Pre-compiled Handlebars templates | 2x faster HTML gen |
| **Font Loading** | External Google Fonts URL in every page | Embedded font subsets | Eliminate network calls |
| **Image Loading** | Multiple S3 requests per report | Pre-fetch and cache brand assets | Fewer API calls |
| **Color Substitution** | Regex replace on entire HTML string | Use CSS variables | Cleaner, faster |

---

## 5. New Page & Feature Recommendations

### 5.1 Health Interpretation Guide

**Purpose:** Help patients understand what their results mean without medical background.

```
┌─────────────────────────────────────────────┐
│         📖 Understanding Your Report        │
│                                             │
│  ● GREEN = Normal range                    │
│  ● YELLOW = Borderline — monitor this      │
│  ● RED = Outside range — consult doctor    │
│                                             │
│  How to read the slider:                    │
│  [Low ← ═══◆═══════ → High]               │
│   Your value ◆ is within normal range      │
│                                             │
│  What is a "Profile"?                       │
│  A profile groups related tests (e.g.,     │
│  "Lipid Profile" includes Cholesterol,     │
│  Triglycerides, HDL, LDL, VLDL)           │
└─────────────────────────────────────────────┘
```

### 5.2 Trend Analysis Page

**Purpose:** Show how key biomarkers have changed over time across multiple reports.

| Feature | Description |
|---------|-------------|
| **Trend Charts** | Line charts showing value progression over last 3-5 reports |
| **Direction Indicators** | ↑ Increasing / ↓ Decreasing / → Stable arrows |
| **Normal Range Band** | Shaded green zone showing healthy range on the chart |
| **Improvement Tracking** | "Your HbA1c improved from 7.2 to 6.8 — great progress!" |

### 5.3 Personalized Health Insights Page

**Purpose:** AI-generated personalized health insights based on the complete report.

| Feature | Description |
|---------|-------------|
| **Overall Health Score** | Aggregate score 0-100 based on all test results |
| **Top Concerns** | "Your top 3 areas needing attention are..." |
| **Lifestyle Tips** | Diet, exercise, sleep recommendations based on results |
| **Next Test Due** | "Based on your results, we recommend re-testing in 3 months" |

### 5.4 Visual Health Score Dashboard

**Purpose:** A single-page visual dashboard showing overall health across all organ systems.

```
┌─────────────────────────────────────────────────────┐
│              🏥 Your Health Dashboard               │
│                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│   │ ❤️ Heart  │  │ 🫁 Liver │  │ 🦴 Bones │        │
│   │   85/100  │  │   72/100  │  │   90/100  │        │
│   │  ████████ │  │  ███████  │  │  █████████ │        │
│   │  Normal   │  │  Caution  │  │  Healthy   │        │
│   └──────────┘  └──────────┘  └──────────┘        │
│                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│   │ 🩸 Blood │  │ 🧬 Thyroid│  │ 💊 Diabetes│       │
│   │   65/100  │  │   95/100  │  │   78/100  │        │
│   │  ██████   │  │  █████████│  │  ████████ │        │
│   │  Monitor  │  │  Excellent│  │  Watch    │        │
│   └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────┘
```

### 5.5 Medical Glossary Page

**Purpose:** Auto-generated glossary explaining medical terms found in the report.

| Term | Definition |
|------|-----------|
| Implemented from `testsContentBase.js` → `whatIsIt` field |
| Each test name → plain-language definition |
| Reference range terms (Normal, Borderline, Critical) |
| Measurement units (g/dL, mmol/L, U/L) explained |

### 5.6 Interactive Recommendation Cards

**Purpose:** Transform text recommendations into actionable cards with visual hierarchy.

| Card Type | Content |
|-----------|---------|
| **🔴 Urgent** | "Your blood glucose is critically high. Please consult your doctor immediately." |
| **🟡 Monitor** | "Your cholesterol is borderline. Consider reducing saturated fat intake." |
| **🟢 Great** | "Your thyroid function is excellent. Keep up your current lifestyle." |
| **📅 Follow-up** | "Re-test your HbA1c in 3 months to track improvement." |

---

## 6. Technical Implementation & Libraries

### 6.1 Current Frontend/Rendering Libraries

| Library | Version | Purpose | File Size Impact |
|---------|---------|---------|------------------|
| **Puppeteer** | via `chrome-aws-lambda` | Headless Chrome for HTML→PDF conversion | Core dependency |
| **ECharts** | 5.x | Gauge charts for risk scores | ~1MB (server-side rendering via `canvas`) |
| **Chart.js** | 4.x | Historical trend charts | ~200KB (via `chartjs-node-canvas`) |
| **Canvas** | `canvas` NPM package | Server-side canvas rendering for charts | Native binding |
| **Jimp** | Legacy | Image processing (resize, crop) | ~1MB |
| **JsBarcode** | Client-side | Barcode generation in reports | ~50KB |
| **QRCode** | `qrcode` NPM | QR code generation for VizApp links | ~100KB |

### 6.2 Template/Rendering System

| Aspect | Current | Recommended |
|--------|---------|-------------|
| **Template Engine** | JavaScript string concatenation (template literals) | Handlebars (`.hbs` files) |
| **CSS Strategy** | Inline styles on every element | External CSS file with classes |
| **Color Management** | Placeholder replacement (`{{COLOR_GREEN}}` → `#0F9D58`) | CSS custom properties |
| **Font Loading** | Google Fonts URL in `<link>` tag | Embedded font subsets (base64 or local files) |
| **Layout System** | Manual `display:flex` + `width:%` on every element | CSS Grid with named areas |
| **Image Handling** | S3 URLs and base64 strings mixed | Standardized asset pipeline with pre-fetching |

### 6.3 Backend APIs Used for Report Generation

| API | Purpose | Called By |
|-----|---------|----------|
| `POST /api/v1/report` | Main report generation endpoint | External LIS systems |
| `GET /api/getReportDetails` | Fetch report metadata | `utils.getReportDetails()` |
| `GET /api/getRiskScore` | External risk assessment | `utils.getRiskScore()` |
| `POST /api/getNextStepRecommendations` | AI recommendation engine | `utils.getNextStepRecommendations()` |
| `GET /api/fetchFileFromS3` | Retrieve S3 assets (cover pages, etc.) | `utils.fetchFileFromS3()` |
| `POST /api/uploadExternalReportObject` | Upload report data for VizApp | `utils.uploadExternalReportObject()` |
| `GET /api/getReportConfig` | Fetch client config from MongoDB | Client state initialization |

### 6.4 State Management

| Aspect | Current Implementation | Issues |
|--------|----------------------|--------|
| **Global State Object** | `state.stateVariable` (1,038 lines, 120+ flags) | Mutable, shared across requests |
| **Color State** | `color.js` global objects | Modified at runtime per client |
| **Language State** | `languageSelector` module | Global singleton |
| **Update Method** | `state.updateStateVariable({...})` — Object.assign merge | No immutability, no validation |
| **Per-Request Reset** | Manual reset at start of each request | Race conditions in concurrent requests |

### 6.5 PDF Assembly Pipeline

```
1. Generate Body Summary HTML → Puppeteer → PDF Buffer (bodySummary)
2. Generate Report Summary HTML → Puppeteer → PDF Buffer (summary)
3. For each profile:
   a. Generate profile HTML (via report type view)
   b. Wrap in page template with header/footer
4. Combine all profile HTML → Single HTML document
5. Render combined HTML → Puppeteer → PDF Buffer (digitalPdf + printPdf)
6. Generate Cover Page → Puppeteer/S3 → PDF Buffer (coverPage)
7. Generate Intro Page → Puppeteer → PDF Buffer (if enabled)
8. Generate Recommendations → Puppeteer → PDF Buffer (if enabled)
9. Merge all PDFs → pdf-lib.mergePdf() → Final PDF Buffer
10. Upload to S3 → Return URL/buffer to client
```

### 6.6 Performance Characteristics

| Metric | Current Value | Bottleneck | Optimization |
|--------|---------------|-----------|-------------- |
| **Total report time** | 15-30 seconds | PDF rendering (Puppeteer) | Browser pooling, parallel rendering |
| **HTML generation** | 1-3 seconds | String concatenation | Template pre-compilation |
| **PDF rendering** | 8-20 seconds | Chromium page load + print | Reuse browser instance, minimize CSS |
| **PDF merge** | 1-3 seconds | pdf-lib processing | Stream-based merge |
| **S3 upload** | 1-5 seconds | Network + file size | Compress before upload |
| **Config loading** | 0.5-1 second | MongoDB query per request | Redis cache |
| **Image processing** | 1-3 seconds | Jimp is slow | Switch to Sharp |

---

*This document is part of the Remedies Next-Generation documentation suite. Refer to **Document 1** (System Architecture), **Document 2** (Technical Architecture), and **Document 3** (Backend System Design) for the complete technical reference.*
