import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import client from '../api/client';

const TOAST_CONFIG = {
  position: 'top-right',
  autoClose: 2000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'dark',
};

const Manager = () => {
  const eyeRef = useRef();
  const passwordRef = useRef();
  const [form, setForm] = useState({ site: '', username: '', password: '' });
  const [passwordArray, setPasswordArray] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const getPasswords = async () => {
    const { data } = await client.get('/api/v1/passwords/');
    setPasswordArray(data.data);
  };

  useEffect(() => {
    getPasswords();
  }, []);

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast('Copied to clipboard!', TOAST_CONFIG);
  };

  const togglePass = () => {
    const isHidden = passwordRef.current.type === 'password';
    passwordRef.current.type = isHidden ? 'text' : 'password';
    eyeRef.current.src = isHidden ? '/icons/eyecross.png' : '/icons/eye.png';
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const savePass = async () => {
    if (form.site.length <= 3 || form.username.length <= 3 || form.password.length <= 3) {
      toast.error('All fields must be longer than 3 characters', TOAST_CONFIG);
      return;
    }

    try {
      if (editingId) {
        const { data } = await client.put(`/api/v1/passwords/${editingId}`, {
          site: form.site,
          username: form.username,
          password: form.password,
        });
        setPasswordArray(passwordArray.map((p) => (p._id === editingId ? data.data : p)));
        setEditingId(null);
      } else {
        const { data } = await client.post('/api/v1/passwords/', {
          site: form.site,
          username: form.username,
          password: form.password,
        });
        setPasswordArray([data.data, ...passwordArray]);
      }
      setForm({ site: '', username: '', password: '' });
      toast.success('Password saved!', TOAST_CONFIG);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save password';
      toast.error(message, TOAST_CONFIG);
    }
  };

  const deletePass = async (id) => {
    if (!confirm('Delete this password?')) return;
    try {
      setPasswordArray(passwordArray.filter((item) => item._id !== id));
      await client.delete(`/api/v1/passwords/${id}`);
      toast('Password deleted!', TOAST_CONFIG);
    } catch (err) {
      toast.error('Failed to delete password', TOAST_CONFIG);
      getPasswords();
    }
  };

  const editPass = (item) => {
    setForm({ site: item.site, username: item.username, password: item.password });
    setEditingId(item._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="absolute inset-0 -z-10 h-full w-full bg-green-50 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-green-400 opacity-20 blur-[100px]"></div>
      </div>
      <div className="p-2 pt-3 md:mycontainer">
        <h1 className="text-4xl font-bold text-center">
          <span className="text-green-500">&lt;</span>Save
          <span className="text-green-500">Pass</span>
          <span className="text-green-500">/&gt;</span>
        </h1>
        <p className="text-green-900 text-lg text-center">Your own Password Manager</p>

        <div className="flex flex-col p-4 gap-8 text-black items-center">
          <input
            className="rounded-full border border-green-500 w-full text-black p-4 py-1"
            type="text"
            value={form.site}
            onChange={handleChange}
            name="site"
            placeholder="Enter Website URL"
            id="site"
          />
          <div className="flex flex-col md:flex-row w-full gap-8 justify-between">
            <input
              className="rounded-full border border-green-500 w-full text-black p-4 py-1"
              type="text"
              value={form.username}
              onChange={handleChange}
              name="username"
              placeholder="Enter Username"
              id="username"
            />
            <div className="relative">
              <input
                ref={passwordRef}
                className="rounded-full border border-green-500 w-full text-black p-4 py-1"
                type="password"
                value={form.password}
                onChange={handleChange}
                name="password"
                placeholder="Enter Password"
                id="password"
              />
              <span
                className="absolute right-[3px] top-[3px] cursor-pointer"
                onClick={togglePass}
              >
                <img
                  ref={eyeRef}
                  width={26}
                  className="p-1 mr-1"
                  src="/icons/eye.png"
                  alt="Toggle password visibility"
                />
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={savePass}
              className="text-black flex justify-center items-center rounded-full gap-2 px-8 py-2 bg-green-600 hover:bg-green-500 w-fit border border-green-900"
            >
              <lord-icon
                src="https://cdn.lordicon.com/sbnjyzil.json"
                trigger="hover"
                stroke="bold"
                colors="primary:#121331,secondary:#000000"
              ></lord-icon>
              {editingId ? 'Update Password' : 'Add Password'}
            </button>
            {editingId && (
              <button
                onClick={() => { setForm({ site: '', username: '', password: '' }); setEditingId(null); }}
                className="rounded-full gap-2 px-6 py-2 border border-gray-400 hover:bg-gray-100 text-gray-600 w-fit"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="passwords">
          <h2 className="py-3 font-bold text-2xl">Your Passwords</h2>
          {passwordArray.length === 0 ? (
            <div className="text-gray-500 py-4">No passwords saved yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-auto min-w-full overflow-hidden rounded-md pb-4">
                <thead className="bg-green-800 text-white">
                  <tr>
                    <th className="py-2 px-4 text-sm md:text-base">Site</th>
                    <th className="py-2 px-4 text-sm md:text-base">Username</th>
                    <th className="py-2 px-4 text-sm md:text-base">Password</th>
                    <th className="py-2 px-4 text-sm md:text-base">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-green-50">
                  {passwordArray.map((item) => (
                    <tr key={item._id} className={editingId === item._id ? 'opacity-40' : ''}>
                      <td className="py-2 px-4 border border-white text-center text-sm md:text-base">
                        <div className="flex items-center justify-center">
                          <a
                            href={item.site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate"
                          >
                            {item.site}
                          </a>
                          <div
                            className="lordiconcopy size-7 cursor-pointer ml-2"
                            onClick={() => copyText(item.site)}
                          >
                            <lord-icon
                              style={{ width: '25px', height: '25px', paddingTop: '3px', paddingLeft: '3px' }}
                              src="https://cdn.lordicon.com/iykgtsbt.json"
                              trigger="hover"
                            ></lord-icon>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4 border border-white text-center text-sm md:text-base">
                        <div className="flex items-center justify-center">
                          <span>{item.username}</span>
                          <div
                            className="lordiconcopy size-7 cursor-pointer ml-2"
                            onClick={() => copyText(item.username)}
                          >
                            <lord-icon
                              style={{ width: '25px', height: '25px', paddingTop: '3px', paddingLeft: '3px' }}
                              src="https://cdn.lordicon.com/iykgtsbt.json"
                              trigger="hover"
                            ></lord-icon>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4 border border-white text-center text-sm md:text-base">
                        <div className="flex items-center justify-center">
                          <span>{'*'.repeat(item.password.length)}</span>
                          <div
                            className="lordiconcopy size-7 cursor-pointer ml-2"
                            onClick={() => copyText(item.password)}
                          >
                            <lord-icon
                              style={{ width: '25px', height: '25px', paddingTop: '3px', paddingLeft: '3px' }}
                              src="https://cdn.lordicon.com/iykgtsbt.json"
                              trigger="hover"
                            ></lord-icon>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4 border border-white text-center text-sm md:text-base">
                        <div className="flex justify-center">
                          <span
                            className="cursor-pointer mx-1"
                            onClick={() => editPass(item)}
                          >
                            <lord-icon
                              src="https://cdn.lordicon.com/gwlusjdu.json"
                              trigger="hover"
                              style={{ width: '25px', height: '25px' }}
                            ></lord-icon>
                          </span>
                          <span
                            className="cursor-pointer mx-1"
                            onClick={() => deletePass(item._id)}
                          >
                            <lord-icon
                              src="https://cdn.lordicon.com/skkahier.json"
                              trigger="hover"
                              style={{ width: '25px', height: '25px' }}
                            ></lord-icon>
                          </span>
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
