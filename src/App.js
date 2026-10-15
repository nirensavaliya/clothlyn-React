import "./App.css";
import "./index.css";
import './style/globle.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import Login from "./pages/login";
import UserLoginPage from "./pages/userLogin";
import Lots from "./pages/lots";
import Profile from "./pages/profile";
import UserProfile from "./pages/userProfile";
import Report from "./pages/report";
import Scan from "./pages/scan";
import DashboardLayout from "./component/layout/DashboardLayout";
import Users from "./pages/users";
import ProcessSubItemPage from "./pages/ProcessSubItemPage";
import SalesReport from "./pages/salesReport";
import SalaryReport from "./pages/salaryReport";
import SalaryReportNew from "./pages/salaryReportNew";
import UserSalaryReport from "./pages/userSalaryReport";
import Products from "./pages/products";
import NonMovingItem from "./pages/nonMovingItem";
import PurchaseReport from "./pages/purchaseReport";
import ProductReport from "./pages/productReport";
import BillScan from "./pages/billScan";
import FinanceManager from "./pages/financeManager";
import Employees from "./pages/employees";
import Design from "./pages/design";
import MachinePage from "./pages/machine";
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import AdminPage from "./pages/admin";
import BarcodeLabelPage from "./pages/BarcodeLabelPage";
import BarcodeActionForm from "./pages/barcodeActionForm";
import BarcodeStatusAction from "./pages/barcodeStatusAction";
import ProcessPage from "./pages/process";
import AdminScan from "./pages/adminScan";
import Upad from "./pages/upad";
import UserUpad from "./pages/userUpad";
import Alter from "./pages/alter";
import AlterCount from "./pages/alterCount";
import AlterHistory from "./pages/alterHistory";
import Reject from "./pages/reject";
import AccountDetails from "./pages/accountDetails";
import SalaryMasterNew from "./pages/salaryMasterNew";
import SalaryPaid from "./pages/salaryPaid";
import { MachineProvider } from "./contexts/MachineContext";
import UserSalaryPaid from "./pages/userSalaryPaid";
import DesignReport from "./pages/DesignReport";
import SuperAdminPage from "./pages/superAdmin";
import SuperAdminLoginPage from "./pages/superAdminLogin";
import Companies from "./pages/companies";
import CompaniesReport from "./pages/companiesReport";
import HomePage from "./pages/marketing/HomePage";
import ServicesPage from "./pages/marketing/ServicesPage";
import AboutPage from "./pages/marketing/AboutPage";
import ContactPage from "./pages/marketing/ContactPage";

 const isAuthenticated = () => {
  const storedToken = localStorage.getItem('token');
  if (!storedToken || storedToken === 'null' || storedToken === 'undefined') return false;
  let token = storedToken;
  try {
    token = JSON.parse(storedToken);
  } catch (e) {}
  try {
    const decoded = jwtDecode(token);
    if (!decoded.authEpoch) return false;
    if (decoded.exp && decoded.exp * 1000 > Date.now()) {
      return true;
    }
  } catch (e) {}
  return false;
};

const getAuthRole = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.accountRole || user?.role || null;
  } catch (e) {
    return null;
  }
};

const GuestRoute = ({ children, redirectTo, superAdminLogin }) => {
  if (isAuthenticated()) {
    const role = getAuthRole();
    if (role === 'superadmin') {
      return <Navigate to="/super-admin" replace />;
    }
    if (superAdminLogin) {
      return <Navigate to="/lots" replace />;
    }
    const destination =
      redirectTo ||
      (role === 'user' || role === 'employee' ? '/user-scan' : '/lots');
    return <Navigate to={destination} replace />;
  }
  return children;
};

const SuperAdminProtectedRoute = () => {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/super-admin/login" replace state={{ from: location }} />;
  }

  if (getAuthRole() !== 'superadmin') {
    return <Navigate to="/lots" replace />;
  }

  return <SuperAdminPage />;
};

