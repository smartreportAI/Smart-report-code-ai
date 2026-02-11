# 📘 Document 2: Technical Architecture & Codebase Design

## Remedies – Next Generation Platform

**Version:** 2.0 | **Last Updated:** February 11, 2026 | **Status:** Architectural Blueprint

---

## Table of Contents

1. [Recommended Technology Stack](#1-recommended-technology-stack)
2. [Folder Structure & Code Organization](#2-folder-structure--code-organization)
3. [Naming Conventions & Coding Standards](#3-naming-conventions--coding-standards)
4. [Module Architecture & Component Design](#4-module-architecture--component-design)
5. [Performance & Scalability Strategy](#5-performance--scalability-strategy)
6. [DevOps & CI/CD Recommendations](#6-devops--cicd-recommendations)
7. [Security Best Practices](#7-security-best-practices)
8. [Logging, Monitoring & Observability](#8-logging-monitoring--observability)
9. [Developer Onboarding Guide](#9-developer-onboarding-guide)
10. [Migration Strategy](#10-migration-strategy)

---

## 1. Recommended Technology Stack

### 1.1 Current vs. Proposed Stack

| Layer | Current | Proposed | Rationale |
|-------|---------|----------|-----------|
| **Runtime** | Node.js 14/16 | Node.js 20 LTS → 22 LTS | Long-term support, native ESM, performance |
| **Language** | JavaScript (CommonJS) | TypeScript 5.x (ESM) | Type safety eliminates 60%+ of runtime errors |
| **Framework** | None (raw Lambda handler) | Fastify + @fastify/aws-lambda | High-performance, schema validation, plugin arch |
| **PDF Engine** | Puppeteer + chrome-aws-lambda | Playwright + @playwright/browser-chromium | Better Lambda support, faster, actively maintained |
| **Template** | String concatenation | Handlebars / React-PDF | Composable, previewable, testable templates |
| **Database** | MongoDB (via smartreport pkg) | MongoDB 7+ with Mongoose 8 ODM | Schema enforcement, lean queries, middleware |
| **Cache** | None | Redis 7 (via AWS ElastiCache) | Sub-ms config lookups, session management |
| **Queue** | AWS SQS (basic) | BullMQ on Redis | Priority queues, retry, rate limiting, dashboard |
| **Validation** | Manual checks | Zod 3.x | Runtime type validation with TypeScript inference |
| **Testing** | Jest (minimal) | Vitest + Playwright Test | Faster, native ESM, component + E2E testing |
| **Linting** | ESLint (basic) | ESLint 9 flat config + Prettier | Consistent code style across team |
| **Monitoring** | console.log | Pino logger + Datadog/Sentry | Structured JSON logging, APM, error tracking |
| **CI/CD** | GitLab CI | GitLab CI (enhanced) | Multi-stage with quality gates |
| **IaC** | Manual AWS Console | AWS CDK v2 (TypeScript) | Infrastructure as code, reproducible deployments |
| **Charting** | Chart.js + ECharts | Chart.js 4 + D3.js (SVG) | Better PDF rendering, smaller bundle |
| **Image Processing** | Jimp | Sharp | 10x faster, lower memory, better format support |

### 1.2 Backend Stack Details

```
Node.js 20 LTS
├── TypeScript 5.x (strict mode)
├── Fastify 4.x (HTTP framework)
│   ├── @fastify/aws-lambda (Lambda adapter)
│   ├── @fastify/cors
│   ├── @fastify/rate-limit
│   └── @fastify/jwt
├── Mongoose 8.x (MongoDB ODM)
├── ioredis 5.x (Redis client)
├── BullMQ 5.x (Job queue)
├── Zod 3.x (Schema validation)
├── Pino 8.x (Structured logging)
├── Playwright 1.x (PDF rendering)
├── Handlebars 4.x (HTML templates)
├── Sharp 0.33.x (Image processing)
├── Chart.js 4.x + chartjs-node-canvas
├── pdf-lib 1.x (PDF manipulation)
└── dayjs 1.x (Date handling)
```

### 1.3 Frontend Stack (Admin Portal)

```
Next.js 14+ (App Router)
├── React 18+
├── TypeScript 5.x
├── Tailwind CSS 3.x
├── Radix UI (Accessible components)
├── TanStack Query (Data fetching)
├── Zustand (State management)
├── React Hook Form + Zod
└── Recharts (Analytics charts)
```

### 1.4 Infrastructure

```
AWS (Primary Cloud)
├── Lambda (Report generation)
├── API Gateway v2 (HTTP API)
├── S3 (Report storage + assets)
├── ElastiCache Redis (Caching)
├── SQS (Async processing)
├── CloudWatch (Logs + Metrics)
├── Secrets Manager (Credentials)
├── CDK v2 (Infrastructure as Code)
└── CloudFront (Asset CDN)

MongoDB Atlas (Database)
├── M30+ cluster (Production)
├── M10 (Staging)
└── M0/Free (Development)
```

---

## 2. Folder Structure & Code Organization

### 2.1 Current Structure (Problems)

```
remedies/                    ← Flat, unorganized
├── index.js                 ← Lambda handler (427 lines, mixed concerns)
├── niro.js                  ← Core engine (2,679 lines, massive monolith)
├── client/
│   ├── state.js             ← Global mutable state (1,038 lines, 120+ flags)
│   ├── utils.js             ← Utility grab-bag (1,368 lines, 56 functions)
│   └── mapping.js           ← Parameter mapping (976 lines)
├── common/                  ← Shared utilities (no clear boundaries)
│   ├── generateProfiles.js  ← Profile generation (55KB)
│   ├── generateCoverPage.js ← Cover page (44KB)
│   ├── generatePatientDetails.js ← Patient details (47KB)
│   └── ... (20 files)
├── controllers/             ← Thin controllers (barely used)
├── models/                  ← Data models (heavily coupled)
├── views/                   ← HTML generators (string concatenation)
├── Test/                    ← NOT tests — biomarker database!
│   ├── testsDatabase.js     ← 988KB single file (!)
│   ├── profileBaseDynamic.js← 266KB profile definitions
│   └── testsContentBase.js  ← 299KB test content
└── .env                     ← Credentials in plaintext
```

### 2.2 Proposed Structure

```
remedies-v2/
├── src/
│   ├── index.ts                           # Application entry point
│   ├── app.ts                             # Fastify app factory
│   ├── lambda.ts                          # AWS Lambda handler adapter
│   │
│   ├── config/                            # Configuration management
│   │   ├── index.ts                       # Config loader & validator
│   │   ├── env.ts                         # Environment variable schema (Zod)
│   │   ├── defaults.ts                    # Default configuration values
│   │   └── types.ts                       # Config type definitions
│   │
│   ├── api/                               # API layer (routes + handlers)
│   │   ├── routes/
│   │   │   ├── report.routes.ts           # POST /api/v1/reports
│   │   │   ├── health.routes.ts           # GET /api/v1/health
│   │   │   ├── config.routes.ts           # Client config CRUD
│   │   │   └── webhook.routes.ts          # Webhook management
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts          # JWT + API key authentication
│   │   │   ├── rate-limit.middleware.ts    # Per-client rate limiting
│   │   │   ├── validate.middleware.ts      # Request schema validation
│   │   │   └── error-handler.middleware.ts # Global error handling
│   │   └── schemas/
│   │       ├── report-input.schema.ts     # Input JSON validation (Zod)
│   │       ├── report-output.schema.ts    # Response shape validation
│   │       └── client-config.schema.ts    # Config validation
│   │
│   ├── core/                              # Core business logic (PURE)
│   │   ├── context/
│   │   │   ├── ReportContext.ts           # Immutable request-scoped context
│   │   │   └── ContextBuilder.ts          # Builds context from config + input
│   │   ├── mapping/
│   │   │   ├── ParameterMapper.ts         # Input name → standard biomarker
│   │   │   ├── ProfileMapper.ts           # Biomarker → health profile
│   │   │   ├── RangeResolver.ts           # Gender/age reference range lookup
│   │   │   └── ColorClassifier.ts         # Value → color indicator
│   │   ├── models/
│   │   │   ├── Biomarker.ts               # Biomarker entity
│   │   │   ├── TestResult.ts              # Single test result model
│   │   │   ├── Profile.ts                 # Profile aggregate model
│   │   │   ├── Report.ts                  # Complete report model
│   │   │   └── RiskScore.ts               # Risk score calculator
│   │   ├── pipeline/
│   │   │   ├── ReportPipeline.ts          # Orchestrates the generation pipeline
│   │   │   ├── steps/
│   │   │   │   ├── ParseInputStep.ts      # Step 1: Parse & normalize input
│   │   │   │   ├── MapParametersStep.ts   # Step 2: Map to standard names
│   │   │   │   ├── ResolveRangesStep.ts   # Step 3: Calculate ranges & colors
│   │   │   │   ├── GroupProfilesStep.ts   # Step 4: Assign profiles
│   │   │   │   ├── EnrichContentStep.ts   # Step 5: Add tips & recommendations
│   │   │   │   ├── RenderHtmlStep.ts      # Step 6: Generate HTML
│   │   │   │   ├── GeneratePdfStep.ts     # Step 7: HTML → PDF
│   │   │   │   └── DeliverStep.ts         # Step 8: Upload & dispatch
│   │   │   └── PipelineStep.ts            # Base step interface
│   │   └── types/
│   │       ├── input.types.ts             # Input JSON type definitions
│   │       ├── report.types.ts            # Report data types
│   │       └── config.types.ts            # Client config types
│   │
│   ├── templates/                         # Report templates (Handlebars)
│   │   ├── layouts/
│   │   │   ├── compact.hbs                # Compact report layout
│   │   │   ├── advanced.hbs               # Advanced report layout
│   │   │   ├── hybrid.hbs                 # Hybrid layout
│   │   │   └── summary.hbs               # Summary layout
│   │   ├── partials/
│   │   │   ├── patient-header.hbs         # Patient details partial
│   │   │   ├── profile-card.hbs           # Profile card partial
│   │   │   ├── test-slider.hbs            # Slider visualization
│   │   │   ├── range-table.hbs            # Reference range table
│   │   │   ├── body-summary.hbs           # Body diagram
│   │   │   ├── cover-page.hbs             # Cover page
│   │   │   ├── risk-score.hbs             # Risk score card
│   │   │   ├── recommendations.hbs        # Recommendations page
│   │   │   └── legend.hbs                 # Color legend
│   │   ├── styles/
│   │   │   ├── base.css                   # Core styles
│   │   │   ├── compact.css                # Compact-specific styles
│   │   │   └── print.css                  # Grayscale print styles
│   │   └── helpers/
│   │       ├── color.helpers.ts           # Color template helpers
│   │       └── i18n.helpers.ts            # Translation helpers
│   │
│   ├── services/                          # External service integrations
│   │   ├── database/
│   │   │   ├── mongodb.service.ts         # MongoDB connection & queries
│   │   │   ├── redis.service.ts           # Redis cache operations
│   │   │   └── repositories/
│   │   │       ├── client.repository.ts   # Client CRUD
│   │   │       ├── biomarker.repository.ts# Biomarker CRUD
│   │   │       ├── report.repository.ts   # Report metadata CRUD
│   │   │       └── billing.repository.ts  # Billing operations
│   │   ├── storage/
│   │   │   ├── s3.service.ts              # S3 upload/download
│   │   │   └── asset.service.ts           # Brand asset management
│   │   ├── delivery/
│   │   │   ├── webhook.service.ts         # HTTP callback dispatch
│   │   │   ├── whatsapp.service.ts        # WhatsApp delivery
│   │   │   └── email.service.ts           # Email delivery
│   │   ├── pdf/
│   │   │   ├── browser.service.ts         # Playwright browser management
│   │   │   ├── pdf-generator.service.ts   # HTML → PDF conversion
│   │   │   └── pdf-merger.service.ts      # Multi-page PDF assembly
│   │   └── charts/
│   │       ├── chart-renderer.service.ts  # Chart.js server-side rendering
│   │       └── chart-configs/
│   │           ├── trend.chart.ts         # Historical trend chart config
│   │           └── risk.chart.ts          # Risk score chart config
│   │
│   ├── i18n/                              # Internationalization
│   │   ├── index.ts                       # i18n manager
│   │   ├── en.json                        # English translations
│   │   ├── hi.json                        # Hindi translations
│   │   ├── ar.json                        # Arabic translations
│   │   └── cz.json                        # Czech translations
│   │
│   └── utils/                             # Pure utility functions
│       ├── logger.ts                      # Pino logger setup
│       ├── crypto.ts                      # Hashing, password generation
│       ├── date.ts                        # Date formatting
│       ├── string.ts                      # String manipulation
│       └── validation.ts                  # Common validators
│
├── tests/
│   ├── unit/
│   │   ├── core/mapping/                  # Mapper unit tests
│   │   ├── core/models/                   # Model unit tests
│   │   └── core/pipeline/                 # Pipeline step tests
│   ├── integration/
│   │   ├── api/                           # API endpoint tests
│   │   └── services/                      # Service integration tests
│   ├── e2e/
│   │   └── report-generation.test.ts      # Full pipeline E2E tests
│   ├── fixtures/
│   │   ├── input-jsons/                   # Sample input JSONs per client
│   │   └── expected-outputs/              # Golden PDF snapshots
│   └── helpers/
│       ├── test-context.ts                # Test context factory
│       └── mock-services.ts              # Service mocks
│
├── scripts/
│   ├── seed-biomarkers.ts                 # Seed biomarker DB from legacy files
│   ├── migrate-client-configs.ts          # Extract configs from niro.js if-blocks
│   └── benchmark.ts                       # Performance benchmarking
│
├── infrastructure/
│   ├── cdk/
│   │   ├── stacks/
│   │   │   ├── api-stack.ts               # API Gateway + Lambda
│   │   │   ├── storage-stack.ts           # S3 buckets
│   │   │   ├── cache-stack.ts             # ElastiCache Redis
│   │   │   └── monitoring-stack.ts        # CloudWatch dashboards
│   │   └── app.ts                         # CDK app entry
│   └── docker/
│       ├── Dockerfile                     # Lambda container image
│       └── docker-compose.yml             # Local dev environment
│
├── docs/                                  # Documentation
│   ├── api/                               # Auto-generated API docs
│   ├── architecture/                      # Architecture decision records
│   └── onboarding/                        # Developer onboarding guides
│
├── tsconfig.json
├── package.json
├── vitest.config.ts
├── eslint.config.mjs
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. Naming Conventions & Coding Standards

### 3.1 File Naming

| Type | Convention | Example |
|------|-----------|---------|
| **TypeScript files** | `kebab-case.ts` | `report-context.ts` |
| **Classes** | `PascalCase.ts` | `ReportPipeline.ts` |
| **Tests** | `*.test.ts` / `*.spec.ts` | `parameter-mapper.test.ts` |
| **Templates** | `kebab-case.hbs` | `patient-header.hbs` |
| **Config/Env** | `SCREAMING_SNAKE_CASE` | `MONGODB_URI`, `REDIS_URL` |

### 3.2 Code Naming

| Element | Convention | Example |
|---------|-----------|---------|
| **Classes** | PascalCase | `class ReportContext {}` |
| **Interfaces** | PascalCase (no `I` prefix) | `interface ClientConfig {}` |
| **Functions** | camelCase | `function resolveRanges() {}` |
| **Constants** | SCREAMING_SNAKE_CASE | `const MAX_RETRIES = 3` |
| **Enums** | PascalCase (values: PascalCase) | `enum ReportType { Compact, Advanced }` |
| **Type aliases** | PascalCase | `type ColorIndicator = 'normal' \| 'high'` |
| **Variables** | camelCase | `const clientConfig = ...` |
| **Private members** | camelCase (no underscore) | `private readonly context: ReportContext` |

### 3.3 Coding Standards

```typescript
// ✅ DO: Use strict TypeScript
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}

// ✅ DO: Use branded types for domain concepts
type LabNumber = string & { readonly __brand: 'LabNumber' };
type BiomarkerId = string & { readonly __brand: 'BiomarkerId' };

// ✅ DO: Use Result type instead of throwing
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// ✅ DO: Use dependency injection
class ReportPipeline {
  constructor(
    private readonly configService: ConfigService,
    private readonly pdfService: PdfService,
    private readonly logger: Logger
  ) {}
}

// ❌ DON'T: Use global mutable state
// ❌ DON'T: Use `any` type
// ❌ DON'T: Use string concatenation for HTML
// ❌ DON'T: Put client-specific logic in core code
```

---

## 4. Module Architecture & Component Design

### 4.1 Core Design Pattern: Pipeline

The report generation engine uses a **Pipeline pattern** where each step transforms the data:

```
Input JSON → [Parse] → [Map] → [Resolve] → [Group] → [Enrich] → [Render] → [PDF] → [Deliver]
```

```typescript
// Pipeline Step Interface
interface PipelineStep<TInput, TOutput> {
  name: string;
  execute(input: TInput, context: ReportContext): Promise<TOutput>;
}

// Pipeline Orchestrator
class ReportPipeline {
  async generate(rawInput: unknown): Promise<ReportOutput> {
    const context = await this.contextBuilder.build(rawInput);
    
    const parsed   = await this.parseStep.execute(rawInput, context);
    const mapped   = await this.mapStep.execute(parsed, context);
    const resolved = await this.resolveStep.execute(mapped, context);
    const grouped  = await this.groupStep.execute(resolved, context);
    const enriched = await this.enrichStep.execute(grouped, context);
    const html     = await this.renderStep.execute(enriched, context);
    const pdf      = await this.pdfStep.execute(html, context);
    const result   = await this.deliverStep.execute(pdf, context);
    
    return result;
  }
}
```

### 4.2 ReportContext (Replaces Global State)

```typescript
// IMMUTABLE, request-scoped — replaces mutable stateVariable
class ReportContext {
  readonly clientId: string;
  readonly reportType: ReportType;
  readonly language: Language;
  readonly features: FeatureFlags;
  readonly theme: ThemeConfig;
  readonly mappings: MappingConfig;
  readonly delivery: DeliveryConfig;
  
  // Built once per request, never mutated
  static async build(
    input: ParsedInput,
    clientConfig: ClientConfig,
    reportConfig: ReportConfig
  ): Promise<ReportContext> {
    return new ReportContext({
      clientId: input.org,
      reportType: clientConfig.reportType ?? 'dynamic',
      language: input.reportLang ?? clientConfig.defaultLanguage ?? 'en',
      features: { ...DEFAULT_FEATURES, ...clientConfig.features },
      theme: { ...DEFAULT_THEME, ...clientConfig.theme },
      mappings: clientConfig.mappings,
      delivery: clientConfig.delivery,
    });
  }
}
```

### 4.3 Configuration-Driven Client Behavior

Instead of if-blocks in code, all client behavior lives in MongoDB:

```json
{
  "clientId": "remedies",
  "displayName": "Remedies Diagnostics",
  "features": {
    "reportType": "compact",
    "generateCoverPage": true,
    "showBodySummary": true,
    "showRiskScore": false,
    "showHistorical": true,
    "showRecommendations": true,
    "generatePrintPdf": true,
    "generateVizApp": true
  },
  "theme": {
    "headingColor": "#2563eb",
    "colorScheme": {
      "normal": "#0F9D58",
      "borderline": "#F4B400",
      "high": "#DB4437",
      "low": "#DB4437",
      "critical": "#C26564"
    },
    "fontFamily": "Nunito Sans",
    "coverPageImage": "s3://assets/remedies/cover.png"
  },
  "mappings": {
    "idMapping": { "HB001": "NGPM0314" },
    "profileMapping": { "CBC": "Complete Blood Count" }
  }
}
```

---

## 5. Performance & Scalability Strategy

### 5.1 Performance Targets

| Metric | Current | Target | Strategy |
|--------|---------|--------|----------|
| **Report Generation** | 15-30s | <5s (p95) | Browser pooling, template pre-compilation, parallel processing |
| **Cold Start** | 8-12s | <3s | Lambda SnapStart, smaller bundle, lazy imports |
| **Config Fetch** | 500-800ms | <10ms | Redis cache with 5-min TTL |
| **PDF Size** | 2-8MB | 1-4MB | Image optimization, font subsetting |
| **Concurrent Requests** | ~10 | ~100+ | Lambda concurrency + SQS buffering |
| **Memory Usage** | 512MB-1GB | <512MB | Sharp over Jimp, stream processing |

### 5.2 Caching Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    CACHING LAYERS                        │
│                                                         │
│  L1: In-Memory (Lambda instance)                        │
│  ├── Compiled Handlebars templates  (TTL: instance life) │
│  ├── Font file buffers              (TTL: instance life) │
│  └── Static biomarker lookups       (TTL: instance life) │
│                                                         │
│  L2: Redis (ElastiCache)                                │
│  ├── Client configs       (TTL: 5 minutes)              │
│  ├── Biomarker database   (TTL: 1 hour)                 │
│  ├── Profile definitions  (TTL: 1 hour)                 │
│  ├── Compiled templates   (TTL: 30 minutes)             │
│  └── Rate limit counters  (TTL: per window)             │
│                                                         │
│  L3: MongoDB (Source of Truth)                          │
│  └── All configuration and content data                 │
│                                                         │
│  Cache Invalidation:                                    │
│  • Config update API → Redis DEL key                    │
│  • MongoDB Change Streams → auto-invalidate             │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Database Indexing Strategy

```javascript
// Key indexes for MongoDB collections
// clients collection
{ "clientId": 1 }                          // unique
{ "subscription.status": 1, "clientId": 1 } // active client lookups

// biomarkers collection  
{ "standardName": 1 }                      // unique
{ "aliases": 1 }                           // name mapping lookups
{ "profiles": 1 }                          // profile grouping

// reports collection
{ "clientId": 1, "labNo": 1 }             // duplicate prevention
{ "createdAt": 1 }                         // TTL index for cleanup
{ "clientId": 1, "createdAt": -1 }        // client report history

// billing collection
{ "clientId": 1, "month": 1 }             // monthly aggregation
```

### 5.4 Horizontal Scaling

```
                    ┌─────────────┐
                    │ API Gateway  │
                    │ (throttling) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
         │ Lambda  │  │ Lambda  │  │ Lambda  │
         │ Instance│  │ Instance│  │ Instance│
         │   #1    │  │   #2    │  │   #N    │
         └────┬────┘  └────┬────┘  └────┬────┘
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
         │  Redis  │  │ MongoDB │  │   S3    │
         │ Cluster │  │ Atlas   │  │         │
         └─────────┘  └─────────┘  └─────────┘
         
Lambda Concurrency:
  • Reserved: 50 (guaranteed minimum)
  • Provisioned: 10 (warm instances for low latency)
  • Burst: 500 (handle traffic spikes)
```

---

## 6. DevOps & CI/CD Recommendations

### 6.1 Pipeline Architecture

```yaml
# .gitlab-ci.yml (Enhanced)
stages:
  - validate      # Lint, type-check, schema validation
  - test          # Unit, integration, E2E tests
  - build         # TypeScript compile, bundle
  - security      # Dependency audit, SAST scan
  - staging       # Deploy to staging environment
  - approval      # Manual approval gate
  - production    # Deploy to production

validate:
  script:
    - npm run lint
    - npm run type-check
    - npm run validate:schemas

test:
  script:
    - npm run test:unit -- --coverage
    - npm run test:integration
  coverage: '/All files\s*\|\s*(\d+\.?\d*)\%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  script:
    - npm run build
    - npm run bundle  # esbuild for Lambda
  artifacts:
    paths:
      - dist/

deploy:production:
  stage: production
  when: manual
  script:
    - npx cdk deploy --all --require-approval never
  environment:
    name: production
```

### 6.2 Environment Management

| Environment | Purpose | Infrastructure |
|-------------|---------|---------------|
| **local** | Developer machine | Docker Compose (MongoDB + Redis) |
| **dev** | Feature development | Shared Lambda, dev MongoDB |
| **staging** | Pre-production testing | Mirrors production infra |
| **production** | Live traffic | Full HA setup |

---

## 7. Security Best Practices

### 7.1 Authentication & Authorization

```typescript
// Multi-layer auth strategy
const authMiddleware = async (request, reply) => {
  // Layer 1: API Key (for machine-to-machine)
  const apiKey = request.headers['x-api-key'];
  if (apiKey) return validateApiKey(apiKey);
  
  // Layer 2: JWT (for portal/dashboard)
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (token) return validateJwt(token);
  
  throw new UnauthorizedError('Missing authentication');
};
```

### 7.2 Data Protection

- **Secrets**: AWS Secrets Manager (never `.env` files in production)
- **PII Encryption**: Patient names and data encrypted at field level
- **Input Sanitization**: All JSON input validated with Zod schemas
- **Output Sanitization**: HTML templates auto-escaped by Handlebars
- **CORS**: Strict origin whitelist per environment
- **Rate Limiting**: Per-client, per-minute request limits

---

## 8. Logging, Monitoring & Observability

### 8.1 Structured Logging

```typescript
// Pino structured logging
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  serializers: { err: pino.stdSerializers.err },
  redact: ['input.PatientName', 'input.Age', 'input.Gender'], // PII redaction
});

// Usage
logger.info({ clientId, labNo, reportType, duration }, 'Report generated');
logger.error({ clientId, labNo, err }, 'Report generation failed');
```

### 8.2 Key Metrics to Track

| Metric | Type | Alert Threshold |
|--------|------|-----------------|
| Report generation duration | Histogram | p95 > 10s |
| Error rate per client | Counter | > 5% in 5min |
| Cache hit ratio | Gauge | < 80% |
| Lambda cold starts | Counter | > 20% of invocations |
| PDF file size | Histogram | > 10MB |
| Queue depth | Gauge | > 100 pending |

---

## 9. Developer Onboarding Guide

### 9.1 Prerequisites

- Node.js 20 LTS
- Docker Desktop
- MongoDB Compass
- VS Code with extensions: ESLint, Prettier, TypeScript

### 9.2 Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd remedies-v2
npm install

# 2. Start local services
docker-compose up -d  # MongoDB + Redis

# 3. Seed biomarker database
npm run seed:biomarkers

# 4. Configure environment  
cp .env.example .env
# Edit .env with local MongoDB/Redis URLs

# 5. Run tests
npm test

# 6. Start development server
npm run dev

# 7. Generate a test report
curl -X POST http://localhost:3000/api/v1/reports \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key" \
  -d @tests/fixtures/input-jsons/sample-cbc.json
```

### 9.3 Key Concepts for New Developers

1. **ReportContext**: Immutable config object built per request — never mutate it
2. **Pipeline Steps**: Each step has a single responsibility, transforms data, returns result
3. **Configuration > Code**: Client behavior differences live in MongoDB, not if-blocks
4. **Templates**: All HTML is in `.hbs` files, not string concatenation in JS
5. **Type Safety**: If TypeScript complains, fix the type — don't use `as any`

---

## 10. Migration Strategy

### 10.1 Phased Migration Plan

```
Phase 1 (Month 1-2): Foundation
├── Set up TypeScript project with new folder structure
├── Create ReportContext and Pipeline framework
├── Migrate biomarker database to MongoDB
└── Implement Redis caching layer

Phase 2 (Month 3-4): Core Engine
├── Port ParameterMapper from utils.js
├── Port ProfileMapper from generateProfiles.js  
├── Port RangeResolver from baseModel.js
├── Convert templates from JS strings to Handlebars
└── Implement PDF generation with Playwright

Phase 3 (Month 5-6): Client Migration
├── Extract client configs from niro.js if-blocks to MongoDB
├── Migrate 5 pilot clients to new engine
├── Run A/B comparison (legacy vs new output)
└── Fix edge cases and visual regressions

Phase 4 (Month 7-8): Full Migration
├── Migrate remaining 45+ clients
├── Deploy new CI/CD pipeline
├── Implement monitoring and alerting
└── Decommission legacy Lambda functions

Phase 5 (Month 9+): Enhancement
├── AI-powered insights
├── Self-service onboarding portal
├── Template designer
└── Analytics dashboard
```

### 10.2 Coexistence Strategy

During migration, both systems run simultaneously:

```
API Gateway
├── /v1/reports → Legacy Lambda (existing clients)
└── /v2/reports → New Lambda (migrated clients)

Shadow Mode:
  • New engine processes same input as legacy
  • Outputs compared automatically  
  • Discrepancies logged for investigation
  • Client switched only after 100% match
```

---

*For database schemas and API specifications, refer to **Document 3: Backend System Design & Data Architecture**.*
