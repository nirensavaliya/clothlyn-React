import * as XLSX from "xlsx";
import axios from 'axios';
import { toast } from 'react-toastify';
import { getAuthHeaders, getAuthToken } from '../utils/authToken';

const BASE_URL = process.env.REACT_APP_BASE_URL;

export const addUpad = async (upadData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-addUpad' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.post(`${BASE_URL}/api/upads`, upadData, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    toast.success(response?.data?.message || 'UPAD added successfully!', { toastId: 'upad-add-success' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to add UPAD';
    toast.error(errorMessage, { toastId: 'upad-add-error' });
    throw new Error(errorMessage);
  }
};

export const getUpadData = async (params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-getUpad' });
      throw new Error('Authentication token not found');
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortKey) queryParams.append('sortKey', params.sortKey);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params.employeeId) queryParams.append('employeeId', params.employeeId);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);

    const response = await axios.get(`${BASE_URL}/api/upads?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch UPAD data';
    toast.error(errorMessage, { toastId: 'upad-fetch-error' });
    throw new Error(errorMessage);
  }
};

export const updateUpad = async (upadId, upadData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-updateUpad' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.put(`${BASE_URL}/api/upads/${upadId}`, upadData, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    toast.success(response?.data?.message || 'UPAD updated successfully!', { toastId: 'upad-update-success' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update UPAD';
    toast.error(errorMessage, { toastId: 'upad-update-error' });
    throw new Error(errorMessage);
  }
};

export const deleteUpad = async (upadId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-deleteUpad' });
      throw new Error('Authentication token not found');
    }

    const response = await axios.delete(`${BASE_URL}/api/upads/${upadId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    toast.success(response?.data?.message || 'UPAD deleted successfully!', { toastId: 'upad-delete-success' });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete UPAD';
    toast.error(errorMessage, { toastId: 'upad-delete-error' });
    throw new Error(errorMessage);
  }
};

export const getUserUpadData = async (employeeID, params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-getUserUpad' });
      throw new Error('Authentication token not found');
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortKey) queryParams.append('sortKey', params.sortKey);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);

    const response = await axios.get(`${BASE_URL}/api/upads/employee/${employeeID}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch user UPAD data';
    toast.error(errorMessage, { toastId: 'user-upad-fetch-error' });
    throw new Error(errorMessage);
  }
};

/** Deduplicate concurrent identical salary-summary requests (e.g. React Strict Mode double mount). */
const inflightSalarySummaryByQuery = new Map();

export const getSalarySummary = async (params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-salary-summary' });
      throw new Error('Authentication token not found');
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortKey) queryParams.append('sortKey', params.sortKey);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params.isExcel) queryParams.append('isExcel', params.isExcel);
    // Add filter params
    if (params.employeeCode) queryParams.append('employeeCode', params.employeeCode);
    if (params.nickName) queryParams.append('nickName', params.nickName);
    if (params.processName) queryParams.append('processName', params.processName);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    if (inflightSalarySummaryByQuery.has(queryString)) {
      return inflightSalarySummaryByQuery.get(queryString);
    }

    const requestPromise = axios
      .get(`${BASE_URL}/api/upads/salary-summary?${queryString}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })
      .then((response) => response.data)
      .finally(() => {
        inflightSalarySummaryByQuery.delete(queryString);
      });

    inflightSalarySummaryByQuery.set(queryString, requestPromise);
    return await requestPromise;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch salary summary data';
    toast.error(errorMessage, { toastId: 'salary-summary-fetch-error' });
    throw new Error(errorMessage);
  }
};

/** Deduplicate concurrent identical salary-summary-master requests. */
const inflightSalarySummaryMasterByQuery = new Map();

