import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LucideFilter } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SelectElement from "../component/common/Select";
import Button from "../component/common/Button";
import CommonTable from "../component/common/Table/Table";
import LoaderComponent from "../component/common/Loader";
import { getDesignProductReport, getDesignNumbers } from '../apis/designApi';

const PRODUCT_REPORT_FILTERS_KEY = 'productReportFilters';

const readStoredFilters = () => {
    try {
        const raw = sessionStorage.getItem(PRODUCT_REPORT_FILTERS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return {
            dNo: parsed.dNo || null,
            colors: Array.isArray(parsed.colors) ? parsed.colors : [],
            sizes: Array.isArray(parsed.sizes) ? parsed.sizes : [],
            showFilters: Boolean(parsed.showFilters),
        };
    } catch (_) {
        return null;
    }
};

const writeStoredFilters = (payload) => {
    try {
        sessionStorage.setItem(PRODUCT_REPORT_FILTERS_KEY, JSON.stringify(payload));
    } catch (_) {
        /* ignore */
    }
};

const parseCsvParam = (raw) =>
    String(raw || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

const ProductReport = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const initialStored = readStoredFilters();
    const urlDNo = searchParams.get('dNo') || null;
    const urlColors = parseCsvParam(searchParams.get('color'));
    const urlSizes = parseCsvParam(searchParams.get('size'));
    const storedMatchesDesign =
        Boolean(initialStored?.dNo) &&
        (!urlDNo || String(initialStored.dNo) === String(urlDNo));

    const [selectedDesignNumber, setSelectedDesignNumber] = useState(
        urlDNo || initialStored?.dNo || null
    );
    const [designOptions, setDesignOptions] = useState([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [showFilters, setShowFilters] = useState(
        Boolean(
            urlColors.length ||
                urlSizes.length ||
                (storedMatchesDesign &&
                    (initialStored.colors.length ||
                        initialStored.sizes.length ||
                        initialStored.showFilters))
        )
    );
    const [selectedColors, setSelectedColors] = useState(() => {
        if (urlColors.length) return urlColors;
        if (storedMatchesDesign) return initialStored.colors;
        return [];
    });
    const [selectedSizes, setSelectedSizes] = useState(() => {
        if (urlSizes.length) return urlSizes;
        if (storedMatchesDesign) return initialStored.sizes;
        return [];
    });
    const [currentPage, setCurrentPage] = useState(0);
    const [currentLimit, setCurrentLimit] = useState(25);
    const [loading, setLoading] = useState(false);
    const [allRecords, setAllRecords] = useState([]);
    const [dynamicColumnOrder, setDynamicColumnOrder] = useState([]);
    const [processColumnMeta, setProcessColumnMeta] = useState([]);

    const selectedColorsRef = useRef(selectedColors);
    const selectedSizesRef = useRef(selectedSizes);
    const selectedDesignRef = useRef(selectedDesignNumber);
    selectedColorsRef.current = selectedColors;
    selectedSizesRef.current = selectedSizes;
    selectedDesignRef.current = selectedDesignNumber;

    const persistFilters = useCallback((dNo, colors, sizes, openFilters) => {
        writeStoredFilters({
            dNo: dNo || null,
            colors: Array.isArray(colors) ? colors : [],
            sizes: Array.isArray(sizes) ? sizes : [],
            showFilters: Boolean(openFilters),
        });
    }, []);

    const extractColumnOrder = useCallback((reportArray, processColumns = []) => {
        if (Array.isArray(processColumns) && processColumns.length > 0) {
            return processColumns
                .map((col) => col.key)
                .filter((key) => !['color', 'size', 'total', 'completed'].includes(String(key).toLowerCase()));
        }

        if (!Array.isArray(reportArray) || reportArray.length === 0) {
            return [];
        }
        
        const firstItem = reportArray[0];
        if (!firstItem || typeof firstItem !== 'object') {
            return [];
        }
        
        const excludeFields = ['color', 'size', 'total', 'completed'];
        return Object.keys(firstItem).filter(key => 
            !excludeFields.includes(key.toLowerCase())
        );
    }, []);

    const transformApiData = useCallback((apiData) => {
        let reportArray = [];
        let processColumns = [];
        
        if (apiData && typeof apiData === 'object') {
            if (apiData.data && apiData.data.report && Array.isArray(apiData.data.report)) {
                reportArray = apiData.data.report;
                processColumns = apiData.data.processColumns || [];
            } else if (Array.isArray(apiData)) {
                reportArray = apiData;
            } else if (apiData.report && Array.isArray(apiData.report)) {
                reportArray = apiData.report;
            }
        }
        
        if (!Array.isArray(reportArray) || reportArray.length === 0) {
            return [];
        }
        
        setProcessColumnMeta(Array.isArray(processColumns) ? processColumns : []);

        const columnOrder = extractColumnOrder(reportArray, processColumns);
        setDynamicColumnOrder(columnOrder);
        
        return reportArray.map(item => {
            const parseValue = (value) => {
                if (typeof value === 'string') {
                    const match = value.match(/(\d+)\s*\((\d+)\)/);
                    if (match) {
                        return {
                            lotCount: parseInt(match[1], 10) || 0,
                            totalPic: parseInt(match[2], 10) || 0
                        };
                    }
                    const num = parseInt(value, 10);
                    if (!isNaN(num)) {
                        return { lotCount: num, totalPic: 0 };
                    }
                }
                if (typeof value === 'object' && value !== null) {
                    return {
                        lotCount: value.lotCount || 0,
                        totalPic: value.totalPic || 0
                    };
                }
                return { lotCount: 0, totalPic: 0 };
            };
            
            const row = {
                color: item.color || 'UNKNOWN',
                size: item.size || '-',
            };
            
            columnOrder.forEach(key => {
                row[key] = parseValue(item[key]);
            });
            
            if (item.total !== undefined) {
                row.total = parseValue(item.total);
            }
            if (item.completed !== undefined) {
                row.completed = parseValue(item.completed);
            }
            
            return row;
        });
    }, [extractColumnOrder]);

    const fetchProductReport = useCallback(async (designNumber) => {
        if (!designNumber) return;
        setLoading(true);
        try {
            const response = await getDesignProductReport(designNumber);
            let apiData = null;
            if (response && typeof response === 'object') {
                if (response.data && response.data.report) {
                    apiData = response;
                } else if (response.data && Array.isArray(response.data)) {
                    apiData = response.data;
                } else if (Array.isArray(response)) {
                    apiData = response;
                } else {
                    apiData = response;
                }
            } else {
                apiData = response || [];
            }
            
            const records = transformApiData(apiData);
            setAllRecords(records);
            
            if (!records || records.length === 0) {
                toast.info('No data found for this design number');
            }
        } catch (err) {
            console.error('Error fetching product report:', err);
            toast.error('Failed to load product report');
            setAllRecords([]);
        } finally {
            setLoading(false);
        }
    }, [transformApiData]);

    const colorOptions = useMemo(() => {
        const values = [
            ...new Set(
                allRecords
                    .map((r) => r.color)
                    .filter((c) => c && c !== 'UNKNOWN')
            ),
        ].sort((a, b) => String(a).localeCompare(String(b)));
        return values.map((c) => ({ value: c, label: c }));
    }, [allRecords]);

    const sizeOptions = useMemo(() => {
        const values = [
            ...new Set(
                allRecords
                    .map((r) => r.size)
                    .filter((s) => s && s !== '-')
            ),
        ].sort((a, b) => String(a).localeCompare(String(b)));
        return values.map((s) => ({ value: s, label: s }));
    }, [allRecords]);

    // Re-apply Color/Size from URL or sessionStorage once options exist (case-safe match)
    useEffect(() => {
        if (allRecords.length === 0) return;

        const urlColor = searchParams.get('color');
        const urlSize = searchParams.get('size');
        const stored = readStoredFilters();
        const designKey = selectedDesignNumber || searchParams.get('dNo');

        const fromUrlColors = parseCsvParam(urlColor);
        const fromUrlSizes = parseCsvParam(urlSize);
        const fromStoredColors =
            stored &&
            designKey &&
            stored.dNo &&
            String(stored.dNo) === String(designKey)
                ? stored.colors
                : [];
        const fromStoredSizes =
            stored &&
            designKey &&
            stored.dNo &&
            String(stored.dNo) === String(designKey)
                ? stored.sizes
                : [];

        const wantedColors = fromUrlColors.length ? fromUrlColors : fromStoredColors;
        const wantedSizes = fromUrlSizes.length ? fromUrlSizes : fromStoredSizes;
        if (!wantedColors.length && !wantedSizes.length) return;

        const sameList = (a, b) => {
            const left = [...(a || [])].map((x) => String(x).toLowerCase()).sort();
            const right = [...(b || [])].map((x) => String(x).toLowerCase()).sort();
            return (
                left.length === right.length &&
                left.every((v, i) => v === right[i])
            );
        };

        let opened = false;
        if (wantedColors.length) {
            const wanted = wantedColors.map((c) => String(c).toLowerCase());
            const matched = colorOptions
                .filter((o) => wanted.includes(String(o.value).toLowerCase()))
                .map((o) => o.value);
            if (matched.length && !sameList(matched, selectedColors)) {
                setSelectedColors(matched);
            }
            if (matched.length) opened = true;
        }
        if (wantedSizes.length) {
            const wanted = wantedSizes.map((s) => String(s).toLowerCase());
            const matched = sizeOptions
                .filter((o) => wanted.includes(String(o.value).toLowerCase()))
                .map((o) => o.value);
            if (matched.length && !sameList(matched, selectedSizes)) {
                setSelectedSizes(matched);
            }
            if (matched.length) opened = true;
        }
        if (opened) setShowFilters(true);
    }, [
        allRecords,
        colorOptions,
        sizeOptions,
        searchParams,
        selectedColors,
        selectedSizes,
        selectedDesignNumber,
    ]);

    const filteredRecords = useMemo(() => {
        let rows = allRecords;

        if (selectedColors.length > 0) {
            const colorSet = new Set(
                selectedColors.map((c) => String(c).toLowerCase())
            );
            rows = rows.filter((r) =>
                colorSet.has(String(r.color || '').toLowerCase())
            );
        }

        if (selectedSizes.length > 0) {
            const sizeSet = new Set(
                selectedSizes.map((s) => String(s).toLowerCase())
            );
            rows = rows.filter((r) =>
                sizeSet.has(String(r.size || '').toLowerCase())
            );
        }

        return rows;
    }, [allRecords, selectedColors, selectedSizes]);

    useEffect(() => {
        const fetchDesignOptions = async () => {
            setIsLoadingOptions(true);
            try {
                const response = await getDesignNumbers();
                const numbers = response?.data || response || [];
                if (Array.isArray(numbers) && numbers.length > 0) {
                    const options = numbers.map((dn) => ({ value: dn, label: dn }));
                    setDesignOptions(options);

                    const urlDesignNumber = searchParams.get('dNo');
                    if (urlDesignNumber) {
                        setSelectedDesignNumber(urlDesignNumber);
                    } else if (!selectedDesignNumber && options.length > 0) {
                        setSelectedDesignNumber(options[0].value);
                        const next = new URLSearchParams(searchParams);
                        next.set('dNo', options[0].value);
                        setSearchParams(next, { replace: true });
                    }
                }
            } catch (err) {
                console.error('Error fetching design options:', err);
            } finally {
                setIsLoadingOptions(false);
            }
        };
        fetchDesignOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedDesignNumber) {
            fetchProductReport(selectedDesignNumber);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDesignNumber]);

    const buildProductReportSearch = useCallback((dNo, colors, sizes) => {
        const next = new URLSearchParams();
        if (dNo) next.set('dNo', dNo);
        if (Array.isArray(colors) && colors.length > 0) {
            next.set('color', colors.join(','));
        }
        if (Array.isArray(sizes) && sizes.length > 0) {
            next.set('size', sizes.join(','));
        }
        return next;
    }, []);

    const syncReportFiltersToUrl = useCallback(
        (overrides = {}, { replace = true } = {}) => {
            const dNo =
                overrides.dNo !== undefined
                    ? overrides.dNo
                    : selectedDesignNumber;
            const colors =
                overrides.colors !== undefined
                    ? overrides.colors
                    : selectedColors;
            const sizes =
                overrides.sizes !== undefined ? overrides.sizes : selectedSizes;
            setSearchParams(buildProductReportSearch(dNo, colors, sizes), {
                replace,
            });
        },
        [
            selectedDesignNumber,
            selectedColors,
            selectedSizes,
            buildProductReportSearch,
            setSearchParams,
        ]
    );

    const handleDesignNumberChange = (value) => {
        const prev = selectedDesignRef.current;
        if (value === prev) return;

        setSelectedDesignNumber(value);
        setCurrentPage(0);

        // Only clear Color/Size when user switches to a different design.
        // Ignore transient null/onChange while options hydrate (was wiping filters on Back).
        const switchedDesign = Boolean(prev && value && prev !== value);
        if (switchedDesign) {
            setSelectedColors([]);
            setSelectedSizes([]);
            persistFilters(value, [], [], false);
            syncReportFiltersToUrl(
                { dNo: value, colors: [], sizes: [] },
                { replace: true }
            );
            return;
        }

        if (!value) {
            setAllRecords([]);
            persistFilters(null, selectedColorsRef.current, selectedSizesRef.current, showFilters);
            syncReportFiltersToUrl(
                { dNo: null, colors: selectedColorsRef.current, sizes: selectedSizesRef.current },
                { replace: true }
            );
            return;
        }

        // First selection / restore same design from URL — keep Color/Size
        persistFilters(
            value,
            selectedColorsRef.current,
            selectedSizesRef.current,
            showFilters
        );
        syncReportFiltersToUrl(
            {
                dNo: value,
                colors: selectedColorsRef.current,
                sizes: selectedSizesRef.current,
            },
            { replace: true }
        );
    };

    const handleClearFilters = () => {
        setSelectedColors([]);
        setSelectedSizes([]);
        setCurrentPage(0);
        persistFilters(selectedDesignNumber, [], [], showFilters);
        syncReportFiltersToUrl({ colors: [], sizes: [] }, { replace: true });
    };

    const handleColorFilterChange = (values) => {
        const next = Array.isArray(values) ? values : [];
        setSelectedColors(next);
        setCurrentPage(0);
        persistFilters(selectedDesignNumber, next, selectedSizes, true);
        setShowFilters(true);
        syncReportFiltersToUrl({ colors: next }, { replace: true });
    };

    const handleSizeFilterChange = (values) => {
        const next = Array.isArray(values) ? values : [];
        setSelectedSizes(next);
        setCurrentPage(0);
        persistFilters(selectedDesignNumber, selectedColors, next, true);
        setShowFilters(true);
        syncReportFiltersToUrl({ sizes: next }, { replace: true });
    };

    const formatCellValue = (value) => {
        if (!value) return '0(0)';
        if (typeof value === 'object' && value !== null) {
            const lotCount = Math.round(value.lotCount || 0);
            const totalPic = Math.round(value.totalPic || 0);
            return `${lotCount}(${totalPic})`;
        }
        if (typeof value === 'number') {
            return `${Math.round(value)}(0)`;
        }
        if (typeof value === 'string') {
            const match = value.match(/^(\d+)\(([\d.]+)\)$/);
            if (match) {
                const lotCount = Math.round(parseFloat(match[1]));
                const totalPic = Math.round(parseFloat(match[2]));
                return `${lotCount}(${totalPic})`;
            }
            const num = parseInt(value);
            if (!isNaN(num)) return `${Math.round(num)}(0)`;
        }
        return '0(0)';
    };

    const totals = useMemo(() => {
        if (!filteredRecords || filteredRecords.length === 0) return null;

        const totalsObj = {};
        dynamicColumnOrder.forEach(key => {
            totalsObj[key] = { lotCount: 0, totalPic: 0 };
        });
        totalsObj.total = { lotCount: 0, totalPic: 0 };
        totalsObj.completed = { lotCount: 0, totalPic: 0 };

        filteredRecords.forEach(row => {
            dynamicColumnOrder.forEach(field => {
                const value = row[field];
                if (typeof value === 'object' && value !== null && value.lotCount !== undefined) {
                    if (!totalsObj[field]) {
                        totalsObj[field] = { lotCount: 0, totalPic: 0 };
                    }
                    totalsObj[field].lotCount += value.lotCount || 0;
                    totalsObj[field].totalPic += value.totalPic || 0;
                }
            });
            
            if (row.total) {
                const value = row.total;
                if (typeof value === 'object' && value !== null && value.lotCount !== undefined) {
                    totalsObj.total.lotCount += value.lotCount || 0;
                    totalsObj.total.totalPic += value.totalPic || 0;
                }
            }
            if (row.completed) {
                const value = row.completed;
                if (typeof value === 'object' && value !== null && value.lotCount !== undefined) {
                    totalsObj.completed.lotCount += value.lotCount || 0;
                    totalsObj.completed.totalPic += value.totalPic || 0;
                }
            }
        });

        return totalsObj;
    }, [filteredRecords, dynamicColumnOrder]);

    const handlePageChangeForTable = (newPageZeroBased) => {
        setCurrentPage(newPageZeroBased);
    };

    const handleRowsPerPageChangeForTable = (newRowsPerPage) => {
        setCurrentLimit(newRowsPerPage);
        setCurrentPage(0);
    };

    const tableData = useMemo(() => {
        const data = [...filteredRecords];
        if (totals && data.length > 0) {
            const totalRow = {
                isTotalRow: true,
                color: 'Total',
                size: '-',
            };
            
            dynamicColumnOrder.forEach(key => {
                if (totals[key]) {
                    totalRow[key] = formatCellValue(totals[key]);
                }
            });
            
            if (totals.total) {
                totalRow.total = formatCellValue(totals.total);
            }
            if (totals.completed) {
                totalRow.completed = formatCellValue(totals.completed);
            }
            
            data.push(totalRow);
        }
        return data;
    }, [filteredRecords, totals, dynamicColumnOrder]);

    const getColumnLabel = (fieldName) => {
        const metaLabel = processColumnMeta.find((col) => col.key === fieldName)?.label;
        if (metaLabel) return metaLabel;

        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };

    const getDashboardStatus = (fieldName) => {
        if (!fieldName) return null;

        const columnMeta = processColumnMeta.find((col) => col.key === fieldName);
        if (columnMeta?.processName) {
            return columnMeta.processName;
        }

        if (fieldName === 'forThread') {
            return 'Unloading';
        }

        if (fieldName === 'total' || fieldName === 'completed') {
            return null;
        }

        return null;
    };

    const handleProcessCellClick = (fieldName, row) => {
        if (row.isTotalRow || !row[fieldName] || (row[fieldName].lotCount === 0 && row[fieldName].totalPic === 0)) {
            return;
        }

        const status = getDashboardStatus(fieldName);
        if (!status) {
            return;
        }

        // Refs avoid stale closure + avoid setSearchParams/navigate race wiping filters
        const designNo = selectedDesignRef.current;
        const colors = selectedColorsRef.current || [];
        const sizes = selectedSizesRef.current || [];

        const returnParams = buildProductReportSearch(designNo, colors, sizes);
        const returnTo = returnParams.toString()
            ? `/product-report?${returnParams.toString()}`
            : '/product-report';

        persistFilters(designNo, colors, sizes, true);
        try {
            sessionStorage.setItem('productReportReturnTo', returnTo);
        } catch (_) {
            /* ignore */
        }

        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (designNo) params.append('dNo', designNo);
        if (row.color && row.color !== 'UNKNOWN') params.append('color', row.color);
        if (row.size && row.size !== '-') params.append('size', row.size);
        params.append('from', 'product-report');
        if (colors.length > 0) params.set('prColor', colors.join(','));
        if (sizes.length > 0) params.set('prSize', sizes.join(','));

        navigate(`/lots?${params.toString()}`, {
            state: { fromProductReport: true, returnTo },
        });
    };

    const columns = useMemo(() => {
        const cols = [
            {
                header: "Color",
                accessor: "color",
                cell: (row) => {
                    if (row.isTotalRow) {
                        return <span className="font-bold text-[#0B1C30]">Total</span>;
                    }
                    return (
                        <span className="font-medium text-[#0B1C30]">
                            {row.color || "-"}
                        </span>
                    );
                }
            },
            {
                header: "Size",
                accessor: "size",
                cell: (row) => {
                    if (row.isTotalRow) return "-";
                    return (
                        <span className="inline-flex min-w-[1.75rem] justify-center rounded-md bg-[#EFE7DC] px-2 py-0.5 text-xs font-semibold text-[#7D766C]">
                            {row.size || "-"}
                        </span>
                    );
                }
            },
        ];

        dynamicColumnOrder.forEach((fieldName) => {
            cols.push({
                header: getColumnLabel(fieldName),
                accessor: fieldName,
                cell: (row) => {
                    const value = row.isTotalRow
                        ? (row[fieldName] || '0(0)')
                        : formatCellValue(row[fieldName]);
                    const numeric = row.isTotalRow
                        ? null
                        : row[fieldName];
                    const isZero =
                        numeric &&
                        typeof numeric === 'object' &&
                        (numeric.lotCount || 0) === 0 &&
                        (numeric.totalPic || 0) === 0;
                    const canClick =
                        !row.isTotalRow &&
                        getDashboardStatus(fieldName) &&
                        numeric &&
                        !isZero;

                    if (String(fieldName).toLowerCase() === 'billscan') {
                        return (
                            <span
                                className={`font-semibold text-[#B45309] ${canClick ? "cursor-pointer hover:underline" : ""}`}
                                onClick={() => {
                                    if (canClick) handleProcessCellClick(fieldName, row);
                                }}
                            >
                                {value}
                            </span>
                        );
                    }

                    return (
                        <span
                            className={
                                canClick
                                    ? "text-[#0B1C30] cursor-pointer hover:text-[#7D766C] hover:underline font-semibold"
                                    : isZero
                                      ? "text-[#C4BBB0]"
                                      : "text-[#4C463D] font-medium"
                            }
                            onClick={() => {
                                if (canClick) handleProcessCellClick(fieldName, row);
                            }}
                        >
                            {value}
                        </span>
                    );
                }
            });
        });
        
        cols.push({
            header: "Total",
            accessor: "total",
            cell: (row) => {
                const value = row.isTotalRow ? (row.total || '0(0)') : formatCellValue(row.total);
                return <span className="font-semibold text-[#1E3A8A]">{value}</span>;
            }
        });
        
        cols.push({
            header: "Completed",
            accessor: "completed",
            cell: (row) => {
                const value = row.isTotalRow ? (row.completed || '0(0)') : formatCellValue(row.completed);
                return <span className="font-semibold text-[#15803D]">{value}</span>;
            }
        });
        
        return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dynamicColumnOrder, processColumnMeta, selectedDesignNumber]);

    const hasActiveFilters =
        selectedColors.length > 0 || selectedSizes.length > 0;

    return (
        <>
            {(loading || isLoadingOptions) && <LoaderComponent size={56} />}
            <div className="space-y-5">
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

                <div className="flex items-center justify-between gap-3 !mt-0 max-sm:flex-col max-sm:items-stretch">
                    <div className="text-left">
                        <h1 className="text-2xl font-bold text-[#0B1C30] font-roboto cursor-default shrink-0">
                            Product Report
                        </h1>
                        <p className="mt-1 text-sm text-[#7D766C]">
                            Design-wise process progress overview
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-1 justify-end max-sm:flex-col max-sm:items-stretch">
                        <div className="w-full max-w-xs">
                            <SelectElement
                                options={designOptions}
                                value={selectedDesignNumber}
                                onChange={handleDesignNumberChange}
                                placeholder={
                                    isLoadingOptions
                                        ? "Loading designs..."
                                        : "Select Design Number"
                                }
                                disabled={isLoadingOptions}
                                isClearable={true}
                                className="w-full"
                                menuPortalTarget={document.body}
                            />
                        </div>
                        <Button
                            variant="primary"
                            size="medium"
                            icon={
                                showFilters ? (
                                    <LucideFilter
                                        size={20}
                                        className="rotate-180 transition-transform duration-200 text-white"
                                    />
                                ) : (
                                    <LucideFilter size={20} className="text-white" />
                                )
                            }
                            label={showFilters ? "Close" : "Filter"}
                            onClick={() =>
                                setShowFilters((prev) => {
                                    const next = !prev;
                                    persistFilters(
                                        selectedDesignNumber,
                                        selectedColors,
                                        selectedSizes,
                                        next
                                    );
                                    return next;
                                })
                            }
                            className={`flex w-full sm:w-auto justify-center items-center space-x-2 !shadow-none font-normal !rounded-xl px-4 py-2 transition-colors duration-200 shrink-0 ${
                                showFilters
                                    ? "!bg-[#6A645C] !text-white hover:!bg-[#5C564E]"
                                    : "!bg-[#7D766C] !text-white hover:!bg-[#6A645C]"
                            }`}
                        />
                    </div>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-[#E8DFD4] space-y-3">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex-1 min-w-[180px]">
                                <SelectElement
                                    name="Color"
                                    options={colorOptions}
                                    value={selectedColors}
                                    onChange={handleColorFilterChange}
                                    placeholder={
                                        !selectedDesignNumber
                                            ? "Select design first"
                                            : colorOptions.length
                                              ? "Select Color"
                                              : "No colors available"
                                    }
                                    disabled={!selectedDesignNumber || loading}
                                    isMulti={true}
                                    isClearable={true}
                                    className="w-full"
                                    menuPortalTarget={document.body}
                                />
                            </div>
                            <div className="flex-1 min-w-[180px]">
                                <SelectElement
                                    name="Size"
                                    options={sizeOptions}
                                    value={selectedSizes}
                                    onChange={handleSizeFilterChange}
                                    placeholder={
                                        !selectedDesignNumber
                                            ? "Select design first"
                                            : sizeOptions.length
                                              ? "Select Size"
                                              : "No sizes available"
                                    }
                                    disabled={!selectedDesignNumber || loading}
                                    isMulti={true}
                                    isClearable={true}
                                    className="w-full"
                                    menuPortalTarget={document.body}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="medium"
                                label="Clear"
                                onClick={handleClearFilters}
                                className="!shadow-none font-normal !rounded-xl px-4 py-2 !border-[#CFC5B9] !text-[#7D766C] hover:!bg-[#EFE7DC]"
                            />
                        </div>
                    </div>
                )}

                {selectedDesignNumber && (
                    <CommonTable
                        columns={columns}
                        data={tableData}
                        count={filteredRecords.length}
                        page={currentPage}
                        rowsPerPage={currentLimit}
                        onPageChange={handlePageChangeForTable}
                        onRowsPerPageChange={handleRowsPerPageChangeForTable}
                        rowsPerPageOptions={[25, 50, 75, 100, 150]}
                        emptyDataMessage={
                            hasActiveFilters
                                ? "No items found matching your filters."
                                : "No items available."
                        }
                        loading={loading}
                    />
                )}
            </div>
        </>
    );
};

export default ProductReport;
