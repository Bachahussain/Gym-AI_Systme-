import React from 'react';

const StepTwo = ({ formData, setFormData, handleChange, nextStep, prevStep }) => {
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">
                What are your fitness goals?
            </h3>
            <div className="space-y-3">
                {[
                    { value: "Fat Loss", desc: "Burn fat and get lean" },
                    { value: "Athletic Performance", desc: "Improve strength and power" },
                    { value: "Bodybuilding", desc: "Build muscle mass and size" },
                ].map((goal) => (
                    <div
                        key={goal.value}
                        onClick={() =>
                            setFormData({ ...formData, goal: goal.value })
                        }
                        className={`p-3 rounded-lg cursor-pointer border transition-all ${formData.goal === goal.value
                                ? "border-pink-500 bg-pink-500/30"
                                : "border-white/20 bg-white/10"
                            }`}
                    >
                        <p className="font-semibold">{goal.value}</p>
                        <p className="text-sm text-gray-300">{goal.desc}</p>
                    </div>
                ))}
            </div>

            <div className="mt-5">
                <label className="block mb-1 text-sm">Training Experience</label>
                <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full bg-purple-800 border border-white/20 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                    <option value="">Select experience level</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                </select>
            </div>

            <div className="flex justify-between mt-6">
                <button
                    onClick={prevStep}
                    className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition-all"
                >
                    Back
                </button>
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

export default StepTwo;
