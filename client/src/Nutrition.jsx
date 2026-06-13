import React, { useState, useEffect } from 'react';
import Header from './components/home/Header';
import axios from 'axios';
import {
    Utensils, Apple, Droplets, Flame, Coffee,
    Sun, Moon, Cookie, ChevronRight, Sparkles, Zap, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MEALS = [
    {
        key: 'breakfast', label: 'Breakfast', icon: Coffee, time: '7:00 AM',
        accent: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25', glow: 'shadow-amber-500/10', ring: '#f59e0b' }
    },
    {
        key: 'lunch', label: 'Lunch', icon: Sun, time: '12:30 PM',
        accent: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', glow: 'shadow-emerald-500/10', ring: '#10b981' }
    },
    {
        key: 'snack', label: 'Snack', icon: Cookie, time: '3:30 PM',
        accent: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25', glow: 'shadow-orange-500/10', ring: '#f97316' }
    },
    {
        key: 'dinner', label: 'Dinner', icon: Moon, time: '7:00 PM',
        accent: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/25', glow: 'shadow-indigo-500/10', ring: '#818cf8' }
    },
];

/* svg donut ring */
const MacroRing = ({ pct, color, size = 72 }) => {
    const r = 26, circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <svg width={size} height={size} viewBox="0 0 64 64" className="-rotate-90">
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
                strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
    );
};

