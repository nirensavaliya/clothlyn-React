import axios from 'axios';
import { toast } from 'react-toastify';

const BASE_URL = process.env.REACT_APP_BASE_URL;

export const verifyTenantCode = async (clientCode) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/tenants/verify/${encodeURIComponent(clientCode)}`
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || 'Client code not found';
    toast.error(errorMessage, { toastId: 'tenant-verify-error' });
    throw new Error(errorMessage);
  }
};
