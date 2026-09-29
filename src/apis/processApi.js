
import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthHeaders, getAuthUserId } from '../utils/authToken';

const BASE_URL = process.env.REACT_APP_BASE_URL ;

const showReplacingErrorToast = (message, toastId) => {
  if (toastId && toast.isActive(toastId)) {
    toast.dismiss(toastId);
  }
  toast.error(message, toastId ? { toastId } : undefined);
};

export const getProcessSubItemsApi = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve([
        { label: 'Therd', path: '/process/item/therd' },
        { label: 'Master', path: '/process/item/master' },
        { label: 'Doracut', path: '/process/item/doracut' },
        { label: 'Logo', path: '/process/item/logo' },
        { label: 'Prass', path: '/process/item/prass' },
        { label: 'Packaging', path: '/process/item/packaging' },
      ]);
    }, 1000);
  });
};


export const addProcess = async (processData) => {
  try {
    const payload =
      typeof processData === 'string'
        ? { processName: processData, userId: getAuthUserId() }
        : {
            processName: processData?.processName,
            needsMachine: !!processData?.needsMachine,
            hasSendReceive: !!processData?.hasSendReceive,
            userId: getAuthUserId(),
          };
    const response = await axios.post(`${BASE_URL}/api/processes`, payload, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    toast.success(response?.data?.message || 'Process added successfully!', { toastId: 'item-add-status' });
    clearProcessesCache();

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};


const processesCache = new Map();
const PROCESSES_CACHE_TTL_MS = 60 * 1000;

const buildProcessesCacheKey = ({ page, limit, search = '' } = {}) =>
  JSON.stringify({
    page: page ?? null,
    limit: limit ?? null,
    search: search || '',
  });

export const clearProcessesCache = () => {
  processesCache.clear();
};

export const getProcesses = async ({ page, limit, search = '' } = {}) => {
  const cacheKey = buildProcessesCacheKey({ page, limit, search });
  const cached = processesCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < PROCESSES_CACHE_TTL_MS) {
    return cached.data;
  }
  if (cached?.inflight) {
    return cached.inflight;
  }

  const inflight = (async () => {
    try {
      const params = { page, limit };
      if (search) params.search = search;
      const response = await axios.get(`${BASE_URL}/api/processes`, {
headers: getAuthHeaders(),
        params
      });
      processesCache.set(cacheKey, { data: response.data, ts: Date.now(), inflight: null });
      return response.data;
    } catch (error) {
      processesCache.delete(cacheKey);
      console.error(error);
      throw error;
    }
  })();

  processesCache.set(cacheKey, { data: null, ts: 0, inflight });
  return inflight;
};

export const getProcessById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/processes/${id}`, {
      headers: {
        ...getAuthHeaders(),
      }
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateProcess = async (id, processData) => {
  try {
    const response = await axios.put(`${BASE_URL}/api/processes/${id}`, {
      ...processData,
      userId: getAuthUserId(),
    }, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    clearProcessesCache();
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteProcess = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/processes/${id}`, {
      headers: {
        ...getAuthHeaders(),
      }
    });
    clearProcessesCache();
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createLogoProcess = async (logoProcessData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/logo-process`, logoProcessData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create logo process';
    showReplacingErrorToast(errorMessage, 'logo-process-error');
    throw new Error(errorMessage);
  }
};

export const createPackingProcess = async (packingProcessData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/packing-process`, packingProcessData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create packing process';
    showReplacingErrorToast(errorMessage, 'packing-process-error');
    throw new Error(errorMessage);
  }
};

export const createPressProcess = async (pressProcessData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/press-process`, pressProcessData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create press process';
    showReplacingErrorToast(errorMessage, 'press-process-error');
    throw new Error(errorMessage);
  }
};

export const createDoraCutProcess = async (doraCutProcessData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/doracut-process`, doraCutProcessData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create doraCut process';
    showReplacingErrorToast(errorMessage, 'doracut-process-error');
    throw new Error(errorMessage);
  }
};
export const multipleDoraCutProcess = async (multipleDoraCutProcessData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/doracut-process/bulk`, multipleDoraCutProcessData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create multiple doraCut process';
    showReplacingErrorToast(errorMessage, 'multiple-doracut-process-error');
    throw new Error(errorMessage);
  }
};

export const getDoracutSendLots = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortKey) queryParams.append('sortKey', params.sortKey);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);

    const response = await axios.get(
      `${BASE_URL}/api/doracut-process/send-lots?${queryParams.toString()}`
    );
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || 'Failed to fetch doracut send lots';
    showReplacingErrorToast(errorMessage, 'doracut-send-lots-error');
    throw new Error(errorMessage);
  }
};

export const createRcProcess = async (rcProcessData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/rc-process`, rcProcessData); 
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create rc process';
    showReplacingErrorToast(errorMessage, 'rc-process-error');
    throw new Error(errorMessage);
  }
};

