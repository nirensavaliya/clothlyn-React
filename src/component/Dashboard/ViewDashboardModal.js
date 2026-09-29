import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Modal from '../common/Modal';
import { formatDate, formatEmployeeDisplayWithCode, formatMasterWithOptionalCode, resolveDashboardLotRecord } from '../../helpers/utils';
import Button from '../common/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getDashboardById } from '../../apis/dashboardApi';

const BASE_URL = process.env.REACT_APP_BASE_URL;

const ViewDashboardModal = ({ isOpen, onClose, dashboardItem }) => {
  const [isEmployeeDetailsOpen, setIsEmployeeDetailsOpen] = useState(true);
  const [fullDashboardItem, setFullDashboardItem] = useState(null);
  const [loadedStickerPhoto, setLoadedStickerPhoto] = useState(null);

  // List/search API omits schand_ProcessDetails (and RC sticker photo). Fetch full lot when modal opens.
  useEffect(() => {
    if (!isOpen || !dashboardItem) {
      setFullDashboardItem(null);
      setLoadedStickerPhoto(null);
      return;
    }

    const lookupKey = dashboardItem._id || dashboardItem.lotNo;
    if (!lookupKey) {
      setFullDashboardItem(dashboardItem);
      return;
    }

    let cancelled = false;
    // Keep showing list data until full detail arrives (avoid content flash).
    getDashboardById(lookupKey)
      .then((res) => {
        if (cancelled) return;
        const record = resolveDashboardLotRecord(res);
        setFullDashboardItem(record ? { ...dashboardItem, ...record } : dashboardItem);
      })
      .catch(() => {
        if (!cancelled) setFullDashboardItem(dashboardItem);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, dashboardItem?._id, dashboardItem?.lotNo]);

  // RC sticker photo: prefer base64 from /api/rc-process/lot (uploads/*.jpg often 404 on host).
  useEffect(() => {
    if (!isOpen || !dashboardItem) {
      setLoadedStickerPhoto(null);
      return;
    }

    const lotNo = dashboardItem.lotNo;
    if (!lotNo || !BASE_URL) {
      setLoadedStickerPhoto(null);
      return;
    }

    let cancelled = false;
    setLoadedStickerPhoto(null);

    (async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/rc-process/lot/${encodeURIComponent(lotNo)}`);
        const rows = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : [];
        const photo = rows
          .map((r) => r?.stickerPhoto)
          .find((sp) => typeof sp === 'string' && sp.startsWith('data:image'));
        if (!cancelled && photo) {
          setLoadedStickerPhoto(photo);
        }
      } catch {
        // No RC scan / photo for this lot — leave empty.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, dashboardItem?.lotNo]);

  const safeDashboardItem = fullDashboardItem || dashboardItem || null;

  const parseProcessDetails = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Merge both sources because one endpoint may return only current process rows
  const processDetails = useMemo(() => {
    const fromDashboardItem = parseProcessDetails(safeDashboardItem?.schand_ProcessDetails);
    const merged = [...fromDashboardItem];

    const seen = new Set();
    return merged.filter((rec, idx) => {
      const key = String(
        rec?._id ||
        `${rec?.processId || ''}-${rec?.model || ''}-${rec?.createdAt || ''}-${idx}`
      );
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [safeDashboardItem?.schand_ProcessDetails]);

  // Map processId -> processName from available row payload
  const processIdToName = useMemo(() => {
    const map = new Map();
    const procs =
      safeDashboardItem?.designDetails?.processes ||
      safeDashboardItem?.processes ||
      [];
    (Array.isArray(procs) ? procs : []).forEach((p) => {
      const id = String(p?._id || '').trim();
      const name = String(p?.processName || '').toLowerCase();
      if (id && name) map.set(id, name);
    });
    return map;
  }, [safeDashboardItem]);

  const getProcessIdValue = (rec) => {
    if (!rec?.processId) return '';
    if (typeof rec.processId === 'string') return rec.processId;
    return rec.processId?._id || '';
  };

  // Enrich each schand_ProcessDetails record with resolvedProcessName (by processId) if model is missing
  const resolvedProcessDetails = useMemo(() => {
    return (Array.isArray(processDetails) ? processDetails : []).map((rec) => {
      let resolved = String(rec?.model || '').toLowerCase();
      if (!resolved) {
        const pid = String(getProcessIdValue(rec) || '').trim();
        const fromMap = (pid && processIdToName.get(pid)) || '';
        resolved = fromMap || resolved;
      }
      return { ...rec, _resolvedProcessName: resolved };
    });
  }, [processDetails, processIdToName]);

  const isObjectIdString = (v) => typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v);

  const formatEmployeeName = (emp) => {
    if (!emp) return "-";
    if (typeof emp === "string") return isObjectIdString(emp) ? "-" : emp.trim() || "-";
    return formatEmployeeDisplayWithCode(emp);
  };

  const formatScanDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year}/${hours}:${minutes}`;
  };

  const designProcesses = useMemo(() => {
    const procs = safeDashboardItem?.designDetails?.processes || safeDashboardItem?.processes || [];
    return Array.isArray(procs) ? procs : [];
  }, [safeDashboardItem]);

  const getByModel = (modelName) => {
    const target = String(modelName || '').toLowerCase();
    if (!target) return null;
    // Try model first
    const byModelExact = resolvedProcessDetails.find((x) => String(x?.model || '').toLowerCase() === target);
    if (byModelExact) return byModelExact;
    const byModelIncludes = resolvedProcessDetails.find((x) => String(x?.model || '').toLowerCase().includes(target));
    if (byModelIncludes) return byModelIncludes;
    // Then try resolved name from processId -> processName
    const byResolvedExact = resolvedProcessDetails.find((x) => String(x?._resolvedProcessName || '').toLowerCase() === target);
    if (byResolvedExact) return byResolvedExact;
    return resolvedProcessDetails.find((x) => String(x?._resolvedProcessName || '').toLowerCase().includes(target));
  };

  const cleanMachineName = (name) => String(name || "").replace(/\s+\d+$/, "").trim().toLowerCase();

  const pickMachineEmployee = (record, machineNameIncludes) => {
    const list = Array.isArray(record?.machineEmployees) ? record.machineEmployees : [];
    const needle = String(machineNameIncludes || '').toLowerCase();
    return list.find((me) => cleanMachineName(me?.machineName || me?.machineId?.machineName).includes(needle));
  };

  const getMachineRowsFromRecord = (record) => {
    const list = Array.isArray(record?.machineEmployees) ? record.machineEmployees : [];
    return list
      .map((me, idx) => {
        const machineLabel = (me?.machineName || me?.machineId?.machineName || '').toString();
        const machine = machineLabel ? machineLabel.replace(/\s+\d+$/, '').trim() : `Machine ${idx + 1}`;
        const name = formatEmployeeName(me?.employeeId);
        const date = formatScanDate(me?.updatedAt || me?.createdAt || record?.updatedAt || record?.createdAt);
        const scannedBy = formatEmployeeName(me?.scannedBy || record?.scannedBy);
        return { label: machine, name, date, scannedBy };
      })
      .filter((r) => r.label);
  };

  const getMachineNameAndDate = ({ record, machineNeedle, legacyKeys = [] }) => {
    // 1) Prefer machineEmployees (new payload)
    const me = pickMachineEmployee(record, machineNeedle);
    if (me) {
      return {
        name: formatEmployeeName(me?.employeeId),
        date: formatScanDate(me?.updatedAt || me?.createdAt || record?.updatedAt || record?.createdAt),
        scannedBy: formatEmployeeName(me?.scannedBy || record?.scannedBy),
      };
    }

    // 2) Legacy keys fallback (old payload)
    for (const k of legacyKeys) {
      const v = record?.[k];
      if (v) {
        return {
          name: formatEmployeeName(v),
          date: formatScanDate(record?.updatedAt || record?.createdAt),
          scannedBy: formatEmployeeName(record?.scannedBy),
        };
      }
    }

    return { name: "-", date: "-", scannedBy: "-" };
  };

  const loadingRecord = getByModel("loading") || getByModel("LoadingProcess");
  const rcRecordFull = getByModel("rc") || getByModel("RcProcess");

  // Legacy support: some payloads stored separate rows for rc machines
  const singleLegacyItem = processDetails.find(x => x?.singleName || x?.single);
  const kansaiLegacyItem = processDetails.find(x => x?.kansaiName || x?.kansai);
  const fatlockLegacyItem = processDetails.find(x => x?.fatlockName || x?.fatlock);
  const fourThreadLegacyItem = processDetails.find(x => x?.fourThreadName || x?.fourThread || x?.forThreadName || x?.forThread);

  const doracutItem = getByModel("doracut") || getByModel("DoracutProcess") || resolvedProcessDetails.find(x => x?.doracut);
  const pressItem = getByModel("press") || getByModel("PressProcess") || resolvedProcessDetails.find(x => x?.press);
  const packingItem = getByModel("packing") || getByModel("PackingProcess") || resolvedProcessDetails.find(x => x?.packing);
  const checkingItem = getByModel("checking") || getByModel("CheckingProcess") || resolvedProcessDetails.find(x => x?.checking);
  const logoItem = getByModel("logo") || getByModel("LogoProcess") || resolvedProcessDetails.find(x => x?.logo);
  const billscanItem = getByModel("billscan") || getByModel("BillscanProcess") || resolvedProcessDetails.find(x => x?.billScan);

  const dynamicRows = useMemo(() => {
    const processEmployeeList = Array.isArray(safeDashboardItem?.schandProcessEmployee)
      ? safeDashboardItem.schandProcessEmployee
      : [];

    // Prefer new API response object for employee/process details.
    if (processEmployeeList.length > 0) {
      return processEmployeeList.map((item, idx) => {
        const processLabel = String(item?.processName || '').trim() || `Process ${idx + 1}`;
        const employeeName = String(item?.employeeName || '').trim();
        const employeeCode = String(item?.employeeCode || '').trim();
        const scanDate = item?.scanDate ? formatScanDate(item.scanDate) : '-';
        const scanBy = String(item?.scanBy || item?.ScanBy || '').trim() || '-';
        const value = employeeName && employeeCode
          ? `${employeeName} (${employeeCode})`
          : (employeeName || employeeCode || '-');
        return {
          type: 'row',
          label: processLabel,
          name: value,
          date: scanDate,
          scannedBy: scanBy,
        };
      });
    }

    // Build an ordered list (design wise) and include ONLY completed processes (present in schand_ProcessDetails)
    const rows = [];

    const procOrder = (Array.isArray(designProcesses) ? designProcesses : [])
      .slice()
      .sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0))
      .map((p) => String(p?.processName || '').toLowerCase());

    const pushProcessHeader = () => {};

    const pushRow = (label, name, date, scannedBy) => {
      rows.push({ type: 'row', label, name, date, scannedBy });
    };

    const addLoading = () => {
      if (loadingRecord?.machineEmployees?.length > 0) {
        pushProcessHeader('Loading');
        getMachineRowsFromRecord(loadingRecord).forEach((r) => pushRow(r.label, r.name, r.date, r.scannedBy));
        return true;
      }
      // legacy: for-thread stored as separate record
      if (fourThreadLegacyItem) {
        pushProcessHeader('Loading');
        const v = getMachineNameAndDate({
          record: fourThreadLegacyItem,
          machineNeedle: "thread",
          legacyKeys: ["fourThreadName", "fourThread", "forThreadName", "forThread", "employeeId", "user"],
        });
        pushRow('For Thread', v.name, v.date, v.scannedBy);
        return true;
      }
      return false;
    };

    const addRc = () => {
      if (rcRecordFull?.machineEmployees?.length > 0) {
        pushProcessHeader('RC');
        getMachineRowsFromRecord(rcRecordFull).forEach((r) => pushRow(r.label, r.name, r.date, r.scannedBy));
        return true;
      }

      const anyLegacy = singleLegacyItem || kansaiLegacyItem || fatlockLegacyItem;
      if (anyLegacy) {
        pushProcessHeader('RC');
        const s = getMachineNameAndDate({ record: singleLegacyItem, machineNeedle: "single", legacyKeys: ["singleName", "single"] });
        const k = getMachineNameAndDate({ record: kansaiLegacyItem, machineNeedle: "kansai", legacyKeys: ["kansaiName", "kansai"] });
        const f = getMachineNameAndDate({ record: fatlockLegacyItem, machineNeedle: "fat", legacyKeys: ["fatlockName", "fatlock", "fatLockName", "fatLock"] });
        if (singleLegacyItem) pushRow('Single', s.name, s.date, s.scannedBy);
        if (kansaiLegacyItem) pushRow('Kansai', k.name, k.date, k.scannedBy);
        if (fatlockLegacyItem) pushRow('FatLock', f.name, f.date, f.scannedBy);
        return true;
      }
      return false;
    };

    const addSimpleProcess = (title, item, empPickKeys = []) => {
      if (!item) return false;
      const emp = empPickKeys.reduce((acc, k) => acc ?? item?.[k], null) || item?.user || item?.employeeId;
      pushProcessHeader(title);
      pushRow(title, formatEmployeeName(emp), formatScanDate(item?.updatedAt || item?.createdAt), formatEmployeeName(item?.scannedBy));
      return true;
    };

    // Always enforce: Loading first, then RC, then design-wise others.
    addLoading();
    addRc();

    const already = new Set(['loading', 'rc']);
    const rest = (procOrder.length > 0 ? procOrder : [])
      .filter((p) => p && !already.has(p));

    // Map design name -> record
    const byName = {
      doracut: doracutItem,
      press: pressItem,
      packing: packingItem,
      checking: checkingItem,
      logo: logoItem,
      billscan: billscanItem,
    };

    rest.forEach((p) => {
      const key = p.toLowerCase();
      if (key === 'doracut') addSimpleProcess('Dora Cut', byName.doracut, ['doracut']);
      else if (key === 'press') addSimpleProcess('Press', byName.press, ['press']);
      else if (key === 'packing') addSimpleProcess('Packing', byName.packing, ['packing']);
      else if (key === 'checking') addSimpleProcess('Checking', byName.checking, ['checking']);
      else if (key === 'logo') addSimpleProcess('Logo', byName.logo, ['logo']);
      else if (key === 'billscan') addSimpleProcess('Billscan', byName.billscan, ['billScan', 'billscan']);
    });

    // If design processes not loaded, still show any completed non-loading/rc processes (but only those that exist)
    if (rest.length === 0) {
      addSimpleProcess('Dora Cut', doracutItem, ['doracut']);
      addSimpleProcess('Logo', logoItem, ['logo']);
      addSimpleProcess('Press', pressItem, ['press']);
      addSimpleProcess('Packing', packingItem, ['packing']);
      addSimpleProcess('Checking', checkingItem, ['checking']);
      addSimpleProcess('Billscan', billscanItem, ['billScan', 'billscan']);
    }

    // Remove empty headers (header not followed by row)
    const cleaned = [];
    for (let i = 0; i < rows.length; i++) {
      const item = rows[i];
      if (item.type === 'header') {
        const next = rows[i + 1];
        if (next && next.type === 'row') cleaned.push(item);
      } else {
        cleaned.push(item);
      }
    }

    return cleaned;
  }, [
    designProcesses,
    loadingRecord,
    rcRecordFull,
    doracutItem,
    pressItem,
    packingItem,
    checkingItem,
    logoItem,
    billscanItem,
    singleLegacyItem,
    kansaiLegacyItem,
    fatlockLegacyItem,
    fourThreadLegacyItem,
  ]);

  if (!safeDashboardItem) return null;

  // Use exact RC process values (no client-side totals/summing)
  const rcCandidates = (resolvedProcessDetails || []).filter((x) => {
    const resolved = String(x?._resolvedProcessName || '').toLowerCase();
    const model = String(x?.model || '').toLowerCase();
    return resolved === 'rc' || resolved.includes('rc') || model.includes('rc');
  });
  const rcRecord = rcCandidates
    .slice()
    .sort((a, b) => new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0))[0]
    || resolvedProcessDetails?.find(x => x?.rcPic !== undefined || x?.alter !== undefined || x?.reject !== undefined);

  const pickMetric = (...values) => {
    for (const value of values) {
      if (value === 0 || value === '0') return value;
      if (value !== undefined && value !== null && String(value).trim() !== '') return value;
    }
    return 0;
  };

  const alterPic = pickMetric(safeDashboardItem?.alter, rcRecord?.alter);
  const rejectPic = pickMetric(safeDashboardItem?.reject, rcRecord?.reject);
  const rcPicValue = pickMetric(safeDashboardItem?.rcPic, rcRecord?.rcPic);

  // Determine colors for RC, Alter, Reject
  const pic = Number(safeDashboardItem.pic) || 0;
  const rcVal = Number(rcPicValue) || 0;
  let rcPicColor = '#4b5563'; // gray-600 default
  if (rcPicValue !== "-" && pic > 0) {
    rcPicColor = (rcVal === pic ? '#16a34a' : '#dc2626');
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dashboard Item Details"
      size="4xl"
      footerContent={
        <Button
          variant="outline"
          size="medium"
          label="Close"
          onClick={onClose}
        />
      }
    >
      <div className="p-4 space-y-4 text-base bg-[#F9F6F1]">
        {/* ---------- RC STICKER PHOTO (above LotNo) ---------- */}
        {loadedStickerPhoto && (
          <div className="flex justify-center pb-2">
            <img
              src={loadedStickerPhoto}
              alt="RC Sticker"
              className="w-full max-w-[420px] max-h-[360px] object-contain rounded border border-gray-200"
            />
          </div>
        )}

        {/* ---------- LOT HEADER ---------- */}
        <div className="flex text-left pb-2">
          <span className="text-base font-medium mr-1">LotNo:</span>
          <span className="text-base font-bold underline">{safeDashboardItem?.lotNo || '-'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-4 border-b border-gray-100">
          <DetailRow label="D. No" value={safeDashboardItem?.dNo} />
          <DetailRow label="Layer" value={safeDashboardItem?.layer} />
          <DetailRow label="Color" value={safeDashboardItem?.colour} />
          <DetailRow label="Size" value={safeDashboardItem?.size} />
          <DetailRow label="Pic" value={safeDashboardItem?.pic} />
          <DetailRow label="Date" value={formatDate(safeDashboardItem?.date)} />
          <DetailRow
            label="Master"
            value={formatMasterWithOptionalCode(safeDashboardItem?.master, safeDashboardItem?.masterEmployee)}
          />
          <DetailRow
            label="Status"
            noWrapValue
            value={`${(safeDashboardItem?.currentStatus || safeDashboardItem?.status || '-')}`}
          />
        </div>

        {/* ---------- SUMMARY SECTION (Moved above Employee Details) ---------- */}
        <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-gray-50 rounded-lg font-bold text-gray-800 border border-gray-100">
          <div className="text-center">
            <p className="text-gray-500 text-[12px] uppercase tracking-wider mb-1">RC Pic</p>
            <p className="text-xl font-black" style={{ color: rcPicColor }}>{rcPicValue}</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <p className="text-gray-500 text-[12px] uppercase tracking-wider mb-1">Alter</p>
            <p className="text-xl font-black" style={{ color: '#dc2626' }}>{alterPic}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-[12px] uppercase tracking-wider mb-1">Reject</p>
            <p className="text-xl font-black" style={{ color: '#dc2626' }}>{rejectPic}</p>
          </div>
        </div>

        {/* ---------- USER/EMPLOYEE DETAILS ACCORDION ---------- */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div 
            className="flex items-center justify-between p-3 bg-gray-50/50 cursor-pointer border-b border-gray-200"
            onClick={() => setIsEmployeeDetailsOpen(!isEmployeeDetailsOpen)}
          >
            <h3 className="font-bold text-gray-700 text-base">User/Employee Details</h3>
            {isEmployeeDetailsOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
          </div>

          {isEmployeeDetailsOpen && (
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {dynamicRows.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No employee scan details available.</div>
              ) : (
                dynamicRows.map((row, idx) => {
                  if (row.type === 'header') {
                    return (
                      <div key={`h-${idx}`} className="px-3 py-2 bg-gray-50 text-[13px] font-black text-gray-700 tracking-wide">
                        {row.label}
                      </div>
                    );
                  }
                  return (
                    <div key={`r-${idx}`} className="p-3 md:px-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <div className="flex items-center gap-1 min-w-0 whitespace-nowrap">
                          <span className="text-gray-500 font-medium text-[13px] shrink-0">{row.label}:</span>
                          <span className="font-bold text-gray-900 text-[15px] truncate">{row.name || "-"}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 min-w-0 whitespace-nowrap">
                          <span className="text-gray-500 font-medium text-[13px] shrink-0">Scan Date:</span>
                          <span className="text-gray-600 font-bold text-[14px] truncate">{row.date || "-"}</span>
                        </div>
                        <div className="flex items-center justify-end gap-1 min-w-0 whitespace-nowrap">
                          <span className="text-gray-500 font-medium text-[13px] shrink-0">Scanned By:</span>
                          <span className="text-gray-600 font-bold text-[14px] truncate">{row.scannedBy || "-"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
};

const DetailRow = ({ label, value, noWrapValue = false }) => (
  <div className={`flex items-center text-[15px] shrink-0 ${noWrapValue ? 'whitespace-nowrap' : ''}`}>
    <span className="font-bold text-gray-800">{label}:</span>
    <span className={`text-gray-700 ml-1 font-semibold ${noWrapValue ? 'whitespace-nowrap' : ''}`}>{value || "-"}</span>
  </div>
);

export default ViewDashboardModal;


// import React from 'react';
// import Modal from '../common/Modal';
// import { formatDate, lowercase } from '../../helpers/utils';
// import Status from '../common/Status';
// import Button from '../common/Button';

// const ViewDashboardModal = ({ isOpen, onClose, dashboardItem }) => {
  
//   if (!dashboardItem) return null;
//    const formatEmployeeName = (emp) => {
//       if (!emp) return "-";
//       if (typeof emp === "string") return emp;

//       const code = emp.employeeName || "";
//       const first = emp.firstName || "";
//       const last = emp.lastName || "";

//       return `${code} - ${first} ${last}`.trim();
//     };
//     const singleItem = dashboardItem?.schand_ProcessDetails?.find(x => x.singleName || x.single);
//     const kansaiItem = dashboardItem?.schand_ProcessDetails?.find(x => x.kansaiName || x.kansai);
//     const fatlockItem = dashboardItem?.schand_ProcessDetails?.find(x => x.fatlockName || x.fatlock);
//     const fourThreadItem = dashboardItem?.schand_ProcessDetails?.find(x => x.fourThreadName || x.employeeId);
//   // console.log("------->", dashboardItem)
//     const detailItems = [
//       { label: 'Date', value: dashboardItem.date ? formatDate(dashboardItem.date) : '-' },
//       { label: 'Lot Number', value: dashboardItem.lotNo || '-' },
//       { label: 'D. Number', value: dashboardItem.dNo || '-' },
//       { label: 'Color', value: dashboardItem.colour || '-' },
//       { label: 'Size', value: dashboardItem.size || '-' },
//       { label: 'Layer', value: dashboardItem.layer || '-' },
//       { label: 'Pic', value: dashboardItem.pic || '-' },

//       // Fixed employee fields
//       { label: 'For-Thread', value: fourThreadItem?.fourThreadName || formatEmployeeName(fourThreadItem?.employeeId) },
//       { label: 'Single', value: singleItem?.singleName || formatEmployeeName(singleItem?.single) },
//       { label: 'Fat Lock', value: fatlockItem?.fatlockName || formatEmployeeName(fatlockItem?.fatlock) },
//       { label: 'Kansai', value: kansaiItem?.kansaiName || formatEmployeeName(kansaiItem?.kansai) },
//       { label: 'Rc Pic', value: dashboardItem?.schand_ProcessDetails?.find(x => x?.rcPic)?.rcPic || "-"},
//       { label: 'Alter Pic', value: dashboardItem?.schand_ProcessDetails?.find(x => x?.alter)?.alter || "-"},
//       { label: 'Reject Pic', value: dashboardItem?.schand_ProcessDetails?.find(x => x?.reject)?.reject || "-"},

//       { label: 'Master', value: dashboardItem.master || '-' },

//       {
//         label: 'Status',
//         customRender: dashboardItem.status ? <Status status={lowercase(dashboardItem.status)} /> : '-'
//       }
//     ];


//   return (
//     <Modal
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Dashboard Item Details"
//       size="xl"
//       footerContent={
//         <Button
//           variant="outline"
//           size="medium"
//           label="Close"
//           onClick={onClose}
//           className="focus:!ring-0"
//         />
//       }
//     >
//       {/* <div className="p-6 grid grid-cols-3 gap-x-6 gap-y-8"> */}
//       <div className="p-6 grid grid-cols-3 gap-x-6 gap-y-8">


//         {detailItems.map((item, index) => (
//           <div key={index} className='text-start'>
//             <p className="font-semibold text-gray-800">{item.label}</p>
//             <p className="text-gray-600">{item.customRender || item.value}</p>
//           </div>
//         ))}

//         {dashboardItem.barcode && (
//           <div>
//             <p className="font-semibold text-gray-800">Barcode</p>
//             <p className="text-gray-600 font-mono">{dashboardItem.barcode}</p>
//           </div>
//         )}

//         {dashboardItem.description && (
//           <div>
//             <p className="font-semibold text-gray-800">Description</p>
//             <p className="text-gray-600">{dashboardItem.description}</p>
//           </div>
//         )}
//       </div>
//     </Modal>
//   );
// };

// export default ViewDashboardModal;   
