import * as XLSX from "xlsx";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from "jwt-decode";

import { getAuthHeaders, getAuthToken } from '../utils/authToken';

const BASE_URL = process.env.REACT_APP_BASE_URL;

const showReplacingErrorToast = (message, toastId) => {
  if (toastId && toast.isActive(toastId)) {
    toast.dismiss(toastId);
  }
  toast.error(message, toastId ? { toastId } : undefined);
};

const getAuthUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

export const searchDashboard = async (apiParams) => {
    const {
        search = '',
        status = '',
        startDate = '',
        endDate = '',
        page = 1,
        limit = 10,
        sortKey = null,
        sortDirection = 'asc',
        colour = '',
        size = '',
        employeeCode = '',
        employeeId = '',
        dNo = ''
    } = apiParams;

    const params = {
        page,
        limit
    };

    if (search) params.search = search;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (sortKey) {
        params.sortKey = sortKey;
        params.sortDirection = sortDirection;
    }
    if (colour) params.colour = colour;
    if (size) params.size = size;
    if (employeeCode) params.employeeCode = employeeCode;
    if (employeeId) params.employeeId = employeeId;
    if (dNo) params.dNo = dNo;

    try {
        const response = await axios.get(`${BASE_URL}/api/dashboard/search`, {
            params,
            headers: getAuthHeaders(),
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Search failed';
        showReplacingErrorToast(errorMessage, 'dashboard-search-status');
        throw new Error(errorMessage);
    }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pollExcelImportJob = async (statusUrl, { maxWaitMs = 20 * 60 * 1000 } = {}) => {
    const started = Date.now();
    const token = getAuthToken();
    const headers = getAuthHeaders();

    while (Date.now() - started < maxWaitMs) {
        await sleep(2000);
        const statusRes = await axios.get(`${BASE_URL}${statusUrl}`, {
            headers,
            timeout: 0,
        });
        const job = statusRes?.data?.data;
        if (!job) continue;

        if (job.status === 'completed') {
            return job;
        }
        if (job.status === 'failed') {
            throw new Error(job.error || 'Import failed');
        }
    }

    throw new Error('Import is still running. Please refresh the page in a few minutes.');
};

export const importDashboardData = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${BASE_URL}/api/dashboard/import`, formData, {
            params: { async: true },
            timeout: 0,
            headers: {
                ...getAuthHeaders(),
            }
        });

        const payload = response?.data?.data;
        if (payload?.background && payload?.statusUrl) {
            const job = await pollExcelImportJob(payload.statusUrl);
            const msg = job?.message || response?.data?.message || 'Data imported successfully!';
            toast.success(msg, { toastId: 'dashboard-import-status' });
            return { status: 'success', data: job };
        }

        toast.success('Data imported successfully!', { toastId: 'dashboard-import-status' });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Import failed';
        showReplacingErrorToast(errorMessage, 'dashboard-import-status');
        throw new Error(errorMessage);
    }
};

export const getLastExcelImportBatch = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/dashboard/import/last-batch`, {
            headers: {
                ...getAuthHeaders(),
            },
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to fetch last upload file';
        showReplacingErrorToast(errorMessage, 'last-excel-import-batch');
        throw new Error(errorMessage);
    }
};

export const importLegacyScans = async (file, { dryRun = false } = {}) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${BASE_URL}/api/dashboard/import-legacy-scans`, formData, {
            params: dryRun ? { dryRun: true } : undefined,
            timeout: 0,
            headers: {
                ...getAuthHeaders(),
            }
        });
        toast.success(dryRun ? 'Legacy scans dry-run completed!' : 'Legacy scans imported successfully!', { toastId: 'dashboard-import-legacy-status' });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Legacy import failed';
        showReplacingErrorToast(errorMessage, 'dashboard-import-legacy-status');
        throw new Error(errorMessage);
    }
};
export const getProductExportFileName = (extension = "xlsx") => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const ext = String(extension || "xlsx").replace(/^\./, "");
  return `product_${dd}_${mm}_${yyyy}.${ext}`;
};

const downloadBlobFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const buildDashboardExportRows = async (isSample = false, filters = {}) => {
  if (isSample) {
    return [
      [
        "Date",
        "Lot No.",
        "D. No.",
        "Colour",
        "Pic",
        "Size",
        "Layer",
        "Master",
        "Category",
        "Layering",
        "Layering",
        "Cutting",
        "Sorting",
        "Sorting",
        "Pocket",
        "Pocket",
      ],
      [
        "01-02-2025",
        "246339A",
        "Y-102",
        "Black",
        "40",
        "XXL",
        "",
        "",
        "8 SM",
        "012",
        "012",
        "013",
        "014",
        "014",
        "015",
        "015",
      ],
    ];
  }

  const params = {};
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.size) params.size = filters.size;
  if (filters.colour) params.colour = filters.colour;
  if (filters.dNo) params.dNo = filters.dNo;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;

  const response = await axios.get(`${BASE_URL}/api/dashboard/export`, {
    headers: {
      ...getAuthHeaders(),
    },
    params,
    responseType: "arraybuffer",
    timeout: 120000,
  });

  const contentType = String(response.headers?.["content-type"] || "");
  if (contentType.includes("application/json")) {
    const errorText = new TextDecoder().decode(response.data);
    let message = "Export failed";
    try {
      message = JSON.parse(errorText)?.message || message;
    } catch (e) {}
    throw new Error(message);
  }

  // Guard: JSON error bodies sometimes arrive without content-type
  const head = new Uint8Array(response.data.slice(0, 1));
  if (head[0] === 0x7b /* { */) {
    const errorText = new TextDecoder().decode(response.data);
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || "Export failed");
    } catch (e) {
      if (e instanceof Error && e.message && e.message !== "Export failed") throw e;
    }
  }

  const workbook = XLSX.read(response.data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // BE may prepend "Total Pcs" summary rows — skip so real column headers stay first
  while (
    jsonData.length &&
    String(jsonData[0]?.[0] ?? "").trim().toLowerCase() === "total pcs"
  ) {
    jsonData = jsonData.slice(1);
  }
  while (
    jsonData.length &&
    (!jsonData[0] ||
      jsonData[0].every((c) => c == null || String(c).trim() === ""))
  ) {
    jsonData = jsonData.slice(1);
  }

  const headers = (jsonData[0] || []).map((h) =>
    (h || "").toString().trim().toLowerCase()
  );
  const statusIndex = headers.indexOf("status");

  if (statusIndex !== -1) {
    jsonData = jsonData.map((row) => {
      const newRow = [...row];
      newRow.splice(statusIndex, 1);
      return newRow;
    });
  }

  return jsonData;
};

/** Sum PIC column (supports "64 / 60" or plain number) — same idea as Product Total Pcs */
const getExportTotalPcs = (jsonData) => {
  if (!Array.isArray(jsonData) || jsonData.length < 2) return 0;
  const headers = (jsonData[0] || []).map((h) =>
    String(h ?? "").trim().toLowerCase()
  );
  let picIdx = headers.indexOf("pic");
  if (picIdx === -1) {
    picIdx = headers.findIndex((h) => h === "pic" || /^pic\b/.test(h));
  }
  if (picIdx === -1) return 0;
  return jsonData.slice(1).reduce((sum, row) => {
    const raw = String(row?.[picIdx] ?? "").trim();
    if (!raw || raw === "-") return sum;
    const m = raw.match(/-?\d+/);
    const n = m ? parseInt(m[0], 10) : NaN;
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
};

const buildDashboardExcelBlob = (jsonData) => {
  const totalPcs = getExportTotalPcs(jsonData);
  const sheetData = [
    ["Total Pcs", totalPcs],
    [],
    ...(Array.isArray(jsonData) ? jsonData : []),
  ];
  const newWB = XLSX.utils.book_new();
  const newWS = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(newWB, newWS, "Product");
  const fileData = XLSX.write(newWB, { bookType: "xlsx", type: "array" });
  return new Blob([fileData], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

const buildDashboardPdfBlob = async (jsonData) => {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  const headers = (jsonData[0] || []).map((h) => String(h ?? ""));
  const body = (jsonData.slice(1) || []).map((row) =>
    headers.map((_, idx) => {
      const value = row?.[idx];
      return value === null || value === undefined || value === ""
        ? "-"
        : String(value);
    })
  );
  const totalPcs = getExportTotalPcs(jsonData);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Product Export", 40, 36);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 52);
  doc.text(`Total rows: ${body.length}`, 40, 64);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Pcs: ${totalPcs}`, 40, 76);
  doc.setFont("helvetica", "normal");

  autoTable(doc, {
    startY: 90,
    head: [headers],
    body,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [51, 122, 183],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 24, right: 24 },
  });

  return doc.output("blob");
};

