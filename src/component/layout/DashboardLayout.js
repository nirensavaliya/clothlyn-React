import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import classNames from "classnames";
import {
  LucideUser,
  LucideLogOut,
  LucideMenu,
  LucideX,
  LucideAlignLeft,
  LucideClipboardList,
  LucideSettings,
  LucideBarChart2,
  ListChecks,
  LucideChevronDown,
  LucideChevronUp,
  LucideAlertCircle,
  LucideScissors,
  LucidePackage,
  LucideLayers,
  LucideHammer,
  LucideUsers,
  LucideUserCheck,
  Monitor,
  LucideDollarSign,
  LucideFileText,
  Building2,
  LucideScan,
  LucideDownload,
} from "lucide-react";
import Button from "../common/Button";
import Modal from "../common/Modal";
import PageTransition from "../common/PageTransition";
import AddProcessModal from "../common/AddProcessModal";
import HeaderVectors from "./HeaderVectors";
import fabricLines from "../../assets/login/fabric-lines.png";
import pageBgFull from "../../assets/login/page-bg-full.png";
import { toast } from "react-toastify";
import { logoutApi } from "../../apis/loginApi";
import {
  addProcess,
  getProcesses,
  getProcessSubItemsApi,
} from "../../apis/processApi";
import useWindowSize from "../../hooks/useWindowSize";
import InputElement from "../common/InputElement";
import SelectElement from "../common/Select";
import { addMachine } from '../../apis/machineApi';
import { addUpad, getSalarySummaryMaster } from '../../apis/upadApi';
import LoaderComponent from "../common/Loader";
import AddUpadModal from "../Upad/AddUpadModal";
import { useMachines } from '../../contexts/MachineContext';
import { mapEmployeeToSelectOption } from '../../helpers/utils';
import { getAppRelease } from '../../apis/superAdminApi';


const initialData = [
  {
    id: 1,
    employeeCode: 'EMP001',
    name: 'John Doe',
    mobile: '9876543210',
    machineName: 'Machine A',
  },
  {
    id: 2,
    employeeCode: 'EMP002',
    name: 'Jane Smith',
    mobile: '9123456780',
    machineName: 'Machine B',
  },
];

const SIDEBAR_DRAWER_STATE_KEY = "sidebar_drawer_open";
const SIDEBAR_OPEN_DROPDOWN_KEY = "sidebar_open_dropdown";

