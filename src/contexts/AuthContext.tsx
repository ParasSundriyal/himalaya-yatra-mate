import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

type UserRole = "user" | "group" | "admin";

interface User {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  photo?: string;
  aadhar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role?: UserRole;
    aadhar?: string;
    dateOfBirth?: string;
    address?: any;
    photo?: string;
  }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem("char-dham-user");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          if (userData.token) {
            // Verify token by fetching profile
            const response = await api.auth.getProfile();
            if (response.user) {
              setUser({
                id: response.user._id || response.user.id,
                name: response.user.name,
                email: response.user.email,
                phone: response.user.phone,
                role: response.user.role,
                photo: response.user.photo || userData.photo,
                aadhar: response.user.aadhar || userData.aadhar,
              });
            } else {
              // Token invalid, clear storage
              localStorage.removeItem("char-dham-user");
            }
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("char-dham-user");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, role?: UserRole): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await api.auth.login(email, password, role);
      
      if (response.token && response.user) {
        const userData = {
          ...response.user,
          token: response.token,
          photo: response.user.photo,
          aadhar: response.user.aadhar,
        };
        
        setUser({
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone,
          role: response.user.role,
          photo: response.user.photo,
          aadhar: response.user.aadhar,
        });
        
        localStorage.setItem("char-dham-user", JSON.stringify(userData));
        
        // Navigate based on role
        if (response.user.role === "group") {
          navigate("/group-portal");
        } else if (response.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
        
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Login error:", error);
      throw error; // Re-throw to handle in component
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role?: UserRole;
    aadhar?: string;
    dateOfBirth?: string;
    address?: any;
  }): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await api.auth.register(data);
      
      if (response.token && response.user) {
        const userData = {
          ...response.user,
          token: response.token,
          photo: response.user.photo,
          aadhar: response.user.aadhar,
        };
        
        setUser({
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone,
          role: response.user.role,
          photo: response.user.photo || data.photo,
          aadhar: response.user.aadhar || data.aadhar,
        });
        
        localStorage.setItem("char-dham-user", JSON.stringify(userData));
        
        // Navigate based on role
        if (response.user.role === "group") {
          navigate("/group-portal");
        } else if (response.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
        
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Register error:", error);
      throw error; // Re-throw to handle in component
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("char-dham-user");
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register,
      logout, 
      isAuthenticated: !!user,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