const WHATSAPP_WEB_WINDOW_NAME = "sitaram_whatsapp_web";

const isMobileBrowser = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(
    typeof navigator !== "undefined" ? navigator.userAgent : ""
  );

/** Open WhatsApp Web first (reuse same tab); on mobile prefer app. No about:blank. */
const openWhatsAppTarget = () => {
  if (isMobileBrowser()) {
    try {
      const link = document.createElement("a");
      link.href = "whatsapp://";
      link.rel = "noopener noreferrer";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      return "app";
    } catch (e) {
      window.open("https://web.whatsapp.com/", WHATSAPP_WEB_WINDOW_NAME);
      return "web";
    }
  }

  // Desktop priority: WhatsApp Web in browser (named window reuses tab if we opened it before)
  const webWin = window.open(
    "https://web.whatsapp.com/",
    WHATSAPP_WEB_WINDOW_NAME
  );
  if (webWin) {
    try {
      webWin.focus();
    } catch (e) {}
    return "web";
  }

  // Popup blocked → try desktop app protocol (no new blank tab)
  try {
    const link = document.createElement("a");
    link.href = "whatsapp://";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return "app";
  } catch (e) {
    return "none";
  }
};

/**
 * Share filtered Product PDF with WhatsApp.
 * 1) System share sheet with PDF file (real attach) when browser supports it
 * 2) Else download filtered PDF + open WhatsApp Web (then app) for manual attach
 */
