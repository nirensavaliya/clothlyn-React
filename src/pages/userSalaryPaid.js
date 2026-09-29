import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LucideSearch, LucideChevronDown, LucideChevronUp, LucideFilter, LucidePlus, LucideEdit, AlertTriangle, ExternalLink, Edit, Trash2, LucideLoader, Eye } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatDate, lowercase } from '../helpers/utils';
import InputElement from '../component/common/InputElement';
import CommonTable from '../component/common/Table/Table';
import Modal from '../component/common/Modal';
import Status from '../component/common/Status';
import SelectElement from '../component/common/Select';
import ActionCell from '../component/common/Table/ActionCell';
import LoaderComponent from '../component/common/Loader';
import { getSalaryPaid, addSalaryPaid, updateSalaryPaid, deleteSalaryPaid } from '../apis/salaryPaidApi';
import { getEmployees } from '../apis/employeeApi';
import { getUserSalaryPaid } from '../apis/userApi';
import usePageTitle from '../hooks/usePageTitle';
import SecureScreen from '../component/common/SecureScreen';

const UserSalaryPaid = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [allSalaryPaid, setAllSalaryPaid] = useState({ items: [] });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
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
    const user = JSON.parse(localStorage.getItem('user'));
    console.log("🚀 ~ UserSalaryPaid ~ user:", user)
    usePageTitle('User Salary Paid');

  // Form state for add/edit
  const [formData, setFormData] = useState({
    employeeId: '',
    paid: '',
    monthName: ''
  });

  
  const fetchData = async () => {  const params = {
        page: currentPage,
        limit: currentLimit,
        search: debouncedSearchQuery,
        ...(sortConfig.key && { sortKey: sortConfig.key, sortDirection: sortConfig.direction })
      };
    try {
      setLoading(true);
      const response = await getUserSalaryPaid(user?._id , params);
      console.log("🚀 ~ fetchData ~ response:", response)
      setAllSalaryPaid({ items: response?.data?.paidSalaries});
    } catch (error) {
      console.error('Error fetching data:', error);
      setAllSalaryPaid({ items: [] });
    } finally {
      setLoading(false);
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
      header: <SortableTableHeader label="Emp Name" sortKey="employeeName" />,
      accessor: 'employeeName',
      cell: (row) => row?.employeeId?.firstName + ' ' + row?.employeeId?.lastName || "-"
    },
    {
      header: <SortableTableHeader label="Month" sortKey="monthName" />,
      accessor: 'monthName',
      cell: (row) => row.monthName || "-"
    },
    {
      header: <SortableTableHeader label="Paid Amount" sortKey="paid" />,
      accessor: 'paid',
      cell: (row) => `₹${row.paid?.toLocaleString() || "0"}`
    },
    {
      header: <SortableTableHeader label="Created At" sortKey="createdAt" />,
      accessor: 'createdAt',
      cell: (row) => row.createdAt ? formatDate(row.createdAt) : "-",
      isDate: true
    },
    {
      header: "Actions",
      id: "actions",
      cell: (row) => {
        const itemOptions = [
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


  const confirmDeleteSalaryPaid = async () => {
    if (!salaryPaidToDelete) return;
    setIsDeletingSalaryPaid(true);
    try {
      await deleteSalaryPaid(salaryPaidToDelete._id);
      fetchData();
      toast.success(`Salary paid entry for ${salaryPaidToDelete.employeeCode} deleted successfully.`);
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



  const handleOpenViewModal = (item) => {
    setSelectedSalaryPaidData(item);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedSalaryPaidData(null);
  };

  return (
    <>
      {(loading || isAddingSalaryPaid || isUpdatingSalaryPaid || isDeletingSalaryPaid) && <LoaderComponent size={56}/>}
      <SecureScreen message="Salary Paid — protected">
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
            count={allSalaryPaid?.items?.length  || 0}
            page={0}
            rowsPerPage={allSalaryPaid?.items?.length || 0}
            onPageChange={handlePageChangeForTable}
            onRowsPerPageChange={handleRowsPerPageChangeForTable}
            rowsPerPageOptions={[25, 50, 75, 100, 150]}
            emptyDataMessage={
              searchQuery
                ? "No salary paid entries found matching your search."
                : "No salary paid entries available."
            }
            tableClassName="min-w-full divide-y divide-gray-200"
          />
        </div>

        
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
                     <label className="block text-sm font-medium text-gray-600">Month</label>
                     <p className="text-sm text-gray-900">{selectedSalaryPaidData.monthName || '-'}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-600">Created Date</label>
                     <p className="text-sm text-gray-900">{selectedSalaryPaidData.createdAt ? formatDate(selectedSalaryPaidData.createdAt) : '-'}</p>
                   </div>
                 </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
      </SecureScreen>
    </>
  );
};

export default UserSalaryPaid;
