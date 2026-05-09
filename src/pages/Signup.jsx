import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const TOAST_CONFIG = { position: 'top-right', autoClose: 3000, theme: 'dark' };

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
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
      const message = err.response?.data?.message || 'Signup failed';
      toast.error(message, TOAST_CONFIG);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">
          <span className="text-green-500">&lt;</span>Save
          <span className="text-green-500">Pass</span>
          <span className="text-green-500">/&gt;</span>
        </h1>
        <p className="text-center text-gray-500 mb-8">Create your secure vault</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="rounded-full border border-green-500 w-full p-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-green-400"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email address"
            required
          />
          <input
            className="rounded-full border border-green-500 w-full p-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-green-400"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password (min 8 characters)"
            required
          />
          <input
            className="rounded-full border border-green-500 w-full p-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-green-400"
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            placeholder="Confirm password"
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

        <p className="text-center text-gray-500 mt-6 text-sm">
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