const ProtectedRoute = ({ adminOnly, userOnly }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  let role = null;
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    role = user?.accountRole || null;
  } catch (e) {}
  if (!isAuthenticated()) {
    if (location.pathname.startsWith('/super-admin')) {
      window.location.href = '/super-admin/login';
      return null;
    }
    if (location.pathname.startsWith('/user')) {
      window.location.href = '/user/login'; 
      return null;
    } else {
      window.location.href = '/panel/login'; 
      return null;
    }
  }
  if (role === 'superadmin') {
    return <Navigate to="/super-admin" replace />;
  }
  if (userOnly && role !== 'user' && role !== 'employee') {
    return <Navigate to="/lots" replace />;
  }
  if (adminOnly && role !== 'admin') {
    return <Navigate to="/user-scan" replace />;
  }
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

function App() {
  useEffect(() => {
    const checkAndSetLogoutTimer = () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
        let token = storedToken;
        try {
          token = JSON.parse(storedToken);
        } catch (e) {}
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp) {
            const expiry = decoded.exp * 1000;
            const timeout = expiry - Date.now();
            if (timeout > 0) {
              const timer = setTimeout(() => {
                const role = getAuthRole();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href =
                  role === 'superadmin' ? '/super-admin/login' : '/user/login';
              }, timeout);
              return () => clearTimeout(timer);
            } else {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/user/login';                 
            }
          }
        } catch (e) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/user/login';
        }
      }
    };
    checkAndSetLogoutTimer();
  }, []);

  return (
    <MachineProvider>
      <div className="App">
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
          style={{ zIndex: 200001 }}
        />
        <Routes>
        {/* Old URL — servers often block /admin; keep redirect when SPA loads */}
        <Route
          path="/admin/login"
          element={<Navigate to="/panel/login" replace />}
        />
        <Route
          path="/panel/login"
          element={
            <GuestRoute redirectTo="/lots">
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/user/login"
          element={
            <GuestRoute redirectTo="/user-scan">
              <UserLoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/super-admin/login"
          element={
            <GuestRoute superAdminLogin>
              <SuperAdminLoginPage />
            </GuestRoute>
          }
        />
        <Route path="/super-admin/*" element={<SuperAdminProtectedRoute />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        {/* User-only routes */}
        <Route element={<ProtectedRoute userOnly />}>
          <Route path="/user/profile" element={<UserProfile />} />
          <Route path="/user-scan" element={<Scan />} />
          <Route path="/user/salary-report" element={<UserSalaryReport />} />
          <Route path="/user/salary-paid" element={<UserSalaryPaid />} />
          <Route path="/user/upad" element={<UserUpad />} />
        </Route>
        {/* Admin-only routes */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/lots" element={<Lots />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/design" element={<Design />} />
          <Route path="/admin-scan" element={<AdminScan/>} />
          <Route path="/upad" element={<Upad />} />
          <Route path="/salary-report" element={<SalaryReport />} />
          <Route path="/salary-report-new" element={<SalaryReportNew />} />
          <Route path="/users" element={<Users />} />
          <Route path="/process" element={<ProcessPage />} />
          <Route path="/product" element={<Products />} />
          <Route path="/non-moving-item" element={<NonMovingItem />} />
          <Route path="/purchase-report" element={<PurchaseReport />} />
          <Route path="/bill-scan" element={<BillScan />} />
          <Route path="/finance-manager" element={<FinanceManager />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/report" element={<Report />} />
          <Route path="/machine" element={<MachinePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/barcode-label" element={<BarcodeLabelPage />} />
          <Route path="/alter" element={<Alter />} />
          <Route path="/alter-count" element={<AlterCount />} />
          <Route path="/alter-history" element={<AlterHistory />} />
          <Route path="/reject" element={<Reject />} />
          <Route path="/salary-master" element={<AccountDetails />} />
          <Route path="/salary-master-new" element={<SalaryMasterNew />} />
          <Route path="/product-report" element={<ProductReport />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/company-reports" element={<CompaniesReport />} />
          <Route path="/salary-paid" element={<SalaryPaid />} />
          <Route path="/sales-report" element={<SalesReport />} />
          <Route path="/process/:itemName" element={<ProcessSubItemPage />} />
        </Route>
        <Route
          path="/dashboard"
          element={<Navigate to="/lots" replace />}
        />
        {/* Default: redirect to user login */}
        <Route path="*" element={<Navigate to="/user/login" replace />} />
        <Route
          path="/barcode-action-form"
          element={<BarcodeActionForm />}
        />
        <Route
          path="/barcode-status-action"
          element={<BarcodeStatusAction />}
        />
      </Routes>
      </div>
    </MachineProvider>
  );
}

export default App;

