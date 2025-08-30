import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // store user object or token
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    const res = await axiosInstance.post("auth/login-user", credentials);
    setUser(res.data.user); // or token depending on backend
    return res;
  };


  const updateUser = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  const logout = async () => {
    await axiosInstance.post("auth/logout-user"); // optional
    setUser(null);
  };

  const checkAuth = async () => {
    try {
      const res = await axiosInstance.get("auth/me"); // get current user
      setUser(res.data.user);
    } catch (err) {
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
      value={{ user, login, updateUser, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
