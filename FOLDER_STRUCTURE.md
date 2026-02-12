# 📁 Smart Report AI - Folder Structure Guide

## 🎯 Quick Overview

This project generates AI-powered health reports (PDF + HTML) from lab test data. The codebase follows a **pipeline architecture** where data flows through multiple stages: Input → Processing → Mapping → Grouping → Insights → HTML → PDF.

---

## 📂 Root Level

```
Smart Report AI Code/
├── src/                    # Main source code
├── reports/                # Generated outputs (PDF & HTML)
├── scripts/                # Utility scripts (data seeding)
├── legacy-data/            # Legacy test/profile data (for migration)
├── doc/                    # Documentation
├── sample-input.json       # Example input for testing
├── package.json            # Project dependencies
└── tsconfig.json           # TypeScript configuration
```

---

## 🏗️ Source Code (`src/`) - The Heart of the Application

### 1️⃣ **Core Pipeline** (`src/core/`)
The main report generation engine using a **step-by-step pipeline**.

```
src/core/
├── pipeline/
│   ├── ReportPipeline.ts          # Orchestrates all steps
│   └── steps/
│       ├── parseInput.step.ts      # Step 1: Parse JSON input
│       ├── mapParameters.step.ts   # Step 2: Map tests to biomarkers
│       ├── groupProfiles.step.ts   # Step 3: Group tests by profile
│       ├── generateInsights.step.ts # Step 4: Identify abnormal results
│       ├── renderHtml.step.ts      # Step 5: Generate HTML
│       └── generatePdf.step.ts     # Step 6: Convert HTML to PDF
│
├── context/
│   └── ReportContext.ts            # Shared data passed between steps
│
└── config/
    └── loadConfig.ts               # Load client-specific configuration
```

**🔄 Pipeline Flow:**
```
Input JSON → Parse → Map → Group → Insights → HTML → PDF
```

---

### 2️⃣ **Templates** (`src/templates/`)
HTML generation using **Handlebars** templating.

```
src/templates/
├── layouts/
│   ├── dynamic.hbs                 # Layout for dynamic reports
│   └── compact.hbs                 # Layout for compact reports
│
├── partials/
│   ├── shared/
│   │   ├── cover-page.hbs          # Cover page component
│   │   └── patient-header.hbs      # Patient info header
│   │
│   ├── dynamic/                    # Components for dynamic reports
│   │   ├── health-score.hbs
│   │   ├── key-abnormal.hbs
│   │   ├── organ-dashboard.hbs
│   │   ├── full-report-dynamic.hbs
│   │   ├── ai-insights.hbs
│   │   └── action-plan.hbs
│   │
│   └── compact/                    # Components for compact reports
│       ├── summary.hbs
│       ├── profile-card.hbs
│       ├── recommendations.hbs
│       ├── legend.hbs
│       └── body-summary.hbs
│
├── styles/
│   └── base.css                    # All CSS styles (embedded in HTML)
│
└── helpers/
    └── slider.helper.js            # Handlebars custom helpers
```

**📝 How Templates Work:**
1. Layout (`.hbs`) is selected based on report type
2. Partials are injected into the layout
3. CSS is inline-embedded for PDF compatibility

---

### 3️⃣ **Database Models** (`src/models/`)
MongoDB schema definitions using **Mongoose**.

```
src/models/
├── biomarker.model.ts              # Test parameter definitions
├── profile.model.ts                # Test grouping definitions
├── reportConfig.model.ts           # Client report configurations
└── client.model.ts                 # Client-specific settings
```

**💡 Key Concepts:**
- **Biomarker** = Individual test (e.g., "Cholesterol")
- **Profile** = Group of related tests (e.g., "Lipid Profile")
- **ReportConfig** = Customization per client (colors, flags)
- **Client** = Organization using the platform

---

### 4️⃣ **Services** (`src/services/`)
External integrations and utilities.

```
src/services/
└── pdf/
    └── browser-pool.service.js     # Puppeteer browser management
```

