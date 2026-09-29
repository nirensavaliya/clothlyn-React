import React, { useState } from "react";
import UserLoginForm from "../component/UserLogin/UserLoginForm";
import LoginPageShell from "../component/Login/LoginPageShell";
import LoaderComponent from "../component/common/Loader";

const UserLoginPage = () => {
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  return (
    <>
      {(isOtpLoading || isLoginLoading) && <LoaderComponent size={56} />}
      <LoginPageShell>
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
