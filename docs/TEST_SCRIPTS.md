# Test Scripts Reference

These are **manual verification scripts** (not unit tests) for sanity-checking report generation and features.

## Data Source

All scripts use **`sample-report-input.json`** – sample lab report data (patient "Rajesh Kumar", ~10 tests). This is a required fixture file; do not remove it.

---

## Scripts

| Script | npm run | Purpose |
|--------|---------|---------|
| **test-reports** | `test-reports` | Quick smoke test: Dynamic + Compact reports (HTML) |
| **test-all-report-types** | `test-all-types` | Full test: Both report types (dynamic, compact) + PDF for each |
| **test-phase1** | `test-phase1` | Core components: TestDatabaseService, ProfileService, ColorIndicator, grouping |
| **test-customization** | `test-customization` | Client branding: NirogGyan, CityCare, QuickLab |
| **test-i18n-and-viz** | `test-i18n-viz` | i18n (en, hi, ar) + SVG charts |
| **test-analytics** | `test-analytics` | Analytics section in report |

---

## Output

All outputs go to **`test-output/`** (gitignored).
