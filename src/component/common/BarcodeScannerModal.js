import React, { useEffect, useState, useRef, useMemo } from 'react';
import Modal from './Modal';
import {
  formatDate,
  formatEmployeeDisplayWithCode,
  formatEmployeeDisplayWithCodeOrEmpty,
  formatMasterWithOptionalCode,
} from '../../helpers/utils';
import { LucidePrinter, LucideLoader } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Button from './Button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import LabelBlock from './LabelBlock';
import LabelBlockWithBarcode from './LabelBlock/LabelBlockWithBarcode';
import LotNoBarcode from './LotNoBarcode';
import { getDesignByNumber, getDesignByNumberDetails } from '../../apis/designApi';

const BarcodeScannerModal = ({ isOpen, onClose, barcodeData, onPrintBarcode, showLotBarcode = false }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [designProcesses, setDesignProcesses] = useState([]);
  const [detailRecord, setDetailRecord] = useState(null);
  const labelRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const isUsableRecord = (record) => {
      if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
      return Boolean(record?._id || record?.lotNo || record?.dNo);
    };

    const pickFirstRecord = (payload) => {
      if (!payload) return null;
      const r1 = payload?.records?.[0];
      if (isUsableRecord(r1)) return r1;
      const r2 = payload?.data?.records?.[0];
      if (isUsableRecord(r2)) return r2;
      const r3 = payload?.data?.data?.records?.[0];
      if (isUsableRecord(r3)) return r3;
      const r4 = payload?.data;
      if (isUsableRecord(r4)) return r4;
      if (isUsableRecord(payload)) return payload;
      return null;
    };

    const fetchDetails = async () => {
      try {
        if (!isOpen || !barcodeData?.dNo || !barcodeData?.lotNo) {
          if (isMounted) setDetailRecord(null);
          return;
        }
        const res = await getDesignByNumberDetails(barcodeData.dNo, { lotNo: barcodeData.lotNo });
        if (isMounted) setDetailRecord(pickFirstRecord(res));
      } catch {
        if (isMounted) setDetailRecord(null);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [isOpen, barcodeData?.dNo, barcodeData?.lotNo]);

  const resolvedBarcodeData = useMemo(() => {
    const base = barcodeData && typeof barcodeData === 'object' ? barcodeData : {};
    const extra = detailRecord && typeof detailRecord === 'object' ? detailRecord : {};
    // Keep already-visible row fields and enrich with detailed API response fields.
    return { ...base, ...extra };
  }, [barcodeData, detailRecord]);

  useEffect(() => {
    let isMounted = true;

    const fetchDesignProcesses = async () => {
      try {
        // Prefer already available process config if present in row payload.
        if (Array.isArray(barcodeData?.processes) && barcodeData.processes.length > 0) {
          if (isMounted) setDesignProcesses(barcodeData.processes);
          return;
        }

        if (!barcodeData?.dNo) {
          if (isMounted) setDesignProcesses([]);
          return;
        }

        const res = await getDesignByNumber(barcodeData.dNo);
        const processes = res?.data?.processes || res?.processes || [];
        if (isMounted) setDesignProcesses(Array.isArray(processes) ? processes : []);
      } catch (err) {
        if (isMounted) setDesignProcesses([]);
      }
    };

    if (isOpen) {
      fetchDesignProcesses();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, barcodeData?.dNo, barcodeData?.processes]);

  const formatEmployeeName = (emp) => {
    if (!emp) return "-";
    if (typeof emp === "string") return emp.trim() || "-";
    return formatEmployeeDisplayWithCode(emp);
  };

  const processEmployeeMap = useMemo(() => {
    const list = Array.isArray(resolvedBarcodeData?.schandProcessEmployee) ? resolvedBarcodeData.schandProcessEmployee : [];
    const map = new Map();
    list.forEach((item) => {
      const key = String(item?.processName || "").trim().toLowerCase();
      if (!key) return;
      const name = String(item?.employeeName || "").trim();
      const code = String(item?.employeeCode || "").trim();
      if (name && code) map.set(key, `${name} (${code})`);
      else if (name) map.set(key, name);
      else if (code) map.set(key, code);
    });
    return map;
  }, [resolvedBarcodeData?.schandProcessEmployee]);

  const getProcessEmployeeValue = (...keys) => {
    for (const key of keys) {
      const normalized = String(key || "").trim().toLowerCase();
      if (!normalized) continue;
      const value = processEmployeeMap.get(normalized);
      if (value) return value;
    }
    return "";
  };

  const getEmployeeFromMachineLabel = (label, fallbackValue = "") => {
    const normalized = String(label || "").trim().toLowerCase();
    if (!normalized) return fallbackValue || "-";

    // Always prefer new schandProcessEmployee mapping first.
    if (normalized.includes("single")) {
      return (
        getProcessEmployeeValue("single", "rc") ||
        fallbackValue ||
        "-"
      );
    }
    if (normalized.includes("kansai")) {
      return (
        getProcessEmployeeValue("kansai", "rc") ||
        fallbackValue ||
        "-"
      );
    }
    if (normalized.includes("fat")) {
      return (
        getProcessEmployeeValue("fatlock", "fatLock", "rc") ||
        fallbackValue ||
        "-"
      );
    }
    if (normalized.includes("thread")) {
      return (
        getProcessEmployeeValue("loading", "forthread", "fourthread") ||
        fallbackValue ||
        "-"
      );
    }

    // Generic machine labels under loading/rc families.
    if (normalized.includes("loading")) {
      return getProcessEmployeeValue("loading") || fallbackValue || "-";
    }
    return getProcessEmployeeValue("rc") || fallbackValue || "-";
  };

  const processEmployeeRows = useMemo(() => {
    const list = Array.isArray(resolvedBarcodeData?.schandProcessEmployee)
      ? resolvedBarcodeData.schandProcessEmployee
      : [];
    if (list.length === 0) return [];

    const normalize = (v) => String(v || "").trim().toLowerCase();
    const doracutIndex = list.findIndex((item) => normalize(item?.processName) === "doracut");
    const rowsSource = doracutIndex > -1 ? list.slice(0, doracutIndex) : list;

    return rowsSource
      .map((item, idx) => {
        const processName = String(item?.processName || "").trim();
        const employeeName = String(item?.employeeName || "").trim();
        const employeeCode = String(item?.employeeCode || "").trim();
        const value = employeeName && employeeCode
          ? `${employeeName} (${employeeCode})`
          : (employeeName || employeeCode || "-");
        return {
          key: `pe-${idx}-${normalize(processName) || "process"}`,
          label: processName || "-",
          value,
        };
      })
      .filter((row) => row.label !== "-");
  }, [resolvedBarcodeData?.schandProcessEmployee]);

  /* 🟢 Get Process Names from schand_ProcessDetails */
  const singleItem = resolvedBarcodeData?.schand_ProcessDetails?.find(x => x?.singleName || x?.single);
  const kansaiItem = resolvedBarcodeData?.schand_ProcessDetails?.find(x => x?.kansaiName || x?.kansai);
  const fatlockItem = resolvedBarcodeData?.schand_ProcessDetails?.find(x => x?.fatlockName || x?.fatlock);
  // const fourThreadItem = barcodeData?.schand_ProcessDetails?.find(x => x.fourThreadName || x.fourThread);
  const fourThreadItem = resolvedBarcodeData?.schand_ProcessDetails?.find(
  x => x && (x?.fourThreadName || x?.fourThread || x?.employeeId)
);

  
  const singleEmployeeName = singleItem?.singleName || formatEmployeeName(singleItem?.single);
  const kansaiEmployeeName = kansaiItem?.kansaiName || formatEmployeeName(kansaiItem?.kansai);
  const fatlockEmployeeName = fatlockItem?.fatlockName || formatEmployeeName(fatlockItem?.fatlock);
  // const fourThreadEmployeeName = fourThreadItem?.fourThreadName || formatEmployeeName(fourThreadItem?.employeeId);
  const fourThreadEmployeeName =
  fourThreadItem?.fourThreadName ||
  formatEmployeeName(fourThreadItem?.employeeId) ||
  "-";

  const loadingMachineDisplayRows = useMemo(() => {
    const processDetails = Array.isArray(resolvedBarcodeData?.schand_ProcessDetails)
      ? resolvedBarcodeData.schand_ProcessDetails
      : [];
    const procs = Array.isArray(designProcesses) ? designProcesses : [];

    const cleanMachineName = (name) => String(name || "").replace(/\s+\d+$/, "").trim();
    const formatMachineEmployee = (emp) => {
      if (!emp) return "";
      if (typeof emp === "string") return emp.trim();
      return formatEmployeeDisplayWithCodeOrEmpty(emp);
    };

    const loadingItem = processDetails.find(
      (x) =>
        x?.model === "LoadingProcess" ||
        (Array.isArray(x?.machineEmployees) && x?.model !== "RcProcess")
    );

    const rows = (loadingItem?.machineEmployees || []).map((me, idx) => {
      const machineName = cleanMachineName(me?.machineName || me?.machineId?.machineName || "");
      const employeeName = formatMachineEmployee(me?.employeeId);
      return {
        key: `loading-${idx}-${machineName || "m"}`,
        label: machineName || "Loading",
        value: employeeName,
      };
    });

    if (rows.length === 0) {
      const proc = procs.find(
        (p) =>
          String(p?.processName || p?.processId?.processName || "").toLowerCase() === "loading"
      );
      const details = Array.isArray(proc?.machineDetails) ? proc.machineDetails : [];
      details.forEach((m, idx) => {
        const name = cleanMachineName(m?.machineName || m?.machineId?.machineName || "");
        if (name) {
          rows.push({
            key: `design-loading-${idx}-${name}`,
            label: name,
            value: "",
          });
        }
      });
    }

    return rows;
  }, [resolvedBarcodeData?.schand_ProcessDetails, designProcesses]);

  const rcMachineDisplayRows = useMemo(() => {
    const processDetails = Array.isArray(resolvedBarcodeData?.schand_ProcessDetails)
      ? resolvedBarcodeData.schand_ProcessDetails
      : [];
    const procs = Array.isArray(designProcesses) ? designProcesses : [];

    const cleanMachineName = (name) => String(name || "").replace(/\s+\d+$/, "").trim();
    const formatMachineEmployee = (emp) => {
      if (!emp) return "";
      if (typeof emp === "string") return emp.trim();
      return formatEmployeeDisplayWithCodeOrEmpty(emp);
    };

    const getValueFromObject = (obj, keys = []) => {
      for (const key of keys) {
        const val = obj?.[key];
        if (val === 0) return "0";
        if (val) return String(val);
      }
      return "";
    };

    const getProcessValue = (keys = []) => {
      for (const item of processDetails) {
        const value = getValueFromObject(item, keys);
        if (value) return value;
      }
      return "";
    };

    const rcItem = processDetails.find(
      (x) =>
        x?.model === "RcProcess" ||
        (Array.isArray(x?.machineEmployees) && x?.rcPic !== undefined)
    );

    const rcProc = procs.find(
      (p) => String(p?.processName || p?.processId?.processName || "").toLowerCase() === "rc"
    );
    const designRcDetails = Array.isArray(rcProc?.machineDetails) ? rcProc.machineDetails : [];
    const designRcNames = designRcDetails
      .map((m) => cleanMachineName(m?.machineName || m?.machineId?.machineName || ""))
      .filter(Boolean);

    const meList = Array.isArray(rcItem?.machineEmployees) ? rcItem.machineEmployees : [];
    const employeeByMachine = new Map();
    meList.forEach((me) => {
      const mn = cleanMachineName(me?.machineName || me?.machineId?.machineName || "");
      if (!mn) return;
      const emp = formatMachineEmployee(me?.employeeId);
      if (!employeeByMachine.has(mn)) employeeByMachine.set(mn, emp);
    });

    const rows = [];

    if (designRcNames.length > 0) {
      designRcNames.forEach((name, idx) => {
        const emp = employeeByMachine.get(name);
        rows.push({
          key: `rc-design-${idx}-${name}`,
          label: name,
          value: emp !== undefined && emp !== "" ? emp : "",
        });
      });
    } else if (meList.length > 0) {
      meList.forEach((me, idx) => {
        const machineName = cleanMachineName(me?.machineName || me?.machineId?.machineName || "");
        const employeeName = formatMachineEmployee(me?.employeeId);
        rows.push({
          key: `rc-${idx}-${machineName || "m"}`,
          label: machineName || "RC",
          value: employeeName,
        });
      });
    }

    if (rows.length === 0) {
      const fallbackRows = [
        { label: "4-Thread", value: getProcessValue(["fourThreadName", "fourThread", "forThreadName", "forThread"]) },
        { label: "Kansai", value: getProcessValue(["kansaiName", "kansai", "kansaiEmployee", "kansaiEmployeeName"]) },
        { label: "Single", value: getProcessValue(["singleName", "single", "singleEmployee", "singleEmployeeName"]) },
        { label: "FatLock", value: getProcessValue(["fatlockName", "fatlock", "fatLockName", "fatLock"]) },
      ];
      fallbackRows.forEach((r, idx) => {
        rows.push({ key: `fallback-rc-${idx}`, label: r.label, value: r.value });
      });
    }

    return rows;
  }, [resolvedBarcodeData?.schand_ProcessDetails, designProcesses]);

  const rcPicValue = resolvedBarcodeData?.rcPic ?? resolvedBarcodeData?.schand_ProcessDetails?.find(x => x?.rcPic)?.rcPic ?? "-";
  const rcAlterValue = resolvedBarcodeData?.alter ?? resolvedBarcodeData?.schand_ProcessDetails?.find(x => x?.alter)?.alter ?? "-";
  const rcRejectValue = resolvedBarcodeData?.reject ?? resolvedBarcodeData?.schand_ProcessDetails?.find(x => x?.reject)?.reject ?? "-";
    // { label: 'Alter Pic', value: dashboardItem?.schand_ProcessDetails?.find(x => x?.alter)?.alter || "-"},
      // { label: 'Reject Pic', value: dashboardItem?.schand_ProcessDetails?.find(x => x?.reject)?.reject || "-"},

  // Get stickerPhoto from barcodeData - check root level first, then in process details
  const stickerPhoto = (() => {
    // Check root level first (from dashboard API)
    if (resolvedBarcodeData?.stickerPhoto) {
      return resolvedBarcodeData.stickerPhoto;
    }
    // Check in schand_ProcessDetails array
    const details = resolvedBarcodeData?.schand_ProcessDetails || [];
    for (const d of details) {
      if (d?.stickerPhoto) return d.stickerPhoto;
    }
    return null;
  })();

  if (!isOpen || !barcodeData) return null;

  const PdfLabelBlock = showLotBarcode ? LabelBlockWithBarcode : LabelBlock;

  /* ---------------- PDF Download --------------- */
  const handleDownloadPdf = async () => {
    if (!labelRef.current) return;

    setIsPrinting(true);
    try {
      // 75mm x 50mm in mm - Horizontal (landscape)
      const labelWidthMm = 75;  // 75mm
      const labelHeightMm = 50; // 50mm
      
      const pdf = new jsPDF({ 
        orientation: 'landscape', 
        unit: 'mm', 
        format: [labelWidthMm, labelHeightMm] 
      });
      
      const element = labelRef.current.querySelector('.label-barcode-pdf') || labelRef.current;

      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 283.46, // 75mm at 96dpi
        height: 188.98 // 50mm at 96dpi
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData, 'JPEG', 0, 0, labelWidthMm, labelHeightMm, undefined, 'FAST');

      const pdfBlob = pdf.output('blob');
      pdf.save(`barcode-${resolvedBarcodeData?.lotNo || 'label'}.pdf`);

      const url = window.URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(url);
      setShowPdfModal(true);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  /* ---------------- PDF Show & Print Modal Footer ---------------- */
  const footerButtons = [
    <Button
      key="print"
      onClick={handleDownloadPdf}
      label={isPrinting ? "Printing..." : "Print"}
      variant="primary"
      className='font-normal focus:ring-0 mr-2'
      icon={isPrinting ? <LucideLoader size={16} className="animate-spin" /> : <LucidePrinter size={16} />}
      disabled={isPrinting}
    />,
    <Button
      key="close"
      onClick={() => {
        onClose();
        setIsPrinting(false);
        setShowPdfModal(false);
        if (pdfBlobUrl) window.URL.revokeObjectURL(pdfBlobUrl);
      }}
      label="Close"
      variant="outline"
      className='font-normal focus:ring-0'
    />
  ];

  const renderField = (label, value) => (
    <div className="flex items-center">
      <span className="text-sm font-medium mr-1">{label}:</span>
      <span className="text-sm font-bold underline">{value || "-"}</span>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Item Details" footerContent={<div className="flex justify-end space-x-2">{footerButtons}</div>} size="lg">

      {/* 🔥 Hidden PDF Block - 75mm x 50mm (Horizontal) */}
      <div ref={labelRef} style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div className="label-barcode-pdf" style={{ width: 283.46, height: 188.98, background: "#fff", padding: 0 }}>
          <PdfLabelBlock {...resolvedBarcodeData} designProcesses={designProcesses} />
        </div>
        <div className="label-barcode-pdf" style={{ width: 283.46, height: 188.98, background: "#fff", padding: 0 }}>
          <PdfLabelBlock {...resolvedBarcodeData} designProcesses={designProcesses} />
        </div>
        <div className="label-barcode-pdf" style={{ width: 283.46, height: 188.98, background: "#fff", padding: 0 }}>
          <PdfLabelBlock {...resolvedBarcodeData} designProcesses={designProcesses} />
        </div>
      </div>

      {/* ----------- UI Display ----------- */}
      <div className="p-6 space-y-3">

        {/* Sticker Photo - Above LotNo, center aligned, same size as QR code */}
        {stickerPhoto && (
          <div className="flex justify-center pb-3">
            <img
              src={stickerPhoto}
              alt="Sticker Photo"
              className="w-[180px] h-[180px] object-contain rounded border"
              onError={(e) => { 
                console.error('Sticker photo failed to load:', stickerPhoto);
                e.currentTarget.style.display = 'none'; 
              }}
            />
          </div>
        )}

        <div className="flex text-left pb-2">
          <span className='text-base font-medium mr-1'>LotNo:</span>
          <span className='text-base font-bold underline'>{resolvedBarcodeData?.lotNo || "-"}</span>
        </div>

        <div className="grid grid-cols-3 gap-x-4">
          {renderField("D. No", resolvedBarcodeData?.dNo)}
          {renderField("Layer", resolvedBarcodeData?.layer)}
          {renderField("Date", formatDate(resolvedBarcodeData?.date))}
        </div>

        <div className="grid grid-cols-3 gap-x-4">
          {renderField("Color", resolvedBarcodeData?.colour)}
          {renderField("Size", resolvedBarcodeData?.size)}
          {renderField("Pic", resolvedBarcodeData?.pic)}
        </div>

        {/* QR Code + Barcode */}
        <div className="flex flex-row flex-wrap items-center justify-center py-3 gap-4">
          <QRCodeSVG
            value={resolvedBarcodeData?.lotNo || ""}
            size={130}
            level="L"
            includeMargin={false}
          />
          {showLotBarcode && resolvedBarcodeData?.lotNo ? (
            <LotNoBarcode value={resolvedBarcodeData.lotNo} compact />
          ) : null}
        </div>

        {/* Employee Details — loading process machines (same source as label); fallback For-Thread */}
        <div className="grid grid-cols-2 gap-x-4">
          {processEmployeeRows.length > 0
            ? processEmployeeRows.map((row) => (
                <React.Fragment key={row.key}>
                  {renderField(row.label, row.value)}
                </React.Fragment>
              ))
            : (
                <>
                  {loadingMachineDisplayRows.length > 0
                    ? loadingMachineDisplayRows.map((row) => (
                        <React.Fragment key={row.key}>
                          {renderField(row.label, getEmployeeFromMachineLabel(row.label, row.value))}
                        </React.Fragment>
                      ))
                    : renderField("For-Thread", getEmployeeFromMachineLabel("For-Thread", fourThreadEmployeeName))}
                  {rcMachineDisplayRows.length > 0
                    ? rcMachineDisplayRows.map((row) => (
                        <React.Fragment key={row.key}>
                          {renderField(row.label, getEmployeeFromMachineLabel(row.label, row.value))}
                        </React.Fragment>
                      ))
                    : (
                        <>
                          {renderField("Single", getEmployeeFromMachineLabel("Single", singleEmployeeName))}
                          {renderField("FatLock", getEmployeeFromMachineLabel("FatLock", fatlockEmployeeName))}
                          {renderField("Kansai", getEmployeeFromMachineLabel("Kansai", kansaiEmployeeName))}
                        </>
                      )}
                </>
              )}
          {renderField("Rc Pic", rcPicValue)}
          {renderField("Alter Pic", rcAlterValue)}
          {renderField("Reject Pic", rcRejectValue)}
          {renderField(
            "Master",
            formatMasterWithOptionalCode(resolvedBarcodeData?.master, resolvedBarcodeData?.masterEmployee)
          )}
        </div>

      </div>
    </Modal>
  );
};

export default BarcodeScannerModal;
