import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const LotNoBarcode = ({ value, className = '', compact = false }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    try {
      JsBarcode(canvas, String(value), {
        format: 'CODE128',
        width: compact ? 1.6 : 2,
        height: compact ? 48 : 56,
        displayValue: true,
        fontSize: compact ? 12 : 14,
        margin: compact ? 4 : 6,
        textMargin: 4,
      });
    } catch (error) {
      console.error('Barcode generation failed:', error);
    }
  }, [value, compact]);

  if (!value) return null;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  );
};

export default LotNoBarcode;
