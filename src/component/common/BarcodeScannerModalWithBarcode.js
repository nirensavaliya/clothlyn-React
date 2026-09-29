import React from 'react';
import BarcodeScannerModal from './BarcodeScannerModal';

/** Temporary modal — same Item Details popup with lot-no barcode below QR. */
const BarcodeScannerModalWithBarcode = (props) => (
  <BarcodeScannerModal {...props} showLotBarcode />
);

export default BarcodeScannerModalWithBarcode;
