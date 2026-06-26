import React from 'react';
import { CheckCircle2, Lock } from 'lucide-react';

const WeeklySplit = ({ weeklySplit, onDayClick, todayActiveDay, currentDayIndex }) => {
    const getDayState = (idx, done) => {
        if (done) return 'completed';
        if (idx > currentDayIndex) return 'future';  // future day
        if (todayActiveDay !== null && todayActiveDay !== idx) return 'blocked'; // different day started today
        return 'available';
    };

    return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] p-8 shadow-2xl h-full flex flex-col">
        <div className="flex items-center justify-between mb-7">
            <div>
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    This Week's Split
                </h2>
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1 ml-4">
                    {weeklySplit.filter(d => d.status === 'Completed').length}/{weeklySplit.length} sessions done
                </p>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tap a day to open</p>
        </div>

        <div className="space-y-3 flex-grow">
            {weeklySplit.map((day, i) => {
                const done = day.status === 'Completed';
                const num = day.day.match(/\d+/)?.[0] || (i + 1);
                const state = getDayState(i, done);
                const isLocked = state === 'future' || state === 'blocked';

                return (
                    <button
                        type="button"
                        key={i}
                        onClick={() => !isLocked && onDayClick?.(i)}
                        disabled={isLocked}
                        aria-label={`Open ${day.day} ${day.focus}`}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 w-full text-left ${
                            state === 'completed'
                                ? 'bg-emerald-500/8 border-emerald-500/20 cursor-pointer group'
                                : state === 'future'
                                    ? 'bg-slate-900/40 border-white/[0.03] opacity-50 cursor-not-allowed'
                                    : state === 'blocked'
                                        ? 'bg-slate-900/40 border-amber-500/10 opacity-60 cursor-not-allowed'
                                        : 'bg-slate-800/20 border-white/5 hover:border-slate-600 hover:bg-slate-800/30 cursor-pointer group'
                        }`}
                    >
                        {/* Day bubble */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm transition-all ${
                            state === 'completed' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                            : state === 'future' ? 'bg-slate-800 text-slate-700'
                            : state === 'blocked' ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'
                        }`}>
                            {state === 'completed' ? <CheckCircle2 className="w-5 h-5" />
                             : state === 'future' ? <Lock className="w-4 h-4" />
                             : state === 'blocked' ? <Lock className="w-4 h-4" />
                             : `D${num}`}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-black tracking-tight truncate ${
                                state === 'completed' ? 'text-emerald-300'
                                : state === 'future' ? 'text-slate-600'
                                : state === 'blocked' ? 'text-slate-500'
                                : 'text-white'
                            }`}>{day.focus}</p>
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{day.day} session</p>
                        </div>

                        {/* Badge */}
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide shrink-0 ${
                            state === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : state === 'future' ? 'bg-slate-800/60 text-slate-700 border border-white/5'
                            : state === 'blocked' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-slate-800/60 text-slate-600 border border-white/5'
                        }`}>
                            {state === 'completed' ? 'Done'
                             : state === 'future' ? 'Locked'
                             : state === 'blocked' ? 'Try Tomorrow'
                             : 'Pending'}
                        </span>
                    </button>
                );
            })}
        </div>

        {/* Progress bar */}
        {weeklySplit.length > 0 && (
            <div className="mt-6 pt-5 border-t border-white/5">
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.round((weeklySplit.filter(d => d.status === 'Completed').length / weeklySplit.length) * 100)}%` }}
                    />
                </div>
            </div>
        )}
    </div>
);
};
export default WeeklySplit;
