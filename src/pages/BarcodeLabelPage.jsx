import { QRCodeSVG } from 'qrcode.react';
import React, { useState, useEffect } from 'react';

const getResponsiveDimensions = (baseWidth, baseHeight) => {
  if (typeof window !== 'undefined') {
    const screenWidth = window.innerWidth;
    
    if (screenWidth < 640) {
      return {
        width: Math.max(baseWidth * 0.7, 160),
        minHeight: Math.max(baseHeight * 0.7, 200)
      };
    }
    else if (screenWidth < 1024) {
      return {
        width: baseWidth * 0.85,
        minHeight: baseHeight * 0.85
      };
    }
    else {
      return {
        width: baseWidth,
        minHeight: baseHeight
      };
    }
  }
  return { width: baseWidth, minHeight: baseHeight };
};

const labelSizes = [
  { label: '2 x 4', value: '2x4', baseWidth: 200, baseHeight: 240, barcodeHeight: 32 },
  { label: '3 x 5', value: '3x5', baseWidth: 300, baseHeight: 300, barcodeHeight: 40 },
  { label: '4 x 6', value: '4x6', baseWidth: 400, baseHeight: 370, barcodeHeight: 48 },
];

export default function BarcodeLabelPage() {
  const [selectedSize, setSelectedSize] = useState(labelSizes[0].value);
  const [screenDimensions, setScreenDimensions] = useState({ width: 1024, height: 768 });

  useEffect(() => {
    const handleResize = () => {
      setScreenDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const labelData = {
    dNo: 'Y-102',
    layer: '8',
    date: '2/5/2025',
    color: 'L-Grey',
    size: 'XXL',
    pic: '40',
    lotNo: '25352AQ',
    barcodeNumber: '25352AQ',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <h2 className="font-bold text-3xl mb-10 text-gray-800 text-center tracking-tight">Barcode Label Preview</h2>
      <div className="flex flex-col xl:flex-row gap-10 justify-center items-center">
        {labelSizes.map(size => {
          const isSmall = size.value === '2x4';
          const responsiveDimensions = getResponsiveDimensions(size.baseWidth, size.baseHeight);

          return (
            <div
              key={size.value}
              className={`relative cursor-pointer transition-all duration-200 border-2 rounded-2xl bg-white shadow-sm font-sans flex-shrink-0 flex flex-col justify-between items-stretch hover:shadow-md
                ${selectedSize === size.value ? 'border-blue-600 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-300'}`}
              style={{ 
                width: responsiveDimensions.width, 
                minHeight: responsiveDimensions.minHeight, 
                height: responsiveDimensions.minHeight 
              }}
              onClick={() => setSelectedSize(size.value)}
              tabIndex={0}
              aria-checked={selectedSize === size.value}
              role="radio"
            >
              {/* Radio button at top-right */}
              <div className="absolute top-3 right-3 z-10">
                <input
                  type="radio"
                  name="label-size"
                  checked={selectedSize === size.value}
                  onChange={() => setSelectedSize(size.value)}
                  className="form-radio h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer bg-white shadow"
                  tabIndex={-1}
                  aria-label={`Select ${size.label} label`}
                  onClick={e => e.stopPropagation()}
                />
              </div>

              {/* Label Content */}
              <div className={`flex flex-col justify-between h-full px-4 py-3 space-y-2 ${isSmall ? 'text-xs' : 'text-sm'}`}>
                {/* Title */}
                <div className={`text-center ${isSmall ? 'text-base' : 'text-lg'} font-bold tracking-wide text-gray-800 whitespace-nowrap`}>
                  {size.label} Label
                </div>

                {/* Row 1: Date | D. No. | Layer */}
                <div className={`grid grid-cols-3 gap-x-2`}>
                  <div className="text-left font-semibold">Date:<br /><span className="font-normal text-gray-700">{labelData.date}</span></div>
                  <div className="text-center font-semibold">D. no.:<br /><span className="font-normal text-gray-700">{labelData.dNo}</span></div>
                  <div className="text-right font-semibold">Layer:<br /><span className="font-normal text-gray-700">{labelData.layer}</span></div>
                </div>

                {/* Row 2: Color | Size | Pic */}
                <div className={`grid grid-cols-3 gap-x-2`}>
                  <div className="text-left font-semibold">Color: <br /><span className="font-bold text-gray-800">{labelData.color}</span></div>
                  <div className="text-center font-semibold">Size: <br /><span className="font-bold text-gray-800">{labelData.size}</span></div>
                  <div className="text-right font-semibold">Pic: <br /><span className="font-bold text-gray-800">{labelData.pic}</span></div>
                </div>

                {/* Barcode Area */}
                 {labelData?.lotNo && (
              <div className="h-full flex flex-col items-center justify-center flex-1 w-full pt-2 space-y-1">
                {(() => {
                  return (
                    <QRCodeSVG
                      value={labelData?.lotNo || ""}
                      size={80}
                    />
                  );
                })()}
              </div>
            )}
                {/* <div className="flex flex-col items-center justify-center flex-1 w-full pt-2 space-y-1">
                  
                  <div
                    className="bg-white border border-gray-300 rounded-md w-full overflow-hidden shadow-inner"
                    style={{
                      height: size.barcodeHeight,
                      backgroundImage: `repeating-linear-gradient(
                        to right,
                        black 0px,
                        black 1px,
                        transparent 1px,
                        transparent 2px,
                        black 2px,
                        black 3px,
                        transparent 3px,
                        transparent 5px
                      )`,
                      backgroundSize: 'cover'
                    }}
                  />
                  <div className={`${isSmall ? 'text-xs' : 'text-sm'} font-mono tracking-widest text-center text-gray-700 select-none`}>
                    {labelData.barcodeNumber}
                  </div>
                </div> */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

