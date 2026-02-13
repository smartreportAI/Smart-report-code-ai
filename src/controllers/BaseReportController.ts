/**
 * BaseReportController - Base class for all report controllers
 * 
 * Provides common functionality for:
 * - Input processing and validation
 * - Test data transformation
 * - Profile grouping
 * - HTML generation coordination
 */

import { TestReportCondensed, type TestObservation } from '../models/TestReportCondensed';
import { ProfileModel } from '../models/ProfileModel';
import { profileService } from '../services/ProfileService';
import { ClientConfig } from '../models/ClientConfig';
import { clientConfigService } from '../services/ClientConfigService';
import { languageService } from '../i18n/LanguageService';

export interface ReportInput {
  org: string;
  Centre?: string;
  clientId: string;
  reportLang: string;
  WorkOrderID: string;
  LabNo: string;
  PName: string;
  Gender: string;
  Age: string;
  Date: string;
  ReferredBy?: string;
  qrURL?: string;
  hasPastData?: boolean;
  results: Array<{
    Package_name: string;
    Package_book_code?: string;
    investigation: Array<{
      test_name: string;
      test_code?: string;
      SampleType?: string;
      SampleCollDate?: string;
      observations: TestObservation[];
    }>;
  }>;
}

export interface ReportOutput {
  html: string;
  metadata: {
    reportType: string;
    generatedAt: Date;
    patientName: string;
    labNo: string;
    language: string;
    totalTests: number;
    abnormalTests: number;
    profileCount: number;
  };
}

export abstract class BaseReportController {
  protected input: ReportInput;
  protected tests: TestReportCondensed[];
  protected profiles: ProfileModel[];
  protected language: string;
  protected clientConfig: ClientConfig;

  constructor(input: ReportInput) {
    this.input = input;
    this.language = input.reportLang || 'en';
    this.tests = [];
    this.profiles = [];
    this.clientConfig = clientConfigService.getConfig(input.clientId);
  }

  /**
   * Process input and transform to test models
   */
  protected processInput(): void {
    this.tests = [];

    for (const result of this.input.results) {
      for (const investigation of result.investigation || []) {
        for (const observation of investigation.observations || []) {
          const test = new TestReportCondensed(observation, this.language);
          this.tests.push(test);
        }
      }
    }
  }

  /**
   * Group tests into profiles
   */
  protected groupIntoProfiles(): void {
    this.profiles = profileService.groupTestsIntoProfiles(this.tests, this.language);
  }

  /**
   * Get abnormal tests
   */
  protected getAbnormalTests(): TestReportCondensed[] {
    return this.tests.filter(t => t.isAbnormal());
  }

  /**
   * Get abnormal test count
   */
  protected getAbnormalCount(): number {
    return this.getAbnormalTests().length;
  }

  /**
   * Translate a key (i18n)
   */
  protected t(key: string, params?: Record<string, string | number>): string {
    return languageService.t(this.language, key, params);
  }

  /**
   * Get translated status text for a color indicator
   */
  protected getStatusText(indicator: string): string {
    return languageService.getStatusText(this.language, indicator);
  }

  /**
   * Get HTML attributes for language (dir, lang)
   */
  protected getLanguageAttrs(): { dir: string; lang: string; fontLink: string; fontFamily: string } {
    return {
      dir: languageService.getDir(this.language),
      lang: this.language,
      fontLink: languageService.getFontLink(this.language),
      fontFamily: languageService.getFontFamily(this.language)
    };
  }

