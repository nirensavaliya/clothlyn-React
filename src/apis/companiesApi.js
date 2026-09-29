import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthHeaders, getAuthToken } from '../utils/authToken';

const BASE_URL = process.env.REACT_APP_BASE_URL;


const createApiInstance = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${getAuthToken()}` }),
    },
  });
};

export const getCompanies = async (params = {}) => {
  try {
    const api = createApiInstance();
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.isActive !== undefined && params.isActive !== null && params.isActive !== '') {
      queryParams.append('isActive', params.isActive);
    }
    if (params.sortKey) queryParams.append('sortKey', params.sortKey);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);

    const response = await api.get(`/api/companies?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch companies';
    toast.error(errorMessage, { toastId: 'companies-fetch-error' });
    throw new Error(errorMessage);
  }
};

export const createCompany = async (companyData) => {
  try {
    const api = createApiInstance();
    const response = await api.post('/api/companies', companyData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create company';
    toast.error(errorMessage, { toastId: 'company-create-error' });
    throw new Error(errorMessage);
  }
};

export const updateCompany = async (companyId, companyData) => {
  try {
    const api = createApiInstance();
    const response = await api.patch(`/api/companies/${companyId}`, companyData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update company';
    toast.error(errorMessage, { toastId: 'company-update-error' });
    throw new Error(errorMessage);
  }
};

export const deleteCompany = async (companyId) => {
  try {
    const api = createApiInstance();
    const response = await api.delete(`/api/companies/${companyId}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete company';
    toast.error(errorMessage, { toastId: 'company-delete-error' });
    throw new Error(errorMessage);
  }
};