const shareFilteredPdfOnWhatsApp = async (pdfBlob, filename) => {
  const blob =
    pdfBlob.type === "application/pdf"
      ? pdfBlob
      : new Blob([pdfBlob], { type: "application/pdf" });
  const file = new File([blob], filename, { type: "application/pdf" });

  // 1) Native share with PDF file (mobile / Safari / supported Chrome)
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      const shareData = {
        files: [file],
        title: "Product Export",
        text: "Product list PDF",
      };
      const canFiles =
        !navigator.canShare || navigator.canShare({ files: [file] });
      if (canFiles) {
        await navigator.share(shareData);
        return "shared";
      }
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
      console.warn("PDF navigator.share failed:", err?.message || err);
    }
  }

  // 2) Ensure filtered PDF is in Downloads (same file PDF export creates)
  downloadBlobFile(blob, filename);

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(filename);
    }
  } catch (e) {}

  // 3) Open WhatsApp Web first (desktop), app on mobile / if web blocked
  const target = openWhatsAppTarget();
  return target === "web"
    ? "opened_web"
    : target === "app"
      ? "opened_app"
      : "downloaded";
};

/**
 * @param {boolean} isSample
 * @param {{ format?: 'excel' | 'pdf' | 'whatsapp', filters?: object }} [options]
 */
