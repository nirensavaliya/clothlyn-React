import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import clothlynLogo from "../../assets/login/clothlyn-logo.png";
import gelaiLogo from "../../assets/login/gelai-infotech-logo.png";
import { LOGIN_PATH, navLinks } from "./siteContent";

const pageTitles = {
  "/": "Clothlyn — Garment factory software",
  "/services": "Services — Clothlyn",
  "/about": "About — Clothlyn",
  "/contact": "Contact — Clothlyn",
};

const linkClass = ({ isActive }) =>
  `text-sm font-semibold tracking-wide transition-colors ${
    isActive ? "text-[#0B1C30]" : "text-[#7D766C] hover:text-[#0B1C30]"
  }`;

const SiteChrome = ({ children }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.title = pageTitles[location.pathname] || "Clothlyn";
    window.scrollTo(0, 0);
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F7F3EE] text-left text-[#0B1C30] antialiased">
      <header className="sticky top-0 z-40 border-b border-[#E8DFD4]/80 bg-[#F7F3EE]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="shrink-0" aria-label="Clothlyn home">
            <img
              src={clothlynLogo}
              alt="Clothlyn"
              className="h-10 w-auto object-contain sm:h-11"
              draggable={false}
            />
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {navLinks.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              to={LOGIN_PATH}
              className="rounded-full border border-[#C5B396] px-4 py-2 text-sm font-semibold text-[#4C463D] transition-colors hover:border-[#7D766C] hover:text-[#0B1C30]"
            >
              Login
            </Link>
            <Link
              to={LOGIN_PATH}
              className="rounded-full bg-[#7D766C] px-4 py-2 text-sm font-semibold text-[#FFFFFF] shadow-[0_8px_18px_-8px_rgba(125,118,108,0.8)] transition-colors hover:bg-[#6A645C]"
            >
              Sign up
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E8DFD4] text-[#0B1C30] md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {open && (
          <div className="border-t border-[#E8DFD4] bg-[#F9F6F1] px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className="rounded-xl px-3 py-3 text-base font-semibold text-[#0B1C30]"
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to={LOGIN_PATH}
                className="rounded-full border border-[#C5B396] py-2.5 text-center text-sm font-semibold"
              >
                Login
              </Link>
              <Link
                to={LOGIN_PATH}
                className="rounded-full bg-[#7D766C] py-2.5 text-center text-sm font-semibold text-[#FFFFFF]"
              >
                Sign up
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-[#E8DFD4] bg-[#EFE7DC]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <img src={clothlynLogo} alt="Clothlyn" className="h-12 w-auto object-contain" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#4C463D]">
              Clothlyn runs a clothing unit from the cutting table to salary —
              lots, scans, alters, and pay in one place.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7D766C]">
              Pages
            </p>
            <ul className="mt-4 space-y-2 text-sm font-medium">
              {navLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-[#0B1C30] hover:text-[#7D766C]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7D766C]">
              Workspace
            </p>
            <ul className="mt-4 space-y-2 text-sm font-medium">
              <li>
                <Link to={LOGIN_PATH} className="text-[#0B1C30] hover:text-[#7D766C]">
                  Login
                </Link>
              </li>
              <li>
                <Link to={LOGIN_PATH} className="text-[#0B1C30] hover:text-[#7D766C]">
                  Sign up
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#0B1C30] hover:text-[#7D766C]">
                  Request a walkthrough
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#E8DFD4]">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-5 sm:flex-row sm:items-center sm:px-6">
            <p className="text-xs text-[#7D766C]">© {new Date().getFullYear()} Clothlyn</p>
            <div className="flex items-center gap-3">
              <span
                className="text-[10px] tracking-wide text-[#7D766C]/80"
                style={{ fontFamily: "'Zen Dots', sans-serif" }}
              >
                Powered by
              </span>
              <img src={gelaiLogo} alt="Gelai Infotech" className="h-7 w-auto object-contain" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SiteChrome;