**🎯 Purpose:** Manages headless Chrome for HTML → PDF conversion.

---

### 5️⃣ **Types** (`src/types/`)
TypeScript type definitions for the entire project.

```
src/types/
└── index.ts                        # All TypeScript interfaces
```

**Common Types:**
- `ReportInput` - Input JSON structure
- `TestResult` - Mapped test result
- `ProfileResult` - Grouped profile result
- `InsightItem` - Abnormal test insight

---

### 6️⃣ **Entry Points**
```
src/
├── index.ts                        # Main server (Fastify API)
└── generate-sample.ts              # CLI script for testing
```

**🚀 Usage:**
- `npm run dev` → Start API server
- `npm run generate` → Generate sample report

---

## 🛠️ Scripts (`scripts/`)

```
scripts/
└── seed-biomarkers.ts              # Import legacy test data to MongoDB
```

**Run:** `npm run seed`

---

## 📊 Legacy Data (`legacy-data/`)

```
legacy-data/
├── testsDatabase.js                # Old test parameter definitions
├── profileBaseDynamic.js           # Old profile groupings
└── testsContentBase.js             # Old test descriptions/tips
```

**⚠️ Important:** This is used during migration. New data should be in MongoDB.

---

## 📄 Generated Reports (`reports/`)

```
reports/
├── sample.pdf                      # Generated PDF report
├── debug.html                      # Generated HTML (for debugging)
└── .gitkeep
```

**💡 Tip:** Open `debug.html` in a browser to preview the report before PDF conversion.

---

## 🗂️ Documentation (`doc/`)

```
doc/
└── (Your existing documentation files)
```

---

## 🔥 Quick Reference: Common Tasks

### ✅ Generate a Report
```bash
npm run generate              # Uses sample-input.json
```

### ✅ Start API Server
```bash
npm run dev                   # Server at http://localhost:3000
```

### ✅ Seed Database
```bash
npm run seed                  # Import legacy test data
```

### ✅ Build for Production
```bash
npm run build                 # Compile TypeScript
npm start                     # Run compiled code
```

---

## 🧩 Architecture Diagram

```
┌─────────────────┐
│  Client Input   │  (JSON with test results)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│         REPORT PIPELINE (ReportPipeline.ts)     │
├─────────────────────────────────────────────────┤
│  Step 1: Parse Input      (parseInput.step)     │
│  Step 2: Map Parameters   (mapParameters.step)  │
│  Step 3: Group Profiles   (groupProfiles.step)  │
│  Step 4: Generate Insights (generateInsights.step) │
│  Step 5: Render HTML      (renderHtml.step)     │
│  Step 6: Generate PDF     (generatePdf.step)    │
└────────┬────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  PDF + HTML     │  (Saved to reports/)
└─────────────────┘
```

---

## 🎨 Customization Hierarchy (3 Levels)

1. **System Defaults** (L0) - Base colors, flags
2. **Client Settings** (L1) - Per-organization config
3. **Report Config** (L2) - Per-report customization

**Loaded in:** `src/core/config/loadConfig.ts`

---

## 📚 Key Files to Understand First

| Priority | File | Purpose |
|----------|------|---------|
| 🔥 **1** | `src/core/pipeline/ReportPipeline.ts` | Orchestrates entire flow |
| 🔥 **2** | `src/core/pipeline/steps/*.step.ts` | Individual processing steps |
| 🔥 **3** | `src/templates/layouts/dynamic.hbs` | Main report template |
| 🔥 **4** | `src/templates/styles/base.css` | All visual styling |
| 🔥 **5** | `sample-input.json` | Example input format |

---

## 🆘 Need Help?

- **Understanding Flow?** → Read `src/core/pipeline/ReportPipeline.ts`
- **Modifying Design?** → Edit `src/templates/`
- **Adding New Tests?** → Update `biomarker.model.ts` and seed data
- **Debugging?** → Check `reports/debug.html`

---

**Last Updated:** February 12, 2026
