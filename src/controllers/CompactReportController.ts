/**
 * CompactReportController - Generates condensed compact reports
 * 
 * Features:
 * - Condensed format
 * - Essential information only
 * - Doctor-facing format
 * - Quick overview
 * - No detailed descriptions
 * - Client branding supported
 */

import { BaseReportController } from './BaseReportController';

export class CompactReportController extends BaseReportController {
  getReportType(): string {
    return 'compact';
  }

  generateHTML(): string {
    const { features } = this.clientConfig;

    let html = this.generateHeader();
    html += this.generateCompactHeader();
    html += this.generateCompactTestResults();

    if (features.showSummaryStats) {
      html += this.generateCompactSummary();
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
          
          /* Compact Report Specific Styles */
          .compact-header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          
          .compact-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .compact-info-item {
            display: flex;
            gap: 10px;
          }
          
          .compact-info-label {
            font-weight: 600;
            color: #555;
            min-width: 100px;
          }
          
          .compact-info-value {
            color: #333;
          }
          
          .compact-table {
            font-size: 13px;
          }
          
          .compact-table th {
            padding: 8px;
            font-size: 12px;
          }
          
          .compact-table td {
            padding: 8px;
          }
          
          .profile-compact {
            margin-bottom: 25px;
          }
          
          .profile-compact-header {
            background: var(--primary);
            color: white;
            padding: 10px 15px;
            font-weight: 600;
            border-radius: 4px 4px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .profile-compact-header.status-attention {
            background: var(--warning);
          }
          
          .profile-compact-header.status-critical {
            background: var(--danger);
          }
          
          .abnormal-highlight {
            background: #FFF3E0 !important;
          }
        </style>
      </head>
      <body>
        <div class="container">
    `;
  }

  private generateCompactHeader(): string {
    const header = this.clientConfig.branding.header;

    let logoHtml = '';
    if (header.logoUrl) {
      logoHtml = `<img src="${header.logoUrl}" alt="${header.labName}" style="max-height: 50px; margin-bottom: 10px;">`;
    }

    return `
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid var(--primary);">
        ${logoHtml}
        <h1 style="color: var(--primary); font-size: 24px; margin-bottom: 5px;">
          ${header.labName}
        </h1>
        <p style="color: #666; font-size: 14px;">${this.t('format.compactReport')}</p>
      </div>
      
      <div class="compact-header">
        <div class="compact-info">
          <div class="compact-info-item">
            <span class="compact-info-label">${this.t('report.patient')}:</span>
            <span class="compact-info-value"><strong>${this.input.PName}</strong></span>
          </div>
          <div class="compact-info-item">
            <span class="compact-info-label">${this.t('report.age')}/${this.t('report.gender')}:</span>
            <span class="compact-info-value">${this.input.Age} / ${this.input.Gender === 'M' ? this.t('gender.male') : this.input.Gender === 'F' ? this.t('gender.female') : this.input.Gender}</span>
          </div>
          <div class="compact-info-item">
            <span class="compact-info-label">${this.t('report.labNo')}:</span>
            <span class="compact-info-value">${this.input.LabNo}</span>
          </div>
        </div>
        
        <div class="compact-info">
          <div class="compact-info-item">
            <span class="compact-info-label">${this.t('report.date')}:</span>
            <span class="compact-info-value">${this.input.Date || new Date().toLocaleDateString()}</span>
          </div>
          ${this.input.ReferredBy ? `
          <div class="compact-info-item">
            <span class="compact-info-label">${this.t('report.referredBy')}:</span>
            <span class="compact-info-value">${this.input.ReferredBy}</span>
          </div>
          ` : ''}
          <div class="compact-info-item">
            <span class="compact-info-label">${this.t('report.totalTests')}:</span>
            <span class="compact-info-value"><strong>${this.tests.length}</strong></span>
          </div>
        </div>
      </div>
    `;
  }

  private generateCompactTestResults(): string {
    const { features } = this.clientConfig;

    let html = '<div class="test-results">';

    for (const profile of this.profiles) {
      const statusClass = `status-${profile.getStatus()}`;
      const abnormalCount = profile.getAbnormalCount();

      html += `
        <div class="profile-compact">
          <div class="profile-compact-header ${statusClass}">
            <span>${features.showProfileIcons ? profile.getIcon() + ' ' : ''}${profile.displayName}</span>
            ${abnormalCount > 0 ? `
              <span style="font-size: 12px; opacity: 0.9;">
                ⚠️ ${abnormalCount} abnormal
              </span>
            ` : `
              <span style="font-size: 12px; opacity: 0.9;">
                ✓ All normal
              </span>
            `}
          </div>
          
          <table class="test-table compact-table">
            <thead>
              <tr>
                <th style="width: 35%;">Test</th>
                <th style="width: 15%;">Result</th>
                <th style="width: 10%;">Unit</th>
                <th style="width: 25%;">Range</th>
                <th style="width: 15%;">Status</th>
              </tr>
            </thead>
            <tbody>
      `;

      for (const test of profile.tests) {
        const valueClass = `value-${test.colorIndicator}`;
        const rowClass = test.isAbnormal() ? 'abnormal-highlight' : '';

        html += `
          <tr class="${rowClass}">
            <td>
              ${test.getTestName()}
              ${features.showAccreditation && test.showSvg ? test.accreditationHtml : ''}
            </td>
            <td class="${valueClass}"><strong>${test.testResultValue}</strong></td>
            <td>${test.testMeasuringUnit}</td>
            <td>${test.minParameterValue} - ${test.maxParameterValue}</td>
            <td>
              ${test.isAbnormal() ?
            `<span style="color: var(--danger); font-weight: 600;">⚠ ${this.getStatusText(test.colorIndicator)}</span>` :
            `<span style="color: var(--success);">✓</span>`
          }
            </td>
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

  private generateCompactSummary(): string {
    const abnormalTests = this.getAbnormalTests();

    if (abnormalTests.length === 0) {
      return `
        <div style="margin-top: 20px; padding: 15px; background: #E8F5E9; border-left: 4px solid var(--success); border-radius: 4px;">
          <strong style="color: var(--success);">✓ ${this.t('report.allNormal')}</strong>
        </div>
      `;
    }

    let html = `
      <div style="margin-top: 20px; padding: 15px; background: #FFF3E0; border-left: 4px solid var(--warning); border-radius: 4px;">
        <strong style="color: var(--warning);">⚠️ ${this.t('report.testsRequireAttention', { count: abnormalTests.length })}:</strong>
        <ul style="margin-top: 10px; margin-left: 20px;">
    `;

    for (const test of abnormalTests) {
      html += `
        <li style="margin-bottom: 5px;">
          <strong>${test.getTestName()}:</strong> 
          ${test.testResultValue} ${test.testMeasuringUnit} 
          <span style="color: ${test.getColorHex()};">(${this.getStatusText(test.colorIndicator)})</span>
        </li>
      `;
    }

    html += `
        </ul>
      </div>
    `;

    return html;
  }

  private generateFooter(): string {
    const footer = this.clientConfig.branding.footer;

    return `
        </div>
        
        <div style="margin-top: 30px; padding: 15px; border-top: 2px solid #eee; text-align: center; color: #999; font-size: 11px;">
          <p>${footer.disclaimer || 'Computer-generated report'}</p>
          ${footer.customText ? `<p style="margin-top: 3px;">${footer.customText}</p>` : ''}
          <p style="margin-top: 3px;">Generated: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  }
}

