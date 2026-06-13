import React from 'react';

const ContactForm = () => {
    return (
        <form className="flex flex-col gap-4">
            <input
                type="text"
                placeholder="Full Name"
                className="w-full p-3 bg-purple-800 rounded-lg text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                required
            />
            <input
                type="email"
                placeholder="Email"
                className="w-full p-3 bg-purple-800 rounded-lg text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                required
            />
            <textarea
                rows="4"
                placeholder="Your Message"
                className="w-full p-3 bg-purple-800 rounded-lg text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                required
            ></textarea>

            <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-sm font-semibold shadow-md transition-all duration-200"
            >
                Send Message
            </button>
        </form>
    );
};

export default ContactForm;
