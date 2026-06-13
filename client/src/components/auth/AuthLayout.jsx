import React from 'react';
import { Dumbbell } from 'lucide-react';

const AuthLayout = ({ children }) => {
    return (
        <section className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Ambient background blobs */}
            <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-violet-700/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Branding — top left */}
            <div className="absolute top-8 left-8 flex items-center gap-2.5 select-none">
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Dumbbell className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-black text-lg tracking-tight">
                    GYM<span className="text-purple-400">AI</span>
                </span>
            </div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-md mx-auto px-4">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.07] rounded-[2.5rem] p-10 shadow-2xl">
                    {children}
                </div>
            </div>
        </section>
    );
};

export default AuthLayout;
