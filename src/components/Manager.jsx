import React, { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

const Manager = () => {
  const ref = useRef();
  const passwordRef = useRef();
  const [form, setForm] = useState({ site: "", username: "", password: "" });
  const [passwordArray, setPasswordArray] = useState([]);

  const getPasswords = async () => {
    // let passwords = localStorage.getItem("passwords");
    // if (passwords) {
    //   setPasswordArray(JSON.parse(passwords));
    // }

    let req = await fetch("https://save-pass-api.vercel.app/");
    let passwords = await req.json();
    console.log(passwords);
    setPasswordArray(passwords);
  };

  useEffect(() => {
    getPasswords();
  }, []);

  const copyText = (text) => {
    toast("Copied to clipboard!", {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
    navigator.clipboard.writeText(text);
  };

  const togglePass = () => {
    passwordRef.current.type = "text";
    ref.current.src.includes("/public/icons/eye.png")
      ? (ref.current.src = "/public/icons/eyecross.png")
      : (ref.current.src = "/public/icons/eye.png") &&
        (passwordRef.current.type = "password");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const savePass = async () => {
    if (
      form.site.length > 3 &&
      form.username.length > 3 &&
      form.password.length > 3
    ) {
      setPasswordArray([...passwordArray, { ...form, id: uuidv4() }]);
      await fetch("https://save-pass-api.vercel.app/", {
        method: "DELETE",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ id: form.id }),
      });

      await fetch("https://save-pass-api.vercel.app/", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ ...form, id: uuidv4() }),
      });
      // localStorage.setItem(
      //   "passwords",
      //   JSON.stringify([...passwordArray, { ...form, id: uuidv4() }])
      // );
      // console.log(passwordArray);
      setForm({ site: "", username: "", password: "" });
      toast.success("Password saved!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } else {
      toast.error("Error: Password not saved", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const deletePass = async (id) => {
    // console.log("deleting id: ", id);
    let c = confirm("Delete?");
    // console.log(c);
    if (c) {
      setPasswordArray(passwordArray.filter((item) => item.id != id));
      let res = await fetch("https://save-pass-api.vercel.app/", {
        method: "DELETE",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      // localStorage.setItem(
      //   "passwords",
      //   JSON.stringify(passwordArray.filter((item) => item.id !== id))
      // );
      toast("Password Deleted!", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };
  const editPass = (id) => {
    // console.log("editing id: ", id);
    setForm({ ...passwordArray.filter((item) => item.id === id)[0], id: id });
    setPasswordArray(passwordArray.filter((item) => item.id != id));
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="absolute inset-0 -z-10 h-full w-full bg-green-50 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-green-400 opacity-20 blur-[100px]"></div>
      </div>
      <div className="p-2 pt-3 md:mycontainer">
        <h1 className="text-4xl font-bold text-center">
          <span className="text-green-500"> &lt;</span>Save
          <span className="text-green-500">Pass</span>
          <span className="text-green-500"> /&gt;</span>
        </h1>
        <p className="text-green-900 text-lg text-center">
          Your own Password Manager
        </p>
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
                  ref={ref}
                  width={26}
                  className="p-1 mr-1"
                  src="/public/icons/eye.png"
                  alt=""
                />
              </span>
            </div>
          </div>
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
            Add Password
          </button>
        </div>
        <div className="passwords">
          <h2 className="py-3 font-bold text-2xl">Your Password</h2>
          {passwordArray.length === 0 ? (
            <div>No Passwords to show</div>
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
                  {passwordArray.map((item, index) => (
                    <tr key={index}>
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
                            onClick={() => {
                              copyText(item.site);
                            }}
                          >
                            <lord-icon
                              style={{
                                width: "25px",
                                height: "25px",
                                paddingTop: "3px",
                                paddingLeft: "3px",
                              }}
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
                            onClick={() => {
                              copyText(item.username);
                            }}
                          >
                            <lord-icon
                              style={{
                                width: "25px",
                                height: "25px",
                                paddingTop: "3px",
                                paddingLeft: "3px",
                              }}
                              src="https://cdn.lordicon.com/iykgtsbt.json"
                              trigger="hover"
                            ></lord-icon>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4 border border-white text-center text-sm md:text-base">
                        <div className="flex items-center justify-center">
                          <span>{"*".repeat(item.password.length)}</span>
                          <div
                            className="lordiconcopy size-7 cursor-pointer ml-2"
                            onClick={() => {
                              copyText(item.password);
                            }}
                          >
                            <lord-icon
                              style={{
                                width: "25px",
                                height: "25px",
                                paddingTop: "3px",
                                paddingLeft: "3px",
                              }}
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
                            onClick={() => {
                              editPass(item.id);
                            }}
                          >
                            <lord-icon
                              src="https://cdn.lordicon.com/gwlusjdu.json"
                              trigger="hover"
                              style={{ width: "25px", height: "25px" }}
                            ></lord-icon>
                          </span>
                          <span
                            className="cursor-pointer mx-1"
                            onClick={() => {
                              deletePass(item.id);
                            }}
                          >
                            <lord-icon
                              src="https://cdn.lordicon.com/skkahier.json"
                              trigger="hover"
                              style={{ width: "25px", height: "25px" }}
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
