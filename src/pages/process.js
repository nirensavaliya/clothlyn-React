import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import InputElement from '../component/common/InputElement';
import CommonTable from '../component/common/Table/Table';
import ActionCell from '../component/common/Table/ActionCell';
import { Edit, Trash2, LucideSearch, LucidePlus, AlertTriangle, LucideLoader } from 'lucide-react';
import Button from '../component/common/Button';
import Modal from '../component/common/Modal';
import { formatDate } from '../helpers/utils';
import LoaderComponent from "../component/common/Loader";
import AddProcessModal from '../component/common/AddProcessModal';
import { getProcesses, addProcess, updateProcess, deleteProcess } from '../apis/processApi';
import usePageTitle from '../hooks/usePageTitle';

const ProcessPage = () => {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // 0-based for CommonTable
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: '',
    processName: '',
    needsMachine: false,
    hasSendReceive: false,
  });
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  usePageTitle('Process');
  const fetchProcesses = async (page = currentPage, limit = rowsPerPage, search = debouncedSearchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProcesses({ page: page + 1, limit, search }); // API is 1-based
      setData(res.data || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      setError('Failed to fetch processes');
    }
    setLoading(false);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 700);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchProcesses();
  }, [currentPage, rowsPerPage, debouncedSearchQuery]);

  const handleEdit = (row) => {
    setEditForm({
      ...row,
      needsMachine: !!row.needsMachine,
      hasSendReceive: !!row.hasSendReceive,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (row) => {
    setItemToDelete(row);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleCloseDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
    setItemToDelete(null);
  };

  const confirmDeleteItem = async () => {
    setIsDeletingItem(true);
    try {
      await deleteProcess(itemToDelete._id || itemToDelete.id);
      fetchProcesses();
      setIsDeleteConfirmModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      setError('Failed to delete process');
    }
    setIsDeletingItem(false);
  };

  const handleUpdateProcess = async () => {
    if (!editForm.processName.trim()) return;
    try {
      await updateProcess(editForm._id || editForm.id, {
        processName: editForm.processName,
        needsMachine: !!editForm.needsMachine,
        hasSendReceive: !!editForm.hasSendReceive,
      });
      fetchProcesses();
      setIsEditModalOpen(false);
    } catch (err) {
      setError('Failed to update process');
    }
  };

  const handleAddProcess = async (processInput) => {
    const processName =
      typeof processInput === 'string' ? processInput : processInput?.processName;
    if (!processName?.trim()) return;
    try {
      await addProcess(
        typeof processInput === 'string'
          ? processName
          : {
              processName,
              needsMachine: !!processInput?.needsMachine,
              hasSendReceive: !!processInput?.hasSendReceive,
            }
      );
      fetchProcesses();
      setIsAddModalOpen(false);
    } catch (err) {
      setError('Failed to add process');
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: 'createdAt',
      cell: (row) => formatDate(row.createdAt),
    },
    {
      header: 'Process Name',
      accessor: 'processName',
      cell: (row) => row.processName,
    },
    {
      header: 'Needs Machine',
      accessor: 'needsMachine',
      cell: (row) => (row.needsMachine ? 'Yes' : 'No'),
    },
    {
      header: 'Type',
      accessor: 'hasSendReceive',
      cell: (row) => (row.hasSendReceive ? 'Send / Receive' : 'Single'),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: (row) => {
        const options = [
          {
            label: 'Edit',
            icon: <Edit size={16} />,
            action: () => handleEdit(row),
            className: 'text-gray-700',
          },
          {
            label: 'Delete',
            icon: <Trash2 size={16} />,
            action: () => handleDelete(row),
            className: 'text-red-600',
          },
        ];
        return <ActionCell row={row} options={options} />;
      },
    },
  ];

  const handlePageChange = (newPage) => setCurrentPage(newPage);
  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(0);
  };

  return (
    <>
    {loading && <LoaderComponent size={56}/>} 
    <div className="space-y-6">
      <div className="flex items-center justify-between !mt-0">
        <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default">
          Process
        </h1>
        <Button
          variant="primary"
          size="medium"
          icon={<LucidePlus size={20} />}
          label="Add Process"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 shadow-none font-normal !rounded-md  px-4 py-2 text-light-white  transition-colors duration-200 focus:ring-0"
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="w-[40rem]">
          <InputElement
            type="text"
            placeholder="Search process..."
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setCurrentPage(0);
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
      <CommonTable
        columns={columns}
        data={data}
        count={totalCount}
        page={currentPage}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[25, 50, 75, 100, 150]}
        emptyDataMessage={searchQuery ? 'No processes found matching your search.' : 'No processes available.'}
        tableClassName="min-w-full divide-y divide-gray-200"
        loading={loading}
      />
      <AddProcessModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProcess={handleAddProcess}
        isLoading={loading}
      />
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Process"
        footerContent={
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="secondary" onClick={() => setIsEditModalOpen(false)} />
            <Button label="Update Process" variant="primary" onClick={handleUpdateProcess} />
          </div>
        }
      >
        <div className='p-4 space-y-4'>
          <InputElement
            name="Process Name"
            value={editForm.processName}
            onChange={(val) => setEditForm((prev) => ({ ...prev, processName: val }))}
            placeholder="Enter process name"
            is_required
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={!!editForm.needsMachine}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, needsMachine: e.target.checked }))
              }
              className="h-4 w-4"
            />
            Needs machine (scan will pick employee per machine)
          </label>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Process type</p>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="editProcessFlow"
                checked={!editForm.hasSendReceive}
                onChange={() =>
                  setEditForm((prev) => ({ ...prev, hasSendReceive: false }))
                }
                className="h-4 w-4"
              />
              Single process
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="editProcessFlow"
                checked={!!editForm.hasSendReceive}
                onChange={() =>
                  setEditForm((prev) => ({ ...prev, hasSendReceive: true }))
                }
                className="h-4 w-4"
              />
              Send / Receive (like Doracut)
            </label>
          </div>
        </div>
      </Modal>
      {isDeleteConfirmModalOpen && itemToDelete &&
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
              Are you sure you want to delete process <br /><strong>{itemToDelete.processName}</strong>?
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
                label={isDeletingItem ? "Deleting..." : "Yes, Delete"}
                onClick={confirmDeleteItem}
                isLoading={isDeletingItem}
                disabled={isDeletingItem}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white focus:!ring-0"
              />
            </div>
          </div>
        </Modal>
      }
    </div>
    </>
  );
};

export default ProcessPage; 