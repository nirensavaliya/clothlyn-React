import React, { useState } from 'react';
import classNames from 'classnames';

const PhoneInput = ({
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
  variant = "solid",
  inputRef,
  extra_text_before = "+91",
  extra_text_after = "",
  readOnly,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const [internalError, setInternalError] = useState(null);

  const fieldFill =
    "!bg-[#F9F6F1] border border-[#CFC5B9] text-[#0B1C30] placeholder-[#7D766C] focus:ring-[rgba(125,118,108,0.35)] focus:border-[#7D766C]";

  const baseStyles =
    "w-full px-4 py-3 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed " +
    fieldFill;

  const variants = {
    glass: "bg-white/20 !bg-white/20 border border-white/30 text-white placeholder-white/70 focus:ring-white/50 focus:border-transparent",
    solid: fieldFill,
    size_44: fieldFill + " !min-h-[44px] !py-2.5",
    outline: "bg-transparent !bg-transparent border border-white/50 text-white placeholder-white/70 focus:ring-white/50 focus:border-white",
    errorStyle: "!border-light-error_500 focus:ring-light-error_400 shadow-error shadow-light-error_50"
  };

  const displayError = error || internalError;

  const inputStyles = classNames(
    baseStyles,
    variants[variant] || variants.solid,
    {
      [variants.errorStyle]: displayError,
      "pl-12": extra_text_before,
      "pr-10": extra_text_after,
    },
    className
  );

  const handlePhoneChange = (e) => {
    let rawValueFromEvent = e.target.value;
    let stringToProcess = "";

    if (rawValueFromEvent === null || typeof rawValueFromEvent === "undefined") {
      stringToProcess = "";
    } else {
      stringToProcess = String(rawValueFromEvent);
    }

    const numericValue = stringToProcess.replace(/[^0-9]/g, "");
    const limitedValue = numericValue.substring(0, 10);

    let validationMessage = "";

    if (is_required && !limitedValue) {
      validationMessage = `${name || 'Phone Number'} is required.`;
    } else if (limitedValue && limitedValue.length > 0 && limitedValue.length !== 10) {
      validationMessage = `${name || 'Phone Number'} must be 10 digits.`;
    }

    setInternalError(validationMessage);
    onChange({ value: limitedValue, error: validationMessage });
  };

  const handleBlur = () => {
    setFocused(false);
    let validationMessage = "";
    let currentValueAsString = "";

    if (value === null || typeof value === "undefined") {
        currentValueAsString = "";
    } else {
        currentValueAsString = String(value);
    }

    if (is_required && !currentValueAsString) {
      validationMessage = `${name || 'Phone Number'} is required.`;
    } else if (currentValueAsString && currentValueAsString.length > 0 && currentValueAsString.length !== 10) {
      validationMessage = `${name || 'Phone Number'} must be 10 digits.`;
    }
    setInternalError(validationMessage);
  };


  return (
    <div className={classNames("text-start", className)}>
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
      <div className="relative">
        {extra_text_before && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
            {extra_text_before}
          </span>
        )}
        <input
          autoComplete={autofill}
          className={inputStyles}
          id={id}
          defaultValue={defaultValue}
          value={value}
          disabled={disabled}
          placeholder={placeholder || '9876543210'}
          ref={inputRef}
          type="tel"
          onChange={handlePhoneChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          readOnly={readOnly}
          // maxLength={10}
          {...rest}
        />
        {extra_text_after && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {extra_text_after}
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
      {extra_text && !displayError && (
        <div className="mt-1">
          <span className="text-xs text-gray-500">
            {extra_text}
          </span>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;