import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import * as ExcelJS from "exceljs";
import {
    LucideSearch,
    LucideChevronDown,
    LucideChevronUp,
    LucideLoader,
    LucideDownload,
    LucidePrinter,
    LucideFilter
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputElement from "../component/common/InputElement/index.js";
import CommonTable from "../component/common/Table/Table.js";
import Button from "../component/common/Button/index.js";
import Status from "../component/common/Status/index.js";
import { getUserSalaryReport, getAdminSalaryReport, downloadAdminSalaryReportNewExcel } from "../apis/salaryReportApiAdmin";
import LoaderComponent from "../component/common/Loader.js";
import { generateSalaryReportPDF } from "../helpers/excelExport.js";
import usePageTitle from "../hooks/usePageTitle.js";
import { getDesignByNumber, getDesignByNumberAndStatus, getDesigns } from '../apis/designApi';
import SelectElement from '../component/common/Select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';
import { getEmployees } from '../apis/employeeApi';
import { mapEmployeeToSelectOption, getCanonicalScanStatus } from '../helpers/utils';

const extractEmployeeProcessNames = (emp) => {
    const out = [];
    const pushName = (name) => {
        const n = String(name || "").trim();
        if (n) out.push(n);
    };

    if (Array.isArray(emp?.processNames)) {
        emp.processNames.forEach(pushName);
    }

    if (Array.isArray(emp?.role)) {
        emp.role.forEach((r) => {
            if (!r) return;
            if (typeof r === "string") return;
            pushName(r.processName || r?.processId?.processName);
        });
    }

    if (Array.isArray(emp?.scanPermission)) {
        emp.scanPermission.forEach((r) => {
            if (!r) return;
            if (typeof r === "string") return;
            pushName(r.processName || r?.processId?.processName);
        });
    }

    return Array.from(new Set(out.map((n) => n.toLowerCase())));
};

// Status options for filter dropdown
const STATUS_OPTIONS = [
  { value: 'Loading', label: 'Loading' },
  { value: 'Layering', label: 'Layering' },
  { value: 'Cutting', label: 'Cutting' },
  { value: 'Pocket', label: 'Pocket' },
  { value: 'Sorting', label: 'Sorting' },
  { value: 'RC', label: 'RC' },
  { value: 'Doracut', label: 'Doracut' },
  { value: 'Logo', label: 'Logo' },
  { value: 'Press', label: 'Press' },
  { value: 'Packing', label: 'Packing' },
  { value: 'Checking', label: 'Checking' },
  { value: 'Billscan', label: 'Billscan' },
  { value: 'Complete', label: 'Complete' }
];

const SalaryReport = ({
    getSalaryReportApi = getAdminSalaryReport,
    downloadExcelApi = null,
    pageTitle = "Salary Report"
} = {}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [currentLimit, setCurrentLimit] = useState(25);
    // const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [exportPDFLoading, setExportPDFLoading] = useState(false);
    const [exportSalaryExcelLoading, setExportSalaryExcelLoading] = useState(false);
    const [currentDesign, setCurrentDesign] = useState(null);
    const [designMap, setDesignMap] = useState({});
    const [salaryData, setSalaryData] = useState({
        records: [],
        pagination: {
            total: 0,
            page: 0,
            pages: 1,
            limit: 10
        },
        totalsOverall: null
    });

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({
        employeeId: '',
        lotNo: '',
        dNo: '',
        pic: '',
        status: '',
        startDate: '',
        endDate: ''
    });
    const [tempFilters, setTempFilters] = useState({
        employeeId: '',
        lotNo: '',
        dNo: '',
        pic: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    // Filter options
    const [allEmployees, setAllEmployees] = useState([]); // Store all employees with processNames
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [lotNoOptions, setLotNoOptions] = useState([]);
    const [dNoOptions, setDNoOptions] = useState([]);
    const [picOptions, setPicOptions] = useState([]);
    const [alterOptions, setAlterOptions] = useState([]);
    const [rejectOptions, setRejectOptions] = useState([]);
    const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

    usePageTitle(pageTitle);

const fetchDesignForRow = async (dNo) => {
    try {
        const lotNoData = await getDesignByNumberAndStatus(dNo);
        const designData = await getDesignByNumber(lotNoData?.data?.dNo);
        return designData?.data || null;
    } catch (error) {
        toast.error('Design not found for dNo: ' + dNo, { toastId: 'design-error' });
        return null;
    }
};

        // Fetch Employees — all when no process selected, filtered by process when selected
    useEffect(() => {
        const urlEmployeeId = searchParams.get('employeeId') || '';
        const urlStatus = searchParams.get('status') || '';
        const statusValue =
            typeof tempFilters.status === "object"
                ? (tempFilters.status?.value || tempFilters.status?.label || "")
                : (tempFilters.status || "");

        const shouldFetch =
            showFilters ||
            !!urlEmployeeId ||
            !!appliedFilters.employeeId ||
            !!statusValue ||
            !!urlStatus;

        if (!shouldFetch) return;

        const fetchEmployeesForFilter = async () => {
            try {
                let employees = [];

                if (statusValue) {
                    const candidates = [
                        statusValue.toLowerCase(),
                        getCanonicalScanStatus(statusValue),
                        statusValue,
                    ].filter(Boolean);
                    const tried = new Set();

                    for (const processName of candidates) {
                        if (tried.has(processName)) continue;
                        tried.add(processName);

                        const response = await getEmployees({
                            limit: 1000,
                            processName,
                        });
                        if (response?.data?.length) {
                            employees = response.data;
                            break;
                        }
                    }

                    // Fallback: filter all employees client-side if API case mismatch
                    if (!employees.length) {
                        const response = await getEmployees({ limit: 1000 });
                        const all = response?.data || [];
                        const selectedCanon = getCanonicalScanStatus(statusValue);
                        employees = all.filter((emp) =>
                            extractEmployeeProcessNames(emp).some(
                                (pName) => getCanonicalScanStatus(pName) === selectedCanon
                            )
                        );
                    }
                } else {
                    const response = await getEmployees({ limit: 1000 });
                    employees = response?.data || [];
                }

                setAllEmployees(employees);
                setEmployeeOptions(
                    employees.map((emp) =>
                        mapEmployeeToSelectOption(emp, {
                            extra: {
                                processNames: extractEmployeeProcessNames(emp),
                            },
                        })
                    )
                );
            } catch (error) {
                console.error('Error fetching employees for filter:', error);
                setAllEmployees([]);
                setEmployeeOptions([]);
            }
        };

        fetchEmployeesForFilter();
    }, [showFilters, appliedFilters.employeeId, searchParams, tempFilters.status]);

    // Fetch Design Numbers (same as Dashboard)
    const designsFetchedRef = useRef(false);
    useEffect(() => {
        const urlDNo = searchParams.get('dNo') || '';
        const shouldFetch = showFilters || !!urlDNo || !!appliedFilters.dNo;

        if (!shouldFetch) return;
        if (designsFetchedRef.current) return;
        designsFetchedRef.current = true;

        const fetchDesignNumbers = async () => {
            try {
                const response = await getDesigns({ limit: 1000 });
                if (response && response.data && Array.isArray(response.data)) {
                    const seen = new Set();
                    response.data.forEach(design => {
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
                    setDNoOptions(sorted.map(dn => ({ value: dn, label: dn })));
                }
            } catch (error) {
                console.error('Error fetching design numbers:', error);
                setDNoOptions([]);
                designsFetchedRef.current = false; // allow retry on failure
            }
        };

        fetchDesignNumbers();
    }, [showFilters, appliedFilters.dNo, searchParams]);

    // Restore filters from URL on page load
    useEffect(() => {
        const employeeId = searchParams.get('employeeId') || '';
        let status = searchParams.get('status') || '';
        if (status === 'Unloading') status = 'Loading';
        const dNo = searchParams.get('dNo') || '';
        const startDate = searchParams.get('startDate') || '';
        const endDate = searchParams.get('endDate') || '';

        if (employeeId || status || dNo || startDate || endDate) {
            const restoredFilters = {
                employeeId,
                lotNo: '',
                dNo,
                pic: '',
                status,
                alter: '',
                reject: '',
                startDate,
                endDate
            };
            setAppliedFilters(restoredFilters);
            setTempFilters(restoredFilters);
        }
    }, []);

    const fetchSalaryData = async () => {
        try {
            setLoading(true);
            const response = await getSalaryReportApi({
                limit: currentLimit,
                page: currentPage + 1,
                search: searchQuery,
                employeeId: appliedFilters.employeeId,
                lotNo: appliedFilters.lotNo,
                dNo: appliedFilters.dNo,
                pic: appliedFilters.pic,
                status: appliedFilters.status,
                alter: appliedFilters.alter,
                reject: appliedFilters.reject,
                startDate: appliedFilters.startDate,
                endDate: appliedFilters.endDate
            });
            setSalaryData({ 
                records: response.data, 
                pagination: response?.pagination,
                totalsOverall: response?.totalsOverall || null
            });

            // Don't extract filter options from filtered data
            // Filter options should remain static with all available values
        } catch (error) {
            setSalaryData({ records: [] });
            toast.error('Failed to fetch salary report. Please try again.', { toastId: 'salary-fetch-error' });
            console.error('Error fetching salary report:', error);
        } finally {
            setLoading(false);
        }
    };

const preloadDesigns = async (records) => {
    const map = {};
    console.log('preloadDesigns called with records:', records);

    for (const row of records) {
        // Only fetch design if this row is RCProcess and has dNo
        if (row.model === "RcProcess" && row.dNo && !map[row.dNo]) {
             console.log('Design data for RCProcess DNo', row.dNo);
            try {
                // const lotNoData = await getDesignByNumberAndStatus(row.dNo);
                // console.log('Design data for RCProcess DNo',lotNoData);
                const designData = await getDesignByNumber(row.dNo);
                map[row.dNo] = designData?.data || null;
                // console.log('designData',designData);
            }catch (error) {
    // console.error('Error fetching design for DNo:', row.dNo);
    // console.error('Message:', error.message);
    // console.error('Status:', error?.response?.status);
    // console.error('Response data:', error?.response?.data);
    map[row.dNo] = null;
}

        }
    }

    setDesignMap(map);
};


    // Filter functions
    const handleApplyFilter = () => {
        setAppliedFilters(tempFilters);
        setCurrentPage(0);

        // Update URL with filter params
        const params = new URLSearchParams();
        if (tempFilters.employeeId) params.set('employeeId', tempFilters.employeeId);
        if (tempFilters.status) params.set('status', tempFilters.status);
        if (tempFilters.dNo) params.set('dNo', tempFilters.dNo);
        if (tempFilters.startDate) params.set('startDate', tempFilters.startDate);
        if (tempFilters.endDate) params.set('endDate', tempFilters.endDate);
        setSearchParams(params);
    };

    const handleClearFilter = () => {
        const clearedFilters = {
            employeeId: '',
            lotNo: '',
            dNo: '',
            pic: '',
            status: '',
            alter: '',
            reject: '',
            startDate: '',
            endDate: ''
        };
        setAppliedFilters(clearedFilters);
        setTempFilters(clearedFilters);
        setCurrentPage(0);

        // Clear URL params
        setSearchParams(new URLSearchParams());
    };

    useEffect(() => {
        fetchSalaryData();
    }, [searchQuery, appliedFilters , currentLimit , currentPage]);

    useEffect(() => {
        // Block extra API calls: don't preload design details here.
        // Without designMap, RC rows will fall back to non-expanded behavior.
        if (salaryData.records.length > 0) {
            setDesignMap({});
        }
    }, [salaryData.records]);

        // const handleSort = (key) => {
        //     let direction = "asc";
        //     if (sortConfig.key === key && sortConfig.direction === "asc") {
        //         direction = "desc";
        //     }
        //     setSortConfig({ key, direction });
        //     setCurrentPage(0);
        // };

    const handlePageChangeForTable = (newPageZeroBased) => {
        setCurrentPage(newPageZeroBased);
    };

    const handleRowsPerPageChangeForTable = (newRowsPerPage) => {
        setCurrentLimit(newRowsPerPage);
        setCurrentPage(0);
    };

    const handleTempFilterChange = (field, value) => {
        setTempFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const isAnyFilterApplied = () => {
        return appliedFilters.employeeName || appliedFilters.lotNo || appliedFilters.dNo || appliedFilters.pic || appliedFilters.startDate || appliedFilters.endDate;
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (appliedFilters.employeeName) count++;
        if (appliedFilters.lotNo) count++;
        if (appliedFilters.dNo) count++;
        if (appliedFilters.pic) count++;
        if (appliedFilters.alter) count++;
        if (appliedFilters.reject) count++;
        if (appliedFilters.startDate) count++;
        if (appliedFilters.endDate) count++;
        return count;
    };

    const getCurrentReportFilters = () => ({
        search: searchQuery,
        employeeId: appliedFilters.employeeId,
        lotNo: appliedFilters.lotNo,
        dNo: appliedFilters.dNo,
        pic: appliedFilters.pic,
        status: appliedFilters.status,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
    });

    const downloadBlobFile = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    // Excel export function
    const handleExcelDownload = async () => {
        try {
            setExportLoading(true);

            if (downloadExcelApi) {
                const blob = await downloadExcelApi({
                    ...getCurrentReportFilters(),
                    isSalaryExcel: false,
                });
                downloadBlobFile(
                    blob,
                    `salary-report-${new Date().toISOString().split("T")[0]}.xlsx`
                );
                toast.success('Excel file downloaded successfully!', { toastId: 'excel-download-success' });
                return;
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Salary Report");

            // Same columns and order as current table
            worksheet.columns = [
                { header: "Date", key: "date", width: 14 },
                { header: "Emp Name", key: "empName", width: 20 },
                { header: "Emp Code", key: "empCode", width: 14 },
                { header: "D. No.", key: "dNo", width: 12 },
                { header: "Lot No.", key: "lotNo", width: 12 },
                { header: "Process Name", key: "processName", width: 18 },
                { header: "Role", key: "role", width: 12 },
                { header: "Total Pcs", key: "totalPcs", width: 12 },
                { header: "Price", key: "price", width: 12 },
                { header: "RC Pic", key: "rcPic", width: 10 },
                { header: "Alter", key: "alter", width: 10 },
                { header: "Reject", key: "reject", width: 10 },
                { header: "Net Pay", key: "netPay", width: 12 },
            ];

            tableData.forEach((row) => {
                const dateValue = row._isChild ? "" : new Date(row.updatedAt || row.createdAt).toLocaleDateString("en-GB");
                const empName =
                    row.employeeName ||
                    (row.user && typeof row.user === "object"
                        ? (row.model === "BillscanProcess" || row.model === "BillScanProcess"
                            ? row.user.username || "-"
                            : `${row.user.nickname || ""}`.trim() || `${row.user.firstName || ""} ${row.user.lastName || ""}`.trim() || "-")
                        : "-");
                const empCode =
                    row.employeeCode ||
                    (row.user && typeof row.user === "object" ? row.user.employeeName || "-" : "-");
                const totalPcs = row.totalPic ?? row.pic ?? "-";
                const rcPic = row.rcPic !== undefined && row.rcPic !== null ? row.rcPic : "-";
                const alter = row.alter !== undefined && row.alter !== null ? row.alter : "-";
                const reject = row.reject !== undefined && row.reject !== null ? row.reject : "-";
                const netPay = row.netAmount ?? row.totalPicPrice;

                worksheet.addRow({
                    date: dateValue,
                    empName,
                    empCode,
                    dNo: row._isChild ? "" : row.dNo || "-",
                    lotNo: row._isChild ? "" : row.lotNo || "-",
                    processName: row._isChild ? "" : row.processId?.processName || row.model || "-",
                    role: row.role || "-",
                    totalPcs,
                    price: row.price ?? "-",
                    rcPic,
                    alter,
                    reject,
                    netPay: netPay !== undefined && netPay !== null ? Number(netPay).toFixed(2) : "-",
                });
            });

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE0E0E0" },
            };

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `salary-report-${new Date().toISOString().split("T")[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Excel file downloaded successfully!', { toastId: 'excel-download-success' });
        } catch (error) {
            toast.error('Failed to download Excel file. Please try again.', { toastId: 'excel-download-error' });
            console.error('Error downloading Excel:', error);
        } finally {
            setExportLoading(false);
        }
    };

    // Salary Excel download function
    const handleSalaryExcelDownload = async () => {
        try {
            setExportSalaryExcelLoading(true);

            if (downloadExcelApi) {
                const blob = await downloadExcelApi({
                    ...getCurrentReportFilters(),
                    isSalaryExcel: true,
                });
                downloadBlobFile(
                    blob,
                    `only-amount-${new Date().toISOString().split("T")[0]}.xlsx`
                );
                toast.success('Only Amount Excel downloaded successfully!', {
                    toastId: 'salary-excel-download-success'
                });
                return;
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Only Amount");

            worksheet.columns = [
                { header: "Emp Name", key: "empName", width: 28 },
                { header: "Net Pay Total", key: "netPayTotal", width: 16 },
            ];

            // Group net pay by employee name from current table data
            const totalsByEmployee = new Map();
            tableData.forEach((row) => {
                const empName =
                    row.employeeName ||
                    (row.user && typeof row.user === "object"
                        ? (row.model === "BillscanProcess" || row.model === "BillScanProcess"
                            ? row.user.username || "-"
                            : `${row.user.nickname || ""}`.trim() || `${row.user.firstName || ""} ${row.user.lastName || ""}`.trim() || "-")
                        : "-");
                const netPay = Number(row.netAmount ?? row.totalPicPrice ?? 0);
                if (!empName || empName === "-") return;
                totalsByEmployee.set(empName, (totalsByEmployee.get(empName) || 0) + (Number.isFinite(netPay) ? netPay : 0));
            });

            Array.from(totalsByEmployee.entries()).forEach(([empName, netPayTotal]) => {
                worksheet.addRow({
                    empName,
                    netPayTotal: Number(netPayTotal.toFixed(2)),
                });
            });

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE0E0E0" },
            };
            worksheet.getColumn("netPayTotal").numFmt = "#,##0.00";

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `only-amount-${new Date().toISOString().split("T")[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            
            toast.success('Only Amount Excel downloaded successfully!', {
                toastId: 'salary-excel-download-success'
            });
        } catch (error) {
            toast.error('Failed to download Only Amount Excel. Please try again.', {
                toastId: 'salary-excel-download-error'
            });
            console.error('Error downloading Only Amount Excel:', error);
        } finally {
            setExportSalaryExcelLoading(false);
        }
    };

    // PDF download function
    const handlePDFDownload = async () => {
        try {
            setExportPDFLoading(true);

            // Fetch fresh data or use existing
            const response = await getAdminSalaryReport({
                search: searchQuery,
                employeeId: appliedFilters.employeeId,
                lotNo: appliedFilters.lotNo,
                dNo: appliedFilters.dNo,
                pic: appliedFilters.pic,
                status: appliedFilters.status,
                alter: appliedFilters.alter,
                reject: appliedFilters.reject,
                startDate: appliedFilters.startDate,
                endDate: appliedFilters.endDate
            });
            if (response && response?.data) {
                generateSalaryReportPDF(response?.data, 'salary-report');
                toast.success('PDF file downloaded successfully!', {
                    toastId: 'pdf-download-success'
                });
            } else {
                toast.error('No data found for PDF export.', {
                    toastId: 'pdf-download-error'
                });
            }
        } catch (error) {
            toast.error('Failed to download PDF file. Please try again.', {
                toastId: 'pdf-download-error'
            });
            console.error('Error downloading PDF:', error);
        } finally {
            setExportPDFLoading(false);
        }
    };
    // const SortableTableHeader = ({ label, sortKey }) => {
    //     const isSorted = sortConfig.key === sortKey;
    //     return (
    //         <div
    //             className="flex items-center space-x-2 cursor-pointer w-max"
    //             onClick={() => handleSort(sortKey)}
    //         >
    //             <span>{label}</span>
    //             <div className="flex flex-col">
    //                 <LucideChevronUp
    //                     size={14}
    //                     className={`${isSorted && sortConfig.direction === "asc"
    //                         ? "text-light-primary"
    //                         : "text-light-lightGrey"
    //                         }`}
    //                 />
    //                 <LucideChevronDown
    //                     size={14}
    //                     className={`${isSorted && sortConfig.direction === "desc"
    //                         ? "text-light-primary"
    //                         : "text-light-lightGrey"
    //                         }`}
    //                 />
    //             </div>
    //         </div>
    //     );
    // };

    const getRcEmployees = (row) => {
    if (row?.model !== "RcProcess") return [];

    return [
        row.single && { ...row.single, _rcRole: "Single" },
        row.fatlock && { ...row.fatlock, _rcRole: "Fatlock" },
        row.kansai && { ...row.kansai, _rcRole: "Kansai" }
    ].filter(Boolean);
};

//     const columns = useMemo(
//         () => [
//             {
//                 header: <SortableTableHeader label="Date" sortKey="updatedAt" />,
//                 accessor: "updatedAt",
//                 cell: (row) => {
//                     const dateValue = row.updatedAt || row.createdAt;
//                     if (!dateValue) return "-";
                
//                     const date = new Date(dateValue);
//                     return date.toLocaleDateString("en-IN", {
//                         day: "2-digit",
//                         month: "short",
//                         year: "numeric"
//                     });
//                 }
//             },
//             {
//                 header: <SortableTableHeader label="Employee Name" sortKey="employeeName" />,
//                 accessor: "employeeName",
//                 cell: (row) => {
//                     // If user is an array, join all names
//                     if (Array.isArray(row.user)) {
//                         const names = row.user.map(
//                             u => {
//                                 if (typeof u === 'object' && u !== null) {
//                                     return `${u.firstName || ""} ${u.lastName || ""}`.trim();
//                                 }
//                                 // If it's a string, just return it
//                                 return u;
//                             }
//                         ).filter(Boolean);
//                         return names.length ? names.join(", ") : "-";
//                     }
//                     // If user is a single object
//                     if (row.user && typeof row.user === 'object') {
//                         const fullName = `${row.user.firstName || ""} ${row.user.lastName || ""}`.trim();
//                         return fullName || "-";
//                     }
//                     // If user is a string or not present
//                     return row.user || "-";
//                 }
//             },
//             {
//                 header: <SortableTableHeader label="D. No." sortKey="d.no" />,
//                 accessor: "D.No.",
//                 cell: (row) => row.dNo || "-"
//             },
//             {
//                 header: <SortableTableHeader label="Lot No." sortKey="lotNo" />,
//                 accessor: "LotNo",
//                 cell: (row) => row.lotNo || "-"
//             },
//             {
//                 header: <SortableTableHeader label="Process Name" sortKey="processName" />,
//                 accessor: "processName",
//                cell: (row) => {
   
//                   const isRC = row?.model === "RcProcess";
//             const rcEmployees = getRcEmployees(row);

//             // Get the design corresponding to this row's D.No
//             const design = designMap[row.dNo];

//             // Find the RC process in that design
//             const rcProcess = design?.processes?.find(p => p.processName?.toLowerCase() === 'rc');

//             // Extract machine prices
//             const singlePrice = rcProcess?.machineDetails?.find(m => m.machineName?.toLowerCase() === 'single')?.baseRate || 0;
//             const fatlockPrice = rcProcess?.machineDetails?.find(m => m.machineName?.toLowerCase() === 'fat lock' || m.machineName?.toLowerCase() === 'fatlock')?.baseRate || 0;
//             const kansaiPrice = rcProcess?.machineDetails?.find(m => m.machineName?.toLowerCase() === 'kansai')?.baseRate || 0;

//     return (
//         <div className="space-y-2">
//             {/* Main process name */}
//             <div className="font-medium">
//                 {row?.processId?.processName || row?.model || "-"}
//             </div>

//   {row.model === "RcProcess" && (
//         <tr className="bg-light-gray_50">
//           <td colSpan={columns.length} className="p-4">
//             <RcInnerTable row={row} designMap={designMap} />
//           </td>
//         </tr>
//       )}
      
          
//         </div>
//     );
// }
//             },
//             {
//                 header: <SortableTableHeader label="Employee code" sortKey="employeeCode" />,
//                 accessor: "employeeCode",
//                 cell: (row) => {
//                     if (Array.isArray(row.user)) {
//                         // If user is an array, join all employee codes
//                         const codes = row.user
//                             .map(u => (typeof u === 'object' && u !== null ? u.employeeName : u))
//                             .filter(Boolean);
//                         return codes.length ? codes.join(", ") : "-";
//                     }
//                     if (row.user && typeof row.user === 'object') {
//                         return row.user.employeeName || "-";
//                     }
//                     return row.user || "-";
//                 }
//             },
//             {
//                 header: <SortableTableHeader label="Total Pic" sortKey="pic" />,
//                 accessor: "pic",
//                 cell: (row) => row.pic || "-"
//             },
//             {
//                 header: <SortableTableHeader label="Price" sortKey="price" />,
//                 accessor: "price",
//                 cell: (row) => row.price || "-"
//             },
//             {
//                 header: <SortableTableHeader label="RC Pic" sortKey="rcPic" />,
//                 accessor: "rcPic",
//                 cell: (row) => {
//                     const pic = Number(row.pic) || 0;
//                     const alter = Number(row.alter) || 0;
//                     const reject = Number(row.reject) || 0;
                
//                     const rcPic = pic - alter - reject;
//                     return rcPic >= 0 ? rcPic : 0;
//                 }
//             },
//             {
//                 header: <SortableTableHeader label="Alter" sortKey="alter" />,
//                 accessor: "alter",
//                 cell: (row) => row.alter || "-"
//             },
//             {
//                 header: <SortableTableHeader label="Reject" sortKey="reject" />,
//                 accessor: "reject",
//                 cell: (row) => row.reject || "-"
//             },
//             {
//                 header: <SortableTableHeader label="Net Payable" sortKey="totalPrice" />,
//                 accessor: "totalPrice",
//                 cell: (row) => row.totalPicPrice ? Number(row.totalPicPrice).toFixed(2) : "-"
//             },
//         ],
//         [designMap,sortConfig]
//     );

const columns = useMemo(() => [
  {
    header: "Date",
    cell: (row) =>
      row._isChild ? "" : new Date(row.updatedAt || row.createdAt).toLocaleDateString("en-GB"),
  },
  {
    header: "Emp Name",
    cell: (row) => {
      if (row.employeeName) {
        return row.employeeName;
      }
      if (row.user && typeof row.user === "object") {
        // For BillscanProcess, use username
        if (row.model === "BillscanProcess" || row.model === "BillScanProcess") {
          return row.user.username || "-";
        }
        // For other processes, use nickname or firstName + lastName
        return `${row.user.nickname || ""}`.trim() || 
               `${row.user.firstName || ""} ${row.user.lastName || ""}`.trim() || 
               "-";
      }
      return "-";
    },
  },
  {
    header: "Emp Code",
    cell: (row) =>
      row.employeeCode ||
      (row.user && typeof row.user === "object"
        ? row.user.employeeName || "-"
        : "-"),
  },
  {
    header: "D. No.",
    cell: (row) => (row._isChild ? "" : row.dNo || "-"),
  },
  {
    header: "Lot No.",
    cell: (row) => (row._isChild ? "" : row.lotNo || "-"),
  },
  {
    header: "Process Name",
    cell: (row) =>
      row._isChild ? "" : row.processId?.processName || row.model || "-",
  },
  {
    header: "Role",
    cell: (row) => row.role || "-",
  },
  {
    header: "Total Pcs",
    cell: (row) => {
      // Use exact value from API: totalPic if available, otherwise pic
      return row.totalPic ?? row.pic ?? "-";
    },
  },
  {
    header: "Price",
    cell: (row) => row.price ?? "-",
  },
  {
    header: "RC Pic",
    cell: (row) => {
      // Use exact rcPic value from API, no client-side calculation
      const rcPicValue = row.rcPic !== undefined && row.rcPic !== null ? row.rcPic : "-";
      // Use totalPic from API directly for color comparison
      const totalPcs = Number(row.totalPic ?? row.pic) || 0;
      const rcPicNum = Number(rcPicValue) || 0;

      let rcPicColorStyle = {};
      if (totalPcs > 0 && rcPicValue !== "-") {
        rcPicColorStyle = rcPicNum === totalPcs
          ? { color: '#16a34a' }  // green if matches
          : { color: '#dc2626' }; // red if doesn't match
      }

      return (
        <span className="font-semibold" style={rcPicColorStyle}>
          {rcPicValue}
        </span>
      );
    },
  },
  {
    header: "Alter",
    cell: (row) => {
      // Use exact alter value from API
      const alterValue = row.alter !== undefined && row.alter !== null ? row.alter : "-";
      const val = Number(alterValue) || 0;
      return (
        <span className={val > 0 ? "text-red-600 font-semibold" : ""}>
          {alterValue}
        </span>
      );
    },
  },
  {
    header: "Reject",
    cell: (row) => {
      // Use exact reject value from API
      const rejectValue = row.reject !== undefined && row.reject !== null ? row.reject : "-";
      const val = Number(rejectValue) || 0;
      return (
        <span className={val > 0 ? "text-red-600 font-semibold" : ""}>
          {rejectValue}
        </span>
      );
    },
  },
  {
    header: "Net Pay",
    // Use netAmount from API if available, fallback to totalPicPrice
    cell: (row) => {
      const netPay = row.netAmount ?? row.totalPicPrice;
      return netPay !== undefined && netPay !== null ? Number(netPay).toFixed(2) : "-";
    },
  },
], []);

const buildRcGroupedRows = (records, designMap) => {
  const rows = [];

  records.forEach(row => {
    const isRC = row.model === "RcProcess";

    // ✅ NON-RC PROCESS: use API data as-is, no client-side calculations
    if (!isRC) {
      rows.push({
        ...row,
        totalPicPrice: row.netAmount ?? row.totalPicPrice ?? 0,
        _isChild: false,
        _rowSpan: 1,
      });
      return;
    }

    // ✅ RC PROCESS: expand by employee
    const design = designMap[row.dNo];
    const rcProcess = design?.processes?.find(
      p => p.processName?.toLowerCase() === "rc"
    );

    if (!rcProcess) {
      rows.push({
        ...row,
        totalPicPrice: row.netAmount ?? row.totalPicPrice ?? 0,
        _isChild: false,
        _rowSpan: 1,
      });
      return;
    }

    const getPrice = name =>
      rcProcess.machineDetails?.find(
        m => m.machineName?.toLowerCase() === name
      )?.baseRate || 0;

    const pic = Number(row.pic) || 0;
    const alter = Number(row.alter) || 0;
    const reject = Number(row.reject) || 0;
    const finalPcs = Math.max(0, pic - alter - reject);

    const employees = [
      row.single && { ...row.single, role: "Single", price: getPrice("single") },
      row.fatlock && { ...row.fatlock, role: "Fatlock", price: getPrice("fat lock") },
      row.kansai && { ...row.kansai, role: "Kansai", price: getPrice("kansai") },
    ].filter(Boolean);

    if (employees.length === 0) {
      rows.push({
        ...row,
        totalPicPrice: row.netAmount ?? row.totalPicPrice ?? 0,
        _isChild: false,
        _rowSpan: 1,
      });
      return;
    }

    employees.forEach(emp => {
      rows.push({
        ...row,
        employeeName: `${emp.nickname || ""}`.trim() || `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
        employeeCode: emp.employeeName || "-",
        role: emp.role,
        price: emp.price,
        finalPcs: finalPcs,
        totalPicPrice: emp.price * finalPcs,
      });
    });
  });

  return rows;
};


// const buildRcGroupedRows = (records, designMap) => {
//   const rows = [];

//   records.forEach(row => {
//     // ✅ NON-RC PROCESS → KEEP AS-IS (OLD BEHAVIOR)
//     if (row.model !== "RcProcess") {
//       rows.push({
//         ...row,
//         _isChild: false,
//         _rowSpan: 1,
//       });
//       return;
//     }

//     // ✅ RC PROCESS ONLY
//     const design = designMap[row.dNo];
//     const rcProcess = design?.processes?.find(
//       p => p.processName?.toLowerCase() === "rc"
//     );

//     // If RC design missing → fallback to normal row
//     if (!rcProcess) {
//       rows.push({
//         ...row,
//         _isChild: false,
//         _rowSpan: 1,
//       });
//       return;
//     }

//     const getPrice = (name) =>
//       rcProcess.machineDetails?.find(
//         m => m.machineName?.toLowerCase() === name
//       )?.baseRate || 0;

//     const pic = Number(row.pic) || 0;
//     const alter = Number(row.alter) || 0;
//     const reject = Number(row.reject) || 0;
//     const finalPcs = pic - alter - reject;

//     const employees = [
//       row.single && {
//         ...row.single,
//         role: "Single",
//         price: getPrice("single"),
//       },
//       row.fatlock && {
//         ...row.fatlock,
//         role: "Fatlock",
//         price: getPrice("fat lock"),
//       },
//       row.kansai && {
//         ...row.kansai,
//         role: "Kansai",
//         price: getPrice("kansai"),
//       },
//     ].filter(Boolean);

//     // If no RC employees → fallback
//     if (!employees.length) {
//       rows.push({
//         ...row,
//         _isChild: false,
//         _rowSpan: 1,
//       });
//       return;
//     }

//   employees.forEach(emp => {
//   rows.push({
//     ...row,

//     employeeName: `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
//     employeeCode: emp.employeeName || "-",
//     role: emp.role,
//     price: emp.price,
//     finalPcs,
//     totalPicPrice: emp.price * finalPcs,
//   });
// });

//   });

//   return rows;
// };


    const tableData = useMemo(
  () => buildRcGroupedRows(salaryData.records, designMap),
  [salaryData.records, designMap]
);

    return (
        <>
            {(loading || searchLoading) && <LoaderComponent size={56} />}
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
                />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default">
                            Salary Report
                        </h1>
                        <div className="flex items-center gap-4 max-sm:w-full max-[320px]:flex-col max-[320px]:gap-2.5">
                        {salaryData.totalsOverall?.totalNetAmount !== undefined && (
                            <div className="text-lg font-semibold text-light-darkGrey">
                                Total Amount : ₹{Number(salaryData.totalsOverall.totalNetAmount).toFixed(2)}
                            </div>
                        )}
                        <Button
                            variant="primary"
                            size="medium"
                            icon={<LucideDownload size={20} />}
                            label={exportSalaryExcelLoading ? "Downloading..." : "Only Amount Excel"}
                            onClick={handleSalaryExcelDownload}
                            disabled={exportSalaryExcelLoading}
                            className="flex items-center space-x-2 shadow-none font-normal !rounded-md px-4 py-2 text-light-white transition-colors duration-200 focus:ring-0 max-sm:w-full max-sm:justify-center"
                        />
                        <Button
                            variant="primary"
                            size="medium"
                            icon={<LucideDownload size={20} />}
                            label={exportLoading ? "Downloading..." : "Excel Download"}
                            onClick={handleExcelDownload}
                            disabled={exportLoading}
                            className="flex items-center space-x-2 shadow-none font-normal !rounded-md px-4 py-2 text-light-white transition-colors duration-200 focus:ring-0 max-sm:w-full max-sm:justify-center"
                        />
                        <Button
                            variant="primary"
                            size="medium"
                            icon={showFilters ? <LucideFilter size={20} className="rotate-180 transition-transform duration-200 text-white" /> : <LucideFilter size={20} className="text-white" />}
                            label={showFilters ? "Close" : "Filter"}
                            onClick={() => setShowFilters(prev => !prev)}
                            className={`flex items-center space-x-2 shadow-none font-normal !rounded-md px-4 py-2 transition-colors duration-200 max-sm:w-full max-sm:justify-center ${
                                showFilters 
                                    ? "bg-red-500 !text-white hover:bg-red-600 border-red-500" 
                                    : "bg-light-primary !text-white hover:bg-light-primary_hover border-light-primary"
                            }`}
                        />
                        </div>
                    </div>
                </div>

                {/* Horizontal Filter Section */}
                {showFilters && (
                    <div className="py-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 mt-4">
                        {/* First Row: Status, Employee, Date Range, D No */}
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Filter by Status */}
                            <div className="flex-1 min-w-[180px]">
                                <SelectElement
                                    options={STATUS_OPTIONS}
                                    value={tempFilters.status || null}
                                    onChange={(val) => {
                                        handleTempFilterChange('status', val?.value ?? val ?? '');
                                        // Clear employee selection when status changes
                                        const nextStatus = val?.value ?? val ?? '';
                                        if (nextStatus !== (tempFilters.status?.value ?? tempFilters.status ?? '')) {
                                            handleTempFilterChange('employeeId', '');
                                        }
                                    }}
                                    placeholder="Select Status"
                                    isClearable={true}
                                    className="w-full"
                                    menuPortalTarget={document.body}
                                />
                            </div>

                            {/* Filter by Employee (filtered based on status) */}
                            <div className="flex-1 min-w-[180px]">
                                <SelectElement
                                    options={employeeOptions}
                                    value={tempFilters.employeeId || null}
                                    onChange={(val) => handleTempFilterChange('employeeId', val || '')}
                                    placeholder={employeeOptions.length > 0 ? "Select Employee" : "No employees available"}
                                    isClearable={true}
                                    className="w-full"
                                    menuPortalTarget={document.body}
                                    isDisabled={employeeOptions.length === 0}
                                />
                            </div>

                            {/* Date Range Picker */}
                            <div className="flex-1 min-w-[300px] relative custom-datepicker-wrapper" style={{ zIndex: 100 }}>
                                <DatePicker
                                    selectsRange={true}
                                    startDate={tempFilters.startDate ? parseISO(tempFilters.startDate) : null}
                                    endDate={tempFilters.endDate ? parseISO(tempFilters.endDate) : null}
                                    onChange={(update) => {
                                        const [start, end] = update;
                                        handleTempFilterChange('startDate', start ? format(start, 'yyyy-MM-dd') : '');
                                        handleTempFilterChange('endDate', end ? format(end, 'yyyy-MM-dd') : '');
                                    }}
                                    isClearable={true}
                                    placeholderText="Select Date Range (From - To)"
                                    className="w-full px-4 py-3 rounded-md transition-all duration-200 focus:outline-none border border-[#CFC5B9] focus:ring-2 bg-[#F9F6F1] text-[#0B1C30] placeholder-[#7D766C] focus:ring-[rgba(125,118,108,0.35)] focus:border-[#7D766C]"
                                    dateFormat="dd/MM/yyyy"
                                    popperClassName="datepicker-popper-high-z"
                                />
                            </div>

                            {/* Filter by D No */}
                            <div className="flex-1 min-w-[180px]">
                                <SelectElement
                                    options={dNoOptions}
                                    value={tempFilters.dNo || null}
                                    onChange={(val) => handleTempFilterChange('dNo', val || '')}
                                    placeholder={dNoOptions.length > 0 ? "Select D No" : "No D numbers available"}
                                    isClearable={true}
                                    className="w-full"
                                    menuPortalTarget={document.body}
                                    isDisabled={dNoOptions.length === 0}
                                />
                            </div>
                        </div>

                        {/* Second Row: Search, Apply, Clear */}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            {/* Search Field */}
                            <div className="flex-1 min-w-[300px]">
                                <InputElement
                                    type="text"
                                    placeholder="Search report..."
                                    value={searchQuery}
                                    onChange={(value) => {
                                        setSearchQuery(value);
                                        setCurrentPage(0);
                                    }}
                                    variant="size_44"
                                    className="w-full"
                                    is_required={false}
                                    extra_text_before={
                                        searchLoading ? (
                                            <LucideLoader size={20} className="text-light-primary animate-spin" />
                                        ) : (
                                            <LucideSearch size={20} className="text-light-lightGrey" />
                                        )
                                    }
                                />
                            </div>

                            {/* Apply Button */}
                            <div className="flex-shrink-0">
                                <Button
                                    variant="primary"
                                    size="medium"
                                    label="Apply"
                                    onClick={handleApplyFilter}
                                    className="shadow-none font-normal !rounded-md px-4 py-2 text-light-white transition-colors duration-200 focus:ring-0"
                                />
                            </div>

                            {/* Clear Button */}
                            <div className="flex-shrink-0">
                                <Button
                                    variant="outline"
                                    size="medium"
                                    label="Clear"
                                    onClick={handleClearFilter}
                                    className="text-light-natural_700 hover:bg-light-natural_50"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 w-full">
                    <CommonTable
                        columns={columns}
                        data={tableData}
                        count={salaryData.pagination?.total || salaryData.records.length}
                        page={currentPage}
                        rowsPerPage={currentLimit}
                        onPageChange={handlePageChangeForTable}
                        onRowsPerPageChange={handleRowsPerPageChangeForTable}
                        rowsPerPageOptions={[25, 50, 75, 100, 150]}
                        emptyDataMessage={searchQuery ? "No items found matching your search." : "No items available."}
                        tableClassName="w-full min-w-full divide-y divide-gray-200"
                    />
                </div>
            </div>
        </>
    );
};

export default SalaryReport; 
