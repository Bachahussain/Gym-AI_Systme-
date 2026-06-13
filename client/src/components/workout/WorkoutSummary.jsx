import React from 'react';
import { Clock } from 'lucide-react';

const WorkoutSummary = ({ completed, total }) => {
    const percentage = Math.round((completed / total) * 100);

    return (
        <div className="bg-purple-700/40 rounded-2xl p-6 flex justify-between items-center">
            <div>
                <h2 className="text-lg font-semibold">Wednesday - Shoulders</h2>
                <p className="text-sm text-gray-300">{total} exercises planned</p>
            </div>
            <div className="text-right">
                <div className="flex items-center justify-end space-x-2 text-gray-300 text-sm">
                    <Clock size={16} /> <span>Est. 45-60 min</span>
                </div>
                <p className="text-xl font-bold">{percentage}%</p>
                <p className="text-sm text-gray-400">Complete</p>
            </div>
        </div>
    );
};

export default WorkoutSummary;
