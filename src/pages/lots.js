import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { LucideSearch, LucideUpload, LucideDownload, LucideChevronDown, LucideChevronUp, LucideLoader, LucideScanBarcode, LucideFilter, LucidePrinter, LucidePackageCheck, LucidePlus, LucideCheck, Edit, Trash2, Eye, EyeOff, AlertTriangle, LucideArrowLeft } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { capitalize, formatDate, formatEmployeeDisplayWithCode, isTenantClientCode, lowercase, mapEmployeeToSelectOption, isHiddenScanProcess } from '../helpers/utils';
import { importDashboardData, importLegacyScans, exportDashboardData, searchDashboard, generateLabels, getUniqueColors, getUniqueSizes, updateDashboard, deleteDashboard, getLastExcelImportBatch } from '../apis/dashboardApi';
import InputElement from '../component/common/InputElement';
import SelectElement from '../component/common/Select';        
import CommonTable from '../component/common/Table/Table';   
import BarcodeScannerModalWithBarcode from '../component/common/BarcodeScannerModalWithBarcode';
import Button from '../component/common/Button';
import Modal from '../component/common/Modal';
import ViewDashboardModal from '../component/Dashboard/ViewDashboardModal';
import ActionCell from '../component/common/Table/ActionCell';
import UpdateDashboardForm from '../component/Dashboard/UpdateDashboardForm';
import LoaderComponent from '../component/common/Loader';
import LabelBlockWithBarcode from '../component/common/LabelBlock/LabelBlockWithBarcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import BillScanQrDetailsModal from '../component/common/BillScanQrDetailsModal';
import { getDesigns, getDesignByNumber } from '../apis/designApi';
import { createBillScan, getProcesses } from '../apis/processApi';
import usePageTitle from '../hooks/usePageTitle';
import { getEmployees } from '../apis/employeeApi';
import { addItem } from '../apis/itemsApi';
import AddProductForm from '../component/Products/AddProductForm';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';

const LAST_EXCEL_IMPORT_LOTS_KEY = 'lastExcelImportLotNos';

const KNOWN_PROCESS_STATUS_LABELS = {
  rc: 'RC',
  billscan: 'Billscan',
  doracut: 'Doracut',
  'doracut received': 'Doracut Received',
  loading: 'Loading',
  unloading: 'Unloading',
  complete: 'Complete',
  gajbattan: 'Gaj Battan',
  gajbatan: 'Gaj Battan',
};

function formatProcessStatusLabel(processName) {
  const lower = String(processName || '').trim().toLowerCase();
  if (KNOWN_PROCESS_STATUS_LABELS[lower]) {
    return KNOWN_PROCESS_STATUS_LABELS[lower];
  }
  return capitalize(processName);
}

function buildStatusOptionsFromProcesses(processes = [], extraStatuses = []) {
  const options = [];
  const seenValues = new Set();

  const pushOption = (value, label) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seenValues.has(key)) return;
    seenValues.add(key);
    options.push({
      value: trimmed,
      label: label || formatProcessStatusLabel(trimmed),
    });
  };

  const uniqueProcesses = processes.reduce((acc, item) => {
    const name = item?.processName;
    if (!name) return acc;
    if (!acc.some((p) => p.processName === name)) acc.push(item);
    return acc;
  }, []);

  for (const item of uniqueProcesses) {
    const name = String(item.processName).trim();
    const lower = name.toLowerCase();

    // Hide Layering / Cutting / Sorting / Pocket from Product status filter
    if (isHiddenScanProcess(name)) continue;

    if (lower === 'loading' || lower === 'unloading') {
      pushOption('Unloading', 'Unloading');
      pushOption('Loading', 'Loading');
      continue;
    }

    if (lower === 'doracut') {
      pushOption('Doracut', 'Doracut');
      pushOption('Doracut Received', 'Doracut Received');
      continue;
    }

    if (item.hasSendReceive) {
      const label = formatProcessStatusLabel(name);
      pushOption(name, label);
      pushOption(`${label} Received`, `${label} Received`);
      continue;
    }

    pushOption(name, formatProcessStatusLabel(name));
  }

  for (const status of extraStatuses) {
    if (isHiddenScanProcess(status)) continue;
    pushOption(status, formatProcessStatusLabel(status));
  }

  pushOption('Complete', 'Complete');
  return options;
}

/**
 * Walk schand_ProcessDetails (nested supported). Prefer machine / process employee refs over scannedBy (admin).
 */
function walkSchandProcessDetailsForEmployees(processList, machineBucket, otherBucket) {
  if (!Array.isArray(processList)) return;
  for (const proc of processList) {
    if (!proc || typeof proc !== "object") continue;

    const mes = proc.machineEmployees;
    if (Array.isArray(mes)) {
      for (const me of mes) {
        const emp = me?.employeeId;
        if (emp && typeof emp === "object") {
          const s = formatEmployeeDisplayWithCode(emp);
          if (s !== "-") machineBucket.push(s);
        }
      }
    }

    for (const key of ["single", "kansai", "fatlock", "fourThread"]) {
      const v = proc[key];
      if (v && typeof v === "object") {
        const s = formatEmployeeDisplayWithCode(v);
        if (s !== "-") machineBucket.push(s);
      } else if (typeof v === "string" && String(v).trim()) {
        machineBucket.push(String(v).trim());
      }
    }

    if (proc.billScan && typeof proc.billScan === "object" && proc.billScan.username) {
      machineBucket.push(String(proc.billScan.username).trim());
    }

    const scanName = proc.scannedByName || proc.scannedBy;
    if (scanName != null && String(scanName).trim()) {
      otherBucket.push(String(scanName).trim());
    }

    if (Array.isArray(proc.schand_ProcessDetails) && proc.schand_ProcessDetails.length > 0) {
      walkSchandProcessDetailsForEmployees(proc.schand_ProcessDetails, machineBucket, otherBucket);
    }
  }
}

function getEmployeeDisplayFromSchandOrRoot(row) {
  const machineBucket = [];
  const otherBucket = [];
  walkSchandProcessDetailsForEmployees(row?.schand_ProcessDetails || [], machineBucket, otherBucket);
  if (machineBucket.length > 0) {
    return machineBucket[machineBucket.length - 1];
  }
  if (otherBucket.length > 0) {
    return otherBucket[otherBucket.length - 1];
  }
  if (row?.employeeId && typeof row.employeeId === "object") {
    const s = formatEmployeeDisplayWithCode(row.employeeId);
    if (s !== "-") return s;
  }
  return null;
}

/** Single in-flight bundle for Lots filter dropdowns.
 * Cached on `window` so React StrictMode remounts + HMR/module reloads won't refetch.
 */
const LOTS_FILTER_BOOTSTRAP_PROMISE_KEY = '__lotsFilterBootstrapPromise__';

const getLotsFilterBootstrap = () => {
  const g = typeof window !== 'undefined' ? window : {};
  if (!g[LOTS_FILTER_BOOTSTRAP_PROMISE_KEY]) {
    // Intentionally NO dashboard option calls on route load.
    // Colors/Sizes/Statuses are fetched lazily when needed.
    g[LOTS_FILTER_BOOTSTRAP_PROMISE_KEY] = Promise.resolve([null, null, null]);
  }
  return g[LOTS_FILTER_BOOTSTRAP_PROMISE_KEY];
};

