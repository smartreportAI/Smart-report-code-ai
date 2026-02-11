# 📘 Document 1: System Architecture & Product Overview

## Remedies – Next Generation Smart Lab Report Platform

**Version:** 2.0 (Next-Gen Redesign)  
**Last Updated:** February 11, 2026  
**Status:** Architectural Blueprint  
**Classification:** Internal – Technical Reference  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Purpose & Vision](#2-platform-purpose--vision)
3. [Business Goals & Product Vision](#3-business-goals--product-vision)
4. [Core Features & Modules](#4-core-features--modules)
5. [High-Level System Architecture](#5-high-level-system-architecture)
6. [End-to-End Workflow](#6-end-to-end-workflow)
7. [Data Flow Architecture](#7-data-flow-architecture)
8. [Third-Party Services & Integrations](#8-third-party-services--integrations)
9. [Current System Analysis & Pain Points](#9-current-system-analysis--pain-points)
10. [Proposed Architectural Improvements](#10-proposed-architectural-improvements)
11. [Multi-Client Architecture](#11-multi-client-architecture)
12. [Report Types & Generation Modes](#12-report-types--generation-modes)
13. [Security & Compliance Overview](#13-security--compliance-overview)
14. [Glossary](#14-glossary)

---

## 1. Executive Summary

The **Remedies** platform (internally codename **"Niro"**) is an intelligent, automated smart lab report generation system built by **Niroggyan**. The platform transforms raw clinical laboratory data (blood tests, urine analysis, thyroid panels, lipid profiles, etc.) into visually rich, patient-friendly, multi-language PDF reports with actionable health insights, trend analysis, and personalized recommendations.

### What Makes It "Smart"

Unlike traditional lab reports that present raw numbers in tabular format, Remedies:

- **Contextualizes** lab values with color-coded indicators (Normal, Borderline, High/Low, Critical)
- **Visualizes** results through dynamic charts, sliders, body-summary diagrams, and risk scores
- **Explains** biomarker meanings in patient-friendly language (supports English, Hindi, Arabic, Czech)
- **Recommends** next-step actions based on abnormal findings
- **Tracks** historical trends when past data is available
- **Generates** both digital (colored) and print-ready (grayscale) PDF variants
- **Delivers** reports via multiple dispatch channels (API return, S3 upload, WhatsApp, webhooks)

### Scale of Operations

| Metric | Current State |
|--------|--------------|
| **Supported Clients** | 50+ diagnostic lab chains (1mg, SRL, Max, Medibuddy, Thyrocare, Redcliffe, etc.) |
| **Biomarkers Supported** | 900+ unique clinical parameters |
| **Health Profiles** | 40+ organ-system profiles (Liver, Kidney, Thyroid, Lipid, CBC, etc.) |
| **Report Types** | 5 (Compact, Advanced, Hybrid, Summary, Dynamic) |
| **Languages** | 4 (English, Hindi, Arabic, Czech) |
| **Deployment** | AWS Lambda (serverless), CI/CD via GitLab |

---

## 2. Platform Purpose & Vision

### 2.1 Purpose

The Remedies platform exists to solve a critical gap in the healthcare diagnostics industry: **making lab reports understandable and actionable for patients**.

Traditional lab reports are designed for doctors — dense tables of numbers, acronyms, and reference ranges that are meaningless to the average patient. Remedies transforms these clinical outputs into **smart health reports** that:

1. **Empower patients** to understand their own health status at a glance
2. **Assist clinicians** with visually organized, color-coded data presentations
3. **Enable diagnostic labs** to differentiate their services and add value beyond raw testing
4. **Support preventive healthcare** through trend tracking and proactive recommendations

### 2.2 The "20-Year" Vision

The next-generation Remedies platform is being architected with a **20+ year horizon**. This means:

- **Technology Choices** must favor stability and ecosystem longevity over hype
- **Architecture** must support modular evolution without full rewrites
- **Data Models** must accommodate biomarkers, profiles, and report types not yet invented
- **Client Onboarding** must become self-service rather than requiring code changes
- **AI/ML Integration** must be a first-class concern for future intelligent insights
- **Multi-tenancy** must be native, not bolted on

### 2.3 Problem Statement (Current State)

The existing Remedies codebase has organically grown to serve 50+ clients. Each client deployment is a **near-copy of the entire codebase** with client-specific modifications scattered across:

- `niro.js` (2,679 lines of deeply nested conditional logic per client)
- `client/state.js` (1,038 lines of 120+ configuration flags)
- `Test/testsDatabase.js` (988,408 bytes — the largest file in the project)
- Client-specific `if` blocks throughout the pipeline

This architecture has reached its scalability ceiling. The next-generation redesign must address these structural limitations fundamentally.

---

## 3. Business Goals & Product Vision

### 3.1 Business Goals

| Goal | Description | Priority |
|------|-------------|----------|
| **Scale Client Base** | Support 500+ diagnostic labs without proportional engineering effort | 🔴 Critical |
| **Reduce Onboarding Time** | New client from 2-4 weeks → 2-3 days (self-service configuration) | 🔴 Critical |
| **Improve Report Quality** | Richer visualizations, AI-powered insights, personalized recommendations | 🟡 High |
| **Multi-Language Expansion** | Add 10+ languages (Tamil, Telugu, Bengali, Kannada, Marathi, etc.) | 🟡 High |
| **VizApp Integration** | Seamless digital interactive reports alongside PDF generation | 🟡 High |
| **Compliance & Audit** | Full audit trail, HIPAA awareness, data retention policies | 🟡 High |
| **Revenue Diversification** | SaaS tiers, per-report billing, add-on features (risk scores, AI insights) | 🟢 Medium |
| **Performance at Scale** | Sub-10 second report generation, handle 1000+ concurrent requests | 🟢 Medium |

### 3.2 Product Vision Statement

> *"To become the global standard for intelligent health report generation — making every lab report a personalized health conversation that empowers patients, supports clinicians, and grows with the diagnostic industry."*

### 3.3 Key Differentiators

1. **Domain-Specific Intelligence**: Built-in medical knowledge base of 900+ biomarkers with gender/age-stratified reference ranges, borderline definitions, and clinical context
2. **White-Label Flexibility**: Every visual element — colors, logos, fonts, headers, footers, cover pages — is customizable per client without code changes
3. **Multi-Modal Output**: Same data produces PDF reports, interactive web apps (VizApp), and structured JSON for downstream systems
4. **Language Agility**: Full RTL (Arabic) and Indic script support baked into the rendering engine
5. **Historical Trend Analysis**: When past data is available, reports show longitudinal trends for each biomarker

---

## 4. Core Features & Modules

### 4.1 Current Feature Matrix

#### Report Generation Engine
| Feature | Description | Status |
|---------|-------------|--------|
| **Multi-Format Reports** | Compact, Advanced, Hybrid, Summary, Dynamic report styles | ✅ Active |
| **Dual PDF Generation** | Digital (colored) + Print-ready (grayscale) PDFs | ✅ Active |
| **Cover Page Generator** | Dynamic or static cover pages with patient info | ✅ Active |
| **Body Summary Diagram** | Organ-system health overview with body illustration | ✅ Active |
| **Risk Score Calculator** | Heart disease, diabetes, thyroid risk scoring | ✅ Active |
| **Historical Trends** | Past observation comparison charts | ✅ Active |
| **Recommendations Engine** | Next-step recommendations based on abnormal findings | ✅ Active |
| **Multi-Language Support** | English, Hindi, Arabic, Czech | ✅ Active |
| **QR Code Integration** | VizApp links embedded as QR codes in reports | ✅ Active |

#### Client Management
| Feature | Description | Status |
|---------|-------------|--------|
| **Client Configuration** | Per-client state variables, colors, fonts, headers/footers | ✅ Active |
| **Parameter Mapping** | Client-specific parameter ID → Niroggyan standard name mapping | ✅ Active |
| **Profile Mapping** | Client-specific profile grouping overrides | ✅ Active |
| **Custom Cover Pages** | S3-hosted brand-specific cover page images | ✅ Active |
| **Doctor Signatures** | Dynamic doctor signature rendering per profile | ✅ Active |

#### Data Processing
| Feature | Description | Status |
|---------|-------------|--------|
| **JSON Ingestion** | Flexible multi-format JSON input parsing | ✅ Active |
| **Biomarker Standardization** | Fuzzy-match input names to 900+ standard biomarker database | ✅ Active |
| **Reference Range Resolution** | Gender/age-stratified range selection with borderline calculations | ✅ Active |
| **Unmapped Test Handling** | Fallback rendering for unrecognized parameters | ✅ Active |
| **VizApp JSON Processor** | Transform report data for interactive web application | ✅ Active |

#### Delivery
| Feature | Description | Status |
|---------|-------------|--------|
| **API Response** | Base64-encoded PDF in HTTP response body | ✅ Active |
| **S3 Upload** | PDF and input JSON uploaded to AWS S3 buckets | ✅ Active |
| **Webhook Dispatch** | POST PDF to client-configured callback URL | ✅ Active |
| **WhatsApp Dispatch** | Automated report delivery via WhatsApp Business API | ✅ Active |
| **SQS Message Queue** | Asynchronous processing via AWS SQS | ✅ Active |

### 4.2 Proposed New Features (Next-Gen)

| Feature | Description | Priority |
|---------|-------------|----------|
| **AI-Powered Insights** | GPT-based personalized health summaries and recommendations | 🔴 Critical |
| **Self-Service Onboarding Portal** | Web UI for clients to configure their reports without engineering | 🔴 Critical |
| **Template Editor** | Visual drag-and-drop report template designer | 🟡 High |
| **Real-Time Preview** | Live report preview while editing configuration | 🟡 High |
| **Analytics Dashboard** | Report generation metrics, error rates, client usage statistics | 🟡 High |
| **Batch Processing** | Process 1000+ reports in parallel with progress tracking | 🟡 High |
| **PDF/A Compliance** | Long-term archival format for regulatory requirements | 🟢 Medium |
| **Mobile-Optimized Reports** | Responsive HTML reports for mobile viewing | 🟢 Medium |
| **Audit Trail** | Complete logging of who generated what, when, with what data | 🟢 Medium |
| **A/B Testing** | Test different report layouts and measure patient engagement | 🟢 Medium |

---

## 5. High-Level System Architecture

### 5.1 Current Architecture (As-Is)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT SYSTEMS (50+ Labs)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │   1mg    │  │   SRL    │  │   Max    │  │Medibuddy │  ...           │
│  │   LIS    │  │   LIS    │  │   LIS    │  │   LIS    │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       │              │              │              │                    │
│       └──────────────┴──────────────┴──────────────┘                    │
│                              │                                          │
│                     JSON Input (HTTP POST)                               │
│                              │                                          │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        AWS API GATEWAY                                   │
│                    (REST API Endpoints)                                   │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        AWS LAMBDA FUNCTION                                │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         index.js (Handler)                          │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐   │ │
│  │  │  Input Parsing   │  │  Authentication  │  │  User Validation │   │ │
│  │  │  & Validation    │  │  (JWT/API Key)   │  │  & Billing Check │   │ │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘   │ │
│  │           │                     │                      │            │ │
│  │           └─────────────────────┴──────────────────────┘            │ │
│  │                                 │                                    │ │
│  │                                 ▼                                    │ │
│  │  ┌──────────────────────────────────────────────────────────────┐   │ │
│  │  │                      niro.js (Core Engine)                    │   │ │
│  │  │                                                              │   │ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │ │
│  │  │  │  State    │  │  Config  │  │ Parameter│  │  Report  │   │   │ │
│  │  │  │ Manager   │  │ Fetcher  │  │ Mapping  │  │ Builder  │   │   │ │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │ │
│  │  │                                                              │   │ │
│  │  │  ┌──────────────────────────────────────────────────────┐   │   │ │
│  │  │  │              Report Generation Pipeline               │   │   │ │
│  │  │  │                                                      │   │   │ │
│  │  │  │  Destructure → Map → Model → View → HTML → PDF      │   │   │ │
│  │  │  │                                                      │   │   │ │
│  │  │  └──────────────────────────────────────────────────────┘   │   │ │
│  │  └──────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────────────┐
              │                │                        │
              ▼                ▼                        ▼
     ┌────────────┐   ┌────────────┐            ┌────────────┐
     │   AWS S3   │   │  MongoDB   │            │  Client    │
     │  (PDFs &   │   │ (Config &  │            │  Webhook   │
     │   JSONs)   │   │  Billing)  │            │  Endpoint  │
     └────────────┘   └────────────┘            └────────────┘
```

### 5.2 Proposed Architecture (To-Be)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT SYSTEMS                                  │
│                     (REST API / Webhooks / SDK)                           │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ Rate Limiter │  │ Auth (JWT +  │  │ Request      │                  │
│  │ & Throttler  │  │  API Keys)   │  │ Validator    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATION LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │               Report Orchestrator Service                        │   │
│  │  • Request queuing & prioritization                              │   │
│  │  • Idempotency management                                       │   │
│  │  • Progress tracking & callbacks                                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│ CONFIG SERVICE   │ │ DATA SERVICE │ │ CONTENT SERVICE  │
│ • Client config  │ │ • Input parse│ │ • Test database  │
│ • State mgmt     │ │ • Mapping    │ │ • Profiles       │
│ • Theme/colors   │ │ • Validation │ │ • Recommendations│
│ • Feature flags  │ │ • Enrichment │ │ • Translations   │
└────────┬─────────┘ └──────┬──────┘ └────────┬─────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     REPORT ENGINE (Core)                                 │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Template │  │ Component │  │ PDF      │  │ Chart    │              │
│  │ Engine   │  │ Renderer  │  │ Generator│  │ Engine   │              │
│  └──────────┘  └───────────┘  └──────────┘  └──────────┘              │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Risk     │  │ Body      │  │ Cover    │  │ VizApp   │              │
│  │ Scorer   │  │ Summary   │  │ Page Gen │  │ Processor│              │
│  └──────────┘  └───────────┘  └──────────┘  └──────────┘              │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     DELIVERY LAYER                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ S3       │  │ Webhook  │  │ WhatsApp │  │ Email    │               │
│  │ Uploader │  │ Dispatch │  │ Dispatch │  │ Dispatch │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   MongoDB    │  │   Redis      │  │   AWS S3     │                  │
│  │  (Primary    │  │  (Cache &    │  │  (Assets &   │                  │
│  │   Database)  │  │   Sessions)  │  │   Reports)   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 6. End-to-End Workflow

### 6.1 Complete Report Generation Pipeline

The following describes the full lifecycle of a single report generation request, from input to delivery.

#### Phase 1: Request Ingestion

```
┌─────────────────────────────────────────────────────┐
│                 REQUEST INGESTION                    │
│                                                     │
│  1. Client LIS sends HTTP POST with JSON body       │
│  2. API Gateway routes to Lambda function           │
│  3. index.js handler receives event                 │
│  4. Input JSON is parsed (with fallback hacks       │
│     for malformed JSON: newline/carriage returns)    │
│  5. Array input unwrapped (fullInput[0])            │
│  6. Nested data property unwrapped (data[0])        │
│                                                     │
│  Input JSON Structure:                              │
│  {                                                  │
│    "org": "remedies",                               │
│    "Centre": "CLINIC_001",                          │
│    "LabNo": "LAB-2026-001234",                      │
│    "WorkOrderID": "WO-5678",                        │
│    "PatientName": "John Doe",                       │
│    "Age": "45",                                     │
│    "Gender": "Male",                                │
│    "results": [ { "Package_name": "Full Body" } ],  │
│    "tests": [ ... array of test objects ... ]        │
│  }                                                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
```

#### Phase 2: Authentication & Validation

```
┌─────────────────────────────────────────────────────┐
│            AUTHENTICATION & VALIDATION               │
│                                                     │
│  1. Extract user identifier (org or Centre)         │
│  2. Call validateUser() — checks subscription       │
│     status in MongoDB via smartreport package        │
│  3. If not found → log warning, continue            │
│  4. If not authorized (generate=false) → return     │
│     200 with success=false and message              │
│  5. Attach clientData to fullInput for downstream   │
│  6. (Optional) Lab regeneration limit check         │
│     — max 3 generations per labNo                   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
```

#### Phase 3: State Initialization

```
┌─────────────────────────────────────────────────────┐
│              STATE INITIALIZATION                    │
│                                                     │
│  1. state.updateState(fullInput) — sets 120+        │
│     configuration flags based on clientData          │
│  2. Fetch reportConfig from MongoDB (if             │
│     pullReportConfig flag is set)                   │
│  3. Apply state overrides (stateData)               │
│  4. Apply color overrides (colorObj)                │
│  5. Apply patient detail customizations             │
│  6. Apply parameter/profile mapping configs         │
│  7. Apply LIS-specific mappings (if useLisMapping)  │
│  8. Fetch report content (test tips, profile info)  │
│  9. Fetch parameter/profile ordering                │
│  10. Client-specific overrides in niro.js           │
│      (e.g., remedies → base64Prefix='')             │
│                                                     │
│  Key State Variables:                               │
│  • reportType: 'compact'|'advanced'|'hybrid'|       │
│                'summary'|'dynamic'                   │
│  • curLang: 'en'|'hi'|'ar'|'cz'                    │
│  • headingColor: '#HEX'                             │
│  • showbodySummary: boolean                         │
│  • showSummary: boolean                             │
│  • historical: boolean                              │
│  • generateCovePage: boolean                        │
│  • generatePrintPdf: boolean                        │
│  • generateVizapp: boolean                          │
│  • showRiskScore: boolean                           │
│  • showAdditionalRecommendationsPage: boolean       │
│  ... and 100+ more configuration flags              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
```

#### Phase 4: Data Processing & Mapping

```
┌─────────────────────────────────────────────────────┐
│            DATA PROCESSING & MAPPING                 │
│                                                     │
│  1. DESTRUCTURE JSON                                │
│     utils.destructureJson(fullInput)                │
│     → Extracts biomarker array from various JSON    │
│       formats (each client sends differently)       │
│     → Normalizes to standard test object:           │
│       { name, value, id, unit, min, max, ... }      │
│                                                     │
│  2. FILTER VALID TESTS                              │
│     isValidTest(test) — removes:                    │
│     → Headers, placeholders, empty values           │
│     → Ultra-long values (>40 chars)                 │
│     → Ultra-long names (>50 chars)                  │
│     → Known invalid entries ('Gender', '-')         │
│                                                     │
│  3. CREATE TEST MODEL INSTANCES                     │
│     new baseModel.TestReportCondenced(test)          │
│     → Maps raw test name → standard Niroggyan name  │
│     → Looks up biomarker in testsDatabase (900+     │
│       entries with tips, profiles, ranges, content) │
│     → Resolves gender/age-specific reference ranges │
│     → Calculates color indicator (Normal/BL/High/   │
│       Low/Critical) based on value vs ranges        │
│     → Computes slider position for visualization    │
│     → Assigns profile membership                    │
│     → Retrieves multilingual content                │
│                                                     │
│  4. PROFILE GROUPING                                │
│     → Tests are grouped into health profiles        │
│     → Each Profile gets:                            │
│       - Overall color indicator (worst test)        │
│       - Tips & about information                    │
│       - Body summary SVG icon & positioning         │
│       - Accreditation info (NABL/CAP)               │
│       - Doctor signatures                           │
│       - Risk score data (if applicable)             │
│                                                     │
│  Standard Health Profiles:                          │
│  ┌──────────────────────────────────────────┐      │
│  │ Liver Function    │ Kidney Function      │      │
│  │ Thyroid Function  │ Blood Sugar          │      │
│  │ Complete Blood    │ Lipid Profile        │      │
│  │ Iron Studies      │ Vitamin Profile      │      │
│  │ Cardiac Risk      │ Electrolytes         │      │
│  │ Urine Analysis    │ Hormonal Profile     │      │
│  │ Bone Profile      │ Pancreatic Function  │      │
│  │ Allergy Panel     │ Infectious Disease   │      │
│  │ Tumor Markers     │ Arthritis Profile    │      │
│  │ Coagulation       │ ... and more         │      │
│  └──────────────────────────────────────────┘      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
```

#### Phase 5: Report Composition

```
┌─────────────────────────────────────────────────────┐
│              REPORT COMPOSITION                      │
│                                                     │
│  Based on reportType, different View modules        │
│  generate HTML for each report section:             │
│                                                     │
│  1. PATIENT DETAILS HEADER                          │
│     generatePatientDetails.js                       │
│     → Name, Age, Gender, Lab ID, Dates              │
│     → Client-specific field ordering                │
│     → Custom header labels per language             │
│                                                     │
│  2. REPORT SUMMARY (Summary View)                   │
│     summaryView.js                                  │
│     → At-a-glance overview of all profiles          │
│     → Color-coded cards per profile                 │
│     → Abnormal vs normal counts                     │
│     → Three layout types: TwoColumn, Single, PCOS   │
│                                                     │
│  3. BODY SUMMARY DIAGRAM                            │
│     newBodySummary.js                               │
│     → Human body silhouette with organ highlights   │
│     → Color-coded organ status indicators           │
│     → Positioned by profile body-map coordinates    │
│                                                     │
│  4. PROFILE DETAIL PAGES                            │
│     Compact: compactReportView.js                   │
│     → Cards with slider visualizations              │
│     → Color-coded range indicators                  │
│     → Tips and about sections                       │
│                                                     │
│     Advanced: advancedReportView.js                 │
│     → Grouped cards with unique arrangements        │
│     → Historical trend charts                       │
│     → Sub-group organization                        │
│                                                     │
│     Hybrid: hybridReportView.js                     │
│     → Mix of compact and advanced layouts           │
│                                                     │
│  5. RECOMMENDATIONS PAGE                            │
│     generateNextStepRecommendations.js              │
│     → Profile-specific actionable recommendations   │
│     → Icon-based visual presentation                │
│     → Single vs multiple abnormality grids          │
│     → QR code for VizApp access                     │
│                                                     │
│  6. COVER PAGE (if enabled)                         │
│     generateCoverPage.js (969 lines)                │
│     → Dynamic or static cover                       │
│     → Patient info overlay                          │
│     → Brand-specific imagery                        │
│     → Print and digital variants                    │
│                                                     │
│  7. INTRO PAGE (if enabled)                         │
│     introPage.js                                    │
│     → "How to read your report" guide               │
│     → Legend and color explanations                 │
│                                                     │
│  8. COLOR REPLACEMENT                               │
│     color.insertColorValue(template)                │
│     → Replaces {{NORMAL}}, {{FINALCRITICAL}}, etc.  │
│     → Generates both colored and grayscale versions │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
```

#### Phase 6: PDF Rendering

```
┌─────────────────────────────────────────────────────┐
│               PDF RENDERING                          │
│                                                     │
│  1. HTML ASSEMBLY                                   │
│     generatePDF.js                                  │
│     → Combines all sections into full HTML document  │
│     → Applies CSS template (templates.js)           │
│     → Replaces template variables:                  │
│       {{CARDBACKGROUND}}, {{HEADINGCOLOR}},          │
│       {{FONTURL}}, {{FONTFAMILY}}, {{DIRECTION}},    │
│       {{FONTSIZE}}, {{barcode}}                      │
│                                                     │
│  2. BROWSER LAUNCH                                  │
│     Puppeteer / chrome-aws-lambda                   │
│     → Headless Chromium browser initialized         │
│     → Custom fonts loaded (Devanagari, Arabic)      │
│     → HTML written to /tmp/niro.html                │
│                                                     │
│  3. PDF GENERATION                                  │
│     page.pdf(options)                               │
│     → A4 format                                     │
│     → Custom header/footer templates                │
│     → Dynamic margins (header/footer aware)         │
│     → Digital PDF (colored)                         │
│     → Print PDF (grayscale) if enabled              │
│                                                     │
│  4. PDF MERGING                                     │
│     mergePdf() from smartreport package             │
│     → Cover page + Main report + Recommendations    │
│     → Additional bookings page                      │
│     → Intro page                                    │
│     → Back page (static PDF per client)             │
│                                                     │
│  Output:                                            │
│  • digitalPdf: Buffer (colored PDF)                 │
│  • printPdf: Buffer (grayscale PDF)                 │
│  • result: JSON (structured report data)            │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
```

#### Phase 7: Delivery & Billing

```
┌─────────────────────────────────────────────────────┐
│             DELIVERY & BILLING                       │
│                                                     │
│  1. BILLING UPDATE                                  │
│     reportIncrement(org) — increments report count  │
│     updateBilling() — records generation metadata   │
│                                                     │
│  2. VIZAPP DATA STORE (if enabled)                  │
│     updateJsonLocationVizApp() — stores:            │
│     → Report ID (hashed clientId + labNo)           │
│     → Password (SHA-256 hashed)                     │
│     → Input JSON URL                                │
│     → App URL (vizapp.niroggyan.com)                │
│                                                     │
│  3. S3 UPLOAD                                       │
│     → PDF file: centre/LabNo_timestamp.pdf          │
│     → Input JSON: centre/LabNo_timestamp.json       │
│     → Buckets: niroggyansmartreports, inputjson     │
│                                                     │
│  4. DISPATCH                                        │
│     Based on clientData.dispatch.type:              │
│     → 'return': PDF in HTTP response (base64)       │
│     → webhook: POST to client URL                   │
│     → WhatsApp: Via WA Business API                 │
│                                                     │
│  5. RESPONSE                                        │
│     {                                               │
│       "LabId": "LAB-2026-001234",                   │
│       "patientId": "WO-5678",                       │
│       "PdfData": "base64...",                       │
│       "printPdfData": "base64...",                  │
│       "vizAppUrl": "https://vizapp.../id=...",      │
│       "vizAppPassword": "abc123"                    │
│     }                                               │
└─────────────────────────────────────────────────────┘
```

---

## 7. Data Flow Architecture

### 7.1 Data Sources

| Source | Type | Description |
|--------|------|-------------|
| **Client LIS** | JSON (HTTP POST) | Raw lab test results from Laboratory Information Systems |
| **MongoDB (clientConfig)** | Database | Client configurations, subscription data, report configs |
| **MongoDB (reportConfig)** | Database | State overrides, color schemes, patient detail formatting |
| **MongoDB (reportContent)** | Database | Test tips/about content, profile tips, custom content |
| **testsDatabase.js** | Static File | 900+ biomarker definitions: names, aliases, profiles, ranges, tips |
| **profileBaseDynamic.js** | Static File | Profile definitions: about text, tips, body summary positioning, icons |
| **testsContentBase.js** | Static File | Detailed test content: descriptions, recommendations, follow-ups |
| **AWS S3** | Object Storage | Header/footer images, cover page images, brand assets |
| **External APIs** | HTTP | Risk score calculation, translation services |

### 7.2 Data Processing Lifecycle

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DATA PROCESSING LIFECYCLE                         │
│                                                                      │
│  RAW INPUT          STANDARDIZED           ENRICHED                  │
│  (Client-specific)  (Niroggyan Format)     (Report-Ready)            │
│                                                                      │
│  ┌──────────┐      ┌──────────────┐       ┌───────────────────┐     │
│  │ ELEMENT_ │      │ standardName │       │ testName          │     │
│  │ NAME     │──→   │ (mapped)     │──→    │ resultValue       │     │
│  │ value    │      │ value        │       │ colorIndicator    │     │
│  │ ref_range│      │ min, max     │       │ sliderPosition    │     │
│  │ unit     │      │ unit         │       │ signalText (H/L/N)│     │
│  │ id       │      │ id           │       │ profileName       │     │
│  └──────────┘      │ profileName  │       │ tips (multilang)  │     │
│                    └──────────────┘       │ about (multilang) │     │
│                                           │ recommendations   │     │
│                                           │ historicalData    │     │
│                                           │ referenceRanges   │     │
│                                           │ borderlineRanges  │     │
│                                           └───────────────────┘     │
│                                                                      │
│  RENDERED              ASSEMBLED              DELIVERED              │
│  (HTML Components)     (Full Document)        (Final Output)         │
│                                                                      │
│  ┌───────────────┐    ┌──────────────┐       ┌─────────────────┐    │
│  │ Profile Cards │    │ Complete     │       │ PDF Buffer      │    │
│  │ Summary Table │    │ HTML with    │       │ S3 URL          │    │
│  │ Body Diagram  │──→ │ CSS styling  │──→    │ VizApp JSON     │    │
│  │ Charts/SVGs   │    │ Header/Footer│       │ Billing Record  │    │
│  │ Cover Page    │    │ Pagination   │       │ Dispatch Status │    │
│  └───────────────┘    └──────────────┘       └─────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.3 Input JSON Formats

The platform handles multiple JSON input formats from different client LIS systems:

#### Format 1: Standard NiroggyanFormat
```json
{
  "org": "remedies",
  "Centre": "MAIN_LAB",
  "LabNo": "LAB001",
  "WorkOrderID": "WO001",
  "PatientName": "Patient Name",
  "Age": "35",
  "Gender": "Male",
  "tests": [
    {
      "name": "Haemoglobin",
      "value": "14.5",
      "unit": "g/dL",
      "id": "000314",
      "min": "13.5",
      "max": "17.5"
    }
  ]
}
```

#### Format 2: SRL/Max/Element-Based Format
```json
{
  "org": "srl",
  "LabNo": "SRL001",
  "results": [
    {
      "Package_name": "Complete Blood Count",
      "tests": [
        {
          "ELEMENT_CODE": "HB",
          "ELEMENT_NAME": "HAEMOGLOBIN",
          "PRODUCT_CODE": "CBC01",
          "PRODUCT_NAME": "Complete Blood Count",
          "value": "14.5",
          "measurement_unit": "g/dL",
          "references": [
            {
              "label": "NORMAL",
              "min": "13.5",
              "max": "17.5",
              "type": "numeric"
            }
          ]
        }
      ]
    }
  ]
}
```

#### Format 3: Wrapped Data Array
```json
{
  "data": [
    {
      "org": "medibuddy",
      "LabNo": "MB001",
      "tests": [ ... ]
    }
  ]
}
```

### 7.4 Output Data Formats

| Output | Format | Destination | Content |
|--------|--------|-------------|---------|
| **Digital PDF** | PDF (A4, colored) | API response / S3 | Full smart report with visualizations |
| **Print PDF** | PDF (A4, grayscale) | API response / S3 | Print-friendly version without colors |
| **Report JSON** | JSON | API response / VizApp | Structured report data for web app |
| **VizApp URL** | URL string | API response | Link to interactive web report |
| **Billing Record** | JSON | MongoDB / SQS | Generation metadata for billing |

---

## 8. Third-Party Services & Integrations

### 8.1 Current Integrations

| Service | Purpose | Usage |
|---------|---------|-------|
| **AWS Lambda** | Serverless compute | Primary execution environment for report generation |
| **AWS S3** | Object storage | PDF reports, input JSONs, brand assets (headers, footers, logos) |
| **AWS SQS** | Message queue | Asynchronous processing, billing queue |
| **AWS API Gateway** | API management | REST API endpoint for Lambda functions |
| **MongoDB Atlas** | Database | Client configs, subscriptions, report configs, billing data |
| **Puppeteer / Chromium** | PDF rendering | HTML-to-PDF conversion via headless Chrome (`chrome-aws-lambda`) |
| **Chart.js** | Charting | Biomarker visualization charts and historical trends |
| **ECharts** | Advanced charting | Complex visualization components |
| **pdf-lib** | PDF manipulation | PDF merging, page insertion (cover pages, back pages) |
| **Jimp** | Image processing | Dynamic image manipulation for report assets |
| **Google Fonts** | Typography | Custom font loading (Nunito Sans, Open Sans, Noto Sans Devanagari) |
| **GitLab CI/CD** | DevOps | Automated testing and deployment pipeline |

### 8.2 External NPM Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `@sparticuz/chromium` | ^110.0.0 | Chromium binary for AWS Lambda |
| `aws-sdk` | ^2.1181.0 | AWS service integrations (S3, SQS) |
| `puppeteer` / `puppeteer-core` | ^18.2.1 | Headless browser for PDF generation |
| `chart.js` | ^3.8.0 | Chart rendering for report visualizations |
| `chartjs-node-canvas` | ^4.1.6 | Server-side chart rendering |
| `echarts` | ^5.6.0 | Advanced charting library |
| `pdf-lib` | ^1.17.1 | PDF document manipulation |
| `jimp` | ^0.22.7 | Image processing |
| `jsonwebtoken` | ^9.0.0 | JWT authentication |
| `xlsx` | ^0.18.5 | Excel file processing |
| `translate` | ^3.0.0 | Translation services |
| `form-data` | ^4.0.0 | Multipart form data handling |
| `smartreport` | (private GitLab) | Shared Niroggyan module: billing, subscriptions, validations, templates |

### 8.3 Recommended New Integrations (Next-Gen)

| Service | Purpose | Rationale |
|---------|---------|-----------|
| **Redis / ElastiCache** | Caching | Cache client configs, mapped parameters, compiled templates |
| **OpenAI / Azure AI** | AI insights | GPT-powered health summaries and personalized recommendations |
| **Datadog / New Relic** | Monitoring | Application performance monitoring, error tracking |
| **Sentry** | Error tracking | Real-time error capture with stack traces and context |
| **AWS CloudWatch** | Logging | Centralized log aggregation and alerting |
| **Playwright** | PDF rendering | Modern successor to Puppeteer with better Lambda support |
| **Bull / BullMQ** | Job queue | Robust job queue with retry, priority, and progress tracking |
| **Zod** | Validation | Runtime type validation for input JSON schemas |

---

## 9. Current System Analysis & Pain Points

### 9.1 Architecture Pain Points

| Issue | Severity | Description |
|-------|----------|-------------|
| **Monolithic Lambda** | 🔴 Critical | Entire application is a single Lambda function; any change requires full redeployment |
| **Client-Specific Branching** | 🔴 Critical | `niro.js` contains 50+ `if (fullInput.org === 'X')` blocks; adding a client requires modifying core code |
| **Giant State Object** | 🔴 Critical | `state.js` manages 120+ flags in a single mutable global object; race conditions in concurrent execution |
| **Massive Test Database** | 🟡 High | `testsDatabase.js` is ~1MB of hardcoded biomarker data; should be in a database |
| **No Type Safety** | 🟡 High | Plain JavaScript with no TypeScript, no schema validation; runtime errors from undefined properties |
| **Tight Coupling** | 🟡 High | Models, Views, Controllers are interdependent; cannot test or replace components independently |
| **Code Duplication** | 🟡 High | 50+ client folders in `smart_report/` duplicate 70-80% of the same code |
| **No Testing** | 🟡 High | Minimal test coverage; critical report generation logic has no automated validation |
| **No Caching** | 🟢 Medium | Client configuration fetched from MongoDB on every single request |
| **No Monitoring** | 🟢 Medium | Limited logging, no APM, no alerting on errors or performance degradation |

### 9.2 Code Quality Observations

- **`niro.js`** (2,679 lines): Main orchestration file attempting to handle all clients, all report types, all edge cases in a single function (`readyFull`). This is the single most critical refactoring target.
  
- **`client/state.js`** (1,038 lines): Mutable global state with 120+ configuration flags. Used across all modules. Creates hidden dependencies and makes testing impossible.

- **`Test/testsDatabase.js`** (988KB): Hardcoded biomarker database with name mappings, profile assignments, reference ranges, tips, and content translations — all in a single JavaScript file. Should be externalized to a database with a caching layer.

- **Client-Specific Logic**: Throughout `niro.js`, there are blocks like:
  ```javascript
  if (fullInput.org === 'mobilab') {
    state.updateStateVariable({ headingColor: '#0DA955', backPagePath: './mobilabBackPage.pdf' });
  }
  ```
  This means adding any new client requires modifying the core engine — a violation of the Open/Closed Principle.

---

## 10. Proposed Architectural Improvements

### 10.1 Core Principles

| Principle | Description |
|-----------|-------------|
| **Configuration over Code** | Client-specific behavior driven entirely by configuration, not conditional branches |
| **Plugin Architecture** | Report components (views, charts, cover pages) are pluggable and composable |
| **Separation of Concerns** | Clear boundaries between data, logic, presentation, and infrastructure |
| **Stateless Processing** | No global mutable state; each request builds its own context |
| **Database-Driven Content** | All biomarker data, templates, and translations stored in database, not files |
| **Observability First** | Structured logging, distributed tracing, metrics, and alerting from day one |
| **Schema Validation** | Every input/output boundary validated with typed schemas |
| **Incremental Adoption** | New architecture can coexist with legacy; migrate client-by-client |

### 10.2 Key Architectural Shifts

1. **Global State → Request-Scoped Context**
   - Replace mutable `stateVariable` object with an immutable, request-scoped `ReportContext` built per request
   
2. **If/Else Client Logic → Configuration-Driven Pipeline**
   - All client behavior captured in MongoDB configuration documents
   - Zero conditional branches based on client identity in core code

3. **Hardcoded Test Database → MongoDB + Redis Cache**
   - Move 900+ biomarker definitions to MongoDB
   - Cache frequently accessed data in Redis with TTL

4. **Single Monolith → Service-Oriented Modules**
   - Split into discrete services: Config, Mapping, Template, Rendering, Delivery
   - Each service independently testable and deployable

5. **HTML String Concatenation → Template Engine**
   - Replace `html += '<div>...'` pattern with proper template engine (Handlebars/EJS/JSX)
   - Enables visual template editing and preview

---

## 11. Multi-Client Architecture

### 11.1 Current Client Model

Each client deployment is a **separate Lambda function** with its own copy of the codebase. This means:
- 50+ Lambda functions deployed via GitLab CI/CD
- Each Lambda has identical core code with client-specific overrides in `niro.js`
- Adding a new client requires: fork code → add if-block → deploy new Lambda

### 11.2 Proposed Multi-Tenant Model

```
┌──────────────────────────────────────────────────────────────┐
│                    SINGLE DEPLOYMENT                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Report Engine (Shared)                   │ │
│  │                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │ Core Models  │  │ Template     │  │ PDF          │  │ │
│  │  │ & Logic      │  │ Engine       │  │ Renderer     │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                  │
│                     ┌──────┴──────┐                           │
│                     │ Config      │                           │
│                     │ Resolver    │                           │
│                     └──────┬──────┘                           │
│                            │                                  │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐         │
│    │Client A │       │Client B │       │Client C │         │
│    │ Config  │       │ Config  │       │ Config  │         │
│    │ (JSON)  │       │ (JSON)  │       │ (JSON)  │         │
│    └─────────┘       └─────────┘       └─────────┘         │
│                                                              │
│  Each config contains:                                       │
│  • State flags (120+ toggleable features)                    │
│  • Color scheme (colored + grayscale)                        │
│  • Header/footer images (S3 URLs)                            │
│  • Cover page template                                       │
│  • Parameter mappings (ID → standard name)                   │
│  • Profile mappings (parameter → profile)                    │
│  • Parameter ordering                                        │
│  • Font preferences                                          │
│  • Dispatch configuration                                    │
│  • Billing tier                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 12. Report Types & Generation Modes

### 12.1 Report Types

| Type | Description | When Used |
|------|-------------|-----------|
| **Compact** | Concise cards with sliders, color indicators, range tables | Default for most clients; 1-2 page reports |
| **Advanced** | Detailed cards with grouped sub-parameters, historical charts | Comprehensive health check-ups; 5-10+ pages |
| **Hybrid** | Mix of compact and advanced layouts | Clients wanting detailed view for some profiles, compact for others |
| **Summary** | Overview-only report with abnormal highlights | Quick summary mode; single-page executive view |
| **Dynamic** | Auto-adapting layout based on test count and abnormality | Smart layout selection based on data characteristics |

### 12.2 Report Sections

```
┌─────────────────────────────────────────────────────┐
│                  COMPLETE REPORT                     │
│                                                     │
│  ┌─────────────────────────────────────────┐        │
│  │         COVER PAGE (optional)           │        │
│  │  • Patient info • Brand imagery         │        │
│  └─────────────────────────────────────────┘        │
│                                                     │
│  ┌─────────────────────────────────────────┐        │
│  │         INTRO PAGE (optional)           │        │
│  │  • How to read your report              │        │
│  │  • Color legend                         │        │
│  └─────────────────────────────────────────┘        │
│                                                     │
│  ┌─────────────────────────────────────────┐        │
│  │         PATIENT DETAILS HEADER          │        │
│  │  • Name, Age, Gender                    │        │
│  │  • Lab ID, Dates, Centre                │        │
│  │  • Package Name                         │        │
│  └─────────────────────────────────────────┘        │
│                                                     │
│  ┌─────────────────────────────────────────┐        │
│  │         REPORT SUMMARY                  │        │
│  │  • All profiles with status indicators  │        │
│  │  • Abnormal highlights                  │        │
│  └─────────────────────────────────────────┘        │
│                                                     │
│  ┌─────────────────────────────────────────┐        │
│  │         BODY SUMMARY DIAGRAM            │        │
│  │  • Human body with organ status         │        │
│  │  • Color-coded organ indicators         │        │
│  └─────────────────────────────────────────┘        │
│                                                     │
│  ┌─────────────────────────────────────────┐        │
│  │         PROFILE DETAILS (per profile)   │        │
│  │  • Profile header with overall status   │        │
│  │  • Individual test cards                │        │
│  │  • Slider visualizations               │        │
│  │  • Tips & recommendations              │        │
│  │  • Historical trends (if available)     │        │
│  │  • Doctor signatures                   │        │
│  └─────────────────────────────────────────┘        │
│                                                     │
│  ┌─────────────────────────────────────────┐        │
│  │    RECOMMENDATIONS PAGE (optional)      │        │
│  │  • Next-step actions per abnormality    │        │
│  │  • QR code for VizApp                  │        │
│  └─────────────────────────────────────────┘        │
│                                                     │
│  ┌─────────────────────────────────────────┐        │
│  │         BACK PAGE (optional)            │        │
│  │  • Static PDF per client                │        │
│  │  • Terms, disclaimers, branding         │        │
│  └─────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

---

## 13. Security & Compliance Overview

### 13.1 Current Security Measures

| Layer | Mechanism |
|-------|-----------|
| **Authentication** | JWT tokens + API keys via `smartreport` subscription service |
| **Authorization** | User validation against MongoDB subscription database |
| **Data in Transit** | HTTPS via API Gateway |
| **Data at Rest** | S3 server-side encryption (default SSE-S3) |
| **Credentials** | MongoDB connection string in `.env` (⚠️ should be in AWS Secrets Manager) |
| **Report Access** | VizApp reports protected by SHA-256 hashed passwords |

### 13.2 Recommended Security Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| **AWS Secrets Manager** | 🔴 Critical | Move MongoDB URI and all credentials from `.env` files |
| **Input Sanitization** | 🔴 Critical | Validate all input JSON schemas with Zod/Joi before processing |
| **HIPAA Audit Logging** | 🟡 High | Log all data access events with patient identifiers for compliance |
| **Field-Level Encryption** | 🟡 High | Encrypt patient PII in transit and at rest |
| **API Rate Limiting** | 🟡 High | Per-client rate limits to prevent abuse and ensure fair usage |
| **RBAC** | 🟢 Medium | Role-based access for portal operations (admin, viewer, editor) |
| **Data Retention Policies** | 🟢 Medium | Automated cleanup of aged PDFs and input JSONs per compliance reqs |
| **Penetration Testing** | 🟢 Medium | Regular security assessments of API endpoints |

---

## 14. Glossary

| Term | Definition |
|------|-----------|
| **Biomarker** | A measurable substance in the body whose presence indicates a disease, condition, or health status (e.g., Haemoglobin, TSH, Cholesterol) |
| **LIS** | Laboratory Information System — the software used by diagnostic labs to manage test workflows |
| **Profile** | A logical grouping of related biomarkers representing a body system or health domain (e.g., "Liver Function", "Lipid Profile") |
| **Reference Range** | The range of values considered normal for a particular biomarker (may vary by age, gender, and methodology) |
| **Borderline** | A value slightly outside the normal reference range but not yet in the critical zone |
| **Smart Report** | A visually enhanced lab report with color-coded indicators, explanations, recommendations, and trend analysis |
| **VizApp** | An interactive web-based version of the lab report accessible via URL/QR code |
| **Color Indicator** | The health status classification: Normal (green), Borderline (yellow), High/Low (red), Critical (dark red) |
| **Slider** | A visual representation showing where a test value falls relative to its reference range |
| **Body Summary** | A human body diagram highlighting which organ systems have abnormal results |
| **Cover Page** | The first page of the report featuring patient details and brand imagery |
| **Back Page** | A static final page with terms, conditions, and client branding (typically a pre-made PDF) |
| **Dispatch** | The mechanism by which the generated report is delivered to the client or patient |
| **Report Type** | The layout style of the report: Compact, Advanced, Hybrid, Summary, or Dynamic |
| **Client** | A diagnostic laboratory or healthcare organization that uses the Niroggyan platform |
| **Niro** | Internal codename for the report generation engine |
| **State Variable** | Configuration flags that control which features are enabled/disabled for a given report request |

---

*This document serves as the foundational reference for understanding the Remedies platform. For technical implementation details, refer to **Document 2: Technical Architecture & Codebase Design**. For database schemas and API specifications, refer to **Document 3: Backend System Design & Data Architecture**.*
