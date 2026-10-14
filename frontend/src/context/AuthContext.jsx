import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('evhumi_token') || null);
  const [loading, setLoading] = useState(true);

  // Set axios default authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('evhumi_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('evhumi_token');
    }
  }, [token]);

  // Load user profile on initial mount
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            // Server explicitly rejected token (e.g. 401) — logout
            logout();
          }
        } catch (err) {
          // If 401 Unauthorized — token expired/invalid, logout
          if (err.response?.status === 401) {
            logout();
          } else {
            // Network error, server down, or 5xx — restore from JWT payload
            // so the user doesn't get kicked out on page reload
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              if (payload && payload.id && payload.role) {
                setUser({
                  _id: payload.id,
                  id: payload.id,
                  role: payload.role,
                  email: payload.email,
                  nid: payload.nid,
                  name: payload.name || payload.email
                });
              } else {
                logout();
              }
            } catch {
              logout();
            }
          }
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'লগইন ব্যর্থ হয়েছে');
  };


  const register = async (userData) => {
    const res = await axios.post('/api/auth/register', userData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'নিবন্ধন ব্যর্থ হয়েছে');
  };

  const verifyAndRegister = async (registrationDataWithOtp) => {
    const res = await axios.post('/api/otp/verify-and-register', registrationDataWithOtp);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'ওটিপি যাচাই বা নিবন্ধন ব্যর্থ হয়েছে');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('evhumi_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const getDashboardRoute = (userRole) => {
    const role = userRole || user?.role;
    switch (role) {
      case 'Super Admin':
        return '/admin/dashboard';
      case 'Register Office':
        return '/register-office/dashboard';
      case 'AC Land Office':
        return '/ac-land/dashboard';
      case 'User':
      default:
        return '/user/dashboard';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        loading,
        login,
        register,
        verifyAndRegister,
        logout,
        getDashboardRoute
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
