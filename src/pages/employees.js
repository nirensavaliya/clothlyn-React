import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  LucideSearch,
  LucideChevronDown,
  LucideChevronUp,
  LucidePlus,
  AlertTriangle,
  Eye,
  LucideLoader,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputElement from "../component/common/InputElement";
import CommonTable from "../component/common/Table/Table";
import Button from "../component/common/Button";
import AddEmployeeForm from "../component/Employees/AddEmployeeForm";
import Modal from "../component/common/Modal";
import SelectElement from "../component/common/Select";
import { formatDate, formatRegularText, lowercase, getCanonicalScanStatus } from "../helpers/utils";
import Status from "../component/common/Status";
import ActionCell from "../component/common/Table/ActionCell";
import { Edit, Trash2 } from 'lucide-react';
import { deleteEmployee, getEmployees, updateEmployee } from "../apis/employeeApi";
import EditEmployeeForm from "../component/Employees/EditEmployeeForm";
import ViewEmployeeModal from "../component/Employees/ViewEmployeeModal";
import { getProcesses } from "../apis/processApi";
import LoaderComponent from "../component/common/Loader";
import ToggleSwitch from '../component/common/ToggleSwitch';
import { useMachines } from "../contexts/MachineContext";
import usePageTitle from "../hooks/usePageTitle";

