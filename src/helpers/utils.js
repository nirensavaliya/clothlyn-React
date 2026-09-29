import moment from "moment";


export const capitalize = str => { 
    if (!str) return ''; 
    return str.charAt(0).toUpperCase() + str.slice(1); 
}; 

export function capitalizeFirstLetterOfWords(str) { 
    return str.replace(/\b\w/g, char => char.toUpperCase()); 
} 

export const formatText = (text, replaceWith = '-') => { 
    if (!text) return ''; 
    return text?.toLowerCase().replaceAll('_', replaceWith); 
}; 

export const formatRegularText = (text, replaceWith = ' ') => {
    if (!text) return ''; 
    return text?.toLowerCase().replaceAll('_', replaceWith); 
}; 

export const uppercase = str => { 
    if (!str) return ''; 
    return str.toUpperCase(); 
}; 

export const lowercase = str => { 
    if (!str) return ''; 
    return str?.toLowerCase(); 
};


export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '--'; 
  return moment(date).format(format);
};

/** Employee / user object or string → "DisplayName (employeeCode)" when code exists and differs */
export const formatEmployeeDisplayWithCode = (emp) => {
  if (emp == null || emp === "") return "-";
  if (typeof emp === "string") {
    const t = emp.trim();
    if (!t) return "-";
    if (/^[a-f0-9]{24}$/i.test(t)) return "-";
    return t;
  }
  const code = String(emp.employeeName || emp.employeeCode || emp.code || "").trim();
  const nick = String(emp.nickname || "").trim();
  const user = String(emp.username || "").trim();
  const firstLast = [emp.firstName, emp.lastName].filter(Boolean).join(" ").trim();
  const display = nick || user || firstLast || "";
  if (display && code && display !== code) return `${display} (${code})`;
  if (display) return display;
  if (code) return code;
  return "-";
};

/** Same as formatEmployeeDisplayWithCode but returns "" when missing (for optional label cells) */
export const formatEmployeeDisplayWithCodeOrEmpty = (emp) => {
  if (!emp) return "";
  const out = formatEmployeeDisplayWithCode(emp);
  return out === "-" ? "" : out;
};

/** Dropdown label: "Nickname (0012)" — falls back to "Unknown" */
export const getEmployeeSelectLabel = (emp) => {
  const formatted = formatEmployeeDisplayWithCode(emp);
  return formatted === "-" ? "Unknown" : formatted;
};

/** Map employee record → react-select option { value, label, employeeCode } */
export const mapEmployeeToSelectOption = (emp, config = {}) => {
  const { valueKey = "_id", value: explicitValue, extra = {} } = config;
  const value =
    explicitValue ??
    (valueKey ? emp?.[valueKey] : undefined) ??
    emp?.employeeId ??
    emp?._id ??
    "";
  const employeeCode = String(
    emp?.employeeName || emp?.employeeCode || emp?.code || ""
  ).trim();
  return {
    value,
    label: getEmployeeSelectLabel(emp),
    employeeCode,
    ...extra,
  };
};

/** Plain text master + optional populated employee ref */
export const formatMasterWithOptionalCode = (masterText, masterEmployeeRef) => {
  const text = masterText != null && masterText !== "" ? String(masterText).trim() : "";
  if (masterEmployeeRef && typeof masterEmployeeRef === "object") {
    const code = String(
      masterEmployeeRef.employeeName || masterEmployeeRef.employeeCode || masterEmployeeRef.code || ""
    ).trim();
    if (text && code && text !== code) return `${text} (${code})`;
    const full = formatEmployeeDisplayWithCode(masterEmployeeRef);
    if (full !== "-") return full;
  }
  return text || "-";
};


export const normalizeToIds = (value) => {
    if (!value) return [];
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      return value.map(o => o.value);      
    }
    return Array.isArray(value) ? value : [value]; 
  };
  
export const idsToOptions = (ids, options) =>
    ids.map(id => options.find(o => o.value === id)).filter(Boolean);

export const pickLotMetric = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      const n = Number(value);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
};

