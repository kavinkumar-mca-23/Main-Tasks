import { createContext, useContext, useState,useEffect } from "react";
import api, { setAuthToken } from "../utils/api";

const AuthContext = createContext();



export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token")); // track token

   useEffect(() => {
    loadUser(); // ✅ Automatically load user if token exists
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    setAuthToken(token);  // attaches token to axios
    setToken(token);
    setUser(user);
    
  };

  const register = async (name, email, password) => {
    await api.post("/auth/register", { name, email, password });
  };

  const loadUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthToken(token);
      try {
        const res = await api.get("/auth/me"); // ✅ fixed endpoint
        setUser(res.data);
      } catch (err) {
        console.error("Failed to load user:", err);
        logout(); // Optionally log out on error
      }
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setAuthToken(null);
    setUser(null);
    setToken(null); // clear token
  };

  return (
    <AuthContext.Provider value={{ user,token, login, register, loadUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
