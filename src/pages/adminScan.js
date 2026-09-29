import React, { useState, useEffect, useRef } from "react";
import { LucideQrCode, LucideScan, LucideMonitor, LucideCamera, LucideSearch } from 'lucide-react';
import MobileCameraModal from '../component/common/MobileCameraModal';
import { ToastContainer, toast } from 'react-toastify';
import { playSuccessBeep } from '../utils/soundUtils';
import Modal from '../component/common/Modal';
import { getProcesses, createDoraCutProcess, multipleDoraCutProcess, createBillScan, createGenericScanProcess, createMultipleBillScan } from '../apis/processApi';
import CheckingQrDetailsModal from '../component/common/CheckingQrDetailsModal';
import QrReader from '../component/common/QrReader';
import PressQrDetailsModal from '../component/common/PressQrDetailsModal';
import GenericScanQrDetailsModal from '../component/common/GenericScanQrDetailsModal';
import MachineScanQrDetailsModal from '../component/common/MachineScanQrDetailsModal';
import PackingQrDetailsModal from '../component/common/PackingQrDetailsModal';
import LogoQrDetailsModal from '../component/common/LogoQrDetailsModal';
import DoraCutQrDetailsModal from '../component/common/DoraCutQrDetailsModal';
import ProcessQrDetailsModal from '../component/common/ProcessQrDetailsModal';
import BillScanQrDetailsModal from '../component/common/BillScanQrDetailsModal';
import BarcodeScannerModal from '../component/common/BarcodeScannerModal';
import MultipleDoraCutQrScanModal from '../component/common/MultipleDoraCutQrScanModal';
import MultipleBillScanQrDetailsModal from '../component/common/MultipleBillScanQrDetailsModal';
import LoaderComponent from '../component/common/Loader';
import { getDesignByNumber } from '../apis/designApi';
import { getDashboardById } from '../apis/dashboardApi';
import {
  filterVisibleScanProcesses,
  isHiddenScanProcess,
  validateLotForSelectedScanProcess,
  resolveDashboardLotRecord,
  resolveLotDesignNumber,
  extractRcDetailsFromLotStatus,
  buildGenericScanPayload,
  resolveSelectedProcessName,
} from '../helpers/utils';
import { getScanProcessStyle } from '../helpers/scanProcessIcons';
import Button from "../component/common/Button";
import InputElement from "../component/common/InputElement";
import usePageTitle from "../hooks/usePageTitle";
import { fetchWithScanCache } from "../helpers/scanFetchCache";

// Helper to ensure success toasts show only once instantly
const showSuccessToast = (toastId, message) => {
  if (!toast.isActive(toastId)) {
    toast.success(message, { toastId });
  }
  playSuccessBeep();
};

const showErrorToast = (toastId, message) => {
  if (toast.isActive(toastId)) {
    toast.dismiss(toastId);
  }
  toast.error(message, { toastId });
};

const isLikelyLotNo = (value) => {
  if (typeof value !== 'string') return false;
  const cleaned = value.trim();
  if (cleaned.length < 4 || cleaned.length > 30) return false;
  return /^[A-Za-z0-9][A-Za-z0-9-_\/]*$/.test(cleaned);
};


