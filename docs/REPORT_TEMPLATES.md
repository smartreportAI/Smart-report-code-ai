# Report Templates & Partials

## Report Types (Market: Compact & Dynamic Only)

| Type | Layout | Use Case |
|------|--------|----------|
| **Dynamic** | `layouts/dynamic.hbs` | Detailed report with health score, organ dashboard, AI insights, full test list |
| **Compact** | `layouts/compact.hbs` | Condensed report with profile cards, summary, body diagram |

---

## Where to Redesign Reports

### 1. Template Partials (Handlebars)

Used by **ReportPipeline** (`src/core/pipeline/ReportPipeline.ts`) when generating reports via the pipeline flow.

**Layouts:**
- `src/templates/layouts/dynamic.hbs` – Dynamic report page structure
- `src/templates/layouts/compact.hbs` – Compact report page structure

**Partials:**

| Folder | Partials |
|--------|----------|
| `partials/shared/` | `cover-page.hbs`, `patient-header.hbs` |
| `partials/dynamic/` | `health-score.hbs`, `key-abnormal.hbs`, `organ-dashboard.hbs`, `full-report-dynamic.hbs`, `ai-insights.hbs`, `action-plan.hbs` |
| `partials/compact/` | `summary.hbs`, `profile-card.hbs`, `recommendations.hbs`, `legend.hbs`, `body-summary.hbs` |

**Styles:**
- `src/templates/styles/base.css` – Shared CSS variables and layout

### 2. Controller HTML (TypeScript)

Used by **ReportService** when the API generates reports (reports-v2 routes).

- `src/controllers/DynamicReportController.ts` – Dynamic report (inline HTML/CSS)
- `src/controllers/CompactReportController.ts` – Compact report (inline HTML/CSS)
- `src/controllers/BaseReportController.ts` – Shared styles (`getBaseStyles()`), patient details, tables

---

## Which Path Does the API Use?

The **reports-v2 API** (`POST /api/v1/reports/v2/generate`) uses **ReportService → Controllers** (TypeScript HTML), not the Handlebars pipeline.

To use **templates/partials** for API reports, ReportService would need to call ReportPipeline instead of the controllers.
