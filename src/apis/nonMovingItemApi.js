import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthHeaders, getAuthToken } from '../utils/authToken';
import { exportToExcelAdvanced } from '../helpers/excelExport';

const BASE_URL = process.env.REACT_APP_BASE_URL;

export const getNonMovingItems = async (params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error' });
      throw new Error('Authentication token not found');
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.lotNo) queryParams.append('lotNo', params.lotNo);
    if (params.sortKey) queryParams.append('sortKey', params.sortKey);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params.isExcel) queryParams.append('isExcel', params.isExcel);

    const response = await axios.get(`${BASE_URL}/api/items/unchanged-status?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch non-moving items';
    toast.error(errorMessage, { toastId: 'non-moving-items-error' });
    throw new Error(errorMessage);
  }
};

export const exportNonMovingItemsToExcel = async (params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error' });
      throw new Error('Authentication token not found');
    }

    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.lotNo) queryParams.append('lotNo', params.lotNo);
    if (params.sortKey) queryParams.append('sortKey', params.sortKey);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params.isPDF) queryParams.append('isPDF', params.isPDF);
    if (params.isExcel) queryParams.append('isExcel', params.isExcel);


    const response = await axios.get(`${BASE_URL}/api/items/unchanged-status?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `non-moving-items-${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to export non-moving items';
    toast.error(errorMessage, { toastId: 'non-moving-items-export-error' });
    throw new Error(errorMessage);
  }
};

export const exportNonMovingItemsToPDF = async (params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error' });
      throw new Error('Authentication token not found');
    }

    const queryParams = new URLSearchParams();
    queryParams.append('isPDF', 'true');
    if (params.search) queryParams.append('search', params.search);
    if (params.lotNo) queryParams.append('lotNo', params.lotNo);
    if (params.sortKey) queryParams.append('sortKey', params.sortKey);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);

    const response = await axios.get(`${BASE_URL}/api/items/unchanged-status?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to export non-moving items to PDF';
    toast.error(errorMessage, { toastId: 'non-moving-items-pdf-export-error' });
    throw new Error(errorMessage);
  }
};

export const getNonMovingItemById = async (id) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.get(`${BASE_URL}/api/non-moving-items/${id}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch non-moving item details';
    toast.error(errorMessage, { toastId: 'non-moving-item-details-error' });
    throw new Error(errorMessage);
  }
};