export const getSalarySummaryMaster = async (params = {}) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-salary-summary-master' });
      throw new Error('Authentication token not found');
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortKey) queryParams.append('sortKey', params.sortKey);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params.isExcel) queryParams.append('isExcel', params.isExcel);
    if (params.employeeCode) queryParams.append('employeeCode', params.employeeCode);
    if (params.nickName) queryParams.append('nickName', params.nickName);
    if (params.processName) queryParams.append('processName', params.processName);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    if (inflightSalarySummaryMasterByQuery.has(queryString)) {
      return inflightSalarySummaryMasterByQuery.get(queryString);
    }

    const requestPromise = axios
      .get(`${BASE_URL}/api/upads/salary-summary-master?${queryString}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })
      .then((response) => response.data)
      .finally(() => {
        inflightSalarySummaryMasterByQuery.delete(queryString);
      });

    inflightSalarySummaryMasterByQuery.set(queryString, requestPromise);
    return await requestPromise;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch salary summary (master) data';
    toast.error(errorMessage, { toastId: 'salary-summary-master-fetch-error' });
    throw new Error(errorMessage);
  }
};

export const getSalaryMasterByEmployeeId = async (employeeId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-salary-master-detail' });
      throw new Error('Authentication token not found');
    }
    if (!employeeId) {
      throw new Error('Employee ID is required');
    }

    const response = await axios.get(`${BASE_URL}/api/upads/salary-master/${employeeId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      timeout: 60000,
    });

    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch salary master detail';
    toast.error(errorMessage, { toastId: 'salary-master-detail-fetch-error' });
    throw new Error(errorMessage);
  }
};

// export const downloadSalarySummaryExcel = async (filters = {}) => {
//   try {
//     const token = getAuthToken();
//     if (!token) {
//       toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-excel-download' });
//       throw new Error('Authentication token not found');
//     }

//     // Build query parameters with filters
//     const queryParams = new URLSearchParams();
//     queryParams.append('isExcel', 'true');
    
//     // Add filter parameters
//     if (filters.search) queryParams.append('search', filters.search);
//     if (filters.employeeCode) queryParams.append('employeeCode', filters.employeeCode);
//     if (filters.nickName) queryParams.append('nickName', filters.nickName);
//     if (filters.processName) queryParams.append('processName', filters.processName);
//     if (filters.startDate) queryParams.append('startDate', filters.startDate);
//     if (filters.endDate) queryParams.append('endDate', filters.endDate);
//     if (filters.sortKey) queryParams.append('sortKey', filters.sortKey);
//     if (filters.sortDirection) queryParams.append('sortDirection', filters.sortDirection);

//     const response = await axios.get(`${BASE_URL}/api/upads/salary-summary?${queryParams.toString()}`, {
//       headers: {
//         'Authorization': `Bearer ${getAuthToken()}`
//       },
//       responseType: 'blob'
//     });

//     // Create a blob from the response data
//     const blob = new Blob([response.data], { 
//       type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
//     });
    
//     // Create a download link
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = `salary-summary-${new Date().toISOString().split('T')[0]}.xlsx`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     window.URL.revokeObjectURL(url);

