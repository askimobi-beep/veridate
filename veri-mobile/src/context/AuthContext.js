import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback((nextToken) => {
    if (nextToken) {
      api.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, []);

  const checkAuth = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      setUser(res?.data?.user || null);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async ({ email, password }) => {
    const res = await api.post("/auth/login-user", { email, password });
    const nextToken = res?.data?.token;
    setToken(nextToken || null);
    applyToken(nextToken);
    setUser(res?.data?.user || null);
    return res;
  };

  const register = async ({ firstName, lastName, email, password }) => {
    const res = await api.post("/auth/register-user", {
      firstName,
      lastName,
      email,
      password,
    });
    return res;
  };

  const verifyOtp = async ({ email, otp }) => {
    const res = await api.post("/auth/verify-otp", { email, otp });
    return res;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout-user");
    } finally {
      setUser(null);
      setToken(null);
      applyToken(null);
    }
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, verifyOtp, logout, refresh: checkAuth }),
    [user, token, loading, checkAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
