import React, { useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import UserLoginForm from "../component/UserLogin/UserLoginForm";
import LoginPageShell from "../component/Login/LoginPageShell";
import LoaderComponent from "../component/common/Loader";
import { enableLocalOtpMode, isLocalOtpMode } from "../apis/loginApi";

const LOCAL_OTP_TAP_COUNT = 10;
const TAP_RESET_MS = 3000;

const UserLoginPage = () => {
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [localOtpEnabled, setLocalOtpEnabled] = useState(() => isLocalOtpMode());
  const illustrationTapRef = useRef({ count: 0, timer: null });

  const handleIllustrationTap = useCallback(() => {
    if (illustrationTapRef.current.timer) {
      clearTimeout(illustrationTapRef.current.timer);
    }
    illustrationTapRef.current.count += 1;

    if (illustrationTapRef.current.count >= LOCAL_OTP_TAP_COUNT) {
      illustrationTapRef.current.count = 0;
      enableLocalOtpMode();
      setLocalOtpEnabled(true);
      toast.info("Local OTP mode on — OTP will show in response", {
        toastId: "local-otp-mode",
      });
      return;
    }

    illustrationTapRef.current.timer = setTimeout(() => {
      illustrationTapRef.current.count = 0;
      illustrationTapRef.current.timer = null;
    }, TAP_RESET_MS);
  }, []);

  return (
    <>
      {(isOtpLoading || isLoginLoading) && <LoaderComponent size={56} />}
      <LoginPageShell
        onIllustrationTap={handleIllustrationTap}
        showLocalBadge={localOtpEnabled}
      >
        <UserLoginForm
          isLoginLoading={isLoginLoading}
          setIsLoginLoading={setIsLoginLoading}
          isOtpLoading={isOtpLoading}
          setIsOtpLoading={setIsOtpLoading}
        />
      </LoginPageShell>
    </>
  );
};

export default UserLoginPage;
