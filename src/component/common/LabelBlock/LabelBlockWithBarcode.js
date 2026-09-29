import React from "react";
import {
  formatDate,
  formatEmployeeDisplayWithCodeOrEmpty,
  formatMasterWithOptionalCode,
} from "../../../helpers/utils";
import { QRCodeSVG } from "qrcode.react";
import LabelPdfBarcode from "../LabelPdfBarcode";

/** Temporary PDF label — billscan replaced by lot-no barcode (Lots page multi-print / Excel import). */
const LabelBlockWithBarcode = ({
  _id = '',
  dNo = "",
  layer = "",
  date = "",
  colour = "",
  size = "",
  pic = "",
  lotNo,
  category = '',
  status = '',
  master = "",
  masterEmployee = null,
  rcPic = "",
  alter = "",
  reject = "",
  schandProcessEmployee = [],
  schand_ProcessDetails = [],
  designProcesses = [],
}) => {
  const processDetails = Array.isArray(schand_ProcessDetails) ? schand_ProcessDetails : [];
  const processesFromDesign = Array.isArray(designProcesses) ? designProcesses : [];

  const formatEmployeeName = (emp) => {
    if (!emp) return "";
    if (typeof emp === "string") return String(emp).trim();
    const out = formatEmployeeDisplayWithCodeOrEmpty(emp);
    return out;
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

  const rcPicValue = rcPic ?? getProcessValue(["rcPic"]);
  const alterValue = alter ?? getProcessValue(["alter"]);
  const rejectValue = reject ?? getProcessValue(["reject"]);
  const finalPicValue = getProcessValue(["finalPic", "final_pic", "finalpic", "final"]);

  const formatDateDDMMYYYY = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = String(dt.getFullYear());
    return `${dd}-${mm}-${yyyy}`;
  };

  const cleanMachineName = (name) => String(name || "").replace(/\s+\d+$/, "").trim();

  const normalizeProcessKey = (name) =>
    String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const LABEL_EXCLUDED_PROCESS_KEYS = new Set(["layering", "cutting", "sorting", "pocket"]);
  const isExcludedLabelProcess = (label) => LABEL_EXCLUDED_PROCESS_KEYS.has(normalizeProcessKey(label));

  const loadingItem = processDetails.find(
    (x) => x?.model === "LoadingProcess" || (Array.isArray(x?.machineEmployees) && x?.model !== "RcProcess")
  );
  const rcItem = processDetails.find(
    (x) => x?.model === "RcProcess" || (Array.isArray(x?.machineEmployees) && x?.rcPic !== undefined)
  );

  const getMachineTitlesFromDesign = (processName) => {
    const proc = processesFromDesign.find(
      (p) => String(p?.processName || p?.processId?.processName || "").toLowerCase() === processName.toLowerCase()
    );
    const details = Array.isArray(proc?.machineDetails) ? proc.machineDetails : [];
    return details
      .map((m, idx) => {
        const name = cleanMachineName(m?.machineName || m?.machineId?.machineName || "");
        return name ? { key: `design-${processName}-${idx}-${name}`, label: name, value: "" } : null;
      })
      .filter(Boolean);
  };

  const buildEmployeeMap = (machineEmployees) => {
    const map = new Map();
    (Array.isArray(machineEmployees) ? machineEmployees : []).forEach((me) => {
      const mn = cleanMachineName(me?.machineName || me?.machineId?.machineName || "");
      if (!mn) return;
      const emp = formatEmployeeName(me?.employeeId);
      if (!map.has(mn)) map.set(mn, emp);
    });
    return map;
  };

  const mergeDesignMachinesWithEmployees = (processKey, machineEmployees) => {
    const designTitles = getMachineTitlesFromDesign(processKey);
    const designNames = designTitles.map((t) => t.label).filter(Boolean);
    const empMap = buildEmployeeMap(machineEmployees);
    const rows = [];

    if (designNames.length > 0) {
      designNames.forEach((name, idx) => {
        if (isExcludedLabelProcess(name)) return;
        const emp = empMap.get(name);
        rows.push({
          key: `${processKey}-d-${idx}-${name}`,
          label: name,
          value: emp !== undefined && emp !== "" ? emp : "",
        });
      });
      return rows;
    }

    const meList = Array.isArray(machineEmployees) ? machineEmployees : [];
    if (meList.length > 0) {
      meList.forEach((me, idx) => {
        const machineName = cleanMachineName(me?.machineName || me?.machineId?.machineName || "");
        if (isExcludedLabelProcess(machineName)) return;
        rows.push({
          key: `${processKey}-m-${idx}-${machineName || "x"}`,
          label: machineName || (processKey === "loading" ? "Loading" : "RC"),
          value: formatEmployeeName(me?.employeeId),
        });
      });
      return rows;
    }

    return rows;
  };

  let loadingDisplayRows = mergeDesignMachinesWithEmployees("loading", loadingItem?.machineEmployees);

  let rcDisplayRows = mergeDesignMachinesWithEmployees("rc", rcItem?.machineEmployees);

  if (rcDisplayRows.length === 0) {
    const fallbackRows = [
      { label: "4-Thread", value: getProcessValue(["fourThreadName", "fourThread", "forThreadName", "forThread"]) },
      { label: "Kansai", value: getProcessValue(["kansaiName", "kansai", "kansaiEmployee", "kansaiEmployeeName"]) },
      { label: "Single", value: getProcessValue(["singleName", "single", "singleEmployee", "singleEmployeeName"]) },
      { label: "FatLock", value: getProcessValue(["fatlockName", "fatlock", "fatLockName", "fatLock"]) },
    ];
    fallbackRows.forEach((r, idx) => {
      rcDisplayRows.push({ key: `fallback-${idx}`, label: r.label, value: r.value });
    });
  }

  const lineStyle = {
    display: "flex",
    alignItems: "flex-end",
    gap: "4px",
    fontSize: "14px",
    lineHeight: 1.1,
    minHeight: "16px",
    whiteSpace: "nowrap",
  };

  const subLineStyle = {
    ...lineStyle,
    fontSize: "12px",
    minHeight: "14px",
  };

  const valueOrUnderline = (value, minWidth = "58px") => (
    value ? (
      <span style={{ fontWeight: 600 }}>{value}</span>
    ) : (
      <span
        style={{
          display: "inline-block",
          borderBottom: "1.4px solid #000",
          minWidth,
          height: "16px",
          position: "relative",
          top: "4px",
        }}
      />
    )
  );

  const underlineBottom = (minWidth = "58px") => (
    <span
      style={{
        display: "inline-block",
        borderBottom: "1.4px solid #000",
        minWidth,
        height: "16px",
        alignSelf: "flex-end",
        position: "relative",
        top: "4px",
      }}
    />
  );

  const machineEmployeeCell = (value) =>
    value ? <span>{value}</span> : <span>-</span>;

  const valueOrUnderlineRegular = (value, minWidth = "58px") =>
    value ? <span>{value}</span> : valueOrUnderline("", minWidth);

  const fitValueFontSizePx = (text, basePx = 12, minPx = 8) => {
    const s = String(text || "").trim();
    if (!s) return basePx;
    // Start shrinking after ~14 chars; reach min around ~28 chars.
    const over = Math.max(0, s.length - 14);
    const shrink = Math.ceil(over / 3); // 3 chars ~= 1px
    return Math.max(minPx, basePx - shrink);
  };

  const machineEmployeeCellFit = (value) => {
    const v = String(value || "").trim();
    if (!v) return underlineBottom("58px");

    const fontSize = fitValueFontSizePx(v, 12, 8);
    const m = v.match(/^(.*?)(\s*\([^)]*\))\s*$/);
    if (!m) {
      return <span style={{ fontSize: `${fontSize}px`, lineHeight: 1.05 }}>{v}</span>;
    }
    const namePart = (m[1] || "").trimEnd();
    const codePart = (m[2] || "").trim();
    return (
      <span style={{ fontSize: `${fontSize}px`, lineHeight: 1.05 }}>
        {namePart}
        {" "}
        <span style={{ fontWeight: 700 }}>{codePart}</span>
      </span>
    );
  };

  const machineEmployeeCellFitTight = (value) => {
    const v = String(value || "").trim();
    if (!v) return underlineBottom("58px");

    const fontSize = fitValueFontSizePx(v, 11, 7);
    const m = v.match(/^(.*?)(\s*\([^)]*\))\s*$/);
    if (!m) {
      return <span style={{ fontSize: `${fontSize}px`, lineHeight: 1.05 }}>{v}</span>;
    }
    const namePart = (m[1] || "").trimEnd();
    const codePart = (m[2] || "").trim();
    return (
      <span style={{ fontSize: `${fontSize}px`, lineHeight: 1.05 }}>
        {namePart}
        {" "}
        <span style={{ fontWeight: 700 }}>{codePart}</span>
      </span>
    );
  };

  const masterForUnderline = (() => {
    const m = formatMasterWithOptionalCode(master, masterEmployee);
    return m === "-" ? "" : m;
  })();

  const pickProcessRecord = (needle, keys = []) => {
    const n = String(needle || "").toLowerCase();
    return processDetails.find((x) => {
      const model = String(x?.model || "").toLowerCase();
      if (n && model.includes(n)) return true;
      return keys.some((k) => x?.[k] !== undefined && x?.[k] !== null && x?.[k] !== "");
    });
  };

  const hasProcessInDesign = (processName) => {
    const n = String(processName || "").toLowerCase();
    if (!n) return false;
    return processesFromDesign.some((p) => {
      const pn = String(p?.processName || p?.processId?.processName || "").toLowerCase();
      return pn === n;
    });
  };

  const shouldShowSimpleProcess = (processKey, keys = []) => {
    if (hasProcessInDesign(processKey)) return true;
    return Boolean(pickProcessRecord(processKey, keys));
  };

  const getProcessEmployeeValue = (record, keys = []) => {
    if (!record) return "";
    for (const k of keys) {
      const v = record?.[k];
      if (v) return formatEmployeeName(v);
    }
    return formatEmployeeName(record?.user || record?.employeeId);
  };

  const schandEmployeeByNormalizedLabel = (() => {
    const map = new Map();
    (Array.isArray(schandProcessEmployee) ? schandProcessEmployee : []).forEach((item) => {
      const label = String(item?.processName || "").trim();
      if (!label) return;
      const employeeName = String(item?.employeeName || "").trim();
      const employeeCode = String(item?.employeeCode || "").trim();
      const value =
        employeeName && employeeCode
          ? `${employeeName} (${employeeCode})`
          : employeeName || employeeCode || "";
      map.set(normalizeProcessKey(label), value);
    });
    return map;
  })();

  const getEmployeeForMachineLabel = (machineLabel) => {
    const target = cleanMachineName(machineLabel);
    if (!target) return "";
    for (const item of [loadingItem, rcItem]) {
      const mes = item?.machineEmployees;
      if (!Array.isArray(mes)) continue;
      for (const me of mes) {
        const mn = cleanMachineName(me?.machineName || me?.machineId?.machineName || "");
        if (mn && mn === target) {
          const emp = formatEmployeeName(me?.employeeId);
          if (emp) return emp;
        }
      }
    }
    return "";
  };

  const getEmployeeForProcessLabel = (displayLabel) => {
    const nk = normalizeProcessKey(displayLabel);
    if (schandEmployeeByNormalizedLabel.has(nk)) {
      const v = schandEmployeeByNormalizedLabel.get(nk);
      if (v) return v;
    }
    const fromMachine = getEmployeeForMachineLabel(displayLabel);
    if (fromMachine) return fromMachine;

    const camel = displayLabel.replace(/\s+/g, "").replace(/^(.)/, (_, c) => c.toLowerCase());
    const simpleDefs = [
      { needle: "doracut", keys: ["doracut"] },
      { needle: "checking", keys: ["checking"] },
      { needle: "press", keys: ["press"] },
      { needle: "packing", keys: ["packing"] },
      { needle: "logo", keys: ["logo"] },
      { needle: "billscan", keys: ["billScan", "billscan"] },
    ];
    const hit = simpleDefs.find(
      (d) => nk === d.needle || nk.includes(d.needle) || d.needle.includes(nk)
    );
    if (hit) {
      const rec = pickProcessRecord(hit.needle, hit.keys);
      return getProcessEmployeeValue(rec, hit.keys);
    }

    const rec = pickProcessRecord(camel, [camel]) || pickProcessRecord(nk, [camel]);
    return getProcessEmployeeValue(rec, [camel].filter(Boolean));
  };

  const buildDesignOrderedProcessRows = () => {
    if (!Array.isArray(processesFromDesign) || processesFromDesign.length === 0) return [];

    const sorted = [...processesFromDesign].sort(
      (a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0)
    );

    const rows = [];
    sorted.forEach((p, pIdx) => {
      const rawName = String(p?.processName || p?.processId?.processName || "").trim();
      if (!rawName) return;
      const nk = normalizeProcessKey(rawName);
      if (nk === "master") return;

      const isLoading = nk.includes("loading");
      const isRc = nk === "rc" || nk === "rcprocess";

      if (isLoading || isRc) {
        const details = Array.isArray(p?.machineDetails) ? p.machineDetails : [];
        if (details.length > 0) {
          details.forEach((m, idx) => {
            const name = cleanMachineName(m?.machineName || m?.machineId?.machineName || "");
            if (!name || isExcludedLabelProcess(name)) return;
            rows.push({
              key: `${isLoading ? "ld" : "rc"}-${pIdx}-${idx}-${normalizeProcessKey(name)}`,
              label: name,
              value: getEmployeeForProcessLabel(name),
            });
          });
        }
        return;
      }

      if (isExcludedLabelProcess(rawName)) return;

      rows.push({
        key: `proc-${pIdx}-${nk}`,
        label: rawName,
        value: getEmployeeForProcessLabel(rawName),
      });
    });

    return rows;
  };

  const designOrderedProcessRows = buildDesignOrderedProcessRows();

  const doracutRow = (() => {
    const rec = pickProcessRecord("doracut", ["doracut"]);
    return { label: "Doracut", value: getProcessEmployeeValue(rec, ["doracut"]) };
  })();

  const checkingRow = (() => {
    const rec = pickProcessRecord("checking", ["checking"]);
    return { label: "Checking", value: getProcessEmployeeValue(rec, ["checking"]) };
  })();

  const postCheckingProcessDefs = [
    { key: "press", label: "Press", keys: ["press"], match: ["press"] },
    { key: "packing", label: "Packing", keys: ["packing"], match: ["packing"] },
    { key: "logo", label: "Logo", keys: ["logo"], match: ["logo"] },
  ];

  const getDesignProcessDisplayName = (p) =>
    String(p?.processName || p?.processId?.processName || "").trim();

  const orderedDesignNames = processesFromDesign.map(getDesignProcessDisplayName).filter(Boolean);

  const resolveSimpleRowFromDesignName = (displayName) => {
    const n = String(displayName || "").toLowerCase().replace(/\s+/g, "");
    if (!n || n === "master") return null;

    const defs = postCheckingProcessDefs;
    const hit = defs.find((d) => d.match.some((m) => n === m || n.includes(m)));
    if (hit) {
      return { key: hit.key, label: hit.label, keys: hit.keys };
    }
    const camel = displayName.replace(/\s+/g, "").replace(/^(.)/, (_, c) => c.toLowerCase());
    return {
      key: camel || n,
      label: displayName,
      keys: [camel, n, displayName.replace(/\s+/g, "").toLowerCase()].filter(Boolean),
    };
  };

  const buildPostCheckingRows = () => {
    const seen = new Set();
    const rows = [];

    const pushProcessRow = (key, label, keys) => {
      if (isExcludedLabelProcess(label)) return;
      if (seen.has(key)) return;
      if (!shouldShowSimpleProcess(key, keys)) return;
      seen.add(key);
      const rec = pickProcessRecord(key, keys);
      rows.push({
        key,
        label,
        value: getProcessEmployeeValue(rec, keys),
      });
    };

    const checkingIdx = orderedDesignNames.findIndex((name) => name.toLowerCase() === "checking");
    let afterCheckingNames = [];
    if (checkingIdx !== -1) {
      afterCheckingNames = orderedDesignNames.slice(checkingIdx + 1);
    } else {
      afterCheckingNames = postCheckingProcessDefs.map((d) => d.label);
    }

    afterCheckingNames.forEach((name) => {
      const cfg = resolveSimpleRowFromDesignName(name);
      if (!cfg) return;
      pushProcessRow(cfg.key, cfg.label, cfg.keys);
    });

    postCheckingProcessDefs.forEach((d) => pushProcessRow(d.key, d.label, d.keys));
    return rows;
  };

  const postCheckingRows = buildPostCheckingRows();
  const leftAfterCheckingRow = postCheckingRows[0] || null;
  const belowLotRowsMerged = postCheckingRows.slice(1);

  const processRowsFromEmployees = Array.isArray(schandProcessEmployee)
    ? schandProcessEmployee
        .map((item, idx) => {
          const label = String(item?.processName || "").trim();
          if (!label || isExcludedLabelProcess(label)) return null;
          const employeeName = String(item?.employeeName || "").trim();
          const employeeCode = String(item?.employeeCode || "").trim();
          const value = employeeName && employeeCode
            ? `${employeeName} (${employeeCode})`
            : (employeeName || employeeCode || "");
          return {
            key: `spe-${idx}-${label.toLowerCase()}`,
            label,
            value,
          };
        })
        .filter(Boolean)
    : [];

  const processRowsPrimary =
    designOrderedProcessRows.length > 0 ? designOrderedProcessRows : processRowsFromEmployees;

  // Keep process rows in a left-side vertical flow as much as possible.
  // Move only overflow rows under lot number on the right.
  const MAX_LEFT_PROCESS_ROWS = 7;
  const leftProcessRowsPrimary = processRowsPrimary.slice(0, MAX_LEFT_PROCESS_ROWS);
  const rightProcessRowsPrimary = processRowsPrimary.slice(MAX_LEFT_PROCESS_ROWS);

  const isBillscanProcess = (label) => normalizeProcessKey(label) === "billscan";
  const withoutBillscanRows = (rows) =>
    (Array.isArray(rows) ? rows : []).filter((row) => !isBillscanProcess(row?.label));

  const leftProcessRows = withoutBillscanRows(leftProcessRowsPrimary);
  const rightProcessRows = withoutBillscanRows(
    processRowsPrimary.length > 0 ? rightProcessRowsPrimary : belowLotRowsMerged
  );

  const QR_SIZE = 96;

  const renderBillscanBarcode = () =>
    lotNo ? (
      <LabelPdfBarcode value={lotNo} barWidth={1.1} height={26} />
    ) : null;

  const codeColumnStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    flexShrink: 0,
    gap: 0,
  };

  const lotNoLineStyle = {
    width: "100%",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: "14px",
    height: "14px",
    flexShrink: 0,
    margin: 0,
    marginBottom: "2px",
    padding: 0,
    overflow: "visible",
  };


  // 75mm x 50mm (horizontal)
  const labelWidth = 283.46; // 75mm
  const labelHeight = 188.98; // 50mm

  return (
    <div
      style={{
        width: `${labelWidth}px`,
        height: `${labelHeight}px`,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pageBreakAfter: "always",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "0px 7px 1px 7px",
          boxSizing: "border-box",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gridTemplateRows: "1fr",
          columnGap: "6px",
          rowGap: "0px",
          fontFamily: "Arial",
          color: "#000",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            gap: "0px",
            height: "100%",
            minHeight: 0,
            marginTop: "-2px",
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <div style={{ ...subLineStyle, width: "100%", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
                <b>D.No :</b>
                {dNo ? <span style={{ fontWeight: 700 }}>{dNo}</span> : valueOrUnderline("")}
              </span>
              <span style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
                <b>L :</b>
                {layer ? <span style={{ fontWeight: 700 }}>{layer}</span> : valueOrUnderline("", "24px")}
              </span>
            </div>
            <div style={subLineStyle}>
              <span><b>Color :</b></span>
              {colour ? <span style={{ fontWeight: 700 }}>{colour}</span> : valueOrUnderline("")}
            </div>
            <div style={{ ...subLineStyle, width: "100%", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
                <b>Size :</b>
                {size ? <span style={{ fontWeight: 700 }}>{size}</span> : valueOrUnderline("")}
              </span>
              <span style={{ display: "flex", alignItems: "flex-end", gap: "4px", marginLeft: "auto" }}>
                <b>Pic :</b>
                {pic ? <span style={{ fontWeight: 700 }}>{pic}</span> : valueOrUnderline("", "40px")}
              </span>
            </div>
            <div style={{ ...subLineStyle, width: "100%", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
                <b>Alter :</b>
                {alterValue ? <span style={{ fontWeight: 700 }}>{alterValue}</span> : valueOrUnderline("", "26px")}
              </span>
              <span style={{ display: "flex", alignItems: "flex-end", gap: "4px", marginLeft: "auto" }}>
                <b>Reject :</b>
                {rejectValue ? <span style={{ fontWeight: 700 }}>{rejectValue}</span> : valueOrUnderline("", "26px")}
              </span>
            </div>
            <div style={subLineStyle}>
              <span><b>Final Pic :</b></span>
              {finalPicValue ? <span style={{ fontWeight: 700 }}>{finalPicValue}</span> : valueOrUnderline("", "92px")}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            {processRowsPrimary.length > 0 ? (
              leftProcessRows.map((row) => (
                <div key={row.key} style={subLineStyle}>
                  <span>{row.label} :</span>
                  {machineEmployeeCellFit(row.value)}
                </div>
              ))
            ) : (
              <>
                {loadingDisplayRows.map((row) => (
                  <div key={row.key} style={subLineStyle}>
                    <span>{row.label} :</span>
                    {machineEmployeeCellFit(row.value)}
                  </div>
                ))}
                {rcDisplayRows.map((row) => (
                  <div key={row.key} style={subLineStyle}>
                    <span>{row.label} :</span>
                    {machineEmployeeCellFit(row.value)}
                  </div>
                ))}
                {shouldShowSimpleProcess("doracut", ["doracut"]) && (
                  <div style={subLineStyle}>
                    <span>{doracutRow.label} :</span>
                    {machineEmployeeCellFit(doracutRow.value)}
                  </div>
                )}
                {shouldShowSimpleProcess("checking", ["checking"]) && (
                  <div style={subLineStyle}>
                    <span>{checkingRow.label} :</span>
                    {machineEmployeeCellFit(checkingRow.value)}
                  </div>
                )}
                {leftAfterCheckingRow && (
                  <div key={leftAfterCheckingRow.key || leftAfterCheckingRow.label} style={subLineStyle}>
                    <span>{leftAfterCheckingRow.label} :</span>
                    {machineEmployeeCellFitTight(leftAfterCheckingRow.value)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            padding: "0 10px 2px 0",
            boxSizing: "border-box",
            height: "100%",
            minHeight: 0,
          }}
        >
          <div
            style={{
              ...subLineStyle,
              width: "100%",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 0,
              marginBottom: "6px",
              minHeight: "14px",
              height: "14px",
              lineHeight: "14px",
            }}
          >
            {valueOrUnderline(formatDateDDMMYYYY(date), "72px")}
          </div>

          {/* QR → Lot No → Barcode — separate rows, no overlap */}
          <div style={codeColumnStyle}>
            <div
              style={{
                flexShrink: 0,
                width: `${QR_SIZE}px`,
                height: `${QR_SIZE}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "6px",
                marginBottom: 0,
                overflow: "visible",
              }}
            >
              <QRCodeSVG
                value={lotNo || ""}
                size={QR_SIZE}
                level="L"
                includeMargin={false}
              />
            </div>

            {lotNo ? (
              <div style={lotNoLineStyle}>{lotNo}</div>
            ) : (
              <div style={{ ...subLineStyle, width: "100%", justifyContent: "center" }}>
                {valueOrUnderlineRegular("", "72px")}
              </div>
            )}

            {lotNo ? (
              <div
                style={{
                  width: "100%",
                  maxWidth: "112px",
                  flexShrink: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  height: "28px",
                  marginTop: "9px",
                  paddingTop: "2px",
                  boxSizing: "border-box",
                }}
              >
                {renderBillscanBarcode()}
              </div>
            ) : null}
          </div>

          {rightProcessRows.length > 0 ? (
            <div style={{ width: "100%", flexShrink: 0 }}>
              {rightProcessRows.map((r) => (
                <div
                  key={r.key || r.label}
                  style={{
                    ...subLineStyle,
                    width: "100%",
                    justifyContent: "flex-start",
                  }}
                >
                  <span>{r.label} :</span>
                  {machineEmployeeCellFitTight(r.value)}
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ width: "100%", flexShrink: 0, marginTop: "-8px" }}>
            <div
              style={{
                ...subLineStyle,
                width: "calc(100% + 86px)",
                marginLeft: "-86px",
                justifyContent: "flex-start",
                alignItems: "flex-end",
                gap: "6px",
                minHeight: "14px",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "4px",
                  flex: "0 0 auto",
                  marginLeft: "auto",
                  marginRight: "5px",
                  whiteSpace: "nowrap",
                }}
              >
                <b>Rc Pic :</b>
                {valueOrUnderline(rcPicValue, "22px")}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "4px",
                  flex: "0 0 auto",
                  paddingRight: "2px",
                  whiteSpace: "nowrap",
                }}
              >
                <b>Master :</b>
                {masterForUnderline ? (
                  <span style={{ fontWeight: 600, fontSize: "11px" }}>{masterForUnderline}</span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "flex-end" }}>
                    {valueOrUnderline("", "32px")}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelBlockWithBarcode;