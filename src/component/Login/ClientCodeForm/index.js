import React, { useState } from "react";
import Button from "../../common/Button";
import InputElement from "../../common/InputElement";
import { verifyTenantCode } from "../../../apis/tenantApi";
import { useNavigate } from "react-router-dom";
import {
  loginLinkClass,
  loginMutedClass,
  loginPrimaryBtnClass,
  loginTitleClass,
} from "../LoginPageShell";

const ClientCodeForm = ({
  formData,
  errors,
  onChange,
  onNextStep,
  onTenantVerified,
  showBackToDefault = false,
  onBackToDefault,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientCode) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyTenantCode(formData.clientCode);
      if (onTenantVerified) {
        onTenantVerified(response?.data || {});
      }
      onNextStep(2);
    } catch (error) {
      console.error("Error verifying client code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-between h-full gap-6"
      >
        <div className="text-center mb-2">
          <h2 className={loginTitleClass}>Client Code</h2>
          <p className={loginMutedClass}>Enter your company client code</p>
        </div>
        <div className="text-start">
          <InputElement
            name="Client Code"
            type="text"
            placeholder="Enter Client Code (e.g. GI1001)"
            value={formData.clientCode}
            onChange={(value) => onChange("clientCode", value)}
            variant="size_44"
            error={errors.clientCode}
            is_required={true}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="large"
          label={isLoading ? "Verifying..." : "Continue"}
          className={loginPrimaryBtnClass}
          onClick={handleSubmit}
          disabled={isLoading}
        />
        <div className="text-center mt-4 space-y-2">
          {showBackToDefault && onBackToDefault && (
            <div>
              <button
                type="button"
                className={loginLinkClass}
                onClick={onBackToDefault}
              >
                Back to default login
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
      </form>
    </div>
  );
};

export default ClientCodeForm;
