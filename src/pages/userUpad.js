import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LucideSearch, LucideChevronDown, LucideChevronUp, LucideLoader, LucideFilter, LucidePlus, LucideEdit, ExternalLink, Eye } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatDate, lowercase } from '../helpers/utils';
import InputElement from '../component/common/InputElement';
import CommonTable from '../component/common/Table/Table';
import Button from '../component/common/Button';
import Modal from '../component/common/Modal';
import ActionCell from '../component/common/Table/ActionCell';
import LoaderComponent from '../component/common/Loader';
import AddUpadModal from '../component/Upad/AddUpadModal';
import { getUserUpadData } from '../apis/upadApi';
import usePageTitle from '../hooks/usePageTitle';
import SecureScreen from '../component/common/SecureScreen';

const UserUpad = ({ onSidebarAddUpadClick }) => {
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItemForView, setSelectedItemForView] = useState(null);
  
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
  const user = JSON.parse(localStorage.getItem('user'));  

    usePageTitle('User UPAD');
  
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

      const response = await getUserUpadData(user?._id , params);
      
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
  };
 

  const handleCloseUpdateItemModal = () => {
    setEditingItemData(null);
    setIsUpdateItemModalOpen(false);
  };

  const handleUpdateItemSubmit = async (itemId, updatedData) => {
    setIsUpdatingItem(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
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

  const handleOpenViewModal = (item) => {
    setSelectedItemForView(item);
    setIsViewModalOpen(true);
  };



  const handleCloseViewModal = () => {
    setSelectedItemForView(null);
    setIsViewModalOpen(false);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

 const columns = useMemo(() => [
    {
      header: "Upad Dates",
      accessor: 'createdAt',
      cell: (row) => row.createdAt ? formatDate(row.createdAt, 'DD/MM/YYYY') : "-",
      isDate: true
    },
    {
      header: "Emp Name",
      accessor: 'employeeName',
      cell: (row) => row?.employeeId?.firstName + ' ' + row?.employeeId?.lastName  || "-"
    },
    {
      header: "Salary",
      accessor: 'salary',
      cell: (row) => `₹${row.totalSalary?.toLocaleString() || 0}`
    },
    // {
    //   header: "Bounce",
    //   accessor: 'bounce',
    //   cell: (row) => `₹${row.bounce?.toLocaleString() || 0}`
    // },
    // {
    //   header: "Total salary",
    //   accessor: 'totalSalary',
    //   cell: (row) => `₹${row.totalSalary?.toLocaleString() || 0}`
    // },
    // {
    //   header: "UPAD Dates",
    //   accessor: 'upadDates',
    //   cell: (row) => {
    //     if (row.upadDates && row.upadDates.length > 0) {
    //       return (
    //         <div className="flex flex-wrap gap-1">
    //           {row.upadDates.map((date, index) => (
    //             <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
    //               {formatDate(date)}
    //             </span>
    //           ))}
    //         </div>
    //       );
    //     }
    //     return "-";
    //   }
    // },
    {
      header: "Total UPAD",
      accessor: 'totalUpad',
      cell: (row) => `₹${row.upadAmount?.toLocaleString() || 0}`
    },
    {
      header: "Final Total Salary",
      accessor: 'finalTotalSalary',
      cell: (row) =>
        row.finalTotalSalary != null && row.finalTotalSalary !== ''
          ? `₹${Number(row.finalTotalSalary).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}`
          : '-',
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
            className: "text-gray-700 hover:text-green-600",
          },

        ];
        return <ActionCell row={row} options={itemOptions} />;
      },
    },
  ], []);
  return (
    <>
             {(loading || isUpadLoading || isUpdatingItem) && <LoaderComponent size={56}/>}

    <SecureScreen message="Upad Report — protected">
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
          count={upadData?.pagination?.total || 0}
          page={(upadData?.pagination?.page || 1) - 1}
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

      {isUpdateItemModalOpen && editingItemData && (
        <Modal
          isOpen={isUpdateItemModalOpen}
          onClose={handleCloseUpdateItemModal}
          title={`Update UPAD Record`}
          size="2xl"
        >
          <div className="p-6">
            <p className="text-gray-600 mb-4">Update UPAD form will be implemented here.</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="medium"
                label="Cancel"
                onClick={handleCloseUpdateItemModal}
                className="focus:!ring-0"
              />
              <Button
                variant="primary"
                size="medium"
                label="Update Record"
                onClick={() => handleUpdateItemSubmit(editingItemData.id, {})}
                loading={isUpdatingItem}
                className="focus:!ring-0"
              />
            </div>
          </div>
        </Modal>
      )}

            {isViewModalOpen && selectedItemForView && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          title="UPAD Record Details"
          size="2xl"
        >
          <div className="p-6">
            {/* Employee Information */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Employee Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Emp Name</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {selectedItemForView.employeeName || 
                     (selectedItemForView.employee ? 
                       `${selectedItemForView.employee.firstName} ${selectedItemForView.employee.lastName}` : 
                       'N/A')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <p className="mt-1 text-sm text-gray-900">#{selectedItemForView._id || selectedItemForView.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedItemForView.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Salary Details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Salary Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary</label>
                  <p className="text-lg font-bold text-gray-900">₹{selectedItemForView.salary?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bounce Amount</label>
                  <p className="text-lg font-bold text-green-600">₹{selectedItemForView.bounce?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Salary</label>
                  <p className="text-lg font-bold text-blue-600">₹{selectedItemForView.totalSalary?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>

            {/* UPAD Details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">UPAD Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg bg-orange-50">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total UPAD</label>
                  <p className="text-lg font-bold text-orange-600">₹{selectedItemForView.totalUpad?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg bg-green-50">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Final Salary</label>
                  <p className="text-lg font-bold text-green-600">
                    {selectedItemForView.finalTotalSalary != null &&
                    selectedItemForView.finalTotalSalary !== ''
                      ? `₹${Number(selectedItemForView.finalTotalSalary).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}`
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* UPAD Payment Dates */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">UPAD Payment Dates</h3>
              {selectedItemForView.upadDates && selectedItemForView.upadDates.length > 0 ? (
                <div className="space-y-2">
                  {selectedItemForView.upadDates.map((date, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900">Payment #{index + 1}</span>
                      </div>
                      <span className="text-sm text-gray-600">{formatDate(date)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No UPAD payments recorded</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
    </SecureScreen>
    </>
  );
};

export default UserUpad; 