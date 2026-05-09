import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import zxcvbn from 'zxcvbn';
import { useAuth } from '../context/AuthContext';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '../types';

const TOAST_CONFIG = { position: 'top-right' as const, autoClose: 3000, theme: 'dark' as const };

const STRENGTH_COLORS = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-green-600'];
const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const strength = form.password ? zxcvbn(form.password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match', TOAST_CONFIG);
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters', TOAST_CONFIG);
      return;
    }
    setSubmitting(true);
    try {
      await signup(form.email, form.password);
      toast.success('Account created!', TOAST_CONFIG);
      navigate('/');
    } catch (err) {
      const message = (err as AxiosError<ApiResponse<null>>).response?.data?.message || 'Signup failed';
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
        <p className="text-center text-gray-500 dark:text-slate-400 mb-8">Create your secure vault</p>

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

          <div>
            <input
              className="rounded-full border border-green-500 w-full p-4 py-2 text-black dark:text-white dark:bg-slate-700 dark:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Master password (min 8 characters)"
              required
            />
            {strength && (
              <div className="px-4 mt-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.score ? STRENGTH_COLORS[strength.score] : 'bg-gray-200 dark:bg-slate-600'}`}
                    />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${strength.score <= 1 ? 'text-red-500' : strength.score <= 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {STRENGTH_LABELS[strength.score]}
                  {strength.feedback.warning ? ` — ${strength.feedback.warning}` : ''}
                </p>
              </div>
            )}
          </div>

          <input
            className="rounded-full border border-green-500 w-full p-4 py-2 text-black dark:text-white dark:bg-slate-700 dark:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            placeholder="Confirm master password"
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2 px-8 border border-green-900 transition-colors"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 p-3 bg-green-50 dark:bg-slate-700 rounded-xl border border-green-200 dark:border-slate-600 text-xs text-green-800 dark:text-green-300">
          Your master password is used to encrypt all stored credentials client-side.
          It is never sent to the server — not even during signup.
        </div>

        <p className="text-center text-gray-500 dark:text-slate-400 mt-5 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
