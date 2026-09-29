import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation } from "react-router-dom";

const ease = [0.22, 1, 0.36, 1];

/**
 * Soft “bundle” page enter/exit when the route changes.
 * (Cloth vectors live on DashboardLayout so they can peek into sticky header.)
 */
export const PageTransition = ({ children, className = "space-y-6" }) => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname + location.search}
        className={className}
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.99 }}
        transition={{ duration: 0.32, ease }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Staggered “bundle open” enter for list / table rows.
 */
export const bundleRowTransition = (index = 0) => ({
  initial: { opacity: 0, y: 14, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: {
    duration: 0.28,
    delay: Math.min(index, 28) * 0.032,
    ease,
  },
});

export default PageTransition;
