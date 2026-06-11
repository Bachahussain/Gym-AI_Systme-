import React from "react";

const Button = ({ children, onClick, className, type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    className={`px-4 py-2 font-medium transition rounded-lg shadow-md duration-200 cursor-pointer ${className}`}
  >
    {children}
  </button>
);

export default Button;
