import axios from 'axios'; 

 const API_BASE_URL = process.env.REACT_APP_BASE_URL; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createAssignment = async (assignmentData) => {
  try {
    const response = await api.post('/api/assignments/assignments', assignmentData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create assignment');
  }                                                                            
};

export const getAssignments = async (params = {}) => {
  try {
    const response = await api.get('/api/assignments/assignments', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch assignments');
  }
};

export const getAssignmentById = async (id) => {
  try {
    const response = await api.get(`/api/assignments/assignments/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch assignment');
  }
};

export const updateAssignmentStatus = async (id, statusData) => {
  try {
    const response = await api.patch(`/api/assignments/assignments/${id}/status`, statusData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update assignment status');
  }
};

export const deleteAssignment = async (id) => {
  try {
    const response = await api.delete(`/api/assignments/assignments/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete assignment');
  }
};

export const getUserActiveAssignments = async (userId) => {
  try {
    const response = await api.get(`/api/assignments/users/${userId}/assignments`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user assignments');
  }
}; 