export const extractRcDetailsFromLotStatus = (statusData = {}) => {
  if (!statusData || typeof statusData !== 'object') {
    return { rcPic: 0, alter: 0, reject: 0 };
  }
  const nested = statusData.rcDetails || {};
  let alter = pickLotMetric(statusData.alter, nested.alter);
  let reject = pickLotMetric(statusData.reject, nested.reject);
  let rcPic = pickLotMetric(statusData.rcPic, nested.rcPic);

  if (rcPic === 0 && alter === 0 && reject === 0) {
    const details = Array.isArray(statusData.schand_ProcessDetails)
      ? statusData.schand_ProcessDetails
      : [];
    const rcRecord =
      details.find(
        (item) =>
          item?.rcPic !== undefined ||
          item?.alter !== undefined ||
          item?.reject !== undefined
      ) ||
      details.find(
        (item) => String(item?.processId?.processName || '').toLowerCase() === 'rc'
      );
    if (rcRecord) {
      alter = pickLotMetric(alter, rcRecord.alter);
      reject = pickLotMetric(reject, rcRecord.reject);
      rcPic = pickLotMetric(rcPic, rcRecord.rcPic);
    }
  }

  const pic = pickLotMetric(statusData.pic);
  if (rcPic === 0 && pic > 0 && (alter > 0 || reject > 0)) {
    rcPic = Math.max(pic - alter - reject, 0);
  } else if (rcPic === 0 && pic > 0 && alter === 0 && reject === 0) {
    rcPic = pic;
  }

  return { rcPic, alter, reject };
};

export const resolveDashboardLotRecord = (response) => {
  const record = response?.data ?? response?.record ?? null;
  if (record && typeof record === 'object' && !Array.isArray(record)) {
    return record;
  }
  if (response && typeof response === 'object' && !Array.isArray(response) && response.lotNo) {
    return response;
  }
  return null;
};

export const resolveLotDesignNumber = (lotRecord = {}, fallback = '') =>
  lotRecord?.dNo || lotRecord?.designNumber || fallback || '';

/** Scan UI માં ન બતાવવાના processes */
export const HIDDEN_SCAN_PROCESS_NAMES = [
  'layering',
  'cutting',
  'sorting',
  'pocket',
];

export const isHiddenScanProcess = (processName) => {
  const name = String(processName || '').toLowerCase().trim();
  return HIDDEN_SCAN_PROCESS_NAMES.includes(name);
};

export const filterVisibleScanProcesses = (processes = []) =>
  (Array.isArray(processes) ? processes : []).filter(
    (proc) => !isHiddenScanProcess(proc?.processName)
  );

/** Modal types with dedicated scan UI — everything else uses generic scan modal. */
export const SPECIAL_SCAN_MODAL_TYPES = new Set([
  'rc',
  'doracut',
  'billscan',
  'multiple',
]);

export const designProcessHasMachines = (designProcess) => {
  if (!designProcess) return false;
  if (Array.isArray(designProcess.machineDetails) && designProcess.machineDetails.length > 0) {
    return true;
  }
  if (Array.isArray(designProcess.machineId) && designProcess.machineId.length > 0) {
    return true;
  }
  return false;
};

/**
 * Resolve scan modal from process + design machine config.
 * - doracut / billscan / rc keep special UI
 * - design has machines → machine modal
 * - known simple processes keep their modals (submit via common API)
 * - otherwise → generic single-employee modal
 */
export const resolveScanModalType = (canonicalStatus, designProcess = null) => {
  if (canonicalStatus === 'doracut') return 'doracut';
  if (canonicalStatus === 'billscan') return 'billscan';
  if (canonicalStatus === 'rc') return 'rc';
  if (designProcessHasMachines(designProcess) || canonicalStatus === 'loading') {
    return 'machine';
  }
  if (['press', 'logo', 'packing', 'checking'].includes(canonicalStatus)) {
    return canonicalStatus;
  }
  return 'generic';
};

export const isLegacyMachineProcessName = (processName) => {
  const n = String(processName || '').toLowerCase().trim();
  if (!n) return false;
  if (n.includes('ready to cut')) return true;
  if (n === 'rc' || (n.includes('rc') && !n.includes('doracut'))) return true;
  if (n.includes('loading') || n.includes('loding')) return true;
  return false;
};

/** Process master / option → whether design should show machine UI */
export const resolveProcessNeedsMachine = (processOptionOrDoc = {}) => {
  if (processOptionOrDoc?.needsMachine === true) return true;
  const name =
    processOptionOrDoc?.processName ||
    processOptionOrDoc?.label ||
    processOptionOrDoc?.name ||
    '';
  return isLegacyMachineProcessName(name);
};

export const resolveSelectedProcessName = (selectedProcess = {}, threadFields = {}) =>
  selectedProcess?.processName ||
  threadFields?.process ||
  selectedProcess?.displayName ||
  '';

