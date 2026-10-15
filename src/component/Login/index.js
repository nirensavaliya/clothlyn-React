import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ClientCodeForm from "./ClientCodeForm";
import LoginForm from "./LoginForm";
import OTPVerification from "./OtpVerification";
import LoginPageShell from "./LoginPageShell";
import { useLogin } from "../../hooks/useLogin";
import LoaderComponent from "../common/Loader";

const DEFAULT_ADMIN_COMPANY =
  process.env.REACT_APP_ADMIN_DEFAULT_COMPANY || "Sitaram Cloth";
const DEFAULT_TENANT_CLIENT_CODE =
  process.env.REACT_APP_DEFAULT_TENANT_CODE || "GI1001";
const CLIENT_CODE_PATTERN = /^GI[A-Z0-9]{4}$/i;
const SUPER_ADMIN_TAP_COUNT = 7;
const SUPER_ADMIN_TAP_RESET_MS = 3000;

const PLATFORM_CLIENT_CODE = "GI0000";

const LoginComponent = ({ platformLogin = false }) => {
  const navigate = useNavigate();
  const logoTapRef = useRef({ count: 0, timer: null });

  const handleLogoTap = useCallback(() => {
    if (logoTapRef.current.timer) {
      clearTimeout(logoTapRef.current.timer);
    }
    logoTapRef.current.count += 1;

    if (logoTapRef.current.count >= SUPER_ADMIN_TAP_COUNT) {
      logoTapRef.current.count = 0;
      navigate("/super-admin/login");
      return;
    }

    logoTapRef.current.timer = setTimeout(() => {
      logoTapRef.current.count = 0;
      logoTapRef.current.timer = null;
    }, SUPER_ADMIN_TAP_RESET_MS);
  }, [navigate]);

  // Sitaram (GI1001): skip client code — start on phone login (step 2)
  const [isOtherClientFlow, setIsOtherClientFlow] = useState(false);
  const [currentStep, setCurrentStep] = useState(2);
  const [formData, setFormData] = useState({
    clientCode: platformLogin ? PLATFORM_CLIENT_CODE : DEFAULT_TENANT_CLIENT_CODE,
    company: platformLogin ? "Super Admin" : DEFAULT_ADMIN_COMPANY,
    username: "",
    password: "",
    phoneNumber: "",
    otp: "",
  });
  const [errors, setErrors] = useState({});
  const [otpData, setOtpData] = useState();
  const {
    sendOTP,
    loginUser,
    isLoading: isOTPLoading,
    error: OTPError,
  } = useLogin();

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      const code = formData.clientCode?.trim().toUpperCase() || "";
      if (!code) {
        newErrors.clientCode = "Client code is required";
      } else if (!CLIENT_CODE_PATTERN.test(code)) {
        newErrors.clientCode = "Use format GI1001 (GI + 4 characters)";
      }
    }

    if (step === 2) {
      if (!formData.phoneNumber) {
        newErrors.phoneNumber = "Phone Number is required";
      } else if (formData.phoneNumber.length !== 10) {
        newErrors.phoneNumber = "Phone Number must be 10 digits";
      }
    }

    if (step === 3 && !formData.otp.trim()) {
      newErrors.otp = "OTP is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    if (field === "clientCode") {
      const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
      setFormData((prev) => ({
        ...prev,
        [field]: normalized,
      }));

      if (errors.clientCode) {
        setErrors((prev) => ({ ...prev, clientCode: "" }));
      }
      return;
    }

    if (field === "phoneNumber") {
      const numericValue = value.replace(/[^0-9]/g, "");

      setFormData((prev) => ({
        ...prev,
        [field]: numericValue,
      }));

      if (!numericValue) {
        setErrors((prev) => ({
          ...prev,
          phoneNumber: "Phone Number is required",
        }));
      } else if (numericValue.length !== 10) {
        setErrors((prev) => ({
          ...prev,
          phoneNumber: "Phone Number must be 10 digits",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          phoneNumber: "",
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleLogin = async () => {
    if (!validateStep(currentStep)) return;

    toast.dismiss("otp-status");
    try {
      const response = await loginUser({
        ...formData,
      });
      const userWithRole = {
        ...response.data,
        accountRole: response.data?.accountRole || "admin",
      };
      localStorage.setItem("user", JSON.stringify(userWithRole));
      localStorage.setItem("tenantClientCode", userWithRole.clientCode || formData.clientCode);
      localStorage.setItem("token", userWithRole.token || response?.data?.token);
      setFormData({
        clientCode: DEFAULT_TENANT_CLIENT_CODE,
        company: DEFAULT_ADMIN_COMPANY,
        username: "",
        password: "",
        phoneNumber: "",
        otp: "",
      });
      setIsOtherClientFlow(false);
      setCurrentStep(2);
      setOtpData({});
      if (userWithRole.accountRole === "superadmin") {
        window.location.replace("/super-admin");
        return;
      }
      navigate("/lots", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleNextStep = async (nextStep) => {
    if (validateStep(currentStep)) {
      if (nextStep === 3) {
        toast.dismiss("otp-status");
        toast.dismiss("login-status");
        try {
          const response = await sendOTP(formData.phoneNumber, formData.clientCode, 'admin');
          setOtpData(response?.data);
          setCurrentStep(nextStep);
        } catch (error) {
          setErrors((prev) => ({
            ...prev,
            phoneNumber: error?.message || "Failed to send OTP. Please try again.",
          }));
        }
      } else if (currentStep === 3) {
        await handleLogin();
      } else {
        setCurrentStep(nextStep);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
    }
  };

  const handleOtherClientLogin = () => {
    setIsOtherClientFlow(true);
    setCurrentStep(1);
    setFormData((prev) => ({
      ...prev,
      clientCode: "",
      company: "",
      phoneNumber: "",
      otp: "",
    }));
    setErrors({});
    setOtpData({});
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => {
      if (prev === 3) return 2;
      if (prev === 2 && isOtherClientFlow) return 1;
      return prev;
    });

    setFormData((prev) => ({
      ...prev,
      otp: "",
    }));
  };

  const renderCurrentStep = () => {
    const commonProps = {
      formData,
      errors,
      onChange: handleChange,
      onNextStep: handleNextStep,
      onPrevious: handlePreviousStep,
      onSubmit: handleSubmit,
      otpData: otpData,
      isOTPLoading,
    };

    switch (currentStep) {
      case 1:
        return (
          <ClientCodeForm
            {...commonProps}
            onLogoTap={handleLogoTap}
            showBackToDefault={isOtherClientFlow}
            onBackToDefault={() => {
              setIsOtherClientFlow(false);
              setCurrentStep(2);
              setFormData((prev) => ({
                ...prev,
                clientCode: DEFAULT_TENANT_CLIENT_CODE,
                company: DEFAULT_ADMIN_COMPANY,
                phoneNumber: "",
                otp: "",
              }));
              setErrors({});
            }}
            onTenantVerified={(data) => {
              if (data?.name) {
                setFormData((prev) => ({ ...prev, company: data.name }));
              }
            }}
          />
        );
      case 2:
        return (
          <LoginForm
            {...commonProps}
            showBack={isOtherClientFlow}
            isDefaultTenant={!isOtherClientFlow}
            onOtherClientLogin={platformLogin ? undefined : handleOtherClientLogin}
            platformLogin={platformLogin}
          />
        );
      case 3:
        return <OTPVerification {...commonProps} />;
      default:
        return <ClientCodeForm {...commonProps} />;
    }
  };

  return (
    <>
      {isOTPLoading && <LoaderComponent size={56} />}
      <LoginPageShell onBrandTap={handleLogoTap}>
        {renderCurrentStep()}
      </LoginPageShell>
    </>
  );
};

export default LoginComponent;
