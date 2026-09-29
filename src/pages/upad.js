import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LucideSearch, LucideChevronDown, LucideChevronUp, LucideLoader, LucideFilter, LucidePlus, LucideEdit, ExternalLink, LucideDownload, LucideUpload } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatDate, lowercase, mapEmployeeToSelectOption } from '../helpers/utils';
import InputElement from '../component/common/InputElement';
import CommonTable from '../component/common/Table/Table';
import Button from '../component/common/Button';
import ActionCell from '../component/common/Table/ActionCell';
import LoaderComponent from '../component/common/Loader';
import AddUpadModal from '../component/Upad/AddUpadModal';
import EditUpadModal from '../component/Upad/EditUpadModal';
import { getUpadData, importUpadData, updateUpad, getSalarySummaryMaster, addUpad } from '../apis/upadApi';
import { downloadUpadReport } from '../helpers/excelExport';
import usePageTitle from '../hooks/usePageTitle';

const Upad = ({ onSidebarAddUpadClick }) => {
  usePageTitle('Upad Report');

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [upadData, setUpadData] = useState({ items: [], pagination: { total: 0, page: 1, pages: 1, limit: 10 } });
  const [isUpdateItemModalOpen, setIsUpdateItemModalOpen] = useState(false);
  const [editingItemData, setEditingItemData] = useState(null);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importedData, setImportedData] = useState(null);
  
  // Add UPAD Modal states
  const [isUpadModalOpen, setIsUpadModalOpen] = useState(false);
  const [isUpadLoading, setIsUpadLoading] = useState(false);
  const [upadFormData, setUpadFormData] = useState({
    employeeId: '',
    upadAmount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [upadError, setUpadError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: currentLimit,
        search: debouncedSearchQuery || undefined,
        sortKey: sortConfig.key || undefined,
        sortDirection: sortConfig.direction || undefined
      };

      const response = await getUpadData(params);
      
      setUpadData({
        items: response.data || [],
        pagination: response.pagination || { total: 0, page: currentPage, pages: 1, limit: currentLimit }
      });
    } catch (error) {
      setUpadData({ items: [], pagination: { total: 0, page: 1, pages: 1, limit: currentLimit } });
      console.error('Error fetching UPAD data:', error);
    } finally {
      setLoading(false);
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
  }, [currentPage, currentLimit, debouncedSearchQuery, sortConfig]);

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

  const handleEditItem = (item) => {
    setEditingItemData(item);
    setIsUpdateItemModalOpen(true);
    // Fetch employees if not already loaded
    if (employees.length === 0) {
      fetchEmployees();
    }
  };

  const handleOpenAddItemModal = () => {
    setIsUpadModalOpen(true);
    fetchEmployees();
    setUpadFormData({
      employeeId: '',
      upadAmount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setUpadError(null);
  };

  // Handle sidebar add UPAD click
  useEffect(() => {
    if (onSidebarAddUpadClick) {
      handleOpenAddItemModal();
    }
  }, [onSidebarAddUpadClick]);

  const handleCloseAddItemModal = () => {
    setIsUpadModalOpen(false);
    setUpadFormData({
      employeeId: '',
      upadAmount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setUpadError(null);
  };

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const response = await getSalarySummaryMaster({
        page: 1,
        limit: 500,
        sortDirection: 'asc',
      });
      const isActiveEmployee = (emp) => {
        const status = (emp?.status || emp?.employeeStatus || emp?.employee?.status || '').toString().toLowerCase();
        return status === 'active';
      };
      const employeeOptions = (response.data || [])
        .filter((emp) => emp?.employeeId && isActiveEmployee(emp))
        .map((emp) =>
          mapEmployeeToSelectOption(emp, {
            valueKey: 'employeeId',
            extra: {
              totalSalary: emp.totalSalary ?? 0,
              currentTotalSalary: emp.currentTotalSalary ?? 0,
              totalUpad: emp.totalUpad ?? 0,
              totalPaid: emp.totalPaid ?? 0,
              netSalary: emp.netSalary ?? 0,
            },
          })
        );
      setEmployees(employeeOptions);
    } catch (error) {
      toast.error('Failed to load employees from salary master', { toastId: 'employees-fetch-error' });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleUpadSubmit = async (formData) => {
    if (!formData.employeeId || formData.upadAmount == null || formData.upadAmount === '') {
      setUpadError('Please fill in all required fields');
      return;
    }

    try {
      setIsUpadLoading(true);
      setUpadError(null);

      await addUpad({
        employeeId: formData.employeeId,
        upadAmount: Number(formData.upadAmount),
        totalSalary: Number(formData.totalSalary ?? 0),
      });

      handleCloseAddItemModal();
      fetchData();
    } catch (error) {
      setUpadError(error.message || 'Failed to add UPAD');
    } finally {
      setIsUpadLoading(false);
    }
  };

  const handleCloseUpdateItemModal = () => {
    setEditingItemData(null);
    setIsUpdateItemModalOpen(false);
  };

  const handleUpdateItemSubmit = async (itemId, updatedData) => {
    setIsUpdatingItem(true);
    try {
      await updateUpad(itemId, updatedData);
      fetchData();
      handleCloseUpdateItemModal();
      toast.success(`UPAD record updated successfully!`, { toastId: 'upad-update-success' });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update UPAD record';
      toast.error(errorMessage, { toastId: 'upad-update-error' });
      console.error('Error updating UPAD record:', error);
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };


 const handleExcelDownload = async () => {
  try {
    const params = {
      page: 1,
      limit: 100000, // get all records
      search: debouncedSearchQuery || undefined,
      sortKey: sortConfig.key || undefined,
      sortDirection: sortConfig.direction || undefined,
      IsExcel: true,
    };

    const response = await getUpadData(params); // 👈 your API call
    const excelData = response?.data || [];

    if (excelData.length === 0) {
      toast.info("No UPAD records available for download.", { toastId: "upad-excel-empty" });
      return;
    }

    await downloadUpadReport(excelData, `Upad_Report_${new Date().toISOString().split("T")[0]}`);
    toast.success("Excel downloaded successfully!", { toastId: "upad-excel-download" });
  } catch (error) {
    console.error("Excel download error:", error);
    toast.error(error.message || "Failed to download Excel", { toastId: "upad-excel-error" });
  }
};

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileExt = file.name.split('.').pop().toLowerCase();
      if (fileExt !== 'xls' && fileExt !== 'xlsx') {
        toast.error('Please upload only Excel files (.xls or .xlsx)', { toastId: 'upad-import-status' });
        return;
      }
      try {
        setImportLoading(true);
        const startTime = performance.now();
        const response = await importUpadData(file);
        const endTime = performance.now();
        const importTime = ((endTime - startTime) / 1000).toFixed(2);
        setImportedData(response.data);
        fetchData();

      } catch (error) {
      } finally {
        setImportLoading(false);
      }
    }
  };

  const columns = useMemo(() => [
    {
      header: "Upad Dates",
      accessor: 'createdAt',
      cell: (row) => row.createdAt ? formatDate(row.createdAt, 'DD/MM/YYYY') : "-",
      isDate: true
    },
    {
      header: "Emp Code",
      accessor: 'employeeCode',
      cell: (row) => row?.employeeId?.employeeName || '-',
    },
    {
      header: "Emp Name",
      accessor: 'employeeName',
      cell: (row) => row?.employeeId?.firstName + ' ' + row?.employeeId?.lastName  || "-"
    },
    {
      header: "Total UPAD",
      accessor: 'totalUpad',
      cell: (row) => `₹${row.upadAmount?.toLocaleString() || 0}`
    },
    {
      header: "Actions",
      id: "actions",
      cell: (row) => {
        const itemOptions = [
          {
            label: "Edit",
            icon: <LucideEdit size={16} />, 
            action: () => handleEditItem(row),
            className: "text-gray-700 hover:text-blue-600",
          },
        ];
        return <ActionCell row={row} options={itemOptions} />;
      },
    },
  ], []);

  return (
    <>
             {(loading || isUpadLoading || isUpdatingItem) && <LoaderComponent size={56}/>}

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
          Upad Report
        </h1>

        <div className="flex gap-2 max-sm:w-full max-sm:flex-col max-[320px]:gap-2.5">
          <Button
            variant="outline"
            size="medium"
            icon={<LucidePlus size={20} />}
            label="Add New UPAD"
            onClick={handleOpenAddItemModal}
            className="flex items-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 focus:!ring-0 max-sm:w-full max-sm:justify-center"
          />
           <div className="relative w-full xl:w-auto">
                      <input
                        type="file"
                        accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleImport}
                        className="hidden"
                        id="import-file"
                        disabled={importLoading}
                      />
                      <label
                        htmlFor="import-file"
                        className={`flex w-full py-2.5 px-5 sm:w-auto justify-center cursor-pointer items-center space-x-2 rounded-md bg-light-primary text-light-white hover:bg-light-primary_hover transition-colors duration-200 ${importLoading ? "opacity-70 cursor-not-allowed" : ""
                          }`}
                      >
                        {importLoading ? (
                          <LucideLoader size={20} className="animate-spin" />
                        ) : (
                          <LucideUpload size={20} />
                        )}
                        <span className="font-roboto text-base">
                          {importLoading ? "Importing..." : "Import"}
                        </span>
                      </label>
                    </div>
          <Button
              variant="primary"
              size="medium"
              icon={<LucideDownload size={20} />}
              label="Excel Download"
              onClick={handleExcelDownload }
              className="flex items-center space-x-2 shadow-none font-normal !rounded-md px-4 py-2 text-light-white transition-colors duration-200 focus:ring-0 max-sm:w-full max-sm:justify-center"
            />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 w-[40rem] max-lg:w-full">
        <div className="flex-grow w-full">
          <InputElement
            type="text"
            placeholder="Search by employee name..."
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
          data={upadData?.items || []}
          count={upadData?.pagination?.totalRecords || 0}
          page={(upadData?.pagination?.currentPage || 1) - 1}
          rowsPerPage={upadData?.pagination?.limit || currentLimit}
          onPageChange={handlePageChangeForTable}
          onRowsPerPageChange={handleRowsPerPageChangeForTable}
          rowsPerPageOptions={[25, 50, 75, 100, 150]}
          emptyDataMessage={
            searchQuery
              ? "No UPAD records found matching your search."
              : "No UPAD records available."
          }
          tableClassName="min-w-full divide-y divide-gray-200"
        />
      </div>

             <AddUpadModal
         isOpen={isUpadModalOpen}
         onClose={handleCloseAddItemModal}
         onSubmit={handleUpadSubmit}
         isLoading={isUpadLoading}
         employees={employees}
         isLoadingEmployees={isLoadingEmployees}
         error={upadError}
       />

      <EditUpadModal
        isOpen={isUpdateItemModalOpen}
        onClose={handleCloseUpdateItemModal}
        onSubmit={handleUpdateItemSubmit}
        isLoading={isUpdatingItem}
        employees={employees}
        isLoadingEmployees={isLoadingEmployees}
        error={upadError}
        upadData={editingItemData}
      />
    </div>
    </>
  );
};

export default Upad; 