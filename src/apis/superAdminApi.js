import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthHeaders } from '../utils/authToken';

const BASE_URL = process.env.REACT_APP_BASE_URL;

export const listOtpLogs = async ({ page = 1, limit = 50, search = '' } = {}) => {
  const response = await axios.get(`${BASE_URL}/api/super-admin/otp-logs`, {
    headers: getAuthHeaders(),
    params: { page, limit, ...(search ? { search } : {}) },
  });
  return response.data;
};

export const listTenants = async () => {
  const response = await axios.get(`${BASE_URL}/api/super-admin/tenants`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createTenant = async (payload) => {
  const response = await axios.post(
    `${BASE_URL}/api/super-admin/tenants`,
    payload,
    { headers: getAuthHeaders() }
  );
  toast.success(response.data?.message || 'Client created');
  return response.data;
};

export const updateTenant = async (tenantId, payload) => {
  const response = await axios.patch(
    `${BASE_URL}/api/super-admin/tenants/${tenantId}`,
    payload,
    { headers: getAuthHeaders() }
  );
  toast.success(response.data?.message || 'Client updated');
  return response.data;
};

export const deleteTenant = async (tenantId) => {
  const response = await axios.delete(
    `${BASE_URL}/api/super-admin/tenants/${tenantId}`,
    { headers: getAuthHeaders() }
  );
  toast.success(response.data?.message || 'Client deleted');
  return response.data;
};

export const listSuperAdminUsers = async () => {
  const response = await axios.get(`${BASE_URL}/api/super-admin/users`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createSuperAdminUser = async (payload) => {
  const response = await axios.post(
    `${BASE_URL}/api/super-admin/users`,
    payload,
    { headers: getAuthHeaders() }
  );
  toast.success(response.data?.message || 'Super admin user saved');
  return response.data;
};

export const updateSuperAdminUserStatus = async (userId, status) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/super-admin/users/${userId}/status`,
      { status },
      { headers: getAuthHeaders() }
    );
    toast.success(response.data?.message || 'Status updated');
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || 'Status update failed');
    throw error;
  }
};

export const deleteSuperAdminUser = async (userId) => {
  const response = await axios.delete(
    `${BASE_URL}/api/super-admin/users/${userId}`,
    { headers: getAuthHeaders() }
  );
  toast.success(response.data?.message || 'User deleted');
  return response.data;
};

export const listTenantAdmins = async (tenantId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/super-admin/tenants/${tenantId}/admins`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || 'Failed to load admin users';
    toast.error(msg);
    throw error;
  }
};

export const listTenantEmployees = async (tenantId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/super-admin/tenants/${tenantId}/employees`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || 'Failed to load employees';
    toast.error(msg);
    throw error;
  }
};

export const createTenantAdmin = async (tenantId, payload) => {
  const response = await axios.post(
    `${BASE_URL}/api/super-admin/tenants/${tenantId}/admins`,
    payload,
    { headers: getAuthHeaders() }
  );
  toast.success(response.data?.message || 'Admin user created');
  return response.data;
};

export const updateTenantAdmin = async (tenantId, userId, payload) => {
  const response = await axios.patch(
    `${BASE_URL}/api/super-admin/tenants/${tenantId}/admins/${userId}`,
    payload,
    { headers: getAuthHeaders() }
  );
  toast.success(response.data?.message || 'Admin user updated');
  return response.data;
};

export const getAppRelease = async () => {
  const response = await axios.get(`${BASE_URL}/api/app/release`);
  return response.data;
};

export const uploadAppRelease = async ({ versionCode, file }) => {
  const form = new FormData();
  form.append('versionCode', String(versionCode));
  if (file) form.append('apk', file);
  const response = await axios.post(`${BASE_URL}/api/app/release`, form, {
    headers: getAuthHeaders(),
  });
  toast.success(response.data?.message || 'App release updated');
  return response.data;
};

export const deleteTenantAdmin = async (tenantId, userId) => {
  const response = await axios.delete(
    `${BASE_URL}/api/super-admin/tenants/${tenantId}/admins/${userId}`,
    { headers: getAuthHeaders() }
  );
  toast.success(response.data?.message || 'Admin user deleted');
  return response.data;
};