export const getScannedByDisplayName = () => {
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
    return (
      (fromData && String(fromData).trim()) ||
      (fromNames && String(fromNames).trim()) ||
      (nickname && String(nickname).trim()) ||
      (simpleName && String(simpleName).trim()) ||
      ''
    );
  } catch (e) {
    return '';
  }
};

/** Normalize select / id fields that may be ObjectId, string, or { value }. */
function resolveIdValue(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (val.value != null) return String(val.value);
    if (val._id != null) return String(val._id);
  }
  return null;
}

/** Build payload for POST /api/scan/process */
export const buildGenericScanPayload = ({
  selectedProcess = {},
  threadFields = {},
  parsed = {},
  payload = {},
  currentDesign = null,
}) => {
  const processName = resolveSelectedProcessName(selectedProcess, threadFields);
  const designProcess = (currentDesign?.processes || []).find(
    (p) =>
      String(p?.processName || '').toLowerCase() === String(processName).toLowerCase()
  );

  const machineEmployees = (Array.isArray(payload?.machineEmployees)
    ? payload.machineEmployees
    : []
  )
    .map((row) => {
      if (!row) return null;
      const employeeId = resolveIdValue(row.employeeId);
      const machineId = resolveIdValue(row.machineId);
      if (!employeeId) return null;
      return {
        machineId,
        machineName: row.machineName || '',
        employeeId,
        baseRate: parseFloat(row.baseRate) || 0,
      };
    })
    .filter(Boolean);

  const employeeId =
    resolveIdValue(payload?.employeeId) ||
    resolveIdValue(payload?.employee) ||
    resolveIdValue(payload?.press) ||
    resolveIdValue(payload?.logo) ||
    resolveIdValue(payload?.packing) ||
    resolveIdValue(payload?.checking) ||
    machineEmployees[0]?.employeeId ||
    null;

  const priceFromMachines = machineEmployees.reduce(
    (sum, row) => sum + (parseFloat(row?.baseRate) || 0),
    0
  );

  return {
    lotNo: threadFields?.lotNo || parsed?.lotNo,
    dNo: threadFields?.dNo || parsed?.dNo,
    size: threadFields?.size || parsed?.size,
    color: threadFields?.colour || threadFields?.color || parsed?.colour,
    pic: payload?.pic || threadFields?.pic || parsed?.pic,
    employeeId,
    machineEmployees,
    alter: payload?.alter,
    reject: payload?.reject,
    processName: designProcess?.processName || processName,
    processId: selectedProcess?._id || threadFields?.process_id || '',
    dashboardDataId: threadFields?.id || parsed?.id,
    price: designProcess?.price || priceFromMachines || 0,
    needsMachine: machineEmployees.length > 0 || designProcessHasMachines(designProcess),
    scannedByName: getScannedByDisplayName(),
    // Send/Receive processes (non-doracut): single completes in one scan
    ...(selectedProcess?.sendReceiveMode === 'single' ||
    (selectedProcess?.hasSendReceive &&
      selectedProcess?.sendReceiveMode !== 'multiple')
      ? {
          scanPhase: 'single',
          doracutstatus: 'single',
          doracutScanMode: 'single',
        }
      : {}),
    // legacy RC field passthrough when present
    ...(payload?.single ? { single: resolveIdValue(payload.single) } : {}),
    ...(payload?.fatlock ? { fatlock: resolveIdValue(payload.fatlock) } : {}),
    ...(payload?.kansai ? { kansai: resolveIdValue(payload.kansai) } : {}),
    ...(payload?.stickerPhoto ? { stickerPhoto: payload.stickerPhoto } : {}),
  };
};

/** Collapse spaces/underscores/hyphens so "gaj battan" == "gajbattan". */
const collapseScanName = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[\s_\-]+/g, '');

/** Strip trailing send/receive phase from status/process labels. */
const stripSendReceiveSuffix = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\b(send|received|receive)\b/g, ' ')
    .replace(/[\s_\-]+/g, ' ')
    .trim();

/**
 * Base key: ignore Send/Received/Multiple/Single labels.
 * "gajbattan Multiple" → gajbattan, "Gaj Battan M Send" → gajbattanm
 */
const scanProcessBaseKey = (value) =>
  collapseScanName(
    String(value || '')
      .toLowerCase()
      .replace(/\b(send|received|receive)\b/g, ' ')
      .replace(/\b(multiple|single)\b/g, ' ')
  );

