import React, { useState, useMemo, useEffect, useRef } from 'react';
import InputElement from '../component/common/InputElement';
import CommonTable from '../component/common/Table/Table';
import ActionCell from '../component/common/Table/ActionCell';
import { Edit, Trash2, LucideSearch, LucidePlus, AlertTriangle } from 'lucide-react';
import Button from '../component/common/Button';
import Modal from '../component/common/Modal';
import AddAdminForm from '../component/Users/AddAdminForm';
import EditAdminForm from '../component/Users/EditAdminForm';
import { getAdminUsers, addAdminUser, updateAdminUser, deleteAdminUser } from '../apis/adminApi';
import LoaderComponent from '../component/common/Loader';
import usePageTitle from '../hooks/usePageTitle';

const AdminPage = () => {

  usePageTitle("Admin");

  const addFormRef = useRef(null);
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({ employeeCode: '', username: '', phoneNumber: '' });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id:"", employeeCode:"", username:"", phoneNumber:"" });

  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  /* ========================= FETCH ADMINS ========================= */
  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await getAdminUsers();
      if (response.status === "success") {
        setData(response.data.admins || []);
        setPagination(response.data.pagination || pagination);
      }
    } catch {
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);


  /** Emp code only — never show tenant clientCode (GI1001) */
  const isTenantClientCode = (code) => /^GI[A-Z0-9]{4}$/i.test(String(code || "").trim());

  const getAdminEmpCode = (row) => {
    const adminCode = String(row?.adminCode || "").trim();
    if (adminCode && !isTenantClientCode(adminCode)) return adminCode;

    const clientCode = String(row?.clientCode || "").trim();
    if (clientCode && !isTenantClientCode(clientCode)) return clientCode;

    return "-";
  };

  /* ========================= ADD ADMIN ========================= */
  const handleAddAdmin = async () => {
    if (addFormRef.current && !addFormRef.current.validate()) return;

    const emp = String(form.employeeCode || "").trim();
    if (!emp || !/^\d{1,4}$/.test(emp)) {
      return alert("Emp Code is required (1–4 digits)");
    }
    if (!form.username?.trim() || !form.phoneNumber?.trim()) {
      return alert("All fields required!");
    }

    await addAdminUser({
      adminCode: emp,
      username: form.username.trim(),
      phoneNumber: form.phoneNumber.trim(),
    });
    setIsAddModalOpen(false);
    setForm({ employeeCode: "", username: "", phoneNumber: "" });
    fetchAdmins();
  };


  /* ========================= UPDATE ADMIN ========================= */
  const handleUpdateAdmin = async () => {
    const { id, employeeCode, username, phoneNumber } = editForm;
    const emp = String(employeeCode || "").trim();
    if (!emp || !/^\d{1,4}$/.test(emp)) {
      return alert("Emp Code is required (1–4 digits)");
    }
    if (!username?.trim() || !phoneNumber?.trim()) {
      return alert("All fields required!");
    }
    await updateAdminUser(id, {
      adminCode: emp,
      username,
      phoneNumber,
    });
    setIsEditModalOpen(false);
    fetchAdmins();
  };


  /* ========================= DELETE ADMIN ========================= */
  const confirmDeleteItem = async () => {
    setIsDeletingItem(true);
    await deleteAdminUser(itemToDelete._id);
    setIsDeleteConfirmModalOpen(false);
    setItemToDelete(null);
    fetchAdmins();
    setIsDeletingItem(false);
  };


  /* ========================= SEARCH Filter ========================= */
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(a =>
      getAdminEmpCode(a).toLowerCase().includes(q) ||
      (a.username || "").toLowerCase().includes(q) ||
      (a.phoneNumber || "").toLowerCase().includes(q)
    );
  }, [data, searchQuery]);


  /* ========================= COLUMNS UI EXACT SAME LIKE CODE 1 ========================= */
  const columns = [
    { header: 'Emp Code', accessor: 'adminCode', cell: row => getAdminEmpCode(row) },
    { header: 'Name', accessor: 'username', cell: row => row?.username || '-' },
    {
      header: 'Actions',
      cell: row => (
        <ActionCell
          row={row}
          options={[
            {
              label: 'Edit',
              icon: <Edit size={16} />,
              className: "text-gray-700",
              action: () => {
                const rawPhone = row.phoneNumber ?? '';
                const digits = String(rawPhone).replace(/\D/g, '');
                const phoneNumber = digits.length > 10 ? digits.slice(-10) : digits;
                const emp = getAdminEmpCode(row);
                setEditForm({
                  id: row._id,
                  employeeCode: emp === '-' ? '' : emp,
                  username: row.username ?? '',
                  phoneNumber,
                });
                setIsEditModalOpen(true);
              }
            },
            {
              label: 'Delete',
              icon: <Trash2 size={16} />,
              className: "text-red-600",
              action: () => { setItemToDelete(row); setIsDeleteConfirmModalOpen(true); }
            }
          ]}
        />
      )
    },
  ];


  return (
    <>
      {isLoading && <LoaderComponent size={56} />}

      <div className="space-y-6">

        {/* ===== Header UI Same ===== */}
        <div className="flex items-center justify-between !mt-0">
          <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default">Admin</h1>
          <Button
            variant="primary"
            size="medium"
            icon={<LucidePlus size={20} />}
            label="Add Admin"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2"
          />
        </div>

        {/* ===== Search UI same ===== */}
        <div className="flex items-center justify-between gap-4">
          <div className="w-[40rem]">
            <InputElement
              type="text"
              placeholder="Search admin..."
              value={searchQuery}
              onChange={setSearchQuery}
              variant="size_44"
              className="w-full"
              extra_text_before={<LucideSearch size={20}/>}
            />
          </div>
        </div>

        {/* ===== Table UI exactly first code ===== */}
        <div className="w-full">
          <CommonTable
            columns={columns}
            data={filteredData}
            count={pagination.totalItems}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
            rowsPerPageOptions={[25, 50, 75, 100, 150]}
            emptyDataMessage={searchQuery ? 'No admins matching search.' : 'No admins found.'}
            tableClassName="min-w-full divide-y divide-gray-200"
          />
        </div>


        {/* Modal Add */}
        <Modal isOpen={isAddModalOpen} onClose={()=>setIsAddModalOpen(false)} title="Add Admin"
          footerContent={
            <div className="flex justify-end gap-2">
              <Button label="Cancel" variant="secondary" onClick={()=>setIsAddModalOpen(false)} />
              <Button label="Add Admin" variant="primary" onClick={handleAddAdmin}/>
            </div>
          }
        >
          <AddAdminForm ref={addFormRef} form={form} onChange={setForm}/>
        </Modal>


        {/* Modal Edit */}
        <Modal isOpen={isEditModalOpen} onClose={()=>setIsEditModalOpen(false)} title="Edit Admin"
          footerContent={
            <div className="flex justify-end gap-2">
              <Button label="Cancel" variant="secondary" onClick={()=>setIsEditModalOpen(false)} />
              <Button label="Update Admin" variant="primary" onClick={handleUpdateAdmin}/>
            </div>
          }
        >
          <EditAdminForm form={editForm} onChange={setEditForm}/>
        </Modal>


        {/* Delete Confirm Modal */}
        {isDeleteConfirmModalOpen && (
          <Modal isOpen size="sm" onClose={()=>setIsDeleteConfirmModalOpen(false)}>
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                <AlertTriangle size={28} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-600 mb-6">
                Delete <strong>{itemToDelete?.username}</strong> ?
              </p>
              <div className="flex gap-3 w-full justify-center">
                <Button label="Cancel" variant="secondary" onClick={()=>setIsDeleteConfirmModalOpen(false)}/>
                <Button label={isDeletingItem?"Deleting...":"Yes, Delete"} variant="primary" onClick={confirmDeleteItem}/>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </>
  );
};

export default AdminPage;