export const exportDashboardData = async (isSample = false, options = {}) => {
  const format = String(options.format || "excel").toLowerCase();
  const filters = options.filters || {};

  try {
    const jsonData = await buildDashboardExportRows(isSample, filters);

    if (!jsonData || jsonData.length <= 1) {
      throw new Error("No data found to export for the selected filters");
    }

    // WhatsApp: filtered PDF (same as PDF export)
    if (format === "whatsapp") {
      const filename = getProductExportFileName("pdf");
      const pdfBlob = await buildDashboardPdfBlob(jsonData);
      const result = await shareFilteredPdfOnWhatsApp(pdfBlob, filename);
      if (result === "cancelled") return pdfBlob;

      if (result === "shared") {
        toast.success("PDF shared — choose WhatsApp to send", {
          toastId: "dashboard-export-status",
        });
      } else if (result === "opened_web") {
        toast.success(
          `PDF downloaded (${filename}). WhatsApp Web ma 📎 Attach → Documents → aa file select karo.`,
          { toastId: "dashboard-export-status", autoClose: 8000 }
        );
      } else if (result === "opened_app") {
        toast.success(
          `PDF downloaded (${filename}). WhatsApp ma 📎 Attach → aa file select karo.`,
          { toastId: "dashboard-export-status", autoClose: 8000 }
        );
      } else {
        toast.success(
          `PDF downloaded (${filename}). WhatsApp open kari Attach thi file moklo.`,
          { toastId: "dashboard-export-status", autoClose: 8000 }
        );
      }
      return pdfBlob;
    }

    if (format === "pdf") {
      const filename = isSample
        ? getProductExportFileName("pdf").replace("product_", "product_sample_")
        : getProductExportFileName("pdf");
      const pdfBlob = await buildDashboardPdfBlob(jsonData);
      downloadBlobFile(pdfBlob, filename);
      toast.success("PDF exported successfully!", {
        toastId: "dashboard-export-status",
      });
      return pdfBlob;
    }

    // Excel only
    const excelFilename = isSample
      ? getProductExportFileName("xlsx").replace("product_", "product_sample_")
      : getProductExportFileName("xlsx");
    const excelBlob = buildDashboardExcelBlob(jsonData);
    downloadBlobFile(excelBlob, excelFilename);
    toast.success(
      isSample
        ? "Sample data exported successfully!"
        : "Excel exported successfully!",
      { toastId: "dashboard-export-status" }
    );
    return excelBlob;
  } catch (error) {
    if (error?.name === "AbortError") {
      return null;
    }

    let errorMessage = "Export failed";
    const data = error?.response?.data;

    if (typeof data?.message === "string" && data.message) {
      errorMessage = data.message;
    } else if (data instanceof Blob) {
      try {
        const errorText = await data.text();
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {}
    } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
      try {
        const bytes =
          data instanceof ArrayBuffer
            ? new Uint8Array(data)
            : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        const errorText = new TextDecoder().decode(bytes);
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {}
    } else if (typeof data === "string") {
      try {
        const errorJson = JSON.parse(data);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {
        if (data.trim()) errorMessage = data;
      }
    } else if (error?.message && error.message !== "Export failed") {
      errorMessage = error.message;
    }

    showReplacingErrorToast(errorMessage, "dashboard-export-status");
    throw new Error(errorMessage);
  }
};

// Temporarily commented out - using client-side label generation instead
export const generateLabels = async (lotNos) => {
    // try {
    //     const response = await axios.get(`${BASE_URL}/api/dashboard/label`, {
    //         params: { lotNo: lotNos },
    //         headers: {
    //             ...getAuthHeaders(),,
    //             'accept': 'application/pdf'
    //         },
    //         responseType: 'blob'
    //     });

    //     const blob = response.data;
    //     const url = window.URL.createObjectURL(blob);
    //     const link = document.createElement('a');
    //     link.href = url;
    //     link.setAttribute('download', 'labels.pdf');
    //     document.body.appendChild(link);
    //     link.click();
    //     link.remove();
    //     window.URL.revokeObjectURL(url);

    //     toast.success('Labels generated successfully!', { toastId: 'dashboard-labels-status' });
    //     return blob;
    // } catch (error) {
    //     let errorMessage = error.response?.data?.message || 'Failed to generate labels';
    //     if (error.response && error.response.data instanceof Blob && error.response.data.type === "application/json") {
    //         try {
    //             const errorText = await error.response.data.text();
    //             const errorJson = JSON.parse(errorText);
    //             errorMessage = errorJson.message || errorMessage;
    //         } catch (e) {
    //         }
    //     }
    //     toast.error(errorMessage, { toastId: 'dashboard-labels-status' });
    //     throw new Error(errorMessage);
    // }
    
    // Return null as placeholder
    return null;
};

export const getUniqueColors = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/dashboard/colors`, {
            headers: {
                ...getAuthHeaders()
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getUniqueSizes = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/dashboard/sizes`, {
            headers: {
                ...getAuthHeaders()
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getUniqueStatuses = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/dashboard/status`, {
            headers: {
                ...getAuthHeaders()
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getDashboardById = async (id) => {
  try {
    const token = getAuthToken();
    if (!token) {
      showReplacingErrorToast('Authentication token not found. Please login again.', 'dashboard-get-token-error');
      throw new Error('Authentication token not found');
    }
    const response = await axios.get(`${BASE_URL}/api/dashboard/${id}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch dashboard item';
    showReplacingErrorToast(errorMessage, 'dashboard-get-error');
    throw new Error(errorMessage);
  }
};

export const updateDashboard = async (id, updateData) => {
    try {
        const token = getAuthToken();
        if (!token) {
            showReplacingErrorToast('Authentication token not found. Please login again.', 'dashboard-update-token-error');
            throw new Error('Authentication token not found');
        }
        const response = await axios.put(`${BASE_URL}/api/dashboard/${id}`, updateData, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            }
        });
        toast.success(response?.data?.message || 'Dashboard data updated successfully!', { toastId: 'dashboard-update-success' });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update dashboard data';
        showReplacingErrorToast(errorMessage, 'dashboard-update-error');
        throw new Error(errorMessage);
    }
};

