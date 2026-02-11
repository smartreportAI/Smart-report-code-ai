# 📘 Document 3: Backend System Design & Data Architecture

## Remedies – Next Generation Platform

**Version:** 2.0 | **Last Updated:** February 11, 2026 | **Status:** Architectural Blueprint

---

## Table of Contents

1. [Database Schema Design](#1-database-schema-design)
2. [Data Relationships & Mapping Strategy](#2-data-relationships--mapping-strategy)
3. [Report Generation Logic](#3-report-generation-logic)
4. [Content Generation Workflows](#4-content-generation-workflows)
5. [Configuration Management System](#5-configuration-management-system)
6. [Version Control Strategy](#6-version-control-strategy)
7. [API Design Standards](#7-api-design-standards)
8. [Deployment Strategy](#8-deployment-strategy)
9. [Maintainability Best Practices](#9-maintainability-best-practices)
10. [Growth & Scaling Recommendations](#10-growth--scaling-recommendations)

---

## 1. Database Schema Design

### 1.1 Database Selection: MongoDB

MongoDB remains the recommended database for the following reasons:
- **Schema flexibility** for evolving biomarker definitions and client configurations
- **Document model** naturally fits the nested report structure
- **Atlas** provides managed hosting with auto-scaling and backups
- **Existing ecosystem** — the `smartreport` package already uses MongoDB

### 1.2 Collection Architecture

```
remedies_v2 (Database)
├── clients              # Client/tenant configurations
├── biomarkers           # Standard biomarker definitions (900+)
├── profiles             # Health profile definitions (40+)
├── report_configs       # Per-client report configuration overrides
├── report_content       # Client-specific test/profile content
├── reports              # Generated report metadata & audit trail
├── billing              # Usage tracking & billing records
├── templates            # Report template definitions & versions
├── assets               # Brand asset metadata (S3 references)
├── mappings             # Parameter & profile mapping tables
└── audit_logs           # System-wide audit trail
```

### 1.3 Collection Schemas

#### `clients` Collection

```javascript
{
  _id: ObjectId,
  clientId: "remedies",                    // Unique identifier (indexed)
  displayName: "Remedies Diagnostics",
  status: "active",                        // active | suspended | trial
  subscription: {
    plan: "enterprise",                    // free | starter | pro | enterprise
    maxReportsPerMonth: 50000,
    features: ["historical", "riskScore", "vizApp", "whatsapp"],
    expiresAt: ISODate("2027-01-01")
  },
  contacts: {
    primary: { name: "Admin", email: "admin@remedies.com", phone: "+91..." },
    technical: { name: "Dev", email: "dev@remedies.com" }
  },
  apiCredentials: {
    apiKeys: [
      {
        key: "hashed_api_key_value",
        label: "Production",
        createdAt: ISODate,
        lastUsedAt: ISODate,
        isActive: true
      }
    ],
    jwtSecret: "encrypted_secret",
    allowedIPs: ["203.0.113.0/24"]
  },
  lis: {
    name: "remedies_lis",
    inputFormat: "standard",               // standard | srl | element_based | wrapped
    fieldMappings: {
      patientName: "PatientName",
      labNumber: "LabNo",
      workOrderId: "WorkOrderID",
      age: "Age",
      gender: "Gender"
    }
  },
  dispatch: {
    type: "return",                        // return | webhook | whatsapp | email
    webhookUrl: "https://api.remedies.com/callback",
    webhookHeaders: { "X-Auth": "encrypted_token" },
    retryPolicy: { maxRetries: 3, backoffMs: 1000 }
  },
  createdAt: ISODate,
  updatedAt: ISODate,
  version: 1                              // Optimistic concurrency control
}
```

#### `biomarkers` Collection

```javascript
// Replaces the 988KB testsDatabase.js file
{
  _id: ObjectId,
  biomarkerId: "NGPM0314",                // Niroggyan standard ID (unique)
  standardName: "Haemoglobin",             // Canonical display name
  category: "haematology",
  
  aliases: [                               // Name mapping for fuzzy matching
    "hemoglobin", "hb", "hgb", "haemoglobin (hb)",
    "hemoglobin (hb)", "hb (hemoglobin)"
  ],
  
  profiles: ["complete_blood_count"],      // Profile membership (array for multi-profile)
  
  unit: {
    primary: "g/dL",
    alternatives: ["g/L", "mmol/L"],
    conversionFactors: { "g/L": 0.1, "mmol/L": 0.06206 }
  },
  
  referenceRanges: [
    {
      gender: "male",
      ageRange: { min: 18, max: 120 },
      normal: { min: 13.5, max: 17.5 },
      borderline: {
        low: { min: 12.0, max: 13.49 },
        high: { min: 17.51, max: 19.0 }
      },
      critical: { low: 7.0, high: 20.0 },
      methodology: "default"
    },
    {
      gender: "female",
      ageRange: { min: 18, max: 120 },
      normal: { min: 12.0, max: 16.0 },
      borderline: {
        low: { min: 10.5, max: 11.99 },
        high: { min: 16.01, max: 17.5 }
      },
      critical: { low: 7.0, high: 20.0 },
      methodology: "default"
    },
    {
      gender: "any",
      ageRange: { min: 0, max: 17 },
      normal: { min: 11.0, max: 15.5 },
      borderline: {
        low: { min: 9.5, max: 10.99 },
        high: { min: 15.51, max: 17.0 }
      },
      critical: { low: 6.0, high: 20.0 },
      methodology: "default"
    }
  ],
  
  content: {
    en: {
      displayName: "Haemoglobin",
      about: "Haemoglobin is the protein in red blood cells that carries oxygen...",
      tips: {
        normal: "Your haemoglobin levels are within the healthy range.",
        low: "Low haemoglobin may indicate anemia. Include iron-rich foods...",
        high: "High haemoglobin may indicate dehydration or other conditions..."
      },
      whatIsIt: "A protein in red blood cells responsible for oxygen transport.",
      whyTest: "To check for anemia, polycythemia, or monitor treatment."
    },
    hi: {
      displayName: "हीमोग्लोबिन",
      about: "हीमोग्लोबिन लाल रक्त कोशिकाओं में एक प्रोटीन है...",
      tips: {
        normal: "आपका हीमोग्लोबिन स्तर सामान्य सीमा में है।",
        low: "कम हीमोग्लोबिन एनीमिया का संकेत हो सकता है...",
        high: "उच्च हीमोग्लोबिन निर्जलीकरण का संकेत हो सकता है..."
      }
    },
    ar: {
      displayName: "الهيموجلوبين",
      about: "...",
      tips: { normal: "...", low: "...", high: "..." }
    }
  },
  
  visualization: {
    sliderType: "continuous",              // continuous | discrete | boolean
    iconKey: "blood_cell",
    grouping: "red_blood_cells",
    groupPosition: 1,
    bodyMapPosition: { organ: "blood", x: 50, y: 60 }
  },
  
  metadata: {
    loincCode: "718-7",
    snomedCode: "104141002",
    icdCodes: ["D64.9"],
    isActive: true,
    lastReviewedAt: ISODate,
    reviewedBy: "Dr. Medical Reviewer"
  },
  
  createdAt: ISODate,
  updatedAt: ISODate,
  version: 3
}
```

#### `profiles` Collection

```javascript
// Replaces profileBaseDynamic.js (266KB)
{
  _id: ObjectId,
  profileId: "complete_blood_count",
  displayName: {
    en: "Complete Blood Count (CBC)",
    hi: "पूर्ण रक्त गणना",
    ar: "تعداد الدم الكامل"
  },
  
  category: "haematology",
  sortOrder: 1,
  
  biomarkers: [                           // Ordered list of biomarker IDs
    "NGPM0314",  // Haemoglobin
    "NGPM0315",  // RBC Count
    "NGPM0316",  // WBC Count
    "NGPM0317",  // Platelet Count
    "NGPM0318",  // MCV
    "NGPM0319",  // MCH
    "NGPM0320"   // MCHC
  ],
  
  content: {
    en: {
      about: "The Complete Blood Count measures the cells in your blood...",
      tips: {
        normal: "All blood cell counts are within healthy ranges.",
        abnormal: "Some blood cell values are outside normal ranges. Consult your doctor."
      },
      description: "A CBC gives important information about the kinds and numbers..."
    },
    hi: { about: "...", tips: { normal: "...", abnormal: "..." } }
  },
  
  bodySummary: {
    organName: "blood",
    svgIconKey: "blood_icon",
    position: { x: 48, y: 55 },
    displayInBodyMap: true
  },
  
  riskScore: {
    enabled: false,
    calculatorType: null
  },
  
  accreditation: {
    nabl: true,
    cap: false
  },
  
  subGroups: [
    {
      name: "Red Blood Cells",
      biomarkers: ["NGPM0314", "NGPM0315", "NGPM0318", "NGPM0319", "NGPM0320"]
    },
    {
      name: "White Blood Cells",
      biomarkers: ["NGPM0316"]
    },
    {
      name: "Platelets",
      biomarkers: ["NGPM0317"]
    }
  ],
  
  isActive: true,
  createdAt: ISODate,
  updatedAt: ISODate,
  version: 2
}
```

#### `report_configs` Collection

```javascript
// Per-client report configuration (replaces if-blocks in niro.js)
{
  _id: ObjectId,
  clientId: "remedies",
  
  stateData: {
    reportType: "compact",
    generateCoverPage: true,
    showBodySummary: true,
    showSummary: true,
    showRiskScore: false,
    showHistorical: true,
    showRecommendations: true,
    showAccreditation: true,
    showProfileAccreditation: true,
    showParameterAccreditation: false,
    showAdditionalBookingsPage: false,
    showQrEnd: false,
    showBackPage: false,
    showIntroPage: false,
    showJsonNames: false,
    generatePrintPdf: true,
    generateVizApp: true,
    enableMappingConfig: true,
    enableProfileOrder: false,
    enableParameterOrder: false,
    pullReportConfig: true,
    pullClientData: false,
    useLisMapping: false,
    useBackgroundImage: true,
    curLang: "en",
    fallbackLang: "en",
    summaryType: 2,
    historicalType: 1,
    base64Prefix: "",
    headerPrefix: ""
  },
  
  colorObj: {
    colored: {
      normal: "#0F9D58",
      finalCritical: "#DB4437",
      oneFromNormal: "#F4B400",
      twoFromNormal: "#C47D63",
      threeFromNormal: "#C26564"
    },
    greyscaled: {
      normal: "#D2D2D2",
      finalCritical: "#111111",
      oneFromNormal: "#969696",
      twoFromNormal: "#7B7B7B",
      threeFromNormal: "#444444"
    },
    reportColors: {
      patientHeader: { heading: "#757575", value: "#1a1819" },
      profile: { heading: "#6a6764", background: "#F0F6FB" }
    }
  },
  
  patientDetailsData: {
    fieldOrder: ["PatientName", "Age", "Gender", "LabNo", "SampleDate"],
    customLabels: {},
    dateFormat: "DD-MM-YYYY"
  },
  
  coverPage: {
    type: "dynamic",
    imageUrl: "s3://niroggyan-assets/remedies/cover.png",
    patientInfoPosition: { x: 50, y: 400 }
  },
  
  backPage: {
    enabled: false,
    pdfUrl: null
  },
  
  headerFooter: {
    headerUrl: "s3://niroggyan-assets/remedies/header.png",
    footerUrl: "s3://niroggyan-assets/remedies/footer.png",
    headerHeight: "80px",
    footerHeight: "60px"
  },
  
  fonts: {
    primaryUrl: "https://fonts.googleapis.com/css2?family=Nunito+Sans",
    primaryFamily: "'Nunito Sans', sans-serif",
    fontSize: "10px"
  },
  
  doctorSignatures: [
    {
      doctorId: "DR001",
      name: "Dr. Smith",
      designation: "MD Pathology",
      registration: "MCI-12345",
      signatureUrl: "s3://niroggyan-assets/remedies/dr-smith-sign.png",
      assignedProfiles: ["complete_blood_count", "liver_function"]
    }
  ],
  
  createdAt: ISODate,
  updatedAt: ISODate,
  version: 5
}
```

#### `reports` Collection (Audit Trail)

```javascript
{
  _id: ObjectId,
  reportId: "RPT-2026-ABC123",
  clientId: "remedies",
  labNo: "LAB-2026-001234",
  workOrderId: "WO-5678",
  
  patient: {
    nameHash: "sha256:...",              // Hashed for privacy
    age: 45,
    gender: "male"
  },
  
  input: {
    testCount: 28,
    profileCount: 5,
    abnormalCount: 3,
    jsonUrl: "s3://inputjson/remedies/LAB-2026-001234.json"
  },
  
  output: {
    reportType: "compact",
    language: "en",
    pageCount: 6,
    digitalPdfUrl: "s3://niroggyansmartreports/remedies/LAB-2026-001234.pdf",
    printPdfUrl: "s3://niroggyansmartreports/remedies/LAB-2026-001234_print.pdf",
    vizAppUrl: "https://vizapp.niroggyan.com/?id=...",
    fileSizeBytes: 2456789
  },
  
  performance: {
    totalDurationMs: 4523,
    steps: {
      configFetch: 45,
      inputParse: 12,
      mapping: 89,
      htmlRender: 1200,
      pdfGenerate: 2800,
      s3Upload: 350
    }
  },
  
  dispatch: {
    type: "webhook",
    status: "delivered",
    attempts: 1,
    deliveredAt: ISODate
  },
  
  createdAt: ISODate,
  expiresAt: ISODate("2026-08-11")       // TTL index for auto-cleanup
}
```

#### `mappings` Collection

```javascript
{
  _id: ObjectId,
  clientId: "remedies",
  type: "parameter",                     // parameter | profile
  
  // Parameter ID mapping: client ID → Niroggyan standard ID
  idMapping: {
    "HB001": "NGPM0314",
    "TSH_001": "NGPM0045",
    "CHOL_T": "NGPM0120"
  },
  
  // Name mapping: client test name → Niroggyan standard name
  nameMapping: {
    "S. Creatinine": "Serum Creatinine",
    "Hb (HAEMOGLOBIN)": "Haemoglobin",
    "SGPT/ALT": "SGPT (ALT)"
  },
  
  // Profile mapping: override which biomarkers belong to which profiles
  profileMapping: {
    "NGPM0314": "complete_blood_count",
    "NGPM0045": "thyroid_function"
  },
  
  // Parameter ordering within report
  parameterOrder: ["NGPM0314", "NGPM0315", "NGPM0316"],
  profileOrder: ["complete_blood_count", "liver_function", "lipid_profile"],
  
  updatedAt: ISODate,
  updatedBy: "admin@niroggyan.com",
  version: 3
}
```

#### `billing` Collection

```javascript
{
  _id: ObjectId,
  clientId: "remedies",
  month: "2026-02",
  
  usage: {
    totalReports: 4523,
    successfulReports: 4489,
    failedReports: 34,
    avgDurationMs: 5200,
    totalPdfSizeMB: 8945
  },
  
  breakdown: {
    byReportType: {
      compact: 3200,
      advanced: 1100,
      hybrid: 189,
      summary: 34
    },
    byDay: [
      { date: "2026-02-01", count: 145 },
      { date: "2026-02-02", count: 167 }
    ]
  },
  
  billing: {
    plan: "enterprise",
    includedReports: 50000,
    overage: 0,
    amount: 0,
    currency: "INR"
  },
  
  createdAt: ISODate,
  updatedAt: ISODate
}
```

---

## 2. Data Relationships & Mapping Strategy

### 2.1 Entity Relationship Diagram

```
┌──────────┐     1:N     ┌──────────────┐     N:M     ┌────────────┐
│  Client  │────────────→│ ReportConfig │            │  Biomarker │
│          │             │              │            │            │
│ clientId │             │ clientId     │     ┌─────→│ biomarkerId│
└──────────┘             │ stateData    │     │      │ aliases    │
     │                   │ colorObj     │     │      │ ranges     │
     │ 1:N               └──────────────┘     │      │ content    │
     │                                        │      └────────────┘
     ▼                                        │           │
┌──────────┐     1:1     ┌──────────────┐     │      N:M  │
│ Mapping  │────────────→│   Profile    │─────┘           │
│          │             │              │←─────────────────┘
│ clientId │             │ profileId    │  (biomarkers array)
│ idMap    │             │ biomarkers[] │
│ nameMap  │             │ content      │
└──────────┘             └──────────────┘
     │                        │
     │                        │ 1:N
     │                        ▼
     │                   ┌──────────────┐
     │                   │  SubGroup    │
     │                   │              │
     │                   │ name         │
     │                   │ biomarkers[] │
     │                   └──────────────┘
     │
     │ 1:N
     ▼
┌──────────┐
│  Report  │
│          │
│ reportId │
│ clientId │
│ labNo    │
│ patient  │
│ output   │
└──────────┘
```

### 2.2 Mapping Resolution Chain

When a test result comes in, the system resolves its identity through this chain:

```
Input: { id: "HB001", name: "Hb (HAEMOGLOBIN)", value: "14.5" }

Step 1: ID Mapping (fastest, most reliable)
  mappings.idMapping["HB001"] → "NGPM0314"
  ✅ Found! Skip to Step 4

Step 2: Name Mapping (if ID not found)
  mappings.nameMapping["Hb (HAEMOGLOBIN)"] → "Haemoglobin"
  ✅ Found! Look up biomarker by standardName

Step 3: Fuzzy Alias Match (if name mapping fails)
  biomarkers.aliases.includes("hb (haemoglobin)") → true
  Match: biomarkerId = "NGPM0314"

Step 4: Load Biomarker Definition
  biomarkers.findOne({ biomarkerId: "NGPM0314" })
  → Full biomarker with ranges, content, profiles

Step 5: Resolve Reference Range
  Filter by patient gender + age → applicable range
  Compare value to range → color indicator
```

---

## 3. Report Generation Logic

### 3.1 Color Classification Algorithm

```typescript
function classifyResult(
  value: number,
  range: ReferenceRange
): ColorIndicator {
  const { normal, borderline, critical } = range;
  
  // Critical (outside all defined ranges)
  if (value < critical.low || value > critical.high) {
    return 'critical';        // Dark red — threeFromNormal
  }
  
  // Normal
  if (value >= normal.min && value <= normal.max) {
    return 'normal';          // Green
  }
  
  // Borderline Low
  if (borderline?.low && value >= borderline.low.min && value <= borderline.low.max) {
    return 'borderline';      // Yellow — oneFromNormal
  }
  
  // Borderline High
  if (borderline?.high && value >= borderline.high.min && value <= borderline.high.max) {
    return 'borderline';      // Yellow — oneFromNormal
  }
  
  // Abnormal (outside normal but within critical, not in borderline zone)
  if (value < normal.min) {
    return 'low';             // Red — finalCritical
  }
  
  return 'high';              // Red — finalCritical
}
```

### 3.2 Slider Position Calculation

```typescript
function calculateSliderPosition(
  value: number,
  range: ReferenceRange
): number {
  const { normal, critical } = range;
  const totalRange = critical.high - critical.low;
  const normalMidpoint = (normal.min + normal.max) / 2;
  
  // Normalize to 0-100 scale where 50 = center of normal range
  const position = ((value - critical.low) / totalRange) * 100;
  
  // Clamp between 5 and 95 for visual presentation
  return Math.max(5, Math.min(95, position));
}
```

### 3.3 Profile Overall Status

```typescript
function determineProfileStatus(
  testResults: TestResult[]
): ColorIndicator {
  const priorities: Record<ColorIndicator, number> = {
    critical: 0,
    high: 1,
    low: 2,
    borderline: 3,
    normal: 4
  };
  
  // Profile status = worst (most severe) test result
  return testResults.reduce((worst, test) => {
    return priorities[test.colorIndicator] < priorities[worst]
      ? test.colorIndicator
      : worst;
  }, 'normal' as ColorIndicator);
}
```

---

## 4. Content Generation Workflows

### 4.1 Multilingual Content Resolution

```typescript
function resolveContent(
  biomarker: Biomarker,
  language: Language,
  fallbackLanguage: Language = 'en'
): BiomarkerContent {
  // Try requested language first
  if (biomarker.content[language]) {
    return biomarker.content[language];
  }
  // Fall back to default language
  if (biomarker.content[fallbackLanguage]) {
    return biomarker.content[fallbackLanguage];
  }
  // Ultimate fallback: auto-generated minimal content
  return {
    displayName: biomarker.standardName,
    about: '',
    tips: { normal: '', low: '', high: '' }
  };
}
```

### 4.2 Recommendation Generation

```
For each abnormal profile:
  1. Load profile-level recommendations from content DB
  2. For each abnormal biomarker in profile:
     a. Load biomarker-specific tip based on direction (high/low)
     b. Load related lifestyle recommendations
  3. Deduplicate recommendations across profiles
  4. Sort by severity (critical first)
  5. Render recommendation cards with icons
```

---

## 5. Configuration Management System

### 5.1 Configuration Hierarchy

```
Level 0: System Defaults (hardcoded in defaults.ts)
    ↓ overridden by
Level 1: Client Base Config (clients collection)
    ↓ overridden by
Level 2: Report Config (report_configs collection)
    ↓ overridden by
Level 3: LIS Config (if useLisMapping = true)
    ↓ overridden by
Level 4: Per-Request Overrides (input JSON fields)

Final merged config = deepMerge(L0, L1, L2, L3, L4)
```

### 5.2 Feature Flags

All features are controlled by boolean flags in the configuration:

| Flag | Default | Description |
|------|---------|-------------|
| `generateCoverPage` | true | Generate branded cover page |
| `showBodySummary` | true | Show body summary diagram |
| `showSummary` | true | Show report summary page |
| `showRiskScore` | false | Calculate and show risk scores |
| `showHistorical` | false | Show historical trend charts |
| `showRecommendations` | true | Show recommendations page |
| `generatePrintPdf` | true | Generate grayscale print variant |
| `generateVizApp` | false | Generate VizApp interactive data |
| `showAccreditation` | true | Show NABL/CAP accreditation marks |
| `enableMappingConfig` | true | Use DB-driven parameter mappings |
| `useBackgroundImage` | true | Use background watermark image |
| `showJsonNames` | false | Show client's original test names |

---

## 6. Version Control Strategy

### 6.1 Template Versioning

```javascript
// templates collection
{
  templateId: "compact_v3",
  type: "compact",
  version: 3,
  status: "active",                    // draft | active | deprecated
  
  layout: { /* Handlebars template content */ },
  styles: { /* Associated CSS */ },
  
  changelog: [
    { version: 3, date: ISODate, author: "dev@niro.com", changes: "Added RTL support" },
    { version: 2, date: ISODate, author: "dev@niro.com", changes: "New slider design" },
    { version: 1, date: ISODate, author: "dev@niro.com", changes: "Initial release" }
  ],
  
  rollbackVersion: 2,                  // Version to rollback to if issues
  clientOverrides: {
    "remedies": { /* client-specific template patches */ }
  }
}
```

### 6.2 Configuration Versioning

Every configuration document uses optimistic concurrency control:

```typescript
async function updateConfig(
  clientId: string,
  updates: Partial<ReportConfig>,
  expectedVersion: number
): Promise<ReportConfig> {
  const result = await ReportConfig.findOneAndUpdate(
    { clientId, version: expectedVersion },
    { $set: updates, $inc: { version: 1 }, $set: { updatedAt: new Date() } },
    { new: true }
  );
  
  if (!result) {
    throw new ConflictError('Configuration was modified by another process');
  }
  
  // Invalidate Redis cache
  await redis.del(`config:${clientId}`);
  
  return result;
}
```

---

## 7. API Design Standards

### 7.1 RESTful Endpoint Structure

```
Base URL: https://api.niroggyan.com/v2

# Report Generation
POST   /v2/reports                    # Generate a new report
GET    /v2/reports/:reportId          # Get report metadata
GET    /v2/reports/:reportId/pdf      # Download report PDF
GET    /v2/reports/:reportId/status   # Check generation status

# Client Management
GET    /v2/clients/:clientId          # Get client details
PUT    /v2/clients/:clientId          # Update client config
GET    /v2/clients/:clientId/usage    # Get usage statistics

# Configuration
GET    /v2/configs/:clientId          # Get report configuration
PUT    /v2/configs/:clientId          # Update report configuration
POST   /v2/configs/:clientId/preview  # Preview report with config

# Biomarkers
GET    /v2/biomarkers                 # List all biomarkers
GET    /v2/biomarkers/:id             # Get biomarker details
PUT    /v2/biomarkers/:id             # Update biomarker

# Mappings
GET    /v2/mappings/:clientId         # Get client mappings
PUT    /v2/mappings/:clientId         # Update client mappings

# Health
GET    /v2/health                     # Service health check
GET    /v2/health/ready               # Readiness probe
```

### 7.2 Request/Response Standards

```typescript
// Standard Success Response
{
  "status": "success",
  "data": { /* response payload */ },
  "meta": {
    "requestId": "req-uuid-here",
    "timestamp": "2026-02-11T09:30:00Z",
    "duration": 4523
  }
}

// Standard Error Response
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      { "field": "tests[0].value", "message": "Value is required" }
    ]
  },
  "meta": {
    "requestId": "req-uuid-here",
    "timestamp": "2026-02-11T09:30:00Z"
  }
}
```

### 7.3 Authentication

```
# API Key Authentication (M2M)
Headers:
  X-API-Key: <client_api_key>

# JWT Authentication (Portal)
Headers:
  Authorization: Bearer <jwt_token>
```

### 7.4 Rate Limiting

| Plan | Rate Limit | Burst |
|------|-----------|-------|
| Free | 10 req/min | 5 |
| Starter | 60 req/min | 20 |
| Pro | 300 req/min | 50 |
| Enterprise | 1000 req/min | 200 |

```
Response Headers:
  X-RateLimit-Limit: 300
  X-RateLimit-Remaining: 287
  X-RateLimit-Reset: 1707648600
```

### 7.5 API Versioning Strategy

- **URL-based versioning**: `/v1/`, `/v2/`, etc.
- **Deprecation policy**: Old versions supported for 12 months after new version release
- **Sunset header**: `Sunset: Sat, 01 Feb 2027 00:00:00 GMT`
- **Migration guides**: Published with each version change

---

## 8. Deployment Strategy

### 8.1 Environment Architecture

| Environment | Purpose | Deployment | Data |
|-------------|---------|-----------|------|
| **local** | Development | Docker Compose | Seeded test data |
| **dev** | Feature testing | Auto-deploy on branch push | Sanitized prod copy |
| **staging** | Pre-prod validation | Auto-deploy on merge to main | Prod mirror |
| **production** | Live traffic | Manual approval required | Production data |

### 8.2 Deployment Process

```
Developer pushes code
        │
        ▼
┌─────────────────┐
│   GitLab CI     │
│   Triggered     │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Validate │  Lint + Type Check + Schema Validation
    └────┬────┘
         │
    ┌────┴────┐
    │  Test   │  Unit + Integration + E2E (with coverage)
    └────┬────┘
         │
    ┌────┴────┐
    │  Build  │  TypeScript compile → esbuild bundle
    └────┬────┘
         │
    ┌────┴────┐
    │Security │  npm audit + SAST scan
    └────┬────┘
         │
    ┌────┴────┐
    │ Stage   │  Deploy to staging → run smoke tests
    └────┬────┘
         │
    ┌────┴────┐
    │Approval │  Manual gate — review staging report samples
    └────┬────┘
         │
    ┌────┴────┐
    │  Prod   │  CDK deploy → Lambda update → health check
    └────┬────┘
         │
    ┌────┴────┐
    │ Verify  │  Automated end-to-end production smoke test
    └─────────┘
```

### 8.3 Rollback Strategy

- **Lambda aliasing**: Production traffic pointed to `live` alias
- **Instant rollback**: Repoint alias to previous version (< 1 second)
- **Canary deployment**: Route 5% traffic to new version, monitor for 30 min
- **Automated rollback**: If error rate > 2%, auto-revert to previous version

---

## 9. Maintainability Best Practices

### 9.1 Code Longevity Principles

| Principle | Practice |
|-----------|----------|
| **Avoid premature optimization** | Profile before optimizing; prefer readable code |
| **Favor composition over inheritance** | Use interfaces and dependency injection |
| **Keep functions small** | Max 50 lines per function; single responsibility |
| **Write tests** first | 80%+ coverage minimum; test behavior, not implementation |
| **Document** why, not what | Code shows what; comments explain why |
| **Automate everything** | Linting, formatting, testing, deployment — no manual steps |
| **Use semantic versioning** | Breaking changes get major bumps with migration guides |
| **Dependency hygiene** | Audit monthly; update quarterly; minimize total deps |

### 9.2 Technical Debt Management

- **Debt register**: Track technical debt items in GitLab issues with `tech-debt` label
- **Debt budget**: 20% of each sprint allocated to debt reduction
- **Health metrics**: Track cyclomatic complexity, dependency count, test coverage
- **Architecture Decision Records** (ADRs): Document every significant tech decision

---

## 10. Growth & Scaling Recommendations

### 10.1 Short-Term (0-6 months)

| Action | Impact | Effort |
|--------|--------|--------|
| Move biomarker data to MongoDB | Eliminates 1MB JS file, enables dynamic updates | Medium |
| Implement Redis caching | 10x faster config lookups | Low |
| Extract client configs from niro.js | Enables self-service onboarding | High |
| Add TypeScript | Catches 60%+ of runtime errors at compile time | Medium |
| Implement structured logging | Enables debugging and monitoring | Low |

### 10.2 Medium-Term (6-18 months)

| Action | Impact | Effort |
|--------|--------|--------|
| Build self-service onboarding portal | Reduces onboarding from weeks to days | High |
| Implement template engine | Enables visual report design without code | High |
| Add AI-powered insights | Premium feature, competitive differentiator | Medium |
| Multi-region deployment | Better latency for international clients | Medium |
| Implement batch processing | Handle bulk report generation efficiently | Medium |

### 10.3 Long-Term (18+ months)

| Action | Impact | Effort |
|--------|--------|--------|
| Build marketplace for report templates | Revenue from template ecosystem | High |
| Implement ML-based anomaly detection | Proactive health alerting | High |
| Add genomics/proteomics support | Expand beyond traditional lab reports | Very High |
| White-label SDK for client integration | Easier client adoption | Medium |
| Real-time collaborative report editing | Doctor annotations and notes | High |

### 10.4 Scaling Milestones

```
Current:  50 clients, ~5K reports/day
     ↓
Phase 1:  100 clients, ~20K reports/day    (Redis cache + optimized Lambda)
     ↓
Phase 2:  250 clients, ~100K reports/day   (Multi-Lambda + SQS workers)
     ↓
Phase 3:  500 clients, ~500K reports/day   (ECS Fargate + auto-scaling)
     ↓
Phase 4: 1000+ clients, 1M+ reports/day   (Multi-region + CDN + sharded DB)
```

---

*This document completes the three-part technical documentation suite. Together with **Document 1 (System Architecture & Product Overview)** and **Document 2 (Technical Architecture & Codebase Design)**, it provides a comprehensive blueprint for the Remedies Next-Generation platform.*
