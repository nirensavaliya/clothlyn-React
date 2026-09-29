import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LucideSearch, LucideLoader, LucideDownload, LucideFilter } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getSalarySummary, downloadSalarySummaryExcel } from '../apis/upadApi';
import { formatDate, lowercase, getEmployeeSelectLabel } from '../helpers/utils';
import InputElement from '../component/common/InputElement';
import CommonTable from '../component/common/Table/Table';
import Button from '../component/common/Button';
import LoaderComponent from '../component/common/Loader';
import AccountDetailsFilter from '../component/common/AccountDetailsFilter';
import usePageTitle from '../hooks/usePageTitle';
import SecureScreen from '../component/common/SecureScreen';

const AccountDetails = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [accountData, setAccountData] = useState({ items: [], pagination: { total: 0, page: 1, pages: 1, limit: 10 } });
  
  usePageTitle('Salary Master');
  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    employeeCode: null,
    nickName: null,
    processRole: null,
    startDate: null,
    endDate: null
  });
  const [tempFilters, setTempFilters] = useState({
    employeeCode: null,
    nickName: null,
    processRole: null,
    startDate: null,
    endDate: null
  });

  // Filter options (these would typically come from API)
  const [filterOptions, setFilterOptions] = useState({
    employeeCodeOptions: [],
    nickNameOptions: [],
    processRoleOptions: []
  });
  const [filterOptionsLoaded, setFilterOptionsLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: currentLimit,
        search: debouncedSearchQuery,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
        employeeCode: appliedFilters.employeeCode,
        nickName: appliedFilters.nickName,
        processName: appliedFilters.processRole,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate
      };
      const response = await getSalarySummary(params);
      setAccountData({ items: response.data || [], pagination: response?.pagination || { total: 0, page: 1, pages: 1, limit: currentLimit } });
    } catch (error) {
      setAccountData({ items: [], pagination: { total: 0, page: 1, pages: 1, limit: currentLimit } });
      toast.error('Failed to fetch account details. Please try again.', { toastId: 'account-fetch-error' });
      console.error('Error fetching account details:', error);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    currentLimit,
    debouncedSearchQuery,
    sortConfig.key,
    sortConfig.direction,
    appliedFilters.employeeCode,
    appliedFilters.nickName,
    appliedFilters.processRole,
    appliedFilters.startDate,
    appliedFilters.endDate
  ]);

  // Fetch filter options
 const fetchFilterOptions = async () => {
  try {
    const response = await getSalarySummary({});
    const items = response.data || [];

    const employeeCodeOptions = items.map((item) => ({
      value: item.employeeName,
      label: getEmployeeSelectLabel(item),
    }));

    const nickNames = [...new Set(items.map(item => item?.nickname).filter(Boolean))];

    setFilterOptions({
      employeeCodeOptions,
      nickNameOptions: nickNames.map(name => ({ value: name, label: name })),
      processRoleOptions: [] // अगर बाद में चाहिए तो भरेंगे
    });

  } catch (error) {
    console.error("Error fetching filter options:", error);
  }
};


   

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 700);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handlePageChangeForTable = (newPageZeroBased) => {
    setCurrentPage(newPageZeroBased + 1);
  };

  const handleRowsPerPageChangeForTable = (newRowsPerPage) => {
    setCurrentLimit(newRowsPerPage);
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloadingExcel(true);
      
      // Prepare filters object with current search and applied filters
      const currentFilters = {
        search: debouncedSearchQuery,
        employeeCode: appliedFilters.employeeCode,
        nickName: appliedFilters.nickName,
        processName: appliedFilters.processRole,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction
      };
      
      await downloadSalarySummaryExcel(currentFilters);
    } catch (error) {
      console.error('Error downloading Excel:', error);
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Filter handlers
  const handleFilterToggle = async () => {
    const opening = !isFilterOpen;
    setIsFilterOpen(opening);
    if (opening && !filterOptionsLoaded) {
      await fetchFilterOptions();
      setFilterOptionsLoaded(true);
    }
  };

  const handleFilterClose = () => {
    setIsFilterOpen(false);
  };

  const handleTempFilterChange = (field, value) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilter = (filters) => {
    setAppliedFilters(filters);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };
                                                   
  const handleClearFilter = () => {
    const clearedFilters = {
      employeeCode: null,
      nickName: null,
      processRole: null,
      startDate: null,
      endDate: null
    };
    setAppliedFilters(clearedFilters);
    setTempFilters(clearedFilters);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (appliedFilters.employeeCode) count++;
    if (appliedFilters.nickName) count++;
    if (appliedFilters.processRole) count++;
    if (appliedFilters.startDate || appliedFilters.endDate) count++;
    return count;
  };

const columns = useMemo(() => [
  {
    header: "Nick Name",
    accessor: "accountHolderName",
    cell: (row) => row?.employee?.nickname || "-"
  },
  {
    header: "Emp Code",
    accessor: "employeeCode",
    cell: (row) => row.employeeCode || row.employeeName || "-"
  },
  {
    header: "Account Number",
    accessor: "accountNumber",
    cell: (row) => row?.employee?.accountNumber || "-"
  },
  {
    header: "IFSC Code",
    accessor: "ifscCode",
    cell: (row) => row?.employee?.ifscCode || "-"
  },
  {
    header: "Bank Name",
    accessor: "bankName",
    cell: (row) => row?.employee?.bankName || "-"
  },
  {
    header: "Branch Name",
    accessor: "branchName",
    cell: (row) => row?.employee?.bankBranchName || "-"
  },

  // 🔹 Direct from API
  {
    header: "Total Salary",
    accessor: "totalSalary",
    cell: (row) => `₹${Number(row.totalSalary).toFixed(2)}`
  },

  // 🔹 Direct from API
  {
    header: "Total Upad",
    accessor: "totalUpad",
    cell: (row) => `₹${Number(row.totalUpad).toFixed(2)}`
  },

  // 🔹 Direct from API → Paid Salary
  {
    header: "Paid Salary",
    accessor: "finalSalary",
    cell: (row) => `₹${Number(row.totalPaid).toFixed(2)}`
  },

  // 🔹 Direct from API → Net Salary
  {
    header: "Net Salary",
    accessor: "availableAmount",
    cell: (row) => `₹${Number(row.finalSalary).toFixed(2)}`
  }

], []);




  return (
    <>
      {(loading || downloadingExcel) && <LoaderComponent size={56}/>}

      <SecureScreen message="Salary Master — protected">
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
            Salary Master
          </h1>

          <div className="flex gap-2 max-sm:w-full max-sm:flex-col">
            <Button
              variant="primary"
              size="medium"
              icon={<LucideDownload size={20} />}
              label={downloadingExcel ? "Downloading..." : "Download Excel"}
              onClick={handleDownloadExcel}
              disabled={downloadingExcel}
              className="flex items-center space-x-2 shadow-none font-normal !rounded-md px-4 py-2 text-light-white transition-colors duration-200 focus:ring-0 max-sm:w-full max-sm:justify-center"
            />
            <div className='relative'>

            <Button
              variant="outline"
              size="medium"
              icon={<LucideFilter size={20} />}
              label={`Filter${getActiveFilterCount() > 0 ? ` (${getActiveFilterCount()})` : ''}`}
              onClick={handleFilterToggle}
              className={`flex items-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 focus:ring-0 max-sm:w-full max-sm:justify-center ${getActiveFilterCount() > 0 ? 'bg-light-primary_hover' : ''}`}
            />
            <AccountDetailsFilter
          isOpen={isFilterOpen}
          onClose={handleFilterClose}
          onApplyFilter={handleApplyFilter}
          onClearFilter={handleClearFilter}
          appliedFilters={appliedFilters}
          tempFilters={tempFilters}
          onTempFilterChange={handleTempFilterChange}
          employeeCodeOptions={filterOptions.employeeCodeOptions}
          nickNameOptions={filterOptions.nickNameOptions}
          processRoleOptions={filterOptions.processRoleOptions}
        />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 w-[40rem] max-lg:w-full">
          <div className="flex-grow w-full">
            <InputElement
              type="text"
              placeholder="Search by employee name or code..."
              value={searchQuery}
              onChange={(value) => {
                handleSearch(value);
              }}
              variant="size_44"
              className="w-full"
              is_required={false}
              extra_text_before={
                loading && debouncedSearchQuery !== searchQuery ? (
                  <LucideLoader size={20} className="text-light-primary animate-spin" />
                ) : (
                  <LucideSearch size={20} className="text-light-lightGrey" />
                )
              }
            />
          </div>
        </div>        

        <div className="w-full">
          <CommonTable
            columns={columns}
            data={accountData?.items || []}
            count={accountData?.pagination?.totalItems || 0}
            page={(accountData?.pagination?.totalPages || 1) - 1}
            rowsPerPage={accountData?.pagination?.pageSize || currentLimit}
            onPageChange={handlePageChangeForTable}
            onRowsPerPageChange={handleRowsPerPageChangeForTable}
            rowsPerPageOptions={[25, 50, 75, 100, 150]}
            emptyDataMessage={
              searchQuery || getActiveFilterCount() > 0
                ? "No account details found matching your search or filters."
                : "No account details available."
            }
            tableClassName="min-w-full divide-y divide-gray-200"
          />
        </div>
      </div>
      </SecureScreen>
    </>
  );
};

export default AccountDetails; 