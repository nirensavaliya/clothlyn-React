import React, { useState } from "react";
import PhoneInput from "../../common/PhoneInput";
import InputElement from "../../common/InputElement";
import Button from "../../common/Button";
import { requestOTP, loginUserApi } from "../../../apis/loginApi";
import { useNavigate } from "react-router-dom";
import {
  loginLinkClass,
  loginMutedClass,
  loginPrimaryBtnClass,
  loginTitleClass,
} from "../../Login/LoginPageShell";

const DEFAULT_TENANT_CLIENT_CODE =
  process.env.REACT_APP_DEFAULT_TENANT_CODE || "GI1001";
const DEFAULT_TENANT_COMPANY =
  process.env.REACT_APP_ADMIN_DEFAULT_COMPANY || "Sitaram Cloth";

const UserLoginForm = ({
  isLoginLoading,
  setIsLoginLoading,
  isOtpLoading,
  setIsOtpLoading,
}) => {
  const [isOtherClientFlow, setIsOtherClientFlow] = useState(false);
  const [step, setStep] = useState(2);
  const [clientCode, setClientCode] = useState(DEFAULT_TENANT_CLIENT_CODE);
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpData, setOtpData] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleMobileChange = (dataObject) => {
    setMobileNumber(dataObject.value);
    if (errors.mobileNumber) {
      setErrors((prevErrors) => ({ ...prevErrors, mobileNumber: null }));
    }
  };

  const handleOtpChange = (value) => {
    setOtp(value);
    if (errors.otp) {
      setErrors((prevErrors) => ({ ...prevErrors, otp: null }));
    }
  };

  const switchToOtherClientFlow = () => {
    setIsOtherClientFlow(true);
    setStep(1);
    setClientCode("");
    setMobileNumber("");
    setOtp("");
    setOtpData("");
    setErrors({});
  };

  const switchToDefaultFlow = () => {
    setIsOtherClientFlow(false);
    setStep(2);
    setClientCode(DEFAULT_TENANT_CLIENT_CODE);
    setMobileNumber("");
    setOtp("");
    setOtpData("");
    setErrors({});
  };

  const handleSendOtp = async () => {
    setOtp("");
    if (!clientCode || !/^GI[A-Z0-9]{4}$/i.test(clientCode)) {
      setErrors({ clientCode: "Enter valid client code (e.g. GI1001)" });
      return;
    }
    if (!mobileNumber || mobileNumber.length < 10) {
      setErrors({ mobileNumber: "Please enter a valid mobile number." });
      return;
    }
    setIsOtpLoading(true);
    try {
      const response = await requestOTP(
        mobileNumber,
        clientCode.toUpperCase(),
        "employee"
      );

      setOtpData(response.data);
      setStep(3);
    } catch (error) {
      console.error("Failed to send OTP", error);
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!otp || otp.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit OTP." });
      return;
    }
    setIsLoginLoading(true);
    try {
      const loginData = {
        phoneNumber: mobileNumber,
        otp: otp,
        clientCode: clientCode.toUpperCase(),
        grant_type: "otp",
      };
      const response = await loginUserApi(loginData);
      localStorage.setItem("token", response.data.token);
      const userWithRole = {
        ...response.data.user,
        accountRole: "user",
        clientCode: clientCode.toUpperCase(),
        tenantId: response.data.tenantId,
      };
      localStorage.setItem("user", JSON.stringify(userWithRole));
      navigate("/user-scan", { replace: true });
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoginLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center mb-8">
        <h2 className={loginTitleClass}>Login</h2>
        {step === 1 ? (
          <div className={loginMutedClass}>
            <p className="mb-1 font-medium text-[#0B1C30]">Employee login</p>
            <p>Enter client code</p>
          </div>
        ) : step === 2 ? (
          <div className={loginMutedClass}>
            <p className="mb-1 font-medium text-[#0B1C30]">
              {isOtherClientFlow
                ? `Client: ${clientCode}`
                : DEFAULT_TENANT_COMPANY}
            </p>
            <p>Enter your registered mobile number</p>
          </div>
        ) : (
          <>
            <p className={loginMutedClass}>
              An OTP has been sent to {otpData?.phoneNumber}.
            </p>
            {otpData?.otp && (
              <p className="text-sm mt-2 text-[#0B1C30]">Otp {otpData?.otp}</p>
            )}
          </>
        )}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <InputElement
            name="Client Code"
            value={clientCode}
            onChange={(v) =>
              setClientCode(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
            }
            placeholder="GI1001"
            error={errors.clientCode}
            is_required
          />
          <Button
            variant="primary"
            size="large"
            label="Next"
            className={loginPrimaryBtnClass}
            onClick={() => setStep(2)}
            disabled={!clientCode}
          />
          <div className="text-center mt-4 space-y-2">
            <div>
              <button
                type="button"
                className={loginLinkClass}
                onClick={switchToDefaultFlow}
              >
                Back to default login
              </button>
            </div>
            <div>
              <span className="text-sm font-bold text-[#7D766C]">Are you an administrator? </span>
              <button
                type="button"
                className={loginLinkClass}
                onClick={() => navigate("/panel/login")}
              >
                Click here
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <PhoneInput
            name="Mobile Number"
            value={mobileNumber}
            onChange={handleMobileChange}
            error={errors.mobileNumber}
            is_required={true}
            variant="solid"
            placeholder="Enter mobile number"
            defaultCountry="in"
          />
          <Button
            variant="primary"
            size="large"
            label="Sign In"
            className={loginPrimaryBtnClass}
            onClick={handleSendOtp}
            loading={isOtpLoading}
            disabled={isOtpLoading || !mobileNumber}
          />
          {isOtherClientFlow ? (
            <Button
              variant="outline"
              size="small"
              label="Back"
              className="w-full !text-[#7D766C] !border-[#CFC5B9]"
              onClick={() => setStep(1)}
            />
          ) : (
            <div className="text-center space-y-2">
              <div>
                <button
                  type="button"
                  className={loginLinkClass}
                  onClick={switchToOtherClientFlow}
                >
                  Other client login
                </button>
              </div>
              <div>
                <span className="text-sm font-bold text-[#7D766C]">
                  Are you an administrator?{" "}
                </span>
                <button
                  type="button"
                  className={loginLinkClass}
                  onClick={() => navigate("/panel/login")}
                >
                  Click here
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <InputElement
            name="OTP"
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={handleOtpChange}
            error={errors.otp}
            is_required={true}
            maxLength={6}
            className="tracking-widest"
          />
          <div className="flex items-center gap-2 max-[390px]:flex-col">
            <Button
              variant="secondary"
              size="large"
              label="Resend OTP"
              className="w-full focus:!ring-0 !py-3 !px-4 !rounded-xl !text-[#7D766C] !border-[#CFC5B9]"
              onClick={handleSendOtp}
              loading={isOtpLoading}
              disabled={isOtpLoading}
            />
            <Button
              variant="primary"
              size="large"
              label="Login"
              className={`${loginPrimaryBtnClass} focus:!ring-0`}
              onClick={handleLogin}
              loading={isLoginLoading}
              disabled={isLoginLoading || !otp || otp.length !== 6}
            />
          </div>
          <Button
            variant="outline"
            size="small"
            label="Change Mobile Number"
            className="w-full mt-2 !text-[#7D766C] !border-[#CFC5B9]"
            onClick={() => {
              setStep(2);
              setOtp("");
              setErrors({});
            }}
            disabled={isOtpLoading || isLoginLoading}
          />
          <div className="text-center mt-4">
            <span className="text-sm font-bold text-[#7D766C]">Are you an administrator? </span>
            <button
              type="button"
              className={loginLinkClass}
              onClick={() => navigate("/panel/login")}
            >
              Click here
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLoginForm;
