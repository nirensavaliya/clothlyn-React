import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LucideSearch, LucideChevronDown, LucideChevronUp, LucideFilter, LucidePlus, LucideEdit, AlertTriangle, ExternalLink, LucideDownload, Edit, Trash2, LucideLoader, Eye, LucideUpload } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatDate, lowercase, mapEmployeeToSelectOption } from '../helpers/utils';
import InputElement from '../component/common/InputElement';
import CommonTable from '../component/common/Table/Table';
import Button from '../component/common/Button';
import Modal from '../component/common/Modal';
import Status from '../component/common/Status';
import SelectElement from '../component/common/Select';
import ActionCell from '../component/common/Table/ActionCell';
import LoaderComponent from '../component/common/Loader';
import { getSalaryPaid, addSalaryPaid, updateSalaryPaid, deleteSalaryPaid, importSalaryPaidData, downloadSalaryPaidImportDemo, getSalaryPaidExcel } from '../apis/salaryPaidApi';
import { getSalarySummaryMaster } from '../apis/upadApi';
import usePageTitle from '../hooks/usePageTitle';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';

const PAYMENT_TYPE_OPTIONS = [
  { value: 'salary', label: 'Salary' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'upad', label: 'Upad' },
];

const paymentTypeLabel = (row) => {
  const raw = String(row?.paymentType || '').trim().toLowerCase();
  if (raw === 'bonus') return 'Bonus';
  if (raw === 'upad' || row?.isUpad) return 'Upad';
  return 'Salary';
};

const resolvePaymentTypeFromRow = (row) => {
  const raw = String(row?.paymentType || '').trim().toLowerCase();
  if (raw === 'salary' || raw === 'upad' || raw === 'bonus') return raw;
  return row?.isUpad ? 'upad' : 'salary';
};

