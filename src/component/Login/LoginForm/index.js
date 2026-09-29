import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../common/Button";
import PhoneInput from "../../common/PhoneInput";
import {
  loginLinkClass,
  loginMutedClass,
  loginPrimaryBtnClass,
  loginTitleClass,
} from "../LoginPageShell";

const LoginForm = ({
  formData,
  errors,
  onChange,
  onNextStep,
  onPrevious,
  isOTPLoading,
  showBack = true,
  isDefaultTenant = false,
  onOtherClientLogin,
}) => {
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    onNextStep(3);
  };

  const tenantLabel = isDefaultTenant
    ? formData.company || "Sitaram Cloth"
    : formData.clientCode;

  return (
    <div className="">
      <div className="text-center mb-8">
        <h2 className={loginTitleClass}>Admin</h2>
        <div className={loginMutedClass}>
          <p className="mb-1 font-medium text-[#0B1C30]">{tenantLabel}</p>
          <p>Sign in with your admin phone number</p>
        </div>
      </div>

      <div className="space-y-6 text-start">
        <div className="relative">
          <PhoneInput
            name="Phone Number"
            value={formData.phoneNumber}
            onChange={(dataObject) => {
              onChange("phoneNumber", dataObject.value);
            }}
            error={errors.phoneNumber}
            is_required={true}
            variant="solid"
            placeholder="Enter phone number"
          />
        </div>
        <div
          className={`flex gap-2 items-center ${!showBack ? "justify-stretch" : ""}`}
        >
          {showBack && (
            <Button
              type="button"
              variant="default"
              size="large"
              label="Back"
              className="w-full !py-3 !px-4 !rounded-xl !border-[#CFC5B9] !text-[#7D766C]"
              onClick={onPrevious}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            size="large"
            label="Sign In"
            className={`${loginPrimaryBtnClass} ${!showBack ? "!w-full" : ""}`}
            onClick={handleSubmit}
            loading={isOTPLoading}
            disabled={isOTPLoading}
          />
        </div>
        <div className="text-center mt-4 space-y-2">
          {isDefaultTenant && onOtherClientLogin && (
            <div>
              <button
                type="button"
                className={loginLinkClass}
                onClick={onOtherClientLogin}
              >
                Other client login
              </button>
            </div>
          )}
          <div>
            <span className="text-sm font-bold text-[#7D766C]">Are you an employee? </span>
            <button
              type="button"
              className={loginLinkClass}
              onClick={() => navigate("/user/login")}
            >
              Click here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
