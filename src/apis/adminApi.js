import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthHeaders, getAuthToken } from '../utils/authToken';

const BASE_URL = process.env.REACT_APP_BASE_URL;

const getToken = () => {
  const token = getAuthToken();
  if (!token) {
    toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-admin' });
    throw new Error('Authentication token not found');
  }
  return token;
};

export const getAdminUsers = async () => {
  try {
    const token = getToken();
    const response = await axios.get(`${BASE_URL}/api/users/admins`, {
      params: { page: 1, limit: 500 },
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch admin users';
    toast.error(errorMessage, { toastId: 'admin-users-fetch-error' });
    throw new Error(errorMessage);
  }
};

export const addAdminUser = async (adminData) => {
  try {
    const token = getToken();
    const response = await axios.post(`${BASE_URL}/api/users/admins`, adminData, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    toast.success('Admin user added successfully!', { toastId: 'admin-add-success' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add admin user';
    toast.error(errorMessage, { toastId: 'admin-add-error' });
    throw new Error(errorMessage);
  }
};

export const updateAdminUser = async (adminId, adminData) => {
  try {
    const token = getToken();
    const response = await axios.put(`${BASE_URL}/api/users/admins/${adminId}`, adminData, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    toast.success(response?.data?.message || 'Admin user updated successfully!', { toastId: 'admin-update-success' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update admin user';
    toast.error(errorMessage, { toastId: 'admin-update-error' });
    throw new Error(errorMessage);
  }
};

export const deleteAdminUser = async (adminId) => {
  try {
    const token = getToken();
    const response = await axios.delete(`${BASE_URL}/api/users/admins/${adminId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    toast.success('Admin user deleted successfully!', { toastId: 'admin-delete-success' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete admin user';
    toast.error(errorMessage, { toastId: 'admin-delete-error' });
    throw new Error(errorMessage);
  }
}; 
