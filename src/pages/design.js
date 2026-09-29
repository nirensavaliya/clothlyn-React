import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LucideSearch, LucideChevronDown, LucideChevronUp, LucideLoader, LucideFilter, LucidePlus, LucideEdit, AlertTriangle, ExternalLink, Eye, Trash2 as Trash2Icon, LucideDownload } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getDesigns, createDesign, updateDesign, deleteDesign, updateDesignProcessPrices } from '../apis/designApi';
import { formatDate, lowercase } from '../helpers/utils';
import InputElement from '../component/common/InputElement';
import CommonTable from '../component/common/Table/Table';
import Button from '../component/common/Button';
import Modal from '../component/common/Modal';
import ActionCell from '../component/common/Table/ActionCell';
import AddDesignForm from '../component/Design/AddDesignForm';
import UpdateDesignForm from '../component/Design/UpdateDesignForm';
import ViewDesignDetailsModal from '../component/Design/ViewDesignDetailsModal';
import UpdateDesignRateByDateForm from '../component/Design/UpdateDesignRateByDateForm';
import LoaderComponent from '../component/common/Loader';
import { getProcesses } from '../apis/processApi';
import usePageTitle from '../hooks/usePageTitle';

const Design = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [designsData, setDesignsData] = useState({ items: [], pagination: { total: 0, page: 1, pages: 1, limit: 10 } });
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isUpdateItemModalOpen, setIsUpdateItemModalOpen] = useState(false);
  const [editingItemData, setEditingItemData] = useState(null);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isUpdateRateByDateModalOpen, setIsUpdateRateByDateModalOpen] = useState(false);
  const [selectedDesignForRateUpdateByDate, setSelectedDesignForRateUpdateByDate] = useState(null);
  const [isUpdatingRatesByDate, setIsUpdatingRatesByDate] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDesignForView, setSelectedDesignForView] = useState(null);
 
  usePageTitle('Design');
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: currentLimit,
        search: debouncedSearchQuery,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      };
      const response = await getDesigns(params);
      setDesignsData({ items: response.data, pagination: response.pagination });
    } catch (error) {
      setDesignsData({ items: [], pagination: { total: 0, page: 1, pages: 1, limit: currentLimit } });
      toast.error('Failed to fetch designs. Please try again.', { toastId: 'design-fetch-error' });
      console.error('Error fetching designs:', error);
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

  const handleEditItem = (design) => {
    setEditingItemData(design);
    setIsUpdateItemModalOpen(true);
  };

  const handleOpenAddItemModal = () => {
    setIsAddItemModalOpen(true);
  };

  const handleCloseAddItemModal = () => {
    setIsAddItemModalOpen(false);
  };

  const handleAddItemSubmit = async (newItemData) => {
    setIsAddingItem(true);
    try {
      await createDesign(newItemData);
      fetchData();
      handleCloseAddItemModal();
      toast.success(`Design "${newItemData.designNumber}" created successfully!`, { toastId: 'design-create-success' });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add design';
      toast.error(errorMessage, { toastId: 'design-create-error' });
      console.error('Error creating design:', error);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = (design) => {
    setItemToDelete(design);
    setIsDeleteConfirmModalOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      await deleteDesign(itemToDelete._id);
      fetchData();
      toast.success(`Design "${itemToDelete.designNumber || itemToDelete.lotNo}" deleted successfully!`, { toastId: 'design-delete-success' });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete design';
      toast.error(errorMessage, { toastId: 'design-delete-error' });
      console.error('Error deleting design:', error);
    } finally {
      setIsDeletingItem(false);
      setIsDeleteConfirmModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleCloseDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
    setItemToDelete(null);
  };

  const handleCloseUpdateItemModal = () => {
    setEditingItemData(null);
    setIsUpdateItemModalOpen(false);
  };

  const handleUpdateItemSubmit = async (itemId, updatedData) => {
    setIsUpdatingItem(true);
    try {
      await updateDesign(itemId, updatedData);
      fetchData();
      handleCloseUpdateItemModal();
      toast.success(`Design updated successfully!`, { toastId: 'design-update-success' });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update design';
      toast.error(errorMessage, { toastId: 'design-update-error' });
      console.error('Error updating design:', error);
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const handleOpenUpdateRateByDateModal = (design) => {
    setSelectedDesignForRateUpdateByDate(design);
    if(design?.processes?.length > 0){

      setIsUpdateRateByDateModalOpen(true);
    }
  };

  const handleCloseUpdateRateByDateModal = () => {
    setSelectedDesignForRateUpdateByDate(null);
    setIsUpdateRateByDateModalOpen(false);
  };

  const handleUpdateRateByDateSubmit = async (payload) => {
    setIsUpdatingRatesByDate(true);
    try {
      await updateDesignProcessPrices(payload.designId, payload.processRateUpdates);
      toast.success(`Rates updated for design successfully!`, { toastId: 'design-rates-updated' });
      fetchData();
      handleCloseUpdateRateByDateModal();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update rates';
      toast.error(errorMessage, { toastId: 'design-rates-error' });
      console.error('Error updating design rates:', error);
    } finally {
      setIsUpdatingRatesByDate(false);
    }
  };

  const handleOpenViewModal = (design) => {
    setSelectedDesignForView(design);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setSelectedDesignForView(null);
    setIsViewModalOpen(false);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const columns = useMemo(() => [
    {
      header: "Date",
      accessor: 'createdAt',
      cell: (row) => row.createdAt ? formatDate(row.createdAt) : "-",
      isDate: true
    },
    {
      header: "Design Number",
      accessor: 'designNumber',
      cell: (row) => row.designNumber || "-"
    },
    {
      header: "Process Name",
      cell: (row) => {
        if (row.currentProcesses && row.currentProcesses.length > 0) {
          const processesToShow = row.currentProcesses || [];

          if (processesToShow.length > 0) {
            return (
                <div className="flex flex-wrap gap-1">
                {processesToShow.map((process, index) => {
                  const machineTotal = Array.isArray(process.machineDetails)
                    ? process.machineDetails.reduce(
                        (sum, m) => sum + (Number(m.baseRate) || 0),
                        0
                      )
                    : 0;
                  const displayPrice =
                    machineTotal > 0 ? machineTotal : (process.price ?? 0);
                  return (
                  <span key={index} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium ${process.isCurrentlyActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {process.processName} (₹{displayPrice})
                  </span>
                  );
                })}
              </div>
            );
          }
        }
        return "-";
      }
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
          {
           label: "Rate Changes",
           icon: <LucideEdit size={16} />,
           action: () =>  handleOpenUpdateRateByDateModal(row),
           className: "text-gray-700 hover:text-purple-600",
          },
          {
            label: "View",
            icon: <Eye size={16} />,
            action: () => handleOpenViewModal(row),
            className: "text-gray-700 hover:text-green-600",
          },
          {
            label: "Delete",
            icon: <Trash2Icon size={16} />,
            action: () => handleDeleteItem(row),
            className: "text-gray-700 hover:text-red-600",
          },
        ];
        return <ActionCell row={row} options={itemOptions} />;
      },
    },
  ], []);

  return (
    <>
      {(loading || isAddingItem || isUpdatingItem || isDeletingItem || isUpdatingRatesByDate) && <LoaderComponent size={56}/>}

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
          Design
        </h1>

        <div className="flex gap-2 max-sm:w-full max-[320px]:flex-col max-[320px]:gap-2.5">

          <Button
            variant="outline"
            size="medium"
            icon={<LucidePlus size={20} />}
            label="Add New design"
            onClick={handleOpenAddItemModal}
            className="flex items-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 focus:!ring-0 max-sm:w-full max-sm:justify-center"
          />
          <Button
              variant="primary"
              size="medium"
              icon={<LucideDownload size={20} />}
              label="Excel Download"
              onClick={() => toast.info('Excel download coming soon!')}
              className="flex items-center space-x-2 shadow-none font-normal !rounded-md px-4 py-2 text-light-white transition-colors duration-200 focus:ring-0 max-sm:w-full max-sm:justify-center"
            />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 w-[40rem] max-lg:w-full">
        <div className="flex-grow w-full">
          <InputElement
            type="text"
            placeholder="Search..."
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
          data={designsData?.items || []}
          count={designsData?.pagination?.totalItems || 0}
          page={(designsData?.pagination?.currentPage || 1) - 1}
          rowsPerPage={designsData?.pagination?.itemsPerPage || currentLimit}
          onPageChange={handlePageChangeForTable}
          onRowsPerPageChange={handleRowsPerPageChangeForTable}
          rowsPerPageOptions={[25, 50, 75, 100, 150]}
          emptyDataMessage={
            searchQuery
              ? "No designs found matching your search."
              : "No designs available."
          }
          tableClassName="min-w-full divide-y divide-gray-200"
        />
      </div>

      {isAddItemModalOpen && (
        <Modal
          isOpen={isAddItemModalOpen}
          onClose={handleCloseAddItemModal}
          title="Add New design"
          size="2xl"
        >
          <AddDesignForm
            onSubmit={handleAddItemSubmit}
            onCancel={handleCloseAddItemModal}
            isLoading={isAddingItem}
          />
        </Modal>
      )}

      {isUpdateItemModalOpen && editingItemData && (
        <Modal
          isOpen={isUpdateItemModalOpen}
          onClose={handleCloseUpdateItemModal}
          title={`Update design`}
          size="2xl"
        >
          <UpdateDesignForm
            designData={editingItemData}
            onSubmit={handleUpdateItemSubmit}
            onCancel={handleCloseUpdateItemModal}
            isLoading={isUpdatingItem}

          />
        </Modal>
      )}

      {isDeleteConfirmModalOpen && itemToDelete && (
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
              Are you sure you want to delete design <br /><strong>{itemToDelete.designNumber || itemToDelete.lotNo}</strong>?.
            </p>
            <div className="flex justify-center space-x-3 w-full">
              <Button
                variant="outline"
                size="medium"
                label="Cancel"
                onClick={handleCloseDeleteConfirmModal}
                disabled={isDeletingItem}
                className="flex-1 focus:!ring-0 border-gray-300 hover:bg-gray-50"
              />
              <Button
                variant="primary"
                size="medium"
                label={ "Yes, Delete"}
                onClick={confirmDeleteItem}
                loading={isDeletingItem}
                disabled={isDeletingItem}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white focus:!ring-0"
              />
            </div>
          </div>
        </Modal>
      )}

      {isUpdateRateByDateModalOpen && selectedDesignForRateUpdateByDate && (
       <Modal
         isOpen={isUpdateRateByDateModalOpen}
         onClose={handleCloseUpdateRateByDateModal}
         title={`Update Rates for Design`}
         size="2xl"
       >
         <UpdateDesignRateByDateForm
           designData={selectedDesignForRateUpdateByDate}
           onSubmit={handleUpdateRateByDateSubmit}
           onCancel={handleCloseUpdateRateByDateModal}
           isLoading={isUpdatingRatesByDate}
         />
       </Modal>
      )}

      {isViewModalOpen && selectedDesignForView && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          title={`View Design`}
          size="xl"
        >
          <ViewDesignDetailsModal
            designItem={selectedDesignForView}
            onClose={handleCloseViewModal}
          />
        </Modal>
      )}
    </div>
    </>
  );
};

export default Design;