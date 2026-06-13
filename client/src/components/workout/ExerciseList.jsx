import React from 'react';
import ExerciseItem from './ExerciseItem';

const ExerciseList = ({ exercises }) => {
    return (
        <div className="space-y-4">
            {exercises.map((ex, i) => (
                <ExerciseItem key={i} exercise={ex} />
            ))}
        </div>
    );
};

export default ExerciseList;
