import React from 'react';

const StepOne = ({ formData, handleChange, nextStep }) => {
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Tell us about yourself</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1 text-sm">Age</label>
                    <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="19"
                    />
                </div>
                <div>
                    <label className="block mb-1 text-sm">Weight (kg)</label>
                    <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="65"
                    />
                </div>
                <div>
                    <label className="block mb-1 text-sm">Height (cm)</label>
                    <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="179"
                    />
                </div>
                <div>
                    <label className="block mb-1 text-sm">Gender</label>
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full bg-purple-800 border border-white/20 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                        <option value="">Select gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end mt-6">
                <button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition-all"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default StepOne;