//     toast.success('Excel file downloaded successfully!', { toastId: 'excel-download-success' });
//   } catch (error) {
//     const errorMessage = error.response?.data?.message || error.message || 'Failed to download Excel file';
//     toast.error(errorMessage, { toastId: 'excel-download-error' });
//     throw new Error(errorMessage);
//   }
// }; 
export const downloadSalarySummaryExcel = async (filters = {}) => {
  try {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication token not found. Please login again.', { toastId: 'auth-token-error-excel-download' });
      throw new Error('Authentication token not found');
    }

    // Build query parameters with filters
    const queryParams = new URLSearchParams();
    queryParams.append('isExcel', 'true');

    // Add filter parameters
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.employeeCode) queryParams.append('employeeCode', filters.employeeCode);
    if (filters.nickName) queryParams.append('nickName', filters.nickName);
    if (filters.processName) queryParams.append('processName', filters.processName);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.sortKey) queryParams.append('sortKey', filters.sortKey);
    if (filters.sortDirection) queryParams.append('sortDirection', filters.sortDirection);

    const response = await axios.get(
      `${BASE_URL}/api/upads/salary-summary?${queryParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        responseType: "arraybuffer", // Important for Excel parsing
      }
    );

    const workbook = XLSX.read(response.data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    let data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Remove the first column (slice(1)) and filter out unwanted columns
    data = data.map((row, rowIndex) => {
      const filteredRow = row.slice(1);
      
      if (rowIndex === 0) {
        const newHeaders = filteredRow.filter((header, index) => {
          const headerLower = String(header).toLowerCase();
          return !headerLower.includes('process') && 
                 !headerLower.includes('email') && 
                 !headerLower.includes('first') && 
                 !headerLower.includes('last') && 
                 !headerLower.includes('image');
        });
        
        // Add new banking columns
        newHeaders.push('Account Holder Name', 'Account Number', 'IFSC Code', 'Bank Name', 'Branch Name');
        return newHeaders;
      } else {
        // Data rows - filter out corresponding columns and add banking data
        const originalHeaders = data[0].slice(1);
        const newRow = [];
        
        // Keep only columns that are not being removed
        filteredRow.forEach((cell, index) => {
          const headerLower = String(originalHeaders[index] || '').toLowerCase();
          if (!headerLower.includes('process') && 
              !headerLower.includes('email') && 
              !headerLower.includes('first') && 
              !headerLower.includes('last') && 
              !headerLower.includes('image')) {
            newRow.push(cell);
          }
        });
        
        // Add banking information (these would need to come from your API data)
        // For now, adding placeholder values - you'll need to map these from your actual data
        newRow.push(
          filteredRow[2] || '', // Account Holder Name (assuming it's the employee name)
          '', // Account Number - needs to be provided by API
          '', // IFSC Code - needs to be provided by API
          '', // Bank Name - needs to be provided by API
          ''  // Branch Name - needs to be provided by API
        );
        
        return newRow;
      }
    });

    const newWorksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Apply formatting for banking columns (preserve leading zeros)
    const range = XLSX.utils.decode_range(newWorksheet['!ref']);
    const bankingColumnIndices = []; // Will store indices of banking columns
    
    // Find banking column indices from headers
    if (data[0]) {
      data[0].forEach((header, index) => {
        if (['Account Number', 'IFSC Code'].includes(header)) {
          bankingColumnIndices.push(index);
        }
      });
    }
    
    // Set column widths and text format for banking columns
    const colWidths = [];
    for (let col = 0; col <= range.e.c; col++) {
      if (bankingColumnIndices.includes(col)) {
        colWidths[col] = { wch: 15 };
        
        // Apply text format to preserve leading zeros
        for (let row = 1; row <= range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (newWorksheet[cellAddress]) {
            newWorksheet[cellAddress].t = 's'; // Set as string
            newWorksheet[cellAddress].z = '@'; // Text format
          }
        }
      } else {
        colWidths[col] = { wch: 12 };
      }
    }
    newWorksheet['!cols'] = colWidths;
    
    // Style header row
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (newWorksheet[cellAddress]) {
        newWorksheet[cellAddress].s = {
          fill: { fgColor: { rgb: "4472C4" } },
          font: { color: { rgb: "FFFFFF" }, bold: true },
          alignment: { horizontal: "center" }
        };
      }
    }

    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Salary Summary");

    const excelBuffer = XLSX.write(newWorkbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salary-summary-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Excel file downloaded successfully!', { toastId: 'excel-download-success' });
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to download Excel file';
    toast.error(errorMessage, { toastId: 'excel-download-error' });
    throw new Error(errorMessage);
  }
};


export const importUpadData = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${BASE_URL}/api/upads/import`, formData, {
            headers: {
                ...getAuthHeaders(),
                // 'Content-Type': 'multipart/form-data' // Axios sets this automatically for FormData
            }
        });
        toast.success('Data imported successfully!', { toastId: 'upad-import-status' });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Import failed';
        toast.error(errorMessage, { toastId: 'upad-import-status' });
        throw new Error(errorMessage);
    }
};