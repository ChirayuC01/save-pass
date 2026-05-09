import { useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import zxcvbn from 'zxcvbn';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { checkBreached } from '../utils/crypto';
import { useDebounce } from '../hooks/useDebounce';
import { SkeletonTable } from './SkeletonTable';
import { PasswordGenerator } from './PasswordGenerator';
import type { PasswordEntry, EncryptedEntry, ApiResponse } from '../types';

const TOAST = { position: 'top-right' as const, autoClose: 2000, theme: 'dark' as const };

const STRENGTH_COLORS = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-600'];
const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];

const PasswordStrengthBar = ({ password }: { password: string }) => {
  if (!password) return null;
  const { score } = zxcvbn(password);
  return (
    <div className="w-full px-1 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? STRENGTH_COLORS[score] : 'bg-gray-200 dark:bg-slate-600'}`}
          />
        ))}
      </div>
      <p className={`text-xs mt-1 ${score <= 1 ? 'text-red-500' : score <= 2 ? 'text-yellow-600' : 'text-green-600'}`}>
        {STRENGTH_LABELS[score]}
      </p>
    </div>
  );
};

const INPUT_CLS = 'rounded-full border border-green-500 dark:border-green-600 w-full text-black dark:text-white dark:bg-slate-700 p-4 py-1 focus:outline-none focus:ring-2 focus:ring-green-400';

