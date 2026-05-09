export interface User {
  _id: string;
  email: string;
}

export interface PasswordEntry {
  _id: string;
  site: string;
  username: string;
  password: string;
  createdAt: string;
}

export interface EncryptedEntry {
  _id: string;
  encryptedData: string;
  iv: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  encryptEntry: (credential: Omit<PasswordEntry, '_id' | 'createdAt'>) => Promise<{ encryptedData: string; iv: string }>;
  decryptEntry: (entry: Pick<EncryptedEntry, 'encryptedData' | 'iv'>) => Promise<Omit<PasswordEntry, '_id' | 'createdAt'>>;
}
