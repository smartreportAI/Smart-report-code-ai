# Smart Report AI – Project Summary

**Last Updated:** February 13, 2026

---

## 1. Present Condition of the Project

### What’s Implemented

| Area | Status | Details |
|------|--------|---------|
| **Report Types** | ✅ Complete | **Dynamic** and **Compact** only (Hybrid/Summary removed for market) |
| **Report Controllers** | ✅ Working | `DynamicReportController`, `CompactReportController` |
| **API** | ✅ Working | `POST /api/v1/reports/v2/generate`, `POST /api/v1/reports/v2/pdf` |
| **PDF Generation** | ✅ Working | Puppeteer-based, A4/Letter, client-specific |
| **Storage** | ✅ Local only | `storage/reports/` (HTML + PDF saved locally) |
| **Client Branding** | ✅ Working | Per-client colors, logos, feature flags (JSON configs) |
| **i18n** | ✅ Complete | en, hi, cz, ar + RTL for Arabic |
| **Visualization** | ✅ Complete | SVG health score gauges, risk bars |
| **Mapping** | ✅ Complete | Parameter & profile mappings (1,273 params, 65 profiles) |
| **MongoDB** | ✅ Connected | Used on startup; required for pipeline flow |

### What’s Missing / Planned

| Area | Status |
|------|--------|
| **S3 Storage** | ❌ Not implemented (only local storage) |
| **AI Recommendations** | 📅 Phase 2.1 (OpenAI GPT-4) |
| **Redis Caching** | Optional; package exists but not wired |
| **Webhooks / WhatsApp / Email** | 📅 Phase 3 |

---

## 2. How It Works

### Report Flow (API – reports-v2)

```
POST /api/v1/reports/v2/generate
  → ReportService.generateReport(input, reportType)
  → DynamicReportController or CompactReportController
  → processInput() → groupIntoProfiles() → generateHTML()
  → StorageService.saveReport() → storage/reports/{WorkOrderID}.html
  → Return { html, metadata }
```

### PDF Flow

```
POST /api/v1/reports/v2/pdf
  → Same as above
  → PDFService.generatePDF(html) via Puppeteer
  → StorageService.saveReport() → storage/reports/{WorkOrderID}.pdf
  → Return PDF buffer
```

### Two Data Paths

| Path | Used By | Data Source |
|------|---------|-------------|
| **API (reports-v2)** | ReportService → Controllers | `testsDatabase.json`, `profileDefinitions.json`, `clientConfigs.json` (no MongoDB for report gen) |
| **Pipeline** | `generate-sample.ts`, modules/report | MongoDB (Biomarker, Profile, Mapping) + Handlebars templates |

---

## 3. Next Steps (Recommended Order)

1. **MongoDB setup** (if not done) – see Section 5 below.
2. **Optional: Run `npm run seed`** – Seeds Biomarker, Profile collections for pipeline.
3. **Phase 2.1: AI recommendations** – Integrate OpenAI for advice on abnormal tests.
4. **S3 setup** – Add S3 storage for HTML/PDF as in Section 4.
5. **Redis (optional)** – Cache client configs if needed for performance.

---

## 4. How to Set Up S3

S3 is not implemented yet. Steps to add it:

### 4.1 AWS Prerequisites

1. Create S3 bucket(s), e.g. `smart-report-pdfs`, `smart-report-html`.
2. Create IAM user with `s3:PutObject`, `s3:GetObject`, `s3:ListBucket`.
3. Add credentials to `.env`:

```
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_REPORTS=smart-report-pdfs
```

### 4.2 Code Changes

1. Create `src/services/S3StorageService.ts` – upload HTML/PDF to S3 using `@aws-sdk/client-s3`.
2. Extend `StorageService` or add a provider:
   - If AWS env vars are set → upload to S3 and return S3 URL.
   - Otherwise → keep current local file behavior.
3. Update `ReportService` to prefer S3 when configured and return the S3 URL instead of only local path.

### 4.3 `.env` Addition

```
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_REPORTS=your-bucket-name
```

---

## 5. MongoDB Setup – What to Do With the URL You Have

### If You Already Have `MONGO_URI`

You have something like:
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/smart-report-ai?retryWrites=true&w=majority
```

### Steps

#### Step 1: Create `.env`

```bash
cp .env.example .env
```

Edit `.env` and set:

- `MONGO_URI` – your MongoDB URL (replace placeholder in `.env.example` if needed)
- `JWT_SECRET` – any string ≥ 10 characters

#### Step 2: Run the App

```bash
npm install
npm run dev
```

On startup, the app calls `connectDb(env.MONGO_URI)` and connects to MongoDB.

#### Step 3: Seed Pipeline Data (if using Pipeline flow)

If you use `generate-sample.ts` or the pipeline (Biomarker-based mapping):

```bash
npm run seed
```

This seeds:

- Biomarker
- Profile
- Related collections

If you only use the reports-v2 API (Dynamic/Compact with `testsDatabase.json`), you do **not** need to seed. MongoDB is still required at startup because `index.ts` calls `connectDb()`.

#### Step 4: Optional: Make MongoDB Optional for API-Only Usage

If you want the app to run **without** MongoDB when only using the API:

1. In `src/index.ts`, make `connectDb()` conditional.
2. Only call it when pipeline/report modules that use MongoDB are used.
3. Or run MongoDB locally/Atlas for development and production.

---

## 6. Quick Reference

### Run Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start server (needs `.env` with MONGO_URI) |
| `npm run test-reports` | Test Dynamic + Compact report generation |
| `npm run test-all-types` | Test both types + PDF |
| `npm run generate-mappings` | Regenerate parameter/profile mappings |
| `npm run seed` | Seed MongoDB for pipeline (Biomarker, Profile) |

### Important Files

| File | Purpose |
|------|---------|
| `src/controllers/DynamicReportController.ts` | Dynamic report HTML |
| `src/controllers/CompactReportController.ts` | Compact report HTML |
| `src/services/ReportService.ts` | Report orchestration |
| `src/services/StorageService.ts` | Local storage (S3 extension point) |
| `src/config/db.ts` | MongoDB connection |
| `src/config/env.ts` | Env validation |
| `.env` | Secrets (MONGO_URI, JWT_SECRET, etc.) |

---

## 7. Checklist for Going to Production

- [ ] Set `MONGO_URI` in `.env`
- [ ] Set `JWT_SECRET` in `.env`
- [ ] (Optional) Add S3 env vars and implement S3 upload
- [ ] (Optional) Add Redis for caching
- [ ] Run `npm run seed` if using pipeline
- [ ] Run `npm run test-reports` to verify
- [ ] Use `npm run build` and `npm start` for production
