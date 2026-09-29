
import axios from 'axios';
import { getAuthHeaders } from '../utils/authToken';

const BASE_URL = process.env.REACT_APP_BASE_URL ;

export const getUserSalaryReport = async ({ 
  page, 
  limit, 
  search = '', 
  userId, 
  isExcel = false, 
  isPDF = false,
  employeeName = '',
  lotNo = '',
  dNo = '',
  pic = '',
  startDate = '',
  endDate = ''
} = {}) => {
  try {
    const params = { page, limit, userId };
    
    if (search && search.trim()) params.search = search;
    if (isExcel) params.isExcel = true;
    if (isPDF) params.isPDF = true;
    
    if (employeeName) params.employeeName = employeeName;
    if (lotNo) params.lotNo = lotNo;
    if (dNo) params.dNo = dNo;
    if (pic) params.pic = pic;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(`${BASE_URL}/api/dashboard/user/process-report`, {
      headers: getAuthHeaders(),
      params
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAdminSalaryReport = async ({ 
  page, 
  limit, 
  search = '', 
  isExcel = false, 
  isPDF = false,
  employeeId = '',
  employeeName = '',
  lotNo = '',
  dNo = '',
  pic = '',
  status = '',
  startDate = '',
  endDate = ''
} = {}) => {
  try {
    const params = { page, limit };
    
    if (search && search.trim()) params.search = search;
    if (isExcel) params.isExcel = true;
    if (isPDF) params.isPDF = true;
    
    if (employeeId) params.employeeId = employeeId;
    if (employeeName) params.employeeName = employeeName;
    if (lotNo) params.lotNo = lotNo;
    if (dNo) params.dNo = dNo;
    if (pic) params.pic = pic;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(`${BASE_URL}/api/dashboard/admin/process-reports`, {
      headers: getAuthHeaders(),
      params
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const resolveSalaryReportFilterValue = (value) => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'object') {
    return value.value ?? value.label ?? '';
  }
  return String(value);
};

const buildSalaryReportFilterParams = ({
  search = '',
  employeeId = '',
  employeeName = '',
  lotNo = '',
  dNo = '',
  pic = '',
  status = '',
  startDate = '',
  endDate = '',
} = {}) => {
  const params = {};
  if (search && String(search).trim()) params.search = String(search).trim();

  const resolvedEmployeeId = resolveSalaryReportFilterValue(employeeId);
  const resolvedEmployeeName = resolveSalaryReportFilterValue(employeeName);
  const resolvedLotNo = resolveSalaryReportFilterValue(lotNo);
  const resolvedDNo = resolveSalaryReportFilterValue(dNo);
  const resolvedPic = resolveSalaryReportFilterValue(pic);
  const resolvedStatus = resolveSalaryReportFilterValue(status);

  if (resolvedEmployeeId) params.employeeId = resolvedEmployeeId;
  if (resolvedEmployeeName) params.employeeName = resolvedEmployeeName;
  if (resolvedLotNo) params.lotNo = resolvedLotNo;
  if (resolvedDNo) params.dNo = resolvedDNo;
  if (resolvedPic) params.pic = resolvedPic;
  if (resolvedStatus) params.status = resolvedStatus;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  return params;
};

export const getAdminSalaryReportNew = async ({ 
  page, 
  limit, 
  search = '', 
  isExcel = false, 
  isPDF = false,
  employeeId = '',
  employeeName = '',
  lotNo = '',
  dNo = '',
  pic = '',
  status = '',
  startDate = '',
  endDate = ''
} = {}) => {
  try {
    const params = { page, limit, ...buildSalaryReportFilterParams({
      search,
      employeeId,
      employeeName,
      lotNo,
      dNo,
      pic,
      status,
      startDate,
      endDate,
    }) };

    if (isExcel) params.isExcel = true;
    if (isPDF) params.isPDF = true;

    const response = await axios.get(`${BASE_URL}/api/dashboard/admin/salary-report-new`, {
      headers: getAuthHeaders(),
      params
    });

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const downloadAdminSalaryReportNewExcel = async ({
  search = '',
  employeeId = '',
  employeeName = '',
  lotNo = '',
  dNo = '',
  pic = '',
  status = '',
  startDate = '',
  endDate = '',
  isSalaryExcel = false,
} = {}) => {
  try {
    const params = {
      ...buildSalaryReportFilterParams({
        search,
        employeeId,
        employeeName,
        lotNo,
        dNo,
        pic,
        status,
        startDate,
        endDate,
      }),
    };

    if (isSalaryExcel) {
      params.isSalaryExcel = true;
    } else {
      params.isExcel = true;
    }

    const response = await axios.get(`${BASE_URL}/api/dashboard/admin/salary-report-new`, {
      headers: getAuthHeaders(),
      params,
      responseType: 'blob',
    });

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const fetchAdminSalaryReportNewExportAll = async ({
  search = '',
  employeeId = '',
  employeeName = '',
  lotNo = '',
  dNo = '',
  pic = '',
  status = '',
  startDate = '',
  endDate = '',
} = {}) => {
  try {
    const params = {
      exportAll: true,
      ...buildSalaryReportFilterParams({
        search,
        employeeId,
        employeeName,
        lotNo,
        dNo,
        pic,
        status,
        startDate,
        endDate,
      }),
    };

    const response = await axios.get(`${BASE_URL}/api/dashboard/admin/salary-report-new`, {
      headers: getAuthHeaders(),
      params,
    });

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getAdminSalaryExcelReport = async ({ 
  employeeId = '',
  lotNo = '',
  dNo = '',
  pic = '',
  status = '',
  startDate = '',
  endDate = ''
} = {}) => {
  try {
    const params = { isSalaryExcel: true };
    
    if (employeeId) params.employeeId = employeeId;
    if (lotNo) params.lotNo = lotNo;
    if (dNo) params.dNo = dNo;
    if (pic) params.pic = pic;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(`${BASE_URL}/api/dashboard/admin/process-reports`, {
      headers: getAuthHeaders(),
      params,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