export const deleteDashboard = async (id) => {
    try {
        const token = getAuthToken();
        if (!token) {
            showReplacingErrorToast('Authentication token not found. Please login again.', 'dashboard-delete-token-error');
            throw new Error('Authentication token not found');
        }
        const response = await axios.delete(`${BASE_URL}/api/dashboard/${id}`, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            }
        });
        toast.success(response?.data?.message || 'Dashboard data deleted successfully!', { toastId: 'dashboard-delete-success' });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete dashboard data';
        showReplacingErrorToast(errorMessage, 'dashboard-delete-error');
        throw new Error(errorMessage);
    }
};

export const changeStatus = async (lotNo , nextDesigneProcess, employee, schand_ProcessId, status) => {
      const token = getAuthToken();
      const user = getAuthUser();
      const decoded = jwtDecode(token);
      const userId = decoded?.id || user?._id || user?.data?._id || '';

    try {
        // console.log(lotNo, nextDesigneProcess, userId, schand_ProcessId,"lotNo , nextDesigneProcess, employee")
        const response = await axios.get(`${BASE_URL}/api/dashboard/change-status`, {
            params: { lotNo, nextDesigneProcess, userId, schand_ProcessId, status }
        });
        toast.success(response?.data?.message || 'Status updated successfully!', { toastId: 'dashboard-change-status-success' });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to update status';
        showReplacingErrorToast(errorMessage, 'dashboard-change-status-error');
        throw new Error(errorMessage);
    }
};

export const scanBarcode = async (scanData) => {
    try {
        const token = getAuthToken();
        if (!token) {
            showReplacingErrorToast('Authentication token not found. Please login again.', 'scan-token-error');
            throw new Error('Authentication token not found');
        }

        const response = await axios.post(`${BASE_URL}/api/dashboard/scan`, {
            barcodeValue: scanData.barcodeValue,
            status: scanData.status,
            processId: scanData.processId,
            processName: scanData.processName,
            sequence: scanData.sequence,
            scannedAt: scanData.scannedAt || new Date().toISOString(),
            deviceInfo: scanData.deviceInfo || {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                timestamp: new Date().toISOString()
            }
        }, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            toast.success(`Status updated successfully to: ${scanData.processName}`, { toastId: 'scan-success' });
        } else {
            showReplacingErrorToast(response.data.message || 'Failed to update status', 'scan-error');
        }

        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to scan barcode';
        showReplacingErrorToast(errorMessage, 'scan-error');
        throw new Error(errorMessage);
    }
};

export const handleExternalQRScan = async (qrData, expectedBarcodeValue) => {
    try {
        const parsedData = JSON.parse(qrData);
        
        if (parsedData.barcodeValue !== expectedBarcodeValue) {
            throw new Error('Invalid QR code for this item');
        }

        const qrTimestamp = new Date(parsedData.timestamp);
        const now = new Date();
        const timeDiff = now - qrTimestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (timeDiff > maxAge) {
            throw new Error('QR code has expired');
        }

        return parsedData;
    } catch (error) {
        throw new Error('Invalid QR code format or data');
    }
};

export const getAlterCount = async (params = {}) => {
    try {
        const query =
            typeof params === 'string' || params == null
                ? { ...(params ? { search: params } : {}) }
                : { ...params };

        const response = await axios.get(`${BASE_URL}/api/dashboard/alter-count`, {
            headers: {
                ...getAuthHeaders()
            },
            params: query
        });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching alter count:', error);
        throw error;
    }
};

export const getAlterDoneHistory = async (params = {}) => {
    try {
        const response = await axios.get(`${BASE_URL}/api/dashboard/alter-done-history`, {
            headers: {
                ...getAuthHeaders()
            },
            params
        });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching alter done history:', error);
        throw error;
    }
};

export const getRejectList = async (params = {}) => {
    try {
        const response = await axios.get(`${BASE_URL}/api/dashboard/reject-list`, {
            headers: {
                ...getAuthHeaders()
            },
            params
        });
        
        return response.data;
    } catch (error) {
        console.error('Error fetching reject list:', error);
        throw error;
    }
};