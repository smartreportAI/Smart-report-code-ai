# Report Input JSON Specification

This document describes the JSON structure that LIS (Laboratory Information System) or clients send to generate a PDF report.

**Endpoints:**
- `POST /api/v1/lis/report` — LIS integration (no auth)
- `POST /api/v1/portal/report` — Portal (JWT required)

---

## 1. Recommended (Canonical) Structure

This is the **preferred** format. It is self-documenting and supports all use cases.

```json
{
  "version": "1.0",
  "clientId": "client_abc",
  "order": {
    "labNo": "LAB-2026-001",
    "workOrderId": "WO-12345",
    "org": "City Hospital",
    "centre": "Main Lab"
  },
  "patient": {
    "name": "Ravi Sharma",
    "age": 35,
    "gender": "male"
  },
  "options": {
    "reportType": "dynamic",
    "language": "en"
  },
  "tests": [
    {
      "name": "Haemoglobin",
      "value": "14.5",
      "unit": "g/dL",
      "min": "13.5",
      "max": "17.5",
      "id": "HB001"
    },
    {
      "name": "Total Cholesterol",
      "value": 220,
      "unit": "mg/dL",
      "min": 0,
      "max": 200
    }
  ]
}
```

### Field Reference (Canonical)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **version** | string | No | Input schema version (e.g. `"1.0"`). Reserved for future use. |
| **clientId** | string | No | Client ID for report config (colors, layout). If omitted, defaults are used. |
| **order** | object | No | Order/sample metadata (see below) |
| **patient** | object | Yes | Patient demographics (see below) |
| **options** | object | No | Report options (see below) |
| **tests** | array | Yes | List of test results (see below) |

### `order` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **labNo** | string | No | Lab report/sample number |
| **workOrderId** | string | No | Work order or order ID |
| **org** | string | No | Organisation name |
| **centre** | string | No | Lab centre name |

### `patient` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **name** | string | Yes | Full name of the patient |
| **age** | number | Yes | Age in years (0–120) |
| **gender** | string | Yes | `"male"`, `"female"`, `"m"`, `"f"` |

### `options` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **reportType** | string | No | `"compact"` or `"dynamic"`. Default: `"dynamic"`. Compact = summary + profile cards + legend. Dynamic = health score + key abnormals + organ dashboard + full report + AI insights + action plan. |
| **language** | string | No | Report language code (e.g. `"en"`, `"hi"`). Default: `"en"`. |

### Each item in `tests`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **name** | string | Yes | Test/parameter name (e.g. "Haemoglobin", "TSH"). Should match or alias a biomarker in our database. |
| **value** | string or number | Yes | Result value |
| **unit** | string | No | Unit of measure (e.g. "g/dL", "mg/dL") |
| **min** | string or number | No | Reference range minimum (from LIS) |
| **max** | string or number | No | Reference range maximum (from LIS) |
| **id** | string | No | LIS element code / product code |

---

## 2. Legacy (Flat) Structure & Migration

The parser accepts both the **canonical nested structure** and the **legacy flat structure** for backward compatibility.

### Legacy flat format (still supported)

```json
{
  "patientName": "Ravi Sharma",
  "age": 35,
  "gender": "male",
  "labNo": "LAB-2026-001",
  "workOrderId": "WO-12345",
  "org": "City Hospital",
  "Centre": "Main Lab",
  "clientId": "client_abc",
  "language": "en",
  "reportType": "dynamic",
  "tests": [ ... ]
}
```

### Migration: Flat to Canonical

| Flat key | Canonical equivalent |
|----------|----------------------|
| `patientName` | `patient.name` |
| `age` | `patient.age` |
| `gender` | `patient.gender` |
| `labNo` | `order.labNo` |
| `workOrderId` | `order.workOrderId` |
| `org` | `order.org` |
| `Centre` | `order.centre` |
| `reportType` | `options.reportType` |
| `language` | `options.language` |

---

## 3. Alternative Keys We Accept (LIS Compatibility)

The parser accepts **multiple key names** for the same concept so different LIS systems can send their existing payloads.

### Root level / patient / order

| Concept | Canonical | Alternative keys (first match wins) |
|---------|-----------|-------------------------------------|
| Patient name | `patient.name` | `patientName`, `PatientName`, `Patient_Name` |
| Age | `patient.age` | `age`, `Age`, `AGE` |
| Gender | `patient.gender` | `gender`, `Gender`, `GENDER`, `Sex` |
| Lab number | `order.labNo` | `labNo`, `LabNo`, `LabID` |
| Work order | `order.workOrderId` | `workOrderId`, `WorkOrderID` |
| Organisation | `order.org` | `org`, `Organisation` |
| Centre | `order.centre` | `Centre`, `centre` |
| Report type | `options.reportType` | `reportType`, `ReportType`, `report_type` |
| Client ID | `clientId` | `ClientId` |

### Where are the tests?

