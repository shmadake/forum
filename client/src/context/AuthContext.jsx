import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Send the httpOnly auth cookie with every request automatically.
axios.defaults.withCredentials = true;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await axios.get(`${window.location.origin}/api/auth/me`);
      setUser(res.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const signup = async (name, email, password) => {
    const res = await axios.post(`${window.location.origin}/api/auth/signup`, {
      name,
      email,
      password,
    });
    setUser(res.data);
    return res.data;
  };

  const login = async (email, password) => {
    const res = await axios.post(`${window.location.origin}/api/auth/login`, {
      email,
      password,
    });
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    await axios.post(`${window.location.origin}/api/auth/logout`);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, signup, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
