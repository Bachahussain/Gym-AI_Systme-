import React from 'react';

const StepThree = ({ formData, setFormData, handleChange, prevStep, completeSetup }) => {
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Training Preferences</h3>

            <div className="mb-4">
                <label className="block mb-1 text-sm">Days Available Per Week</label>
                <select
                    name="days"
                    value={formData.days}
                    onChange={handleChange}
                    className="w-full bg-purple-800 border border-white/20 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                    <option value="">Select days</option>
                    <option>3 Days</option>
                    <option>4 Days</option>
                    <option>5 Days</option>
                    <option>6 Days</option>
                </select>
            </div>

            <label className="block mb-2 text-sm font-medium">
                Preferred Training Split
            </label>
            <div className="space-y-3 mb-4">
                {[
                    {
                        value: "Muscle Group Split",
                        desc: "Chest, Back, Shoulders, Arms, Legs",
                    },
                    {
                        value: "Push/Pull/Legs",
                        desc: "Push muscles, Pull muscles, Legs",
                    },
                    {
                        value: "Upper/Lower Split",
                        desc: "Upper body and Lower body alternating",
                    },
                ].map((split) => (
                    <div
                        key={split.value}
                        onClick={() =>
                            setFormData({ ...formData, split: split.value })
                        }
                        className={`p-3 rounded-lg cursor-pointer border transition-all ${formData.split === split.value
                            ? "border-pink-500 bg-pink-500/30"
                            : "border-white/20 bg-white/10"
                            }`}
                    >
                        <p className="font-semibold">{split.value}</p>
                        <p className="text-sm text-gray-300">{split.desc}</p>
                    </div>
                ))}
            </div>

            <div className="mb-4">
                <label className="block mb-1 text-sm">Dietary Preference (e.g., Vegan, Keto, None)</label>
                <input
                    type="text"
                    name="dietary_preference"
                    value={formData.dietary_preference}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="None"
                />
            </div>

            <div className="mb-4">
                <label className="block mb-1 text-sm">Medical Conditions (e.g., Knee pain, None)</label>
                <input
                    type="text"
                    name="medical_conditions"
                    value={formData.medical_conditions}
                    onChange={handleChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="None"
                />
            </div>

            <div className="flex justify-between mt-6">
                <button
                    onClick={prevStep}
                    className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition-all"
                >
                    Back
                </button>
                <button
                    onClick={completeSetup}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition-all"
                >
                    Complete Setup
                </button>
            </div>
        </div>
    );
};

export default StepThree;
