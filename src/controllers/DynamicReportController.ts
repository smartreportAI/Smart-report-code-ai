/**
 * DynamicReportController - Generates detailed dynamic reports
 * 
 * Features:
 * - Full test descriptions
 * - Detailed explanations
 * - Recommendations for abnormal tests
 * - Patient-facing format
 * - Rich visualizations
 * - Client branding and customization
 */

import { BaseReportController } from './BaseReportController';
import { analyticsService } from '../services/AnalyticsService';
import { RiskScoreVisualizer } from '../visualization/RiskScoreVisualizer';

export class DynamicReportController extends BaseReportController {
  getReportType(): string {
    return 'dynamic';
  }

  generateHTML(): string {
    const { features } = this.clientConfig;

    let html = this.generateHeader();

    if (features.showCoverPage) {
      html += this.generateCoverPage();
    } else {
      html += this.generateSimpleHeader();
    }

    html += this.generatePatientDetails();
    html += this.generateTestResults();

    // Only add recommendations if enabled and there are abnormal tests
    if (features.showRecommendations && this.getAbnormalCount() > 0) {
      html += this.generateRecommendations();
    }

    if (features.showAnalytics) {
      html += this.generateAnalytics();
    }

    if (features.showSummaryStats) {
      html += this.generateSummary();
    }

    html += this.generateFooter();

    return html;
  }

  private generateHeader(): string {
    const { dir, lang, fontLink, fontFamily } = this.getLanguageAttrs();
    return `
      <!DOCTYPE html>
      <html lang="${lang}" dir="${dir}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${fontLink}
        <title>${this.t('report.title')} - ${this.input.PName}</title>
        <style>
          :root { --report-font-family: ${fontFamily}; }
          ${this.getBaseStyles()}
          
          /* Dynamic Report Specific Styles */
          .test-description {
            padding: 15px;
            background: #f8f9fa;
            border-left: 3px solid var(--primary);
            margin-top: 10px;
            font-size: 14px;
            color: #555;
            line-height: 1.8;
          }
          
          .test-row-expanded {
            background: #fafafa;
          }
        </style>
      </head>
      <body>
        <div class="container">
    `;
  }

  private generateCoverPage(): string {
    const header = this.clientConfig.branding.header;
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let logoHtml = '';
    if (header.logoUrl) {
      logoHtml = `<img src="${header.logoUrl}" alt="${header.labName}" style="max-height: 80px; margin-bottom: 20px;">`;
    }

    return `
      <div class="report-header" style="text-align: center; border: none;">
        ${logoHtml}
        <h1 class="report-title" style="font-size: 32px; margin-bottom: 5px;">${header.labName}</h1>
        <p class="report-subtitle">${header.labAddress || ''}</p>
        <p class="report-subtitle">${header.labContact || ''} | ${header.labEmail || ''}</p>
      </div>
      
      <div style="text-align: center; padding: 60px 0; margin-top: 40px; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
        <h2 style="color: var(--primary); font-size: 28px; margin-bottom: 10px;">
          ${this.t('report.title')}
        </h2>
        <h3 style="color: #444; font-size: 24px; margin-top: 30px; margin-bottom: 10px;">
          ${this.input.PName}
        </h3>
        <p style="color: #666; font-size: 16px;">
          Lab No: ${this.input.LabNo}
        </p>
        <p style="color: #666; font-size: 16px;">
          Date: ${this.input.Date || date}
        </p>
        ${this.input.Centre ? `<p style="color: #999; font-size: 14px; margin-top: 10px;">${this.input.Centre}</p>` : ''}
      </div>
      
      <div class="page-break"></div>
    `;
  }

