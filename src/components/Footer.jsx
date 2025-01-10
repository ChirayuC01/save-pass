import React from "react";

const Footer = () => {
  return (
    <div className="bg-slate-800 text-white flex flex-col justify-center items-center  w-full">
      <div className="logo font-bold text-2xl">
        <span className="text-green-500"> &lt;</span>Save
        <span className="text-green-500">Pass</span>
        <span className="text-green-500"> / &gt;</span>
      </div>
      <div className="flex justify-center items-center">
        {" "}
        Created by Chirayu Chawande{" "}
      </div>
    </div>
  );
};

export default Footer;
