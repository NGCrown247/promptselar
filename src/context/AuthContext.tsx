import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (fullName: string, username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize from token
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("calebprompt_token");
      if (token) {
        try {
          const profile = await api.getProfile();
          setUser(profile);
        } catch {
          localStorage.removeItem("calebprompt_token");
          setUser(null);
        }
      } else {
        // Guest mode by default
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem("calebprompt_token", res.token);
    setUser(res.user);
  };

  const signup = async (fullName: string, username: string, email: string, password: string) => {
    const res = await api.signup(fullName, username, email, password);
    localStorage.setItem("calebprompt_token", res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors
    }
    localStorage.removeItem("calebprompt_token");
    sessionStorage.clear();
    setUser(null);
    // Replace history state so back button cannot navigate back into private pages
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/login");
    }
  };

  const updateProfile = async (fullName: string, username: string) => {
    const updated = await api.updateProfile(fullName, username);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === "admin",
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