/**
 * Same scan stage? Handles rename: "Gaj Battan M" ≈ "gajbattan Multiple"
 * (only when one name contains Multiple/Single — not plain "gaj battan").
 */
export const scanProcessNamesMatch = (a, b) => {
  const ka = collapseScanName(stripSendReceiveSuffix(a));
  const kb = collapseScanName(stripSendReceiveSuffix(b));
  if (ka && kb && ka === kb) return true;

  const ba = scanProcessBaseKey(a);
  const bb = scanProcessBaseKey(b);
  if (ba && bb && ba === bb) return true;

  const aHasModeWord = /\b(multiple|single)\b/i.test(String(a || ''));
  const bHasModeWord = /\b(multiple|single)\b/i.test(String(b || ''));
  if ((aHasModeWord || bHasModeWord) && ba && bb) {
    const [longer, shorter] = ba.length >= bb.length ? [ba, bb] : [bb, ba];
    if (longer === `${shorter}m` && shorter.length >= 6) return true;
  }
  return false;
};

/** Scan flow: map process name to canonical status key */
export const getCanonicalScanStatus = (processName) => {
  const raw = processName === undefined || processName === null ? '' : String(processName).toLowerCase().trim();
  if (!raw) return '';

  // Special known flows (check before stripping send/receive / spaces)
  if (raw.includes('doracut') || raw.includes('dora cut') || raw.includes('dora_cut') || raw.includes('dora-cut')) {
    return 'doracut';
  }
  if (/\brc\b/.test(raw) || raw === 'rc' || raw.startsWith('rc ') || raw.includes('ready to cut')) {
    return 'rc';
  }
  if (raw.includes('checking')) return 'checking';
  if (raw.includes('press')) return 'press';
  if (raw.includes('packing')) return 'packing';
  if (raw.includes('logo')) return 'logo';
  if (raw.includes('billscan') || raw.includes('bill scan')) return 'billscan';
  if (raw.includes('complete')) return 'Complete';
  if (raw.includes('loading') || raw.includes('loding')) return 'loading';

  // Generic processes (e.g. Gaj Battan Multiple): ignore Send/Received suffix + spaces
  return collapseScanName(stripSendReceiveSuffix(raw));
};

/** True when scan should use POST /api/scan/process (e.g. gaj battan). */
export const isGenericScanProcess = (processName) =>
  resolveScanModalType(getCanonicalScanStatus(processName)) === 'generic';

/** Send/Receive sub-flow: send done, receive done, or ready for send */
export const getDoracutSubPhase = (statusText) => {
  const n = String(statusText || '').toLowerCase().trim();
  if (!n) return null;
  const isDoracut =
    n.includes('doracut') ||
    n.includes('dora cut') ||
    n.includes('dora_cut') ||
    n.includes('dora-cut');
  if (!isDoracut) return null;
  if (n.includes('receive')) return 'received';
  if (n.includes('send')) return 'send';
  return 'ready';
};

/**
 * Resolve send/receive phase for doracut OR any hasSendReceive process
 * (e.g. Gaj Battan Multiple). Prefer currentStatus over status.
 */
const resolveSendReceivePhase = (lotStatusData = {}, selectedProcessName = '') => {
  const selectedCanon = getCanonicalScanStatus(selectedProcessName);
  if (!selectedCanon) return null;

  if (selectedCanon === 'doracut') {
    const primary = getDoracutSubPhase(lotStatusData.currentStatus);
    if (primary) return primary;
    return getDoracutSubPhase(lotStatusData.status);
  }

  const candidates = [lotStatusData.currentStatus, lotStatusData.status].filter(Boolean);
  for (const text of candidates) {
    if (!scanProcessNamesMatch(text, selectedProcessName)) continue;
    const n = String(text).toLowerCase();
    if (n.includes('receive')) return 'received';
    if (n.includes('send')) return 'send';
    return 'ready';
  }
  return null;
};

