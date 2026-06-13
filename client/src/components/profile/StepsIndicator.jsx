import React from 'react';

const StepsIndicator = ({ step }) => {
    return (
        <div className="flex flex-col items-center mb-6">
            {step === 1 && (
                <>
                    <span className="text-2xl mb-1">👤</span>
                    <h2 className="text-lg font-semibold">Profile Setup - Step 1 of 3</h2>
                </>
            )}
            {step === 2 && (
                <>
                    <span className="text-2xl mb-1">🎯</span>
                    <h2 className="text-lg font-semibold">Profile Setup - Step 2 of 3</h2>
                </>
            )}
            {step === 3 && (
                <>
                    <span className="text-2xl mb-1">📅</span>
                    <h2 className="text-lg font-semibold">Profile Setup - Step 3 of 3</h2>
                </>
            )}

            {/* Progress Bar */}
            <div className="flex mt-3 space-x-2">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={`h-2 w-8 rounded-full transition-all ${step >= s ? "bg-pink-500" : "bg-gray-500"
                            }`}
                    ></div>
                ))}
            </div>
        </div>
    );
};

export default StepsIndicator;
