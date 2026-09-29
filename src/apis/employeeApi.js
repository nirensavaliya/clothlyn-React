import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthHeaders, getAuthToken } from '../utils/authToken';

const BASE_URL = process.env.REACT_APP_BASE_URL;


export const getEmployees = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortKey) queryParams.append('sortKey', params.sortKey);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params.status) queryParams.append('status', params.status);
    if (params.processName) queryParams.append('processName', params.processName);
    if (params.machineName) queryParams.append('machineName', params.machineName);

    const response = await axios.get(`${BASE_URL}/api/employees?${queryParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch employees';
    toast.error(errorMessage, { toastId: 'employees-fetch-error' });
    throw new Error(errorMessage);
  }
};

export const addEmployee = async (employeeData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-addEmployee' });
      throw new Error('Authentication token not found');
    }

    
    const response = await axios.post(`${BASE_URL}/api/employees`, employeeData, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json' }
    });
    toast.success(response?.data?.message || 'Employee added successfully!', { toastId: 'employees-add-success' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add employees';
    toast.error(errorMessage, { toastId: 'employees-add-error' });
    throw new Error(errorMessage);
  }
};


export const deleteEmployee = async (employeeId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-delete-employees' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.delete(`${BASE_URL}/api/employees/${employeeId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete employees';
    toast.error(errorMessage, { toastId: 'employees-delete-error' });
    throw new Error(errorMessage);
  }
};

export const updateEmployee = async (employeeId, employeeData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-updateEmployee' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.put(`${BASE_URL}/api/employees/${employeeId}`, employeeData, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    toast.success(response?.data?.message || 'Employee updated successfully!', { toastId: 'employees-update-success' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update employees';
    toast.error(errorMessage, { toastId: 'employees-update-error' });
    throw new Error(errorMessage);
  }
};