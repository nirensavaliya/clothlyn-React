import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  LucideSearch,
  LucideChevronDown,
  LucideChevronUp,
  LucidePlus,
  AlertTriangle,
  LucideLoader,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getUsers, deleteUser, updateUser } from "../apis/userApi";
import InputElement from "../component/common/InputElement";
import CommonTable from "../component/common/Table/Table";
import Button from "../component/common/Button";
import AddUserForm from "../component/Users/AddUserForm";
import EditUserForm from "../component/Users/EditUserForm";
import Modal from "../component/common/Modal";
import { formatRegularText, lowercase } from "../helpers/utils";
import Status from "../component/common/Status";
import ActionCell from "../component/common/Table/ActionCell";
import { Edit, Trash2 } from "lucide-react";
import ToggleSwitch from "../component/common/ToggleSwitch";
import { getProcesses } from "../apis/processApi";
import LoaderComponent from "../component/common/Loader";
import usePageTitle from "../hooks/usePageTitle";

const Users = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState({
    users: [],
    pagination: { total: 0, page: 1, pages: 1, limit: currentLimit },
  });
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isDeleteUserConfirmModalOpen, setIsDeleteUserConfirmModalOpen] =
    useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [processSubMenuItems, setProcessSubMenuItems] = useState([]);
  const [isLoadingProcessSubItems, setIsLoadingProcessSubItems] =
    useState(false);
  const [processSubItemsError, setProcessSubItemsError] = useState(null);

  usePageTitle('Users');

  const fetchProcessSubItems = async () => {
    setIsLoadingProcessSubItems(true);
    setProcessSubItemsError(null);
    try {
      const subItems = await getProcesses();
      const uniqueItems =
        subItems?.data?.reduce((acc, item) => {
          if (
            !acc.some(
              (existingItem) => existingItem?.processName === item?.processName
            )
          ) {
            acc.push(item);
          }
          return acc;
        }, []) || [];
      const options = uniqueItems.map((item) => ({
        value: item._id,
        label: item?.processName,
      }));

      setProcessSubMenuItems(options);
    } catch (error) {
      setProcessSubItemsError(error.message || "Failed to load process");
      toast.error("Could not load Process sub-items.", { toastId: 'process-sub-items-error' });
    } finally {
      setIsLoadingProcessSubItems(false);
    }
  };

  useEffect(() => {
    fetchProcessSubItems();
  }, []);
  const fetchUsersData = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: currentLimit,
        search: debouncedSearchQuery,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      };
      const response = await getUsers(params);
      
      setAllUsers({
        users: response.data?.users || [],
        pagination: response?.data?.pagination || {
          total: 0,
          page: 1,
          pages: 1,
          limit: currentLimit,
        },
      });
    } catch (error) {
      setAllUsers({
        users: [],
        pagination: { total: 0, page: 1, pages: 1, limit: currentLimit },
      });
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
    fetchUsersData();
  }, [currentPage, currentLimit, debouncedSearchQuery, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
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
      <div
        className="flex items-center space-x-2 cursor-pointer w-max"
        onClick={() => handleSort(sortKey)}
      >
        <span>{label}</span>
        <div className="flex flex-col">
          <LucideChevronUp
            size={14}
            className={`${
              isSorted && sortConfig.direction === "asc"
                ? "text-light-primary"
                : "text-light-lightGrey"
            }`}
          />
          <LucideChevronDown
            size={14}
            className={`${
              isSorted && sortConfig.direction === "desc"
                ? "text-light-primary"
                : "text-light-lightGrey"
            }`}
          />
        </div>
      </div>
    );
  };

  const handleStatusChange = async (user) => {
    const newStatus =
      lowercase(user.status) === "active" ? "inactive" : "active";
    try {
      await updateUser(user._id, { status: newStatus });
      fetchUsersData();
    } catch (error) {
      toast.error("Failed to update user status.", { toastId: 'user-status-update-error' });
    }
  };

  const columns = useMemo(
    () => [
      {
        header: <SortableTableHeader label="Name" sortKey="username" />,
        accessor: "username",
        cell: (row) => (row?.username ? formatRegularText(row.username) : "-"),
      },
      {
        header: (
          <SortableTableHeader label="Emp Code" sortKey="adminCode" />
        ),
        accessor: "adminCode",
        cell: (row) => {
          if (row?.adminCode) return row.adminCode;
          const code = row?.clientCode || "";
          if (/^GI[A-Z0-9]{4}$/i.test(code)) return "-";
          return code || "-";
        },
      },
      {
        header: <SortableTableHeader label="Phone" sortKey="phoneNumber" />,
        accessor: "phoneNumber",
        cell: (row) => row?.phoneNumber || "-",
      },
      {
        header: (
          <SortableTableHeader label="Role" sortKey="processName" />
        ),
        cell: (row) => {
          if (row.role && row.role.length > 0) {
            return (
              <div className="flex flex-wrap gap-1">
                {row.role.map((process, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-light-primary/10 text-light-primary"
                  >
                    {process.processName || "-"}
                  </span>
                ))}
              </div>
            );
          }
          return "-";
        },
      },
      {
        header: <SortableTableHeader label="Status" sortKey="status" />,
        cell: (row) => (
          <ToggleSwitch
            enabled={lowercase(row.status) === "active"}
            onChange={() => handleStatusChange(row)}
          />
        ),
      },
      {
        header: "Actions",
        id: "actions",
        cell: (row) => {
          const userOptions = [
            {
              label: "Edit",
              icon: <Edit size={16} />,
              action: () => handleEditUser(row),
              className: "text-gray-700",
            },
            {
              label: "Delete",
              icon: <Trash2 size={16} />,
              action: () => handleDeleteUser(row),
              className: "text-red-600",
            },
          ];
          return <ActionCell row={row} options={userOptions} />;
        },
      },
    ],
    [sortConfig]
  );

  const handleEditUser = (user) => {
    setUserToEdit(user);
    setIsEditUserModalOpen(true);
  };

  const handleCloseEditUserModal = () => {
    setIsEditUserModalOpen(false);
    setUserToEdit(null);
  };

  const handleUpdateUser = async (userId, formData) => {
    try {
      setLoading(true);
      await updateUser(userId, formData);
      await fetchUsersData();
      handleCloseEditUserModal();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update user",
        { toastId: "user-update-error" }

      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setIsDeleteUserConfirmModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await deleteUser(userToDelete._id);
      fetchUsersData();
      toast.success(
        `User ${
          userToDelete.username || userToDelete.fullName
        } deleted successfully.`,
        { toastId: "user-delete-success" }
      );
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setIsDeletingUser(false);
      setIsDeleteUserConfirmModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleCloseDeleteUserConfirmModal = () => {
    setIsDeleteUserConfirmModalOpen(false);
    setUserToDelete(null);
  };

  const handleOpenAddUserModal = () => {
    setIsAddUserModalOpen(true);
  };

  const handleCloseAddUserModal = () => {
    setIsAddUserModalOpen(false);
  };

  const handleAddUser = async (formData) => {
    try {
      setLoading(true);
      fetchUsersData();
      handleCloseAddUserModal();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {(loading || isDeletingUser) && <LoaderComponent size={56}/>}
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

      <div className="flex items-center justify-between !mt-0">
        <h1 className="text-2xl font-bold text-light-darkGrey font-roboto cursor-default">
          Users
        </h1>

        <Button
          variant="primary"
          size="medium"
          icon={<LucidePlus size={20} />}
          label="Add User"
          onClick={handleOpenAddUserModal}
          className="flex items-center space-x-2 shadow-none font-normal !rounded-md  px-4 py-2 text-light-white  transition-colors duration-200 focus:ring-0"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="w-[40rem]">
          <div>
            <InputElement
              type="text"
              placeholder="Search users..."
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
      </div>

      <div className="w-full">
        <CommonTable
          columns={columns}
          data={allUsers?.users || []}
          count={allUsers?.pagination?.totalItems || 0}
          page={(allUsers?.pagination?.currentPage || 1) - 1}
          rowsPerPage={allUsers?.pagination?.itemsPerPage || currentLimit}
          onPageChange={handlePageChangeForTable}
          onRowsPerPageChange={handleRowsPerPageChangeForTable}
          rowsPerPageOptions={[25, 50, 75, 100, 150]}
          emptyDataMessage={
            searchQuery
              ? "No users found matching your search."
              : "No users available."
          }
          tableClassName="min-w-full divide-y divide-gray-200"
        />
      </div>

      <Modal
        isOpen={isAddUserModalOpen}
        onClose={handleCloseAddUserModal}
        title="Add New User"
        size="xl"
      >
        <AddUserForm
          onSubmit={handleAddUser}
          onCancel={handleCloseAddUserModal}
          processSubMenuItems={processSubMenuItems}
            isLoading={loading}
            setIsLoading={setLoading}

        />
      </Modal>

      <Modal
        isOpen={isEditUserModalOpen}
        onClose={handleCloseEditUserModal}
        title="Update User"
        size="xl"
      >
        <EditUserForm
          onSubmit={handleUpdateUser}
          onCancel={handleCloseEditUserModal}
          userData={userToEdit}
          processSubMenuItems={processSubMenuItems}
          isLoading={loading}
        />
      </Modal>

      {isDeleteUserConfirmModalOpen && userToDelete && (
        <Modal
          isOpen={isDeleteUserConfirmModalOpen}
          onClose={handleCloseDeleteUserConfirmModal}
          title=""
          size="sm"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete user: <br />
              <strong>
                {userToDelete.username || userToDelete.fullName}
              </strong>? <br />
              This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3 w-full">
              <Button
                variant="outline"
                size="medium"
                label="Cancel"
                onClick={handleCloseDeleteUserConfirmModal}
                disabled={isDeletingUser}
                className="flex-1 focus:!ring-0 border-gray-300 hover:bg-gray-50"
              />
              <Button
                variant="primary"
                size="medium"
                label={ "Yes, Delete"}
                onClick={confirmDeleteUser}
                loading={isDeletingUser}
                disabled={isDeletingUser}
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

export default Users;
