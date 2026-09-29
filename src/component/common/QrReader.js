import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from '@zxing/browser';
import "./QrStyles.css";

const isMobileDevice = () =>
  /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

async function getCameraConstraints() {
  try {
    const devices = await BrowserMultiFormatReader.listVideoInputDevices();
    if (!devices.length) {
      return { video: true };
    }
    if (!isMobileDevice()) {
      return { video: { deviceId: { exact: devices[0].deviceId } } };
    }
    const backCamera = devices.find((d) =>
      /back|rear|environment/i.test(d.label || "")
    );
    if (backCamera) {
      return { video: { deviceId: { exact: backCamera.deviceId } } };
    }
    return { video: { facingMode: "environment" } };
  } catch {
    return { video: isMobileDevice() ? { facingMode: "environment" } : true };
  }
}

function ensureVideoPlays(videoEl) {
  if (!videoEl) return;
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.setAttribute("playsinline", "true");
  videoEl.setAttribute("webkit-playsinline", "true");
  const play = () => {
    videoEl.play().catch(() => {});
  };
  if (videoEl.readyState >= 2) {
    play();
  } else {
    videoEl.addEventListener("loadeddata", play, { once: true });
  }
}

function stopVideoElementStream(videoEl) {
  if (!videoEl) return;
  const stream = videoEl.srcObject;
  if (stream instanceof MediaStream) {
    stream.getTracks().forEach((t) => t.stop());
  }
  videoEl.srcObject = null;
}

function safeStopControls(controls) {
  if (!controls || typeof controls.stop !== "function") return;
  try {
    controls.stop();
  } catch {
    /* ignore */
  }
}

const QrReader = ({ onScan }) => {
  const videoRef = useRef(null);
  const onScanRef = useRef(onScan);
  const scanControlsRef = useRef(null);
  const lastDecodedRef = useRef({ text: '', ts: 0 });
  const [error, setError] = useState(null);
  const [scannedResult, setScannedResult] = useState("");
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!scanning) return undefined;

    const reader = new BrowserMultiFormatReader();
    let cancelled = false;
    scanControlsRef.current = null;

    const videoEl = videoRef.current;
    if (!videoEl) {
      return undefined;
    }

    const onDecode = (result, err, controls) => {
      if (cancelled) {
        safeStopControls(controls);
        return;
      }
      if (result) {
        const decodedText = result.getText();
        const now = Date.now();
        if (
          lastDecodedRef.current.text === decodedText &&
          now - lastDecodedRef.current.ts < 3000
        ) {
          return;
        }
        lastDecodedRef.current = { text: decodedText, ts: now };
        setScannedResult(decodedText);
        setScanning(false);
        if (onScanRef.current) onScanRef.current(decodedText);
        safeStopControls(controls);
        scanControlsRef.current = null;
        return;
      }
      if (err && err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions.");
        setScanning(false);
        safeStopControls(controls);
        scanControlsRef.current = null;
      }
    };

    const startScanner = async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (cancelled || !videoRef.current) return;

      try {
        const constraints = await getCameraConstraints();
        if (cancelled) return;

        const controls = await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          onDecode
        );
        if (cancelled) {
          safeStopControls(controls);
          return;
        }
        scanControlsRef.current = controls;
        ensureVideoPlays(videoRef.current);
      } catch {
        if (!cancelled) {
          setError("Unable to access camera or scan code.");
          setScanning(false);
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      safeStopControls(scanControlsRef.current);
      scanControlsRef.current = null;
      stopVideoElementStream(videoRef.current);
    };
  }, [scanning]);

  return (
    <div className="qr-reader">
      {error && (
        <div className="text-center p-6">
          <div className="text-red-500 mb-4">
            <p className="text-lg font-semibold">Camera Error</p>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      )}
      {!error && (
        <>
          <video
            ref={videoRef}
            className="qr-video"
            autoPlay
            playsInline
            muted
          />
          <div className="qr-box">
            <div className="qr-code-frame">
              <div className="scan-line"></div>
            </div>
          </div>
          {scannedResult && (
            <p
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 99999,
                color: "white",
              }}
            >
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default QrReader;
