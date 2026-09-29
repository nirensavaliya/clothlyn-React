import classNames from "classnames";
import React, { useState, useRef } from "react";

const InputElement = ({
  name,
  is_required = false,
  id = "",
  value,
  defaultValue,
  onChange = () => {},
  placeholder,
  className = "",
  error,
  disabled = false,
  extra_text = "",
  autofill = "off",
  sub_name = "",
  type = "text",
  variant = "solid",
  inputRef,
  extra_text_before = "",
  extra_text_after = "",
  showNumberArrows = false,
  after_icon,
  extraTextClick,
  ...rest
}) => {
  const isTextArea = type === "textarea";
  const [internalError, setInternalError] = useState(null);
  const dateInputRef = useRef(null);

  const validateEmail = (emailValue) => {
    let validationMessage = "";
    if (is_required && !emailValue.trim()) {
      validationMessage = `${name || "Email"} is required.`;
    } else if (emailValue.trim() && !/\S+@\S+\.\S+/.test(emailValue)) {
      validationMessage = `Please enter a valid ${name || "email"} address.`;
    }
    return validationMessage;
  };

  const handleChange = (event) => {
    const inputValue = event.target.value;
    let validationError = "";

    if (type === "email") {
      validationError = validateEmail(inputValue);
      setInternalError(validationError);
      onChange({ value: inputValue, error: validationError });
    } else if (isTextArea) {
      onChange(inputValue, event.target);
    }
    else {
      onChange(inputValue);
    }
  };

  const handleBlur = (event) => {
    if (type === "email") {
      const inputValue = event.target.value;
      const validationError = validateEmail(inputValue);
      setInternalError(validationError);
    }
 
    if (rest.onBlur) {
      rest.onBlur(event);
    }
  };
  
  const displayError = error || internalError;

  const fieldFill =
    "!bg-[#F9F6F1] border border-[#CFC5B9] text-[#0B1C30] placeholder-[#7D766C] focus:ring-[rgba(125,118,108,0.35)] focus:border-[#7D766C]";

  const baseStyles =
    "w-full px-4 py-3 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed " +
    fieldFill;

  const variants = {
    glass: "bg-white/20 border border-white/30 text-white placeholder-white/70 focus:ring-white/50 focus:border-transparent !bg-white/20",
    solid: fieldFill,
    size_44: fieldFill + " !min-h-[44px] !py-2.5",
    outline: "bg-transparent !bg-transparent border border-white/50 text-white placeholder-white/70 focus:ring-white/50 focus:border-white",
    errorStyle: "!border-light-error_500 focus:ring-light-error_400 shadow-error shadow-light-error_50"
  };

  const variantStyles = variants[variant] || variants.solid;

  const inputStyles = classNames(
    baseStyles,
    variantStyles,
    {
      [variants.errorStyle]: displayError,
      "pl-10": extra_text_before,
      "pr-10": extra_text_after,
      "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none":
        type === "number" && !showNumberArrows,
    },
    className
  );

  return (
    <div className={classNames("text-left", className)}>
      {name && (
        <label htmlFor={id} className="block mb-1 one-line">
          <span className="text-light-darkGrey text-sm font-semibold">{name}</span>
          {sub_name && (
            <span className=" natural-400-text ml-1">
              {sub_name}
            </span>
          )}
          {is_required && <span className="required-star ml-1 text-[#f44336]">*</span>}
        </label>
      )}
      <div 
        className={classNames("relative z-[1]", type === "date" ? "cursor-pointer" : "")}
        onClick={(e) => {
          // For date inputs, clicking anywhere on the wrapper should open the calendar
          if (type === "date" && dateInputRef.current) {
            // If clicking directly on input, let it handle naturally
            if (e.target === dateInputRef.current || e.target.closest('input')) {
              return;
            }
            // Otherwise, trigger calendar programmatically
            e.preventDefault();
            e.stopPropagation();
            try {
              if (dateInputRef.current.showPicker && typeof dateInputRef.current.showPicker === 'function') {
                dateInputRef.current.showPicker();
              } else {
                // Fallback: focus and trigger click
                dateInputRef.current.focus();
                dateInputRef.current.click();
              }
            } catch (error) {
              // If showPicker fails, use fallback
              dateInputRef.current.focus();
              dateInputRef.current.click();
            }
          }
        }}
      >
        {/* Custom placeholder for date inputs */}
        {type === "date" && !value && placeholder && (
          <span 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none z-10"
            style={{ fontSize: 'inherit', color: '#6b7280' }}
          >
            {placeholder}
          </span>
        )}
        {isTextArea ? (
          <>
            <textarea
              className={classNames(
                inputStyles,
                "min-h-[100px] resize-none",
                {
                  [variants.errorStyle]: displayError,
                }
              )}
              id={id}
              defaultValue={defaultValue}
              value={value}
              disabled={disabled}
              placeholder={placeholder}
              onChange={handleChange}
              ref={inputRef}
              {...rest}
            />
            {after_icon}
          </>
        ) : (
          <>
            {extra_text_before && (
              <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#7D766C] flex items-center">
                {extra_text_before}
              </span>
            )}
            <input
              autoComplete={autofill}
              className={classNames(inputStyles, type === "date" ? "cursor-pointer" : "")}
              id={id}
              defaultValue={defaultValue}
              value={value}
              disabled={disabled}
              placeholder={placeholder}
              ref={(node) => {
                // Store ref for date inputs
                if (node) {
                  if (type === "date") {
                    dateInputRef.current = node;
                  }
                  // Handle inputRef prop
                  if (inputRef) {
                    if (typeof inputRef === 'function') {
                      inputRef(node);
                    } else if (inputRef) {
                      inputRef.current = node;
                    }
                  }
                }
              }}
              type={type}
              onChange={handleChange}
              onBlur={handleBlur}
              onWheel={(e) => {
                if (type === "number") {
                  e.stopPropagation();
                  e.target.blur();
                }
              }}
              style={type === "date" ? { 
                cursor: "pointer",
                color: value ? "inherit" : "transparent" // Hide default date format text when empty
              } : {}}
              {...rest}
            />
            {extra_text_after && (
              <span onClick={extraTextClick} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-[#7D766C] flex items-center">
                {extra_text_after}
              </span>
            )}
            {after_icon}
          </>
        )}
        {extra_text && !displayError && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
            {extra_text}
          </span>
        )}
      </div>
      {displayError && (
        <div className="mt-1">
          <span className="text-xs text-light-error_500">
            {displayError}
          </span>
        </div>
      )}
    </div>
  );
};

export default InputElement;
