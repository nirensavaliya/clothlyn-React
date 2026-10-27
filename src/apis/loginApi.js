
import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthToken } from '../utils/authToken';
import { firebaseAuthError } from '../utils/firebasePhone';

const BASE_URL = process.env.REACT_APP_BASE_URL;

const LOCAL_OTP_FLAG = 'otpEnvLocal';

export const isLocalOtpMode = () =>
  sessionStorage.getItem(LOCAL_OTP_FLAG) === '1' ||
  process.env.NODE_ENV === 'development';

export const enableLocalOtpMode = () => {
  sessionStorage.setItem(LOCAL_OTP_FLAG, '1');
};

export const requestOTP = async (phoneNumber, clientCode, loginType = 'admin') => {
  try {
    const env = isLocalOtpMode() ? 'local' : 'live';
    const payload = { phoneNumber, clientCode, loginType, env };
    const response = await axios.post(`${BASE_URL}/api/users/request-otp`, payload);
    const otp = response.data?.data?.otp;
    toast.success(
      otp
        ? `OTP: ${otp}`
        : response.data?.message || 'OTP sent to your mobile number',
      { toastId: 'otp-status' }
    );
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || firebaseAuthError(error);
    toast.error(errorMessage, { toastId: 'otp-status' });
    throw new Error(errorMessage);
  }
};

export const loginApi = async (loginData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/users/login`, loginData);
    toast.success(response?.data?.message || 'Login Successfully!', { toastId: 'login-status' });
    return response.data;
  } catch (error) {
    const loginErrorMessage = error.response?.data?.message || firebaseAuthError(error);
    toast.error(loginErrorMessage, { toastId: 'login-status' });
    throw new Error(loginErrorMessage);
  }
};

export const logoutApi = async () => {
  try {
    const token = getAuthToken();

    const response = await axios.post(`${BASE_URL}/api/users/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });    
    toast.success(response?.data?.message || 'Logout Successfully!', { toastId: 'logout-status' });
    return response.data;
  } catch (error) {
    const logoutErrorMessage = error.response?.data?.message || "logout failed";
    toast.error(logoutErrorMessage, { toastId: 'logout-status' });
    throw new Error(logoutErrorMessage);
  }
};


export const loginUserApi = async (loginData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/users/user-login`, loginData);
    toast.success(response?.data?.message || 'User Login Successfully!', { toastId: 'user-login-status' });
    return response.data;
  } catch (error) {
    const loginErrorMessage = error.response?.data?.message || firebaseAuthError(error);
    toast.error(loginErrorMessage, { toastId: 'user-login-status' });
    throw new Error(loginErrorMessage);
  }
};
