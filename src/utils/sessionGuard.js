import axios from 'axios';

const SESSION_ENDED = /session expired|invalid token|token has been invalidated|token expired|access denied\. no token/i;

function loginPath() {
  const path = window.location.pathname || '';
  let role = null;
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    role = user?.accountRole || user?.role || null;
  } catch (e) {}
  if (role === 'superadmin' || path.startsWith('/super-admin')) return '/super-admin/login';
  if (role === 'user' || role === 'employee' || path.startsWith('/user')) return '/user/login';
  return '/admin/login';
}

export function redirectToLogin() {
  const path = window.location.pathname || '';
  if (path.endsWith('/login') || window.__sitaramLoginRedirect) return;
  window.__sitaramLoginRedirect = true;
  const to = loginPath();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.replace(to);
}

function onResponseError(error) {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || '');
  if (status === 401 && SESSION_ENDED.test(message)) {
    redirectToLogin();
  }
  return Promise.reject(error);
}

function attach(instance) {
  instance.interceptors.response.use((response) => response, onResponseError);
}

attach(axios);
const originalCreate = axios.create.bind(axios);
axios.create = function createWithSessionGuard(config) {
  const instance = originalCreate(config);
  attach(instance);
  return instance;
};
