import Handlebars from 'handlebars';

/**
 * Register Handlebars helpers for report rendering.
 */
export function registerHelpers(): void {
  // SVG slider that shows value position on a color-banded reference range bar
  Handlebars.registerHelper(
    'slider',
    function (
      sliderPosition: number,
      colorIndicator: string,
      referenceRange: { min: number; max: number } | null,
    ) {
      const pos = Math.max(2, Math.min(98, sliderPosition ?? 50));

      // Bar dimensions
      const barW = 220;
      const barH = 14;
      const markerR = 7;
      const totalH = 38;

      // Color mapping
      const colors: Record<string, string> = {
        normal: 'var(--color-normal, #0F9D58)',
        borderline: 'var(--color-borderline, #F4B400)',
        low: 'var(--color-low, #DB4437)',
        high: 'var(--color-high, #DB4437)',
        critical: 'var(--color-critical, #C26564)',
      };
      const markerColor = colors[colorIndicator] ?? colors.normal;

      // Zone positions (proportional): critical-low | borderline-low | normal | borderline-high | critical-high
      // Simplified: 0-15% critical, 15-25% borderline, 25-75% normal, 75-85% borderline, 85-100% critical
      const zones = [
        { x: 0, w: 0.15, fill: 'var(--color-critical, #C26564)' },
        { x: 0.15, w: 0.10, fill: 'var(--color-borderline, #F4B400)' },
        { x: 0.25, w: 0.50, fill: 'var(--color-normal, #0F9D58)' },
        { x: 0.75, w: 0.10, fill: 'var(--color-borderline, #F4B400)' },
        { x: 0.85, w: 0.15, fill: 'var(--color-critical, #C26564)' },
      ];

      const markerX = (pos / 100) * barW;

      // Build zone rects
      const zoneRects = zones
        .map(
          (z) =>
            `<rect x="${z.x * barW}" y="0" width="${z.w * barW}" height="${barH}" rx="0" fill="${z.fill}" opacity="0.25"/>`,
        )
        .join('');

      // Reference range labels
      let rangeLabels = '';
      if (referenceRange) {
        rangeLabels = `
          <text x="0" y="${barH + 14}" font-size="8" fill="#888" font-family="sans-serif">${referenceRange.min}</text>
          <text x="${barW}" y="${barH + 14}" font-size="8" fill="#888" font-family="sans-serif" text-anchor="end">${referenceRange.max}</text>`;
      }

      const svg = `<svg width="${barW}" height="${totalH}" viewBox="0 0 ${barW} ${totalH}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${barW}" height="${barH}" rx="7" fill="#e0e0e0"/>
        ${zoneRects}
        <rect x="0" y="0" width="${barW}" height="${barH}" rx="7" fill="none" stroke="#ccc" stroke-width="0.5"/>
        <circle cx="${markerX}" cy="${barH / 2}" r="${markerR}" fill="${markerColor}" stroke="#fff" stroke-width="2"/>
        ${rangeLabels}
      </svg>`;

      return new Handlebars.SafeString(svg);
    },
  );

  // Equality helper for conditional blocks
  Handlebars.registerHelper('eq', function (a: unknown, b: unknown) {
    return a === b;
  });

  // Count helper: count items in array matching a condition
  Handlebars.registerHelper('countAbnormal', function (testResults: Array<{ colorIndicator: string }>) {
    if (!Array.isArray(testResults)) return 0;
    return testResults.filter((t) => t.colorIndicator !== 'normal').length;
  });

  // Math helpers
  Handlebars.registerHelper('add', function (a: number, b: number) {
    return (a || 0) + (b || 0);
  });

  // Capitalize helper
  Handlebars.registerHelper('capitalize', function (str: string) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
}
