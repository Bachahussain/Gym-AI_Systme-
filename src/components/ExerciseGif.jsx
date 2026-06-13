import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Loader2, Image as ImageIcon } from 'lucide-react';

const ExerciseGif = ({ exerciseName }) => {
    const [gifUrl, setGifUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(false);

        apiClient.get(`/api/exercise/gif?name=${encodeURIComponent(exerciseName)}&t=${Date.now()}`)
        .then(res => {
            if (isMounted) {
                setGifUrl(res.data.gifUrl);
                setLoading(false);
            }
        })
        .catch(err => {
            if (isMounted) {
                console.error("Failed to load GIF for:", exerciseName, err);
                setError(true);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [exerciseName]);

    if (loading) {
        return (
            <div className="w-full aspect-square md:aspect-video bg-slate-800/50 rounded-xl flex items-center justify-center border border-white/5 animate-pulse">
                <Loader2 className="w-6 h-6 text-purple-500/50 animate-spin" />
            </div>
        );
    }

    if (error || !gifUrl) {
        return (
            <div className="w-full aspect-square md:aspect-video bg-slate-800/30 rounded-xl flex flex-col items-center justify-center border border-white/5 text-slate-500">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-medium px-4 text-center">Visual guide unavailable</span>
            </div>
        );
    }

    return (
        <div className="w-full relative rounded-xl overflow-hidden bg-white">
            {/* The RapidAPI ExerciseDB GIFs have a white background, so a white container looks best */}
            <img 
                src={gifUrl} 
                alt={exerciseName} 
                className="w-full h-full object-contain mix-blend-multiply"
                loading="lazy"
            />
        </div>
    );
};

export default ExerciseGif;
