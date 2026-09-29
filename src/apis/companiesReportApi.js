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

export const getCompaniesReportData = async (params = {}) => {
  try {
    const api = createApiInstance();
    const queryParams = new URLSearchParams();
    
    if (params.companyId) queryParams.append('companyId', params.companyId);
    if (params.dNo) queryParams.append('dNo', params.dNo);
    if (params.colour) queryParams.append('colour', params.colour);
    if (params.size) queryParams.append('size', params.size);

    const response = await api.get(`/api/companies/report/data?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch company report data';
    toast.error(errorMessage, { toastId: 'company-report-fetch-error' });
    throw new Error(errorMessage);
  }
};