  /**
   * Generate base CSS styles
   */
  protected getBaseStyles(): string {
    const colors = this.clientConfig.branding.colors;

    return `
      :root {
        --primary: ${colors.primary};
        --secondary: ${colors.secondary};
        --accent: ${colors.accent};
        --success: ${colors.success};
        --warning: ${colors.warning};
        --danger: ${colors.danger};
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: var(--report-font-family, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
        line-height: 1.6;
        color: #333;
        background: #fff;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .page-break {
        page-break-after: always;
      }
      
      /* Header Styles */
      .report-header {
        border-bottom: 3px solid var(--primary);
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      
      .report-title {
        font-size: 28px;
        color: var(--primary);
        margin-bottom: 10px;
      }
      
      .report-subtitle {
        font-size: 16px;
        color: #666;
      }
      
      /* Patient Details */
      .patient-details {
        background: #f5f5f5;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
      }
      
      .patient-details table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .patient-details td {
        padding: 8px;
        border-bottom: 1px solid #ddd;
      }
      
      .patient-details td:first-child {
        font-weight: 600;
        width: 150px;
        color: #555;
      }
      
      /* Profile Section */
      .profile-section {
        margin-bottom: 40px;
        break-inside: avoid;
      }
      
      .profile-header {
        background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 8px 8px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .profile-header.status-normal {
        background: linear-gradient(135deg, var(--success) 0%, #45a049 100%);
      }
      
      .profile-header.status-attention {
        background: linear-gradient(135deg, var(--warning) 0%, #FB8C00 100%);
      }
      
      .profile-header.status-critical {
        background: linear-gradient(135deg, var(--danger) 0%, #E53935 100%);
      }
      
      .profile-name {
        font-size: 20px;
        font-weight: 600;
      }
      
      .profile-summary {
        font-size: 14px;
        opacity: 0.9;
      }
      
      /* Test Table */
      .test-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border-radius: 0 0 8px 8px;
        overflow: hidden;
      }
      
      .test-table thead {
        background: #f8f9fa;
      }
      
      .test-table th {
        padding: 12px;
        text-align: left;
        font-weight: 600;
        color: #555;
        border-bottom: 2px solid #ddd;
      }
      
      .test-table td {
        padding: 12px;
        border-bottom: 1px solid #eee;
      }
      
      .test-table tr:last-child td {
        border-bottom: none;
      }
      
      .test-table tr:hover {
        background: #f8f9fa;
      }
      
      /* Color Indicators */
      .value-normal {
        color: var(--success);
        font-weight: 600;
      }
      
      .value-oneFromNormal {
        color: var(--warning);
        font-weight: 600;
      }
      
      .value-twoFromNormal {
        color: #FF7043;
        font-weight: 600;
      }
      
      .value-threeFromNormal {
        color: var(--danger);
        font-weight: 600;
      }
      
      .value-finalCritical {
        color: #B71C1C;
        font-weight: 700;
      }
      
      /* Status Badge */
      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }
      
      .status-badge.normal {
        background: #E8F5E9;
        color: var(--success);
      }
      
      .status-badge.borderline {
        background: #FFF3E0;
        color: #E65100;
      }
      
      .status-badge.abnormal {
        background: #FFEBEE;
        color: #C62828;
      }
      
      .status-badge.critical {
        background: #B71C1C;
        color: white;
      }
      
      /* Accreditation Badges */
      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        margin-left: 5px;
      }
      
      .badge-nabl {
        background: var(--primary);
        color: white;
      }
      
      .badge-cap {
        background: var(--success);
        color: white;
      }
      
      .badge-ngsp {
        background: var(--accent);
        color: white;
      }
      
      /* Recommendations */
      .recommendations {
        margin-top: 30px;
        padding: 20px;
        background: #FFF9C4;
        border-left: 4px solid var(--warning);
        border-radius: 4px;
      }
      
      .recommendations h3 {
        color: #F57F17;
        margin-bottom: 15px;
      }
      
      .recommendation-item {
        margin-bottom: 15px;
      }
      
      .recommendation-item h4 {
        color: #555;
        margin-bottom: 8px;
      }
      
      .recommendation-item ul {
        margin-left: 20px;
      }
      
      .recommendation-item li {
        margin-bottom: 5px;
        color: #666;
      }
      
      /* Summary */
      .summary {
        margin-top: 30px;
        padding: 20px;
        background: #E3F2FD;
        border-radius: 8px;
      }
      
      .summary h3 {
        color: var(--primary);
        margin-bottom: 15px;
      }
      
      .summary-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
      }
      
      .stat-card {
        background: white;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
      }
      
      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: var(--primary);
      }
      
      .stat-label {
        font-size: 14px;
        color: #666;
        margin-top: 5px;
      }
      
      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        
        .page-break {
          page-break-after: always;
        }
      }
    `;
  }

  /**
   * Generate report HTML (to be implemented by subclasses)
   */
  abstract generateHTML(): string;

  /**
   * Get report type name (to be implemented by subclasses)
   */
  abstract getReportType(): string;

  /**
   * Generate complete report
   */
  async generate(): Promise<ReportOutput> {
    this.processInput();
    this.groupIntoProfiles();

    const html = this.generateHTML();

    return {
      html,
      metadata: {
        reportType: this.getReportType(),
        generatedAt: new Date(),
        patientName: this.input.PName,
        labNo: this.input.LabNo,
        language: this.language,
        totalTests: this.tests.length,
        abnormalTests: this.getAbnormalCount(),
        profileCount: this.profiles.length
      }
    };
  }
}
