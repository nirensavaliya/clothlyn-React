import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import InputElement from '../common/InputElement';
import SelectElement from '../common/Select';
import { toast } from 'react-toastify';
import Button from '../common/Button';
import LoaderComponent from '../common/Loader';
import { getEmployees } from '../../apis/employeeApi';
import { getUniqueColors, getUniqueSizes } from '../../apis/dashboardApi';
import { getCanonicalScanStatus, mapEmployeeToSelectOption } from '../../helpers/utils';

const normalizeProcessName = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Map trail labels (e.g. "Doracut Received") to Process master name for employee API. */
const resolveEmployeeApiProcessName = (processName) => {
  const canonical = getCanonicalScanStatus(processName);
  if (canonical && canonical !== 'Complete') {
    return String(canonical).toLowerCase().replace(/\s+/g, '');
  }
  return normalizeProcessName(processName);
};

/** "Forthread1" / "Forthread 2" → "Forthread" so all sibling machines match. */
const toMachineBaseName = (name) =>
  String(name || '')
    .trim()
    .replace(/\s*\d+$/, '');

const mergeEmployeeOptions = (...lists) => {
  const map = new Map();
  lists.flat().forEach((opt) => {
    if (opt?.value == null || opt.value === '') return;
    map.set(String(opt.value), opt);
  });
  return [...map.values()];
};

const scalarForCompare = (v) =>
  v === null || v === undefined ? '' : String(v).trim();

const stableJson = (obj) => JSON.stringify(obj);

const normalizeMachineEmployeesForCompare = (arr) =>
  [...(arr || [])]
    .map((m) => ({
      machineName: String(m.machineName || ''),
      employeeId: String(m.employeeId || ''),
    }))
    .sort(
      (a, b) =>
        a.machineName.localeCompare(b.machineName) ||
        a.employeeId.localeCompare(b.employeeId)
    );

const normalizeProcessEmployeesForCompare = (arr) =>
  [...(arr || [])]
    .map((p) => ({
      p: normalizeProcessName(p.processName),
      id: String(p.employeeId || ''),
    }))
    .sort((a, b) => a.p.localeCompare(b.p) || a.id.localeCompare(b.id));

/** Normalized process name → top-level API field (matches Update Item form). */
const PROCESS_EMPLOYEES_SCALAR_BODY_KEYS = {
  doracut: 'doracut',
  press: 'press',
  packing: 'packing',
  checking: 'checking',
  logo: 'logo',
  billscan: 'billscan',
};

const groupProcessEmployeeIdsByNorm = (arr) => {
  const m = new Map();
  for (const e of arr || []) {
    const k = normalizeProcessName(e.processName);
    if (!k) continue;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(String(e.employeeId || ''));
  }
  for (const ids of m.values()) ids.sort();
  return m;
};

const getChangedProcessNormKeys = (initialPE, currentPE) => {
  const initM = groupProcessEmployeeIdsByNorm(initialPE);
  const currM = groupProcessEmployeeIdsByNorm(currentPE);
  const keys = new Set([...initM.keys(), ...currM.keys()]);
  const changed = [];
  for (const k of keys) {
    if (stableJson(initM.get(k) || []) !== stableJson(currM.get(k) || [])) {
      changed.push(k);
    }
  }
  return changed;
};

/** If only one machine row changed, send only that row (current shape). */
const minimizeMachineEmployeesField = (fieldKey, initial, current, payload) => {
  if (!payload[fieldKey]) return payload;
  const initArr = initial[fieldKey] || [];
  const currArr = current[fieldKey] || [];
  const mapEmp = (arr) => {
    const m = new Map();
    for (const row of arr) {
      m.set(String(row.machineName || ''), String(row.employeeId || ''));
    }
    return m;
  };
  const im = mapEmp(initArr);
  const cm = mapEmp(currArr);
  const changedNames = [];
  for (const [name, cid] of cm) {
    if ((im.get(name) || '') !== cid) changedNames.push(name);
  }
  for (const [name] of im) {
    if (!cm.has(name)) changedNames.push(name);
  }
  const uniq = [...new Set(changedNames)];
  if (uniq.length !== 1) return payload;
  const only = uniq[0];
  const out = { ...payload };
  out[fieldKey] = currArr.filter((row) => String(row.machineName || '') === only);
  return out;
};