export const getSuggestedEmployees = async (lotNo) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/rc-process/suggested-employees`, {
      params: { lotNo },
      headers: {
        ...getAuthHeaders(),
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get suggested employees:', error);
    return null;
  }
};

export const createLoadingProcess = async (payload) => {
    try {
        const response = await axios.post(`${BASE_URL}/api/loading-process`, payload);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create loading process';
        showReplacingErrorToast(errorMessage, 'loading-process-error');
        throw new Error(errorMessage);
    }
};

export const getLotData = async (lotNo) => {
    try {
        const response = await axios.get(`${BASE_URL}/api/rc-process/lot/${lotNo}`, {
            headers: {
                ...getAuthHeaders(),
            }
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch lot data';
        showReplacingErrorToast(errorMessage, 'lot-data-error');
        throw new Error(errorMessage);
    }
};

export const updateLotData = async (lotNo, updateData) => {
    try {
        const response = await axios.put(`${BASE_URL}/api/rc-process/lot/${lotNo}`, updateData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            }
        });
        toast.success('Lot data updated successfully!', { toastId: 'lot-update-success' });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update lot data';
        showReplacingErrorToast(errorMessage, 'lot-update-error');
        throw new Error(errorMessage);
    }
};

export const updateCompanyAlter = async (lotNo, company, alter) => {
    try {
        const response = await axios.post(
            `${BASE_URL}/api/rc-process/lot/${lotNo}/company-alter`,
            { company, alter: Number(alter) },
            {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            }
        );
        toast.success('Alter updated successfully!', { toastId: 'company-alter-update-success' });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update alter';
        showReplacingErrorToast(errorMessage, 'company-alter-update-error');
        throw new Error(errorMessage);
    }
};

let billScanInFlight = false;

export const createBillScan = async (billScanData) => {
    if (billScanInFlight) {
        const errorMessage = 'Bill scan already in progress. Please wait.';
        showReplacingErrorToast(errorMessage, 'bill-scan-inflight');
        throw new Error(errorMessage);
    }
    billScanInFlight = true;
    try {
        const response = await axios.post(`${BASE_URL}/api/bill-scans`, billScanData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            }
        });
        toast.success('Bill scan data submitted successfully!', { toastId: 'bill-scan-success' });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to submit bill scan data';
        showReplacingErrorToast(errorMessage, 'bill-scan-error');
        throw new Error(errorMessage);
    } finally {
        billScanInFlight = false;
    }
};

let multipleBillScanInFlight = false;

export const createMultipleBillScan = async (multipleBillScanData) => {
    if (multipleBillScanInFlight) {
        const errorMessage = 'Bill scan already in progress. Please wait.';
        showReplacingErrorToast(errorMessage, 'multiple-bill-scan-inflight');
        throw new Error(errorMessage);
    }
    multipleBillScanInFlight = true;
    try {
        // Deduplicate lots in client payload (same lot twice in one submit)
        const seen = new Set();
        const scans = Array.isArray(multipleBillScanData?.scans)
          ? multipleBillScanData.scans.filter((scan) => {
              const lot = String(scan?.lotNo || '').trim();
              if (!lot || seen.has(lot)) return false;
              seen.add(lot);
              return true;
            })
          : [];
        const payload = { ...multipleBillScanData, scans };

        const response = await axios.post(`${BASE_URL}/api/bill-scans/multiple`, payload, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            }
        });
        toast.success('Multiple bill scan data submitted successfully!', { toastId: 'multiple-bill-scan-success' });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to submit multiple bill scan data';
        showReplacingErrorToast(errorMessage, 'multiple-bill-scan-error');
        throw new Error(errorMessage);
    } finally {
        multipleBillScanInFlight = false;
    }
};
export const createCheckingProcess = async (checkingData) => {
    try {
        const response = await axios.post(`${BASE_URL}/api/checking`, checkingData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            }
        });
        toast.success('Bill scan data submitted successfully!', { toastId: 'bill-scan-success' });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to submit checking  data';
        showReplacingErrorToast(errorMessage, 'checking-error');
        throw new Error(errorMessage);
    }
};

export const createGenericScanProcess = async (scanData) => {
    try {
        const response = await axios.post(`${BASE_URL}/api/scan/process`, scanData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create scan process';
        showReplacingErrorToast(errorMessage, 'generic-scan-process-error');
        throw new Error(errorMessage);
    }
};