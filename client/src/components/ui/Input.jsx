import React from "react";

const Input = ({ type = "text", placeholder, value, onChange, required = false, className, name }) => {
    return (
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            className={`w-full p-3 bg-purple-800 rounded-lg text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-500 outline-none ${className}`}
        />
    );
};

export default Input;
