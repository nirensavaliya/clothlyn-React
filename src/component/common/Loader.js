import React from "react";
import { createPortal } from "react-dom";
import clothlynLogo from "../../assets/login/clothlyn-logo.png";

/**
 * Clothlyn full-screen loader — fabric thread / stitch inspired.
 */
const LoaderComponent = ({ size = 72, className = "" }) => {
  const s = Math.max(72, size);

  const loaderNode = (
    <div
      className={`clothlyn-loader-overlay fixed inset-0 z-[2147483647] flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="clothlyn-loader-glow" aria-hidden />
      <div className="clothlyn-loader-card">
        <div
          className="clothlyn-loader-stage"
          style={{ width: s, height: s }}
        >
          <span className="clothlyn-ring clothlyn-ring-a" />
          <span className="clothlyn-ring clothlyn-ring-b" />
          <span className="clothlyn-ring clothlyn-ring-c" />
          <span className="clothlyn-orbit">
            <i />
            <i />
            <i />
          </span>
          <span className="clothlyn-core">
            <img
              src={clothlynLogo}
              alt="Clothlyn"
              className="clothlyn-core-logo"
              draggable={false}
            />
          </span>
        </div>
        <p className="clothlyn-loader-label">
          <span>Loading</span>
          <span className="clothlyn-dots">
            <i />
            <i />
            <i />
          </span>
        </p>
      </div>

      <style>{`
        .clothlyn-loader-overlay {
          background:
            radial-gradient(
              ellipse at center,
              rgba(125, 118, 108, 0.45) 0%,
              rgba(125, 118, 108, 0.72) 45%,
              rgba(106, 100, 92, 0.88) 100%
            );
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .clothlyn-loader-glow {
          position: absolute;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,179,150,0.35) 0%, transparent 70%);
          animation: clothlyn-pulse 2.4s ease-in-out infinite;
          pointer-events: none;
        }
        .clothlyn-loader-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.15rem;
          padding: 1.85rem 2.1rem 1.4rem;
          border-radius: 1.5rem;
          background: linear-gradient(145deg, rgba(249,246,241,0.96) 0%, rgba(239,231,220,0.94) 100%);
          border: 1px solid rgba(232,223,212,0.95);
          box-shadow:
            0 24px 48px -16px rgba(75,68,58,0.35),
            0 8px 16px -8px rgba(197,179,150,0.35),
            inset 0 1px 0 rgba(255,255,255,0.7);
        }
        .clothlyn-loader-stage {
          position: relative;
          display: grid;
          place-items: center;
        }
        .clothlyn-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid transparent;
        }
        .clothlyn-ring-a {
          border-top-color: #7D766C;
          border-right-color: rgba(125,118,108,0.25);
          animation: clothlyn-spin 1.1s cubic-bezier(0.5, 0.15, 0.35, 0.9) infinite;
        }
        .clothlyn-ring-b {
          inset: 8%;
          border-bottom-color: #C5B396;
          border-left-color: rgba(197,179,150,0.3);
          animation: clothlyn-spin-rev 1.6s cubic-bezier(0.5, 0.15, 0.35, 0.9) infinite;
        }
        .clothlyn-ring-c {
          inset: 18%;
          border: 1.5px dashed rgba(125,118,108,0.45);
          animation: clothlyn-spin 2.8s linear infinite;
        }
        .clothlyn-orbit {
          position: absolute;
          inset: 4%;
          animation: clothlyn-spin 2.2s linear infinite;
        }
        .clothlyn-orbit i {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #C5B396;
          box-shadow: 0 0 10px rgba(197,179,150,0.8);
        }
        .clothlyn-orbit i:nth-child(1) { top: 0; left: 50%; transform: translateX(-50%); }
        .clothlyn-orbit i:nth-child(2) {
          bottom: 12%; right: 8%;
          width: 5px; height: 5px;
          background: #7D766C;
        }
        .clothlyn-orbit i:nth-child(3) {
          bottom: 18%; left: 10%;
          width: 4px; height: 4px;
          background: #0B1C30;
        }
        .clothlyn-core {
          position: relative;
          z-index: 2;
          width: 58%;
          height: 58%;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: linear-gradient(160deg, #F9F6F1 0%, #EFE7DC 100%);
          box-shadow:
            0 4px 12px rgba(125,118,108,0.2),
            inset 0 0 0 1px rgba(197,179,150,0.45);
          animation: clothlyn-breathe 1.8s ease-in-out infinite;
          overflow: hidden;
          padding: 10%;
        }
        .clothlyn-core-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          user-select: none;
          pointer-events: none;
        }
        .clothlyn-loader-label {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0B1C30;
          font-family: "Plus Jakarta Sans", sans-serif;
        }
        .clothlyn-dots {
          display: inline-flex;
          gap: 3px;
          margin-left: 2px;
        }
        .clothlyn-dots i {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #7D766C;
          animation: clothlyn-dot 1.2s ease-in-out infinite;
        }
        .clothlyn-dots i:nth-child(2) { animation-delay: 0.15s; background: #C5B396; }
        .clothlyn-dots i:nth-child(3) { animation-delay: 0.3s; }

        @keyframes clothlyn-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes clothlyn-spin-rev {
          to { transform: rotate(-360deg); }
        }
        @keyframes clothlyn-pulse {
          0%, 100% { transform: scale(0.9); opacity: 0.55; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes clothlyn-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes clothlyn-dot {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-3px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .clothlyn-ring-a,
          .clothlyn-ring-b,
          .clothlyn-ring-c,
          .clothlyn-orbit,
          .clothlyn-core,
          .clothlyn-loader-glow,
          .clothlyn-dots i {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );

  if (typeof document === "undefined") {
    return loaderNode;
  }

  return createPortal(loaderNode, document.body);
};

export default LoaderComponent;
