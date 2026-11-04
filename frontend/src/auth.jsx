import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { http } from './api';

const AuthContext = createContext(null);

const read = () => ({
  token: localStorage.getItem('token'),
  role: localStorage.getItem('role'), // 'user' | 'driver' | 'admin'
  name: localStorage.getItem('driverName'),
});

// Where each role lands after login
export const HOME = { user: '/app', driver: '/driver', admin: '/admin' };

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(read);

  const persist = useCallback((token, role, name) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('driverName', name);
    setSession({ token, role, name });
  }, []);

  // kind: 'staff' (drivers and admins) or 'customer'
  const login = useCallback(async (kind, credentials) => {
    if (kind === 'staff') {
      const { data } = await http.post('/drivers/login', credentials);
      persist(data.token, data.role, data.driver.name);
      return data.role;
    }
    const { data } = await http.post('/users/login', credentials);
    persist(data.token, 'user', data.name);
    return 'user';
  }, [persist]);

  const register = useCallback(async (form) => {
    const { data } = await http.post('/users/register', form);
    persist(data.token, 'user', data.name);
    return 'user';
  }, [persist]);

  const logout = useCallback(() => {
    ['token', 'role', 'driverName'].forEach((k) => localStorage.removeItem(k));
    setSession({ token: null, role: null, name: null });
  }, []);

  const value = useMemo(() => ({ ...session, isAuthed: !!session.token, login, register, logout, setName: (n) => { localStorage.setItem('driverName', n); setSession((s) => ({ ...s, name: n })); } }), [session, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

// Gate a route group to one or more roles; others are sent to their own home
export const RequireRole = ({ roles, children }) => {
  const { isAuthed, role } = useAuth();
  const location = useLocation();
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(role)) return <Navigate to={HOME[role] || '/'} replace />;
  return children;
};
