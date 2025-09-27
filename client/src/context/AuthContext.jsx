// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from "react";
import axiosInstance from "../utils/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLoggingOutRef = useRef(false); // 👈 NEW

  const login = async (credentials) => {
    const res = await axiosInstance.post("auth/login-user", credentials);
    await checkAuth();
    return res;
  };

  const googleLogin = async (credential) => {
    const res = await axiosInstance.post("auth/google", { credential });
    await checkAuth();
    return res;
  };

  const startLinkedInLogin = () => {
    const from =
      window.location.pathname + window.location.search + window.location.hash;
    const api =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
    window.location.href = `${api}/auth/linkedin?from=${encodeURIComponent(
      from
    )}`;
  };

  const facebookLogin = async (accessToken, userID) => {
    const res = await axiosInstance.post("auth/facebook", {
      accessToken,
      userID,
    });
    setUser(res.data.user);
    return res;
  };

  const logout = async () => {
    try {
      isLoggingOutRef.current = true; // 👈 tell the guard this is a logout redirect
      await axiosInstance.post("auth/logout-user");
    } catch {}
    setUser(null);
  };

  const checkAuth = async () => {
    try {
      const res = await axiosInstance.get("auth/me");
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        facebookLogin,
        logout,
        isLoggingOutRef,
        checkAuth,
        startLinkedInLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