/**
 * processEmployees: if exactly one process group changed —
 * - known process → single body field, e.g. { press: id }
 * - custom (e.g. Singal) → processEmployees with only those rows
 */
const minimizeProcessEmployeesPayload = (initial, current, payload) => {
  if (!payload.processEmployees) return payload;

  const changed = getChangedProcessNormKeys(
    initial.processEmployees,
    current.processEmployees
  );
  if (changed.length !== 1) return payload;

  const onlyNorm = changed[0];
  const currRowsForProcess = (current.processEmployees || []).filter(
    (e) => normalizeProcessName(e.processName) === onlyNorm
  );
  const currIds = [
    ...new Set(currRowsForProcess.map((e) => String(e.employeeId || '').trim()).filter(Boolean)),
  ];

  const bodyKey = PROCESS_EMPLOYEES_SCALAR_BODY_KEYS[onlyNorm];
  const out = { ...payload };
  delete out.processEmployees;

  if (bodyKey) {
    if (currIds.length > 1) {
      out.processEmployees = current.processEmployees;
      return out;
    }
    out[bodyKey] = currIds.length === 1 ? currIds[0] : null;
    return out;
  }

  out.processEmployees = currRowsForProcess;
  return out;
};

const buildPartialDashboardPayload = (initial, current) => {
  if (!initial || !current) return current ? { ...current } : {};

  const payload = {};
  const scalars = [
    'dNo',
    'colour',
    'size',
    'layer',
    'master',
    'doracut',
    'press',
    'packing',
    'checking',
    'logo',
    'billscan',
    'rcPic',
    'alter',
    'reject',
    'pic',
  ];
  for (const key of scalars) {
    if (scalarForCompare(initial[key]) !== scalarForCompare(current[key])) {
      payload[key] = current[key];
    }
  }

  if (
    stableJson(normalizeMachineEmployeesForCompare(initial.loadingMachineEmployees)) !==
    stableJson(normalizeMachineEmployeesForCompare(current.loadingMachineEmployees))
  ) {
    payload.loadingMachineEmployees = current.loadingMachineEmployees;
  }
  if (
    stableJson(normalizeMachineEmployeesForCompare(initial.rcMachineEmployees)) !==
    stableJson(normalizeMachineEmployeesForCompare(current.rcMachineEmployees))
  ) {
    payload.rcMachineEmployees = current.rcMachineEmployees;
  }

  if (
    stableJson(normalizeProcessEmployeesForCompare(initial.processEmployees)) !==
    stableJson(normalizeProcessEmployeesForCompare(current.processEmployees))
  ) {
    payload.processEmployees = current.processEmployees;
  }

  let out = { ...payload };
  out = minimizeMachineEmployeesField(
    'loadingMachineEmployees',
    initial,
    current,
    out
  );
  out = minimizeMachineEmployeesField('rcMachineEmployees', initial, current, out);
  out = minimizeProcessEmployeesPayload(initial, current, out);
  return out;
};

