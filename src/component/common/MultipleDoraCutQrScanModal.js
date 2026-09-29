import React, { useState, useEffect, useCallback, useRef } from "react";
import Modal from "./Modal";
import SelectElement from "./Select";
import Button from "./Button";
import { Trash2 } from "lucide-react";
import { getEmployees } from "../../apis/employeeApi";
import { mapEmployeeToSelectOption } from "../../helpers/utils";
import { getDesignByNumber } from "../../apis/designApi";
import { getDashboardById } from "../../apis/dashboardApi";
import {
  validateLotForSelectedScanProcess,
  resolveDashboardLotRecord,
  resolveLotDesignNumber,
  extractRcDetailsFromLotStatus,
} from "../../helpers/utils";
import { fetchWithScanCache } from "../../helpers/scanFetchCache";
import QrReader from "./QrReader";
import { toast } from "react-toastify";
import { playSuccessBeep } from "../../utils/soundUtils";

const isLikelyLotNo = (value) => {
  if (typeof value !== "string") return false;
  const cleaned = value.trim();
  if (cleaned.length < 4 || cleaned.length > 30) return false;
  return /^[A-Za-z0-9][A-Za-z0-9-_\/]*$/.test(cleaned);
};

const MultipleDoraCutQrScanModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  doracut = "",
  onDoraCutChange,
  size = "md",
  selectedProcessName = "doracut",
}) => {
  const [actionStatus, setActionStatus] = useState("");
  const [doracutOptions, setDoracutOptions] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [scannedResults, setScannedResults] = useState([]);
  const actionStatusRef = useRef(actionStatus);
  const scannedResultsRef = useRef(scannedResults);
  const scanInFlightRef = useRef(false);

  useEffect(() => {
    actionStatusRef.current = actionStatus;
  }, [actionStatus]);

  useEffect(() => {
    scannedResultsRef.current = scannedResults;
  }, [scannedResults]);

  // reset data when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActionStatus("");
      setScannedResults([]);
      scanInFlightRef.current = false;
    }
  }, [isOpen]);

  // fetch employees for this process (doracut or any Send/Receive process)
  useEffect(() => {
    if (isOpen) fetchEmployees();
  }, [isOpen, selectedProcessName]);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await getEmployees({
        processName: selectedProcessName || "doracut",
      });

      if (res?.data) {
        // ⭐ SHOW CODE + NAME in dropdown
        const options = res.data.map((emp) => {
          const option = mapEmployeeToSelectOption(emp);
          return { ...option, fullName: option.label };
        });
        setDoracutOptions(options);
      }
    } catch (err) {
      console.error("EMPLOYEE LOAD ERROR ::", err);
      setDoracutOptions([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = () => {
    if (!actionStatus || !doracut) return;

    const payload = {
      doracut,
      doracutName: doracutOptions.find(x => x.value === doracut)?.fullName || "",
      actionStatus,
      scannedResults: scannedResults.map(item =>
        typeof item === "string" ? JSON.parse(item) : item
      ),
    };

    onSubmit(payload);
    setScannedResults([]);
  };

  const handleOpenQrModal = () => setIsQrModalOpen(true);
  const handleCloseQrModal = () => setIsQrModalOpen(false);

  const handleSelectActionStatus = (nextStatus) => {
    setActionStatus(nextStatus);
    // Switching SEND/RECEIVE should not carry over lots from the other mode
    setScannedResults([]);
  };

  const handleQrScan = useCallback(async (result) => {
    if (!result) return;
    if (scanInFlightRef.current) return;
    scanInFlightRef.current = true;

    const currentActionStatus = actionStatusRef.current;
    if (!currentActionStatus) {
      toast.error("Please select SEND or RECEIVE first", { toastId: "doracut-action-required" });
      scanInFlightRef.current = false;
      setIsQrModalOpen(false);
      return;
    }

    try {
      let parsed = {};
      const rawValue = typeof result === "string" ? result.trim() : "";
      if (typeof result === "string") {
        try {
          parsed = JSON.parse(rawValue);
        } catch {
          parsed = {};
        }
      } else if (typeof result === "object") {
        parsed = result;
      }

      let resolvedLotNo = parsed?.lotNo || parsed?.lotno || parsed?.LotNo || "";
      let qrId = parsed?.id || parsed?._id || (rawValue && /^[a-f0-9]{24}$/i.test(rawValue) ? rawValue : null);

      // Support plain lot numbers embedded directly in QR text.
      if (!resolvedLotNo && !qrId && isLikelyLotNo(rawValue)) {
        resolvedLotNo = rawValue;
      }

      // Support URL-style payloads: "...?lotNo=...&id=..."
      if (!resolvedLotNo && rawValue && /^https?:\/\//i.test(rawValue)) {
        try {
          const url = new URL(rawValue);
          resolvedLotNo =
            url.searchParams.get("lotNo") ||
            url.searchParams.get("lotno") ||
            url.searchParams.get("LotNo") ||
            "";
          qrId = qrId || url.searchParams.get("id") || url.searchParams.get("_id") || null;
        } catch {
          // Ignore URL parsing failures and continue with existing fallbacks.
        }
      }

      if (!resolvedLotNo && !qrId) {
        toast.error("Invalid QR: Lot No not found", { toastId: "invalid-lotno-qr" });
        return;
      }

      let lotStatusData = null;
      try {
        const lookupKey = qrId || resolvedLotNo;
        // Always fetch fresh lot status for doracut multi — cached/stale status causes wrong RECEIVE blocks
        const dashRes = await getDashboardById(lookupKey);
        lotStatusData = resolveDashboardLotRecord(dashRes);
        if (lotStatusData) {
          resolvedLotNo = lotStatusData?.lotNo || resolvedLotNo;
          parsed = { ...parsed, ...lotStatusData, id: lotStatusData?._id || parsed?.id || qrId };
        }
      } catch {
        toast.error("Lot not found", { toastId: "doracut-lot-not-found" });
        return;
      }

      if (!resolvedLotNo || !lotStatusData) {
        toast.error("Invalid QR: Lot No not found", { toastId: "invalid-lotno-qr" });
        return;
      }

      const alreadyScanned = scannedResultsRef.current.some((item) => {
        const p = typeof item === "string" ? JSON.parse(item) : item;
        return p?.lotNo === resolvedLotNo;
      });

      if (alreadyScanned) {
        toast.info(`Lot ${resolvedLotNo} already scanned`, { toastId: "already-scanned" });
        return;
      }

      const dNo = resolveLotDesignNumber(lotStatusData, parsed?.dNo);

      let designData = null;
      if (dNo) {
        try {
          const designRes = await fetchWithScanCache(`design:${dNo}`, () =>
            getDesignByNumber(dNo)
          );
          designData = designRes?.data ?? designRes;
        } catch (e) {
          toast.error("Design not found for scanned lot.", { toastId: "doracut-design-error" });
          return;
        }
      } else {
        toast.error("Design not found for scanned lot.", { toastId: "doracut-design-error" });
        return;
      }

      const validation = validateLotForSelectedScanProcess({
        lotStatusData,
        designData,
        selectedProcessName,
        doracutMode: "multiple",
        doracutActionStatus: currentActionStatus,
      });

      if (!validation.allowed) {
        const statusLabel =
          [
            lotStatusData?.status ? `status: ${lotStatusData.status}` : null,
            lotStatusData?.currentStatus
              ? `current: ${lotStatusData.currentStatus}`
              : null,
          ]
            .filter(Boolean)
            .join(", ") || "status: unknown";
        toast.error(`${resolvedLotNo}: ${validation.errorMessage} (${statusLabel})`, {
          toastId: `doracut-status-error-${resolvedLotNo}`,
          autoClose: 5000,
          position: "top-right",
        });
        return;
      }

      const { rcPic, alter, reject } = extractRcDetailsFromLotStatus(lotStatusData);

      // Store enriched scan data with rcPic, alter, reject
      const enriched = {
        ...(typeof parsed === "object" ? parsed : {}),
        lotNo: resolvedLotNo,
        dNo,
        pic: lotStatusData?.pic || parsed?.pic || "",
        size: lotStatusData?.size || parsed?.size || "",
        color: lotStatusData?.colour || lotStatusData?.color || parsed?.color || parsed?.colour || "",
        dashboardDataId: lotStatusData?._id || parsed?.id || "",
        rcPic,
        alter,
        reject,
      };

      setScannedResults((prev) => [...prev, enriched]);
      playSuccessBeep();
      toast.success(`Lot ${resolvedLotNo} scanned`, {
        toastId: `doracut-lot-scanned-${resolvedLotNo}`,
        autoClose: 2000,
      });
    } catch (err) {
      console.error("SCAN READ ERROR ::", err);
    } finally {
      scanInFlightRef.current = false;
      // Always close scan popup after a scan attempt.
      setIsQrModalOpen(false);
    }
  }, [selectedProcessName]);

  const handleRemoveByLotNo = (lotNo) => {
    setScannedResults((prev) =>
      prev.filter((item) => {
        try {
          const p = typeof item === "string" ? JSON.parse(item) : item;
          return p.lotNo !== lotNo;
        } catch {
          return true;
        }
      })
    );
  };

  const footerContent = (
    <div className="flex gap-3 justify-end">
      <Button type="button" variant="default" label="Cancel" onClick={onClose} />
      <Button
        type="button"
        variant="primary"
        label={isLoading ? "Submitting..." : "Submit"}
        onClick={handleSubmit}
        disabled={!doracut || !actionStatus || scannedResults.length === 0}
      />
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Multiple QR Scan" footerContent={footerContent} size={size}>

      <div className="p-4 space-y-4">

        {/* ⭐ MAIN DROPDOWN — SHOW CODE + NAME */}
        <SelectElement
          key={`${selectedProcessName || 'doracut'}-employee-select`}
          name={
            String(selectedProcessName || '')
              .toLowerCase()
              .includes('doracut')
              ? 'DoraCut Employee'
              : `${selectedProcessName || 'Process'} Employee`
          }
          options={doracutOptions}
          value={doracut || null}
          placeholder={
            String(selectedProcessName || '')
              .toLowerCase()
              .includes('doracut')
              ? 'Select DoraCut Employee'
              : `Select ${selectedProcessName || 'Process'} Employee`
          }
          onChange={(val) => onDoraCutChange(val || '')}
          isClearable={false}
          isMulti={false}
          className="w-full"
          menuPortalTarget={document.body}
          isLoading={loadingEmployees}
        />

        {doracut && (
          <>
            <div className="flex gap-3 mb-3">
              <Button label="SEND" onClick={() => handleSelectActionStatus("SEND")} />
              <Button label="RECEIVE" onClick={() => handleSelectActionStatus("RECEIVE")} />
            </div>

            {actionStatus && (
              <div className="text-center font-bold text-lg">
                {actionStatus === "SEND" ? "🔴 SEND" : "🟢 RECEIVE"}
              </div>
            )}

            {scannedResults.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto mt-3 border border-gray-200 space-y-2">
                <h3 className="text-sm font-semibold mb-1 text-gray-700">Scanned Lots ({scannedResults.length})</h3>
                {scannedResults.map((res, i) => {
                  const p = typeof res === "string" ? JSON.parse(res) : res;
                  const totalPic = Number(p.pic || 0);
                  const rcPicVal = Number(p.rcPic ?? 0);
                  const alterVal = Number(p.alter ?? 0);
                  const rejectVal = Number(p.reject ?? 0);
                  return (
                    <div key={p.lotNo || i} className="bg-white rounded border border-gray-100 shadow-sm p-2">
                      <div className="flex justify-between items-center border-b pb-1 mb-1">
                        <span className="text-sm font-bold text-gray-900">
                          {i + 1}. Lot: {p.lotNo}
                          <span className="ml-2 text-xs font-normal text-gray-500">({p.dNo}, {p.color || p.colour}, {p.size})</span>
                        </span>
                        <Trash2 size={16} className="text-red-500 cursor-pointer hover:text-red-700" onClick={() => handleRemoveByLotNo(p.lotNo)} />
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-xs">
                        <div>
                          <span className="text-gray-500">Total Pic:</span>{' '}
                          <span className="font-semibold">{totalPic || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">RC Pic:</span>{' '}
                          <span style={{ color: rcPicVal === totalPic && totalPic > 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                            {rcPicVal}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Alter:</span>{' '}
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{alterVal}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Reject:</span>{' '}
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{rejectVal}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Button label="SCAN QR CODE" onClick={handleOpenQrModal} className="w-full mt-3" disabled={!actionStatus} />
          </>
        )}
      </div>

      {/* QR Scanner Modal */}
      <Modal isOpen={isQrModalOpen} onClose={handleCloseQrModal} title="Scan QR" size="lg">
        <QrReader onScan={handleQrScan} />
      </Modal>

    </Modal>
  );
};

export default MultipleDoraCutQrScanModal;
