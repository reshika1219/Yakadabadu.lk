import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

// Single source of truth for the backend URL (override with VITE_API_URL)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const http = axios.create({ baseURL: API_URL });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or revoked session sends the user back to login (public calls are left alone)
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const hadToken = !!localStorage.getItem('token');
    if (err.response?.status === 401 && hadToken) {
      ['token', 'role', 'driverName'].forEach((k) => localStorage.removeItem(k));
      if (!location.pathname.startsWith('/login')) location.assign('/login?expired=1');
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.error || (err?.request && !err?.response ? 'Cannot reach the server. Is the API running on port 5001?' : err?.message) || fallback;

// Fetch-on-mount hook: { data, loading, error, reload, setData }
export const useFetch = (path, { skip = false, deps = [] } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (skip || !path) return;
    setLoading(true);
    setError(null);
    try {
      const res = await http.get(path);
      if (alive.current) setData(res.data);
    } catch (err) {
      if (alive.current) setError(errorMessage(err));
    } finally {
      if (alive.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, skip, ...deps]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => { alive.current = false; };
  }, [load]);

  return { data, loading, error, reload: load, setData };
};