  private generateSimpleHeader(): string {
    const header = this.clientConfig.branding.header;
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let logoHtml = '';
    if (header.logoUrl) {
      logoHtml = `<img src="${header.logoUrl}" alt="${header.labName}" style="max-height: 60px;">`;
    }

    return `
      <div class="report-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          ${logoHtml ? logoHtml : `<h1 class="report-title">${header.labName}</h1>`}
          ${!logoHtml ? `<p class="report-subtitle">${header.labAddress || ''}</p>` : ''}
        </div>
        <div style="text-align: right;">
          <h2 style="color: var(--primary); font-size: 20px;">${this.t('report.title')}</h2>
          <p style="color: #666;">${this.input.Date || date}</p>
        </div>
      </div>
    `;
  }

  private generatePatientDetails(): string {
    return `
      <div class="patient-details">
        <h3 style="margin-bottom: 15px; color: var(--primary);">${this.t('report.patientInfo')}</h3>
        <table>
          <tr>
            <td>${this.t('report.patientName')}</td>
            <td>${this.input.PName}</td>
          </tr>
          <tr>
            <td>${this.t('report.age')}</td>
            <td>${this.input.Age} ${this.t('format.years')}</td>
          </tr>
          <tr>
            <td>${this.t('report.gender')}</td>
            <td>${this.input.Gender === 'M' ? this.t('gender.male') : this.input.Gender === 'F' ? this.t('gender.female') : this.input.Gender}</td>
          </tr>
          <tr>
            <td>${this.t('report.labNo')}</td>
            <td>${this.input.LabNo}</td>
          </tr>
          <tr>
            <td>${this.t('report.workOrderId')}</td>
            <td>${this.input.WorkOrderID}</td>
          </tr>
          ${this.input.ReferredBy ? `
          <tr>
            <td>${this.t('report.referredBy')}</td>
            <td>${this.input.ReferredBy}</td>
          </tr>
          ` : ''}
          <tr>
            <td>${this.t('report.reportDate')}</td>
            <td>${this.input.Date || new Date().toLocaleDateString()}</td>
          </tr>
        </table>
      </div>
    `;
  }