const DashboardLayout = ({ children, onAddMachineClick }) => {
  const [tenantDisplayName, setTenantDisplayName] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return "Dashboard";
      const user = JSON.parse(raw);
      return user?.company || "Dashboard";
    } catch {
      return "Dashboard";
    }
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_DRAWER_STATE_KEY);
      return saved === null ? true : saved === "true";
    } catch {
      return true;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_OPEN_DROPDOWN_KEY) || null;
    } catch {
      return null;
    }
  });
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [processSubMenuItems, setProcessSubMenuItems] = useState([]);
  const [isLoadingProcessSubItems, setIsLoadingProcessSubItems] =
    useState(false);
  const [processSubItemsError, setProcessSubItemsError] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isAddProcessModalOpen, setIsAddProcessModalOpen] = useState(false);
  const [isAddMachineModalOpen, setIsAddMachineModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountRole, setAccountRole] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"))?.employeeRole || null;
    } catch {
      return null;
    }
  });
  const [data, setData] = useState(initialData);
  const [newMachineName, setNewMachineName] = useState('');
  const [addMachineError, setAddMachineError] = useState(null);
  const [isUpadModalOpen, setIsUpadModalOpen] = useState(false);
  const [isUpadLoading, setIsUpadLoading] = useState(false);
  const [upadData, setUpadData] = useState({
    employeeId: '',
    upadAmount: '',
    date: '',
    description: '',
  });
  const [upadError, setUpadError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [appRelease, setAppRelease] = useState(null);

  const { refreshMachines } = useMachines();


  const navigate = useNavigate();
  const location = useLocation();
  const { isDesktop } = useWindowSize();

  const processBtnRef = React.useRef(null);
    const user = JSON.parse(localStorage.getItem('user'));
    const {accountRole:accountRoleType , data:userData} = user || {}


  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const role = user?.employeeRole || null;
      setAccountRole(role);
    } catch (e) {
      setAccountRole(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    getAppRelease()
      .then((body) => {
        if (cancelled || body?.status !== "success") return;
        const versionCode = String(body.data?.versionCode || "").trim();
        const apkUrl = String(body.data?.apkUrl || "").trim();
        if (!versionCode || !apkUrl) return;
        setAppRelease({ versionCode, apkUrl });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_DRAWER_STATE_KEY, String(isDrawerOpen));
    } catch {
      // ignore storage errors
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    try {
      if (openDropdown) {
        localStorage.setItem(SIDEBAR_OPEN_DROPDOWN_KEY, openDropdown);
      } else {
        localStorage.removeItem(SIDEBAR_OPEN_DROPDOWN_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, [openDropdown]);
  

  const fetchProcessSubItems = async () => {
    setIsLoadingProcessSubItems(true);
    setProcessSubItemsError(null);
    try {
      const subItems = await getProcesses();
      setProcessSubMenuItems(subItems?.data || []);
    } catch (error) {
      setProcessSubItemsError(error.message || "Failed to load process");
      toast.error("Could not load Process sub-items.", { toastId: 'process-sub-items-error' });
    } finally {
      setIsLoadingProcessSubItems(false);
    }
  };

  // Processes are only refetched after adding a process (handleAddProcess).
  // Avoid calling getProcesses on every layout mount — sidebar "Process" sub-menu is static (/process).

  const getProcessSubItemIcon = (label) => {
    const lower = label?.toLowerCase();
    if (lower?.includes("therd")) return <LucideClipboardList size={16} />;
    if (lower?.includes("master")) return <LucideClipboardList size={16} />;
    if (lower?.includes("dora") || lower?.includes("cut"))
      return <LucideScissors size={16} />;
    if (lower?.includes("logo")) return <LucideClipboardList size={16} />;
    if (lower?.includes("prass")) return <LucideHammer size={16} />;
    if (lower?.includes("pack")) return <LucidePackage size={16} />;
    if (lower === "users") return <LucideUsers size={16} />;
    if (lower === "employee") return <LucideUserCheck size={16} />;
    return <LucideClipboardList size={16} />;
  };
  
  // Conditionally set menuItems based on accountRole
  const menuItems = React.useMemo(() => {
    if (accountRole === 'user' || accountRole === 'employee') {
      const baseMenuItems = [
        {
          icon: <LucideUser size={20} />,
          label: 'User Profile',
          path: '/user/profile',
        },
        {
          icon: <LucideBarChart2 size={20} />,
          label: 'Salary Report',
          path: '/user/salary-report',
        },
        {
          icon: <LucideBarChart2 size={20} />,
          label: 'Salary Paid',
          path: '/user/salary-paid',
        },
        {
          icon: <LucideScan size={20} />,
          label: 'Scan',
          path: '/user-scan',
        },
      ];

      return baseMenuItems;
    }else{
      return [
        {
          icon: <LucideLayers size={20} />,
          label: 'Product',
          path: '/lots',
        },
        {
          icon: <LucidePackage size={20} />,
          label: 'Non Moving Item',
          path: '/non-moving-item',
        },
        // Temporarily hidden — use Salary Report New
        // {
        //   icon: <LucideBarChart2 size={20} />,
        //   label: 'Salary Report',
        //   path: '/salary-report',
        // },
        {
          icon: <LucideBarChart2 size={20} />,
          label: 'Salary Report New',
          path: '/salary-report-new',
        },
        {
          icon: <LucideFileText size={20} />,
          label: 'Product Report',
          path: '/product-report',
        },
        {
          icon: <Building2 size={20} />,
          label: 'Companies',
          path: '/companies',
        },
        {
          icon: <LucideFileText size={20} />,
          label: 'Company Reports',
          path: '/company-reports',
        },
        {
          icon: <LucideDollarSign size={20} />,
          label: 'Salary Paid',
          path: '/salary-paid',
        },
        // Temporarily hidden — use Salary Master New
        // {
        //   icon: <LucideFileText size={20} />,
        //   label: 'Salary Master',
        //   path: '/salary-master',
        // },
        {
          icon: <LucideFileText size={20} />,
          label: 'Salary Master New',
          path: '/salary-master-new',
        },
        {
          icon: <ListChecks size={20} />,
          label: 'Design',
          path: '/design',
        },
        {
          icon: <Monitor  size={16} />,
          label: 'Machine',
          path: '/machine',
        },
        {
          icon: <LucideClipboardList size={16} />,
          label: 'Process',
          path: '/process',
        },
            {
          icon: <LucideSettings size={20} />,
          label: 'Scan',
          path: '/admin-scan',
        },
        // {
        //   icon: <LucideScissors size={20} />,
        //   label: 'Alter',
        //   path: '/alter',
        // },
        {
          icon: <LucideScissors size={20} />,
          label: 'Alter',
          subItems: [
            {
              icon: <LucideScissors size={16} />,
              label: 'Alter',
              path: '/alter-count',
            },
            {
              icon: <LucideClipboardList size={16} />,
              label: 'Alter History',
              path: '/alter-history',
            },
            {
              icon: <LucideAlertCircle size={16} />,
              label: 'Reject',
              path: '/reject',
            },
          ],
        },
        {
          icon: <LucideUsers size={20} />,
          label: 'Member',
          subItems: [
            // {
            //   icon: <LucideUsers size={16} />,
            //   label: 'Users',
            //   path: '/users',
            // },
            {
              icon: <LucideUserCheck size={16} />,
              label: 'Employee',
              path: '/employees',
            },
            {
              icon: <LucideUser size={16} />,
              label: 'Admin',
              path: '/admin',
            },
          ],
        },
        // {
        //   icon: <LucideClipboardList size={20} />,
        //   label: 'Process',
        //   subItems: [
        //     ...new Map(
        //       processSubMenuItems.map((item) => [item.processName, item])
        //     ).values(),
        //   ].map((item) =>
        //     item.label === 'Process List'
        //       ? item
        //       : {
        //           icon: getProcessSubItemIcon(item.processName),
        //           label: item.processName,
        //           path: `/process/${item.processName?.toLowerCase()}`,
        //         }
        //   ),
        //   isLoading: isLoadingProcessSubItems,
        //   error: processSubItemsError,
        // },
      ];
    }
  }, [accountRole]);

  useEffect(() => {
    // Only keep submenu open when current route belongs to that submenu.
    const activeParent = menuItems.find(
      (item) => item?.subItems?.some((sub) => sub.path === location.pathname)
    );
    setOpenDropdown(activeParent?.label || null);
  }, [location.pathname, menuItems]);

  const openLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const confirmLogout = async () => {
    setIsLogoutLoading(true);
    try {
      await logoutApi();
      
      // Store accountRole before clearing localStorage
      const currentAccountRole = accountRole;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      if (currentAccountRole === 'user') {
        window.location.replace("/user/login");
      } else {
        window.location.replace("/panel/login");
      }
    } catch (error) {
      toast.error(error.message || "Logout failed. Please try again.", { toastId: 'logout-error' });
    } finally {
      setIsLogoutLoading(false);
      closeLogoutModal();
    }
  };

  const handleLogout = () => {
    openLogoutModal();
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    if (item.path) {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        item: item
      });
    }
  };

  const handleOpenInNewTab = () => {
    if (contextMenu.item && contextMenu.item.path) {
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}${contextMenu.item.path}`;
      window.open(fullUrl, '_blank');
    }
    setContextMenu({ visible: false, x: 0, y: 0, item: null });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, item: null });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        handleCloseContextMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.visible]);

  const isActivePath = (path, subItems = []) => {
    if (location.pathname === path) return true;
    if (subItems && subItems.length > 0) {
      return subItems.some((sub) => location.pathname === sub.path);
    }
    return false;
  };

  const handleProfileClick = () => {
    const isEmployee =
      accountRole === 'user' ||
      accountRole === 'employee' ||
      accountRoleType === 'user' ||
      accountRoleType === 'employee';
    if (isEmployee) {
      navigate("/user/profile");
    } else {
      navigate("/profile");
    }
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  
  const handleAddMachine = async () => {
    if (!newMachineName.trim()) return;
    setLoading(true);
    setAddMachineError(null);
    try {
      await addMachine({ machineName: newMachineName });
      refreshMachines();
      setIsAddMachineModalOpen(false);
      setNewMachineName('');
    } catch (err) {
      setAddMachineError('Failed to add machine');
      toast.error('Failed to add machine', { toastId: 'machine-add-error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProcess = async (processInput) => {    
    try {
      setLoading(true);
      await addProcess(processInput);
      await fetchProcessSubItems();
      setIsAddProcessModalOpen(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to added process", 
        { toastId: 'process-add-error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const response = await getSalarySummaryMaster({
        page: 1,
        limit: 500,
        sortDirection: 'asc',
      });
      const employeeOptions = (response.data || [])
        .filter((emp) => emp?.employeeId)
        .map((emp) =>
          mapEmployeeToSelectOption(emp, {
            valueKey: 'employeeId',
            extra: {
              totalSalary: emp.totalSalary ?? 0,
              currentTotalSalary: emp.currentTotalSalary ?? 0,
              totalUpad: emp.totalUpad ?? 0,
              totalPaid: emp.totalPaid ?? 0,
              netSalary: emp.netSalary ?? 0,
            },
          })
        );
      setEmployees(employeeOptions);
    } catch (error) {
      toast.error('Failed to load employees from salary master', { toastId: 'employees-fetch-error' });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleOpenUpadModal = () => {
    setIsUpadModalOpen(true);
    fetchEmployees();
    setUpadData({
      employeeId: '',
      upadAmount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setUpadError(null);
  };

  const handleCloseUpadModal = () => {
    setIsUpadModalOpen(false);
    setUpadData({
      employeeId: '',
      upadAmount: '',
      date: '',
      description: '',
    });
    setUpadError(null);
  };

  const handleUpadSubmit = async (formData) => {
    if (!formData.employeeId || !formData.upadAmount) {
      setUpadError('Please fill in all required fields');
      return;
    }

    try {
      setIsUpadLoading(true);
      setUpadError(null);
      
      // Prepare data for API call matching the curl example
      const apiData = {
        employeeId: formData.employeeId,
        upadAmount: Number(formData.upadAmount),
        totalSalary: Number(formData.totalSalary ?? 0),
      };

      await addUpad(apiData);
      handleCloseUpadModal();
    } catch (error) {
      setUpadError(error.message || "Failed to add UPAD");
    } finally {
      setIsUpadLoading(false);
    }
  };

  return (
    <>
      {loading && <LoaderComponent size={56} />}
      <div className="flex h-screen min-h-0 w-full overflow-hidden">
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={toggleMobileMenu}
          />
        )}

        <aside
          className={classNames(
            "lg:relative fixed inset-y-0 left-0 z-50 bg-light-white border-r border-light-border transition-all duration-300 transform",
            "lg:transform-none lg:translate-x-0",
            {
              "translate-x-0": isMobileMenuOpen,
              "-translate-x-full": !isMobileMenuOpen,
              "w-[240px]": isDrawerOpen,
              "lg:w-[80px]": !isDrawerOpen,
            }
          )}
        >
          <div className="flex h-full flex-col bg-light-primary">
            <div className="flex h-16 items-center justify-between px-4 border-b border-[#6A645C]">
              {(isDrawerOpen || isMobileMenuOpen) && (
                <span className="text-xl font-semibold text-light-white">
                  {tenantDisplayName}
                </span>
              )}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden text-light-white p-2"
              >
                <LucideX size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 p-3 overflow-y-auto scrollbar">
              {menuItems.map((item) => {
                const isDropdownParent = !!item.subItems;
                const currentItemIsActive = isActivePath(
                  item.path,
                  item.subItems
                );
                const isDropdownOpen = openDropdown === item.label;
                const isDisabled =
                  item.isLoading || (item.error && item.label === "Process");
                const isProcessItem = item.label === "Process";
                const isMemberItem = item.label === "Member";
                const isAlterCountItem = item.label === "Alter";

                const displayAsActive = currentItemIsActive;
                const showCenteredIconInCollapsed =
                  isDesktop && !isDrawerOpen && (isProcessItem || isMemberItem || isAlterCountItem);

                return (
                  <React.Fragment key={item.label}>
                    <button
                      ref={
                        isProcessItem && !isDrawerOpen && !isMobileMenuOpen
                          ? processBtnRef
                          : undefined
                      }
                      onClick={() => {
                        if (isDisabled) return;
                        if (isDropdownParent) {
                          setOpenDropdown(isDropdownOpen ? null : item.label);
                        } else if (item.onClick) {
                          item.onClick();
                          setIsMobileMenuOpen(false);
                        } else if (item.path) {
                          navigate(item.path);
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      disabled={isDisabled}
                      className={classNames(
                        "relative flex w-full items-center rounded-md px-3 py-2 transition-colors duration-200",
                        { "opacity-50 cursor-not-allowed": isDisabled },
                        {
                          "gap-3 justify-start":
                            isDrawerOpen || isMobileMenuOpen,
                          "lg:justify-center":
                            !isDrawerOpen &&
                            !isMobileMenuOpen &&
                            !isDropdownParent &&
                            !isMemberItem && !isAlterCountItem,
                          "lg:justify-start lg:gap-3":
                            !isDrawerOpen &&
                            !isMobileMenuOpen &&
                            (isDropdownParent || isMemberItem || isAlterCountItem),
                          "bg-[#EFE7DC] text-light-primary font-medium":
                            displayAsActive,
                          "text-light-white hover:bg-[#6A645C]/40 hover:text-white":
                            !displayAsActive,
                          "border-l-4 border-[#C5B396]":
                            currentItemIsActive &&
                            (isDrawerOpen || isMobileMenuOpen),
                        }
                      )}
                      title={
                        !isDrawerOpen && !isMobileMenuOpen
                          ? item.label
                          : undefined
                      }
                    >
                      <div
                        className={classNames({
                          "text-light-primary": displayAsActive,
                          "w-full flex justify-center":
                            showCenteredIconInCollapsed,
                        })}
                      >
                        {item.icon}
                      </div>
                      {(isDrawerOpen || isMobileMenuOpen) && (
                        <span
                          className={classNames(
                            "flex-1 text-left font-roboto text-sm",
                            { "font-medium": displayAsActive }
                          )}
                        >
                          {item.label}
                          {item.isLoading &&
                            item.label === "Process" &&
                            " (Loading...)"}
                          {item.error && item.label === "Process" && " (Error)"}
                        </span>
                      )}
                      {(isDrawerOpen || isMobileMenuOpen) &&
                        isDropdownParent &&
                        (item.label === "Process"
                          ? !item.isLoading && !item.error
                          : true) &&
                        (isDropdownOpen ? (
                          <LucideChevronUp size={18} />
                        ) : (
                          <LucideChevronDown size={18} />
                        ))}
                    </button>
                    {isDropdownParent &&
                      isDropdownOpen &&
                      (isDrawerOpen || isMobileMenuOpen) &&
                      (item.label === "Process"
                        ? !item.isLoading &&
                          !item.error &&
                          item.subItems &&
                          item.subItems.length > 0
                        : item.subItems && item.subItems.length > 0) && (
                        <div className="pl-5 mt-1 space-y-1 transition-all duration-300 ease-in-out">
                          {item.subItems.map((subItem) => {
                            const isSubItemActive =
                              location.pathname === subItem.path;
                            return (
                              <button
                                key={subItem.label}
                                onClick={() => {
                                  if (subItem.path) navigate(subItem.path);
                                  setIsMobileMenuOpen(false);
                                }}
                                onContextMenu={(e) => handleContextMenu(e, subItem)}
                                className={classNames(
                                  "flex w-full items-center rounded-md pl-3 pr-2 py-2 transition-colors duration-200 text-sm",
                                  "gap-2 justify-start",
                                  {
                                    "bg-[#EFE7DC] text-light-primary font-medium":
                                      isSubItemActive,
                                    "text-light-white hover:bg-[#6A645C]/40 hover:text-white":
                                      !isSubItemActive,
                                  }
                                )}
                                title={subItem.label}
                              >
                                {subItem.icon ||
                                  (item.label === "Process" ? (
                                    getProcessSubItemIcon(subItem.label)
                                  ) : (
                                    <LucideUsers size={16} />
                                  ))}
                                <span
                                  className={classNames("font-roboto", {
                                    "font-medium": isSubItemActive,
                                  })}
                                >
                                  {subItem.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    {isDropdownParent &&
                      isDropdownOpen &&
                      !isDrawerOpen &&
                      !isMobileMenuOpen &&
                      (item.label === "Process"
                        ? !item.isLoading &&
                          !item.error &&
                          item.subItems &&
                          item.subItems.length > 0
                        : item.subItems && item.subItems.length > 0) && (
                        <div className="pl-0 flex flex-col items-center space-y-1 mt-1">
                          {item.subItems.map((subItem) => {
                            const isSubItemActive =
                              location.pathname === subItem.path;
                            return (
                              <button
                                key={subItem.label}
                                onClick={() => {
                                  if (subItem.path) navigate(subItem.path);
                                }}
                                onContextMenu={(e) => handleContextMenu(e, subItem)}
                                className={classNames(
                                  "flex items-center justify-center w-10 h-10 rounded-md transition-colors duration-200",
                                  {
                                    "bg-[#EFE7DC] text-light-primary font-medium":
                                      isSubItemActive,
                                    "text-light-white hover:bg-[#6A645C]/40 hover:text-white":
                                      !isSubItemActive,
                                  }
                                )}
                                title={subItem.label}
                              >
                                {subItem.icon ||
                                  (item.label === "Process" ? (
                                    getProcessSubItemIcon(subItem.label)
                                  ) : (
                                    <LucideUsers size={16} />
                                  ))}
                              </button>
                            );
                          })}
                        </div>
                      )}
                  </React.Fragment>
                );
              })}
            </nav>

            <div className="border-t border-light-border p-4">
              <Button
                onClick={handleLogout}
                className={classNames(
                  "flex w-full items-center rounded-md px-3 py-2 text-light-white transition-colors duration-200 bg-none shadow-none focus:!ring-0 outline-none",
                  {
                    "gap-3 justify-start": isDrawerOpen || isMobileMenuOpen,
                    "lg:justify-center": !isDrawerOpen && !isMobileMenuOpen,
                  }
                )}
                label={isDrawerOpen || isMobileMenuOpen ? "Logout" : undefined}
                icon={<LucideLogOut size={20} />}
              />
            </div>
          </div>
        </aside>

        {/* Context Menu */}
        {contextMenu.visible && (
          <div
            className="fixed z-50 bg-light-lightGreyBackground text-light-primary border-l-4 border-light-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[150px]"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleOpenInNewTab}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Open in new tab
            </button>
          </div>
        )}
        <main
          className={classNames(
            "relative flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden transition-all duration-300 ml-0 bg-[#F7F3EE]",
            {
              " w-[calc(100%-240px)]": isDrawerOpen,
              " w-[calc(100%-80px)]": !isDrawerOpen,
            }
          )}
        >
          {/* Full fabric background */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
            <div
              className="absolute inset-0 opacity-[0.22]"
              style={{
                backgroundImage: `url(${pageBgFull})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage: `url(${fabricLines})`,
                backgroundSize: "720px auto",
                backgroundRepeat: "repeat",
                backgroundPosition: "top left",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(160deg, rgba(247,243,238,0.82) 0%, rgba(249,246,241,0.72) 45%, rgba(239,231,220,0.78) 100%)",
              }}
            />
          </div>

          {/* Katar — half under table / bottom of content */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
            <HeaderVectors variant="page" />
          </div>

          {/* Title/header vectors — behind page content so fields stay opaque */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[220px] overflow-hidden"
            aria-hidden
          >
            <HeaderVectors variant="toolbar" />
          </div>

          {/* Header — translucent so vectors peek through */}
          <div className="relative z-40 sticky top-0 shrink-0 bg-[#F9F6F1]/55 backdrop-blur-[2px] border-b border-[#E8DFD4]">
            <div className="container-fluid">
              <div className="flex h-16 items-center justify-between px-6 py-3 w-full">
                <div className="flex items-center w-full justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={toggleMobileMenu}
                      icon={<LucideMenu size={20} />}
                      className="lg:hidden flex items-center justify-center rounded-md text-light-lightGrey !p-0 focus:!ring-0 border-0 bg-none hover:text-light-darkGrey transition-colors duration-200"
                    />
                    <Button
                      variant="outline"
                      onClick={toggleDrawer}
                      icon={
                        isDrawerOpen ? (
                          <LucideX size={20} />
                        ) : (
                          <LucideAlignLeft size={20} />
                        )
                      }
                      className={classNames(
                        "hidden lg:flex items-center justify-center rounded-md text-light-lightGrey !p-0 focus:!ring-0 border-0 bg-none",
                        " hover:text-light-darkGrey transition-colors duration-200"
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                  {appRelease?.apkUrl ? (
                    <a
                      href={appRelease.apkUrl}
                      className="inline-flex items-center gap-2 rounded-md bg-light-primary px-3 py-2 text-xs font-semibold text-white"
                    >
                      <LucideDownload size={16} />
                      <span className="hidden md:inline">Download APK</span>
                      <span>v{appRelease.versionCode}</span>
                    </a>
                  ) : null}
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                    onClick={handleProfileClick}
                  >
                    <div className="h-8 w-8 rounded-full bg-light-primary flex items-center justify-center">
                      <LucideUser className="text-light-white" size={20} />
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-start text-light-darkGrey">
                        {`${user?.firstName || ""} ${user?.lastName || userData?.username || user?.username || ""}`.trim()}
                        </span>
                        <span className="text-xs text-light-lightGrey text-start">
                          {accountRoleType}
                        </span>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-transparent p-4 md:p-6 scrollbar">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>

        <Modal
          isOpen={isAddMachineModalOpen}
          onClose={() => setIsAddMachineModalOpen(false)}
          title="Add New Machine"
          size="sm"
          footerContent={
            <div className="flex justify-end gap-2">
              <Button
                label="Cancel"
                variant="secondary"
                onClick={() => setIsAddMachineModalOpen(false)}
              />
              <Button
                label="Add Machine"
                variant="primary"
                onClick={handleAddMachine}
                isLoading={loading}
              />
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
            {addMachineError && (
              <div className="text-red-500 text-sm mt-2">{addMachineError}</div>
            )}
          </div>
        </Modal>

        <AddProcessModal
          isOpen={isAddProcessModalOpen}
          onClose={() => setIsAddProcessModalOpen(false)}
          onAddProcess={handleAddProcess}
        />

        <AddUpadModal
          isOpen={isUpadModalOpen}
          onClose={handleCloseUpadModal}
          onSubmit={handleUpadSubmit}
          isLoading={isUpadLoading}
          employees={employees}
          isLoadingEmployees={isLoadingEmployees}
          error={upadError}
        />

        {isLogoutModalOpen && (
          <Modal
            isOpen={isLogoutModalOpen}
            onClose={closeLogoutModal}
            title=""
            size="sm"
          >
            <div className="flex flex-col items-center text-center p-2">
              <LucideAlertCircle
                size={48}
                className="text-light-secondary mb-4"
              />
              <h3 className="text-lg font-semibold text-light-darkGrey mb-2">
                Confirm Logout
              </h3>
              <p className="text-sm text-light-text mb-6">
                Are you sure you want to log out of your account?
              </p>
              <div className="flex justify-center space-x-3 w-full">
                <Button
                  variant="outline"
                  size="default"
                  onClick={closeLogoutModal}
                  label="Cancel"
                  className="flex-1 focus:!ring-0"
                  disabled={isLogoutLoading}
                />
                <Button
                  variant="secondary"
                  size="default"
                  onClick={confirmLogout}
                  label={isLogoutLoading ? "Logging out..." : "Yes, Logout"}
                  className="flex-1 focus:!ring-0"
                  loading={isLogoutLoading}
                  disabled={isLogoutLoading}
                />
              </div>
            </div>
          </Modal>
        )}
      </div>
    </>
  );
};

export default DashboardLayout;
