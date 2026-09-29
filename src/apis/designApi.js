import axios from 'axios';
import { getAuthHeaders, getAuthToken } from '../utils/authToken';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_BASE_URL;

const getAuthUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

const createApiInstance = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${getAuthToken()}` }),
    },
  });
};

export const createDesign = async (designData) => {
  const api = createApiInstance();
  const response = await api.post('/api/designs', designData);
  return response.data;
};

export const getDesigns = async (params = {}) => {
  const api = createApiInstance();
  const response = await api.get('/api/designs', { params });
  return response.data;
};

export const getDesignById = async (designId) => {
  const api = createApiInstance();
  const response = await api.get(`/api/designs/${designId}`);
  return response.data;
};

export const updateDesign = async (designId, updateData) => {
  // console.log(designId,"designId")
  // console.log(updateData,"updateData")
  const api = createApiInstance();
  const response = await api.put(`/api/designs/${designId}`, updateData);
  // console.log(response,"response")
  return response.data;
};

export const deleteDesign = async (designId) => {
  const api = createApiInstance();
  const response = await api.delete(`/api/designs/${designId}`);
  return response.data;
};

export const updateDesignProcessPrices = async (designId, processUpdates) => {
  const api = createApiInstance();
  const response = await api.put(`/api/designs/${designId}/processes/prices`, { processes: processUpdates });
  return response.data;
};

export const getDesignCurrentPrices = async (designId) => {
  try {
    const api = createApiInstance();
    const response = await api.get(`/api/designs/${designId}/current-prices`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDesignProcessRates = async (designId) => {
  try {
    const api = createApiInstance();
    const response = await api.get(`/api/designs/${designId}/process-rates`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addProcessToDesign = async (designId, processData) => {
  const api = createApiInstance();
  const response = await api.post(`/api/designs/${designId}/processes`, processData);
  return response.data;
};

export const updateDesignProcess = async (designId, processId, processData) => {
  try {
    const api = createApiInstance();
    const response = await api.put(`/api/designs/${designId}/processes/${processId}`, processData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProcessRate = async (designId, processId, rateData) => {
  try {
    const api = createApiInstance();
    const response = await api.put(`/api/designs/${designId}/processes/${processId}/rate`, rateData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProcessRateHistory = async (designId, processId) => {
  try {
    const api = createApiInstance();
    const response = await api.get(`/api/designs/${designId}/processes/${processId}/rate-history`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addProcessPricePeriod = async (designId, processId, priceData) => {
  try {
    const api = createApiInstance();
    const response = await api.post(`/api/designs/${designId}/processes/${processId}/price-period`, priceData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteDesignProcess = async (designId, processId) => {
  const api = createApiInstance();
  const response = await api.delete(`/api/designs/${designId}/processes/${processId}`);
  return response.data;
};

export const searchDesigns = async (query, params = {}) => {
  try {
    const api = createApiInstance();
    const response = await api.get('/api/designs/search', {
      params: { query, ...params }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createDesignAlternative = async (designData) => {
  try {
    const api = createApiInstance();
    const response = await api.put('/api/designs/new', designData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createDesignAlternative2 = async (designData) => {
  try {
    const api = createApiInstance();
    const response = await api.put('/api/designs/create', designData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDesignByNumber = async (designNumber) => {
  const api = createApiInstance();
  const response = await api.get(`/api/designs/by-number/${encodeURIComponent(designNumber)}`);
  return response.data;
};

export const getDesignByNumberAndStatus = async (lotNo) => {
  const api = createApiInstance();
  const response = await api.get(`/api/designs/by-number/${encodeURIComponent(lotNo)}/status`);
  return response.data;
};
export const getDesignByNumberDetails = async (designNumber, params = {}) => {
  const api = createApiInstance();
  const response = await api.get(`/api/dashboard/designLot`, {
      params: { designNumber, ...params }
    });
  return response.data;
};

export const getDesignNumbers = async () => {
  const api = createApiInstance();
  const response = await api.get('/api/designs/numbers');
  return response.data;
};

export const getDesignProductReport = async (designNumber) => {
  const api = createApiInstance();
  const response = await api.get(`/api/designs/product-report/${encodeURIComponent(designNumber)}`);
  return response.data;
};

// export const updateDesignStatus = async (designNumber, status) => {
//   const api = createApiInstance();
//   const response = await api.put(`/api/designs/by-number/${encodeURIComponent(designNumber)}/status`, { status });
//   return response.data;
// };

// Update status for both Design and DashboardData by design number
export const updateStatusByDesignNumber = async (lotNumber, status, nextDesigneProcess, employeeId, single, fatlock, kansai, schand_ProcessId ) => {
  const api = createApiInstance();
  const token = getAuthToken();
  const user = getAuthUser();
  const decoded = jwtDecode(token);
  const userId = decoded?.id || user?._id || user?.data?._id || '';

  const response = await api.put(`/api/designs/by-number/${encodeURIComponent(lotNumber)}/status`, { status , nextDesigneProcess, userId, single, fatlock, kansai, schand_ProcessId });
  return response.data;
}; 