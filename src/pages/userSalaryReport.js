import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    LucideSearch,
    LucideLoader,
    LucideFilter
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputElement from "../component/common/InputElement";
import CommonTable from "../component/common/Table/Table";
import Status from "../component/common/Status";
import { getUserSalaryReport } from "../apis/salaryReportApiAdmin";
import LoaderComponent from "../component/common/Loader";
import Button from "../component/common/Button/index.js";
import SalaryReportFilter from "../component/common/SalaryReportFilter.js";
import usePageTitle from "../hooks/usePageTitle.js";
import SecureScreen from "../component/common/SecureScreen";

const UserSalaryReport = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [currentLimit, setCurrentLimit] = useState(25);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [salaryData, setSalaryData] = useState({
        records: [],
        pagination: {
            total: 0,
            page: 0,
            pages: 1,
            limit: 10
        }
    });

    // Filter states
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({
        employeeName: '',
        lotNo: '',
        dNo: '',
        pic: '',
        startDate: '',
        endDate: ''
    });
    const [tempFilters, setTempFilters] = useState({
        employeeName: '',
        lotNo: '',
        dNo: '',
        pic: '',
        startDate: '',
        endDate: ''
    });

    usePageTitle('User Salary Report');

    // Filter options
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [lotNoOptions, setLotNoOptions] = useState([]);
    const [dNoOptions, setDNoOptions] = useState([]);
    const [picOptions, setPicOptions] = useState([]);
    const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

    const filterRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user'));

    const getAllFilterOptions = async () => {
        try {
            setFilterOptionsLoading(true);
            const response = await getUserSalaryReport({
                userId: user?._id,
                isExcel: false,
                limit: 1000 // Get more data to extract options
            });
            
            if (response && response.data && response.data.length > 0) {
                const employees = new Set();
                const lotNos = new Set();
                const dNos = new Set();
                const pics = new Set();
                
                response.data.forEach(item => {
                    // Employee names
                    const firstName = item?.user?.firstName || '';
                    const lastName = item?.user?.lastName || '';
                    const fullName = `${firstName} ${lastName}`.trim();
                    if (fullName) employees.add(fullName);

                    // Lot numbers
                    if (item.lotNo) lotNos.add(item.lotNo);

                    // D numbers
                    if (item.dNo) dNos.add(item.dNo);

                    // Pics
                    if (item.pic) pics.add(item.pic.toString());
                });

                setEmployeeOptions(Array.from(employees).map(name => ({ value: name, label: name })));
                setLotNoOptions(Array.from(lotNos).map(lotNo => ({ value: lotNo, label: lotNo })));
                setDNoOptions(Array.from(dNos).map(dNo => ({ value: dNo, label: dNo })));
                setPicOptions(Array.from(pics).map(pic => ({ value: pic, label: pic })));
            } else {
                // If no data, set empty options but don't show error
                setEmployeeOptions([]);
                setLotNoOptions([]);
                setDNoOptions([]);
                setPicOptions([]);
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
            setEmployeeOptions([]);
            setLotNoOptions([]);
            setDNoOptions([]);
            setPicOptions([]);
        } finally {
            setFilterOptionsLoading(false);
        }
    };

    const fetchSalaryData = async () => {
        try {
            setLoading(true);
            const response = await getUserSalaryReport({
                search: searchQuery,
                userId: user?._id,
                limit: currentLimit,
                page: currentPage + 1,
                employeeName: appliedFilters.employeeName,
                lotNo: appliedFilters.lotNo,
                dNo: appliedFilters.dNo,
                pic: appliedFilters.pic,
                startDate: appliedFilters.startDate,
                endDate: appliedFilters.endDate
            });
            setSalaryData({
                records: response.data,
                pagination: response?.pagination,
            });

            // Don't extract filter options from filtered data
            // Filter options should remain static with all available values
        } catch (error) {
            setSalaryData({ records: [] });
            toast.error(
                "Failed to fetch salary report. Please try again.",
                { toastId: "salary-fetch-error" }
            );
            console.error("Error fetching salary report:", error);
        } finally {
            setLoading(false);
        }
    };

    // Function to refresh filter options
    const refreshFilterOptions = async () => {
        // Only refresh if we don't already have options
        if (employeeOptions.length === 0 && lotNoOptions.length === 0 && dNoOptions.length === 0 && picOptions.length === 0) {
            await getAllFilterOptions();
        }
    };

    useEffect(() => {
        getAllFilterOptions(); // Fetch all options on mount
    }, []);

    useEffect(() => {
        fetchSalaryData();
    }, [currentPage, currentLimit, searchQuery, appliedFilters]);

    const handlePageChangeForTable = (newPageZeroBased) => {
        setCurrentPage(newPageZeroBased);
    };

    const handleRowsPerPageChangeForTable = (newRowsPerPage) => {
        setCurrentLimit(newRowsPerPage);
        setCurrentPage(0);
    };

    // Filter functions
    const handleFilterClick = () => {
        if (!isFilterOpen) {
            setTempFilters(appliedFilters);
            // Only refresh options if we don't have them
            refreshFilterOptions();
        }
        setIsFilterOpen(!isFilterOpen);
    };

    const handleApplyFilter = (filters) => {
        setAppliedFilters(filters);
        setCurrentPage(0);
        setIsFilterOpen(false);
        
        // Don't refresh options when applying filters - keep them as they are
        // This ensures the dropdown options remain available for future use
    };

    const handleClearFilter = () => {
        const clearedFilters = {
            employeeName: '',
            lotNo: '',
            dNo: '',
            pic: '',
            startDate: '',
            endDate: ''
        };
        setAppliedFilters(clearedFilters);
        setTempFilters(clearedFilters);
        setCurrentPage(0);
        setIsFilterOpen(false);
        
        // After clearing filters, ensure we have fresh options
        refreshFilterOptions();
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
        if (appliedFilters.startDate) count++;
        if (appliedFilters.endDate) count++;
        return count;
    };

    const columns = useMemo(
        () => [
            {
                header: "D. No.",
                accessor: "D.No.",
                cell: (row) => row.dNo || "-"
            },
            {
                header: "Lot No.",
                accessor: "LotNo",
                cell: (row) => row.lotNo || "-"
            },
            {
                header: "Employee Role",
                accessor: "processName",
                cell: (row) => row?.processId?.processName || "-"
            },
            {
                header: "Emp Code",
                accessor: "employeeCode",
                cell: (row) => row?.user?.employeeName || "-"
            },
            {
                header: "Price",
                accessor: "price",
                cell: (row) => row.singlePrice || "-"
            },
            {
                header: "Net Payable",
                accessor: "totalPrice",
                cell: (row) => row.totalPicPrice || "-"
            },
            {
                header: "Pic",
                accessor: "pic",
                cell: (row) => row.pic || "-"
            },
        ],
        []
    );

    return (
        <>
            {(loading || searchLoading) && <LoaderComponent size={56} />}
            <SecureScreen message="Salary Report — protected">
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

                <div className="flex items-center justify-between !mt-0 max-sm:flex-col max-sm:gap-2">
                    <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default max-sm:text-left max-sm:w-full">
                        Salary Report
                    </h1>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="w-[40rem]">
                        <div>
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
                    </div>

                    <div className="relative" ref={filterRef}>
                        <Button
                            variant="outline"
                            size="medium"
                            icon={<LucideFilter size={20} />}
                            label={isAnyFilterApplied() ? `Filter (${getActiveFilterCount()})` : "Filter"}
                            onClick={handleFilterClick}
                            className={`flex items-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 focus:!ring-0 ${isAnyFilterApplied() ? 'bg-light-primary_hover' : ''}`}
                        />

                        <SalaryReportFilter
                            isOpen={isFilterOpen}
                            onClose={() => setIsFilterOpen(false)}
                            onApplyFilter={handleApplyFilter}
                            onClearFilter={handleClearFilter}
                            appliedFilters={appliedFilters}
                            tempFilters={tempFilters}
                            onTempFilterChange={handleTempFilterChange}
                            employeeOptions={employeeOptions}
                            lotNoOptions={lotNoOptions}
                            dNoOptions={dNoOptions}
                            picOptions={picOptions}
                            filterOptionsLoading={filterOptionsLoading}
                        />
                    </div>
                </div>

                <CommonTable
                    columns={columns}
                    data={salaryData.records}
                    count={salaryData.pagination?.total || salaryData.records.length}
                    page={currentPage}
                    rowsPerPage={currentLimit}
                    onPageChange={handlePageChangeForTable}
                    onRowsPerPageChange={handleRowsPerPageChangeForTable}
                    rowsPerPageOptions={[25, 50, 75, 100, 150]}
                    emptyDataMessage={searchQuery ? "No items found matching your search." : "No items available."}
                    tableClassName="min-w-full divide-y divide-gray-200"
                    loading={loading}
                />
            </div>
            </SecureScreen>
        </>
    );
};

export default UserSalaryReport; 