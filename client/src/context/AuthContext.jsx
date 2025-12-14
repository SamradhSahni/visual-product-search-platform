import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);      // initial /me check
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔥 Load current user (SESSION-BASED)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
        const res = await api.get("/auth/me"); // ✅ correct route

        if (res.data?.success) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // ---------------- SIGNUP ----------------
  const signup = async ({ name, email, password, role }) => {
    try {
      setAuthLoading(true);
      setError(null);

      const res = await api.post("/auth/signup", {
        name,
        email,
        password,
        role,
      });

      if (res.data?.success) {
        setUser(res.data.user);
        return { success: true };
      }

      setError(res.data?.message || "Signup failed");
      return { success: false };
    } catch (err) {
      const msg =
        err.response?.data?.message || "Signup failed. Please try again.";
      setError(msg);
      return { success: false };
    } finally {
      setAuthLoading(false);
    }
  };

  // ---------------- LOGIN ----------------
  const login = async ({ email, password }) => {
    try {
      setAuthLoading(true);
      setError(null);

      const res = await api.post("/auth/login", { email, password });

      if (res.data?.success) {
        setUser(res.data.user);
        return { success: true };
      }

      setError(res.data?.message || "Login failed");
      return { success: false };
    } catch (err) {
      const msg =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(msg);
      return { success: false };
    } finally {
      setAuthLoading(false);
    }
  };

  // ---------------- LOGOUT ----------------
  const logout = async () => {
    try {
      setAuthLoading(true);
      await api.post("/auth/logout");
      setUser(null);
    } catch (err) {
      setError("Logout failed");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authLoading,
        error,
        signup,
        login,
        logout,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
