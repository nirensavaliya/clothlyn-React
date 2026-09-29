import { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import Button from './common/Button';
import Modal from './common/Modal';

const isMobileDevice = () => {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
};

const UserView = ({ isOpen, onClose }) => {
  const [scannedData, setScannedData] = useState(null);

  const handleScan = (data) => {
    if (data && !scannedData) {
      setScannedData(data);
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  if (!isMobileDevice()) {
    return (
      <div>
        <h2>User Scanner</h2>
        <p>This feature is only available on mobile devices.</p>
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan QR Code" size="lg">
      {!scannedData ? (
        <QrReader
          delay={300}
          onError={handleError}
          onScan={handleScan}
          style={{ width: '100%' }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <h3>Scan Successful!</h3>
          <p>Data: {scannedData}</p>
          <Button onClick={onClose} label="Close" variant="outline" className="mt-4" />
        </div>
      )}
    </Modal>
  );
};

export default UserView; 