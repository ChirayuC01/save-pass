import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const storeToken = (token) => sessionStorage.setItem('accessToken', token);
  const clearToken = () => sessionStorage.removeItem('accessToken');

  useEffect(() => {
    client.post('/api/v1/auth/refresh')
      .then(({ data }) => {
        storeToken(data.data.accessToken);
        setUser(data.data.user);
      })
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signup = async (email, password) => {
    const { data } = await client.post('/api/v1/auth/signup', { email, password });
    storeToken(data.data.accessToken);
    setUser(data.data.user);
  };

  const login = async (email, password) => {
    const { data } = await client.post('/api/v1/auth/login', { email, password });
    storeToken(data.data.accessToken);
    setUser(data.data.user);
  };

  const logout = async () => {
    await client.post('/api/v1/auth/logout').catch(() => {});
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
