import React, { useState } from "react";
import classNames from "classnames";
import {
  LucideLogOut,
  LucideBuilding2,
  LucideShield,
  LucideUser,
  LucideUsers,
  LucideUpload,
} from "lucide-react";
import Button from "../common/Button";
import { logoutApi } from "../../apis/loginApi";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import HeaderVectors from "./HeaderVectors";
import fabricLines from "../../assets/login/fabric-lines.png";
import pageBgFull from "../../assets/login/page-bg-full.png";

/**
 * Same side-menu style as DashboardLayout (Clothlyn taupe sidebar).
 */
const SuperAdminLayout = ({ children, activeTab, onTabChange }) => {
  const [loggingOut, setLoggingOut] = useState(false);
  const reduceMotion = useReducedMotion();

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (_) {}

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutApi();
    } catch (_) {}
    localStorage.clear();
    window.location.href = "/super-admin/login";
  };

  const tabs = [
    { id: "clients", label: "Client Codes", icon: LucideBuilding2 },
    { id: "employees", label: "User List", icon: LucideUsers },
    { id: "users", label: "Super Admin Users", icon: LucideShield },
    { id: "app", label: "App Upload", icon: LucideUpload },
  ];

  const pageTitles = {
    clients: "Client Codes",
    employees: "User List",
    users: "Super Admin Users",
    app: "App Upload",
  };

  const displayName = user?.username || user?.phoneNumber || "Super Admin";

  return (
    <div className="flex h-screen min-h-0 w-full overflow-hidden bg-[#F7F3EE]">
      <aside className="w-[240px] shrink-0 border-r border-[#E8DFD4]">
        <div className="flex h-full flex-col bg-light-primary">
          <div className="flex h-16 items-center px-4 border-b border-[#6A645C]">
            <div>
              <span className="text-lg font-semibold text-light-white block">
                Platform Admin
              </span>
              <span className="text-xs text-[#C5B396]">GI0000</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3 overflow-y-auto scrollbar">
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onTabChange(id)}
                  className={classNames(
                    "relative flex w-full items-center gap-3 rounded-md px-3 py-2 transition-colors duration-200 text-sm",
                    {
                      "bg-[#EFE7DC] text-light-primary font-medium border-l-4 border-[#C5B396]":
                        isActive,
                      "text-light-white hover:bg-[#6A645C]/40 hover:text-white":
                        !isActive,
                    }
                  )}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-[#6A645C] p-4">
            <Button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-light-white transition-colors duration-200 bg-none shadow-none focus:!ring-0 outline-none hover:bg-[#6A645C]/40"
              label={loggingOut ? "Logging out..." : "Logout"}
              icon={<LucideLogOut size={20} />}
            />
          </div>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden bg-[#F7F3EE]">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <div
            className="absolute inset-0 opacity-[0.22]"
            style={{
              backgroundImage: `url(${pageBgFull})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage: `url(${fabricLines})`,
              backgroundSize: "720px auto",
              backgroundRepeat: "repeat",
              backgroundPosition: "top left",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, rgba(247,243,238,0.82) 0%, rgba(249,246,241,0.72) 45%, rgba(239,231,220,0.78) 100%)",
            }}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <HeaderVectors variant="page" />
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[220px] overflow-hidden"
          aria-hidden
        >
          <HeaderVectors variant="toolbar" />
        </div>

        <div className="relative z-40 sticky top-0 shrink-0 bg-[#F9F6F1]/55 backdrop-blur-[2px] border-b border-[#E8DFD4]">
          <div className="flex h-16 items-center justify-between px-6">
            <h2 className="text-xl font-semibold text-[#0B1C30]">
              {pageTitles[activeTab] || "Super Admin"}
            </h2>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-light-primary flex items-center justify-center">
                <LucideUser className="text-light-white" size={18} />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-medium text-[#0B1C30]">
                  {displayName}
                </span>
                <span className="text-xs text-[#7D766C]">superadmin</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-transparent p-4 md:p-6 scrollbar">
          {reduceMotion ? (
            <div className="space-y-6">{children}</div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="space-y-6"
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
