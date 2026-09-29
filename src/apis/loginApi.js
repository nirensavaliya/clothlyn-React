
import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthToken } from '../utils/authToken';

const BASE_URL = process.env.REACT_APP_BASE_URL;

export const requestOTP = async (phoneNumber, clientCode, loginType = 'admin') => {
  try {
    const response = await axios.post(`${BASE_URL}/api/users/request-otp`, {
      phoneNumber,
      clientCode,
      loginType,
    });
    toast.success(`${response?.data?.message} OTP:- ${response?.data?.data?.otp}` || 'OTP generated successfully!', { toastId: 'otp-status' });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to request OTP';
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
    const loginErrorMessage = error.response?.data?.message || 'Login failed';
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
    const loginErrorMessage = error.response?.data?.message || 'User Login failed';
    toast.error(loginErrorMessage, { toastId: 'user-login-status' });
    throw new Error(loginErrorMessage);
  }
};