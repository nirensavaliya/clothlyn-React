import { getAuthToken } from '../../utils/authToken';
import React, { useState, useEffect, useCallback } from "react";
import Modal from "./Modal";
import SelectElement from "./Select";
import Button from "./Button";
import { Trash2, QrCode } from "lucide-react";
import { getCompanies } from "../../apis/companiesApi";
import QrReader from "./QrReader";
import { jwtDecode } from 'jwt-decode';
import { toast } from "react-toastify";
import { getDesignByNumber } from "../../apis/designApi";
import { getDashboardById } from "../../apis/dashboardApi";
import {
  validateLotForSelectedScanProcess,
  resolveDashboardLotRecord,
  resolveLotDesignNumber,
  extractRcDetailsFromLotStatus,
} from "../../helpers/utils";
import { fetchWithScanCache } from "../../helpers/scanFetchCache";

const isLikelyLotNo = (value) => {
  if (typeof value !== "string") return false;
  const cleaned = value.trim();
  if (cleaned.length < 4 || cleaned.length > 30) return false;
  return /^[A-Za-z0-9][A-Za-z0-9-_\/]*$/.test(cleaned);
};

const showBillScanMultipleToast = (type, message, toastId) => {
  toast[type](message, {
    toastId: toastId || `billscan-multiple-${type}-${Date.now()}`,
    autoClose: 5000,
    position: "top-right",
    style: { zIndex: 200001 },
  });
};

const MultipleBillScanQrDetailsModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  size = "md",
  selectedProcess = null,
}) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [companyError, setCompanyError] = useState('');
  
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [scannedResults, setScannedResults] = useState([]);

  // reset data when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCompany(null);
      setScannedResults([]);
      setCompanyError('');
    }
  }, [isOpen]);

  // fetch companies
  useEffect(() => {
    if (isOpen) {
      setIsLoadingCompanies(true);
      getCompanies({ limit: 1000, isActive: true })
        .then(res => {
          const companiesList = res.data || res.items || [];
          setCompanies(companiesList);
        })
        .catch(error => {
          console.error("Error fetching companies:", error);
          setCompanies([]);
        })
        .finally(() => {
          setIsLoadingCompanies(false);
      });
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedCompany) {
      setCompanyError('Company is required');
      return;
    }
    if (scannedResults.length === 0) {
      return;
    }

    // Get current user ID
    let userId = '';
    try {
      const token = getAuthToken();
      const storedUser = JSON.parse(localStorage.getItem('user'));
      
      if (token) {
        const decoded = jwtDecode(token);
        userId = decoded?.id || storedUser?._id || storedUser?.data?._id || '';
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }

    const payload = {
      scans: scannedResults.map(item => {
        const p = typeof item === "string" ? JSON.parse(item) : item;
        const totalPicValue = Number(p.pic || 0);
        const alterValue = Number(p.alter || 0);
        const rejectValue = Number(p.reject || 0);
        // RC Pic count goes into 'pic' field as per user requirement
        const rcPicValue = p.rcPic !== undefined ? p.rcPic : (totalPicValue - alterValue - rejectValue);

        return {
          lotNo: p.lotNo || "",
          dNo: p.dNo || "",
          pic: (rcPicValue >= 0 ? rcPicValue : 0).toString(), 
          size: p.size || "",
          color: p.color || p.colour || "",
          billScan: userId,
          processId: p.processId || "", 
          company: selectedCompany,
          alter: alterValue.toString(),
          reject: rejectValue.toString(),
          totalPic: totalPicValue.toString(), // original total pic
          sortingPic: "", 
          price: p.price || 0,
          dashboardDataId: p.id || p.dashboardDataId || ""
        };
      }),
    };


    onSubmit(payload);
  };

  const handleOpenQrModal = () => setIsQrModalOpen(true);
  const handleCloseQrModal = () => setIsQrModalOpen(false);

  const handleQrScan = useCallback(async (result) => {
    if (!result) return;

    const closeQrModal = () => setIsQrModalOpen(false);

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
      let qrId =
        parsed?.id ||
        parsed?._id ||
        (rawValue && /^[a-f0-9]{24}$/i.test(rawValue) ? rawValue : null);

      if (!resolvedLotNo && !qrId && isLikelyLotNo(rawValue)) {
        resolvedLotNo = rawValue;
      }

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
          // ignore URL parse errors
        }
      }

      if (!resolvedLotNo && !qrId) {
        showBillScanMultipleToast("error", "Invalid QR: Lot No not found");
        return;
      }

      let lotStatusData = null;
      try {
        const lookupKey = qrId || resolvedLotNo;
        const dashRes = await fetchWithScanCache(`dashboard:${lookupKey}`, () =>
          getDashboardById(lookupKey)
        );
        lotStatusData = resolveDashboardLotRecord(dashRes);
        if (lotStatusData) {
          resolvedLotNo = lotStatusData?.lotNo || resolvedLotNo;
          parsed = { ...parsed, ...lotStatusData, id: lotStatusData?._id || parsed?.id || qrId };
        }
      } catch {
        showBillScanMultipleToast("error", "Lot not found");
        return;
      }

      if (!resolvedLotNo || !lotStatusData) {
        showBillScanMultipleToast("error", "Invalid QR: Lot No not found");
        return;
      }

      const alreadyScanned = scannedResults.some((item) => {
        const p = typeof item === "string" ? JSON.parse(item) : item;
        return p?.lotNo === resolvedLotNo;
      });

      if (alreadyScanned) {
        showBillScanMultipleToast("info", `Lot ${resolvedLotNo} already scanned`, "already-scanned");
        return;
      }

      const dNo = resolveLotDesignNumber(lotStatusData, parsed?.dNo);

      if (!dNo) {
        showBillScanMultipleToast("error", "Design not found for scanned lot.");
        return;
      }

      const designRes = await fetchWithScanCache(`design:${dNo}`, () =>
        getDesignByNumber(dNo)
      );
      const designData = designRes?.data ?? designRes;
      const designId = designData?._id || "";

      const validation = validateLotForSelectedScanProcess({
        lotStatusData,
        designData,
        selectedProcessName: selectedProcess?.processName || "billscan",
      });

      if (!validation.allowed) {
        showBillScanMultipleToast("error", validation.errorMessage);
        return;
      }

      const fetchedLotData = extractRcDetailsFromLotStatus(lotStatusData);
      fetchedLotData.pic = Number(lotStatusData.pic ?? parsed.pic ?? 0);

      if (
        fetchedLotData.rcPic === 0 &&
        fetchedLotData.pic > 0 &&
        (fetchedLotData.alter > 0 || fetchedLotData.reject > 0)
      ) {
        fetchedLotData.rcPic =
          fetchedLotData.pic - fetchedLotData.alter - fetchedLotData.reject;
      }

      const processPrice =
        designData?.processes?.find(
          (p) =>
            p.processName?.toLowerCase() ===
            selectedProcess?.processName?.toLowerCase()
        )?.price || 0;

      const scanWithDetails = {
        ...parsed,
        lotNo: resolvedLotNo,
        dNo: resolveLotDesignNumber(lotStatusData, parsed.dNo || ""),
        size: lotStatusData.size || parsed.size || "",
        color: lotStatusData.colour || lotStatusData.color || parsed.color || parsed.colour || "",
        pic: fetchedLotData.pic,
        price: processPrice,
        processId: designId || parsed.id || parsed.processId || "",
        alter: fetchedLotData.alter,
        reject: fetchedLotData.reject,
        rcPic: fetchedLotData.rcPic >= 0 ? fetchedLotData.rcPic : 0,
        dashboardDataId: parsed.id || parsed.dashboardDataId || lotStatusData._id || "",
      };

      setScannedResults((prev) => [...prev, JSON.stringify(scanWithDetails)]);
      showBillScanMultipleToast(
        "success",
        `Lot ${resolvedLotNo} added`,
        `billscan-lot-added-${resolvedLotNo}`
      );
    } catch (err) {
      console.error("SCAN READ ERROR ::", err);
      showBillScanMultipleToast(
        "error",
        err?.message || "Failed to scan lot. Please try again."
      );
    } finally {
      closeQrModal();
    }
  }, [scannedResults, selectedProcess]);

  const handleRemoveByLotNo = (lotNo) => {
    setScannedResults(prev =>
      prev.filter(item => {
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
        disabled={!selectedCompany || scannedResults.length === 0 || isLoading}
      />
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Multiple Bill Scan" footerContent={footerContent} size={size}>
      <div className="p-4 space-y-4">
        <SelectElement
          name="Company"
          options={companies.map(company => ({
            value: company._id,
            label: company.name
          }))}
          value={selectedCompany}
          onChange={(val) => {
            setSelectedCompany(val);
            if (companyError) setCompanyError('');
          }}
          placeholder="Select Company"
          isClearable={false}
          is_required={true}
          className="w-full"
          menuPortalTarget={document.body}
          isLoading={isLoadingCompanies}
          error={companyError}
        />

        {scannedResults.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto border border-gray-200">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Scanned Items ({scannedResults.length})</h3>
            <div className="space-y-2">
              {scannedResults.map((res, i) => {
                const p = typeof res === "string" ? JSON.parse(res) : res;
                const totalPic = Number(p.pic || 0);
                const alter = Number(p.alter || 0);
                const reject = Number(p.reject || 0);
                const rcPic = p.rcPic !== undefined ? p.rcPic : (totalPic - alter - reject);

                return (
                  <div key={i} className="bg-white p-3 rounded border border-gray-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <div className="text-sm">
                        <span className="font-bold text-gray-900">{i + 1}. Lot: {p.lotNo}</span>
                        <span className="ml-2 text-gray-500 text-xs">({p.dNo}, {p.color}, {p.size})</span>
                      </div>
                      <Trash2 
                        size={18} 
                        className="text-red-500 cursor-pointer hover:text-red-700 transition-colors" 
                        onClick={() => handleRemoveByLotNo(p.lotNo)} 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div><span className="text-gray-500 font-medium">Total Pcs:</span> <span className="font-semibold">{totalPic}</span></div>
                      <div>
                        <span className="text-gray-500 font-medium">RC Pcs:</span>{' '}
                        <span style={{ color: rcPic === totalPic ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                          {rcPic >= 0 ? rcPic : 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Alter:</span>{' '}
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                          {alter ?? '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Reject:</span>{' '}
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                          {reject ?? '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button 
          variant="outline"
          label={scannedResults.length > 0 ? "Scan More" : "Scan QR Code"} 
          icon={<QrCode size={20} />}
          onClick={handleOpenQrModal} 
          className="w-full" 
        />
      </div>

      {/* QR Scanner Modal */}
      <Modal isOpen={isQrModalOpen} onClose={handleCloseQrModal} title="Scan QR" size="lg">
        <QrReader onScan={handleQrScan} />
      </Modal>
    </Modal>
  );
};

export default MultipleBillScanQrDetailsModal;