const Manager = () => {
  const { encryptEntry, decryptEntry, logout } = useAuth();
  const queryClient = useQueryClient();
  const eyeRef = useRef<HTMLImageElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ site: '', username: '', password: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [checkingBreach, setCheckingBreach] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  // ─── Data fetching ────────────────────────────────────────────────────────────

  const fetchPasswords = useCallback(async (): Promise<PasswordEntry[]> => {
    const { data } = await client.get<ApiResponse<EncryptedEntry[]>>('/api/v1/passwords/');
    return Promise.all(
      data.data.map(async (entry) => {
        try {
          const plain = await decryptEntry(entry);
          return { _id: entry._id, ...plain, createdAt: entry.createdAt };
        } catch {
          return { _id: entry._id, site: '[decryption failed]', username: '—', password: '', createdAt: entry.createdAt };
        }
      })
    );
  }, [decryptEntry]);

  const { data: passwordArray = [], isLoading } = useQuery<PasswordEntry[]>({
    queryKey: ['passwords'],
    queryFn: fetchPasswords,
    throwOnError: (err: unknown) => {
      if ((err as { response?: { status?: number } }).response?.status === 401) {
        logout();
      }
      return false;
    },
  });

  // ─── Mutations ────────────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: async (encrypted: { encryptedData: string; iv: string }) => {
      const { data } = await client.post<ApiResponse<EncryptedEntry>>('/api/v1/passwords/', encrypted);
      return data.data;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<PasswordEntry[]>(['passwords'], (prev = []) => [
        { _id: saved._id, ...form, createdAt: saved.createdAt },
        ...prev,
      ]);
      setForm({ site: '', username: '', password: '' });
      toast.success('Password saved!', TOAST);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Failed to save password', TOAST);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, encrypted }: { id: string; encrypted: { encryptedData: string; iv: string } }) => {
      const { data } = await client.put<ApiResponse<EncryptedEntry>>(`/api/v1/passwords/${id}`, encrypted);
      return data.data;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<PasswordEntry[]>(['passwords'], (prev = []) =>
        prev.map((p) =>
          p._id === saved._id
            ? { _id: saved._id, ...form, createdAt: saved.createdAt }
            : p
        )
      );
      setForm({ site: '', username: '', password: '' });
      setEditingId(null);
      toast.success('Password updated!', TOAST);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Failed to update password', TOAST);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.delete(`/api/v1/passwords/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['passwords'] });
      const previous = queryClient.getQueryData<PasswordEntry[]>(['passwords']);
      queryClient.setQueryData<PasswordEntry[]>(['passwords'], (prev = []) =>
        prev.filter((item) => item._id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['passwords'], context?.previous);
      toast.error('Failed to delete', TOAST);
    },
    onSuccess: () => toast('Password deleted!', TOAST),
  });

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const copyText = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast('Copied to clipboard!', TOAST);
  };

  const togglePass = () => {
    if (!passwordRef.current || !eyeRef.current) return;
    const isHidden = passwordRef.current.type === 'password';
    passwordRef.current.type = isHidden ? 'text' : 'password';
    eyeRef.current.src = isHidden ? '/icons/eyecross.png' : '/icons/eye.png';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const savePass = async () => {
    if (form.site.length <= 3 || form.username.length <= 3 || form.password.length <= 3) {
      toast.error('All fields must be longer than 3 characters', TOAST);
      return;
    }

    setCheckingBreach(true);
    const breached = await checkBreached(form.password);
    setCheckingBreach(false);
    if (breached) {
      toast.warn(
        'This password appears in a data breach. Consider using a stronger password.',
        { ...TOAST, autoClose: 6000 }
      );
    }

    const encrypted = await encryptEntry({ site: form.site, username: form.username, password: form.password });

    if (editingId) {
      updateMutation.mutate({ id: editingId, encrypted });
    } else {
      addMutation.mutate(encrypted);
    }
  };

  const deletePass = (id: string) => {
    if (!confirm('Delete this password?')) return;
    deleteMutation.mutate(id);
  };

  const editPass = (item: PasswordEntry) => {
    setForm({ site: item.site, username: item.username, password: item.password });
    setEditingId(item._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setForm({ site: '', username: '', password: '' });
    setEditingId(null);
  };

  const isSaving = addMutation.isPending || updateMutation.isPending || checkingBreach;

  // ─── Search filter ────────────────────────────────────────────────────────────

  const filtered = debouncedSearch
    ? passwordArray.filter(
        (p) =>
          p.site.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.username.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : passwordArray;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="absolute inset-0 -z-10 h-full w-full bg-green-50 dark:bg-slate-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-green-400 opacity-20 blur-[100px]" />
      </div>

      <div className="p-2 pt-3 md:mycontainer">
        <h1 className="text-4xl font-bold text-center dark:text-white">
          <span className="text-green-500">&lt;</span>Save
          <span className="text-green-500">Pass</span>
          <span className="text-green-500">/&gt;</span>
        </h1>
        <p className="text-green-900 dark:text-green-400 text-lg text-center">Your own Password Manager</p>

        {/* ─── Form ─── */}
        <div className="flex flex-col p-4 gap-6 text-black items-center">
          <input
            className={INPUT_CLS}
            type="text"
            value={form.site}
            onChange={handleChange}
            name="site"
            placeholder="Enter Website URL"
          />
          <div className="flex flex-col md:flex-row w-full gap-6 justify-between">
            <input
              className={INPUT_CLS}
              type="text"
              value={form.username}
              onChange={handleChange}
              name="username"
              placeholder="Enter Username"
            />
            <div className="w-full">
              <div className="relative">
                <input
                  ref={passwordRef}
                  className={INPUT_CLS}
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  name="password"
                  placeholder="Enter Password"
                />
                <span className="absolute right-[3px] top-[3px] cursor-pointer" onClick={togglePass}>
                  <img ref={eyeRef} width={26} className="p-1 mr-1" src="/icons/eye.png" alt="Toggle visibility" />
                </span>
              </div>
              <PasswordStrengthBar password={form.password} />
              <PasswordGenerator onUse={(pw) => setForm((f) => ({ ...f, password: pw }))} />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={savePass}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-full px-8 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-black border border-green-900 transition-colors"
            >
              <lord-icon
                src="https://cdn.lordicon.com/sbnjyzil.json"
                trigger="hover"
                stroke="bold"
                colors="primary:#121331,secondary:#000000"
              />
              {checkingBreach ? 'Checking breach…' : editingId ? 'Update Password' : 'Add Password'}
            </button>
            {editingId && (
              <button
                onClick={cancelEdit}
                className="rounded-full px-6 py-2 border border-gray-400 dark:border-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* ─── Password list ─── */}
        <div className="passwords mt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
            <h2 className="font-bold text-2xl dark:text-white">Your Passwords</h2>
            {passwordArray.length > 0 && (
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search site or username…"
                className="rounded-full border border-green-500 dark:border-green-600 px-4 py-1 text-sm text-black dark:text-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-400 w-full sm:w-64"
              />
            )}
          </div>

          {isLoading ? (
            <SkeletonTable rows={3} />
          ) : filtered.length === 0 ? (
            <div className="text-gray-500 dark:text-slate-400 py-8 text-center">
              {search ? 'No matching passwords' : 'No passwords saved yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto min-w-full overflow-hidden rounded-md">
                <thead className="bg-green-800 text-white">
                  <tr>
                    <th className="py-2 px-4 text-sm md:text-base">Site</th>
                    <th className="py-2 px-4 text-sm md:text-base">Username</th>
                    <th className="py-2 px-4 text-sm md:text-base">Password</th>
                    <th className="py-2 px-4 text-sm md:text-base">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-green-50 dark:bg-slate-800">
                  {filtered.map((item) => (
                    <tr key={item._id} className={editingId === item._id ? 'opacity-40' : ''}>
                      <td className="py-2 px-4 border border-white dark:border-slate-700 text-center text-sm md:text-base dark:text-slate-200">
                        <div className="flex items-center justify-center gap-1">
                          <a href={item.site} target="_blank" rel="noopener noreferrer" className="truncate max-w-[160px] hover:underline">
                            {item.site}
                          </a>
                          <button onClick={() => copyText(item.site)} title="Copy site" className="shrink-0">
                            <lord-icon style={{ width: '22px', height: '22px' }} src="https://cdn.lordicon.com/iykgtsbt.json" trigger="hover" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-4 border border-white dark:border-slate-700 text-center text-sm md:text-base dark:text-slate-200">
                        <div className="flex items-center justify-center gap-1">
                          <span className="truncate max-w-[160px]">{item.username}</span>
                          <button onClick={() => copyText(item.username)} title="Copy username" className="shrink-0">
                            <lord-icon style={{ width: '22px', height: '22px' }} src="https://cdn.lordicon.com/iykgtsbt.json" trigger="hover" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-4 border border-white dark:border-slate-700 text-center text-sm md:text-base dark:text-slate-200">
                        <div className="flex items-center justify-center gap-1">
                          <span>{'•'.repeat(Math.min(item.password.length, 12))}</span>
                          <button onClick={() => copyText(item.password)} title="Copy password" className="shrink-0">
                            <lord-icon style={{ width: '22px', height: '22px' }} src="https://cdn.lordicon.com/iykgtsbt.json" trigger="hover" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-4 border border-white dark:border-slate-700 text-center text-sm md:text-base">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => editPass(item)} title="Edit">
                            <lord-icon src="https://cdn.lordicon.com/gwlusjdu.json" trigger="hover" style={{ width: '24px', height: '24px' }} />
                          </button>
                          <button onClick={() => deletePass(item._id)} title="Delete">
                            <lord-icon src="https://cdn.lordicon.com/skkahier.json" trigger="hover" style={{ width: '24px', height: '24px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Manager;