const Nutrition = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('Athlete');
    const [dietPlan, setDietPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(0);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [userRes, planRes] = await Promise.all([
                axios.get('http://localhost:3000/user/me', { withCredentials: true }),
                axios.get('http://localhost:3000/api/my-plans', { withCredentials: true }),
            ]);
            setUserName(userRes.data.name);
            if (planRes.data.dietPlan) setDietPlan(planRes.data.dietPlan);
        } catch (err) {
            console.error('Failed to fetch nutrition:', err);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        axios.post('http://localhost:3000/auth/logout', {}, { withCredentials: true })
            .then(() => navigate('/'))
            .catch(console.error);
    };

    const day = dietPlan?.[selectedDay];
    const mealCals = MEALS.map(m => day?.[m.key]?.calories || 0);
    const totalCals = mealCals.reduce((a, b) => a + b, 0);
    const target = day?.total_daily_calories || 1;
    const pct = Math.min(100, Math.round((totalCals / target) * 100));

    return (
        <div className="bg-[#0f172a] min-h-screen text-slate-100 font-sans selection:bg-emerald-500/30">
            {/* Ambient blobs */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] right-[-15%] w-[55%] h-[55%] bg-emerald-600/6 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-15%] left-[-15%] w-[50%] h-[50%] bg-teal-600/6 rounded-full blur-[150px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-emerald-500/3 rounded-full blur-[100px]" />
            </div>

            <Header name={userName} logout={logout} />

            <main className="container mx-auto px-4 py-10 max-w-7xl animate-in fade-in duration-700" style={{ paddingBottom: '8rem' }}>

                {/* ── PAGE HEADING ── */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 text-emerald-400 font-black text-[9px] tracking-[0.4em] mb-3 uppercase">
                        <div className="w-8 h-[2px] bg-emerald-500" />
                        AI Nutrition Protocol
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-none mb-2">
                        Nutritional<br />
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Strategy</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-3">
                        Neural-optimized macro &amp; micro distribution tailored to your biometrics
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse" />
                            <div className="relative p-10 bg-slate-900 border border-emerald-500/20 rounded-[3rem] shadow-2xl">
                                <Utensils className="w-14 h-14 text-emerald-400 animate-bounce" />
                            </div>
                        </div>
                        <p className="text-slate-500 font-black uppercase tracking-[0.25em] text-xs">Synthesizing Macro Data...</p>
                    </div>

                ) : dietPlan ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* ── SIDEBAR ── */}
                        <aside className="lg:col-span-4 space-y-5">

                            {/* Macro overview card */}
                            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.07] rounded-[2rem] p-7 shadow-2xl">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 border-l-2 border-emerald-500 pl-3">
                                    Daily Overview
                                </p>

                                {/* Big calorie + ring */}
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="relative shrink-0">
                                        <MacroRing pct={pct} color="#10b981" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xs font-black text-white">{pct}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-black text-white leading-none">{target}</p>
                                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">kcal / day target</p>
                                        <p className="text-xs text-emerald-400 font-bold mt-2">{totalCals} kcal from meals</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                                        <span className="text-slate-600">Consumption</span>
                                        <span className="text-slate-500">{totalCals} / {target}</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                                            style={{ width: `${pct}%` }} />
                                    </div>
                                </div>

                                {/* Macro chips */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-emerald-500/8 border border-emerald-500/15 rounded-2xl">
                                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <Zap className="w-3 h-3" /> Protein
                                        </p>
                                        <p className="text-base font-black text-emerald-400">{day?.protein_intake || '—'}</p>
                                    </div>
                                    <div className="p-4 bg-blue-500/8 border border-blue-500/15 rounded-2xl">
                                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <Droplets className="w-3 h-3" /> Hydration
                                        </p>
                                        <p className="text-base font-black text-blue-400">{day?.water_intake || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Day selector */}
                            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.07] rounded-[2rem] p-5 shadow-xl">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-slate-700 pl-3">
                                    {dietPlan.length}-Day Plan
                                </p>
                                <div className="space-y-2">
                                    {dietPlan.map((d, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDay(i)}
                                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all text-left ${selectedDay === i
                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                : 'bg-slate-800/30 border-white/5 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${selectedDay === i ? 'bg-white/20' : 'bg-slate-800 text-slate-500'}`}>
                                                    {String(i + 1).padStart(2, '0')}
                                                </span>
                                                <span className="text-sm font-black uppercase tracking-tight">{d.day}</span>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 transition-all ${selectedDay === i ? 'translate-x-0.5' : 'opacity-0'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Meal calorie breakdown mini chart */}
                            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.07] rounded-[2rem] p-5 shadow-xl">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-slate-700 pl-3">
                                    Calorie Split
                                </p>
                                <div className="space-y-3">
                                    {MEALS.map((m, i) => {
                                        const cal = mealCals[i];
                                        const barPct = totalCals > 0 ? Math.round((cal / totalCals) * 100) : 0;
                                        return (
                                            <div key={m.key}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${m.accent.text}`}>{m.label}</span>
                                                    <span className="text-[9px] font-black text-slate-500">{cal} kcal</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${m.accent.bg}`}
                                                        style={{ width: `${barPct}%`, backgroundColor: m.accent.ring }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </aside>

                        {/* ── MAIN CONTENT ── */}
                        <div className="lg:col-span-8 space-y-5" key={selectedDay}>

                            {/* Day hero banner */}
                            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/[0.07] rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/8 via-transparent to-teal-600/5 pointer-events-none" />
                                <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                                <div className="relative flex items-start justify-between gap-6 flex-wrap">
                                    <div>
                                        <div className="flex items-center gap-3 text-emerald-400 font-black text-[9px] tracking-[0.35em] mb-4 uppercase">
                                            <div className="w-5 h-[2px] bg-emerald-500" />
                                            Neural Diet Protocol
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-4">
                                            {day?.day}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 rounded-2xl border border-white/5">
                                                <Flame className="w-4 h-4 text-orange-400" />
                                                <span className="text-xs font-black text-slate-200">{day?.total_daily_calories} kcal</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                                <span className="text-xs font-black text-emerald-300">{day?.protein_intake} protein</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                                <Droplets className="w-4 h-4 text-blue-400" />
                                                <span className="text-xs font-black text-blue-300">{day?.water_intake}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 shrink-0">
                                        <Apple className="w-10 h-10 text-emerald-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Timeline meal cards */}
                            <div className="relative">
                                {/* Vertical timeline line */}
                                <div className="absolute left-[2.15rem] top-6 bottom-6 w-[2px] bg-gradient-to-b from-emerald-500/30 via-slate-700/50 to-indigo-500/30 hidden md:block" />

                                <div className="space-y-4">
                                    {MEALS.map(({ key, label, icon: Icon, time, accent }) => {
                                        const meal = day?.[key];
                                        const cal = meal?.calories || 0;
                                        const barPct = totalCals > 0 ? Math.round((cal / totalCals) * 100) : 0;
                                        return (
                                            <div key={key} className="relative flex gap-5 group">
                                                {/* Timeline dot */}
                                                <div className={`hidden md:flex w-[4.3rem] h-[4.3rem] shrink-0 ${accent.bg} ${accent.border} border rounded-2xl items-center justify-center z-10 shadow-lg ${accent.glow} group-hover:scale-105 transition-transform duration-300`}>
                                                    <Icon className={`w-5 h-5 ${accent.text}`} />
                                                </div>

                                                {/* Card */}
                                                <div className={`flex-1 bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-[1.8rem] p-6 shadow-xl group-hover:border-white/10 transition-all duration-300 group-hover:shadow-2xl`}>
                                                    <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                                                        <div className="flex items-center gap-3">
                                                            {/* Mobile icon */}
                                                            <div className={`md:hidden p-2.5 ${accent.bg} ${accent.border} border rounded-xl`}>
                                                                <Icon className={`w-4 h-4 ${accent.text}`} />
                                                            </div>
                                                            <div>
                                                                <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${accent.text}`}>{label}</p>
                                                                <p className="text-[9px] text-slate-600 font-bold">{time}</p>
                                                            </div>
                                                        </div>

                                                        {cal > 0 && (
                                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 ${accent.bg} ${accent.border} border rounded-xl shrink-0`}>
                                                                <Flame className={`w-3 h-3 ${accent.text}`} />
                                                                <span className={`text-xs font-black ${accent.text}`}>{cal} kcal</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <h3 className="text-xl font-black text-white tracking-tight mb-2 leading-tight">
                                                        {meal?.name || 'Meal not specified'}
                                                    </h3>
                                                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-4">
                                                        {meal?.description || 'Calorie-matched according to your biometric profile.'}
                                                    </p>

                                                    {/* Mini calorie bar */}
                                                    {cal > 0 && (
                                                        <div>
                                                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                                                <div className="h-full rounded-full transition-all duration-1000"
                                                                    style={{ width: `${barPct}%`, backgroundColor: accent.ring }} />
                                                            </div>
                                                            <p className="text-[9px] text-slate-600 font-bold mt-1.5 text-right">{barPct}% of day's calories</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Daily total footer */}
                            <div className="p-6 bg-gradient-to-r from-emerald-500/8 to-teal-500/5 border border-emerald-500/15 rounded-[2rem] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                                        <Sparkles className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Daily Total</p>
                                        <p className="text-sm font-bold text-slate-300">from {MEALS.length} meals</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-white">{totalCals}</p>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">kcal consumed</p>
                                </div>
                            </div>
                        </div>
                    </div>

                ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="relative mb-10">
                            <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full" />
                            <div className="relative p-10 bg-slate-900/50 border border-white/5 rounded-[3rem] shadow-2xl">
                                <Utensils className="w-16 h-16 text-slate-700" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">No Nutrition Plan Yet</h2>
                        <p className="text-slate-500 font-medium mb-12 max-w-sm text-base leading-relaxed">
                            Generate your AI plan from the Workouts page to unlock your personalized nutritional roadmap.
                        </p>
                        <button
                            onClick={() => navigate('/workout')}
                            className="px-10 py-5 bg-emerald-500 text-slate-950 rounded-[2rem] font-black tracking-widest hover:bg-emerald-400 transition-all shadow-2xl shadow-emerald-500/20 uppercase text-sm"
                        >
                            Generate My Plan
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Nutrition;
