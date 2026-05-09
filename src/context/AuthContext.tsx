import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';
import { deriveKey, exportKey, encryptData, decryptData } from '../utils/crypto';
import type { AuthContextValue, User, PasswordEntry, EncryptedEntry } from '../types';

const AuthContext = createContext<AuthContextValue | null>(null);

const ENC_KEY_STORAGE = 'savepass_ek';

const storeToken = (token: string) => sessionStorage.setItem('accessToken', token);
const clearToken = () => sessionStorage.removeItem('accessToken');
const storeEncKey = (keyHex: string) => sessionStorage.setItem(ENC_KEY_STORAGE, keyHex);
const getEncKey = () => sessionStorage.getItem(ENC_KEY_STORAGE);
const clearEncKey = () => sessionStorage.removeItem(ENC_KEY_STORAGE);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.post('/api/v1/auth/refresh')
      .then(({ data }) => {
        storeToken(data.data.accessToken);
        setUser(data.data.user);
        if (!getEncKey()) {
          clearToken();
          setUser(null);
        }
      })
      .catch(() => {
        clearToken();
        clearEncKey();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const _deriveAndStoreKey = async (password: string, keySalt: string) => {
    const cryptoKey = await deriveKey(password, keySalt);
    const keyHex = await exportKey(cryptoKey);
    storeEncKey(keyHex);
  };

  const signup = async (email: string, password: string) => {
    const { data } = await client.post('/api/v1/auth/signup', { email, password });
    const { user, accessToken, keySalt } = data.data;
    storeToken(accessToken);
    await _deriveAndStoreKey(password, keySalt);
    setUser(user);
  };

  const login = async (email: string, password: string) => {
    const { data } = await client.post('/api/v1/auth/login', { email, password });
    const { user, accessToken, keySalt } = data.data;
    storeToken(accessToken);
    await _deriveAndStoreKey(password, keySalt);
    setUser(user);
  };

  const logout = async () => {
    await client.post('/api/v1/auth/logout').catch(() => {});
    clearToken();
    clearEncKey();
    setUser(null);
  };

  const encryptEntry = async (
    credential: Omit<PasswordEntry, '_id' | 'createdAt'>
  ): Promise<{ encryptedData: string; iv: string }> => {
    const keyHex = getEncKey();
    if (!keyHex) throw new Error('Encryption key unavailable — please log in again');
    return encryptData(keyHex, JSON.stringify(credential));
  };

  const decryptEntry = async (
    entry: Pick<EncryptedEntry, 'encryptedData' | 'iv'>
  ): Promise<Omit<PasswordEntry, '_id' | 'createdAt'>> => {
    const keyHex = getEncKey();
    if (!keyHex) throw new Error('Encryption key unavailable — please log in again');
    const plaintext = await decryptData(keyHex, entry.encryptedData, entry.iv);
    return JSON.parse(plaintext);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, encryptEntry, decryptEntry }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
