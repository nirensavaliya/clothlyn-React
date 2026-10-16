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
    const emptyFilters = { startDate: '', endDate: '' };
    const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
    const [tempFilters, setTempFilters] = useState(emptyFilters);

    usePageTitle('User Salary Report');

    const filterRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user'));

    const fetchSalaryData = async () => {
        try {
            setLoading(true);
            const response = await getUserSalaryReport({
                search: searchQuery,
                userId: user?._id,
                limit: currentLimit,
                page: currentPage + 1,
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
        setAppliedFilters(emptyFilters);
        setTempFilters(emptyFilters);
        setCurrentPage(0);
        setIsFilterOpen(false);
    };

    const handleTempFilterChange = (field, value) => {
        setTempFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const isAnyFilterApplied = () => {
        return appliedFilters.startDate || appliedFilters.endDate;
    };

    const getActiveFilterCount = () => {
        let count = 0;
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