  private generateTestResults(): string {
    const { features } = this.clientConfig;

    let html = '<div class="test-results">';

    for (const profile of this.profiles) {
      const statusClass = `status-${profile.getStatus()}`;

      html += `
        <div class="profile-section">
          <div class="profile-header ${statusClass}">
            <div>
              <div class="profile-name">
                ${features.showProfileIcons ? profile.getIcon() + ' ' : ''}${profile.displayName}
              </div>
              <div class="profile-summary">${profile.getSummary()}</div>
            </div>
          </div>
          
          <table class="test-table">
            <thead>
              <tr>
                <th style="width: 30%;">Test Parameter</th>
                <th style="width: 15%;">Result</th>
                <th style="width: 10%;">Unit</th>
                <th style="width: 20%;">Reference Range</th>
                <th style="width: 15%;">Status</th>
                ${features.showAccreditation ? `<th style="width: 10%;">Accred.</th>` : ''}
              </tr>
            </thead>
            <tbody>
      `;

      for (const test of profile.tests) {
        const valueClass = `value-${test.colorIndicator}`;
        const statusBadgeClass = test.isAbnormal() ?
          (test.colorIndicator === 'finalCritical' || test.colorIndicator === 'threeFromNormal' ? 'critical' : 'abnormal') :
          'normal';

        html += `
          <tr>
            <td>
              <strong>${test.getTestName()}</strong>
              ${features.showTestDescriptions && test.getTestDescription() ? `
                <div class="test-description">
                  ${test.getTestDescription()}
                </div>
              ` : ''}
            </td>
            <td class="${valueClass}">${test.testResultValue}</td>
            <td>${test.testMeasuringUnit}</td>
            <td>${test.minParameterValue} - ${test.maxParameterValue}</td>
            <td>
              <span class="status-badge ${statusBadgeClass}">
                ${this.getStatusText(test.colorIndicator)}
              </span>
            </td>
            ${features.showAccreditation ? `<td>${test.accreditationHtml}</td>` : ''}
          </tr>
        `;
      }

      html += `
            </tbody>
          </table>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  private generateRecommendations(): string {
    const abnormalTests = this.getAbnormalTests();

    let html = `
      <div class="page-break"></div>
      <div class="recommendations">
        <h3>⚕️ ${this.t('report.keyRecommendations')}</h3>
        <p style="margin-bottom: 20px; color: #666;">
          ${this.t('report.consultProvider')}
        </p>
    `;

    for (const test of abnormalTests) {
      const recommendations = test.getRecommendations();

      if (recommendations.length > 0) {
        html += `
          <div class="recommendation-item">
            <h4>🔸 ${test.getTestName()} (${this.getStatusText(test.colorIndicator)})</h4>
            <ul>
              ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        `;
      }
    }

    const customHealthTips = this.clientConfig.customContent?.healthTips;
    if (customHealthTips && customHealthTips.length > 0) {
      html += `
         <div style="margin-top: 25px; border-top: 1px dashed #ccc; padding-top: 15px;">
           <h4 style="color: #555; margin-bottom: 10px;">General Health Tips from ${this.clientConfig.clientName}:</h4>
           <ul>
             ${customHealthTips.map(tip => `<li>${tip}</li>`).join('')}
           </ul>
         </div>
       `;
    }

    html += `
        <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 4px;">
          <strong>⚠️ ${this.t('report.importantNote')}</strong>
        </div>
      </div>
    `;

    return html;
  }

  private generateAnalytics(): string {
    const healthScore = analyticsService.calculateHealthScore(this.tests);
    const risks = analyticsService.identifyRiskFactors(this.profiles);
    return RiskScoreVisualizer.renderAnalyticsSection(
      healthScore,
      risks,
      this.tests.length,
      (key, params) => this.t(key, params)
    );
  }

  private generateSummary(): string {
    const totalTests = this.tests.length;
    const abnormalTests = this.getAbnormalCount();
    const normalTests = totalTests - abnormalTests;
    const { features } = this.clientConfig;

    return `
      <div class="summary">
        <h3>📊 ${this.t('report.summary')}</h3>
        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-value">${totalTests}</div>
            <div class="stat-label">${this.t('report.totalTests')}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: var(--success);">${normalTests}</div>
            <div class="stat-label">${this.t('report.normal')}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: ${abnormalTests > 0 ? 'var(--danger)' : 'var(--success)'};">
              ${abnormalTests}
            </div>
            <div class="stat-label">${this.t('report.needAttention')}</div>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 4px;">
          <p style="margin-bottom: 10px;"><strong>${this.t('report.profileSummary')}:</strong></p>
          <ul style="margin-left: 20px;">
            ${this.profiles.map(p => `
              <li style="margin-bottom: 5px;">
                ${features.showProfileIcons ? p.getIcon() + ' ' : ''}<strong>${p.displayName}:</strong> ${p.getSummary()}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  private generateFooter(): string {
    const footer = this.clientConfig.branding.footer;

    let signatureHtml = '';
    if (footer.showSignature) {
      if (footer.signatureImageUrl) {
        signatureHtml = `<img src="${footer.signatureImageUrl}" alt="Signature" style="max-height: 50px; margin-bottom: 5px;">`;
      }
      if (footer.signatureText) {
        signatureHtml += `<p style="font-weight: 600; color: #333;">${footer.signatureText.replace(/\n/g, '<br>')}</p>`;
      }

      if (signatureHtml) {
        signatureHtml = `
          <div style="margin-top: 30px; margin-bottom: 20px; text-align: right;">
            ${signatureHtml}
          </div>
        `;
      }
    }

    return `
        </div>
        
        <div style="margin-top: 40px; padding: 20px; border-top: 2px solid #eee; color: #666; font-size: 12px;">
          ${signatureHtml}
          
          <div style="text-align: center;">
            <p>${footer.disclaimer || 'This is a computer-generated report.'}</p>
            ${footer.customText ? `<p style="margin-top: 5px; font-weight: 500;">${footer.customText}</p>` : ''}
            <p style="margin-top: 5px; color: #999;">${this.t('report.generateDate')} ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
