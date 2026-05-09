import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '../types';

const TOAST_CONFIG = { position: 'top-right' as const, autoClose: 3000, theme: 'dark' as const };

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      const message = (err as AxiosError<ApiResponse<null>>).response?.data?.message || 'Login failed';
      toast.error(message, TOAST_CONFIG);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 dark:bg-slate-900 flex items-center justify-center bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 dark:text-white">
          <span className="text-green-500">&lt;</span>Save
          <span className="text-green-500">Pass</span>
          <span className="text-green-500">/&gt;</span>
        </h1>
        <p className="text-center text-gray-500 dark:text-slate-400 mb-8">Sign in to your vault</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="rounded-full border border-green-500 w-full p-4 py-2 text-black dark:text-white dark:bg-slate-700 dark:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email address"
            required
          />
          <input
            className="rounded-full border border-green-500 w-full p-4 py-2 text-black dark:text-white dark:bg-slate-700 dark:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2 px-8 border border-green-900 transition-colors"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-gray-500 dark:text-slate-400 mt-6 text-sm">
          No account?{' '}
          <Link to="/signup" className="text-green-600 font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