const Employees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLimit, setCurrentLimit] = useState(25);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [loading, setLoading] = useState(false);
  const [allEmployees, setAllEmployees] = useState({
    employees: [],
    pagination: { total: 0, page: 1, pages: 1, limit: currentLimit },
  });
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isDeleteEmployeeConfirmModalOpen, setIsDeleteEmployeeConfirmModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [isViewEmployeeModalOpen, setIsViewEmployeeModalOpen] = useState(false);
  const [employeeToView, setEmployeeToView] = useState(null);
  const [processSubMenuItems, setProcessSubMenuItems] = useState([]);
  const [isLoadingProcessSubItems, setIsLoadingProcessSubItems] =
    useState(false);
  const [processSubItemsError, setProcessSubItemsError] = useState(null);
  const [statusTab, setStatusTab] = useState('active');
  const [selectedProcessFilter, setSelectedProcessFilter] = useState('');
  
  const processFilterOptions = useMemo(
    () =>
      processSubMenuItems.map((item) => ({
        value: item.label,
        label: item.label,
      })),
    [processSubMenuItems]
  );
  const { machines, fetchMachines } = useMachines();

  usePageTitle('Employee');

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);
  const fetchProcessSubItems = async () => {
    setIsLoadingProcessSubItems(true);
    setProcessSubItemsError(null);
    try {
      const subItems = await getProcesses();
      const uniqueItems = subItems?.data?.reduce((acc, item) => {
        if (!acc.some(existingItem => existingItem.processName === item.processName)) {
          acc.push(item);
        }
        return acc;
      }, []) || [];
      
      const options = uniqueItems.map((item) => ({
        value: item._id,
        label: item.processName,
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


  const fetchEmployeesData = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: currentLimit,
        search: debouncedSearchQuery,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
        status: statusTab === 'active' ? 'active' : 'inactive',
      };
      if (selectedProcessFilter) {
        params.processName = getCanonicalScanStatus(selectedProcessFilter) || String(selectedProcessFilter).toLowerCase();
      }
      const response = await getEmployees(params);
      setAllEmployees({
        employees: response.data || [],
        pagination: response.pagination || { total: 0, page: 1, pages: 1, limit: currentLimit },
      });
    } catch (error) {
      setAllEmployees({ employees: [], pagination: { total: 0, page: 1, pages: 1, limit: currentLimit } });
      toast.error("Failed to fetch employees.", { toastId: 'employee-fetch-error' });
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
    fetchEmployeesData();
  }, [currentPage, currentLimit, debouncedSearchQuery, sortConfig, statusTab, selectedProcessFilter]);

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
            className={`${isSorted && sortConfig.direction === "asc"
              ? "text-light-primary"
              : "text-light-lightGrey"
              }`}
          />
          <LucideChevronDown
            size={14}
            className={`${isSorted && sortConfig.direction === "desc"
              ? "text-light-primary"
              : "text-light-lightGrey"
              }`}
          />
        </div>
      </div>
    );
  };

  const handleStatusToggle = async (employee) => {
    try {
      setLoading(true);
      const isActive = employee.status === 'active';
      const updatedStatus = isActive ? 'inactive' : 'active';
      await updateEmployee(employee._id, { ...employee, status: updatedStatus });
      setAllEmployees((prev) => ({
        ...prev,
        employees: prev.employees.map((emp) =>
          emp._id === employee._id ? { ...emp, status: updatedStatus } : emp
        ),
      }));
    } catch (error) {
      toast.error('Failed to update status', { toastId: 'employee-status-update-error' });
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: <SortableTableHeader label="Date" sortKey="createdAt" />,
        accessor: 'createdAt',
        cell: (row) => row?.createdAt ? formatDate(row.createdAt) : "-",
        isDate: true
      },
      {
        header: <SortableTableHeader label="Emp Code" sortKey="employeeName" />,
        accessor: "employeeName",
        cell: (row) => row?.employeeName ? formatRegularText(row?.employeeName) : "-"
      },
      {
        header: <SortableTableHeader label="Nick Name" sortKey="nickname" />,
        accessor: "nickname",
        cell: (row) => row?.nickname || "-"
      },
      {
        header: (
          <SortableTableHeader label="Machine Name" sortKey="machine" />
        ),
         cell: (row) => {
          if (row.machine && row.machine.length > 0) {
            return (
              <div className="flex flex-wrap gap-1">
                {row.machine.map((machineData, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-light-primary/10 text-light-primary"
                  >
                    {machineData.machineName || "-"}
                  </span>
                ))}
              </div>
            );
          }
          return "-";
        },
      },
      {
        header: (
          <SortableTableHeader label="Process Name" sortKey="processName" />
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
        header: 'Status',
        accessor: 'status',
        cell: (row) => {
          const isActive = row.status === 'active';
          return (
            <div className="flex items-center gap-2">
              <ToggleSwitch
                enabled={isActive}
                onChange={() => handleStatusToggle(row)}
              />
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "actions",
        cell: (row) => {
          const employeeOptions = [
            {
              label: "View",
              icon: <Eye size={16} />,
              action: () => handleViewEmployee(row),
              className: "text-blue-600",
            },
            {
              label: "Edit",
              icon: <Edit size={16} />,
              action: () => handleEditEmployee(row),
              className: "text-gray-700",
            },
            {
              label: "Delete",
              icon: <Trash2 size={16} />,
              action: () => handleDeleteEmployee(row),
              className: "text-red-600",
            },
          ];
          return <ActionCell row={row} options={employeeOptions} />;
        },
      },
    ],
    [sortConfig]
  );



  const handleViewEmployee = (employee) => {
    setEmployeeToView(employee);
    setIsViewEmployeeModalOpen(true);
  };

  const handleCloseViewEmployeeModal = () => {
    setIsViewEmployeeModalOpen(false);
    setEmployeeToView(null);
  };

  const handleEditEmployee = (employee) => {
    setEmployeeToEdit(employee);
    setIsEditEmployeeModalOpen(true);
  };

  const handleCloseEditEmployeeModal = () => {
    setIsEditEmployeeModalOpen(false);
    setEmployeeToEdit(null);
  };

  const handleUpdateEmployee = async (employeeId, formData) => {
    try {
      setLoading(true);
      await updateEmployee(employeeId, formData);
      await fetchEmployeesData();
      handleCloseEditEmployeeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update employee', { toastId: 'employee-update-error' });
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteEmployee = (employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteEmployeeConfirmModalOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    setIsDeletingEmployee(true);
    try {
      await deleteEmployee(employeeToDelete._id);
      fetchEmployeesData();
      toast.success(`Employee ${employeeToDelete.firstName || employeeToDelete.fullName} deleted successfully.`, { toastId: 'employee-delete-success' });
    } catch (error) {
    } finally {
      setIsDeletingEmployee(false);
      setIsDeleteEmployeeConfirmModalOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleCloseDeleteEmployeeConfirmModal = () => {
    setIsDeleteEmployeeConfirmModalOpen(false);
    setEmployeeToDelete(null);
  };

  const handleOpenAddEmployeeModal = () => {
    setIsAddEmployeeModalOpen(true);
  };

  const handleCloseAddEmployeeModal = () => {
    setIsAddEmployeeModalOpen(false);
  };

  const handleAddEmployeeSuccess = () => {
    fetchEmployeesData();
    handleCloseAddEmployeeModal();
  };

  return (
    <>
          {(loading || isDeletingEmployee ) && <LoaderComponent size={56}/>}

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
          Employees
        </h1>

        <Button
          variant="primary"
          size="medium"
          icon={<LucidePlus size={20} />}
          label="Add Employee"
          onClick={handleOpenAddEmployeeModal}
          className="flex items-center space-x-2 shadow-none font-normal !rounded-md  px-4 py-2 text-light-white  transition-colors duration-200 focus:ring-0 max-sm:w-full max-sm:justify-center"
        />
      </div>

      <div className="flex items-center justify-between gap-4 max-sm:flex-col">
        <div className="flex flex-1 items-center gap-4 max-sm:flex-col max-sm:w-full">
          <div className="flex-grow min-w-[200px] max-sm:w-full">
            <InputElement
              type="text"
              placeholder="Search employees..."
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
          <div className="min-w-[180px] max-sm:w-full">
            <SelectElement
              options={processFilterOptions}
              value={selectedProcessFilter || null}
              onChange={(val) => {
                setSelectedProcessFilter(val ?? "");
                setCurrentPage(1);
              }}
              placeholder="Select Process"
              isClearable={true}
              className="w-full"
              menuPortalTarget={document.body}
            />
          </div>
          <div className="relative flex items-center bg-light-gray_100 rounded-lg overflow-hidden h-11 min-w-[180px] max-sm:w-full">
            <span
              className={`
                absolute left-0 top-0 h-full w-1/2 rounded-lg bg-light-primary
                transition-transform duration-200 z-0 pointer-events-none
                ${statusTab === 'active' ? 'translate-x-0' : 'translate-x-full'}
              `}
            ></span>
            <button
              className={`
                flex-1 h-full px-6 py-2 font-semibold transition-all duration-200 z-10 relative
                ${statusTab === 'active' ? 'text-[#FFFFFF]' : 'text-light-primary'}
              `}
              onClick={() => { setStatusTab('active'); setCurrentPage(1); }}
            >
              Active
            </button>
            <button
              className={`
                flex-1 h-full px-6 py-2 font-semibold transition-all duration-200 z-10 relative
                ${statusTab === 'deactive' ? 'text-[#FFFFFF]' : 'text-light-primary'}
              `}
              onClick={() => { setStatusTab('deactive'); setCurrentPage(1); }}
            >
              Deactive
            </button>
          </div>
        </div>
      </div>

      <div className="w-full">
        <CommonTable
          columns={columns}
          data={allEmployees?.employees || []}
          count={allEmployees?.pagination?.total || 0}
          page={(allEmployees?.pagination?.page || 1) - 1}
          rowsPerPage={allEmployees?.pagination?.limit || currentLimit}
          onPageChange={handlePageChangeForTable}
          onRowsPerPageChange={handleRowsPerPageChangeForTable}
          rowsPerPageOptions={[25, 50, 75, 100, 150]}
          emptyDataMessage={
            searchQuery || selectedProcessFilter
              ? "No employees found matching your filters."
              : "No employees available."
          }
          tableClassName="min-w-full divide-y divide-gray-200"
        />
      </div>

      <Modal
        isOpen={isAddEmployeeModalOpen}
        onClose={handleCloseAddEmployeeModal}
        title="Add New Employee"
        size="2xl"
      >
        <AddEmployeeForm
          onSubmitSuccess={handleAddEmployeeSuccess}
          onCancel={handleCloseAddEmployeeModal}
          processSubMenuItems={processSubMenuItems}
          setProcessSubMenuItems={setProcessSubMenuItems}
          isLoading={loading}
          setIsLoading={setLoading}
          machines={machines}
          allEmployees={allEmployees.employees}
        />
      </Modal>

      <Modal
        isOpen={isEditEmployeeModalOpen}
        onClose={handleCloseEditEmployeeModal}
        title="Update Employee"
        size="xl"
      >
        <EditEmployeeForm
          onSubmit={handleUpdateEmployee}
          onCancel={handleCloseEditEmployeeModal}
          employeeData={employeeToEdit}
          processSubMenuItems={processSubMenuItems}
          setProcessSubMenuItems={setProcessSubMenuItems}
          isLoading={loading}
          setIsLoading={setLoading}
          machines={machines}
          allEmployees={allEmployees.employees}
        />
      </Modal>


      <ViewEmployeeModal
        isOpen={isViewEmployeeModalOpen}
        onClose={handleCloseViewEmployeeModal}
        employeeData={employeeToView}
      />

      {isDeleteEmployeeConfirmModalOpen && employeeToDelete && (
        <Modal
          isOpen={isDeleteEmployeeConfirmModalOpen}
          onClose={handleCloseDeleteEmployeeConfirmModal}
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
              Are you sure you want to delete employee: <br /><strong>{employeeToDelete.username || employeeToDelete.fullName}</strong>? <br />This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3 w-full">
              <Button
                variant="outline"
                size="medium"
                label="Cancel"
                onClick={handleCloseDeleteEmployeeConfirmModal}
                disabled={isDeletingEmployee}
                className="flex-1 focus:!ring-0 border-gray-300 hover:bg-gray-50"
              />
              <Button
                variant="primary"
                size="medium"
                label={ "Yes, Delete"}
                onClick={confirmDeleteEmployee}
                loading={isDeletingEmployee}
                disabled={isDeletingEmployee}
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

export default Employees;