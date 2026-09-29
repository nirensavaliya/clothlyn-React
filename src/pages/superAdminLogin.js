import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../component/common/Button";
import InputElement from "../component/common/InputElement";
import PhoneInput from "../component/common/PhoneInput";
import LoaderComponent from "../component/common/Loader";
import LoginPageShell, {
  loginLinkClass,
  loginMutedClass,
  loginPrimaryBtnClass,
  loginTitleClass,
} from "../component/Login/LoginPageShell";
import { requestOTP, loginApi } from "../apis/loginApi";
import usePageTitle from "../hooks/usePageTitle";

const PLATFORM_CLIENT_CODE = "GI0000";

const SuperAdminLoginPage = () => {
  usePageTitle("Super Admin Login");
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpHint, setOtpHint] = useState("");

  const sendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Enter valid phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await requestOTP(phoneNumber, PLATFORM_CLIENT_CODE, "admin");
      setOtpHint(res?.data?.otp || "");
      setStep(2);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    if (!otp) return;
    setLoading(true);
    try {
      const res = await loginApi({
        phoneNumber,
        otp,
        clientCode: PLATFORM_CLIENT_CODE,
        accountRole: "superadmin",
      });
      const data = res?.data || {};
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...data,
          accountRole: "superadmin",
          clientCode: PLATFORM_CLIENT_CODE,
        })
      );
      localStorage.setItem("tenantClientCode", PLATFORM_CLIENT_CODE);
      window.location.replace("/super-admin");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <LoaderComponent size={56} />}
      <LoginPageShell>
        <div className="text-center mb-8">
          <h2 className={loginTitleClass}>Super Admin</h2>
          <div className={loginMutedClass}>
            <p className="mb-1 font-medium text-[#0B1C30]">
              Client Code: {PLATFORM_CLIENT_CODE}
            </p>
            <p>
              {step === 1
                ? "Sign in with your phone number"
                : "Enter the OTP sent to your phone"}
            </p>
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-6 text-start">
            <PhoneInput
              name="Phone Number"
              value={phoneNumber}
              onChange={(d) => setPhoneNumber(d.value)}
              defaultCountry="in"
              is_required={true}
              variant="solid"
              placeholder="Enter phone number"
            />
            <Button
              type="button"
              variant="primary"
              size="large"
              label="Send OTP"
              className={loginPrimaryBtnClass}
              onClick={sendOtp}
              loading={loading}
              disabled={loading}
            />
          </div>
        ) : (
          <div className="space-y-6 text-start">
            <InputElement
              name="OTP"
              value={otp}
              onChange={setOtp}
              placeholder="6 digit OTP"
            />
            {otpHint && (
              <p className={`text-xs ${loginMutedClass}`}>OTP: {otpHint}</p>
            )}
            <div className="flex gap-2 items-center">
              <Button
                type="button"
                variant="default"
                size="large"
                label="Back"
                className="w-full !py-3 !px-4 !rounded-xl !border-[#CFC5B9] !text-[#7D766C]"
                onClick={() => setStep(1)}
              />
              <Button
                type="button"
                variant="primary"
                size="large"
                label="Login"
                className={loginPrimaryBtnClass}
                onClick={login}
                loading={loading}
                disabled={loading}
              />
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            type="button"
            className={loginLinkClass}
            onClick={() => navigate("/panel/login")}
          >
            Client Admin Login
          </button>
        </div>
      </LoginPageShell>
    </>
  );
};

export default SuperAdminLoginPage;
