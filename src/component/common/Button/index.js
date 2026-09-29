import React from "react";
import classNames from "classnames";
import { Loader, LucideLoader } from "lucide-react";

const Button = ({
  variant = "primary",
  size = "default",
  disabled = false,
  loading = false,
  icon = null,
  afterIcon = null,
  label = "",
  onClick = () => {},
  className = "",
  type = "button",
  ...props
}) => {
  const baseStyles = "font-semibold rounded-xl transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-[#C5B396] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none max-sm:text-sm";

  const variants = {
    primary: "bg-light-primary text-light-white hover:bg-light-primary_hover shadow-lg",
    secondary: "bg-light-primary text-light-white hover:bg-light-primary_hover shadow-lg",
    outline: "border border-light-natural_300 text-natural-700 bg-transparent hover:bg-natural-100",
    default: "bg-light-natural_200 border border-light-natural_300 text-natural-700 bg-transparent hover:bg-natural-100",
    normal: " bg-transparent text-light-primary !p-0"
  };

  const sizes = {
    default: "py-3 px-6 text-base",
    small: "py-2 px-4 text-sm",
    medium: "py-2.5 px-5 text-base",
    large: "py-4 px-8 text-lg"
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classNames(
        baseStyles,
        variants[variant],
        sizes[size],
        className,
        {
          "pointer-events-none": loading
        }
      )}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {loading ? (
         <Loader/>
        ) : (
          <>
            {icon && icon}
            {label && <span>{label}</span>}
            {afterIcon && afterIcon}
          </>
        )}
      </div>
    </button>
  );
};

export default Button;