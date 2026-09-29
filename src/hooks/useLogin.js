import { useState } from 'react';
import { requestOTP, loginUser as apiLoginUser, loginApi, logoutApi } from '../apis/loginApi';
import { toast } from 'react-toastify';

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendOTP = async (phoneNumber, clientCode, loginType = 'admin') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await requestOTP(phoneNumber, clientCode, loginType);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

   const loginUser = async (loginData) => {
    setIsLoading(true);
    setError(null);
    
    
    try {
      const response = await loginApi({
         phoneNumber: loginData.phoneNumber,
        otp: loginData.otp,
        username: loginData.username,
        password: loginData.password,
        clientCode: loginData.clientCode,
        company: loginData.company
      });
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

   const logoutUser = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await logoutApi();
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };


  return { sendOTP, loginUser, logoutUser, isLoading, error };
};