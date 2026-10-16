import React, { useEffect, useState } from "react";
import Button from "../component/common/Button";
import InputElement from "../component/common/InputElement";
import LoaderComponent from "../component/common/Loader";
import Modal from "../component/common/Modal";
import SelectElement from "../component/common/Select";
import SuperAdminLayout from "../component/layout/SuperAdminLayout";
import AppUploadForm from "../component/AppUploadForm";
import OtpLogs from "../component/OtpLogs";
import {
  createTenant,
  createSuperAdminUser,
  createTenantAdmin,
  deleteSuperAdminUser,
  updateSuperAdminUserStatus,
  deleteTenant,
  deleteTenantAdmin,
  listTenants,
  listTenantAdmins,
  listTenantEmployees,
  listSuperAdminUsers,
  updateTenant,
  updateTenantAdmin,
} from "../apis/superAdminApi";
import usePageTitle from "../hooks/usePageTitle";

const emptyAdminForm = {
  phoneNumber: "",
  username: "",
  password: "",
  status: "active",
};

const cardClass =
  "bg-[#F9F6F1] rounded-2xl border border-[#E8DFD4] shadow-[0_8px_24px_-12px_rgba(75,68,58,0.18)]";
const tableWrapClass = `${cardClass} overflow-hidden`;
const thClass = "px-2 py-1.5 text-left font-semibold text-[11px] uppercase tracking-wider text-[#0B1C30]";
const tdClass = "px-2 py-1.5 text-left text-[13px] leading-tight text-[#4C463D] h-9";
const primaryBtnClass =
  "!bg-[#7D766C] hover:!bg-[#6A645C] !text-white !rounded-xl !shadow-[0_8px_16px_-8px_rgba(197,179,150,0.35)] focus:!ring-[#C5B396]";
