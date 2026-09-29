import React, { useMemo } from 'react';
import JsBarcode from 'jsbarcode';

const LabelPdfBarcode = ({ value, barWidth = 1.8, height = 36 }) => {
  const svgHtml = useMemo(() => {
    if (!value || typeof document === 'undefined') return '';

    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svg, String(value), {
        format: 'CODE128',
        width: barWidth,
        height,
        displayValue: false,
        margin: 0,
        marginRight: 6,
      });
      return new XMLSerializer().serializeToString(svg);
    } catch (error) {
      console.error('Label PDF barcode generation failed:', error);
      return '';
    }
  }, [value, barWidth, height]);

  if (!svgHtml) return null;

  return (
    <div
      style={{
        display: "block",
        lineHeight: 1,
        flexShrink: 0,
        height: `${height}px`,
        overflow: "hidden",
      }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
};

export default LabelPdfBarcode;
