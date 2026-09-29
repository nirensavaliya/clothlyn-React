import React, { useState, useEffect, useMemo } from 'react';
import { LucideSearch, LucideLoader, LucidePlus, LucideEdit, Trash2 as Trash2Icon } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../apis/companiesApi';
import { formatDate } from '../helpers/utils';
import InputElement from '../component/common/InputElement';
import SelectElement from '../component/common/Select';
import CommonTable from '../component/common/Table/Table';
import Button from '../component/common/Button';
import Modal from '../component/common/Modal';
import ActionCell from '../component/common/Table/ActionCell';
import LoaderComponent from '../component/common/Loader';
import usePageTitle from '../hooks/usePageTitle';

const Companies = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [companiesData, setCompaniesData] = useState({ items: [], pagination: { total: 0, page: 1, pages: 1, limit: 10 } });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  usePageTitle('Companies');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 700);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: currentLimit,
        search: debouncedSearchQuery,
        isActive: isActiveFilter,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      };
      const response = await getCompanies(params);
      setCompaniesData({ items: response.data || [], pagination: response.pagination || { total: 0, page: 1, pages: 1, limit: 10 } });
    } catch (error) {
      setCompaniesData({ items: [], pagination: { total: 0, page: 1, pages: 1, limit: currentLimit } });
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, currentLimit, debouncedSearchQuery, isActiveFilter, sortConfig]);

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

  const validateForm = () => {
    const errors = {};
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Company name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true
    });
    setFormErrors({});
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleAddSubmit = async () => {
    if (!validateForm()) return;

    setIsAdding(true);
    try {
      await createCompany({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined
      });
      toast.success(`Company "${formData.name}" created successfully!`, { toastId: 'company-create-success' });
      fetchData();
      handleCloseAddModal();
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (company) => {
    setFormData({
      name: company.name || '',
      description: company.description || '',
      isActive: company.isActive !== undefined ? company.isActive : true
    });
    setEditingCompany(company);
    setFormErrors({});
    setIsUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setEditingCompany(null);
    resetForm();
  };

  const handleUpdateSubmit = async () => {
    if (!validateForm() || !editingCompany) return;

    setIsUpdating(true);
    try {
      await updateCompany(editingCompany._id, {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        isActive: formData.isActive
      });
      toast.success(`Company updated successfully!`, { toastId: 'company-update-success' });
      fetchData();
      handleCloseUpdateModal();
    } catch (error) {
      console.error('Error updating company:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = (company) => {
    setCompanyToDelete(company);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCompanyToDelete(null);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCompany(companyToDelete._id);
      toast.success(`Company "${companyToDelete.name}" deleted successfully!`, { toastId: 'company-delete-success' });
      fetchData();
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Error deleting company:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleIsActiveFilterChange = (value) => {
    setIsActiveFilter(value);
    setCurrentPage(1);
  };

  const isActiveOptions = [
    { value: '', label: 'All' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' }
  ];

  const columns = useMemo(() => [
    {
      header: "Date",
      accessor: 'createdAt',
      cell: (row) => row.createdAt ? formatDate(row.createdAt) : "-",
    },
    {
      header: "Company Name",
      accessor: 'name',
      cell: (row) => row.name || "-"
    },
    {
      header: "Description",
      accessor: 'description',
      cell: (row) => row.description || "-"
    },
    {
      header: "Status",
      accessor: 'isActive',
      cell: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: "Actions",
      id: "actions",
      cell: (row) => {
        const itemOptions = [
          {
            label: "Edit",
            icon: <LucideEdit size={16} />,
            action: () => handleEdit(row),
            className: "text-gray-700 hover:text-blue-600",
          },
          {
            label: "Delete",
            icon: <Trash2Icon size={16} />,
            action: () => handleDelete(row),
            className: "text-gray-700 hover:text-red-600",
          },
        ];
        return <ActionCell row={row} options={itemOptions} />;
      },
    },
  ], []);

  return (
    <>
      {(loading || isAdding || isUpdating || isDeleting) && <LoaderComponent size={56}/>}

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
            Companies
          </h1>

          <div className="flex gap-2 max-sm:w-full max-[320px]:flex-col max-[320px]:gap-2.5">
            <Button
              variant="outline"
              size="medium"
              icon={<LucidePlus size={20} />}
              label="Create Company"
              onClick={handleOpenAddModal}
              className="flex items-center space-x-2 shadow-none font-normal !rounded-md bg-light-primary px-4 py-2 text-light-white hover:bg-light-primary_hover transition-colors duration-200 focus:!ring-0 max-sm:w-full max-sm:justify-center"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 w-full max-lg:w-full max-lg:flex-col">
          <div className="flex-grow w-full">
            <InputElement
              type="text"
              placeholder="Search companies..."
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
          <div className="w-48 max-lg:w-full">
            <SelectElement
              options={isActiveOptions}
              value={isActiveFilter}
              onChange={handleIsActiveFilterChange}
              placeholder="Filter by Status"
              className="w-full"
            />
          </div>
        </div>

        <div className="w-full">
          <CommonTable
            columns={columns}
            data={companiesData?.items || []}
            count={companiesData?.pagination?.total || 0}
            page={(companiesData?.pagination?.page || companiesData?.pagination?.currentPage || 1) - 1}
            rowsPerPage={companiesData?.pagination?.limit || companiesData?.pagination?.itemsPerPage || currentLimit}
            onPageChange={handlePageChangeForTable}
            onRowsPerPageChange={handleRowsPerPageChangeForTable}
            rowsPerPageOptions={[25, 50, 75, 100, 150]}
            emptyDataMessage={
              searchQuery || isActiveFilter
                ? "No companies found matching your search."
                : "No companies available."
            }
            tableClassName="min-w-full divide-y divide-gray-200"
          />
        </div>

        {/* Add Company Modal */}
        {isAddModalOpen && (
          <Modal
            isOpen={isAddModalOpen}
            onClose={handleCloseAddModal}
            title="Create Company"
            size="md"
            footerContent={
              <div className="flex justify-end gap-2">
                <Button
                  label="Cancel"
                  variant="outline"
                  onClick={handleCloseAddModal}
                  disabled={isAdding}
                  className="focus:!ring-0"
                />
                <Button
                  label="Create"
                  variant="primary"
                  onClick={handleAddSubmit}
                  loading={isAdding}
                  disabled={isAdding}
                  className="focus:!ring-0"
                />
              </div>
            }
          >
            <div className="p-6 space-y-4">
              <InputElement
                name="Company Name"
                value={formData.name}
                onChange={(value) => {
                  setFormData({ ...formData, name: value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                }}
                placeholder="Enter company name"
                is_required
                error={formErrors.name}
              />
              
              <InputElement
                name="Description (Optional)"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Enter description (optional)"
                is_required={false}
              />
            </div>
          </Modal>
        )}

        {/* Update Company Modal */}
        {isUpdateModalOpen && editingCompany && (
          <Modal
            isOpen={isUpdateModalOpen}
            onClose={handleCloseUpdateModal}
            title="Update Company"
            size="md"
            footerContent={
              <div className="flex justify-end gap-2">
                <Button
                  label="Cancel"
                  variant="outline"
                  onClick={handleCloseUpdateModal}
                  disabled={isUpdating}
                  className="focus:!ring-0"
                />
                <Button
                  label="Update"
                  variant="primary"
                  onClick={handleUpdateSubmit}
                  loading={isUpdating}
                  disabled={isUpdating}
                  className="focus:!ring-0"
                />
              </div>
            }
          >
            <div className="p-6 space-y-4">
              <InputElement
                name="Company Name"
                value={formData.name}
                onChange={(value) => {
                  setFormData({ ...formData, name: value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                }}
                placeholder="Enter company name"
                is_required
                error={formErrors.name}
              />
              
              <InputElement
                name="Description (Optional)"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Enter description (optional)"
                is_required={false}
              />

              <SelectElement
                name="Status"
                options={[
                  { value: true, label: 'Active' },
                  { value: false, label: 'Inactive' }
                ]}
                value={formData.isActive}
                onChange={(value) => setFormData({ ...formData, isActive: value })}
                placeholder="Select status"
                is_required
              />
            </div>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && companyToDelete && (
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={handleCloseDeleteModal}
            title=""
            size="sm"
            footerContent={
              <div className="flex justify-center space-x-3 w-full">
                <Button
                  variant="outline"
                  size="medium"
                  label="Cancel"
                  onClick={handleCloseDeleteModal}
                  disabled={isDeleting}
                  className="flex-1 focus:!ring-0 border-gray-300 hover:bg-gray-50"
                />
                <Button
                  variant="primary"
                  size="medium"
                  label="Yes, Delete"
                  onClick={confirmDelete}
                  loading={isDeleting}
                  disabled={isDeleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white focus:!ring-0"
                />
              </div>
            }
          >
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                <Trash2Icon size={28} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Confirm Delete
              </h3>
              <p className="text-sm text-gray-600 mb-6 w-full">
                Are you sure you want to delete company <br /><strong>{companyToDelete.name}</strong>?
              </p>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
};

export default Companies;