const outlineBtnClass = primaryBtnClass;
const SuperAdminPage = () => {
  usePageTitle("Super Admin");
  const [activeTab, setActiveTab] = useState("clients");
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [platformUsers, setPlatformUsers] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [tenantAdmins, setTenantAdmins] = useState([]);
  const [tenantEmployees, setTenantEmployees] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyAdminForm);
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState(emptyAdminForm);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [newTenant, setNewTenant] = useState({
    clientCode: "",
    name: "",
    adminPhone: "",
    adminUsername: "admin",
  });
  const [newStaff, setNewStaff] = useState({
    phoneNumber: "",
    username: "",
    password: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [tenantRes, userRes] = await Promise.all([
        listTenants(),
        listSuperAdminUsers(),
      ]);
      setTenants(tenantRes?.data || []);
      setPlatformUsers(userRes?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTenant = async () => {
    try {
      await createTenant(newTenant);
      setNewTenant({
        clientCode: "",
        name: "",
        adminPhone: "",
        adminUsername: "admin",
      });
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleActive = async (tenant) => {
    try {
      await updateTenant(tenant._id, { isActive: !tenant.isActive });
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTenant = async (tenant) => {
    if (!window.confirm(`Delete client ${tenant.clientCode}?`)) return;
    try {
      await deleteTenant(tenant._id);
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateStaff = async () => {
    try {
      await createSuperAdminUser(newStaff);
      setNewStaff({ phoneNumber: "", username: "", password: "" });
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")?._id || null;
    } catch {
      return null;
    }
  })();

  const handleToggleStaffStatus = async (staff) => {
    const nextStatus = staff.status === "inactive" ? "active" : "inactive";
    if (
      nextStatus === "inactive" &&
      !window.confirm(`Deactivate super admin "${staff.username || staff.phoneNumber}"?`)
    )
      return;
    try {
      await updateSuperAdminUserStatus(staff._id, nextStatus);
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteStaff = async (userId) => {
    if (!window.confirm("Delete this super admin user?")) return;
    try {
      await deleteSuperAdminUser(userId);
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const tenantOptions = tenants.map((t) => ({
    value: t._id,
    label: `${t.clientCode} — ${t.name}`,
  }));

  const selectedTenantLabel =
    tenantOptions.find((o) => o.value === selectedTenantId)?.label || "";

  const loadTenantAdmins = async (tenantId) => {
    if (!tenantId) {
      setTenantAdmins([]);
      setTenantEmployees([]);
      return;
    }
    setAdminsLoading(true);
    const [adminsRes, employeesRes] = await Promise.allSettled([
      listTenantAdmins(tenantId),
      listTenantEmployees(tenantId),
    ]);
    setTenantAdmins(adminsRes.status === "fulfilled" ? adminsRes.value?.data || [] : []);
    setTenantEmployees(
      employeesRes.status === "fulfilled" ? employeesRes.value?.data || [] : []
    );
    setAdminsLoading(false);
  };

  const adminIds = new Set(tenantAdmins.map((admin) => String(admin._id)));
  const tenantUserRows = [
    ...tenantAdmins.map((admin) => ({ ...admin, rowType: "admin" })),
    ...tenantEmployees
      .filter((emp) => !adminIds.has(String(emp._id)))
      .map((emp) => {
        const fullName = [emp.firstName, emp.lastName].filter(Boolean).join(" ").trim();
        const name = emp.nickname || fullName || emp.employeeName || "-";
        return {
          _id: emp._id,
          username:
            emp.employeeName && emp.employeeName !== name
              ? `${name} (${emp.employeeName})`
              : name,
          phoneNumber: emp.mobileNumber,
          status: emp.status || "active",
          rowType: "employee",
        };
      }),
  ];

  const handleTenantSelect = (tenantId) => {
    setSelectedTenantId(tenantId || null);
    loadTenantAdmins(tenantId);
  };

  const openEditModal = (admin) => {
    setEditingAdminId(admin._id);
    setEditForm({
      phoneNumber: admin.phoneNumber || "",
      username: admin.username || "",
      password: "",
      status: admin.status || "active",
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingAdminId(null);
    setEditForm(emptyAdminForm);
  };

  const handleCreateAdmin = async () => {
    if (!selectedTenantId) return;
    if (!newAdmin.phoneNumber || newAdmin.phoneNumber.length < 10) return;
    setCreatingAdmin(true);
    try {
      await createTenantAdmin(selectedTenantId, newAdmin);
      setNewAdmin(emptyAdminForm);
      await loadTenantAdmins(selectedTenantId);
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleSaveAdmin = async () => {
    if (!selectedTenantId || !editingAdminId) return;
    setSavingAdmin(true);
    try {
      const payload = {
        phoneNumber: editForm.phoneNumber,
        username: editForm.username,
        status: editForm.status,
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }
      await updateTenantAdmin(selectedTenantId, editingAdminId, payload);
      closeEditModal();
      await loadTenantAdmins(selectedTenantId);
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (!selectedTenantId) return;
    const name = admin.username || admin.phoneNumber || "this admin";
    if (!window.confirm(`Delete admin "${name}"?`)) return;
    try {
      await deleteTenantAdmin(selectedTenantId, admin._id);
      await loadTenantAdmins(selectedTenantId);
      await loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  if (loading) {
    return (
      <SuperAdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <LoaderComponent size={56} />
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "clients" && (
        <div className="space-y-6">
          <div className={`${cardClass} p-5 space-y-4 max-w-xl`}>
            <h3 className="font-semibold text-lg text-[#0B1C30]">
              Create Client Code
            </h3>
            <InputElement
              name="Client Code"
              value={newTenant.clientCode}
              onChange={(v) =>
                setNewTenant((p) => ({ ...p, clientCode: v.toUpperCase() }))
              }
              placeholder="GI2122"
            />
            <InputElement
              name="Client Name"
              value={newTenant.name}
              onChange={(v) => setNewTenant((p) => ({ ...p, name: v }))}
              placeholder="Factory Name"
            />
            <InputElement
              name="Admin Phone (optional)"
              value={newTenant.adminPhone}
              onChange={(v) =>
                setNewTenant((p) => ({
                  ...p,
                  adminPhone: v.replace(/\D/g, "").slice(0, 10),
                }))
              }
            />
            <Button
              label="Create Client"
              onClick={handleCreateTenant}
              className={primaryBtnClass}
            />
          </div>

          <div className={tableWrapClass}>
            <table className="min-w-full text-sm">
              <thead className="bg-[#EFE7DC] border-b border-[#E8DFD4]">
                <tr className="text-left">
                  <th className={thClass}>Client Code</th>
                  <th className={thClass}>Name</th>
                  <th className={thClass}>Users</th>
                  <th className={thClass}>Employees</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr
                    key={t._id}
                    className="border-b border-[#E8DFD4] hover:bg-[#F3EEE7]"
                  >
                    <td className={`${tdClass} font-mono font-semibold text-[#0B1C30]`}>
                      {t.clientCode}
                    </td>
                    <td className={tdClass}>{t.name}</td>
                    <td className={tdClass}>{t.adminUserCount ?? 0}</td>
                    <td className={tdClass}>{t.employeeCount ?? 0}</td>
                    <td className={tdClass}>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          t.isActive
                            ? "bg-[#E8F0E6] text-[#3D5C3A]"
                            : "bg-[#F5E8E6] text-[#8B3A32]"
                        }`}
                      >
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="primary"
                          size="small"
                          label={t.isActive ? "Deactivate" : "Activate"}
                          onClick={() => handleToggleActive(t)}
                          className={outlineBtnClass}
                        />
                        {t.clientCode !== "GI1001" && (
                          <Button
                            variant="primary"
                            size="small"
                            label="Delete"
                            onClick={() => handleDeleteTenant(t)}
                            className={outlineBtnClass}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tenants.length === 0 && (
              <p className="p-6 text-center text-[#7D766C]">No clients yet</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "employees" && (
        <div className="space-y-6">
          <div className={`${cardClass} p-5 max-w-xl`}>
            <SelectElement
              name="Select Client Code"
              placeholder="Select client code..."
              options={tenantOptions}
              value={selectedTenantId}
              onChange={handleTenantSelect}
              isClearable
            />
          </div>

          {selectedTenantId && (
            <div className={`${cardClass} p-5 space-y-4 max-w-xl`}>
              <h3 className="font-semibold text-lg text-[#0B1C30]">
                Create Admin User
              </h3>
              <p className="text-xs text-[#7D766C]">
                Admin login mate client code ane phone OTP use thase
              </p>
              <InputElement
                name="Phone Number"
                value={newAdmin.phoneNumber}
                onChange={(v) =>
                  setNewAdmin((p) => ({
                    ...p,
                    phoneNumber: v.replace(/\D/g, "").slice(0, 10),
                  }))
                }
              />
              <InputElement
                name="Username"
                value={newAdmin.username}
                onChange={(v) => setNewAdmin((p) => ({ ...p, username: v }))}
                placeholder="admin"
              />
              <InputElement
                name="Password (optional)"
                type="password"
                value={newAdmin.password}
                onChange={(v) => setNewAdmin((p) => ({ ...p, password: v }))}
              />
              <Button
                label={creatingAdmin ? "Creating..." : "Create Admin"}
                onClick={handleCreateAdmin}
                disabled={creatingAdmin}
                className={primaryBtnClass}
              />
            </div>
          )}

          {adminsLoading ? (
            <LoaderComponent size={48} />
          ) : !selectedTenantId ? (
            <p
              className={`p-6 text-center text-[#7D766C] ${cardClass}`}
            >
              Select a client code to view admin and employee users
            </p>
          ) : (
            <div className={tableWrapClass}>
              <table className="min-w-full text-sm">
                <thead className="bg-[#EFE7DC] border-b border-[#E8DFD4]">
                  <tr className="text-left">
                    <th className={thClass}>Username</th>
                    <th className={thClass}>Role</th>
                    <th className={thClass}>Phone</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantUserRows.map((admin) => (
                    <tr
                      key={`${admin.rowType}-${admin._id}`}
                      className="border-b border-[#E8DFD4] hover:bg-[#F3EEE7]"
                    >
                      <td className={tdClass}>{admin.username || "-"}</td>
                      <td className={tdClass}>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            admin.rowType === "admin"
                              ? "bg-[#EFE7DC] text-[#7D766C]"
                              : "bg-[#F3EEE7] text-[#4C463D]"
                          }`}
                        >
                          {admin.rowType === "admin" ? "Admin" : "Employee"}
                        </span>
                      </td>
                      <td className={tdClass}>{admin.phoneNumber || "-"}</td>
                      <td className={tdClass}>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            admin.status === "active"
                              ? "bg-[#E8F0E6] text-[#3D5C3A]"
                              : "bg-[#F5E8E6] text-[#8B3A32]"
                          }`}
                        >
                          {admin.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className={tdClass}>
                        {admin.rowType === "admin" ? (
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="primary"
                              size="small"
                              label="Edit"
                              onClick={() => openEditModal(admin)}
                              className={outlineBtnClass}
                            />
                            <Button
                              variant="primary"
                              size="small"
                              label="Delete"
                              onClick={() => handleDeleteAdmin(admin)}
                              className={outlineBtnClass}
                            />
                          </div>
                        ) : (
                          <span className="text-[#7D766C]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tenantUserRows.length === 0 && (
                <p className="p-6 text-center text-[#7D766C]">
                  No users found for {selectedTenantLabel}
                </p>
              )}
            </div>
          )}

          <Modal
            isOpen={editModalOpen}
            onClose={closeEditModal}
            title="Edit Admin User"
            size="md"
            footerContent={
              <div className="flex justify-end gap-2">
                <Button
                  variant="primary"
                  label="Cancel"
                  onClick={closeEditModal}
                  className={outlineBtnClass}
                />
                <Button
                  label={savingAdmin ? "Saving..." : "Update"}
                  onClick={handleSaveAdmin}
                  disabled={savingAdmin}
                  className={primaryBtnClass}
                />
              </div>
            }
          >
            <div className="p-4 space-y-4">
              <InputElement
                name="Phone Number"
                value={editForm.phoneNumber}
                onChange={(v) =>
                  setEditForm((p) => ({
                    ...p,
                    phoneNumber: v.replace(/\D/g, "").slice(0, 10),
                  }))
                }
              />
              <InputElement
                name="Username"
                value={editForm.username}
                onChange={(v) => setEditForm((p) => ({ ...p, username: v }))}
              />
              <InputElement
                name="New Password (optional)"
                type="password"
                value={editForm.password}
                onChange={(v) => setEditForm((p) => ({ ...p, password: v }))}
              />
              <SelectElement
                name="Status"
                options={statusOptions}
                value={editForm.status}
                onChange={(status) =>
                  setEditForm((p) => ({ ...p, status: status || "active" }))
                }
                isClearable={false}
              />
            </div>
          </Modal>
        </div>
      )}

      {activeTab === "app" && <AppUploadForm />}
      {activeTab === "otp" && <OtpLogs />}

      {activeTab === "users" && (
        <div className="space-y-6">
          <div className={`${cardClass} p-5 space-y-4 max-w-xl`}>
            <h3 className="font-semibold text-lg text-[#0B1C30]">
              Add Super Admin User
            </h3>
            <p className="text-xs text-[#7D766C]">
              Login with client code GI0000
            </p>
            <InputElement
              name="Phone"
              value={newStaff.phoneNumber}
              onChange={(v) =>
                setNewStaff((p) => ({
                  ...p,
                  phoneNumber: v.replace(/\D/g, "").slice(0, 10),
                }))
              }
            />
            <InputElement
              name="Username"
              value={newStaff.username}
              onChange={(v) => setNewStaff((p) => ({ ...p, username: v }))}
            />
            <InputElement
              name="Password"
              type="password"
              value={newStaff.password}
              onChange={(v) => setNewStaff((p) => ({ ...p, password: v }))}
            />
            <Button
              label="Save User"
              onClick={handleCreateStaff}
              className={primaryBtnClass}
            />
          </div>

          <div className={tableWrapClass}>
            <table className="min-w-full text-sm">
              <thead className="bg-[#EFE7DC] border-b border-[#E8DFD4]">
                <tr className="text-left">
                  <th className={thClass}>Username</th>
                  <th className={thClass}>Phone</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {platformUsers.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b border-[#E8DFD4] hover:bg-[#F3EEE7]"
                  >
                    <td className={tdClass}>{u.username || "-"}</td>
                    <td className={tdClass}>{u.phoneNumber}</td>
                    <td className={tdClass}>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          u.status === "inactive"
                            ? "bg-[#F5E8E6] text-[#8B3A32]"
                            : "bg-[#E8F0E6] text-[#3D5C3A]"
                        }`}
                      >
                        {u.status === "inactive" ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td className={tdClass}>
                      {String(u._id) === String(currentUserId) ? (
                        <span className="text-xs text-[#7D766C]">You</span>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="primary"
                            size="small"
                            label={u.status === "inactive" ? "Activate" : "Deactivate"}
                            onClick={() => handleToggleStaffStatus(u)}
                            className={outlineBtnClass}
                          />
                          <Button
                            variant="primary"
                            size="small"
                            label="Delete"
                            onClick={() => handleDeleteStaff(u._id)}
                            className={outlineBtnClass}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
};

export default SuperAdminPage;
