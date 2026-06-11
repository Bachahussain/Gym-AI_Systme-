import React from 'react';
import { Info } from 'lucide-react';

const ExerciseItem = ({ exercise }) => {
    return (
        <div className="bg-purple-700/40 rounded-2xl p-5 flex justify-between items-center">
            <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    {exercise.name}
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full ${exercise.type === "Core" ? "bg-blue-600" : "bg-white text-black"
                            }`}
                    >
                        {exercise.type}
                    </span>
                </h3>
                <p className="text-sm text-gray-300 flex gap-4 mt-1">
                    <span>🔁 {exercise.sets} sets</span>
                    <span>🏋️ {exercise.reps} reps</span>
                    <span>{exercise.equipment}</span>
                </p>
            </div>
            <Info size={18} className="text-gray-300" />
        </div>
    );
};

export default ExerciseItem;
