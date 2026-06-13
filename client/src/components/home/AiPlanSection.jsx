import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import axios from 'axios';
import { Sparkles, Activity, Utensils, Calendar, RefreshCcw, Info, CheckCircle2, ChevronRight, ShieldCheck, Clock, Lock } from 'lucide-react';

const AiPlanSection = ({ onPlanGenerated, profile }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState(null);
    const [error, setError] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateData, setUpdateData] = useState({ weight: '', days: '3' });

    // Eligibility state — checked on mount
    const [eligibility, setEligibility] = useState(null); // null = loading, then { can_generate, days_remaining, is_new_user, message }
    const [eligibilityLoading, setEligibilityLoading] = useState(true);

    // ── Fetch eligibility from backend ──────────────────────────────────────
    const fetchEligibility = async () => {
        try {
            setEligibilityLoading(true);
            const res = await apiClient.get('/api/plan/eligibility');
            setEligibility(res.data);
        } catch (err) {
            // If we can't check eligibility, allow the user to try (backend will still enforce)
            setEligibility({ can_generate: true, days_remaining: 0, message: '' });
        } finally {
            setEligibilityLoading(false);
        }
    };

    // ── Fetch current plans ──────────────────────────────────────────────────
    const fetchMyPlans = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.get('/api/my-plans');
            setPlans(res.data);
            if (res.data.currentWeight) setUpdateData({ ...updateData, weight: res.data.currentWeight });
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setPlans(null);
            } else {
                setError('Failed to fetch existing plans.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateClick = () => {
        // Guard: if not eligible, don't open modal
        if (eligibility && !eligibility.can_generate) {
            return;
        }
        if (plans) {
            setShowUpdateModal(true);
        } else {
            generateNewPlan();
        }
    };

    const generateNewPlan = async () => {
        try {
            setShowUpdateModal(false);
            setLoading(true);
            setError(null);
            const res = await apiClient.post('/api/generate-complete-plan', updateData.weight
                ? { weight: parseFloat(updateData.weight), workout_days: parseInt(updateData.days) }
                : {}
            );
            setPlans({
                workoutPlan: res.data.workoutPlan,
                dietPlan: res.data.dietPlan,
                metrics: res.data.metrics
            });
            if (onPlanGenerated) onPlanGenerated();
            // Re-check eligibility after successful generation (cooldown now starts)
            fetchEligibility();
        } catch (err) {
            console.error(err);
            // Handle 429 cooldown response gracefully
            if (err.response?.status === 429) {
                const data = err.response.data;
                setEligibility({
                    can_generate: false,
                    days_remaining: data.days_remaining || 7,
                    message: data.message || 'Cannot generate a new plan yet.'
                });
                setError(data.message || 'Cannot generate a new plan yet. Please wait.');
            } else {
                setError(err.response?.data?.message || 'Failed to generate plan. Please ensure your profile is complete.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        try {
            setLoading(true);
            await axios.post("http://localhost:3000/user/upgrade", {}, { withCredentials: true });
            alert("Upgrade successful! AI generation is now unlocked.");
            if (onPlanGenerated) onPlanGenerated();
        } catch (err) {
            console.error("Upgrade failed:", err);
            setError("Failed to upgrade. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyPlans();
        fetchEligibility();
    }, []);

    if (loading && !plans) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-slate-700/50 animate-pulse">
                <Sparkles className="w-12 h-12 text-purple-400 animate-bounce mb-4" />
                <p className="text-xl font-bold text-slate-300">Summoning your AI Trainer...</p>
                <p className="text-sm text-slate-500 mt-2">Crafting your personalized workout and nutrition strategy</p>
            </div>
        );
    }

    // Whether the generate button should be disabled
    const isCooldownActive = eligibility && !eligibility.can_generate;
    const isGenerateDisabled = loading || isCooldownActive;

    return (
        <section className="mt-16 pb-20 relative">
            {/* Recalibration Overlay */}
            {loading && plans && (
                <div className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-purple-500/20 blur-[60px] rounded-full animate-pulse"></div>
                        <div className={`relative p-10 bg-slate-900 border border-purple-500/30 rounded-[3rem] shadow-2xl`}>
                            <RefreshCcw className="w-16 h-16 text-purple-500 animate-spin" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tighter mb-2 italic">Neural Recalibration</h3>
                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Evolving your trajectory through the AI core...</p>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                            <Sparkles className="w-6 h-6" />
                        </span>
                        AI Personal Optimizer
                    </h2>
                    <p className="text-slate-400 mt-2">Dynamic plans evolved by Gemini 2.5 Flash</p>
                </div>

                {profile?.is_pro ? (
                    <div className="flex flex-col items-end gap-2">
                        <button
                            onClick={handleGenerateClick}
                            disabled={isGenerateDisabled}
                            title={isCooldownActive ? eligibility.message : ''}
                            className={`group relative flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white shadow-xl transition-all
                                ${isCooldownActive
                                    ? 'bg-slate-700 cursor-not-allowed opacity-60 shadow-none'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1'
                                }
                                disabled:opacity-50`}
                        >
                            {isCooldownActive
                                ? <Lock className="w-5 h-5" />
                                : <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            }
                            {plans ? 'Regenerate Program' : 'Generate First Program'}
                            {!isCooldownActive && (
                                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            )}
                        </button>

                        {/* Cooldown countdown badge */}
                        {isCooldownActive && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <span className="text-xs font-bold text-amber-400">
                                    {eligibility.days_remaining} day{eligibility.days_remaining !== 1 ? 's' : ''} until next plan
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="group relative flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl font-black text-slate-950 shadow-xl shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:-translate-y-1 transition-all disabled:opacity-50"
                    >
                        <ShieldCheck className="w-5 h-5" />
                        {loading ? 'UNLOCKING...' : 'UNLOCK AI GENERATION'}
                    </button>
                )}
            </div>

            {/* Cooldown Banner — prominent full-width warning */}
            {isCooldownActive && profile?.is_pro && (
                <div className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 p-5 rounded-2xl mb-8 backdrop-blur-sm">
                    <div className="p-2 bg-amber-500/20 rounded-xl flex-shrink-0">
                        <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <p className="font-bold text-amber-300">{eligibility.message}</p>
                        <p className="text-xs text-amber-500 mt-0.5">Your next plan will be even more personalized based on your current progress.</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl mb-10">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {plans && plans.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'BMI & Category', value: `${plans.metrics.bmi} (${plans.metrics.bmiCategory})`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'BMR', value: `${plans.metrics.bmr} kcal`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                        { label: 'TDEE', value: `${plans.metrics.tdee} kcal`, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                        { label: 'Target Calories', value: `${plans.metrics.recommendedCalories} kcal`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    ].map((metric, i) => (
                        <div key={i} className="bg-slate-800/40 backdrop-blur-md p-5 rounded-2xl border border-slate-700/50">
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">{metric.label}</span>
                            <span className={`text-lg font-bold ${metric.color}`}>{metric.value}</span>
                        </div>
                    ))}
                </div>
            )}

            {plans ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    {/* Workout List */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="w-6 h-6 text-purple-400" />
                            <h3 className="text-xl font-bold">Neural Workout Strategy</h3>
                        </div>
                        <div className="space-y-4">
                            {plans.workoutPlan.map((day, idx) => (
                                <div key={idx} className="bg-slate-800/30 rounded-2xl border border-slate-700/30 overflow-hidden hover:border-purple-500/30 transition-colors">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-white">{day.day}</h4>
                                                <p className="text-purple-400 font-medium">{day.muscle_focus}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-slate-900/50 rounded-lg text-xs font-bold text-slate-400 border border-slate-700/50">
                                                {day.difficulty_level}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {day.exercises.slice(0, 3).map((ex, e_idx) => (
                                                <div key={e_idx} className="flex justify-between items-center py-2 border-b border-slate-700/20 last:border-0">
                                                    <span className="text-slate-300 text-sm">{ex.name}</span>
                                                    <span className="text-slate-500 text-xs font-mono">{ex.sets}x{ex.reps}</span>
                                                </div>
                                            ))}
                                            {day.exercises.length > 3 && (
                                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">+{day.exercises.length - 3} more exercises</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 bg-slate-900/20 border-t border-slate-700/30 flex justify-between items-center">
                                        <div className="flex gap-4">
                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                <Activity className="w-3 h-3" /> {day.estimated_calories_burned} KCAL
                                            </span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-600" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Diet List */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Utensils className="w-6 h-6 text-emerald-400" />
                            <h3 className="text-xl font-bold">Nutritional Roadmap</h3>
                        </div>
                        <div className="space-y-4">
                            {plans.dietPlan.slice(0, 7).map((day, idx) => (
                                <div key={idx} className="bg-slate-800/30 rounded-2xl border border-slate-700/30 overflow-hidden hover:border-emerald-500/30 transition-colors">
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-white">{day.day}</h4>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                <span className="text-xs font-bold text-emerald-400">{day.total_daily_calories} KCAL</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['breakfast', 'lunch', 'dinner'].map((meal) => (
                                                <div key={meal} className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/30">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">{meal}</span>
                                                    <span className="text-[10px] font-medium text-slate-300 line-clamp-2 leading-tight">{day[meal]?.name || 'Optimized Meal'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 bg-slate-900/20 border-t border-slate-700/30 flex justify-between items-center">
                                        <div className="flex gap-4">
                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {day.protein_intake} Pro
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase">
                                                <Activity className="w-3 h-3 text-blue-500" /> {day.water_intake}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : !profile?.is_pro ? (
                <div className="flex flex-col items-center justify-center p-20 bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-yellow-500/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-yellow-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-yellow-500/20 shadow-2xl">
                            <Sparkles className="w-10 h-10 text-yellow-500" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">AI Program Synthesis</h3>
                        <p className="text-slate-400 mb-10 max-w-sm font-medium">This is a <span className="text-yellow-500 font-bold uppercase tracking-widest text-xs ml-1">Premium Feature</span>. Unlock neural-optimized training and nutrition tailored to your biometrics.</p>
                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            className="px-12 py-5 bg-yellow-500 text-slate-950 rounded-2xl font-black hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/10 flex items-center gap-3 disabled:opacity-50"
                        >
                            {loading ? 'PROCESSING...' : 'UPGRADE TO PRO'} <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 bg-slate-800/20 backdrop-blur-xl rounded-3xl border border-dashed border-slate-700">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                        <Calendar className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-xl font-bold text-slate-300">No active program found</p>
                    <p className="text-slate-500 mt-2 mb-8 max-w-xs text-center">Generate your custom plan now to start your journey with AI-optimized tracking.</p>
                    <button
                        onClick={handleGenerateClick}
                        disabled={isGenerateDisabled}
                        className={`px-10 py-4 rounded-2xl font-black shadow-xl transition-colors
                            ${isCooldownActive
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-white text-slate-950 hover:bg-slate-200'
                            }`}
                    >
                        {isCooldownActive
                            ? `LOCKED — ${eligibility.days_remaining} DAY${eligibility.days_remaining !== 1 ? 'S' : ''} REMAINING`
                            : 'INITIALIZE NOW'
                        }
                    </button>
                </div>
            )}

            {/* Update / Regenerate Modal */}
            {showUpdateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 p-8 shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-2">Weekly Update</h3>
                        <p className="text-slate-400 mb-8">Let's refine your plan with your current stats.</p>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Current Weight (kg)</label>
                                <input
                                    type="number"
                                    value={updateData.weight}
                                    onChange={(e) => setUpdateData({ ...updateData, weight: e.target.value })}
                                    placeholder="Enter current weight"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Workout Days (This Week)</label>
                                <select
                                    value={updateData.days}
                                    onChange={(e) => setUpdateData({ ...updateData, days: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7].map(d => <option key={d} value={d}>{d} Days</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-10">
                            <button
                                onClick={() => setShowUpdateModal(false)}
                                className="p-4 rounded-xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-colors"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={generateNewPlan}
                                className="p-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-500 shadow-xl shadow-purple-900/20 transition-all"
                            >
                                GENERATE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default AiPlanSection;
