import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthHeaders, getAuthToken } from '../utils/authToken';

const BASE_URL = process.env.REACT_APP_BASE_URL ;

export const getItems = async (params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error' });
      throw new Error('Authentication token not found');
    }

    const queryParams = new URLSearchParams();
    if (params.isExcel) queryParams.append('isExcel', params.isExcel);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortKey) queryParams.append('sortKey', params.sortKey);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params.size) queryParams.append('size', params.size);
    if (params.color) queryParams.append('color', params.color);
    if (params.designNumber) queryParams.append('designNumber', params.designNumber);
    if (params.status) queryParams.append('status', params.status);
    if (params.pic) queryParams.append('pic', params.pic);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.employeeCode) queryParams.append('employeeCode', params.employeeCode);
    if (params.sendReceive) queryParams.append('sendReceive', params.sendReceive);
    if (params.nickName) queryParams.append('nickName', params.nickName);


    const response = await axios.get(`${BASE_URL}/api/items?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.data; 
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch items';
    toast.error(errorMessage, { toastId: 'items-fetch-status' });
    throw new Error(errorMessage);
  }
};

export const addItem = async (itemData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-add' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.post(`${BASE_URL}/api/items`, itemData, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    toast.success(response?.data?.message || 'Design added successfully!', { toastId: 'design-add-status' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add design';
    toast.error(errorMessage, { toastId: 'design-add-status' });
    throw new Error(errorMessage);
  }
};

export const deleteItem = async (itemId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-delete' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.delete(`${BASE_URL}/api/items/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.data; 
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete design';
    toast.error(errorMessage, { toastId: 'design-delete-status' });
    throw new Error(errorMessage);
  }
};

export const updateItem = async (itemId , itemData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-add' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.patch(`${BASE_URL}/api/items/${itemId}`, itemData, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    toast.success(response?.data?.message || 'Design updated successfully!', { toastId: 'design-updated-status' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update design';
    toast.error(errorMessage, { toastId: 'design-updated-status' });
    throw new Error(errorMessage);
  }
};

export const getUniqueColors = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-colors' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(`${BASE_URL}/api/items/colors`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch colors';
    toast.error(errorMessage, { toastId: 'items-colors-fetch-status' });
    throw new Error(errorMessage);
  }
};

export const updateItemRatesByDate = async (designId, rateUpdates) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-update-rates' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.patch(`${BASE_URL}/api/items/${designId}/rates-by-date`, { processRateUpdates: rateUpdates }, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    toast.success(response?.data?.message || 'Design rates updated successfully!', { toastId: 'design-rates-updated-status' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update design rates';
    toast.error(errorMessage, { toastId: 'design-rates-updated-status' });
    throw new Error(errorMessage);
  }
};

export const getUniqueSizes = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-sizes' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(`${BASE_URL}/api/items/sizes`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch sizes';
    toast.error(errorMessage, { toastId: 'design-sizes-fetch-status' });
    throw new Error(errorMessage);
  }
};