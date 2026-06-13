import React from 'react';

const COLORS = [
    { border: 'border-orange-500/25', glow: 'hover:shadow-orange-500/10', icon: 'bg-orange-500/10 text-orange-400' },
    { border: 'border-blue-500/25', glow: 'hover:shadow-blue-500/10', icon: 'bg-blue-500/10   text-blue-400' },
    { border: 'border-yellow-500/25', glow: 'hover:shadow-yellow-500/10', icon: 'bg-yellow-500/10 text-yellow-400' },
    { border: 'border-emerald-500/25', glow: 'hover:shadow-emerald-500/10', icon: 'bg-emerald-500/10 text-emerald-400' },
];

const StatsGrid = ({ stats }) => (
    <div className={`grid gap-5 mb-8 ${stats.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {stats.map((stat, i) => {
            const c = COLORS[i % COLORS.length];
            // Split value into number + label (e.g. "3 days" → "3" + "days")
            const parts = String(stat.value).split(' ');
            const num = parts[0];
            const unit = parts.slice(1).join(' ');
            return (
                <div
                    key={i}
                    className={`group relative p-6 bg-slate-900/50 backdrop-blur-xl border ${c.border} rounded-[2rem] shadow-xl hover:shadow-2xl ${c.glow} transition-all duration-300 hover:scale-[1.02] overflow-hidden`}
                >
                    {/* Subtle radial bg */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                    <div className={`w-11 h-11 ${c.icon} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                        {stat.icon}
                    </div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.title}</p>
                    <p className="text-3xl font-black text-white leading-none">{num}</p>
                    {unit && <p className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mt-1">{unit}</p>}
                </div>
            );
        })}
    </div>
);

export default StatsGrid;
