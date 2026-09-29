// API functions for paid salary management
// Using actual backend endpoints

import axios from "axios";
import { toast } from "react-toastify";
import { getAuthHeaders } from "../utils/authToken";

const BASE_URL = process.env.REACT_APP_BASE_URL || '';

const jsonAuthHeaders = () => ({
  ...getAuthHeaders(),
  'Content-Type': 'application/json',
});

export const getSalaryPaid = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/api/paid-salaries${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: jsonAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching paid salaries:', error);
    throw error;
  }
};

export const addSalaryPaid = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/paid-salaries`, {
      method: 'POST',
      headers: jsonAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding paid salary:', error);
    throw error;
  }
};

export const updateSalaryPaid = async (id, data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/paid-salaries/${id}`, {
      method: 'PATCH',
      headers: jsonAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating paid salary:', error);
    throw error;
  }
};

export const deleteSalaryPaid = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/api/paid-salaries/${id}`, {
      method: 'DELETE',
      headers: jsonAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting paid salary:', error);
    throw error;
  }
};

export const getSalaryPaidExcel = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/api/paid-salaries${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: jsonAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading paid salary report:', error);
    throw error;
  }
};


export const downloadSalaryPaidImportDemo = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/paid-salaries/import-demo`,
      {
        headers: getAuthHeaders(),
        responseType: 'blob',
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error downloading salary paid import demo:', error);
    throw error;
  }
};

export const importSalaryPaidData = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${BASE_URL}/api/paid-salaries/import`, formData, {
            headers: getAuthHeaders(),
        });
        const data = response.data || {};
        const inserted = Number(data.insertedCount) || 0;
        if (inserted > 0) {
          toast.success(
            data.message || `Imported ${inserted} payment entr${inserted === 1 ? 'y' : 'ies'}`,
            { toastId: 'paid-salaries-import-status' }
          );
        } else {
          toast.warning(
            data.message ||
              'No rows imported. Fill Amount column, Save as .xlsx from Numbers/Excel, then upload again.',
            { toastId: 'paid-salaries-import-status' }
          );
        }
        return data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Import failed';
        toast.error(errorMessage, { toastId: 'paid-salaries-import-status' });
        throw new Error(errorMessage);
    }
};
