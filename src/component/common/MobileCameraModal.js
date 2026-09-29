import React, { useRef, useState } from 'react';
import Modal from './Modal';
import Webcam from 'react-webcam';
import Button from './Button';
import { LucideCamera, LucideRotateCcw, LucideCheck } from 'lucide-react';

const videoConstraints = {
  facingMode: 'environment',
  width: { ideal: 1280 },
  height: { ideal: 720 }
};

const MobileCameraModal = ({ isOpen, onClose, onScanComplete, processId }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  };

  const handleRetake = () => {
    setImgSrc(null);
  };

  const handleConfirm = () => {
    const mockBarcodeData = {
      barcodeValue: `PROCESS_${processId}_${Date.now()}`,
      status: 'scanned',
      success: true,
      imageData: imgSrc
    };
    onScanComplete(mockBarcodeData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mobile Camera Scanner"
      size="lg"
    >
      <div className="p-4 flex flex-col items-center">
        {!imgSrc ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-64 object-cover rounded-lg"
            />
            <Button
              label="Capture"
              variant="primary"
              onClick={capture}
              icon={<LucideCamera size={20} />}
              className="mt-4"
            />
          </>
        ) : (
          <>
            <img src={imgSrc} alt="Captured" className="w-full h-64 object-cover rounded-lg mb-4" />
            <div className="flex gap-4">
              <Button
                label="Retake"
                variant="outline"
                onClick={handleRetake}
                icon={<LucideRotateCcw size={20} />}
              />
              <Button
                label="Confirm"
                variant="primary"
                onClick={handleConfirm}
                icon={<LucideCheck size={20} />}
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default MobileCameraModal; 