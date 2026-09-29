import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../common/Button";
import InputElement from "../../common/InputElement";
import {
  loginLinkClass,
  loginMutedClass,
  loginPrimaryBtnClass,
  loginTitleClass,
} from "../LoginPageShell";

const OTPVerification = ({
  formData,
  errors,
  isOTPLoading,
  onNextStep,
  onChange,
  onPrevious,
  onSubmit,
  otpData,
}) => {
  const navigate = useNavigate();

  const handleKeyDown = (e) => {
    if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Tab") {
      e.preventDefault();
    }
  };

  return (
    <div className="">
      <div className="text-center mb-8">
        <h2 className={loginTitleClass}>Admin</h2>
        <p className={loginMutedClass}>
          Enter the OTP sent to complete your sign-in.
        </p>
      </div>

      <div className="mb-6">
        <div
          className="rounded-xl p-4 text-center border"
          style={{
            backgroundColor: "rgba(197, 179, 150, 0.15)",
            borderColor: "rgba(197, 179, 150, 0.4)",
            color: "#0B1C30",
          }}
        >
          <p className="text-sm">
            An OTP sent to your Mobile
            <br />
            Number {formData?.phoneNumber}
          </p>
          <p className="text-sm">Otp {otpData?.otp}</p>
        </div>
      </div>

      <div className="space-y-6 text-start">
        <div>
          <InputElement
            name="OTP"
            type="number"
            placeholder="Enter OTP"
            value={formData.otp}
            onChange={(value) => onChange("otp", value)}
            variant="size_44"
            error={errors.otp}
            is_required={true}
            className=""
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex items-center gap-2 max-[390px]:flex-col">
          <Button
            type="button"
            variant="default"
            size="large"
            label="Back"
            className="w-full !py-3 !px-4 !rounded-xl !border-[#CFC5B9] !text-[#7D766C]"
            onClick={onPrevious}
          />
          <Button
            type="button"
            variant="primary"
            size="large"
            label="Verify OTP"
            className={loginPrimaryBtnClass}
            onClick={onNextStep}
            loading={isOTPLoading}
          />
        </div>
        <div className="text-center mt-4">
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
  );
};

export default OTPVerification;