const Lots = () => {
  // Set page title
  usePageTitle('Product');

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromProductReport =
    searchParams.get('from') === 'product-report' ||
    !!location.state?.fromProductReport;

  const handleBackToProductReport = () => {
    const buildReturnTo = () => {
      if (location.state?.returnTo) return location.state.returnTo;

      try {
        const storedReturn = sessionStorage.getItem('productReportReturnTo');
        if (storedReturn) return storedReturn;
      } catch (_) {
        /* ignore */
      }

      // Rebuild from prColor/prSize OR productReportFilters session snapshot
      const params = new URLSearchParams();
      let dNo = searchParams.get('dNo') || '';
      let prColor = searchParams.get('prColor') || '';
      let prSize = searchParams.get('prSize') || '';

      try {
        const raw = sessionStorage.getItem('productReportFilters');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.dNo && !dNo) dNo = parsed.dNo;
          if (
            parsed?.dNo &&
            (!prColor || !prSize) &&
            String(parsed.dNo) === String(dNo || parsed.dNo)
          ) {
            if (!prColor && Array.isArray(parsed.colors) && parsed.colors.length) {
              prColor = parsed.colors.join(',');
            }
            if (!prSize && Array.isArray(parsed.sizes) && parsed.sizes.length) {
              prSize = parsed.sizes.join(',');
            }
            if (!dNo) dNo = parsed.dNo;
          }
        }
      } catch (_) {
        /* ignore */
      }

      if (dNo) params.set('dNo', dNo);
      if (prColor) params.set('color', prColor);
      if (prSize) params.set('size', prSize);
      return params.toString()
        ? `/product-report?${params.toString()}`
        : '/product-report';
    };

    const returnTo = buildReturnTo();
    // Keep productReportFilters so Product Report can hydrate Color/Size on mount
    try {
      sessionStorage.removeItem('productReportReturnTo');
    } catch (_) {
      /* ignore */
    }
    navigate(returnTo);
  };

  const preserveProductReportParams = (params) => {
    if (searchParams.get('from') === 'product-report') {
      params.set('from', 'product-report');
    }
    const prColor = searchParams.get('prColor');
    const prSize = searchParams.get('prSize');
    if (prColor) params.set('prColor', prColor);
    if (prSize) params.set('prSize', prSize);
    return params;
  };

  const setLotsSearchParams = (params, navigateOpts = {}) => {
    setSearchParams(params, {
      ...navigateOpts,
      state: navigateOpts.state !== undefined ? navigateOpts.state : location.state,
    });
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);      
  const [currentLimit, setCurrentLimit] = useState(25);   
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [legacyImportLoading, setLegacyImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    records: [],
    dashboardStats: {
       totalPicInSystem: 0,
       totalRegisteredEmployees: 0,
       totalCreatedDesigns: 0,
    },
    pagination: {
      total: 0,
      page: 1,
      pages: 1,
      limit: 10,
      hasNextPage: false,
      hasPrevPage: false
    }
  });   
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedBarcodeData, setSelectedBarcodeData] = useState(null);
  const [isViewDashboardModalOpen, setIsViewDashboardModalOpen] = useState(false);
  const [selectedDashboardItem, setSelectedDashboardItem] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [appliedDateSort, setAppliedDateSort] = useState(null);
  const [appliedColor, setAppliedColor] = useState('');
  const [appliedSize, setAppliedSize] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedDNo, setAppliedDNo] = useState('');
  const [appliedEmployeeId, setAppliedEmployeeId] = useState('');
  const [appliedDateRange, setAppliedDateRange] = useState({ startDate: '', endDate: '' });
  const [tempSelectedStatus, setTempSelectedStatus] = useState('');
  const [tempSelectedDNo, setTempSelectedDNo] = useState('');
  const [tempSelectedSize, setTempSelectedSize] = useState('');
  const [tempSelectedColor, setTempSelectedColor] = useState('');
  const [tempSelectedEmployeeId, setTempSelectedEmployeeId] = useState('');
  const [tempDateRange, setTempDateRange] = useState({ startDate: '', endDate: '' });
  const [dNoOptions, setDNoOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isImportSuccessModalOpen, setIsImportSuccessModalOpen] = useState(false);
  const [importedData, setImportedData] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [colors, setColors] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [showSelectInTable, setShowSelectInTable] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const labelRef = useRef(null);
  const importLabelRef = useRef(null);
  const [importedLotNos, setImportedLotNos] = useState([]);
  const [importedRecords, setImportedRecords] = useState([]);
  const [labelDesignProcessMap, setLabelDesignProcessMap] = useState({});
  const [isGeneratingImportLabels, setIsGeneratingImportLabels] = useState(false);
  const [isPrintingLastUploadQr, setIsPrintingLastUploadQr] = useState(false);
  const [tempEmployeeCode, setTempEmployeeCode] = useState('');                        
  const [appliedEmployeeCode, setAppliedEmployeeCode] = useState('');                  
  const [isThreadQrModalOpen, setIsThreadQrModalOpen] = useState(false);
  const [threadQrFields, setThreadQrFields] = useState({
    lotNo: '245410A',
    dNo: 'Y-104',
    pic: '36',
    size: 'M',
    color: 'D-Grey',
    employee: null,
  });
  const [threadQrLoading, setThreadQrLoading] = useState(false);
  const [isProcessQrModalOpen, setIsProcessQrModalOpen] = useState(false);
  const [processQrFields, setProcessQrFields] = useState({
    lotNo: '131103B',
    dNo: 'Y-113',
    pic: '36',
    size: 'S',
    color: 'Black',
    single: 'rajan',
    fatlock: 'ramakant',
    kansai: 'rajan',
  });

  useEffect(() => {
    let isMounted = true;

    const fetchLabelDesignProcesses = async () => {
      try {
        if (!Array.isArray(importedRecords) || importedRecords.length === 0) {
          if (isMounted) setLabelDesignProcessMap({});
          return;
        }

        const uniqueDNos = Array.from(
          new Set(
            importedRecords
              .map((item) => item?.dNo)
              .filter(Boolean)
          )
        );

        if (uniqueDNos.length === 0) {
          if (isMounted) setLabelDesignProcessMap({});
          return;
        }

        const entries = await Promise.all(
          uniqueDNos.map(async (dNo) => {
            try {
              const res = await getDesignByNumber(dNo);
              const processes = res?.data?.processes || res?.processes || [];
              return [dNo, Array.isArray(processes) ? processes : []];
            } catch (error) {
              return [dNo, []];
            }
          })
        );

        if (isMounted) {
          setLabelDesignProcessMap(Object.fromEntries(entries));
        }
      } catch (error) {
        if (isMounted) setLabelDesignProcessMap({});
      }
    };

    fetchLabelDesignProcesses();
    return () => {
      isMounted = false;
    };
  }, [importedRecords]);
  const [processQrLoading, setProcessQrLoading] = useState(false);
  const [isDoraCutQrModalOpen, setIsDoraCutQrModalOpen] = useState(false);
  const [doraCutQrFields, setDoraCutQrFields] = useState({
    lotNo: '245590B',
    dNo: 'Y-103',
    pic: '16',
    size: 'L',
    color: 'D-Grey',
    doracut: '',
  });
  const [doraCutQrLoading, setDoraCutQrLoading] = useState(false);
  const [isPressQrModalOpen, setIsPressQrModalOpen] = useState(false);
  const [pressQrFields, setPressQrFields] = useState({
    lotNo: '243292B',
    dNo: 'Y-102',              
    pic: '28',                
    size: 'XXL',
    color: 'L-Grey',
    press: '',                             
  });                                              
  const [pressQrLoading, setPressQrLoading] = useState(false);
  const [isMultipleDoraCutQrScanModalOpen, setIsMultipleDoraCutQrScanModalOpen] = useState(false);
  const [multipleDoraCutQrScanValue, setMultipleDoraCutQrScanValue] = useState('');
  const [multipleDoraCutQrScanLoading, setMultipleDoraCutQrScanLoading] = useState(false);
  const [isLogoQrModalOpen, setIsLogoQrModalOpen] = useState(false);
  const [logoQrFields, setLogoQrFields] = useState({
    lotNo: '1122E',
    dNo: 'Y-101',
    pic: '40',
    size: 'S',
    color: 'Black',
    logo: '',
  });
  const [logoQrLoading, setLogoQrLoading] = useState(false);
  const [isPackingQrModalOpen, setIsPackingQrModalOpen] = useState(false);
  const [packingQrFields, setPackingQrFields] = useState({
    pic1: '48', alter1: '0', reject1: '0', totalPic1: '48', dNo1: 'Y-102', size1: 'S', color1: 'D-Grey',
    pic2: '48', alter2: '0', reject2: '0', totalPic2: '48', dNo2: 'Y-102', color2: 'D-Grey', size2: 'S',
    packing: '',
  });
  const [packingQrLoading, setPackingQrLoading] = useState(false);
  const [isBillScanQrModalOpen, setIsBillScanQrModalOpen] = useState(false);
  const [billScanQrFields, setBillScanQrFields] = useState({
    pic: '44', alter: '1', reject: '0', totalPic: '43', lotNo: '1613B', dNo: 'Y-2', size: 'M', color: 'A-Blue', sortingPic: '',
  });
  const [billScanQrLoading, setBillScanQrLoading] = useState(false);
  const [isMultipleQrScanModalOpen, setIsMultipleQrScanModalOpen] = useState(false);
  const [multipleQrScanResults, setMultipleQrScanResults] = useState([]);
  // Colors/Sizes/Statuses are fetched lazily (see below).
  useEffect(() => {
    // no-op
  }, []);

  // Employee dropdown data: don't fetch on Lots route load.
  // Fetch only when user opens filters OR URL already has employee filter.
  const employeesFetchedRef = useRef(false);
  useEffect(() => {
    if (employeesFetchedRef.current) return;
    if (!showFilters && !tempSelectedEmployeeId) return;

    employeesFetchedRef.current = true;

    const fetchAllEmployees = async () => {
      try {
        const response = await getEmployees({ limit: 1000 });
        if (response && response.data) {
          const formattedEmployees = response.data.map((emp) => mapEmployeeToSelectOption(emp));
          setEmployeeOptions(formattedEmployees);
        }
      } catch (error) {
        console.error('Error fetching employees for filter:', error);
      }
    };

    fetchAllEmployees();
  }, [showFilters, tempSelectedEmployeeId]);

  // DNo dropdown data: don't fetch designs on Lots route load.
  // Fetch only when user opens filters OR URL already has dNo filter.
  const designsFetchedRef = useRef(false);
  useEffect(() => {
    if (designsFetchedRef.current) return;
    if (!showFilters && !tempSelectedDNo) return;

    designsFetchedRef.current = true;

    const fetchDesignNumbers = async () => {
      try {
        const response = await getDesigns({ limit: 1000 });
        if (response && response.data && Array.isArray(response.data)) {
          const seen = new Set();
          response.data.forEach((design) => {
            if (
              design.designNumber &&
              typeof design.designNumber === 'string' &&
              design.designNumber.trim()
            ) {
              seen.add(design.designNumber.trim());
            }
          });
          const sorted = Array.from(seen).sort((a, b) =>
            a.toLowerCase().localeCompare(b.toLowerCase())
          );
          setDNoOptions(sorted.map((dn) => ({ value: dn, label: dn })));
        }
      } catch (error) {
        console.error('Error fetching design numbers:', error);
      }
    };

    fetchDesignNumbers();
  }, [showFilters, tempSelectedDNo]);

  // Colors dropdown options (no route-load call)
  const colorsFetchedRef = useRef(false);
  useEffect(() => {
    if (colorsFetchedRef.current) return;
    if (!showFilters && !tempSelectedColor) return;

    colorsFetchedRef.current = true;
    const fetchColors = async () => {
      try {
        const response = await getUniqueColors();
        if (response?.status === 'success') setColors(response.data);
      } catch (error) {
        console.error('Error fetching colors:', error);
      }
    };
    fetchColors();
  }, [showFilters, tempSelectedColor]);

  // Sizes dropdown options (no route-load call)
  const sizesFetchedRef = useRef(false);
  useEffect(() => {
    if (sizesFetchedRef.current) return;
    if (!showFilters && !tempSelectedSize) return;

    sizesFetchedRef.current = true;
    const fetchSizes = async () => {
      try {
        const response = await getUniqueSizes();
        if (response?.status === 'success') setSizes(response?.data);
      } catch (error) {
        console.error('Error fetching sizes:', error);
      }
    };
    fetchSizes();
  }, [showFilters, tempSelectedSize]);

  const statusOptionsFetchedRef = useRef(false);
  useEffect(() => {
    if (statusOptionsFetchedRef.current) return;
    if (!showFilters && !tempSelectedStatus) return;

    statusOptionsFetchedRef.current = true;
    const fetchStatusOptions = async () => {
      try {
        const response = await getProcesses();
        const processes = Array.isArray(response?.data) ? response.data : [];
        const urlStatus = searchParams.get('status') || '';
        setStatusOptions(
          buildStatusOptionsFromProcesses(processes, [
            tempSelectedStatus,
            urlStatus,
          ].filter(Boolean))
        );
      } catch (error) {
        console.error('Error fetching process list for status filter:', error);
      }
    };
    fetchStatusOptions();
  }, [showFilters, tempSelectedStatus]);

  // Restore filters from URL on page load
  useEffect(() => {
    const status = searchParams.get('status') || '';
    const dNo = searchParams.get('dNo') || '';
    const size = searchParams.get('size') || '';
    const color = searchParams.get('color') || '';
    const employeeId = searchParams.get('employeeId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    if (status || dNo || size || color || employeeId || startDate || endDate) {
      setAppliedStatus(status);
      setAppliedDNo(dNo);
      setAppliedSize(size);
      setAppliedColor(color);
      setAppliedEmployeeId(employeeId);
      setAppliedDateRange({ startDate, endDate });
      
      setTempSelectedStatus(status);
      setTempSelectedDNo(dNo);
      setTempSelectedSize(size);
      setTempSelectedColor(color);
      setTempSelectedEmployeeId(employeeId);
      setTempDateRange({ startDate, endDate });
    }
  }, []);

  const handleOpenModal = (rowData) => {
    setSelectedBarcodeData(rowData);
    setIsBarcodeModalOpen(true);
  };

  const handleOpenAddItemModal = () => {
    setIsAddItemModalOpen(true);
  };

  const handleCloseAddItemModal = () => {
    setIsAddItemModalOpen(false);
  };

  const handleAddItemSubmit = async (newItemData) => {
    setIsAddingItem(true);
    try {
      await addItem(newItemData);
      await fetchData();
      handleCloseAddItemModal();
    } catch (error) {
      // toast errors are handled by API layer; keep modal open for correction
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedBarcodeData(null);
    setIsBarcodeModalOpen(false);
  };

  const handleApplyFilters = () => {
    setAppliedStatus(tempSelectedStatus);
    setAppliedDNo(tempSelectedDNo);
    setAppliedSize(tempSelectedSize);
    setAppliedColor(tempSelectedColor);
    setAppliedEmployeeId(tempSelectedEmployeeId);
    setAppliedDateRange(tempDateRange);
    setCurrentPage(1);

    // Update URL with filter params
    const params = new URLSearchParams();
    if (tempSelectedStatus) params.set('status', tempSelectedStatus);
    if (tempSelectedDNo) params.set('dNo', tempSelectedDNo);
    if (tempSelectedSize) params.set('size', tempSelectedSize);
    if (tempSelectedColor) params.set('color', tempSelectedColor);
    if (tempSelectedEmployeeId) params.set('employeeId', tempSelectedEmployeeId);
    if (tempDateRange.startDate) params.set('startDate', tempDateRange.startDate);
    if (tempDateRange.endDate) params.set('endDate', tempDateRange.endDate);
    preserveProductReportParams(params);
    setLotsSearchParams(params);
  };

  const handleClearFilters = () => {
    setAppliedDateSort(null);
    setAppliedColor('');
    setAppliedSize('');
    setAppliedStatus('');
    setAppliedEmployeeCode('');
    setAppliedDNo('');
    setAppliedEmployeeId('');
    setAppliedDateRange({ startDate: '', endDate: '' });
    setTempSelectedStatus('');
    setTempSelectedDNo('');
    setTempSelectedSize('');
    setTempSelectedColor('');
    setTempSelectedEmployeeId('');
    setTempDateRange({ startDate: '', endDate: '' });
    setCurrentPage(1);
    
    // Clear lot filters but keep Product Report return context
    const params = new URLSearchParams();
    preserveProductReportParams(params);
    setLotsSearchParams(params);
  };

  // Real-time filter handlers - trigger API call immediately
  const handleDateSortChange = (value) => {
    setAppliedDateSort(value);
    setCurrentPage(1);
  };

  const handleColorChange = (value) => {
    setAppliedColor(value || '');
    setCurrentPage(1);
  };

  const handleSizeChange = (value) => {
    setAppliedSize(value || '');
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setAppliedStatus(value || '');
    setCurrentPage(1);
  };

  const handleDNoChange = (value) => {
    setAppliedDNo(value || '');
    setCurrentPage(1);
  };

  const handleDateRangeChange = (field, value) => {
    setAppliedDateRange(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };
                 
  const fetchData = async () => {
    try {
      setLoading(true);
      setSearchLoading(true);
      const apiParams = {
        search: debouncedSearchQuery || '',
        page: currentPage,
        limit: currentLimit,
        sortKey: sortConfig.key || null,
        sortDirection: sortConfig.direction || 'asc',
        dateSort: appliedDateSort || null,
        colour: appliedColor || '',
        size: appliedSize || '',
        employeeCode: appliedEmployeeCode || '',
        employeeId: appliedEmployeeId || '',
        status: appliedStatus || '',
        dNo: appliedDNo || '',
        startDate: appliedDateRange.startDate || '',
        endDate: appliedDateRange.endDate || ''
      };
      
      const response = await searchDashboard(apiParams);
      setDashboardData(response.data);
      console.log("response.data------->",response.data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };
          
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 700);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Track if component has mounted to handle initial state
  const hasMountedRef = useRef(false);
  const lastUrlParamsRef = useRef({ status: '', dNo: '', size: '', color: '' });
  const fetchDataTimeoutRef = useRef(null);

  // Read URL params and apply filters on mount or when URL params change
  useEffect(() => {
    const urlStatus = searchParams.get('status') || '';
    const urlDNo = searchParams.get('dNo') || '';
    const urlSize = searchParams.get('size') || '';
    const urlColor = searchParams.get('color') || '';

    // Check if URL params have actually changed
    const currentParams = { status: urlStatus, dNo: urlDNo, size: urlSize, color: urlColor };
    const paramsChanged = 
      lastUrlParamsRef.current.status !== urlStatus ||
      lastUrlParamsRef.current.dNo !== urlDNo ||
      lastUrlParamsRef.current.size !== urlSize ||
      lastUrlParamsRef.current.color !== urlColor;

    // On initial mount, ensure all filters are empty if no URL params
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      if (!urlStatus && !urlDNo && !urlSize && !urlColor) {
        // No URL params on initial mount - clear everything
        setAppliedStatus('');
        setAppliedDNo('');
        setAppliedSize('');
        setAppliedColor('');
        setTempSelectedStatus('');
        setTempSelectedDNo('');
        setTempSelectedSize('');
        setTempSelectedColor('');
        setTempDateRange({ startDate: '', endDate: '' });
        setAppliedDateRange({ startDate: '', endDate: '' });
        lastUrlParamsRef.current = currentParams;
        return; // Don't proceed with URL param logic on initial mount if no params
      }
    }

    // Only process if params have actually changed
    if (!paramsChanged && hasMountedRef.current) {
      return; // Skip if params haven't changed
    }

    // Apply filters from URL params (when URL params exist or change)
    if (urlStatus || urlDNo || urlSize || urlColor) {
      // Apply filters from URL params directly (bypassing Apply button)
      // Set both applied and temp filters so they're in sync
      setAppliedStatus(urlStatus);
      setTempSelectedStatus(urlStatus);
      setAppliedDNo(urlDNo);
      setTempSelectedDNo(urlDNo);
      setAppliedSize(urlSize);
      setTempSelectedSize(urlSize);
      setAppliedColor(urlColor);
      setTempSelectedColor(urlColor);
      
      // Update ref to track current params
      lastUrlParamsRef.current = currentParams;
      
      // Reset page to 1 when filters change - this will trigger fetchData
      setCurrentPage(1);
    } else if (hasMountedRef.current && paramsChanged) {
      // URL params were removed - only clear if params actually changed
      setAppliedStatus('');
      setAppliedDNo('');
      setAppliedSize('');
      setAppliedColor('');
      setTempSelectedStatus('');
      setTempSelectedDNo('');
      setTempSelectedSize('');
      setTempSelectedColor('');
      setTempDateRange({ startDate: '', endDate: '' });
      setAppliedDateRange({ startDate: '', endDate: '' });
      setCurrentPage(1);
      
      // Update ref to track current params
      lastUrlParamsRef.current = currentParams;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    // Don't fetch data on initial mount if component hasn't mounted yet
    if (!hasMountedRef.current) {
      return;
    }
    
    // Debounce fetchData to prevent multiple rapid API calls
    // This is especially important when URL params trigger multiple state updates
    if (fetchDataTimeoutRef.current) {
      clearTimeout(fetchDataTimeoutRef.current);
    }
    
    fetchDataTimeoutRef.current = setTimeout(() => {
    fetchData();
    }, 100);
    
    return () => {
      if (fetchDataTimeoutRef.current) {
        clearTimeout(fetchDataTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, currentLimit, debouncedSearchQuery, sortConfig, appliedDateSort, appliedColor, appliedSize, appliedEmployeeCode, appliedEmployeeId, appliedStatus, appliedDNo, appliedDateRange.startDate, appliedDateRange.endDate]);

  const handleSort = (key) => {
    let newDirection = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        newDirection = 'desc';
      } else if (sortConfig.direction === 'desc') {
        setSortConfig({ key: null, direction: 'asc' });
        setCurrentPage(1);
        return;
      }
    }
    setSortConfig({ key: key, direction: newDirection });
    setCurrentPage(1);
  };

  const handlePageChangeForTable = (newPageZeroBased) => {
    setCurrentPage(newPageZeroBased + 1);
  };

  const handleRowsPerPageChangeForTable = (newRowsPerPage) => {
    setCurrentLimit(newRowsPerPage);
    setCurrentPage(1);
  };

const handleImport = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = "";

  const fileExt = file.name.split('.').pop().toLowerCase();
  if (!["xls", "xlsx"].includes(fileExt))
    return toast.error("Only Excel (.xls / .xlsx) allowed");

  try {
    flushSync(() => setImportLoading(true));
    const response = await importDashboardData(file);
    console.log("IMPORT RESPONSE:", response);

    const skipped = response?.data?.totalSkipped ?? 0; // 🔥 duplicate count
    const processed = response?.data?.totalProcessed ?? 0;

    // 🚨 Duplicate Show
    if (skipped > 0) {
      toast.error(`${skipped} duplicate Lot No found — Import Failed`, {
        autoClose: 4000
      });
      return;
    }

    // 🟢 Success Only (no duplicate)
    toast.success(`✔ Import Successful — ${processed} rows added`);
    
    // Extract all lot numbers from the uploaded file
    const allImportedLotNos =
      response?.data?.allImportedLotNos ||
      response?.data?.newlyAddedLotNos ||
      [];
    if (allImportedLotNos.length > 0) {
      setImportedLotNos(allImportedLotNos);
      setImportedRecords([]);
      localStorage.setItem(
        LAST_EXCEL_IMPORT_LOTS_KEY,
        JSON.stringify(allImportedLotNos)
      );
    }
    
    setIsImportSuccessModalOpen(true);
    setImportedData(response.data);
    
    // Fetch data first, then labels can be generated when user clicks "Print Labels"
    await fetchData();

  } catch (err) {
    toast.error("Import Failed — Please check your file");
  } finally {
    setImportLoading(false);
  }
};

const handleLegacyImport = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = "";

  const fileExt = file.name.split('.').pop().toLowerCase();
  if (!["xls", "xlsx"].includes(fileExt))
    return toast.error("Only Excel (.xls / .xlsx) allowed");

  try {
    flushSync(() => setLegacyImportLoading(true));
    const response = await importLegacyScans(file);
    console.log("LEGACY IMPORT RESPONSE:", response);

    toast.success("✔ Old Import Successful");

    const data = response?.data || {};
    const allImportedLotNos =
      data.allImportedLotNos ||
      data.newlyAddedLotNos ||
      data.lotNos ||
      data.importedLotNos ||
      (Array.isArray(data.records)
        ? data.records.map((r) => r.lotNo).filter(Boolean)
        : []);

    if (allImportedLotNos.length > 0) {
      setImportedLotNos(allImportedLotNos);
      setImportedRecords([]);
      localStorage.setItem(
        LAST_EXCEL_IMPORT_LOTS_KEY,
        JSON.stringify(allImportedLotNos)
      );
    }

    setIsImportSuccessModalOpen(true);
    setImportedData(data);

    await fetchData();
  } catch (err) {
    const isNetwork =
      err?.code === 'ECONNABORTED' ||
      err?.message?.toLowerCase?.().includes('network') ||
      !err?.response;
    toast.error(
      isNetwork
        ? 'Old Import Failed — Server took too long or connection closed. Deploy latest backend or try a smaller file.'
        : 'Old Import Failed — Please check your file'
    );
  } finally {
    setLegacyImportLoading(false);
  }
};




  useEffect(() => {
    if (!showExportMenu) return undefined;
    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu]);

  const handleExport = async (format = "excel") => {
    try {
      setShowExportMenu(false);
      setExportLoading(true);
      const filters = {
        search: debouncedSearchQuery || "",
        status: appliedStatus || "",
        colour: appliedColor || "",
        size: appliedSize || "",
        dNo: appliedDNo || "",
        startDate: appliedDateRange?.startDate || "",
        endDate: appliedDateRange?.endDate || "",
      };
      await exportDashboardData(false, { format, filters });
    } catch (error) {
    } finally {
      setExportLoading(false);
    }
  };

  const handleDemoExport = async () => {
    try {
      setExportLoading(true);
      await exportDashboardData(true, { format: "excel" });
    } catch (error) {
    } finally {
      setExportLoading(false);
    }
  };

  const handleSelectedRowsChange = (newSelectedIds) => {
    setSelectedItemIds(newSelectedIds);
  };

  const fetchDesignProcessMapForDNos = async (dNos) => {
    const unique = Array.from(new Set((dNos || []).filter(Boolean)));
    if (unique.length === 0) return {};
    const entries = await Promise.all(
      unique.map(async (dNo) => {
        try {
          const res = await getDesignByNumber(dNo);
          const processes = res?.data?.processes || res?.processes || [];
          return [dNo, Array.isArray(processes) ? processes : []];
        } catch {
          return [dNo, []];
        }
      })
    );
    return Object.fromEntries(entries);
  };

  const resolveLabelDesignProcesses = (item) => {
    const inline = item?.processes || item?.designProcesses || item?.design?.processes;
    if (Array.isArray(inline) && inline.length > 0) {
      return inline;
    }
    return labelDesignProcessMap[item?.dNo] || [];
  };

  const handleMultiLabelPrint = async () => {
    if (!labelRef.current) return;
    const selectedRecords = (dashboardData.records || []).filter((record) =>
      selectedItemIds.includes(record._id)
    );
    if (!selectedRecords.length) return;

    setIsPrinting(true);
    try {
      const mapUpdate = await fetchDesignProcessMapForDNos(selectedRecords.map((r) => r?.dNo));
      flushSync(() => {
        setLabelDesignProcessMap((prev) => ({ ...prev, ...mapUpdate }));
      });

      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setTimeout(resolve, 200));
        });
      });

      const labelElements = labelRef.current.querySelectorAll('.label-barcode-pdf');
      if (!labelElements.length) return;

      const labelWidthMm = 75;
      const labelHeightMm = 50;
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [labelWidthMm, labelHeightMm],
      });

      for (let i = 0; i < labelElements.length; i++) {
        const element = labelElements[i];
        const canvas = await html2canvas(element, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 283.46,
          height: 188.98,
        });
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        if (i > 0) {
          pdf.addPage([labelWidthMm, labelHeightMm], 'landscape');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, labelWidthMm, labelHeightMm, undefined, 'FAST');
      }
      const pdfBlob = pdf.output('blob');
      pdf.save('labels.pdf');
      const url = window.URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(url);
      setShowPdfModal(true);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintSelected = () => {
    setIsPrintModalOpen(true);
  };

  const confirmPrint = async () => {
    setIsPrintModalOpen(false);
    await handleMultiLabelPrint();
  };

  const handleOpenPdf = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    }
    setShowPdfModal(false);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    if (pdfBlobUrl) {
      setPdfBlobUrl(null);
    }
  };

  const closePrintModal = () => {
    setIsPrintModalOpen(false);
  };

  // Function to fetch dashboard data for specific lot numbers
  const fetchDashboardDataByLotNos = async (lotNos) => {
    try {
      // First try to get from current dashboardData
      const currentRecords = dashboardData.records || [];
      const foundInCurrent = currentRecords.filter(record => 
        lotNos.includes(record.lotNo)
      );
      
      // If we found all records, return them
      if (foundInCurrent.length === lotNos.length) {
        return foundInCurrent;
      }
      
      // Otherwise, search for missing lot numbers
      const missingLotNos = lotNos.filter(lotNo => 
        !currentRecords.some(record => record.lotNo === lotNo)
      );
      
      if (missingLotNos.length > 0) {
        // Search for each missing lot number
        const searchPromises = missingLotNos.map(lotNo => 
          searchDashboard({ search: lotNo, page: 1, limit: 100 })
        );
        const searchResults = await Promise.all(searchPromises);
        
        const additionalRecords = searchResults.flatMap(result => 
          (result.data?.records || []).filter(record => 
            lotNos.includes(record.lotNo)
          )
        );
        
        // Combine found records
        const allFound = [...foundInCurrent, ...additionalRecords];
        // Remove duplicates
        const uniqueRecords = allFound.filter((record, index, self) =>
          index === self.findIndex(r => r._id === record._id)
        );
        
        return uniqueRecords;
      }
      
      return foundInCurrent;
    } catch (error) {
      console.error("Error fetching dashboard data by lot numbers:", error);
      toast.error("Failed to fetch data for label generation", { toastId: 'fetch-labels-error' });
      return [];
    }
  };

  // Function to generate labels for imported lot numbers
  const handleGenerateImportLabels = async (lotNos) => {
    if (!lotNos || lotNos.length === 0) return;
    
    setIsGeneratingImportLabels(true);
    setIsPrinting(true);
    try {
      // Fetch dashboard data for all lot numbers
      const records = await fetchDashboardDataByLotNos(lotNos);
      
      if (records.length === 0) {
        toast.warning("No data found for the imported lot numbers", { toastId: 'no-labels-data' });
        setIsGeneratingImportLabels(false);
        setIsPrinting(false);
        return;
      }

      const mapUpdate = await fetchDesignProcessMapForDNos(records.map((r) => r?.dNo));
      flushSync(() => {
        setLabelDesignProcessMap((prev) => ({ ...prev, ...mapUpdate }));
        setImportedLotNos(lotNos);
        setImportedRecords(records);
      });

      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setTimeout(resolve, 250));
        });
      });
      
      // Generate PDF
      if (!importLabelRef.current) {
        toast.error("Label container not found", { toastId: 'label-container-error' });
        setIsGeneratingImportLabels(false);
        setIsPrinting(false);
        return;
      }

      const labelElements = importLabelRef.current.querySelectorAll('.label-barcode-pdf');
      if (!labelElements.length) {
        toast.error("No label elements found", { toastId: 'no-label-elements' });
        setIsGeneratingImportLabels(false);
        setIsPrinting(false);
        return;
      }

      // 75mm x 50mm in mm - Horizontal (landscape)
      const labelWidthMm = 75;  // 75mm (width)
      const labelHeightMm = 50; // 50mm (height)
      
      // Create PDF with landscape orientation using mm units - unambiguous
      const pdf = new jsPDF({ 
        orientation: 'landscape', 
        unit: 'mm', 
        format: [labelWidthMm, labelHeightMm] 
      });
      
      for (let i = 0; i < labelElements.length; i++) {
        const element = labelElements[i];
        
        const canvas = await html2canvas(element, { 
          scale: 3, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 283.46, // 75mm at 96dpi
          height: 188.98 // 50mm at 96dpi
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        // Add new page for each label after the first
        if (i > 0) {
          pdf.addPage([labelWidthMm, labelHeightMm], 'landscape');
        }
        
        // Fill entire page: 75mm wide × 50mm tall
        pdf.addImage(imgData, 'JPEG', 0, 0, labelWidthMm, labelHeightMm, undefined, 'FAST');
      }
      
      const pdfBlob = pdf.output('blob');
      pdf.save(`imported-labels-${new Date().toISOString().split('T')[0]}.pdf`);
      const url = window.URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(url);
      setShowPdfModal(true);
      setIsImportSuccessModalOpen(false);
      
      toast.success(`Labels generated for ${records.length} lot(s)`, { toastId: 'import-labels-success' });
    } catch (error) {
      console.error("Error generating import labels:", error);
      toast.error("Failed to generate labels. Please try again.", { toastId: 'import-labels-error' });
    } finally {
      setIsGeneratingImportLabels(false);
      setIsPrinting(false);
    }
  };

  const handlePrintImportedData = async () => {
    if (importedLotNos.length === 0) {
      toast.warning("No imported lot numbers to print", { toastId: 'no-import-lots' });
      return;
    }
    await handleGenerateImportLabels(importedLotNos);
  };

  const handlePrintLastUploadQrCodes = async () => {
    setIsPrintingLastUploadQr(true);
    try {
      let lotNos = [];

      try {
        const cached = localStorage.getItem(LAST_EXCEL_IMPORT_LOTS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            lotNos = parsed;
          }
        }
      } catch (cacheError) {
        console.warn('Failed to read cached last upload lots:', cacheError);
      }

      if (lotNos.length === 0) {
        const response = await getLastExcelImportBatch();
        lotNos = response?.data?.lotNos || [];
        if (lotNos.length > 0) {
          localStorage.setItem(
            LAST_EXCEL_IMPORT_LOTS_KEY,
            JSON.stringify(lotNos)
          );
        }
      }

      if (lotNos.length === 0) {
        toast.warning('No last upload file found', { toastId: 'no-last-upload-lots' });
        return;
      }

      await handleGenerateImportLabels(lotNos);
    } catch (error) {
      console.error('Failed to print last upload QR codes:', error);
    } finally {
      setIsPrintingLastUploadQr(false);
    }
  };

  const closeImportSuccessModal = () => {
    if (!isPrinting) {
      setIsImportSuccessModalOpen(false);
      setImportedData(null);
    }
  };

  const handleOpenThreadQrModal = () => {
    setIsThreadQrModalOpen(true);
  };
  const handleCloseThreadQrModal = () => {
    setIsThreadQrModalOpen(false);
    setThreadQrFields({ lotNo: '245410A', dNo: 'Y-104', pic: '36', size: 'M', color: 'D-Grey', employee: null });
  };
  const handleThreadQrFieldChange = (field, value) => {
    setThreadQrFields(prev => ({ ...prev, [field]: value }));
  };
  const handleThreadQrSubmit = () => {
    setThreadQrLoading(true);
    setTimeout(() => {
      setThreadQrLoading(false);
      handleCloseThreadQrModal();
      toast.success('Thread QR details submitted!', { toastId: 'thread-details-submitted' });
    }, 1000);
  };

  const handleOpenProcessQrModal = () => {
    setIsProcessQrModalOpen(true);
  };
  const handleCloseProcessQrModal = () => {
    setIsProcessQrModalOpen(false);
    setProcessQrFields({ lotNo: '131103B', dNo: 'Y-113', pic: '36', size: 'S', color: 'Black', single: 'rajan', fatlock: 'ramakant', kansai: 'rajan' });
  };
  const handleProcessQrFieldChange = (field, value) => {
    setProcessQrFields(prev => ({ ...prev, [field]: value }));
  };
  const handleProcessQrSubmit = () => {
    setProcessQrLoading(true);
    setTimeout(() => {
      setProcessQrLoading(false);
      handleCloseProcessQrModal();
      toast.success('Process QR details submitted!', { toastId: 'process-details-submitted' });
    }, 1000);
  };

  const handleOpenDoraCutQrModal = () => {
    setIsDoraCutQrModalOpen(true);
  };
  const handleCloseDoraCutQrModal = () => {
    setIsDoraCutQrModalOpen(false);
    setDoraCutQrFields({ lotNo: '245590B', dNo: 'Y-103', pic: '16', size: 'L', color: 'D-Grey', doracut: '' });
  };
  const handleDoraCutQrFieldChange = (field, value) => {
    setDoraCutQrFields(prev => ({ ...prev, [field]: value }));
  };
  const handleDoraCutQrSubmit = () => {
    setDoraCutQrLoading(true);
    setTimeout(() => {
      setDoraCutQrLoading(false);
      handleCloseDoraCutQrModal();
      toast.success('DoraCut QR details submitted!', { toastId: 'doracut-details-submitted' });
    }, 1000);
  };

  const handleOpenPressQrModal = () => {
    setIsPressQrModalOpen(true);
  };
  const handleClosePressQrModal = () => {
    setIsPressQrModalOpen(false);
    setPressQrFields({ lotNo: '243292B', dNo: 'Y-102', pic: '28', size: 'XXL', color: 'L-Grey', press: '' });
  };
  const handlePressQrFieldChange = (field, value) => {
    setPressQrFields(prev => ({ ...prev, [field]: value }));
  };
  const handlePressQrSubmit = () => {
    setPressQrLoading(true);
    setTimeout(() => {
      setPressQrLoading(false);
      handleClosePressQrModal();
      toast.success('Press QR details submitted!',  { toastId: 'press-details-submitted' });
    }, 1000);
  };

  const handleOpenMultipleDoraCutQrScanModal = () => {
    setIsMultipleDoraCutQrScanModalOpen(true);
  };
  const handleCloseMultipleDoraCutQrScanModal = () => {
    setIsMultipleDoraCutQrScanModalOpen(false);
    setMultipleDoraCutQrScanValue('');
  };
  const handleMultipleDoraCutQrScanChange = (val) => {
    setMultipleDoraCutQrScanValue(val);
  };
  const handleMultipleDoraCutQrScanSubmit = (payload) => {
    setMultipleDoraCutQrScanLoading(true);
    setTimeout(() => {
      setMultipleDoraCutQrScanLoading(false);
      handleCloseMultipleDoraCutQrScanModal();
      toast.success(`Multiple DoraCut ${payload?.actionStatus || ''} QR Scan submitted!`,   { toastId: 'multiple-doracut-qr-scan-submitted' });
    }, 1000);
  };

  const handleOpenLogoQrModal = () => {
    setIsLogoQrModalOpen(true);
  };
  const handleCloseLogoQrModal = () => {
    setIsLogoQrModalOpen(false);
    setLogoQrFields({ lotNo: '1122E', dNo: 'Y-101', pic: '40', size: 'S', color: 'Black', logo: '' });
  };
  const handleLogoQrFieldChange = (field, value) => {
    setLogoQrFields(prev => ({ ...prev, [field]: value }));
  };
  const handleLogoQrSubmit = () => {
    setLogoQrLoading(true);
    setTimeout(() => {
      setLogoQrLoading(false);
      handleCloseLogoQrModal();
      toast.success('Logo QR details submitted!', { toastId: 'logo-details-submitted' });
    }, 1000);
  };

  const handleOpenPackingQrModal = () => {
    setIsPackingQrModalOpen(true);
  };
  const handleClosePackingQrModal = () => {
    setIsPackingQrModalOpen(false);
    setPackingQrFields({
      pic1: '48', alter1: '0', reject1: '0', totalPic1: '48', dNo1: 'Y-102', size1: 'S', color1: 'D-Grey',
      pic2: '48', alter2: '0', reject2: '0', totalPic2: '48', dNo2: 'Y-102', color2: 'D-Grey', size2: 'S',
      packing: '',
    });
  };
  const handlePackingQrFieldChange = (field, value) => {
    setPackingQrFields(prev => ({ ...prev, [field]: value }));
  };
  const handlePackingQrSubmit = () => {
    setPackingQrLoading(true);
    setTimeout(() => {
      setPackingQrLoading(false);
      handleClosePackingQrModal();
      toast.success('Packing QR details submitted!',  { toastId: 'packing-details-submitted' });
    }, 1000);
  };

  const getEmployeeFromProcess = (process) => {
  return (
    process?.employeeId ||
    process?.single ||
    process?.fatlock ||
    process?.kansai ||
    process?.doracut ||
    process?.logo ||
    process?.press ||
    process?.packing ||
    null
  );
};

  const handleOpenBillScanQrModal = () => {
    setIsBillScanQrModalOpen(true);
  };
  const handleCloseBillScanQrModal = () => {
    setIsBillScanQrModalOpen(false);
    setBillScanQrFields({ pic: '44', alter: '1', reject: '0', totalPic: '43', lotNo: '1613B', dNo: 'Y-2', size: 'M', color: 'A-Blue', sortingPic: '' });
  };
  const handleBillScanQrFieldChange = (field, value) => {
    setBillScanQrFields(prev => ({ ...prev, [field]: value }));
  };
  const handleBillScanQrSubmit = async (paylaod) => {    
    setBillScanQrLoading(true);
    try {
      await createBillScan(paylaod);
      handleCloseBillScanQrModal();
      // await fetchData();
    } catch (error) {
      console.error('Error submitting bill scan data:', error);
      // Error handling is already done in the API function with toast notifications
    } finally {
      setBillScanQrLoading(false);
    }
  };

  const handleOpenMultipleQrScanModal = () => {
    setIsMultipleQrScanModalOpen(true);
    setMultipleQrScanResults([]);
  };
  const handleCloseMultipleQrScanModal = () => {
    setIsMultipleQrScanModalOpen(false);
  };
  const handleQrScan = (data) => {
    if (data && !multipleQrScanResults.includes(data)) {
      setMultipleQrScanResults(prev => [...prev, data]);
    }
  };

  const SortableTableHeader = ({ label, sortKey }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
      <div className="flex items-center gap-1 cursor-pointer w-max" onClick={() => handleSort(sortKey)}>
        <span>{label}</span>
        <div className="flex flex-col -space-y-1">
          <LucideChevronUp
            size={12}
            className={`${isSorted && sortConfig.direction === 'asc' ? 'text-light-primary' : 'text-light-lightGrey'}`}
          />
          <LucideChevronDown
            size={12}
            className={`${isSorted && sortConfig.direction === 'desc' ? 'text-light-primary' : 'text-light-lightGrey'}`}
          />
        </div>
      </div>
    );
  };

  const columns = [
    {
      header: <SortableTableHeader label="Date" sortKey="date" />,
      accessor: 'date',
      cell: (row) => row.date ? formatDate(row.date) : "-",
      isDate: true
    },
    {
      header: <SortableTableHeader label="Lot No." sortKey="lotNo" />,
      accessor: 'lotNo',
      cell: (row) => row.lotNo ? (
        <a 
          href={`/product-report?lotNo=${encodeURIComponent(row.lotNo)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.lotNo}
        </a>
      ) : "-"
    },
    {
      header: <SortableTableHeader label="D. No." sortKey="dNo" />,
      accessor: 'dNo',
       cell: (row) => row.dNo ? (
        <a 
          href={`/product-report?dNo=${encodeURIComponent(row.dNo)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.dNo}
        </a>
      ) : "-"
    },
    {
      header: <SortableTableHeader label="Color" sortKey="colour" />,
      accessor: 'colour',
       cell: (row) => row.colour ? (
        <a 
          href={`/product-report?color=${encodeURIComponent(row.colour)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.colour}
        </a>
      ) : "-"
    },
    {
      header: <SortableTableHeader label="Size" sortKey="size" />,
      accessor: 'size',
      cell: (row) => row.size ? (
        <a 
          href={`/product-report?size=${encodeURIComponent(row.size)}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.size}
        </a>
      ) : "-"
    },
    // {
    //   header: <SortableTableHeader label="Layer" sortKey="layer" />,
    //   accessor: 'layer',
    //   cell: (row) => row.layer || "-"
    // },
    // {
    //   header: <SortableTableHeader label="Master" sortKey="master" />,
    //   accessor: 'master',
    //   cell: (row) => row.master || "-"
    // },
    {
      header: <SortableTableHeader label="Pic" sortKey="pic" />,
      accessor: 'pic',
      cell: (row) => {
         const pic = row.pic || 0;
         const picNumber = Number(pic) || 0;

    // Prefer top-level fields from API; fallback to nested schand_ProcessDetails
    const rcDetail = Array.isArray(row?.schand_ProcessDetails)
      ? row.schand_ProcessDetails.find(
          (x) =>
            x?.rcPic !== undefined ||
            x?.alter !== undefined ||
            x?.reject !== undefined
        )
      : null;
    const rcPic = row?.rcPic ?? rcDetail?.rcPic;
    const rcPicNumber = rcPic !== undefined && rcPic !== null ? Number(rcPic) : undefined;

    // RC PIC color: red if RC PIC < total PIC, green if equal
    let rcPicColor = '#9ca3af';
    if (rcPicNumber !== undefined && picNumber > 0) {
      if (rcPicNumber < picNumber) {
        rcPicColor = '#dc2626';
      } else if (rcPicNumber === picNumber) {
        rcPicColor = '#15803D';
      } else {
        rcPicColor = '#4b5563';
      }
    }

    // List shows Total Pic / RC only (Alter / Reject stay on Edit & scan forms)
    return pic ? (
      <div
        className="flex items-center gap-1 flex-wrap"
        onClick={(e) => e.stopPropagation()}
        title="Total Pic / RC"
      >
        <a
          href={`/product-report?pic=${encodeURIComponent(pic)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline font-medium text-gray-900"
        >
          {pic}
        </a>

        <span className="text-gray-500">/</span>

        <span className="font-semibold" style={{ color: rcPicColor }}>
          {rcPicNumber !== undefined && !Number.isNaN(rcPicNumber) ? rcPicNumber : '-'}
        </span>
      </div>
    ) : (
      '-'
    );
    }
      // cell: (row) => row.pic ? (
      //   <a 
      //     href={`/product-report?pic=${encodeURIComponent(row.pic)}`} 
      //     target="_blank" 
      //     rel="noopener noreferrer"
      //     className="text-blue-600 hover:underline"
      //     onClick={(e) => e.stopPropagation()}
      //   >
      //     {row.pic}
      //   </a>
      // ) : "-"
    },
    {
      header: <SortableTableHeader label="Last Scan Date" sortKey="lastScanDate" />,
      accessor: 'lastScanDate',
      cell: (row) => row.lastScanDate ? formatDate(row.lastScanDate) : "-"
    },
    {
      header: <SortableTableHeader label="Emp Name" sortKey="employeeName" />,
      accessor: 'employeeName',
      cell: (row) => {
        if (row?.lastProcess && typeof row.lastProcess === "object") {
          const lastProcessName = String(row.lastProcess.name || "").trim();
          const rawLastProcessCode = String(row.lastProcess.employeeCode || "").trim();
          const lastProcessCode = isTenantClientCode(rawLastProcessCode) ? "" : rawLastProcessCode;
          if (lastProcessName && lastProcessCode) return `${lastProcessName} (${lastProcessCode})`;
          if (lastProcessName) return lastProcessName;
          if (lastProcessCode) return lastProcessCode;
        }
        if (row.last_process_nickname) {
          const code = isTenantClientCode(row.last_process_employeeName) ? "" : row.last_process_employeeName;
          if (code && String(row.last_process_nickname).trim() !== String(code).trim()) {
            return `${row.last_process_nickname} (${code})`;
          }
          return row.last_process_nickname;
        }
        if (row.last_process_employeeName) return row.last_process_employeeName;
        if (row.employeeDetails && typeof row.employeeDetails === "object") {
          const out = formatEmployeeDisplayWithCode(row.employeeDetails);
          if (out !== "-") return out;
        }
        if (row.employeeDetails?.username) return row.employeeDetails.username;

        const fromSchand = getEmployeeDisplayFromSchandOrRoot(row);
        if (fromSchand) return fromSchand;

        const currentStatus = lowercase(row.currentStatus || row.status || "");

        if (currentStatus === "complete" || currentStatus === "billscan") {
          if (row.billScan && typeof row.billScan === "object" && row.billScan.username) {
            return row.billScan.username;
          }
          const processes = row?.schand_ProcessDetails || [];
          for (let i = processes.length - 1; i >= 0; i--) {
            if (
              processes[i]?.billScan &&
              typeof processes[i].billScan === "object" &&
              processes[i].billScan.username
            ) {
              return processes[i].billScan.username;
            }
          }
        }

        return "-";
    }
    },
    {
      header: (
        <div className="flex w-full items-center justify-center">
          <SortableTableHeader label="Status" sortKey="status" />
        </div>
      ),
      // cell: (row) => row.status ? <Status status={lowercase(row.status) === 'loading' ? "unloading" : lowercase(row.status)} /> : "-"
      cell: (row) => {
        const status = row.currentStatus || row.status || "";
        const isComplete = lowercase(status) === 'done' || lowercase(status) === 'complete';
        const isBillscan = lowercase(status) === 'billscan';
        return (
          <div className="flex justify-center">
            {isComplete ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#BFD4BA] bg-[#E6F0E2] px-2.5 py-0.5 text-xs font-semibold text-[#2F6B3A]">
                <LucideCheck size={12} strokeWidth={3} />
                Complete
              </span>
            ) : isBillscan ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#F3D3A8] bg-[#FDF0DF] px-2.5 py-0.5 text-xs font-semibold text-[#B45309]">
                Billscan
              </span>
            ) : (
              capitalize(status) || "-"
            )}
          </div>
        );
      }
    },
    {
      header: (
        <div className="flex w-full items-center justify-center">
          <SortableTableHeader label="Barcode" sortKey="barcode" />
        </div>
      ),
      cell: (row) => (
        <div className="flex items-center justify-center">
          <LucideScanBarcode
            className="cursor-pointer text-light-primary hover:text-light-primary_hover"
            onClick={() => handleOpenModal(row)}
          />
        </div>
      ),
    },
    {
      header: (
        <div className="flex w-full justify-center">
          <span>Actions</span>
        </div>
      ),
      id: "actions",
      cell: (row) => {
        const dashboardItemOptions = [
          {
            label: "View Details",
            icon: <Eye size={16} />,
            action: () => handleViewDashboardItemDetails(row),
            className: "text-gray-700",
          },
          {
            label: "Edit",
            icon: <Edit size={16} />,
            action: () => handleEditDashboardItem(row),
            className: "text-gray-700",
          },
          {
            label: "Delete",
            icon: <Trash2 size={16} />,
            action: () => handleDeleteDashboardItem(row),
            className: "text-red-600",
          },
        ];
        return (
          <div className="flex items-center justify-center">
            <ActionCell row={row} options={dashboardItemOptions} />
          </div>
        );
      },
    },
  ];

  const handleViewDashboardItemDetails = (item) => {
    setSelectedDashboardItem(item);
    setIsViewDashboardModalOpen(true);
  };

  const handleEditDashboardItem = (item) => {
    setSelectedItemForEdit(item);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteDashboardItem = (item) => {
    setItemToDelete(item);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleCloseDeleteConfirmModal = () => {
    if (isDeletingItem) return;
    setIsDeleteConfirmModalOpen(false);
    setItemToDelete(null);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    setIsDeletingItem(true);
    try {
      await deleteDashboard(itemToDelete._id);
      fetchData();
    } catch (error) {
      toast.error(`Failed to delete item ${itemToDelete.lotNo}.`, { toastId: 'item-delete-error' });
      console.error(error);
    } finally {
      setIsDeletingItem(false);
      handleCloseDeleteConfirmModal();
    }
  };

  const handleUpdateDashboardItem = async (id, data) => {
    try {
      await updateDashboard(id, data);
      fetchData();
    } catch (error) {
      toast.error(`Failed to update item ${selectedItemForEdit.lotNo}.`, { toastId: 'item-update-error' });
      console.error(error);
      throw error;
    }
  };

  const closeViewDashboardModal = () => {
    setSelectedDashboardItem(null);
    setIsViewDashboardModalOpen(false);
  };

  return (
    <div className="min-h-0">
      {(isPrinting || loading || importLoading || legacyImportLoading || exportLoading || searchLoading) && <LoaderComponent size={56}/>}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <BarcodeScannerModalWithBarcode
        isOpen={isBarcodeModalOpen}
        onClose={handleCloseModal}
        barcodeData={selectedBarcodeData}
        onPrintBarcode={async (lotNo) => {
          if (!lotNo) return null;
          try {
            const blob = await generateLabels([lotNo]);
            return blob;
          } catch (error) {
            toast.error(`Error generating label for Lot No: ${lotNo}`,  { toastId: 'label-error' });
            return null;
          }
        }}
      />

      <ViewDashboardModal
        isOpen={isViewDashboardModalOpen}
        onClose={closeViewDashboardModal}
        dashboardItem={selectedDashboardItem}
      />

      <UpdateDashboardForm
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        dashboardItem={selectedItemForEdit}
        onUpdate={handleUpdateDashboardItem}
        colors={colors}
        sizes={sizes}
      />

      {isAddItemModalOpen && (
        <Modal
          isOpen={isAddItemModalOpen}
          onClose={handleCloseAddItemModal}
          title="Add New Product"
          size="3xl"
        >
          <AddProductForm
            onSubmit={handleAddItemSubmit}
            onCancel={handleCloseAddItemModal}
            isLoading={isAddingItem}
          />
        </Modal>
      )}



      {/* <MultipleDoraCutQrScanModal
        isOpen={isMultipleDoraCutQrScanModalOpen}
        onClose={handleCloseMultipleDoraCutQrScanModal}
        onSubmit={handleMultipleDoraCutQrScanSubmit}
        isLoading={multipleDoraCutQrScanLoading}
        doracut={multipleDoraCutQrScanValue}
        onDoraCutChange={handleMultipleDoraCutQrScanChange}
        onScanBarCode={handleOpenMultipleQrScanModal}
        scannedResults={multipleQrScanResults}
      />

      {isMultipleQrScanModalOpen && (
        <Modal
          isOpen={isMultipleQrScanModalOpen}
          onClose={handleCloseMultipleQrScanModal}
          title="Scan Multiple QR Codes"
          size="md"
        >
          <div className="flex flex-col items-center gap-4 p-4">
            <QrReader onScan={handleQrScan} />
            <div className="w-full mt-4">
              <h4 className="font-semibold mb-2">Scanned Results:</h4>
              <ul className="bg-gray-100 rounded p-2 max-h-40 overflow-y-auto">
                {multipleQrScanResults.length === 0 && <li className="text-gray-400">No QR codes scanned yet.</li>}
                {multipleQrScanResults.map((result, idx) => (
                  <li key={idx} className="text-sm text-gray-700 py-1 border-b last:border-b-0">xdfhfcjgvj{result}</li>
                ))}
              </ul>
            </div>
            <Button
              type="button"
              variant="primary"
              label="Done"
              onClick={handleCloseMultipleQrScanModal}
              className="w-full mt-4"
            />
          </div>
        </Modal>
      )} */}

      <BillScanQrDetailsModal
        isOpen={isBillScanQrModalOpen}
        onClose={handleCloseBillScanQrModal}
        onSubmit={(paylaod) => handleBillScanQrSubmit(paylaod)}
        isLoading={billScanQrLoading}
        fields={billScanQrFields}
        onFieldChange={handleBillScanQrFieldChange}
      />


      {isDeleteConfirmModalOpen && itemToDelete && (
        <Modal
          isOpen={isDeleteConfirmModalOpen}
          onClose={handleCloseDeleteConfirmModal}
          title=""
          size="sm"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <AlertTriangle size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete item: <strong>{itemToDelete.lotNo}</strong>?
              <br />
              This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3 w-full">
              <Button
                variant="outline"
                size="medium"
                label="Cancel"
                onClick={handleCloseDeleteConfirmModal}
                disabled={isDeletingItem}
                className="flex-1 focus:!ring-0"
              />
              <Button
                variant="primary"
                size="medium"
                label={ "Yes, Delete"}
                onClick={confirmDeleteItem}
                loading={isDeletingItem}
                disabled={isDeletingItem}
                className="flex-1"
              />
            </div>
          </div>
        </Modal>
      )}

      {isPrintModalOpen && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={closePrintModal}
          title=""
          size="sm"
        >
          <div className="flex flex-col items-center text-center p-2">
            <LucidePrinter size={48} className="text-light-primary mb-4" />
            <h3 className="text-lg font-semibold text-light-darkGrey mb-2">Confirm Print</h3>
            <p className="text-sm text-light-text mb-6">
              Are you sure you want to print these {selectedItemIds.length} item(s)?
            </p>
            <div className="flex justify-center space-x-3 w-full">
              <Button
                variant="outline"
                size="default"
                onClick={closePrintModal}
                label="Cancel"
                className="flex-1 focus:!ring-0"
                disabled={isPrinting}
              />
              <Button
                variant="primary"
                size="default"
                onClick={confirmPrint}
                label={isPrinting ? "Generating..." : "Yes, Print"}
                className="flex-1 focus:!ring-0"
                disabled={isPrinting}
                icon={isPrinting ? <LucideLoader size={20} className="animate-spin" /> : null}
              />
            </div>
          </div>
        </Modal>
      )}

      {isImportSuccessModalOpen && (
        <Modal
          isOpen={isImportSuccessModalOpen}
          onClose={closeImportSuccessModal}
          title=""
          size="sm"
        >
          <div className="flex flex-col items-center text-center p-2">
            {isPrinting ? (
              <>
                <LucideLoader size={48} className="text-light-primary animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-light-darkGrey mb-2">Generating Labels...</h3>
                <p className="text-sm text-light-text mb-6">
                  Please wait while we generate your labels.
                </p>
              </>
            ) : (
              <>
                <LucidePackageCheck size={48} className="text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-light-darkGrey mb-2">Import Successful!</h3>
                <p className="text-sm text-light-text mb-6">
                  Would you like to print labels for these items?
                </p>
                <div className="flex justify-center space-x-3 w-full">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={closeImportSuccessModal}
                    label="Close"
                    className="flex-1 focus:!ring-0"
                    disabled={isPrinting}
                  />
                  <Button
                    variant="primary"
                    size="default"
                    onClick={handlePrintImportedData}
                    label="Print Labels"
                    className="flex-1 focus:!ring-0"
                    loading={isPrinting}
                    disabled={isPrinting}
                  />
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {showPdfModal && (
        <Modal
          isOpen={showPdfModal}
          onClose={handleClosePdfModal}
          title="Open PDF"
          size="sm"
        >
          <div className="p-4 text-center">
            <p className="text-sm text-gray-700 mb-4">
              The barcode PDF has been downloaded. Would you like to open it?
            </p>
            <div className="flex justify-center space-x-3">
              <Button
                variant="outline"
                onClick={handleClosePdfModal}
                label="Cancel"
              />
              <Button
                variant="primary"
                onClick={handleOpenPdf}
                label="Yes, Open PDF"
              />
            </div>
          </div>
        </Modal>
      )}

      <div ref={labelRef} style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {dashboardData.records.filter(record => selectedItemIds.includes(record._id)).map((item, idx) => (
          <div
            key={item._id || idx}
            className="label-barcode-pdf"
            style={{
              width: '283.46px',
              height: '188.98px',
              background: '#fff',
              margin: '0 auto',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pageBreakAfter: 'always',
            }}
          >
            <LabelBlockWithBarcode {...item} designProcesses={resolveLabelDesignProcesses(item)} />
          </div>
        ))}
      </div>

      {/* Import Labels Container - Hidden */}
      <div ref={importLabelRef} style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {importedRecords.length > 0 && importedRecords.map((item, idx) => (
          <div
            key={`import-${item._id || item.lotNo || idx}`}
            className="label-barcode-pdf"
            style={{
              width: '283.46px', // 75mm
              height: '188.98px', // 50mm
              background: '#fff',
              margin: '0 auto',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pageBreakAfter: 'always',
            }}
          >
            <LabelBlockWithBarcode {...item} designProcesses={resolveLabelDesignProcesses(item)} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between !mt-0">
        <div className="flex items-center gap-3">
          {fromProductReport && (
            <Button
              variant="outline"
              size="medium"
              icon={<LucideArrowLeft size={18} />}
              label="Back to Product Report"
              onClick={handleBackToProductReport}
              className="flex items-center space-x-2 shadow-none font-normal !rounded-md bg-white border border-light-primary px-3 py-2 text-light-primary hover:bg-light-natural_50 transition-colors duration-200 focus:!ring-0"
            />
          )}
          <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default">
            Product
          </h1>
        </div>
        <div className="flex gap-2">
      
      
          {/* <Button
            variant="outline"
            size="medium"
            label="Add DoraCut QR"
            onClick={handleOpenDoraCutQrModal}
            className="ml-4"
          />
        
          <Button
            variant="outline"
            size="medium"
            label="Multiple DoraCut QR Scan"
            onClick={handleOpenMultipleDoraCutQrScanModal}
            className="ml-4"
          />
          <Button
            variant="outline"
            size="medium"
            label="Add BillScan QR"
            onClick={handleOpenBillScanQrModal}
            className="ml-4"
          /> */}
        </div>
        {/* <Button
          label="Open Status Modal"
          variant="primary"
          onClick={() => setIsStatusModalOpen(true)}
          className="ml-4"
        /> */}
      </div>

      {/* Action Buttons */}
      <div className="flex items-stretch sm:items-center justify-end gap-4 w-full py-4 max-sm:grid max-sm:grid-cols-2 max-[320px]:grid-cols-1">
        <div className="flex items-stretch sm:items-center gap-4">
          <Button
            variant="outline"
            size="medium"
            icon={showSelectInTable ? <Eye width={18} /> : <EyeOff width={18} />}
            label={showSelectInTable ? "Hide Select" : "Show Select"}
            onClick={() => setShowSelectInTable(prev => !prev)}
            className="flex w-full xl:w-auto justify-center items-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 max-sm:justify-center"
          />
          <Button
            variant="outline"
            size="medium"
            icon={<LucideDownload size={20} />}
            label="Demo Excel Download"
            onClick={handleDemoExport}
            className="flex w-full xl:w-auto items-cente justify-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 max-sm:w-full max-sm:justify-center"
          />
          <div className="relative w-full xl:w-auto">
            <input
              type="file"
              accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleImport}
              className="hidden"
              id="import-file"
              disabled={importLoading || legacyImportLoading}
            />
            <label
              htmlFor="import-file"
              className={`flex w-full py-2.5 px-5 sm:w-auto justify-center cursor-pointer items-center space-x-2 rounded-md bg-light-primary text-light-white hover:bg-light-primary_hover transition-colors duration-200 ${importLoading || legacyImportLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
              {importLoading ? (
                <LucideLoader size={20} className="animate-spin" />
              ) : (
                <LucideUpload size={20} />
              )}
              <span className="font-roboto">
                {importLoading ? "Importing..." : "Import"}
              </span>
            </label>
          </div>

          <div className="relative w-full xl:w-auto">
            <input
              type="file"
              accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleLegacyImport}
              className="hidden"
              id="legacy-import-file"
              disabled={importLoading || legacyImportLoading}
            />
            <label
              htmlFor="legacy-import-file"
              className={`flex w-full py-2.5 px-5 sm:w-auto justify-center cursor-pointer items-center space-x-2 rounded-md bg-light-primary text-light-white hover:bg-light-primary_hover transition-colors duration-200 ${
                importLoading || legacyImportLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {legacyImportLoading ? (
                <LucideLoader size={20} className="animate-spin" />
              ) : (
                <LucideUpload size={20} />
              )}
              <span className="font-roboto">
                {legacyImportLoading ? "Importing..." : "Old Import"}
              </span>
            </label>
          </div>
          <Button
            variant="secondary"
            size="medium"
            disabled={isPrintingLastUploadQr || importLoading || legacyImportLoading}
            icon={
              isPrintingLastUploadQr ? (
                <LucideLoader size={20} className="animate-spin" />
              ) : (
                <LucidePrinter size={20} />
              )
            }
            label={isPrintingLastUploadQr ? 'Generating...' : 'Last Upload File QR Code'}
            onClick={handlePrintLastUploadQrCodes}
            className="flex w-full xl:w-auto items-center justify-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 max-sm:w-full max-sm:justify-center"
          />
          <div className="relative shrink-0" ref={exportMenuRef}>
            <Button
              variant="secondary"
              size="medium"
              disabled={exportLoading}
              icon={
                exportLoading ? (
                  <LucideLoader size={20} className="animate-spin" />
                ) : (
                  <LucideDownload size={20} />
                )
              }
              afterIcon={
                !exportLoading ? <LucideChevronDown size={16} /> : null
              }
              label={exportLoading ? "Exporting..." : "Export"}
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="flex w-full xl:w-auto justify-center items-center space-x-2 shadow-none font-normal !rounded-md px-4 py-2 text-light-white transition-colors duration-200 focus:ring-0 max-sm:justify-center"
            />
            {showExportMenu && !exportLoading && (
              <div className="absolute right-0 top-full z-[100] mt-1 min-w-[11rem] overflow-hidden rounded-lg border border-light-natural_200 bg-light-white py-1 shadow-lg">
                <button
                  type="button"
                  className="block w-full px-4 py-2.5 text-left text-sm font-medium text-light-natural_700 hover:bg-light-natural_50"
                  onClick={() => handleExport("excel")}
                >
                  Excel
                </button>
                <button
                  type="button"
                  className="block w-full px-4 py-2.5 text-left text-sm font-medium text-light-natural_700 hover:bg-light-natural_50"
                  onClick={() => handleExport("pdf")}
                >
                  PDF
                </button>
                <button
                  type="button"
                  className="block w-full border-t border-light-natural_100 px-4 py-2.5 text-left text-sm font-medium text-light-natural_700 hover:bg-light-natural_50"
                  onClick={() => handleExport("whatsapp")}
                >
                  WhatsApp Share
                </button>
              </div>
            )}
          </div>
          <Button
            variant="primary"
            size="medium"
            icon={showFilters ? <LucideFilter size={20} className="rotate-180 transition-transform duration-200 text-white" /> : <LucideFilter size={20} className="text-white" />}
            label={showFilters ? "Close" : "Filter"}
            onClick={() => setShowFilters(prev => !prev)}
            className={`flex w-full xl:w-auto justify-center items-center space-x-2 shadow-none font-normal !rounded-md px-4 py-2 transition-colors duration-200 max-sm:justify-center ${
              showFilters 
                ? "bg-red-500 !text-white hover:bg-red-600 border-red-500" 
                : "bg-light-primary !text-white hover:bg-light-primary_hover border-light-primary"
            }`}
          />
        </div>
      </div>

      {/* Horizontal Filter Section */}
      {showFilters && (
        <div className="py-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* First Row: Status, D No, Size, Color */}
        <div className="flex flex-wrap items-center gap-4">
            {/* Filter by Status */}
          <div className="flex-1 min-w-[180px]">
            <SelectElement
                key="status-filter"
                options={statusOptions}
                value={tempSelectedStatus || null}
                onChange={(val) => setTempSelectedStatus(val || '')}
                placeholder="Select Status"
              isClearable={true}
              className="w-full"
              menuPortalTarget={document.body}
              />
            </div>

            {/* Filter by D No */}
            <div className="flex-1 min-w-[180px]">
              <SelectElement
                options={dNoOptions}
                value={tempSelectedDNo || null}
                onChange={(val) => setTempSelectedDNo(val || '')}
                placeholder="D No"
                isClearable={true}
                className="w-full"
                menuPortalTarget={document.body}
            />
          </div>

          {/* Filter by Size */}
          <div className="flex-1 min-w-[180px]">
            <SelectElement
              options={sizes?.map(size => ({ value: size, label: size })) || []}
                value={tempSelectedSize || null}
                onChange={(val) => setTempSelectedSize(val || '')}
                placeholder="Select Size"
              isClearable={true}
              className="w-full"
              menuPortalTarget={document.body}
            />
          </div>

            {/* Filter by Color */}
          <div className="flex-1 min-w-[180px]">
            <SelectElement
                options={colors?.map(color => ({ value: color, label: color })) || []}
                value={tempSelectedColor || null}
                onChange={(val) => setTempSelectedColor(val || '')}
                placeholder="Select Color"
                isClearable={true}
              className="w-full"
              menuPortalTarget={document.body}
            />
          </div>
          </div>

          {/* Second Row: Date Range, Employee, Apply, Clear */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Range Picker */}
            <div className="flex-1 min-w-[300px] relative custom-datepicker-wrapper" style={{ zIndex: 100 }}>
              <DatePicker
                selectsRange={true}
                startDate={tempDateRange.startDate ? parseISO(tempDateRange.startDate) : null}
                endDate={tempDateRange.endDate ? parseISO(tempDateRange.endDate) : null}
                onChange={(update) => {
                  const [start, end] = update;
                  setTempDateRange({
                    startDate: start ? format(start, 'yyyy-MM-dd') : '',
                    endDate: end ? format(end, 'yyyy-MM-dd') : ''
                  });
                }}
                isClearable={true}
                placeholderText="Select Date Range (From - To)"
                className="w-full px-4 py-3 rounded-md transition-all duration-200 focus:outline-none border border-[#CFC5B9] focus:ring-2 bg-[#F9F6F1] text-[#0B1C30] placeholder-[#7D766C] focus:ring-[rgba(125,118,108,0.35)] focus:border-[#7D766C]"
                dateFormat="dd/MM/yyyy"
                popperClassName="datepicker-popper-high-z"
              />
            </div>

            {/* Filter by Employee */}
            <div className="flex-1 min-w-[180px]">
              <SelectElement
                options={employeeOptions}
                value={tempSelectedEmployeeId || null}
                onChange={(val) => setTempSelectedEmployeeId(val || '')}
                placeholder="Select Employee"
                isClearable={true}
                className="w-full"
                menuPortalTarget={document.body}
              />
            </div>

            {/* Apply Button */}
            <div className="flex-shrink-0">
              <Button
                variant="primary"
                size="medium"
                label="Apply"
                onClick={handleApplyFilters}
                className="shadow-none font-normal !rounded-md px-4 py-2 text-light-white transition-colors duration-200 focus:ring-0"
              />
            </div>

          {/* Clear Button */}
          <div className="flex-shrink-0">
            <Button
              variant="outline"
              size="medium"
              label="Clear"
              onClick={handleClearFilters}
              className="text-light-natural_700 hover:bg-light-natural_50"
            />
        </div>
      </div>

          {/* Search Field Inside Filters */}
          <div className="w-full pt-2">
        <InputElement
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          variant="size_44"
          className="w-full"
          is_required={true}
          extra_text_before={
            searchLoading && debouncedSearchQuery !== searchQuery ? (
              <LucideLoader
                size={20}
                className="text-light-primary animate-spin"
              />
            ) : (
              <LucideSearch size={20} className="text-light-lightGrey" />
            )
          }
        />
      </div>
        </div>
      )}
      {selectedItemIds.length > 0 && showSelectInTable && (
        <>
          <div className="flex items-center justify-between pb-4">
            <span className="text-sm text-light-darkGrey font-roboto font-semibold">
              {selectedItemIds.length} item{selectedItemIds.length > 1 ? "s" : ""}{" "}
              selected
            </span>
            <Button
              variant="primary"
              size="medium"
              label={isPrinting ? "Generating..." : "Print"}
              onClick={handlePrintSelected}
              disabled={isPrinting}
              icon={isPrinting ? <LucideLoader size={20} className="animate-spin" /> : null}
              className="shadow-none font-normal !rounded-md px-4 py-2 text-light-white transition-colors duration-200 focus:ring-0"
            />
          </div>
        </>
      )}

      <div className="w-full">
        <CommonTable
          columns={columns}
          data={dashboardData.records}
          loading={loading && !dashboardData.records?.length}
          count={dashboardData.pagination.total}
          page={currentPage - 1}
          rowsPerPage={currentLimit}
          onPageChange={handlePageChangeForTable}
          onRowsPerPageChange={handleRowsPerPageChangeForTable}
          rowsPerPageOptions={[25, 50, 75, 100, 150]}
          emptyDataMessage={
            searchQuery
              ? "No items found matching your search."
              : "No items available."
          }
          selectableRows={showSelectInTable ? true : false}
          selectedItems={selectedItemIds}
          onSelectedRowsChange={handleSelectedRowsChange}
          uniqueRowIdentifier="_id"
          stripePrimary={true}
          getRowAccentClassName={(row) => {
            const status = lowercase(row.currentStatus || row.status || "");
            if (status === "done" || status === "complete") {
              return "relative before:absolute before:inset-y-0 before:left-0 before:w-2 before:rounded-l-[3px] before:border-l-4 before:border-[#4E8F5B] before:content-['']";
            }
            if (status === "billscan") {
              return "relative before:absolute before:inset-y-0 before:left-0 before:w-2 before:rounded-l-[3px] before:border-l-4 before:border-[#B45309] before:content-['']";
            }
            return "";
          }}
        />
      </div>
    </div>
  );
};

export default Lots;