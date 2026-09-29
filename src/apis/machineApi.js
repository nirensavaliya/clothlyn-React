import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthHeaders, getAuthUserId } from '../utils/authToken';

const BASE_URL = process.env.REACT_APP_BASE_URL;

export const getMachines = async (params) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/machines`, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getMachineById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/machines/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const addMachine = async (machineData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/machines`, {
      ...machineData,
      userId: getAuthUserId(),
    }, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    toast.success(response?.data?.message || 'Machine added successfully!', { toastId: 'machine-add-status' });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateMachine = async (id, machineData) => {
  try {
    const response = await axios.patch(`${BASE_URL}/api/machines/${id}`, {
      ...machineData,
      userId: getAuthUserId(),
    }, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    toast.success( 'Machine updated successfully!', { toastId: 'machine-update-status' });

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteMachine = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/machines/${id}`, {
      headers: getAuthHeaders(),
    });
    toast.success('Machine deleted successfully!', { toastId: 'machine-deleted-status' });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
