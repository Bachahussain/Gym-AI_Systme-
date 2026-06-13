import React from 'react';
import Button from '../ui/Button';

const ProgressSection = ({ progress, total }) => {
    return (
        <div className="bg-purple-700/40 rounded-2xl p-5">
            <p className="font-semibold">Workout Progress</p>
            <p className="text-sm text-gray-300">{progress} of {total} exercises completed</p>
            <div className="mt-3">
                <Button className="bg-green-600 hover:bg-green-700 text-white">Finish Early</Button>
            </div>
        </div>
    );
};

export default ProgressSection;
