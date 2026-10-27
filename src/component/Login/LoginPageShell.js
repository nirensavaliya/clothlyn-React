import React from "react";
import fabricBg from "../../assets/login/fabric-bg.png";
import pageBgFull from "../../assets/login/page-bg-full.png";
import clothlynLogo from "../../assets/login/clothlyn-logo.png";
import gelaiLogo from "../../assets/login/gelai-infotech-logo.png";

const panelBg = {
  backgroundImage: `linear-gradient(145deg, rgba(249,246,241,0.88) 0%, rgba(239,231,220,0.85) 100%), url(${fabricBg})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const PoweredBy = ({ className = "" }) => (
  <div className={`flex items-center justify-center gap-3 ${className}`}>
    <span
      className="text-[10px] leading-5 whitespace-nowrap"
      style={{
        fontFamily: "'Zen Dots', sans-serif",
        color: "rgba(125, 118, 108, 0.6)",
      }}
    >
      Powered by
    </span>
    <img
      src={gelaiLogo}
      alt="Gelai Infotech"
      className="h-7 sm:h-8 w-auto object-contain"
      draggable={false}
    />
  </div>
);

/**
 * Website login layout themed with Figma mobile app colors
 * (navy / taupe / gold / cream) — Clothlyn brand + Gelai powered-by.
 */
const LoginPageShell = ({ children, onBrandTap, onIllustrationTap, showLocalBadge = false }) => {
  return (
    <div className="relative min-h-screen">
      {showLocalBadge && (
        <div className="fixed top-3 left-1/2 z-50 -translate-x-1/2 pointer-events-none">
          <span className="inline-block rounded-full bg-[#7D766C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-md">
            local
          </span>
        </div>
      )}
      {/* Outer page only: Figma full BG image + soft opacity */}
      <div className="absolute inset-0 z-0 overflow-hidden" style={{ backgroundColor: "#F7F3EE" }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${pageBgFull})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.42,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(247,243,238,0.35) 0%, rgba(247,243,238,0.15) 45%, rgba(239,231,220,0.4) 100%)",
          }}
        />
      </div>
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[70rem] mx-auto">
          <div
            className="w-full flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-2xl border border-[#E8DFD4] min-h-[34rem]"
            style={panelBg}
          >
            <div className="lg:w-3/5 p-8 hidden lg:flex flex-col relative overflow-hidden min-h-[34rem] bg-transparent">
              <div className="relative z-10 flex flex-col flex-1 items-center justify-between w-full max-w-md mx-auto py-4">
                <div className="text-center w-full flex-1 flex flex-col items-center justify-center">
                  <button
                    type="button"
                    className="mx-auto mb-8 bg-transparent p-0 border-0 cursor-default"
                    onClick={onBrandTap}
                    aria-label="Clothlyn"
                  >
                    <img
                      src={clothlynLogo}
                      alt="Clothlyn"
                      className="h-48 w-auto max-w-[280px] object-contain select-none pointer-events-none"
                      style={{ imageRendering: "auto" }}
                      draggable={false}
                    />
                  </button>
                  <button
                    type="button"
                    className="bg-transparent p-0 border-0 cursor-default"
                    onClick={onIllustrationTap}
                    aria-label="Powered by Gelai"
                  >
                    <PoweredBy className="mt-2" />
                  </button>
                  <h2
                    className="text-xl font-semibold mb-2 mt-6"
                    style={{ color: "#0B1C30" }}
                  >
                    24 × 7 Premium Support
                  </h2>
                  <p className="text-sm" style={{ color: "#4C463D" }}>
                    Our dedicated support team is available round the clock to
                    assist you with any queries.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:w-2/5 p-8 sm:p-10 bg-transparent">
              <div className="w-full max-w-md mx-auto h-full flex flex-col items-center justify-center gap-6">
                <div className="lg:hidden mb-2 flex flex-col items-center gap-3">
                  <img
                    src={clothlynLogo}
                    alt="Clothlyn"
                    className="h-32 w-auto max-w-[220px] object-contain select-none mx-auto"
                    style={{ imageRendering: "auto" }}
                    draggable={false}
                    onClick={onBrandTap}
                    role="presentation"
                  />
                  <button
                    type="button"
                    className="bg-transparent p-0 border-0 cursor-default"
                    onClick={onIllustrationTap}
                    aria-label="Powered by Gelai"
                  >
                    <PoweredBy />
                  </button>
                </div>
                <div
                  className="rounded-3xl p-8 max-w-md w-full border border-[#E8DFD4]/90"
                  style={{
                    backgroundColor: "rgba(249, 246, 241, 0.97)",
                    boxShadow:
                      "0 20px 40px -12px rgba(75, 68, 58, 0.18), 0 8px 16px -8px rgba(75, 68, 58, 0.12)",
                  }}
                >
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const loginLinkClass =
  "text-sm font-bold text-[#7D766C] hover:text-[#5C564E] transition-colors";

export const loginPrimaryBtnClass =
  "w-full !bg-[#7D766C] hover:!bg-[#6A645C] !text-white !shadow-[0_10px_15px_-3px_rgba(197,179,150,0.25)] !rounded-xl !py-3 !px-4 focus:!ring-[#C5B396]";

export const loginTitleClass = "text-2xl font-bold mb-2 text-[#0B1C30]";
export const loginMutedClass = "text-sm text-[#4C463D]";

export default LoginPageShell;