const SalaryPaid = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [allSalaryPaid, setAllSalaryPaid] = useState({ items: [], pagination: { total: 0, page: 1, pages: 1, limit: 10 } });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const downloadFilterRef = useRef(null);
  const [isAddSalaryPaidModalOpen, setIsAddSalaryPaidModalOpen] = useState(false);
  const [isAddingSalaryPaid, setIsAddingSalaryPaid] = useState(false);
  const [isUpdateSalaryPaidModalOpen, setIsUpdateSalaryPaidModalOpen] = useState(false);
  const [editingSalaryPaidData, setEditingSalaryPaidData] = useState(null);
  const [isUpdatingSalaryPaid, setIsUpdatingSalaryPaid] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [salaryPaidToDelete, setSalaryPaidToDelete] = useState(null);
  const [isDeletingSalaryPaid, setIsDeletingSalaryPaid] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSalaryPaidData, setSelectedSalaryPaidData] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [demoDownloadLoading, setDemoDownloadLoading] = useState(false);
  const [importedData, setImportedData] = useState(null);
  const [isDownloadFilterOpen, setIsDownloadFilterOpen] = useState(false);
  const [downloadFilters, setDownloadFilters] = useState({
    startDate: '',
    endDate: '',
    employeeIds: [],
    paymentTypes: [],
  });
  usePageTitle('Salary Paid');
  

  // Form state for add/edit
  const [formData, setFormData] = useState({
    employeeId: '',
    paid: '',
    isUpad: false,
    paymentType: 'salary',
    description: '',
  });

  // Employee options for dropdown
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const formatRupeeSummary = (n) =>
    `₹${Math.round(Number(n ?? 0)).toLocaleString('en-IN')}`;

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: currentLimit,
        search: debouncedSearchQuery,
        ...(sortConfig.key && { sortKey: sortConfig.key, sortDirection: sortConfig.direction })
      };
      
      const response = await getSalaryPaid(params);
      setAllSalaryPaid({ items: response?.data?.paidSalaries, pagination: response?.data?.pagination ||{ total: 0, page: 1, pages: 1, limit: currentLimit } });
    } catch (error) {
      console.error('Error fetching data:', error);
      setAllSalaryPaid({ items: [], pagination: { total: 0, page: 1, pages: 1, limit: currentLimit } });
    } finally {
      setLoading(false);
    }
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
        .map((emp) => {
          const lastPeriodSalary = Number(
            emp.lastPeriodSalary ?? emp.totalSalary ?? 0
          );
          const currentPeriodSalary = Number(
            emp.currentPeriodSalary ?? emp.currentTotalSalary ?? 0
          );
          const upadPaid = Number(emp.upadPaid ?? emp.pastPeriodPaid ?? 0);
          const bonusPaid = Number(emp.bonusPaid ?? 0);
          const salaryPaid = Number(emp.salaryPaid ?? 0);
          const paySalary = Math.round(
            Number(
              emp.paySalary != null
                ? emp.paySalary
                : Math.max(0, lastPeriodSalary + bonusPaid - salaryPaid - upadPaid)
            )
          );
          const totalRemaining = Number(
            emp.totalRemainingAmount ??
              emp.unpaidLastPeriodAmount ??
              emp.pastUnpaid ??
              0
          );
          return mapEmployeeToSelectOption(emp, {
            valueKey: 'employeeId',
            extra: {
              // Align with Salary Master New columns
              totalRemainingAmount: totalRemaining,
              currentPeriodSalary,
              currentTotalSalary: currentPeriodSalary,
              lastPeriodSalary,
              totalSalary: lastPeriodSalary,
              upadPaid,
              totalUpad: upadPaid,
              bonusPaid,
              paySalary,
              totalPaid: emp.totalPaid ?? 0,
              netSalary: totalRemaining,
              totalSalaryPlusCurrentMinusPaid:
                emp.totalSalaryPlusCurrentMinusPaid ??
                lastPeriodSalary + currentPeriodSalary - Number(emp.totalPaid ?? 0),
            },
          });
        });
      setEmployees(employeeOptions);
    } catch (error) {
      toast.error('Failed to load employees from salary master', { toastId: 'salary-paid-employees-error' });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isDownloadFilterOpen) return undefined;
    const handleClickOutside = (event) => {
      if (exportLoading) return;
      const t = event.target;
      if (
        t?.closest?.('.react-datepicker') ||
        t?.closest?.('.react-datepicker-popper') ||
        t?.closest?.('.datepicker-popper-high-z') ||
        t?.closest?.('.react-select__menu') ||
        t?.closest?.('.react-select__menu-portal')
      ) {
        return;
      }
      if (
        downloadFilterRef.current &&
        !downloadFilterRef.current.contains(t)
      ) {
        setIsDownloadFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDownloadFilterOpen, exportLoading]);

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

  useEffect(() => {
    fetchEmployees();
  }, []);

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

  const SortableTableHeader = ({ label, sortKey }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
      <div className="flex items-center space-x-2 cursor-pointer w-max" onClick={() => handleSort(sortKey)}>
        <span>{label}</span>
        <div className="flex flex-col">
          <LucideChevronUp
            size={14}
            className={`${isSorted && sortConfig.direction === 'asc' ? 'text-light-primary' : 'text-light-lightGrey'}`}
          />
          <LucideChevronDown
            size={14}
            className={`${isSorted && sortConfig.direction === 'desc' ? 'text-light-primary' : 'text-light-lightGrey'}`}
          />
        </div>
      </div>
    );
  };

  const columns = useMemo(() => [
    {
      header: <SortableTableHeader label="Emp Code" sortKey="employeeCode" />,
      accessor: 'employeeCode',
      cell: (row) => row?.employeeId?.employeeName || '-',
    },
    {
      header: <SortableTableHeader label="Emp Name" sortKey="employeeName" />,
      accessor: 'employeeName',
      cell: (row) => {
        if (row?.employeeId?.firstName && row?.employeeId?.lastName) {
          return `${row.employeeId.firstName} ${row.employeeId.lastName}`;
        } else if (row?.employeeId?.firstName) {
          return row.employeeId.firstName;
        } else if (row?.employeeId?.lastName) {
          return row.employeeId.lastName;
        }
        return '-';
      }
    },
    {
      header: <SortableTableHeader label="Paid Amount" sortKey="paid" />,
      accessor: 'paid',
      cell: (row) => row.paid?.toLocaleString() || "0"
    },
    {
      header: "Type",
      accessor: 'paymentType',
      cell: (row) => paymentTypeLabel(row),
    },
    {
      header: <SortableTableHeader label="Created At" sortKey="createdAt" />,
      accessor: 'createdAt',
      cell: (row) => row.createdAt ? formatDate(row.createdAt, 'DD/MM/YYYY') : "-",
      isDate: true
    },
    {
      header: "Actions",
      id: "actions",
      cell: (row) => {
        const itemOptions = [
          {
            label: "Edit",
            icon: <Edit size={16} />,
            action: () => handleEditSalaryPaid(row),
            className: "text-gray-700",
          },
          {
            label: "Delete",
            icon: <Trash2 size={16} />,
            action: () => handleDeleteSalaryPaid(row),
            className: "text-red-600",
          },
          {
            label: "View",
            icon: <Eye size={16} />,
            action: () => handleOpenViewModal(row),
            className: "text-blue-600",
          },
        ];
        return <ActionCell row={row} options={itemOptions} />;
      },
    },
  ], [sortConfig]);

  const handleEditSalaryPaid = (item) => {
    setEditingSalaryPaidData(item);
    const paymentType = resolvePaymentTypeFromRow(item);
    setFormData({
      employeeId: item.employeeId?._id || item.employeeId || '',
      paid: item.paid ?? '',
      paymentType,
      isUpad: paymentType === 'upad',
      description: item.description || '',
    });
    setIsUpdateSalaryPaidModalOpen(true);
    fetchEmployees();
  };

  const renderSalaryMasterSummary = (employeeId) => {
    if (!employeeId) return null;
    const row = employees.find((e) => String(e.value) === String(employeeId));
    if (!row) return null;
    // Same labels + fields as Salary Master New
    const summaryRows = [
      {
        label: 'Total Remaining',
        value: row.totalRemainingAmount ?? row.netSalary,
      },
      {
        label: 'Current Period Salary',
        value: row.currentPeriodSalary ?? row.currentTotalSalary,
      },
      {
        label: 'Last Period Salary',
        value: row.lastPeriodSalary ?? row.totalSalary,
      },
      {
        label: 'Bonus',
        value: row.bonusPaid,
      },
      {
        label: 'Upad',
        value: row.upadPaid ?? row.totalUpad,
      },
      {
        label: 'Pay Salary',
        value: row.paySalary,
      },
    ];
    return (
      <div className="rounded-md border border-light-border bg-gray-50 p-3 space-y-2">
        {summaryRows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="font-medium text-gray-800">{label}</span>
            <span className="font-semibold text-light-primary shrink-0">
              {formatRupeeSummary(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const handleOpenAddSalaryPaidModal = () => {
    setFormData({
      employeeId: '',
      paid: '',
      paymentType: 'salary',
      isUpad: false,
      description: '',
    });
    setIsAddSalaryPaidModalOpen(true);
    fetchEmployees();
  };

  const handleCloseAddSalaryPaidModal = () => {
    setIsAddSalaryPaidModalOpen(false);
    setFormData({
      employeeId: '',
      paid: '',
      paymentType: 'salary',
      isUpad: false,
      description: '',
    });
  };

  const handleAddSalaryPaidSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.paid) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsAddingSalaryPaid(true);
    try {
      const paymentType = formData.paymentType || 'salary';
      await addSalaryPaid({
        employeeId: formData.employeeId,
        paid: formData.paid,
        paymentType,
        isUpad: paymentType === 'upad',
        description: (formData.description || '').trim(),
      });
      fetchData();
      handleCloseAddSalaryPaidModal();
      toast.success('Payment entry added successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to add salary paid entry.');
    } finally {
      setIsAddingSalaryPaid(false);
    }
  };

  const handleDeleteSalaryPaid = (item) => {
    setSalaryPaidToDelete(item);
    setIsDeleteConfirmModalOpen(true);
  };

  const confirmDeleteSalaryPaid = async () => {
    if (!salaryPaidToDelete) return;
    setIsDeletingSalaryPaid(true);
    try {
      await deleteSalaryPaid(salaryPaidToDelete._id);
      fetchData();
      const employeeName = salaryPaidToDelete?.employeeId?.firstName && salaryPaidToDelete?.employeeId?.lastName 
        ? `${salaryPaidToDelete.employeeId.firstName} ${salaryPaidToDelete.employeeId.lastName}`
        : salaryPaidToDelete?.employeeId?.firstName || salaryPaidToDelete?.employeeId?.lastName || 'Unknown Employee';
      toast.success(`Salary paid entry for ${employeeName} deleted successfully.`);
    } catch (error) {
      toast.error('Failed to delete salary paid entry.');
    } finally {
      setIsDeletingSalaryPaid(false);
      setIsDeleteConfirmModalOpen(false);
      setSalaryPaidToDelete(null);
    }
  };

  const handleCloseDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
    setSalaryPaidToDelete(null);
  };

  const handleCloseUpdateSalaryPaidModal = () => {
    setEditingSalaryPaidData(null);
    setIsUpdateSalaryPaidModalOpen(false);
    setFormData({
      employeeId: '',
      paid: '',
      paymentType: 'salary',
      isUpad: false,
      description: '',
    });
  };

  const handleUpdateSalaryPaidSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.paid) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdatingSalaryPaid(true);
    try {
      const paymentType = formData.paymentType || 'salary';
      await updateSalaryPaid(editingSalaryPaidData._id, {
        employeeId: formData.employeeId,
        paid: formData.paid,
        paymentType,
        isUpad: paymentType === 'upad',
        description: (formData.description || '').trim(),
      });
      fetchData();
      handleCloseUpdateSalaryPaidModal();
      toast.success('Payment entry updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update salary paid entry.');
    } finally {
      setIsUpdatingSalaryPaid(false);
    }
  };

  const handleOpenViewModal = (item) => {
    setSelectedSalaryPaidData(item);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedSalaryPaidData(null);
  };

  // Excel download — open filter dropdown under the button
  const handleOpenDownloadFilter = () => {
    if (isDownloadFilterOpen) {
      setIsDownloadFilterOpen(false);
      return;
    }
    setDownloadFilters({
      startDate: '',
      endDate: '',
      employeeIds: [],
      paymentTypes: [],
    });
    setIsDownloadFilterOpen(true);
    if (!employees.length) fetchEmployees();
  };

  const handleCloseDownloadFilter = () => {
    if (exportLoading) return;
    setIsDownloadFilterOpen(false);
  };

  const handleExcelDownload = async () => {
    try {
      setExportLoading(true);

      const params = {
        isExcel: 'true',
        limit: 50000,
      };
      if (downloadFilters.startDate) params.startDate = downloadFilters.startDate;
      if (downloadFilters.endDate) params.endDate = downloadFilters.endDate;
      if (Array.isArray(downloadFilters.employeeIds) && downloadFilters.employeeIds.length > 0) {
        params.employeeIds = downloadFilters.employeeIds.join(',');
      }
      if (Array.isArray(downloadFilters.paymentTypes) && downloadFilters.paymentTypes.length > 0) {
        params.paymentTypes = downloadFilters.paymentTypes.join(',');
      }

      const blob = await getSalaryPaidExcel(params);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `Salary_Paid_Report_${timestamp}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setIsDownloadFilterOpen(false);
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Excel download error:', error);
      toast.error('Failed to download salary paid report. Please try again.');
    } finally {
      setExportLoading(false);
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
        const response = await importSalaryPaidData(file);
        setImportedData(response);
        // Show newest imports at top of Salary Paid list (same as form create)
        setSearchQuery('');
        setDebouncedSearchQuery('');
        setCurrentPage(1);
        setLoading(true);
        try {
          const listRes = await getSalaryPaid({
            page: 1,
            limit: currentLimit,
            search: '',
          });
          setAllSalaryPaid({
            items: listRes?.data?.paidSalaries,
            pagination:
              listRes?.data?.pagination || {
                total: 0,
                page: 1,
                pages: 1,
                limit: currentLimit,
              },
          });
        } finally {
          setLoading(false);
        }
      } catch (error) {
      } finally {
        setImportLoading(false);
        event.target.value = '';
      }
    }
  };

  const handleDemoExcelDownload = async () => {
    try {
      setDemoDownloadLoading(true);
      const blob = await downloadSalaryPaidImportDemo();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'salary-paid-import-demo.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Demo Excel downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download demo Excel. Please try again.');
      console.error('Error downloading demo Excel:', error);
    } finally {
      setDemoDownloadLoading(false);
    }
  };

  return (
    <>
      {(loading || isAddingSalaryPaid || isUpdatingSalaryPaid || isDeletingSalaryPaid || exportLoading) && <LoaderComponent size={56}/>}
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
          <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default max-sm:w-full max-sm:text-left">
            Salary Paid
          </h1>

          <div className="relative flex items-center gap-2 max-sm:w-full max-[475px]:!flex-col max-[380px]:gap-2" ref={filterRef}>
            <Button
              variant="outline"
              size="medium"
              icon={<LucidePlus size={20} />}
              label="Add Salary Paid"
              onClick={handleOpenAddSalaryPaidModal}
              className="flex items-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 focus:!ring-0  max-sm:w-full max-sm:justify-center"
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
              variant="outline"
              size="medium"
              icon={demoDownloadLoading ? <LucideLoader size={20} className="animate-spin" /> : <LucideDownload size={20} />}
              label={demoDownloadLoading ? "Downloading..." : "Demo Excel"}
              onClick={handleDemoExcelDownload}
              disabled={demoDownloadLoading}
              className="flex items-center space-x-2 shadow-none font-normal !rounded-md bg-white border border-light-primary px-4 py-2 text-light-primary hover:bg-light-natural_50 transition-colors duration-200 focus:!ring-0 max-sm:w-full max-sm:justify-center"
            />
            <div className="relative" ref={downloadFilterRef}>
              <Button
                variant="outline"
                size="medium"
                icon={<LucideDownload size={20} />}
                label={exportLoading ? "Downloading..." : "Download Report"}
                onClick={handleOpenDownloadFilter}
                disabled={exportLoading}
                className="flex items-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 focus:!ring-0 max-sm:w-full max-sm:justify-center"
              />
              {isDownloadFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-[22rem] max-sm:w-[min(22rem,calc(100vw-2rem))] rounded-lg bg-light-white shadow-lg border border-light-natural_200 z-50 p-4">
                  <div className="space-y-3">
                    <div className="custom-datepicker-wrapper relative" style={{ zIndex: 60 }}>
                      <label className="block text-sm font-semibold text-left text-light-darkGrey mb-1">
                        Date Range
                      </label>
                      <DatePicker
                        selectsRange={true}
                        startDate={
                          downloadFilters.startDate
                            ? parseISO(downloadFilters.startDate)
                            : null
                        }
                        endDate={
                          downloadFilters.endDate
                            ? parseISO(downloadFilters.endDate)
                            : null
                        }
                        onChange={(update) => {
                          const [start, end] = update || [];
                          setDownloadFilters((prev) => ({
                            ...prev,
                            startDate: start ? format(start, 'yyyy-MM-dd') : '',
                            endDate: end ? format(end, 'yyyy-MM-dd') : '',
                          }));
                        }}
                        isClearable={true}
                        placeholderText="Select Date Range (From - To)"
                        className="w-full px-3 py-2.5 rounded-md transition-all duration-200 focus:outline-none border border-[#CFC5B9] focus:ring-2 bg-[#F9F6F1] text-[#0B1C30] placeholder-[#7D766C] focus:ring-[rgba(125,118,108,0.35)] focus:border-[#7D766C] text-sm"
                        dateFormat="dd/MM/yyyy"
                        popperClassName="datepicker-popper-high-z"
                        portalId="root"
                      />
                    </div>

                    <SelectElement
                      name="Employees"
                      options={employees}
                      value={downloadFilters.employeeIds}
                      onChange={(val) =>
                        setDownloadFilters((prev) => ({
                          ...prev,
                          employeeIds: Array.isArray(val) ? val : [],
                        }))
                      }
                      placeholder={
                        isLoadingEmployees
                          ? 'Loading employees...'
                          : 'Select employees (optional)'
                      }
                      isClearable={true}
                      isMulti={true}
                      className="w-full"
                      menuPortalTarget={document.body}
                    />

                    <SelectElement
                      name="Type"
                      options={PAYMENT_TYPE_OPTIONS}
                      value={downloadFilters.paymentTypes}
                      onChange={(val) =>
                        setDownloadFilters((prev) => ({
                          ...prev,
                          paymentTypes: Array.isArray(val) ? val : [],
                        }))
                      }
                      placeholder="Select type (Salary / Upad / Bonus)"
                      isClearable={true}
                      isMulti={true}
                      className="w-full"
                      menuPortalTarget={document.body}
                    />

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="medium"
                        label="Cancel"
                        onClick={handleCloseDownloadFilter}
                        disabled={exportLoading}
                        className="flex-1 focus:!ring-0 border-gray-300 hover:bg-gray-50"
                      />
                      <Button
                        variant="primary"
                        size="medium"
                        label={exportLoading ? 'Downloading...' : 'Download'}
                        onClick={handleExcelDownload}
                        isLoading={exportLoading}
                        disabled={exportLoading}
                        className="flex-1 bg-light-primary hover:bg-light-primary_hover text-white focus:!ring-0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 w-[40rem] max-lg:w-full">
          <div className="flex-grow w-full">
            <InputElement
              type="text"
              placeholder="Search by employee name..."
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
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
            data={allSalaryPaid?.items || []}
            count={allSalaryPaid?.pagination?.total || 0}
            page={(allSalaryPaid?.pagination?.page || 1) - 1}
            rowsPerPage={allSalaryPaid?.pagination?.limit || currentLimit}
            onPageChange={handlePageChangeForTable}
            onRowsPerPageChange={handleRowsPerPageChangeForTable}
            rowsPerPageOptions={[25, 50, 75, 100, 150]}
            emptyDataMessage={
              searchQuery
                ? "No salary paid entries found matching your search."
                : "No salary paid entries available."
            }
            tableClassName="min-w-full divide-y divide-gray-200"
            uniqueRowIdentifier="_id"
          />
        </div>

        {/* Add Salary Paid Modal */}
        {isAddSalaryPaidModalOpen && (
          <Modal
            isOpen={isAddSalaryPaidModalOpen}
            onClose={handleCloseAddSalaryPaidModal}
            title="Add Salary Paid"
            size="2xl"
          >
            <form onSubmit={handleAddSalaryPaidSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <SelectElement
                    name="Employee"
                    options={employees}
                    value={formData.employeeId}
                    onChange={(val) => setFormData(prev => ({ ...prev, employeeId: val }))}
                    placeholder={isLoadingEmployees ? "Loading employees..." : "Select employee"}
                    isClearable={false}
                    isMulti={false}
                    className="w-full"
                    menuPortalTarget={document.body}
                  />
                </div>

                {renderSalaryMasterSummary(formData.employeeId)}
                
                <div>
                  <InputElement
                    type="number"
                    name="Paid Amount"
                    placeholder="Enter amount"
                    value={formData.paid}
                    onChange={(value) => setFormData(prev => ({ ...prev, paid: value }))}
                    variant="size_44"
                    className="w-full"
                    is_required={true}
                  />
                </div>

                <div>
                  <SelectElement
                    name="Type"
                    options={PAYMENT_TYPE_OPTIONS}
                    value={formData.paymentType || 'salary'}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentType: val || 'salary',
                        isUpad: val === 'upad',
                      }))
                    }
                    placeholder="Select type"
                    isClearable={false}
                    isMulti={false}
                    className="w-full"
                    menuPortalTarget={document.body}
                  />
                </div>

                <div>
                  <InputElement
                    type="textarea"
                    name="Description"
                    placeholder="Optional description"
                    value={formData.description || ''}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, description: value }))
                    }
                    variant="size_44"
                    className="w-full"
                    is_required={false}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  size="medium"
                  label="Cancel"
                  onClick={handleCloseAddSalaryPaidModal}
                  disabled={isAddingSalaryPaid}
                  className="flex-1 focus:!ring-0 border-gray-300 hover:bg-gray-50"
                />
                <Button
                  variant="primary"
                  size="medium"
                  label={isAddingSalaryPaid ? "Adding..." : "Save"}
                  type="submit"
                  isLoading={isAddingSalaryPaid}
                  disabled={isAddingSalaryPaid}
                  className="flex-1 bg-light-primary hover:bg-light-primary_hover text-white focus:!ring-0"
                />
              </div>
            </form>
          </Modal>
        )}

        {/* Update Salary Paid Modal */}
        {isUpdateSalaryPaidModalOpen && editingSalaryPaidData && (
          <Modal
            isOpen={isUpdateSalaryPaidModalOpen}
            onClose={handleCloseUpdateSalaryPaidModal}
            title={`Update Salary Paid`}
            size="2xl"
          >
            <form onSubmit={handleUpdateSalaryPaidSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <SelectElement
                    name="Employee"
                    options={employees}
                    value={formData.employeeId}
                    onChange={(val) => setFormData(prev => ({ ...prev, employeeId: val }))}
                    placeholder={isLoadingEmployees ? "Loading employees..." : "Select employee"}
                    isClearable={false}
                    isMulti={false}
                    className="w-full"
                    menuPortalTarget={document.body}
                  />
                </div>

                {renderSalaryMasterSummary(formData.employeeId)}
                
                <div>
                  <InputElement
                    type="number"
                    name="Paid Amount"
                    placeholder="Enter amount"
                    value={formData.paid}
                    onChange={(value) => setFormData(prev => ({ ...prev, paid: value }))}
                    variant="size_44"
                    className="w-full"
                    is_required={true}
                  />
                </div>

                <div>
                  <SelectElement
                    name="Type"
                    options={PAYMENT_TYPE_OPTIONS}
                    value={formData.paymentType || 'salary'}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentType: val || 'salary',
                        isUpad: val === 'upad',
                      }))
                    }
                    placeholder="Select type"
                    isClearable={false}
                    isMulti={false}
                    className="w-full"
                    menuPortalTarget={document.body}
                  />
                </div>

                <div>
                  <InputElement
                    type="textarea"
                    name="Description"
                    placeholder="Optional description"
                    value={formData.description || ''}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, description: value }))
                    }
                    variant="size_44"
                    className="w-full"
                    is_required={false}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  size="medium"
                  label="Cancel"
                  onClick={handleCloseUpdateSalaryPaidModal}
                  disabled={isUpdatingSalaryPaid}
                  className="flex-1 focus:!ring-0 border-gray-300 hover:bg-gray-50"
                />
                <Button
                  variant="primary"
                  size="medium"
                  label={isUpdatingSalaryPaid ? "Updating..." : "Update"}
                  type="submit"
                  isLoading={isUpdatingSalaryPaid}
                  disabled={isUpdatingSalaryPaid}
                  className="flex-1 bg-light-primary hover:bg-light-primary_hover text-white focus:!ring-0"
                />
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmModalOpen && salaryPaidToDelete && (
          <Modal
            isOpen={isDeleteConfirmModalOpen}
            onClose={handleCloseDeleteConfirmModal}
            title=""
            size="sm"
          >
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                <AlertTriangle size={28} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Confirm Delete
              </h3>
              <p className="text-sm text-gray-600 mb-6 w-full">
                Are you sure you want to delete salary paid entry for <br /><strong>
                  {salaryPaidToDelete?.employeeId?.firstName && salaryPaidToDelete?.employeeId?.lastName 
                    ? `${salaryPaidToDelete.employeeId.firstName} ${salaryPaidToDelete.employeeId.lastName}`
                    : salaryPaidToDelete?.employeeId?.firstName || salaryPaidToDelete?.employeeId?.lastName || 'Unknown Employee'
                  }
                </strong>?
              </p>
              <div className="flex justify-center space-x-3 w-full">
                <Button
                  variant="outline"
                  size="medium"
                  label="Cancel"
                  onClick={handleCloseDeleteConfirmModal}
                  disabled={isDeletingSalaryPaid}
                  className="flex-1 focus:!ring-0 border-gray-300 hover:bg-gray-50"
                />
                <Button
                  variant="primary"
                  size="medium"
                  label={isDeletingSalaryPaid ? "Deleting..." : "Yes, Delete"}
                  onClick={confirmDeleteSalaryPaid}
                  isLoading={isDeletingSalaryPaid}
                  disabled={isDeletingSalaryPaid}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white focus:!ring-0"
                />
              </div>
            </div>
          </Modal>
        )}

        {/* View Salary Paid Details Modal */}
        {isViewModalOpen && selectedSalaryPaidData && (
          <Modal
            isOpen={isViewModalOpen}
            onClose={handleCloseViewModal}
            title={`Salary Paid Details`}
            size="md"
          >
            <div className="p-6">
              <div className="space-y-4">
                                 <div className="grid grid-cols-2 gap-4 text-left">
                   <div>
                    <label className="block text-sm font-medium text-gray-600">Emp Name</label>
                     <p className="text-sm text-gray-900">{selectedSalaryPaidData?.employeeId?.firstName || '-' } {selectedSalaryPaidData?.employeeId?.lastName || '-'}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-600">Amount</label>
                     <p className="text-sm text-gray-900">₹{selectedSalaryPaidData.paid?.toLocaleString() || '0'}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-600">Type</label>
                     <p className="text-sm text-gray-900">{paymentTypeLabel(selectedSalaryPaidData)}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-600">Created Date</label>
                     <p className="text-sm text-gray-900">{selectedSalaryPaidData.createdAt ? formatDate(selectedSalaryPaidData.createdAt) : '-'}</p>
                   </div>
                   <div className="col-span-2">
                     <label className="block text-sm font-medium text-gray-600">Description</label>
                     <p className="text-sm text-gray-900 whitespace-pre-wrap">
                       {selectedSalaryPaidData.description?.trim()
                         ? selectedSalaryPaidData.description
                         : '-'}
                     </p>
                   </div>
                 </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
};

export default SalaryPaid;
