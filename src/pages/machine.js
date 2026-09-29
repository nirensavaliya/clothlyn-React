import React, { useState, useMemo, useRef, useEffect } from 'react';
import InputElement from '../component/common/InputElement';
import CommonTable from '../component/common/Table/Table';
import ActionCell from '../component/common/Table/ActionCell';
import { Edit, Trash2, LucideSearch, LucidePlus, AlertTriangle } from 'lucide-react';
import Button from '../component/common/Button';
import Modal from '../component/common/Modal';
import { formatDate } from '../helpers/utils';

import LoaderComponent from "../component/common/Loader";
import EditMachineForm from '../component/Users/EditMachineForm';
import { addMachine, updateMachine, deleteMachine } from '../apis/machineApi';
import { useMachines } from '../contexts/MachineContext';
import usePageTitle from '../hooks/usePageTitle';

const MachinePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMachineName, setNewMachineName] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ _id: '', machineName: '' });
  const editFormRef = useRef();
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [error, setError] = useState(null);
  
  const { machines: data, loading, refreshMachines, fetchMachines } = useMachines();

  usePageTitle('Machine');

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter(
      (row) =>
        (row.machineName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = currentPage * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const handleEdit = (row) => {
    setEditForm({ ...row });
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
      await deleteMachine(itemToDelete._id || itemToDelete.id);
      refreshMachines();
      setIsDeleteConfirmModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      setError('Failed to delete machine');
    }
    setIsDeletingItem(false);
  };

  const handleUpdateMachine = async () => {
    if (!editForm.machineName.trim()) return;
    try {
      await updateMachine(editForm._id || editForm.id, { machineName: editForm.machineName });
      refreshMachines();
      setIsEditModalOpen(false);
    } catch (err) {
      setError('Failed to update machine');
    }
  };

  const handleAddMachine = async () => {
    if (!newMachineName.trim()) return;
    try {
      await addMachine({ machineName: newMachineName });
      refreshMachines();
      setIsAddModalOpen(false);
      setNewMachineName('');
    } catch (err) {
      setError('Failed to add machine');
    }
  };

  const columns = [
    {
      header: 'Date',
      id: 'date',
      accessor: 'createdAt',
      cell: (row) => formatDate(row.createdAt),
    },
    {
      header: 'Machine Name',
      id: 'machineName',
      accessor: 'machineName',
      cell: (row) => row.machineName,
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
          Machine
        </h1>
        <Button
          variant="primary"
          size="medium"
          icon={<LucidePlus size={20} />}
          label="Add Machine"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 shadow-none font-normal !rounded-md  px-4 py-2 text-light-white  transition-colors duration-200 focus:ring-0"
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="w-[40rem]">
          <InputElement
            type="text"
            placeholder="Search machine..."
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setCurrentPage(0);
            }}
            variant="size_44"
            className="w-full"
            is_required={false}
            extra_text_before={<LucideSearch size={20} className="text-light-lightGrey" />}
          />
        </div>
      </div>
      <div className="w-full">
        <CommonTable
          columns={columns}
          data={paginatedData}
          count={filteredData.length}
          page={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[25, 50, 75, 100, 150]}
          emptyDataMessage={searchQuery ? 'No machines found matching your search.' : 'No machines available.'}
          tableClassName="min-w-full divide-y divide-gray-200"
        />
      </div>
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Machine"
        size="sm"
        footerContent={
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="secondary" onClick={() => setIsAddModalOpen(false)} />
            <Button label="Add Machine" variant="primary" onClick={handleAddMachine} />
          </div>
        }
      >
        <div className="p-4">
          <InputElement
            name="Machine Name"
            value={newMachineName}
            onChange={setNewMachineName}
            placeholder="Enter machine name"
            is_required
          />
        </div>
      </Modal>
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Machine"
        footerContent={
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="secondary" onClick={() => setIsEditModalOpen(false)} />
            <Button label="Update Machine" variant="primary" onClick={handleUpdateMachine} />
          </div>
        }
      >
        <div className='p-4'>

        <InputElement
          name="Machine Name"
          value={editForm.machineName}
          onChange={(val) => setEditForm((prev) => ({ ...prev, machineName: val }))}
          placeholder="Enter machine name"
          is_required
        />
        </div>
      </Modal>
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
              Are you sure you want to delete machine <br /><strong>{itemToDelete.machineName}</strong>?
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
      )}
    </div>
    </>
  );
};

export default MachinePage; 