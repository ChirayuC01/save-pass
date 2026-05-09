import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-slate-800 text-white">
      <div className="mycontainer flex justify-between items-center px-4 py-5">
        <div className="logo font-bold text-2xl">
          <span className="text-green-500">&lt;</span>Save
          <span className="text-green-500">Pass</span>
          <span className="text-green-500">/&gt;</span>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:block">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm bg-green-600 hover:bg-green-500 px-4 py-1.5 rounded-full border border-green-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