const validateSendReceiveScan = ({
  phase,
  mode = null,
  actionStatus = null,
  processLabel = 'Process',
} = {}) => {
  if (!phase) return null;
  // Single completes send+receive in one scan — only needs mode, not SEND/RECEIVE action.
  if (!actionStatus && mode !== 'single') return null;

  const label = processLabel || 'Process';

  if (mode === 'single') {
    if (phase === 'received') {
      // currentStatus "… Received" = Multiple send already done; finish via Multiple receive.
      return `${label} send is already done. Please use ${label} Multiple for receive.`;
    }
    if (phase === 'send') {
      return `${label} send is already done. Please use ${label} Multiple for receive.`;
    }
    // phase === 'ready' → allow Single
    return null;
  }

  if (mode === 'multiple' && actionStatus === 'SEND') {
    if (phase === 'send' || phase === 'received') {
      return `${label} send is already done.`;
    }
  }

  if (mode === 'multiple' && actionStatus === 'RECEIVE') {
    // After send, BE should set status="… Send" and currentStatus="… Received".
    if (phase === 'send' || phase === 'received') {
      return null;
    }
    return `Please complete ${label} send first.`;
  }

  if (phase === 'received' && mode !== 'multiple') {
    return `${label} receive is already done. Please scan next process.`;
  }

  return null;
};
/**
 * Validate lot current status matches selected scan process (same rules as admin/employee scan).
 * Pass the master processName (not "… Single"/"… Multiple" display labels).
 * doracutMode may be doracut single/multiple OR generic sendReceiveMode single/multiple.
 */
export const validateLotForSelectedScanProcess = ({
  lotStatusData = {},
  designData = null,
  selectedProcessName = '',
  doracutMode = null,
  doracutActionStatus = null,
} = {}) => {
  const processes = (designData?.processes || [])
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .filter((proc) => !isHiddenScanProcess(proc.processName));

  if (processes.length === 0) {
    return {
      allowed: false,
      errorMessage: 'Process is not available in your design. Please add it and try scanning again.',
    };
  }

  const baseProcessName = String(selectedProcessName || '').trim();
  const selectedCanon = getCanonicalScanStatus(baseProcessName);
  const processLabel = baseProcessName || 'Process';
  const scanMode = doracutMode === 'single' || doracutMode === 'multiple' ? doracutMode : null;

  // Send/Receive phase rules for doracut AND any hasSendReceive process (any custom name).
  const needsSendReceivePhase =
    selectedCanon === 'doracut' ||
    scanMode === 'single' ||
    scanMode === 'multiple' ||
    doracutActionStatus === 'SEND' ||
    doracutActionStatus === 'RECEIVE';
  const sendReceivePhase = needsSendReceivePhase
    ? resolveSendReceivePhase(lotStatusData, baseProcessName)
    : null;
  const sendReceiveError = validateSendReceiveScan({
    phase: sendReceivePhase,
    mode: scanMode,
    actionStatus: doracutActionStatus,
    processLabel: selectedCanon === 'doracut' ? 'Doracut' : processLabel,
  });

  if (sendReceiveError) {
    return {
      allowed: false,
      errorMessage: sendReceiveError,
    };
  }

  const effectiveCurrentStatus = (lotStatusData?.currentStatus ?? lotStatusData?.status) || '';
  const currentStatusCanon = getCanonicalScanStatus(effectiveCurrentStatus);

  const currentStatusIndex = processes.findIndex((proc) =>
    scanProcessNamesMatch(proc?.processName, effectiveCurrentStatus)
  );

  // Selected process matches lot stage (exact OR rename aliases like Gaj Battan M ↔ gajbattan Multiple)
  const selectedMatchesCurrent =
    Boolean(baseProcessName) &&
    Boolean(effectiveCurrentStatus) &&
    (scanProcessNamesMatch(baseProcessName, effectiveCurrentStatus) ||
      (selectedCanon &&
        currentStatusCanon &&
        selectedCanon === currentStatusCanon) ||
      (currentStatusIndex !== -1 &&
        scanProcessNamesMatch(baseProcessName, processes[currentStatusIndex]?.processName)));

  if (selectedMatchesCurrent) {
    let nextProcessIndex = currentStatusIndex !== -1 ? currentStatusIndex + 1 : 0;
    nextProcessIndex = nextProcessIndex % processes.length;
    const nextProcess = processes[nextProcessIndex];
    const currentDesignProcess =
      currentStatusIndex !== -1 ? processes[currentStatusIndex] : null;
    return {
      allowed: true,
      modalType: resolveScanModalType(selectedCanon, currentDesignProcess),
      nextDesigneProcess: nextProcess?.processName
        ? getCanonicalScanStatus(nextProcess.processName)
        : 'Complete',
    };
  }

  const expectedName =
    processes[currentStatusIndex]?.processName ||
    effectiveCurrentStatus ||
    currentStatusCanon ||
    'the next process';
  return {
    allowed: false,
    errorMessage: `Please scan ${expectedName} first and change status!`,
  };
};
