# Report Configuration API

This document describes the report configuration API and the `stateData` flags that control per-client report behavior.

**Base URL:** `/api/v1/configs`

**Authentication:** `GET /configs/:clientId`, `PUT`, and `POST /preview` require JWT authentication. `GET /configs/defaults` is public.

---

## Endpoints

### GET /configs/defaults

Returns system default configuration (no auth required).

**Response:**
```json
{
  "colors": {
    "colored": {
      "normal": "#0F9D58",
      "borderline": "#F4B400",
      "high": "#DB4437",
      "low": "#DB4437",
      "critical": "#C26564"
    },
    "greyscaled": { ... }
  },
  "stateData": {
    "reportType": "dynamic",
    "generateCoverPage": true,
    "showBodySummary": true,
    "showSummary": true,
    "showRecommendations": true,
    "curLang": "en",
    "fallbackLang": "en"
  }
}
```

### GET /configs/:clientId

Returns stored configuration for a client. Returns 404 if no config exists.

### PUT /configs/:clientId

Create or update client configuration. Upserts by `clientId`.

**Request body:**
```json
{
  "stateData": {
    "reportType": "compact",
    "generateCoverPage": false,
    "showBodySummary": true
  },
  "colorObj": {
    "colored": {
      "normal": "#0F9D58",
      "borderline": "#F4B400",
      "high": "#DB4437",
      "low": "#DB4437",
      "critical": "#C26564"
    }
  }
}
```

### POST /configs/:clientId/preview

Returns the **resolved** configuration (defaults merged with client overrides). Use this to preview what will be applied for report generation.

---

## stateData Flags

These flags control report layout and features. Resolution order: **System defaults → Client config (ReportConfig) → Per-request input overrides**.

| Flag | Type | Default | Effect |
|------|------|---------|--------|
| **reportType** | `"compact"` \| `"dynamic"` | `"dynamic"` | Report layout. Compact = summary + profile cards + legend. Dynamic = health score + key abnormals + organ dashboard + full report + AI insights + action plan. |
| **generateCoverPage** | boolean | `true` | Include cover page at start of report. |
| **showBodySummary** | boolean | `true` | Include body summary diagram (compact layout). Requires 3+ mapped profiles. |
| **showSummary** | boolean | `true` | Include summary page (compact layout). |
| **showRecommendations** | boolean | `true` | Include recommendations page (compact layout). |
| **showRiskScore** | boolean | `false` | Include risk score gauges (reserved for future use). |
| **showHistorical** | boolean | `false` | Include historical trend charts (reserved for future use). |
| **showAccreditation** | boolean | `true` | Show NABL/CAP accreditation marks (reserved for future use). |
| **generatePrintPdf** | boolean | `true` | Generate grayscale print variant (reserved for future use). |
| **generateVizApp** | boolean | `false` | Generate VizApp interactive data (reserved for future use). |
| **enableMappingConfig** | boolean | `true` | Use DB-driven parameter mappings (reserved for future use). |
| **enableProfileOrder** | boolean | `false` | Use custom profile ordering (reserved for future use). |
| **enableParameterOrder** | boolean | `false` | Use custom parameter ordering (reserved for future use). |
| **curLang** | string | `"en"` | Primary report language. |
| **fallbackLang** | string | `"en"` | Fallback language when content is missing. |
| **summaryType** | number | - | Summary layout variant (reserved for future use). |

---

## Example: Update Client Config

```bash
curl -X PUT "https://api.example.com/api/v1/configs/remedies" \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "stateData": {
      "reportType": "compact",
      "generateCoverPage": true,
      "showBodySummary": true,
      "showSummary": true,
      "showRecommendations": true
    },
    "colorObj": {
      "colored": {
        "normal": "#0F9D58",
        "borderline": "#F4B400",
        "high": "#DB4437",
        "low": "#DB4437",
        "critical": "#C26564"
      }
    }
  }'
```

---

## Color Scheme

`colorObj.colored` and `colorObj.greyscaled` define hex colors for status indicators:

- **normal** — Within reference range (green)
- **borderline** — Slightly outside range (yellow)
- **high** / **low** — Outside range (red)
- **critical** — Far outside range (dark red)

Replace with client brand colors as needed.