- **Preferred:** `tests` or `Tests` at root.
- **Alternative:** If root has `data` as an array, we use the **first element** of `data` as the root and then look for `tests`/`Tests` there.
- **Alternative:** If root has `results` as an array, we collect tests from each result’s `tests` or `Tests` and merge them into one list.

So both of these are valid:

**Format A — tests at root**
```json
{
  "patientName": "John",
  "age": 30,
  "gender": "male",
  "tests": [ ... ]
}
```

**Format B — wrapped in data**
```json
{
  "data": [
    {
      "patientName": "John",
      "age": 30,
      "gender": "male",
      "tests": [ ... ]
    }
  ]
}
```

**Format C — results array**
```json
{
  "patientName": "John",
  "age": 30,
  "gender": "male",
  "results": [
    { "tests": [ { "name": "Hb", "value": "14", "unit": "g/dL" } ] },
    { "tests": [ { "name": "Glucose", "value": "95", "unit": "mg/dL" } ] }
  ]
}
```

### Each test item (alternative keys)

| Concept | Accepted keys |
|---------|----------------|
| Test name | `name`, `Name`, `ELEMENT_NAME`, `ELEMENT_NAME_ORIGINAL` |
| Result value | `value`, `Value`, `result`, `RESULT` |
| Unit | `unit`, `Unit`, `measurement_unit`, `UOM` |
| Min reference | `min`, `minParameterValue`, or `references[0].min` |
| Max reference | `max`, `maxParameterValue`, or `references[0].max` |
| Element ID | `id`, `ELEMENT_CODE`, `PRODUCT_CODE` |

**Example — LIS-style test object**
```json
{
  "ELEMENT_NAME": "Haemoglobin",
  "RESULT": "14.5",
  "UOM": "g/dL",
  "minParameterValue": 13.5,
  "maxParameterValue": 17.5,
  "ELEMENT_CODE": "HB001"
}
```

---

## 4. Validation Rules (What We Reject)

- **Test name:** Ignored if empty, `"-"`, `"Gender"`, or longer than 50 characters.
- **Test value:** Ignored if empty or `"-"` or longer than 40 characters.
- Tests that fail these checks are **dropped**; they do not appear in the report.

---

## 5. Minimal Valid Example

Smallest valid body (all optional fields omitted):

```json
{
  "patientName": "Patient One",
  "age": 25,
  "gender": "female",
  "tests": [
    { "name": "Haemoglobin", "value": "12.0", "unit": "g/dL" }
  ]
}
```

---

## 6. Full Example (Canonical with All Optional Fields)

```json
{
  "version": "1.0",
  "clientId": "client_abc",
  "order": {
    "labNo": "LAB-2026-001",
    "workOrderId": "WO-12345",
    "org": "City Hospital",
    "centre": "Main Lab"
  },
  "patient": {
    "name": "Ravi Sharma",
    "age": 35,
    "gender": "male"
  },
  "options": {
    "reportType": "dynamic",
    "language": "en"
  },
  "tests": [
    {
      "name": "Haemoglobin",
      "value": "14.5",
      "unit": "g/dL",
      "min": "13.5",
      "max": "17.5",
      "id": "HB001"
    },
    {
      "name": "Total Cholesterol",
      "value": 220,
      "unit": "mg/dL",
      "min": 0,
      "max": 200
    },
    {
      "name": "TSH",
      "value": "2.5",
      "unit": "mIU/L",
      "min": "0.4",
      "max": "4.0"
    }
  ]
}
```

---

## 7. Response (Success)

```json
{
  "reportId": "550e8400-e29b-41d4-a716-446655440000",
  "pdfUrl": "/reports/550e8400-e29b-41d4-a716-446655440000.pdf",
  "testCount": 17,
  "profileCount": 8,
  "insightCount": 4
}
```

- **reportId:** Use this to fetch metadata or download the PDF.
- **pdfUrl:** Relative URL to download the PDF (e.g. `GET {baseUrl}/reports/550e8400-e29b-41d4-a716-446655440000.pdf`).

---

## 8. Summary: What to Ask Users / LIS

Ask integrators to provide:

1. **Patient:** Full name, age, gender.
2. **Order/Sample:** Lab number, work order ID (if they use it).
3. **Tests:** For each result: **test name**, **value**, **unit**, and optionally **min/max** reference and **element id**.
4. **Optional:** Organisation, centre, clientId (for branding/config), language.

Recommend they use the **canonical** structure above for new integrations; we will continue to accept the **alternative** keys for backward compatibility.

---

## 9. Report Configuration

Client-specific report behavior (report type, cover page, body summary, colors, etc.) is controlled via the **Report Configuration API**. See [Report-Config-API.md](Report-Config-API.md) for details.

When `clientId` is provided in the request, the system loads that client's configuration from the database and merges it with system defaults. Per-request overrides (e.g. `options.reportType`) take precedence over stored config.
