import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
  </svg>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <nav className="bg-slate-800 dark:bg-slate-900 text-white">
      <div className="mycontainer flex justify-between items-center px-4 py-4">
        <div className="font-bold text-2xl">
          <span className="text-green-500">&lt;</span>Save
          <span className="text-green-500">Pass</span>
          <span className="text-green-500">/&gt;</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-1.5 rounded-full hover:bg-slate-700 dark:hover:bg-slate-700 transition-colors text-slate-300"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {user && (
            <>
              <span className="text-sm text-slate-400 hidden sm:block">{user.email}</span>
              <button
                onClick={logout}
                className="text-sm bg-green-600 hover:bg-green-500 px-4 py-1.5 rounded-full border border-green-700 transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
