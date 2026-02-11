# Report Input JSON Specification

This document describes the JSON structure that LIS (Laboratory Information System) or clients send to generate a PDF report.

**Endpoints:**
- `POST /api/v1/lis/report` — LIS integration (no auth)
- `POST /api/v1/portal/report` — Portal (JWT required)

---

## 1. Recommended (Canonical) Structure

This is the **preferred** format. Use it for new integrations.

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
| **patientName** | string | Yes | Full name of the patient |
| **age** | number | Yes | Age in years (0–120) |
| **gender** | string | Yes | `"male"`, `"female"`, `"m"`, `"f"` |
| **tests** | array | Yes | List of test results (see below) |
| **labNo** | string | No | Lab report/sample number |
| **workOrderId** | string | No | Work order or order ID |
| **org** | string | No | Organisation name |
| **Centre** | string | No | Lab centre name |
| **clientId** | string | No | Client ID for report config (colors, layout). If omitted, defaults are used. |
| **language** | string | No | Report language code (e.g. `"en"`, `"hi"`). Default: `"en"`. |

### Each item in `tests` (Canonical)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **name** | string | Yes | Test/parameter name (e.g. "Haemoglobin", "TSH"). Should match or alias a biomarker in our database. |
| **value** | string or number | Yes | Result value |
| **unit** | string | No | Unit of measure (e.g. "g/dL", "mg/dL") |
| **min** | string or number | No | Reference range minimum (from LIS) |
| **max** | string or number | No | Reference range maximum (from LIS) |
| **id** | string | No | LIS element code / product code |

---

## 2. Alternative Keys We Accept (LIS Compatibility)

The parser accepts **multiple key names** for the same concept so different LIS systems can send their existing payloads.

### Root level (patient / order)

| Concept | Accepted keys (first match wins) |
|---------|----------------------------------|
| Patient name | `patientName`, `PatientName`, `Patient_Name` |
| Age | `age`, `Age`, `AGE` |
| Gender | `gender`, `Gender`, `GENDER`, `Sex` |
| Lab number | `labNo`, `LabNo`, `LabID` |
| Work order | `workOrderId`, `WorkOrderID` |
| Organisation | `org`, `Organisation` |
| Centre | `Centre`, `centre` |

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

## 3. Validation Rules (What We Reject)

- **Test name:** Ignored if empty, `"-"`, `"Gender"`, or longer than 50 characters.
- **Test value:** Ignored if empty or `"-"` or longer than 40 characters.
- Tests that fail these checks are **dropped**; they do not appear in the report.

---

## 4. Minimal Valid Example

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

## 5. Full Example (All Optional Fields)

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

## 6. Response (Success)

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

## 7. Summary: What to Ask Users / LIS

Ask integrators to provide:

1. **Patient:** Full name, age, gender.
2. **Order/Sample:** Lab number, work order ID (if they use it).
3. **Tests:** For each result: **test name**, **value**, **unit**, and optionally **min/max** reference and **element id**.
4. **Optional:** Organisation, centre, clientId (for branding/config), language.

Recommend they use the **canonical** structure above for new integrations; we will continue to accept the **alternative** keys for backward compatibility.
