import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthHeaders, getAuthToken } from '../utils/authToken';

const BASE_URL = process.env.REACT_APP_BASE_URL;

export const getUsers = async (params = {}) => {
  try {
    const token = getAuthToken();
    // if (!token) {
    //   toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-users' });
    //   throw new Error('Authentication token not found');
    // }
                                
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortKey) queryParams.append('sortKey', params.sortKey);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
       
    const response = await axios.get(`${BASE_URL}/api/users?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch users';
    toast.error(errorMessage, { toastId: 'users-fetch-error' });
    throw new Error(errorMessage);
  }
};
                                    
export const addUser = async (userData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-addUser' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.post(`${BASE_URL}/api/users`, userData, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    toast.success('User added successfully!', { toastId: 'user-add-success' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add user';
    toast.error(errorMessage, { toastId: 'user-add-error' });
    throw new Error(errorMessage);
  }
};

export const deleteUser = async (userId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-delete-user' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.delete(`${BASE_URL}/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user';
    toast.error(errorMessage, { toastId: 'user-delete-error' });
    throw new Error(errorMessage);
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-updateUser' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.put(`${BASE_URL}/api/users/${userId}`, userData, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    toast.success(response?.data?.message || 'User updated successfully!', { toastId: 'user-update-success' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update user';
    console.error('Error updating user:', error.response ? error.response.data : error.message);
    toast.error(errorMessage, { toastId: 'user-update-error' });
    throw new Error(errorMessage);
  }
};

 export const updateUserStatus = async (userId, userStatusData) => {
  try {
    const response = await axios.put(`${BASE_URL}/api/designs/users/${userId}/status`, userStatusData, {
    });
    toast.success(response?.data?.message || 'User status updated successfully!', { toastId: 'user-status-update-success' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update user status';
    console.error('Error updating user status:', error.response ? error.response.data : error.message);
    toast.error(errorMessage, { toastId: 'user-stratus-update-error' });
    throw new Error(errorMessage);
  }
}; 


export const checkClientUser = async (clientCode) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/tenants/verify/${encodeURIComponent(clientCode)}`
    );
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Client code not registered';
    toast.error(errorMessage, { toastId: 'client-check-error' });
    throw new Error(errorMessage);
  }
};

export const getUserSalaryPaid = async (employeeId , params = {}) => {
  try {
    const token = getAuthToken();

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);  
    if (params.sortKey) queryParams.append('sortKey', params.sortKey);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection); 

    const response = await axios.get(`${BASE_URL}/api/paid-salaries/employee/${employeeId}?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch salary paid';
    toast.error(errorMessage, { toastId: 'users-fetch-error' });
    throw new Error(errorMessage);
  }
};