const AdminScan = () => {
  const [recentScans, setRecentScans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProcesses, setFilteredProcesses] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  // console.log(selectedProcess, "selectedProcess")
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processes, setProcesses] = useState([]);
  const [loadingProcesses, setLoadingProcesses] = useState(true);
  const [processError, setProcessError] = useState(null);
  const [isMobileCameraOpen, setIsMobileCameraOpen] = useState(false);
  const [isUserViewOpen, setIsUserViewOpen] = useState(false);
  const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
  const [threadFields, setThreadFields] = useState({});
  // console.log("🚀 ~ AdminScan ~ threadFields:", threadFields)
  const scanGuardRef = useRef({ key: null, ts: 0 });
  const scanInFlightRef = useRef(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentForThreadEmployeeId, setCurrentForThreadEmployeeId] = useState(null);
  const [openModalType, setOpenModalType] = useState(null);
  const [selectedDashboardData, setSelectedDashboardData] = useState(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedLogoId, setSelectedLogoId] = useState('');
  const [currentDesign, setCurrentDesign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [singleMultipleFields, setSingleMultipleFields] = useState({
    lotNo: '123456',
    dNo: 'Y-101',
    pic: '36',
    size: 'M',
    color: 'Black',
    selection: '',
  });
  const [isMultipleBillScanModalOpen, setIsMultipleBillScanModalOpen] = useState(false);
  const [multipleDoraCutQrScanLoading, setMultipleDoraCutQrScanLoading] = useState(false);
  const [multipleDoraCutQrScanValue, setMultipleDoraCutQrScanValue] = useState('');
  const [multipleQrScanResults, setMultipleQrScanResults] = useState([]);
  const [nextDesigneProcess, setNextDesigneProcess] = useState({});
  const [isMultipleQrScanModalOpen, setIsMultipleQrScanModalOpen] = useState(false);
  const [isDoracutScanned, setIsDoracutScanned] = useState(false);
  const [rcDetails, setRcDetails] = useState({
    rcPic: 0,
    alter: 0,
    reject: 0,
  });


  usePageTitle('Admin Scan');
  let parsed = {};
  if (threadFields && typeof threadFields.barcodeValue === 'string') {
    try {
      parsed = JSON.parse(threadFields.barcodeValue);
    } catch (e) {
      parsed = {};
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProcesses(processes);
    } else {
      const filtered = processes.filter(process => {
        return process.processName?.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredProcesses(filtered);
    }
  }, [processes, searchQuery]);

  useEffect(() => {
    return () => {   // runs when navigating away
      localStorage.removeItem("selectedProcess");
    };
  }, []);


  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };

    checkMobile();

    const savedScans = localStorage.getItem('recentScans');
    if (savedScans) {
      try {
        setRecentScans(JSON.parse(savedScans));
      } catch (error) {
        console.error('Error loading recent scans:', error);
      }
    }

    // Load selected process from localStorage if available
    const savedProcess = localStorage.getItem('selectedProcess');
    if (savedProcess) {
      try {
        setSelectedProcess(JSON.parse(savedProcess));
      } catch (error) {
        console.error('Error loading selected process:', error);
      }
    }

    const fetchProcesses = async () => {
      setLoadingProcesses(true);
      setProcessError(null);
      try {
        const response = await getProcesses();
        const allProcesses = response?.data || response;
        setProcesses(filterVisibleScanProcesses(allProcesses));
      } catch (err) {
        setProcessError('Failed to load processes');
      } finally {
        setLoadingProcesses(false);
      }
    };
    fetchProcesses();
  }, []);

  const handleScanComplete = async (scanResult) => {
    // console.log(scanResult, "scanResultscanResultscanResult");
    const scanTime = new Date().toISOString();

    let parsedScan = {};
    let qrId = null;
    let lotNoFromQr = null;
    const raw = typeof scanResult.barcodeValue === 'string' ? scanResult.barcodeValue.trim() : '';

    if (raw) {
      try {
        parsedScan = JSON.parse(raw);
      } catch {
        parsedScan = {};
      }
      qrId = parsedScan?.id || parsedScan?._id || (raw && /^[a-f0-9]{24}$/i.test(raw) ? raw : null);
      lotNoFromQr = parsedScan?.lotNo || parsedScan?.lotno || parsedScan?.LotNo || null;
      if (!lotNoFromQr && !qrId && isLikelyLotNo(raw)) {
        lotNoFromQr = raw;
      }
    }

    // Guard: prevent duplicate scans / double API calls
    const guardKey = String(qrId || lotNoFromQr || raw || '').trim();
    if (guardKey) {
      const now = Date.now();
      if (scanGuardRef.current.key === guardKey && now - scanGuardRef.current.ts < 3000) {
        return;
      }
      scanGuardRef.current = { key: guardKey, ts: now };
    }

    if (scanInFlightRef.current) {
      return;
    }
    scanInFlightRef.current = true;

    let design;
    let resolvedRcDetails = { rcPic: 0, alter: 0, reject: 0 };
    let lotStatusData = {};
    try {
      if (!lotNoFromQr && !qrId) {
        showErrorToast('lotno-error', 'Lot No not found in scan.');
        return;
      }

      const lookupKey = qrId || lotNoFromQr;
      const dashRes = await fetchWithScanCache(`dashboard:${lookupKey}`, () =>
        getDashboardById(lookupKey)
      );
      const dashboardRecord = resolveDashboardLotRecord(dashRes);
      if (!dashboardRecord) {
        throw new Error('Lot not found');
      }

      parsedScan = {
        ...parsedScan,
        ...dashboardRecord,
        id: dashboardRecord?._id || parsedScan?.id || qrId || lookupKey,
      };
      lotNoFromQr = dashboardRecord?.lotNo || lotNoFromQr;
      lotStatusData = dashboardRecord;

      const resolvedDNo = resolveLotDesignNumber(lotStatusData, parsedScan?.dNo);
      if (!resolvedDNo) {
        throw new Error('Design number not found');
      }

      resolvedRcDetails = extractRcDetailsFromLotStatus(lotStatusData);
      setRcDetails(resolvedRcDetails);
      design = await fetchWithScanCache(`design:${resolvedDNo}`, () =>
        getDesignByNumber(resolvedDNo)
      );
      setCurrentDesign(design?.data);
    } catch (error) {
      showErrorToast('design-error', 'Design not found for Lot No: ' + lotNoFromQr);
      return;
    } finally {
      scanInFlightRef.current = false;
    }
    if (!design?.data) {
      showErrorToast('design-error', 'Design not found for Lot No: ' + lotNoFromQr);
      return;
    }

    let modalType = null;
    let allowScan = false;
    // console.log(design.data, "barcodeDatabarcodeDatabarcodeData");
    // console.log(selectedProcess,"asdasdasdsadsadasdsaddasdsadada")
    
    // Check if process is selected
    if (!selectedProcess) {
      console.log("No process selected, showing error toast");
      // Show toast first, then close modal
      toast.error("Please select a process first!", {
        toastId: `process-not-selected-${Date.now()}-${Math.random()}`,
        autoClose: 5000,
        position: "top-right",
        closeOnClick: true,
        pauseOnHover: true,
        style: {
          zIndex: 999999,
        },
      });
      // Close modal after a short delay
      setTimeout(() => {
        setIsProcessModalOpen(false);
      }, 100);
      return;
    }

    if (
      lotStatusData?.status == 'loading' &&
      (!lotStatusData?.currentStatus || String(lotStatusData.currentStatus).toLowerCase() === 'loading')
    ) {
      modalType = 'machine';
      // console.log(modalType, "modalType");
      allowScan = true;
      const processes = (design?.data?.processes || [])
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .filter((proc) => !isHiddenScanProcess(proc.processName));
      setNextDesigneProcess(processes[0]?.processName.toLowerCase());
    }
    else {
      const validation = validateLotForSelectedScanProcess({
        lotStatusData,
        designData: design?.data,
        // Always base processName — never "… Single"/"… Multiple" display labels
        selectedProcessName: selectedProcess?.processName || '',
        doracutMode:
          selectedProcess?.doracutMode || selectedProcess?.sendReceiveMode || null,
      });

      if (!validation.allowed) {
        toast.error(validation.errorMessage, {
          toastId: `status-error-${Date.now()}-${Math.random()}`,
          autoClose: 5000,
          position: "top-right",
          closeOnClick: true,
          pauseOnHover: true,
          style: {
            zIndex: 999999,
          },
        });

        setTimeout(() => {
          setIsProcessModalOpen(false);
          setIsUserViewOpen(false);
        }, 100);
        return;
      }

      modalType = validation.modalType;
      allowScan = true;
      setNextDesigneProcess(validation.nextDesigneProcess);
    }

    if (!allowScan) return;

    // Close scanner modal before opening process-specific modal
    // to avoid stuck overlay state.
    const resolvedScanFields = {
      ...parsedScan,
      ...lotStatusData,
      ...scanResult,
      id: lotStatusData?._id || parsedScan?.id || '',
      lotNo:
        lotNoFromQr ||
        lotStatusData?.lotNo ||
        parsedScan?.lotNo ||
        parsedScan?.lotno ||
        parsedScan?.LotNo ||
        scanResult?.lotNo ||
        '',
      dNo: resolveLotDesignNumber(lotStatusData, parsedScan?.dNo || scanResult?.dNo),
      pic: lotStatusData?.pic || parsedScan?.pic || scanResult?.pic || '',
      size: lotStatusData?.size || parsedScan?.size || scanResult?.size || '',
      colour:
        lotStatusData?.colour ||
        lotStatusData?.color ||
        parsedScan?.colour ||
        parsedScan?.color ||
        scanResult?.colour ||
        scanResult?.color ||
        '',
      rcPic: '',
      alter: '',
      reject: '',
      rcDetails: resolvedRcDetails,
      process: selectedProcess?.processName || '',
      process_id: selectedProcess?._id || '',
      scanTime,
    };

    setIsProcessModalOpen(false);
    setOpenModalType(modalType);
    setThreadFields(resolvedScanFields);

    // If it's doracut process, also set the singleMultipleFields
    if (modalType === 'doracut') {
      setSingleMultipleFields(prev => ({
        lotNo: resolvedScanFields?.lotNo || '123456',
        dNo: resolvedScanFields?.dNo || 'Y-101',
        pic: parsedScan?.pic || scanResult?.pic || '36',
        size: parsedScan?.size || scanResult?.size || 'M',
        color: parsedScan?.colour || parsedScan?.color || scanResult?.colour || scanResult?.color || 'Black',
        selection: prev?.selection || '',
      }));
      setIsDoracutScanned(true);
    }

    setSelectedEmployee(null);

    const newScan = {
      id: Date.now(),
      timestamp: scanTime,
      barcodeValue: scanResult,
      status: scanResult.status,
      success: scanResult.success
    };
    const updatedScans = [newScan, ...recentScans.slice(0, 9)];
    setRecentScans(updatedScans);
    localStorage.setItem('recentScans', JSON.stringify(updatedScans));
    showSuccessToast('qr-scan-success', 'QR code scanned successfully!');
  };

  const openMobileCamera = () => {
    setIsMobileCameraOpen(true);
  };


  // const handleSingleMultipleFieldChange = (field, value) => {
  //   console.log('handleSingleMultipleFieldChange called:', field, value);
  //   setSingleMultipleFields(prev => {
  //     const newState = { ...prev, [field]: value };
  //     console.log('New singleMultipleFields state:', newState);
  //     return newState;
  //   });
  // };
  // const handleSingleMultipleSubmit = () => {
  //   setSingleMultipleLoading(true);
  //   setTimeout(() => {
  //     setSingleMultipleLoading(false);
  //     handleCloseSingleMultipleModal();

  //     // Check if this is for doracut flow
  //     if (openModalType === 'doracut') {
  //       // The modal will be shown based on the selection in the conditional rendering
  //       // No need to manually open modals here
  //     } else {
  //       toast.success('Single/Multiple selection submitted!');
  //     }
  //   }, 1000);
  // };

  const handleCloseMultipleDoraCutQrScanModal = () => {
    setMultipleDoraCutQrScanValue('');
    setMultipleQrScanResults([]);
    setMultipleDoraCutQrScanLoading(false);
    setOpenModalType(null);
    setSingleMultipleFields((prev) => ({ ...prev, selection: '' }));
    setIsDoracutScanned(false);
    setIsProcessModalOpen(false);
  };

  const handleMultipleDoraCutQrScanChange = (value) => {
    setMultipleDoraCutQrScanValue(value);
  };

  // In scan.js or adminScan.js

  const handleOpenMultipleQrScanModal = () => {
    setMultipleQrScanResults([]);
    setOpenModalType('multiple');
    setSingleMultipleFields(prev => ({ ...prev, selection: 'multiple' }));
  };

  const handleMultipleDoraCutQrScanSubmit = async (payload) => {
    console.log(payload, "payloadpayload");

    setMultipleDoraCutQrScanLoading(true);
    try {
      const scannedResults = payload.scannedResults || multipleQrScanResults;

      // Fetch design and price for each lot
      const doracutPayloadArray = await Promise.all(
        scannedResults.map(async (scannedData) => {
          let parsedScannedData = scannedData;
          if (typeof scannedData === 'string') {
            try {
              parsedScannedData = JSON.parse(scannedData);
            } catch (e) {
              parsedScannedData = { dNo: scannedData, rawData: scannedData };
            }
          }

          const dNo = parsedScannedData.dNo || parsed?.dNo;
          const lotNo = parsedScannedData.lotNo || parsed?.lotNo;
          let lotPrice = 0;
          let lotRcDetails = { rcPic: 0, alter: 0, reject: 0 };

          lotRcDetails = extractRcDetailsFromLotStatus(parsedScannedData);

          if (dNo) {
            try {
              const design = await fetchWithScanCache(`design:${dNo}`, () =>
                getDesignByNumber(dNo)
              );

              if (design?.data) {
                const process = design.data.processes?.find(
                  p => p.processName?.toLowerCase() === selectedProcess?.processName?.toLowerCase()
                );
                if (payload?.actionStatus === 'RECEIVE') {
                  lotPrice = process?.multiRate || process?.multiPrice || 0;
                } else if (payload?.actionStatus === 'SEND') {
                  lotPrice = process?.multiRate || process?.multiPrice || process?.price || 0;
                } else {
                  lotPrice = process?.price || 0;
                }
              }
            } catch (error) {
              console.error(`Error fetching design for lot ${lotNo}:`, error);
              const process = currentDesign?.processes?.find(
                p => p.processName?.toLowerCase() === selectedProcess?.processName?.toLowerCase()
              );
              if (payload?.actionStatus === 'RECEIVE') {
                lotPrice = process?.multiRate || process?.multiPrice || 0;
              } else if (payload?.actionStatus === 'SEND') {
                lotPrice = process?.multiRate || process?.multiPrice || process?.price || 0;
              } else {
                lotPrice = process?.price || 0;
              }
            }
          }

          return {
            lotNo,
            dNo,
            totalPic: parsedScannedData.pic || parsed?.pic,
            pic: parsedScannedData.pic || parsed?.pic,
            rcPic: lotRcDetails.rcPic,
            alter: lotRcDetails.alter,
            reject: lotRcDetails.reject,
            size: parsedScannedData.size || parsed?.size,
            color: parsedScannedData.color || parsedScannedData.colour || parsed?.colour,
            doracut: payload.doracut,
            status: payload.actionStatus,
            processId: selectedProcess?._id || threadFields.process_id || '',
            dashboardDataId: parsedScannedData.dashboardDataId || parsed?.id,
                price: lotPrice,
                scannedByName: (function () {
                  try {
                    const raw = localStorage.getItem('user');
                    if (!raw) return '';
                    const user = JSON.parse(raw);
                    const fromData = user?.data?.username || user?.data?.name || '';
                    const fromNames = [user?.firstName || user?.given_name, user?.lastName || user?.family_name]
                      .filter(Boolean).join(' ').trim();
                    const nickname = user?.nickname || user?.preferred_username || '';
                    const simpleName = user?.name || '';
                    return (fromData || fromNames || nickname || simpleName || '').trim();
                  } catch (e) { return ''; }
                })(),
          };
        })
      );


      const multiPayloadArray = doracutPayloadArray.map((item) => ({
        ...item,
        processName: selectedProcess?.processName,
        employeeId: payload.doracut,
        sendReceiveMode: selectedProcess?.sendReceiveMode || 'multiple',
        hasSendReceive: !!selectedProcess?.hasSendReceive,
        scanPhase:
          payload.actionStatus === 'SEND'
            ? 'send'
            : payload.actionStatus === 'RECEIVE'
              ? 'receive'
              : 'single',
        doracutstatus:
          payload.actionStatus === 'SEND'
            ? 'send'
            : payload.actionStatus === 'RECEIVE'
              ? 'receive'
              : 'single',
        // Help BE set lot status / currentStatus like Doracut Send / Received
        actionStatus: payload.actionStatus,
      }));

      const isSendReceiveGeneric =
        !!selectedProcess?.hasSendReceive &&
        !String(selectedProcess?.processName || '')
          .toLowerCase()
          .includes('doracut');

      if (isSendReceiveGeneric) {
        const results = await Promise.allSettled(
          multiPayloadArray.map((row) => createGenericScanProcess(row))
        );
        const failed = results.filter((r) => r.status === 'rejected');
        failed.forEach((r, index) => {
          setTimeout(() => {
            toast.error(r.reason?.message || 'Failed to scan lot', {
              toastId: `send-receive-error-${Date.now()}-${index}`,
            });
          }, index * 200);
        });
        const okCount = results.length - failed.length;
        setMultipleDoraCutQrScanLoading(false);
        handleCloseMultipleDoraCutQrScanModal();
        if (okCount > 0) {
          showSuccessToast(
            'send-receive-multiple-success',
            `${selectedProcess.processName} scanned for ${okCount} lot(s)!`
          );
        }
        return;
      }

      const multiDoracut = await multipleDoraCutProcess(doracutPayloadArray);
      
      // Check for errors in response and show them
      if (multiDoracut?.errors && multiDoracut.errors.length > 0) {
        // Show error messages for each error
        multiDoracut.errors.forEach((errorObj, index) => {
          const errorMessage = errorObj.error || "Error processing this lot";
          const lotNo = errorObj.data?.lotNo || "Unknown";
          setTimeout(() => {
            toast.error(`${lotNo}: ${errorMessage}`, {
              toastId: `doracut-error-${Date.now()}-${index}`,
              autoClose: 5000,
              position: "top-right",
            });
          }, index * 200); // Stagger error messages
        });
      }
      
      // Check if any processes were created successfully
      const hasCreated = multiDoracut?.created && multiDoracut.created.length > 0;
      const hasErrors = multiDoracut?.errors && multiDoracut.errors.length > 0;

      if (hasCreated || !hasErrors) {
        setMultipleDoraCutQrScanLoading(false);
        handleCloseMultipleDoraCutQrScanModal();
        showSuccessToast('doracut-multiple-process-created-success', `Multiple DoraCut ${payload.actionStatus} process created successfully!`);
      } else {
        setMultipleDoraCutQrScanLoading(false);
        handleCloseMultipleDoraCutQrScanModal();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create multiple doraCut process', { toastId: 'process-cretaed-error' });
      setMultipleDoraCutQrScanLoading(false);
    }
  };

  const handleMultipleBillScanSubmit = async (payload) => {
    if (loading) return;
    setLoading(true);
    try {
      const augmented = {
        ...payload,
        scans: (payload.scans || []).map((scan) => ({
          ...scan,
          scannedByName: (function () {
            try {
              const raw = localStorage.getItem('user');
              if (!raw) return '';
              const user = JSON.parse(raw);
              const fromData = user?.data?.username || user?.data?.name || '';
              const fromNames = [user?.firstName || user?.given_name, user?.lastName || user?.family_name]
                .filter(Boolean).join(' ').trim();
              const nickname = user?.nickname || user?.preferred_username || '';
              const simpleName = user?.name || '';
              return (fromData || fromNames || nickname || simpleName || '').trim();
            } catch (e) { return ''; }
          })(),
        })),
      };
      const res = await createMultipleBillScan(augmented);

      if (res.status === 'success') {
        setIsMultipleBillScanModalOpen(false);
        setIsProcessModalOpen(false);
        setOpenModalType(null);
        showSuccessToast('multiple-billscan-success', 'Multiple bill scans processed successfully!');
      }
    } catch (error) {
      console.error("Multiple bill scan error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQrScan = (data) => {
    console.log(data, "datadatadatadatadata")
    if (data && !multipleQrScanResults.includes(data)) {
      setMultipleQrScanResults(prev => [...prev, data]);
    }
  };
  const handleCloseMultipleQrScanModal = () => {
    setIsMultipleQrScanModalOpen(false);
  };

  const displayProcesses = filteredProcesses.flatMap((process) => {
    const name = String(process?.processName || '').trim();
    const lower = name.toLowerCase();

    if (lower === 'doracut' || lower.includes('doracut')) {
      return [
        { ...process, displayName: 'Doracut Single', doracutMode: 'single', sendReceiveMode: null },
        { ...process, displayName: 'Doracut Multiple', doracutMode: 'multiple', sendReceiveMode: null },
      ];
    }

    if (process?.hasSendReceive) {
      return [
        { ...process, displayName: `${name} Single`, doracutMode: null, sendReceiveMode: 'single' },
        { ...process, displayName: `${name} Multiple`, doracutMode: null, sendReceiveMode: 'multiple' },
      ];
    }

    return [{ ...process, displayName: name, doracutMode: null, sendReceiveMode: null }];
  });

  return (
    <div className="space-y-6">
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
        style={{ zIndex: 200001 }}
      />
      <div className="flex items-center justify-between !mt-0">
        <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default">
          QR Code Scanner
        </h1>
      </div>

      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex-grow w-full max-w-md">
          <InputElement
            type="text"
            placeholder="Search processes..."
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            variant="solid"
            className="w-full"
            is_required={false}
            extra_text_before={
              <LucideSearch size={20} className="text-light-lightGrey" />
            }
          />
        </div>
      </div>
      {loadingProcesses ? (
        <div className="flex items-center justify-center py-12">
          <LoaderComponent size={56} />
        </div>
      ) : processError ? (
        <div className="text-red-500 p-4">{processError}</div>
      ) : displayProcesses.length === 0 ? (
        <div className="text-gray-500 p-4">
          {searchQuery ? `No processes found matching "${searchQuery}"` : "No User process available"}
        </div>
      ) : (
        <div className="space-y-4 mb-6">

          <div className="flex flex-col space-y-4">
            {displayProcesses.map((process) => {
              const config = getScanProcessStyle(
                process.processName,
                process.displayName
              );
              const IconComponent = config.icon;
              return (
                <div
                  key={process.doracutMode || process.sendReceiveMode ? `${process._id}-${process.doracutMode || process.sendReceiveMode}` : process._id}
                  className={`${config.bgColor} rounded-xl p-4 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-white/20}`}
                  onClick={() => {
                    setSelectedProcess(process);
                    if (process?.doracutMode === 'single') {
                      setSingleMultipleFields(prev => ({ ...prev, selection: 'single' }));
                      setOpenModalType('doracut');
                      setIsDoracutScanned(false);
                      setIsProcessModalOpen(false);
                      setTimeout(() => {
                        setIsUserViewOpen(true);
                      }, 150);
                    } else if (process?.doracutMode === 'multiple') {
                      setSingleMultipleFields(prev => ({ ...prev, selection: 'multiple' }));
                      setOpenModalType('doracut');
                      setIsDoracutScanned(true);
                      setIsProcessModalOpen(false);
                    } else if (process?.sendReceiveMode === 'single') {
                      setIsProcessModalOpen(true);
                    } else if (process?.sendReceiveMode === 'multiple') {
                      setSingleMultipleFields(prev => ({ ...prev, selection: 'multiple' }));
                      setOpenModalType('sendReceive');
                      setIsDoracutScanned(true);
                      setIsProcessModalOpen(false);
                    } else {
                      setIsProcessModalOpen(true);
                    }
                    localStorage.setItem(
                      "selectedProcess",
                      JSON.stringify(process)
                    );
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                        <IconComponent size={22} className={config.textColor} />
                      </div>
                      <span
                        className={`text-lg font-bold ${config.textColor} capitalize truncate`}
                      >
                        {process.displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${config.textColor} opacity-80`}>
                        Click to scan
                      </span>
                      <div className="flex-shrink-0">
                        <svg className={`w-5 h-5 ${config.textColor} opacity-60`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        title={selectedProcess ? selectedProcess.processName : ""}
        size="md"
      >
        <div className="p-6 flex flex-col items-center gap-5">
          <div className="w-full max-w-md">
            <QrReader
              onScan={(data) => {
                if (data) {
                  handleScanComplete({
                    barcodeValue: data,
                    status: "scanned",
                    success: true,
                  });
                  setIsUserViewOpen(false);
                }
              }}
            />
              </div>
            {selectedProcess?.processName?.toLowerCase() === "billscan" && (
            <button
              type="button"
              className="w-full max-w-md rounded-lg border border-light-natural_300 border-dashed px-4 py-3 text-sm font-semibold text-light-darkGrey hover:bg-light-natural_100 transition-colors"
                  onClick={() => {
                    setIsMultipleBillScanModalOpen(true);
                    setIsProcessModalOpen(false);
                  }}
                >
                    Multi Scan
            </button>
          )}
        </div>
      </Modal>
      {/* UserView Modal */}
      <Modal
        isOpen={isUserViewOpen}
        onClose={() => setIsUserViewOpen(false)}
        title="Scan QR Code"
        size="lg"
      >
        <div className="flex flex-col items-center gap-6">
          {/* <UserView /> */}
          <div className="w-full max-w-md">
            <QrReader
              onScan={(data) => {
                if (data) {
                  handleScanComplete({
                    barcodeValue: data,
                    status: "scanned",
                    success: true,
                  });
                  setIsUserViewOpen(false);
                }
              }}
            />
          </div>
        </div>
      </Modal>

      <MobileCameraModal
        isOpen={isMobileCameraOpen}
        onClose={() => setIsMobileCameraOpen(false)}
        onScanComplete={handleScanComplete}
        processId={selectedProcess?._id}
      />
      {(openModalType == 'thread' || openModalType === 'machine') && (
        <MachineScanQrDetailsModal
          isOpen={true}
          onClose={() => setOpenModalType(null)}
          isLoading={loading}
          designData={currentDesign}
          processName={resolveSelectedProcessName(selectedProcess, threadFields) || 'loading'}
          onSubmit={async (payload) => {
            setLoading(true);
            try {
              const primaryEmployeeId = payload.machineEmployees?.[0]?.employeeId || null;
              const scanPayload = buildGenericScanPayload({
                selectedProcess: selectedProcess || { processName: 'loading' },
                threadFields,
                parsed,
                payload,
                currentDesign,
              });
              if (!scanPayload.processName) {
                scanPayload.processName = 'loading';
              }

              await createGenericScanProcess(scanPayload);

              if (primaryEmployeeId) {
                setCurrentForThreadEmployeeId(primaryEmployeeId);
              }

              setLoading(false);
              setOpenModalType(null);
              setIsProcessModalOpen(false);
              showSuccessToast(
                'thread-process-created-success',
                `${scanPayload.processName} process created successfully!`
              );
            } catch (error) {
              toast.error(error.message || 'Failed to create process', { toastId: 'thread-process-error' });
              setLoading(false);
            }
          }}
          fields={threadFields}
          size="md"
        />
      )}
      {openModalType === 'checking' && (
        <CheckingQrDetailsModal
          isOpen={true}
          onClose={() => setOpenModalType(null)}
          isLoading={loading}
          onSubmit={async (payload) => {
            setLoading(true);
            try {
              const scanPayload = buildGenericScanPayload({
                selectedProcess,
                threadFields,
                parsed,
                payload: { ...payload, employeeId: payload.checking || payload.employeeId },
                currentDesign,
              });
              await createGenericScanProcess(scanPayload);
              setLoading(false);
              setOpenModalType(null);
              showSuccessToast('checking-process-created-success', 'Checking process created successfully!');
              setIsProcessModalOpen(false);
            } catch (error) {
              toast.error(error.message || 'Failed to create checking process', { toastId: 'checking-process-create-error' });
              setLoading(false);
            }
          }}
          fields={threadFields}
          onFieldChange={(field, value) => setThreadFields((prev) => ({ ...prev, [field]: value }))}
          size="md"
        />
      )}
      {openModalType === 'press' && (
        <PressQrDetailsModal
          isOpen={true}
          onClose={() => setOpenModalType(null)}
          isLoading={loading}
          onSubmit={async (payload) => {
            setLoading(true);
            try {
              const scanPayload = buildGenericScanPayload({
                selectedProcess,
                threadFields,
                parsed,
                payload: { ...payload, employeeId: payload.press || payload.employeeId },
                currentDesign,
              });
              await createGenericScanProcess(scanPayload);
              setLoading(false);
              setOpenModalType(null);
              showSuccessToast('press-process-created-success', 'Press process created successfully!');
              setIsProcessModalOpen(false);
            } catch (error) {
              toast.error(error.message || 'Failed to create press process', { toastId: 'press-cretaed-error' });
              setLoading(false);
            }
          }}
          fields={threadFields}
          onFieldChange={(field, value) => setThreadFields((prev) => ({ ...prev, [field]: value }))}
          size="md"
        />
      )}
      {openModalType === 'generic' && (
        <GenericScanQrDetailsModal
          isOpen={true}
          onClose={() => setOpenModalType(null)}
          isLoading={loading}
          processName={resolveSelectedProcessName(selectedProcess, threadFields)}
          onSubmit={async (payload) => {
            setLoading(true);
            try {
              const processName = resolveSelectedProcessName(selectedProcess, threadFields);
              const genericPayload = buildGenericScanPayload({
                selectedProcess,
                threadFields,
                parsed,
                payload,
                currentDesign,
              });
              await createGenericScanProcess(genericPayload);
              setLoading(false);
              setOpenModalType(null);
              showSuccessToast('generic-scan-process-created-success', `${processName} process created successfully!`);
              setIsProcessModalOpen(false);
            } catch (error) {
              toast.error(error.message || 'Failed to create scan process', { toastId: 'generic-scan-process-create-error' });
              setLoading(false);
            }
          }}
          fields={threadFields}
          onFieldChange={(field, value) => setThreadFields((prev) => ({ ...prev, [field]: value }))}
          size="md"
        />
      )}
      {openModalType === 'packing' && (
        <PackingQrDetailsModal
          isOpen={true}
          onClose={() => setOpenModalType(null)}
          isLoading={loading}
          onSubmit={async (payload) => {
            setLoading(true);
            try {
              const scanPayload = buildGenericScanPayload({
                selectedProcess,
                threadFields,
                parsed,
                payload: { ...payload, employeeId: payload.packing || payload.employeeId },
                currentDesign,
              });
              await createGenericScanProcess(scanPayload);
              setLoading(false);
              setOpenModalType(null);
              showSuccessToast('packing-process-created-success', 'Packing process created successfully!');
              setIsProcessModalOpen(false);
            } catch (error) {
              toast.error(error.message || 'Failed to create packing process', { toastId: 'paking-process-error' });
              setLoading(false);
            }
          }}
          fields={threadFields}
          onFieldChange={(field, value) => setThreadFields((prev) => ({ ...prev, [field]: value }))}
          size="md"
        />
      )}
      {openModalType === 'logo' && (
        <LogoQrDetailsModal
          isOpen={true}
          onClose={() => setOpenModalType(null)}
          isLoading={loading}
          onSubmit={async (payload) => {
            setLoading(true);
            try {
              const scanPayload = buildGenericScanPayload({
                selectedProcess,
                threadFields,
                parsed,
                payload: { ...payload, employeeId: payload.logo || payload.employeeId },
                currentDesign,
              });
              await createGenericScanProcess(scanPayload);
              setLoading(false);
              setOpenModalType(null);
              showSuccessToast('logo-process-created-success', 'Logo process created successfully!');
              setIsProcessModalOpen(false);
            } catch (error) {
              toast.error(error.message || 'Failed to create logo process', { toastId: 'logo-process-error' });
              setLoading(false);
            }
          }}
          fields={threadFields}
          onFieldChange={(field, value) => {
            setThreadFields((prev) => ({ ...prev, [field]: value }));
            if (field === 'logo') setSelectedLogoId(value);
          }}
          size="md"
        />
      )}
      {(openModalType === 'doracut' || openModalType === 'sendReceive') && (
        <>
          {openModalType === 'doracut' &&
            isDoracutScanned &&
            singleMultipleFields.selection === 'single' && (
            <DoraCutQrDetailsModal
              isOpen={true}
              onClose={() => {
                setOpenModalType(null);
                setSingleMultipleFields(prev => ({ ...prev, selection: '' }));
                setIsDoracutScanned(false);
              }}
              isLoading={loading}
              onSubmit={async (payload) => {
                console.log("payloadddddddd", payload)
                setLoading(true)
                try {
                  const processPrice = currentDesign?.processes?.find(
                    p => p.processName?.toLowerCase() === selectedProcess?.processName?.toLowerCase()
                  )?.price || 0;
                  console.log(processPrice, "processPrice")
                  const doracutPayload = {
                    lotNo: threadFields?.lotNo || parsed?.lotNo,
                    dNo: threadFields?.dNo || parsed?.dNo,
                    totalPic: threadFields?.pic || parsed?.pic,
                    pic: payload?.pic,
                    rcPic : payload?.rcPic,
                    alter: payload?.alter,
                    reject: payload?.reject,
                    size: threadFields?.size || parsed?.size,
                    color: threadFields?.colour || threadFields?.color || parsed?.colour,
                    doracut: payload.doracut,
                    doracutstatus: 'single',
                    doracutScanMode: 'single',
                    processId: selectedProcess?._id || threadFields.process_id || '',
                    dashboardDataId: threadFields?.id || parsed?.id,
                    price: processPrice,
                    scannedByName: (function () {
                      try {
                        const raw = localStorage.getItem('user');
                        if (!raw) return '';
                        const user = JSON.parse(raw);
                        const fromData = user?.data?.username || user?.data?.name || '';
                        const fromNames = [user?.firstName || user?.given_name, user?.lastName || user?.family_name]
                          .filter(Boolean).join(' ').trim();
                        const nickname = user?.nickname || user?.preferred_username || '';
                        const simpleName = user?.name || '';
                        return (fromData || fromNames || nickname || simpleName || '').trim();
                      } catch (e) { return ''; }
                    })(),
                  };
                  await createDoraCutProcess(doracutPayload);
                  setLoading(false);
                  setOpenModalType(null);
                  setSingleMultipleFields(prev => ({ ...prev, selection: '' }));
                  setIsDoracutScanned(false);
                  showSuccessToast('doracut-process-created-success', 'DoraCut process created successfully!');
                  setIsProcessModalOpen(false);
                } catch (error) {
                  toast.error(error.message || 'Failed to create doraCut process', { toastId: 'doracut-process-error' });
                }
              }}
              fields={threadFields}
              onFieldChange={(field, value) => setThreadFields((prev) => ({ ...prev, [field]: value }))}
              size="md"
            />
          )}
          {isDoracutScanned && singleMultipleFields.selection === 'multiple' && (
            <MultipleDoraCutQrScanModal
              isOpen={true}
              onClose={() => {
                setOpenModalType(null);
                setSingleMultipleFields(prev => ({ ...prev, selection: '' }));
                setIsDoracutScanned(false);
              }}
              onSubmit={handleMultipleDoraCutQrScanSubmit}
              isLoading={multipleDoraCutQrScanLoading}
              doracut={multipleDoraCutQrScanValue}
              onDoraCutChange={handleMultipleDoraCutQrScanChange}
              selectedProcessName={selectedProcess?.processName || 'doracut'}
            />
          )}
        </>
      )}
      {openModalType === 'rc' && (
        <ProcessQrDetailsModal
          isOpen={true}
          onClose={() => setOpenModalType(null)}
          isLoading={loading}
          designData={currentDesign}
          onSubmit={async (payload) => {
            try {
              setLoading(true);

              // Calculate total price from all machines
              const totalPrice = payload.machineEmployees?.reduce((sum, m) => sum + (m.baseRate || 0), 0) || 0;
              
              // Get primary employee IDs for status change (backward compatibility)
              const primaryEmployees = {};
              payload.machineEmployees?.forEach(machine => {
                const fieldKey = machine.machineName.toLowerCase().replace(/\s+/g, '');
                primaryEmployees[fieldKey] = machine.employeeId;
              });

              console.log('Machine Employees:', payload.machineEmployees);
              console.log('Total Price:', totalPrice);

              const rcPayload = {
                processName: selectedProcess?.processName || 'rc',
                lotNo: threadFields?.lotNo || parsed?.lotNo,
                dNo: threadFields?.dNo || parsed?.dNo,
                pic: threadFields?.pic || parsed?.pic,
                size: threadFields?.size || parsed?.size,
                color: threadFields?.colour || threadFields?.color || parsed?.colour,
                machineEmployees: payload.machineEmployees || [],
                single: payload.single || primaryEmployees.single,
                fatlock: payload.fatlock || primaryEmployees.fatlock,
                kansai: payload.kansai || primaryEmployees.kansai,
                rcPic: payload.rcPic,
                alter: payload.alter,
                reject: payload.reject,
                processId: selectedProcess?._id || threadFields.process_id || '',
                dashboardDataId: threadFields?.id || parsed?.id,
                price: totalPrice,
                stickerPhoto: payload.stickerPhoto,
                scannedByName: (function () {
                  try {
                    const raw = localStorage.getItem('user');
                    if (!raw) return '';
                    const user = JSON.parse(raw);
                    const fromData = user?.data?.username || user?.data?.name || '';
                    const fromNames = [user?.firstName || user?.given_name, user?.lastName || user?.family_name]
                      .filter(Boolean)
                      .join(' ')
                      .trim();
                    const nickname = user?.nickname || user?.preferred_username || '';
                    const simpleName = user?.name || '';
                    return (fromData || fromNames || nickname || simpleName || '').trim();
                  } catch (e) {
                    return '';
                  }
                })(),
              };

              console.log('RC Payload:', rcPayload);

              await createGenericScanProcess(rcPayload);
              setLoading(false);

              // Save employee group: For-Thread employee -> RC employees
              if (currentForThreadEmployeeId && payload.machineEmployees?.length > 0) {
                const { saveEmployeeGroup } = await import('../helpers/employeeGroupHelper');
                const groupData = {};
                payload.machineEmployees.forEach(machine => {
                  const fieldKey = machine.machineName.toLowerCase().replace(/\s+/g, '');
                  groupData[fieldKey] = machine.employeeId;
                });
                saveEmployeeGroup(currentForThreadEmployeeId, groupData);
              }

              setOpenModalType(null);
              showSuccessToast('rc-process-created-success', 'RC process created successfully!');
              setIsProcessModalOpen(false);
            } catch (error) {
              toast.error(error.message || 'Failed to create rc process', { toastId: 'rc-process-error' });
            }
          }}
          fields={{
            ...threadFields,
            forThreadEmployeeId: currentForThreadEmployeeId
          }}
          onFieldChange={(field, value) => setThreadFields((prev) => ({ ...prev, [field]: value }))}
          size="md"
        />
      )}
      {openModalType === 'billscan' && (
        <BillScanQrDetailsModal
          isOpen={true}
          onClose={() => setOpenModalType(null)}
          isLoading={loading}
          // onSubmit={async (payload) => {
          //   setLoading(true);
          //     const createdBill = await createBillScan(payload);
          //     try {
          //       const response = await updateStatusByDesignNumber(parsed?.lotNo, 'billscan' , nextDesigneProcess, null , null, null, null, createdBill?.data?._id);
          //       if (response) {
          //         setLoading(false)
          //       }
          //     } catch (e) {
          //       toast.error('Failed to update design status to billScan', { toastId: 'billcan-process-error' });
          //       setLoading(false)
          //     }finally {
          //     setLoading(false);
          //   }
          //   setOpenModalType(null);
          //   showSuccessToast('billscan-submitted-success', 'BillScan data submitted successfully!');
          //   setIsProcessModalOpen(false);


          //   // try {
          //   //   await createBillScan(payload);
          //   //   setOpenModalType(null);
          //   //   showSuccessToast('billscan-submitted-success', 'BillScan data submitted successfully!');
          //   //   setIsProcessModalOpen(false);
          //   // } catch (error) {
          //   //   console.error('Error submitting bill scan data:', error);
          //   // } finally {
          //   //   setLoading(false);
          //   // }
          // }}
          onSubmit={async (payload) => {
            if (loading) return;
            setLoading(true)
            try {
              const processPrice = currentDesign?.processes?.find(
                p => p.processName?.toLowerCase() === selectedProcess?.processName?.toLowerCase()
              )?.price || 0;
              console.log(processPrice, "processPrice")
              const billScanPayload = {
                pic: threadFields?.pic || parsed?.pic,
                lotNo: threadFields?.lotNo || parsed?.lotNo,
                dNo: threadFields?.dNo || parsed?.dNo,
                totalPic: threadFields?.pic || parsed?.pic,
                // pic: payload?.rcPic,
                pic: payload?.pic,
                rcPic : payload?.rcPic,
                alter: payload?.alter,
                reject: payload?.reject,
                size: threadFields?.size || parsed?.size,
                color: threadFields?.colour || threadFields?.color || parsed?.colour,
                billScan: payload.billScan,
                price: parsed?.price || 0,
                processId: currentDesign?._id || threadFields.process_id || '',
                dashboardDataId: threadFields?.id || parsed?.id,
                price: processPrice,
                company: payload.company,
                scannedByName: (function () {
                  try {
                    const raw = localStorage.getItem('user');
                    if (!raw) return '';
                    const user = JSON.parse(raw);
                    const fromData = user?.data?.username || user?.data?.name || '';
                    const fromNames = [user?.firstName || user?.given_name, user?.lastName || user?.family_name]
                      .filter(Boolean)
                      .join(' ')
                      .trim();
                    const nickname = user?.nickname || user?.preferred_username || '';
                    const simpleName = user?.name || '';
                    return (fromData || fromNames || nickname || simpleName || '').trim();
                  } catch (e) {
                    return '';
                  }
                })(),
              };


              console.log('BillScan API Payload:', billScanPayload);

              await createBillScan(billScanPayload);
              setLoading(false);
              setOpenModalType(null);
              showSuccessToast('billscan-process-created-success', 'billscan process created successfully!');
              setIsProcessModalOpen(false);
            } catch (error) {
              // Extract message from axios/error response if available
              const msg =
                error?.response?.data?.message ||
                error?.response?.data?.msg ||
                error?.message ||
                (typeof error === 'string' ? error : '') ||
                'Failed to create billscan process';

              // Stop loader first so UI reflects state immediately
              setLoading(false);

              if (/already/i.test(msg)) {
                toast.error(msg, { toastId: 'billscan-already-scanned' });
                setOpenModalType(null);
                setIsProcessModalOpen(false);
              } else {
                toast.error(msg, { toastId: 'billscan-process-error' });
              }
            } finally {
              // ensure loader stopped (idempotent)
              setLoading(false);
            }
          }}
          fields={threadFields}
          onFieldChange={(field, value) => setThreadFields((prev) => ({ ...prev, [field]: value }))}
          size="md"
        />
      )}

      <MultipleBillScanQrDetailsModal
        isOpen={isMultipleBillScanModalOpen}
        onClose={() => setIsMultipleBillScanModalOpen(false)}
        onSubmit={handleMultipleBillScanSubmit}
        isLoading={loading}
        size="md"
        selectedProcess={selectedProcess}
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
            <Button
              type="button"
              variant="primary"
              label="Done"
              onClick={handleCloseMultipleQrScanModal}
              className="w-full mt-4"
            />
          </div>
        </Modal>
      )}

      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        barcodeData={selectedDashboardData}
        onPrintBarcode={() => { }}
      />
      {(loading || multipleDoraCutQrScanLoading) && (
        <LoaderComponent size={56} />
      )}
    </div>
  );
};

export default AdminScan;