const UpdateDashboardForm = ({
  isOpen,
  onClose,
  onUpdate,
  dashboardItem,
  colors,
  sizes
}) => {
  const [formData, setFormData] = useState({
    loadingMachineEmployees: [],
    rcMachineEmployees: [],
    processEmployees: []
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [localColors, setLocalColors] = useState([]);
  const [localSizes, setLocalSizes] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState({
    doracut: [],
    checking: [],
    machineEmployees: {} // Store employees by machine name
  });
  /** Options per schandProcessEmployee row — employees assigned to that process only */
  const [employeesByAssignedProcess, setEmployeesByAssignedProcess] = useState({});
  const [loadingAssignedProcessEmployees, setLoadingAssignedProcessEmployees] =
    useState(false);
  const initialFormSnapshotRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setEmployeesByAssignedProcess({});
      setLoadingAssignedProcessEmployees(false);
      return;
    }
    if (!dashboardItem) return;

    const list = Array.isArray(dashboardItem.schandProcessEmployee)
      ? dashboardItem.schandProcessEmployee
      : [];
    const uniqueNames = [
      ...new Set(
        list.map((e) => String(e?.processName || "").trim()).filter(Boolean)
      ),
    ];

    if (uniqueNames.length === 0) {
      setEmployeesByAssignedProcess({});
      return;
    }

    let cancelled = false;
    const toOptions = (data) =>
      (data || []).map((emp) =>
        mapEmployeeToSelectOption(emp, {
          extra: {
            employeeName: String(emp.nickname || emp.firstName || emp.username || '').trim(),
          },
        })
      );

    (async () => {
      setLoadingAssignedProcessEmployees(true);
      try {
        const mapEntries = await Promise.all(
          uniqueNames.map(async (processName) => {
            const key = normalizeProcessName(processName);
            const apiProcessName = resolveEmployeeApiProcessName(processName);
            const machineBase = toMachineBaseName(processName);
            try {
              let res = await getEmployees({
                limit: 1000,
                processName: apiProcessName || processName,
              });
              let opts = toOptions(res.data);

              // Loading/RC trail stores machine name as processName (Forthread, Singal…).
              // Fetch by machine base so Forthread1/2/3 employees all appear.
              if (machineBase) {
                const machineRes = await getEmployees({
                  limit: 1000,
                  machineName: machineBase,
                }).catch(() => ({ data: [] }));
                opts = mergeEmployeeOptions(opts, toOptions(machineRes.data));
              }

              if (opts.length === 0 && apiProcessName !== processName) {
                res = await getEmployees({
                  limit: 1000,
                  processName,
                }).catch(() => ({ data: [] }));
                opts = mergeEmployeeOptions(opts, toOptions(res.data));
              }
              return [key, opts];
            } catch {
              return [key, []];
            }
          })
        );
        if (!cancelled) {
          setEmployeesByAssignedProcess(Object.fromEntries(mapEntries));
        }
      } finally {
        if (!cancelled) setLoadingAssignedProcessEmployees(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, dashboardItem]);

  useEffect(() => {
    setLocalColors(Array.isArray(colors) ? colors : []);
  }, [colors]);

  useEffect(() => {
    setLocalSizes(Array.isArray(sizes) ? sizes : []);
  }, [sizes]);

  useEffect(() => {
    const fetchMissingOptions = async () => {
      if (!isOpen) return;

      const shouldFetchColors = !Array.isArray(colors) || colors.length === 0;
      const shouldFetchSizes = !Array.isArray(sizes) || sizes.length === 0;

      if (!shouldFetchColors && !shouldFetchSizes) return;

      try {
        const [colorsRes, sizesRes] = await Promise.all([
          shouldFetchColors ? getUniqueColors().catch(() => null) : Promise.resolve(null),
          shouldFetchSizes ? getUniqueSizes().catch(() => null) : Promise.resolve(null)
        ]);

        if (shouldFetchColors && colorsRes?.status === 'success' && Array.isArray(colorsRes?.data)) {
          setLocalColors(colorsRes.data);
        }
        if (shouldFetchSizes && sizesRes?.status === 'success' && Array.isArray(sizesRes?.data)) {
          setLocalSizes(sizesRes.data);
        }
      } catch (error) {
        // Keep modal functional even if dropdown options fail.
      }
    };

    fetchMissingOptions();
  }, [isOpen, colors, sizes]);

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      // Fetch all employees
      const allEmployeesResponse = await getEmployees({ limit: 1000 });
      const allEmployeeOptions = (allEmployeesResponse.data || []).map((emp) =>
        mapEmployeeToSelectOption(emp, {
          extra: {
            employeeName: String(emp.nickname || emp.firstName || emp.username || '').trim(),
          },
        })
      );
      setEmployees(allEmployeeOptions);

      // Fetch filtered employees for specific processes
      const [doracutResponse, checkingResponse] = await Promise.all([
        getEmployees({ limit: 1000, processName: 'doracut' }).catch(() => ({ data: [] })),
        getEmployees({ limit: 1000, processName: 'checking' }).catch(() => ({ data: [] }))
      ]);

      const doracutEmployees = (doracutResponse.data || []).map((emp) =>
        mapEmployeeToSelectOption(emp, {
          extra: {
            employeeName: String(emp.nickname || emp.firstName || emp.username || '').trim(),
          },
        })
      );

      const checkingEmployees = (checkingResponse.data || []).map((emp) =>
        mapEmployeeToSelectOption(emp, {
          extra: {
            employeeName: String(emp.nickname || emp.firstName || emp.username || '').trim(),
          },
        })
      );

      setFilteredEmployees(prev => ({
        ...prev,
        doracut: doracutEmployees,
        checking: checkingEmployees
      }));
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Fetch employees for machines when dashboardItem changes
  useEffect(() => {
    const fetchMachineEmployees = async () => {
      if (!dashboardItem) return;

      const loadingItem = dashboardItem?.schand_ProcessDetails?.find(x => x?.machineEmployees || x?.model === "LoadingProcess");
      const rcItem = dashboardItem?.schand_ProcessDetails?.find(x => (x?.machineEmployees && x?.rcPic !== undefined) || x?.model === "RcProcess");

      const machineNameMap = new Map(); // Map clean name to original name
      
      // Collect all unique machine names from Loading and RC
      if (loadingItem?.machineEmployees) {
        loadingItem.machineEmployees.forEach(me => {
          const originalName = me?.machineName || me?.machineId?.machineName || '';
          if (originalName) {
            const cleanName = originalName.replace(/\s+\d+$/, '');
            if (!machineNameMap.has(cleanName)) {
              machineNameMap.set(cleanName, originalName);
            }
          }
        });
      }
      
      if (rcItem?.machineEmployees) {
        rcItem.machineEmployees.forEach(me => {
          const originalName = me?.machineName || me?.machineId?.machineName || '';
          if (originalName) {
            const cleanName = originalName.replace(/\s+\d+$/, '');
            if (!machineNameMap.has(cleanName)) {
              machineNameMap.set(cleanName, originalName);
            }
          }
        });
      }

      // Fetch employees for each machine using base name (Forthread → all Forthread1/2/3)
      const machineEmployeesMap = {};
      const fetchPromises = Array.from(machineNameMap.entries()).map(async ([cleanName]) => {
        try {
          const response = await getEmployees({ limit: 1000, machineName: cleanName });
          machineEmployeesMap[cleanName] = (response.data || []).map((emp) =>
            mapEmployeeToSelectOption(emp)
          );
        } catch (error) {
          console.error(`Error fetching employees for machine ${cleanName}:`, error);
          machineEmployeesMap[cleanName] = [];
        }
      });

      await Promise.all(fetchPromises);
      setFilteredEmployees(prev => ({
        ...prev,
        machineEmployees: machineEmployeesMap
      }));
    };

    if (dashboardItem) {
      fetchMachineEmployees();
    }
  }, [dashboardItem]);

  useEffect(() => {
    if (dashboardItem) {
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

      const getRcStatsValues = () => {
        const pickMetric = (...values) => {
          for (const value of values) {
            if (value === 0 || value === '0') return value;
            if (value !== undefined && value !== null && String(value).trim() !== '') return value;
          }
          return '';
        };

        const combinedDetails = [
          ...parseProcessDetails(dashboardItem?.schand_ProcessDetails),
        ];

        const processIdToName = new Map();
        const processList =
          dashboardItem?.designDetails?.processes ||
          dashboardItem?.processes ||
          [];

        (Array.isArray(processList) ? processList : []).forEach((p) => {
          const id = String(p?._id || '').trim();
          const name = String(p?.processName || '').toLowerCase().trim();
          if (id && name) processIdToName.set(id, name);
        });

        const getProcessIdValue = (rec) => {
          if (!rec?.processId) return '';
          if (typeof rec.processId === 'string') return rec.processId;
          return rec.processId?._id || '';
        };

        const resolvedProcessDetails = combinedDetails.map((rec) => {
          let resolved = String(rec?.model || '').toLowerCase().trim();
          if (!resolved) {
            const pid = String(getProcessIdValue(rec) || '').trim();
            resolved = (pid && processIdToName.get(pid)) || '';
          }
          return { ...rec, _resolvedProcessName: resolved };
        });

        const rcCandidates = resolvedProcessDetails.filter((x) => {
          const resolved = String(x?._resolvedProcessName || '').toLowerCase();
          const model = String(x?.model || '').toLowerCase();
          return resolved === 'rc' || resolved.includes('rc') || model.includes('rc');
        });

        const rcRecord = rcCandidates
          .slice()
          .sort((a, b) => new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0))[0]
          || resolvedProcessDetails.find((x) => x?.rcPic !== undefined || x?.alter !== undefined || x?.reject !== undefined);

        return {
          rcPic: pickMetric(dashboardItem?.rcPic, rcRecord?.rcPic),
          alter: pickMetric(dashboardItem?.alter, rcRecord?.alter),
          reject: pickMetric(dashboardItem?.reject, rcRecord?.reject),
        };
      };

      const rcStats = getRcStatsValues();

      const formatEmployeeName = (emp) => {
        if (!emp) return null;
        let empId = null;
        
        if (typeof emp === "string") {
          empId = emp;
        } else if (emp && typeof emp === "object") {
          empId = emp._id || emp.id || emp.employeeId || null;
        }
        
        if (empId) {
          // Try to find employee by ID in the employees array
          const found = employees.find(e => e.value === empId);
          return found ? found.value : empId;
        }
        
        return null;
      };

      const processEmployeeList = Array.isArray(dashboardItem?.schandProcessEmployee)
        ? dashboardItem.schandProcessEmployee
        : [];
      const processEmployeeMap = new Map();
      processEmployeeList.forEach((entry) => {
        const key = normalizeProcessName(entry?.processName);
        if (!key) return;
        processEmployeeMap.set(key, {
          employeeCode: String(entry?.employeeCode || '').trim(),
          employeeName: String(entry?.employeeName || '').trim(),
        });
      });

      const resolveEmployeeByProcess = (processKey) => {
        const data = processEmployeeMap.get(normalizeProcessName(processKey));
        if (!data) return null;

        const byCode = employees.find(
          (emp) => data.employeeCode && String(emp?.employeeCode || '').trim() === data.employeeCode
        );
        if (byCode) return byCode.value;

        const byName = employees.find(
          (emp) => data.employeeName && String(emp?.employeeName || '').trim().toLowerCase() === data.employeeName.toLowerCase()
        );
        if (byName) return byName.value;

        return null;
      };

      const dynamicProcessEmployees = processEmployeeList
        .map((entry) => ({
          processName: String(entry?.processName || '').trim(),
          employeeId: resolveEmployeeByProcess(entry.processName) || '',
        }))
        .filter((entry) => entry.processName);

      // Find Loading process (has machineEmployees)
      const loadingItem = dashboardItem?.schand_ProcessDetails?.find(x => x?.machineEmployees || x?.model === "LoadingProcess");
      
      // Find RC process (has machineEmployees)
      const rcItem = dashboardItem?.schand_ProcessDetails?.find(x => (x?.machineEmployees && x?.rcPic !== undefined) || x?.model === "RcProcess");
      
      const doracutItem = dashboardItem?.schand_ProcessDetails?.find(x => x?.doracut || x?.model === "DoracutProcess");
      const pressItem = dashboardItem?.schand_ProcessDetails?.find(x => x?.press || x?.model === "PressProcess");
      const packingItem = dashboardItem?.schand_ProcessDetails?.find(x => x?.packing || x?.model === "PackingProcess");
      const checkingItem = dashboardItem?.schand_ProcessDetails?.find(x => x?.checking || x?.model === "CheckingProcess");
      const logoItem = dashboardItem?.schand_ProcessDetails?.find(x => x?.logo || x?.model === "LogoProcess");
      const billscanItem = dashboardItem?.schand_ProcessDetails?.find(x => x?.billScan || x?.model === "BillscanProcess");
      const rcPicItem = dashboardItem?.schand_ProcessDetails?.find(
        (x) => x?.rcPic !== undefined && x?.rcPic !== null
      );
      const rcStatsItem =
        rcItem ||
        rcPicItem ||
        dashboardItem?.schand_ProcessDetails?.find(
          (x) =>
            x?.rcPic !== undefined ||
            x?.alter !== undefined ||
            x?.reject !== undefined
        );

      // Extract machineEmployees for Loading process
      const loadingMachineEmployees = loadingItem?.machineEmployees || [];
      const loadingMachineData = loadingMachineEmployees.map((me, index) => {
        const machineName = me?.machineName || me?.machineId?.machineName || '';
        // Remove numbers from machine name (e.g., "Kansai 3" -> "Kansai")
        const cleanMachineName = machineName.replace(/\s+\d+$/, '');
        return {
          machineId: me?.machineId?._id || me?.machineId || '',
          machineName: cleanMachineName,
          originalMachineName: machineName,
          employeeId: formatEmployeeName(me?.employeeId),
          index: index
        };
      });

      // Extract machineEmployees for RC process
      const rcMachineEmployees = rcItem?.machineEmployees || [];
      const rcMachineData = rcMachineEmployees.map((me, index) => {
        const machineName = me?.machineName || me?.machineId?.machineName || '';
        // Remove numbers from machine name (e.g., "Fat Lock 4" -> "Fat Lock")
        const cleanMachineName = machineName.replace(/\s+\d+$/, '');
        return {
          machineId: me?.machineId?._id || me?.machineId || '',
          machineName: cleanMachineName,
          originalMachineName: machineName,
          employeeId: formatEmployeeName(me?.employeeId),
          index: index
        };
      });

      const nextForm = {
        dNo: dashboardItem.dNo || dashboardItem.designNumber || '',
        colour: dashboardItem.colour || dashboardItem.color || '',
        size: dashboardItem.size || '',
        layer: dashboardItem.layer || '',
        master: dashboardItem.master || '',
        // Loading process - store machineEmployees array
        loadingMachineEmployees: loadingMachineData,
        // RC process - store machineEmployees array
        rcMachineEmployees: rcMachineData,
        processEmployees: dynamicProcessEmployees,
        doracut: resolveEmployeeByProcess('doracut') || formatEmployeeName(doracutItem?.doracut || doracutItem?.user),
        press: resolveEmployeeByProcess('press') || formatEmployeeName(pressItem?.press || pressItem?.user),
        packing: resolveEmployeeByProcess('packing') || formatEmployeeName(packingItem?.packing || packingItem?.user),
        checking: resolveEmployeeByProcess('checking') || formatEmployeeName(checkingItem?.checking || checkingItem?.user),
        logo: resolveEmployeeByProcess('logo') || formatEmployeeName(logoItem?.logo || logoItem?.user),
        billscan: resolveEmployeeByProcess('billscan') || formatEmployeeName(billscanItem?.billScan || billscanItem?.user),
        rcPic: rcStats.rcPic !== '' ? String(rcStats.rcPic) : "",
        alter: rcStats.alter !== '' ? String(rcStats.alter) : "",
        reject: rcStats.reject !== '' ? String(rcStats.reject) : "",
        pic: dashboardItem.pic != null ? String(dashboardItem.pic) : "",
      };
      initialFormSnapshotRef.current = JSON.parse(JSON.stringify(nextForm));
      setFormData(nextForm);
      setErrors({});
    }
  }, [dashboardItem, employees]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validateForm = () => {
    const snapshot = initialFormSnapshotRef.current || {};
    const newErrors = {};
    let isValid = true;
    const isBlank = (value) => value === null || value === undefined || String(value).trim() === '';
    const isChanged = (key) => scalarForCompare(snapshot[key]) !== scalarForCompare(formData[key]);

    // For updates, validate required fields only when user changed those fields.
    // This keeps Pic/Rc Pic only edits unblocked even if old records have blank metadata.
    if (isChanged('dNo') && isBlank(formData.dNo)) {
      newErrors.dNo = "D. No. is required";
      isValid = false;
    }
    if (isChanged('colour') && isBlank(formData.colour)) {
      newErrors.colour = "Color is required";
      isValid = false;
    }
    if (isChanged('size') && isBlank(formData.size)) {
      newErrors.size = "Size is required";
      isValid = false;
    }
    if (isChanged('layer') && isBlank(formData.layer)) {
      newErrors.layer = "Layer is required";
      isValid = false;
    }
    if (isChanged('master') && isBlank(formData.master)) {
      newErrors.master = "Master is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const snapshot = initialFormSnapshotRef.current;
      if (!snapshot) {
        toast.warn("Please wait — form is still loading.", {
          toastId: "dashboard-update-not-ready",
        });
        return;
      }
      const payload = buildPartialDashboardPayload(snapshot, formData);
      if (!payload || Object.keys(payload).length === 0) {
        toast.info("No changes to save.", { toastId: "dashboard-update-no-changes" });
        return;
      }
      setIsLoading(true);
      try {
        await onUpdate(dashboardItem._id, payload);
        onClose();
      } catch (error) {
        toast.error("Failed to update item.", { toastId: 'dashboard-update-error' });
        console.error("Update failed", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Please correct the errors in the form.", { toastId: 'dashboard-update-form-error' });
    }
  };

  const mergeSelectedEmployee = (options, employeeId) => {
    let opts = [...(options || [])];
    if (employeeId && !opts.some((o) => o.value === employeeId)) {
      const extra = employees.find((e) => e.value === employeeId);
      if (extra) opts = [extra, ...opts];
    }
    return opts;
  };

  const getProcessEmployeeOptions = (processName, employeeId) => {
    const key = normalizeProcessName(processName);
    return mergeSelectedEmployee(employeesByAssignedProcess[key], employeeId);
  };

  const getMachineEmployeeOptions = (machineName, employeeId) => {
    const base = filteredEmployees.machineEmployees[machineName] || [];
    return mergeSelectedEmployee(base, employeeId);
  };

  if (!isOpen) return null;

  const handleModalClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Update Item"
      size="xl"
    >
      <div className="p-4 md:p-5" style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <InputElement
            name="Lot No."
            value={dashboardItem?.lotNo || '-'}
            readOnly
            disabled
            variant="size_44"
          />

          <InputElement
            name="D. No."
            placeholder="Enter D. No."
            value={formData.dNo}
            onChange={(val) => handleChange('dNo', val)}
            variant="size_44"
            is_required
            error={errors.dNo}
          />

          <SelectElement
            name="Color"
            options={localColors?.map((c) => ({ label: c, value: c })) || []}
            value={formData.colour}
            onChange={(val) => handleChange('colour', val)}
            placeholder="Select color"
            is_required
            error={errors.colour}
            isClearable
            menuPortalTarget={document.body}
          />

          <SelectElement
            name="Size"
            options={localSizes?.map((s) => ({ label: s, value: s })) || []}
            value={formData.size}
            onChange={(val) => handleChange('size', val)}
            placeholder="Select size"
            is_required
            error={errors.size}
            isClearable
            menuPortalTarget={document.body}
          />

          <InputElement
            name="Layer"
            placeholder="Enter layer"
            value={formData.layer}
            onChange={(val) => handleChange('layer', val)}
            variant="size_44"
            is_required
            error={errors.layer}
          />

          <InputElement
            name="Master"
            placeholder="Enter master"
            value={formData.master}
            onChange={(val) => handleChange('master', val)}
            variant="size_44"
            is_required
            error={errors.master}
          />
        </div>

        {/* RC Pic and Pic side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <InputElement
            name="Rc Pic"
            placeholder="Enter Rc Pic"
            value={formData.rcPic}
            onChange={(val) => handleChange('rcPic', val)}
            variant="size_44"
            type="number"
          />

          <InputElement
            name="Pic"
            placeholder="Enter Pic"
            value={formData.pic}
            onChange={(val) => handleChange('pic', val)}
            variant="size_44"
            type="number"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <InputElement
            name="Alter"
            placeholder="Enter Alter"
            value={formData.alter ?? ""}
            onChange={(val) => handleChange('alter', val)}
            variant="size_44"
            type="number"
          />

          <InputElement
            name="Reject"
            placeholder="Enter Reject"
            value={formData.reject ?? ""}
            onChange={(val) => handleChange('reject', val)}
            variant="size_44"
            type="number"
          />
        </div>

        {/* Process Details Section */}
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold text-light-darkGrey mb-4">Process Details</h3>
          
          <div className="grid grid-cols-1 gap-3">
            {/* Loading Process - Dynamic Machine Employees */}
            {(!formData.processEmployees || formData.processEmployees.length === 0) &&
              formData.loadingMachineEmployees && formData.loadingMachineEmployees.length > 0 && (
              <>
                {formData.loadingMachineEmployees.map((machineEmp, index) => (
                  <div key={`loading-${index}`} className="flex items-center justify-between gap-3 p-3 bg-[#EFE7DC] border border-[#E8DFD4] rounded-lg">
                    <span className="font-medium text-light-darkGrey">
                      {machineEmp.machineName || `Loading Machine ${index + 1}`}
                    </span>
                    <SelectElement
                      options={getMachineEmployeeOptions(
                        machineEmp.machineName,
                        machineEmp.employeeId
                      )}
                      value={machineEmp.employeeId}
                      onChange={(val) => {
                        const updated = [...(formData.loadingMachineEmployees || [])];
                        updated[index] = { ...updated[index], employeeId: val };
                        handleChange('loadingMachineEmployees', updated);
                      }}
                      placeholder="Select Employee"
                      isClearable
                      menuPortalTarget={document.body}
                      isLoading={isLoadingEmployees}
                      className="w-64"
                    />
                  </div>
                ))}
              </>
            )}

            {/* RC Process - Dynamic Machine Employees */}
            {(!formData.processEmployees || formData.processEmployees.length === 0) &&
              formData.rcMachineEmployees && formData.rcMachineEmployees.length > 0 && (
              <>
                {formData.rcMachineEmployees.map((machineEmp, index) => (
                  <div key={`rc-${index}`} className="flex items-center justify-between gap-3 p-3 bg-[#EFE7DC] border border-[#E8DFD4] rounded-lg">
                    <span className="font-medium text-light-darkGrey">
                      {machineEmp.machineName || `RC Machine ${index + 1}`}
                    </span>
                    <SelectElement
                      options={getMachineEmployeeOptions(
                        machineEmp.machineName,
                        machineEmp.employeeId
                      )}
                      value={machineEmp.employeeId}
                      onChange={(val) => {
                        const updated = [...(formData.rcMachineEmployees || [])];
                        updated[index] = { ...updated[index], employeeId: val };
                        handleChange('rcMachineEmployees', updated);
                      }}
                      placeholder="Select Employee"
                      isClearable
                      menuPortalTarget={document.body}
                      isLoading={isLoadingEmployees}
                      className="w-64"
                    />
                  </div>
                ))}
              </>
            )}

            {formData.processEmployees && formData.processEmployees.length > 0 && (
              <>
                {(formData.processEmployees || []).map((processEmp, index) => (
                  <div key={`process-${index}`} className="flex items-center justify-between gap-3 p-3 bg-[#EFE7DC] border border-[#E8DFD4] rounded-lg">
                    <span className="font-medium text-light-darkGrey">{processEmp.processName}</span>
                    <SelectElement
                      options={getProcessEmployeeOptions(
                        processEmp.processName,
                        processEmp.employeeId
                      )}
                      value={processEmp.employeeId}
                      onChange={(val) => {
                        const updated = [...(formData.processEmployees || [])];
                        updated[index] = { ...updated[index], employeeId: val };
                        handleChange('processEmployees', updated);
                      }}
                      placeholder="Select Employee"
                      isClearable
                      menuPortalTarget={document.body}
                      isLoading={
                        isLoadingEmployees || loadingAssignedProcessEmployees
                      }
                      className="w-64"
                    />
                  </div>
                ))}
              </>
            )}
          </div>

        </div>
      </div>

      <div className="flex justify-end gap-3 p-4 bg-[#F7F3EE] border-t border-[#E8DFD4] sticky bottom-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          label="Cancel"
        />
        <Button
          type="submit"
          variant="primary"
          loading={false}
          label="Update"
          onClick={handleSubmit}
          disabled={isLoading}
        />
      </div>
    </Modal>
    {isLoading && <LoaderComponent size={56} />}
    </>
  );
};

export default UpdateDashboardForm;
