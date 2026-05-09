import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Manager from './components/Manager';
import Login from './pages/Login';
import Signup from './pages/Signup';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 dark:bg-slate-900">
        <div className="text-green-700 dark:text-green-400 font-semibold text-lg">Loading…</div>
      </div>
    );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
};

const DashboardLayout = () => (
  <>
    <Navbar />
    <div className="min-h-[82.5vh] bg-green-50 dark:bg-slate-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
      <Manager />
    </div>
    <Footer />
  </>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={2000} newestOnTop theme="dark" />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
