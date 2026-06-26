import React, { useState, useEffect } from "react";
import axios from "axios";
import { ChevronRight, Dumbbell, Calendar, Layout, Utensils, Sparkles, CheckCircle2, RefreshCcw, Info, Settings, Activity, Weight, Target } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './components/home/Header';
import apiClient from './api/apiClient';
import ExerciseGif from './components/ExerciseGif';

const GOALS = [
  { key: 'Fat Loss', emoji: '🔥', desc: 'Burn fat & lean out', dbKey: 'weight_loss' },
  { key: 'Bodybuilding', emoji: '💪', desc: 'Build muscle & strength', dbKey: 'muscle_gain' },
  { key: 'Athletic Performance', emoji: '⚡', desc: 'Speed, power & endurance', dbKey: 'maintenance' },
];
const dbGoalToDisplay = { weight_loss: 'Fat Loss', muscle_gain: 'Bodybuilding', maintenance: 'Athletic Performance' };

function Workout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [profile, setProfile] = useState(null);
  const [userName, setUserName] = useState("Athlete");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showRecalibrateChoice, setShowRecalibrateChoice] = useState(true);
  const [updateData, setUpdateData] = useState({ weight: '', days: '3', goal: '' });
  const [error, setError] = useState(null);
  const [completedExercises, setCompletedExercises] = useState({});
  const [completedDays, setCompletedDays] = useState([]);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [todayActiveDay, setTodayActiveDay] = useState(null);
  const [eligibilityInfo, setEligibilityInfo] = useState(null);
  const [selectedExerciseModal, setSelectedExerciseModal] = useState(null);

  const getCurrentDayIndexClient = () => (new Date().getDay() + 6) % 7;

  const isDayUnlocked = (dayIndex) => {
    if (dayIndex === 0) return true;
    // Unlock if the immediate previous day is fully completed
    return completedDays.includes(dayIndex - 1);
  };

  const handleExerciseComplete = async (dayIdx, exIdx, totalExercises) => {
    const exerciseKey = `${dayIdx}-${exIdx}`;
    if (completedExercises[exerciseKey]) return;

    if (!isDayUnlocked(dayIdx)) {
      setError('You can complete previous or today\'s exercises only. Future-day exercises are locked.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await apiClient.post('/user/complete-exercise', {
        dayIndex: dayIdx,
        exerciseIndex: exIdx,
        totalExercises,
      });

      setCompletedExercises(prev => ({
        ...prev,
        [exerciseKey]: true,
      }));

      if (res.data?.isDayCompleted) {
        setCompletedDays(prev => (prev.includes(dayIdx) ? prev : [...prev, dayIdx]));
      }
      // Track today's active day
      setTodayActiveDay(dayIdx);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to sync exercise completion.';
      // If backend says a different day is active today, sync that info
      if (err.response?.data?.todayActiveDay !== undefined) {
        setTodayActiveDay(err.response.data.todayActiveDay);
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMainData();
    fetchUserInfo();
  }, []);

  useEffect(() => {
    const dayParam = new URLSearchParams(location.search).get('day');
    if (dayParam === null) return;

    const parsedDay = Number(dayParam);
    const maxDayIndex = (plans?.workoutPlan?.length || 0) - 1;

    if (!Number.isInteger(parsedDay) || maxDayIndex < 0) return;

    const safeDayIndex = Math.min(Math.max(parsedDay, 0), maxDayIndex);
    setSelectedDayIndex(safeDayIndex);
  }, [location.search, plans?.workoutPlan?.length]);

  const fetchUserInfo = async () => {
    try {
      const res = await axios.get("http://localhost:3000/user/me", { withCredentials: true });
      setUserName(res.data.name);
      setProfile(res.data);
      setUpdateData(prev => ({
        ...prev,
        weight: prev.weight || res.data.weight || '',
        days: prev.days || String(res.data.workout_days || '3'),
        goal: prev.goal || dbGoalToDisplay[res.data.goal] || 'Bodybuilding',
      }));
    } catch (err) {
      console.error("Failed to fetch user info:", err);
    }
  };

  const fetchMainData = async () => {
    try {
      setLoading(true);
      const [plansRes, statsRes] = await Promise.all([
        apiClient.get('/api/my-plans'),
        apiClient.get('/user/workout-progress').catch(() => ({ data: { completedDays: [], completedExercises: [], currentDayIndex: getCurrentDayIndexClient() } }))
      ]);
      setPlans(plansRes.data);
      if (plansRes.data.currentWeight) setUpdateData(prev => ({ ...prev, weight: plansRes.data.currentWeight }));
      const doneDays = statsRes.data.completedDays || [];
      const doneExercises = statsRes.data.completedExercises || [];
      setCompletedDays(doneDays);
      setCurrentDayIndex(
        Number.isInteger(statsRes.data.currentDayIndex)
          ? statsRes.data.currentDayIndex
          : getCurrentDayIndexClient()
      );
      setTodayActiveDay(
        statsRes.data.todayActiveDay !== undefined ? statsRes.data.todayActiveDay : null
      );

      const ticked = {};
      doneExercises.forEach((row) => {
        ticked[`${row.dayIndex}-${row.exerciseIndex}`] = true;
      });
      setCompletedExercises(ticked);
    } catch (err) {
      if (err.response?.status !== 404) setError('Failed to fetch existing plans.');
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async (useChangedStats = true) => {
    if (profile && !profile.is_pro) {
      setError("AI Plan generation is exclusive to PRO members.");
      return;
    }
    try {
      setShowUpdateModal(false);
      setShowRecalibrateChoice(true);
      setLoading(true);
      setError(null);
      const payload = useChangedStats && updateData.weight
        ? { weight: parseFloat(updateData.weight), workout_days: parseInt(updateData.days, 10), goal: updateData.goal }
        : {};

      const res = await apiClient.post('/api/generate-complete-plan', payload);
      setPlans({
        workoutPlan: res.data.workoutPlan,
        dietPlan: res.data.dietPlan,
        metrics: res.data.metrics
      });
      setSelectedDayIndex(0);
      setCompletedDays([]);
      setCompletedExercises({});
      await fetchMainData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate plan.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    axios.post("http://localhost:3000/auth/logout", {}, { withCredentials: true })
      .then(() => navigate("/"))
      .catch((err) => console.error(err));
  };

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      await axios.post("http://localhost:3000/user/upgrade", {}, { withCredentials: true });
      await fetchUserInfo();
      await fetchMainData();
      alert("Pro tier unlocked! You can now generate AI plans.");
    } catch (err) {
      console.error("Upgrade failed:", err);
      setError("Failed to upgrade. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !plans) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <div className="w-24 h-24 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl relative group">
          <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse group-hover:bg-purple-500/40 transition-all"></div>
          <Sparkles className="w-10 h-10 text-purple-400 animate-bounce relative z-10" />
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Initializing Neural Protocol</h2>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Synchronizing with AI Core...</p>
      </div>
    </div>
  );

  const workoutPlan = plans?.workoutPlan || [];
  const currentDay = workoutPlan[selectedDayIndex];

  return (
    <div className="bg-[#0f172a] min-h-screen text-slate-100 font-sans selection:bg-purple-500/30 relative">
      {/* Recalibration Overlay */}
      {loading && plans && (
        <div className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-purple-500/20 blur-[60px] rounded-full animate-pulse"></div>
            <div className="relative p-10 bg-slate-900 border border-purple-500/30 rounded-[3rem] shadow-2xl">
              <RefreshCcw className="w-16 h-16 text-purple-500 animate-spin" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-white tracking-tighter mb-2 italic">Neural Recalibration</h3>
          <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Evolving your trajectory through the AI core...</p>
        </div>
      )}
      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      <Header name={userName} logout={logout} />

      <main className="container mx-auto px-4 py-8 max-w-7xl" style={{ paddingBottom: '8rem' }}>

        {/* Top bar / Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 animate-in fade-in duration-700">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <span className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                <Sparkles className="w-6 h-6" />
              </span>
              {profile?.goal
                ? profile.goal.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + " Strategy"
                : "AI Personal Optimizer"}
            </h1>
            <p className="text-slate-400 mt-2 font-medium">{workoutPlan.length} Day Optimized Split</p>
          </div>

          <div className="flex gap-4">
            {profile?.is_pro && (
              <button
                onClick={async () => {
                  setEligibilityInfo(null);
                  setShowRecalibrateChoice(true);
                  if (plans) {
                    try {
                      const eligRes = await apiClient.get('/api/plan/eligibility');
                      setEligibilityInfo(eligRes.data);
                    } catch {
                      setEligibilityInfo(null);
                    }
                  }
                  setShowUpdateModal(true);
                }}
                className="flex items-center gap-2 px-5 py-3 bg-slate-800/50 border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all group font-bold text-sm"
                title="Recalibrate Plan"
              >
                <RefreshCcw className="w-4 h-4 group-active:rotate-180 transition-transform duration-500" />
                Recalibrate
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl mb-10 animate-in shake">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="font-bold text-sm tracking-tight">{error}</p>
          </div>
        )}

        {profile && !profile.is_pro ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in zoom-in duration-700">
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] rounded-full animate-pulse"></div>
              <div className="relative p-10 bg-slate-900 border border-yellow-500/30 rounded-[3rem] shadow-2xl">
                <Sparkles className="w-20 h-20 text-yellow-500" />
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter">
              Unlock Your <span className="text-yellow-500">AI Potential</span>
            </h2>
            <p className="text-slate-400 text-lg font-medium max-w-xl mb-12 leading-relaxed">
              AI-generated workout protocols and nutritional roadmaps are exclusive to <span className="text-white font-black">PRO</span> members. Upgrade your trajectory today.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
              {[
                "Unlimited AI Generative Plans",
                "Advanced Neural Progression",
                "Personalized Metabolic Tracking",
                "Exclusive Biometric Insights"
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-3 p-5 bg-white/[0.03] border border-white/[0.05] rounded-2xl text-left">
                  <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-300">{feat}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="px-12 py-6 bg-yellow-500 text-slate-950 rounded-[2rem] font-black text-lg hover:bg-yellow-400 hover:scale-[1.05] transition-all shadow-2xl shadow-yellow-500/20 flex items-center gap-4 group disabled:opacity-50"
            >
              {loading ? 'CALIBRATING...' : 'GET PRO ACCESS'}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        ) : plans ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Command Deck */}
            <div className="bg-slate-900/45 backdrop-blur-xl border border-white/[0.06] rounded-[2.2rem] p-6 md:p-7 shadow-2xl overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Training Command Deck</h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Select day, then execute session</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-slate-800/70 border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Week Progress</p>
                    <p className="text-sm font-black text-white">{completedDays.length}/{workoutPlan.length}</p>
                  </div>
                  {plans.metrics && (
                    <div className="px-4 py-2 rounded-xl bg-indigo-500/8 border border-indigo-500/20">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kcal Base</p>
                      <p className="text-sm font-black text-white">{plans.metrics.recommendedCalories}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-400 rounded-full transition-all duration-1000"
                  style={{ width: `${workoutPlan.length > 0 ? Math.round((completedDays.length / workoutPlan.length) * 100) : 0}%` }}
                />
              </div>

              {/* Day rail (no horizontal scroll, tuned for max 7 days) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {workoutPlan.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (!isDayUnlocked(index)) {
                        setError('Future-day training is locked for today. Complete today or unfinished previous days first.');
                        return;
                      }
                      setSelectedDayIndex(index);
                    }}
                    disabled={!isDayUnlocked(index)}
                    className={`p-3 rounded-2xl border transition-all text-left min-h-[122px] ${selectedDayIndex === index
                      ? 'bg-purple-500/20 border-purple-500/50 shadow-lg shadow-purple-500/15'
                      : completedDays.includes(index)
                        ? 'bg-emerald-500/10 border-emerald-500/35'
                        : !isDayUnlocked(index)
                          ? 'bg-slate-900/50 border-white/5 opacity-60 cursor-not-allowed'
                          : 'bg-slate-800/40 border-white/5 hover:border-slate-600'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${selectedDayIndex === index
                        ? 'bg-purple-400/30 text-purple-100'
                        : completedDays.includes(index)
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                        }`}>DAY {index + 1}</span>
                      {completedDays.includes(index) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedDayIndex === index ? 'text-purple-300 translate-x-0.5' : 'text-slate-600'}`} />
                      )}
                    </div>

                    <p className={`font-black text-sm leading-tight ${selectedDayIndex === index ? 'text-white' : 'text-slate-200'}`}>
                      {item.muscle_focus}
                    </p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {completedDays.includes(index)
                        ? 'Completed'
                        : index > currentDayIndex
                          ? 'Locked'
                          : todayActiveDay !== null && todayActiveDay !== index && !completedDays.includes(index)
                            ? 'Try Tomorrow'
                            : item.day}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div>
              {/* WORKOUT DETAIL VIEW */}
              {workoutPlan[selectedDayIndex] && (() => {
                const day = workoutPlan[selectedDayIndex];
                const totalEx = day.exercises.length;
                const doneEx = day.exercises.filter((_, i) => completedExercises[`${selectedDayIndex}-${i}`]).length;
                const pct = totalEx > 0 ? Math.round((doneEx / totalEx) * 100) : 0;
                return (
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col overflow-hidden" key={selectedDayIndex}>

                    {/* Day hero header */}
                    <div className="relative p-8 md:p-10 border-b border-white/5 overflow-hidden">
                      {/* Subtle gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/8 via-transparent to-indigo-600/5 pointer-events-none" />
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                      <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 text-purple-400 font-black text-[9px] tracking-[0.3em] mb-4 uppercase">
                            <div className="w-6 h-[2px] bg-purple-500" />
                            {day.day} &bull; Neural Focus
                          </div>
                          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-5">
                            {day.muscle_focus}
                          </h1>

                          {/* Stats row */}
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/60 rounded-2xl border border-white/5">
                              <Dumbbell className="w-4 h-4 text-purple-400" />
                              <span className="text-xs font-black text-slate-200">{totalEx} Exercises</span>
                            </div>
                            {day.estimated_calories_burned && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                <Activity className="w-4 h-4 text-orange-400" />
                                <span className="text-xs font-black text-orange-300">~{day.estimated_calories_burned} kcal</span>
                              </div>
                            )}
                            {day.difficulty_level && (
                              <div className="px-4 py-2 bg-slate-800/60 rounded-2xl border border-white/5">
                                <span className="text-xs font-black text-slate-400">{day.difficulty_level}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Circular-ish progress */}
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <div className="relative w-20 h-20">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#a855f7" strokeWidth="2.5"
                                strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round"
                                className="transition-all duration-700"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-lg font-black text-white">{pct}%</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Done</span>
                        </div>
                      </div>

                      {/* Warm-up strip */}
                      <div className="mt-6 p-4 bg-slate-800/40 rounded-2xl border border-white/5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-2">Warm-up:</span>
                        <span className="text-slate-400 text-xs font-medium">{day.warm_up}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Exercise list */}
                    <div className="p-6 md:p-10 space-y-3 flex-grow">
                      {day.exercises.map((ex, idx) => {
                        const done = completedExercises[`${selectedDayIndex}-${idx}`];
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedExerciseModal({ ex, idx, dayIdx: selectedDayIndex, totalEx })}
                            className={`group flex items-center gap-4 p-5 rounded-[1.5rem] border cursor-pointer transition-all duration-300 ${done
                              ? 'bg-purple-500/10 border-purple-500/30 shadow-purple-500/10 shadow-lg'
                              : 'bg-slate-800/20 border-white/5 hover:border-purple-500/30 hover:bg-slate-800/40'
                              }`}
                          >
                            {/* Number bubble */}
                            <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center font-black text-base transition-all duration-300 ${done ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/40' : 'bg-slate-900/80 border border-white/5 text-slate-500 group-hover:text-purple-400 group-hover:border-purple-500/30'
                              }`}>
                              {done ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                            </div>

                            {/* Name + badges */}
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-black text-base tracking-tight transition-colors ${done ? 'text-purple-200 line-through opacity-50' : 'text-white'
                                }`}>{ex.name}</h4>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="px-2.5 py-1 bg-slate-900/80 border border-white/5 rounded-lg text-[10px] font-black text-slate-400 uppercase">{ex.sets} Sets</span>
                                <span className="px-2.5 py-1 bg-slate-900/80 border border-white/5 rounded-lg text-[10px] font-black text-slate-400 uppercase">{ex.reps} Reps</span>
                                {ex.rest && (
                                  <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] font-black text-indigo-400 uppercase">Rest {ex.rest}</span>
                                )}
                              </div>
                            </div>

                            {/* Check icon */}
                            <div className={`p-2.5 rounded-xl shrink-0 transition-all duration-300 ${done ? 'bg-purple-500 text-white' : 'bg-slate-900/80 text-slate-700 group-hover:text-purple-400 group-hover:bg-purple-500/10'
                              }`}>
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Cardio */}
                    {day.cardio && (
                      <div className="mx-6 md:mx-10 mb-6 p-6 rounded-[1.8rem] bg-gradient-to-r from-indigo-500/10 to-blue-500/5 border border-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                          <Activity className="w-16 h-16 text-indigo-400" />
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-indigo-500/20 rounded-xl">
                            <Activity className="w-4 h-4 text-indigo-400" />
                          </div>
                          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Cardio Protocol</span>
                        </div>
                        <p className="text-slate-200 font-bold text-base leading-relaxed">{day.cardio}</p>
                      </div>
                    )}

                    {/* Day status footer */}
                    <div className="p-6 md:p-10 pt-0">
                      {completedDays.includes(selectedDayIndex) ? (
                        <div className="w-full py-7 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-[2rem] font-black tracking-[0.2em] flex items-center justify-center gap-3">
                          <CheckCircle2 className="w-6 h-6" />
                          TRAINING DAY SECURED
                        </div>
                      ) : (() => {
                        const day = workoutPlan[selectedDayIndex];
                        const totalEx = day?.exercises?.length || 0;
                        const doneEx = day?.exercises?.filter((_, i) => completedExercises[`${selectedDayIndex}-${i}`]).length || 0;
                        const allDone = totalEx > 0 && doneEx >= totalEx;
                        return (
                          <div className={`w-full py-5 rounded-[2rem] border font-black tracking-[0.15em] flex items-center justify-center gap-3 text-sm transition-all ${allDone ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-slate-800/30 border-white/5 text-slate-600'}`}>
                            {allDone ? (
                              <>
                                <CheckCircle2 className="w-5 h-5 text-purple-400" />
                                ALL EXERCISES DONE — DAY AUTO-COMPLETED
                              </>
                            ) : (
                              <>
                                <Dumbbell className="w-5 h-5" />
                                {doneEx}/{totalEx} EXERCISES COMPLETE
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
            <div className="p-8 bg-slate-900/50 rounded-[2.5rem] border border-white/5 mb-8 shadow-2xl">
              <Layout className="w-16 h-16 text-slate-700" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tighter">Plan Initialization Required</h2>
            <p className="text-slate-500 font-medium mb-12 max-w-sm text-lg">Your trajectory hasn't been established. Synchronize with the AI to generate your plan.</p>
            <button
              onClick={generateNewPlan}
              disabled={loading}
              className="px-12 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[2rem] font-black text-white hover:shadow-2xl hover:shadow-purple-500/40 transition-all flex items-center gap-3 group"
            >
              <RefreshCcw className={`w-6 h-6 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              INITIALIZE SYSTEM
            </button>
          </div>
        )}
      </main>

      {/* Shared Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-slate-900 w-full max-w-lg rounded-[3rem] border border-white/10 p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500"></div>

            {showRecalibrateChoice ? (
              <>
                {/* Eligibility blocked: show days remaining before choice */}
                {eligibilityInfo && !eligibilityInfo.canGenerate ? (
                  <div className="text-center">
                    <div className="inline-flex p-4 bg-amber-500/10 rounded-2xl text-amber-400 mb-6">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tighter mb-2">Plan Active</h3>
                    <p className="text-slate-400 font-medium mb-4">Your current 7-day plan is still in progress.</p>
                    <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-8">
                      <p className="text-4xl font-black text-amber-400 mb-1">{eligibilityInfo.daysRemaining}</p>
                      <p className="text-xs font-black text-amber-500/60 uppercase tracking-widest">
                        {eligibilityInfo.daysRemaining === 1 ? 'Day' : 'Days'} until next plan
                      </p>
                    </div>
                    <p className="text-slate-500 text-sm font-medium mb-8">Complete your current plan first, then generate a new one to keep progressing.</p>
                    <button
                      onClick={() => { setShowUpdateModal(false); setShowRecalibrateChoice(true); setEligibilityInfo(null); }}
                      className="w-full p-5 rounded-2xl bg-white text-slate-950 font-black tracking-widest text-xs hover:bg-slate-200 shadow-xl transition-all"
                    >
                      GOT IT
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-10 text-center">
                      <div className="inline-flex p-4 bg-purple-500/10 rounded-2xl text-purple-400 mb-6 font-black">
                        <RefreshCcw className="w-8 h-8" />
                      </div>
                      <h3 className="text-3xl font-black text-white tracking-tighter mb-2">Recalibrate Plan</h3>
                      <p className="text-slate-400 font-medium">Choose how you want to regenerate your plan.</p>
                    </div>

                    <div className="space-y-4">
                      <button
                        onClick={() => generateNewPlan(false)}
                        className="w-full p-5 rounded-2xl bg-white text-slate-950 font-black tracking-widest text-xs hover:bg-slate-200 shadow-xl shadow-white/5 transition-all flex items-center justify-center gap-2"
                      >
                        RECALCULATE WITHOUT CHANGING STATS
                        <Sparkles className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setShowRecalibrateChoice(false)}
                        className="w-full p-5 rounded-2xl border border-white/10 text-slate-300 font-black tracking-widest text-xs hover:bg-white/5 transition-all"
                      >
                        CHANGE STATS FIRST
                      </button>

                      <button
                        onClick={() => {
                          setShowUpdateModal(false);
                          setShowRecalibrateChoice(true);
                        }}
                        className="w-full p-5 rounded-2xl border border-white/5 text-slate-500 font-black tracking-widest text-xs hover:bg-white/5 transition-all"
                      >
                        DISMISS
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="text-center mb-7">
                  <div className="inline-flex p-4 rounded-2xl bg-purple-500/10 text-purple-400 mb-5">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tighter mb-2">Quick Sync</h3>
                  <p className="text-slate-500 text-sm font-medium">Update your metrics to recalibrate your AI plan</p>
                </div>

                <div className="space-y-5">
                  {/* Weight + Days row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <Activity className="w-3 h-3" /> Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={updateData.weight}
                        onChange={(e) => setUpdateData({ ...updateData, weight: e.target.value })}
                        placeholder="75"
                        className="w-full bg-slate-800/50 border border-white/[0.08] text-white placeholder:text-slate-600 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <Calendar className="w-3 h-3" /> Workout Days
                      </label>
                      <select
                        value={updateData.days}
                        onChange={(e) => setUpdateData({ ...updateData, days: e.target.value })}
                        className="w-full bg-slate-800/50 border border-white/[0.08] text-white rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-purple-500/60 transition-all appearance-none cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map(d => <option key={d} value={d}>{d} days/week</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Primary Goal cards */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <Target className="w-3 h-3" /> Primary Goal
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {GOALS.map(g => (
                        <button
                          key={g.key}
                          type="button"
                          onClick={() => setUpdateData({ ...updateData, goal: g.key })}
                          className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 shadow-lg ${
                            updateData.goal === g.key
                              ? 'bg-purple-500 border-purple-500 shadow-purple-500/25 text-white'
                              : 'bg-slate-800/30 border-white/5 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="text-2xl mb-1.5">{g.emoji}</div>
                          <p className="font-black text-sm tracking-tight">{g.key}</p>
                          <p className="text-[10px] opacity-70 mt-0.5">{g.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => generateNewPlan(true)}
                    className="w-full mt-2 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-500/20"
                  >
                    <Sparkles className="w-4 h-4" /> Sync Progress
                  </button>

                  <button
                    onClick={() => {
                      setShowUpdateModal(false);
                      setShowRecalibrateChoice(true);
                      navigate('/profile-setup?full=1');
                    }}
                    className="w-full text-slate-500 font-bold text-sm flex items-center justify-center gap-2 hover:text-slate-400 transition-colors py-2"
                  >
                    <Settings className="w-4 h-4" /> Full Profile Setup
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Exercise Modal */}
      {selectedExerciseModal && (() => {
        const { ex, idx, dayIdx, totalEx } = selectedExerciseModal;
        const done = completedExercises[`${dayIdx}-${idx}`];
        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Close layer */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedExerciseModal(null)}></div>
            
            <div className="bg-slate-900 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-[2.5rem] border border-white/10 p-5 sm:p-6 shadow-2xl relative flex flex-col items-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
              
              {/* GIF Section */}
              <div className="w-full max-h-[35vh] sm:max-h-[50vh] aspect-square shrink-0 rounded-[1.5rem] overflow-hidden bg-white/5 mb-6 shadow-inner border border-white/5 flex items-center justify-center">
                <ExerciseGif exerciseName={ex.name} />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-black text-white text-center mb-6 tracking-tight leading-tight">
                {ex.name}
              </h3>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 w-full mb-8">
                <div className="flex flex-col items-center justify-center p-3 bg-slate-800/50 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sets</span>
                  <span className="text-xl font-black text-white">{ex.sets}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-slate-800/50 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Reps</span>
                  <span className="text-xl font-black text-white">{ex.reps}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Rest</span>
                  <span className="text-lg font-black text-indigo-300">{ex.rest || '-'}</span>
                </div>
              </div>

              {/* Complete Button */}
              {done ? (
                <button
                  disabled
                  className="w-full py-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5" /> Completed
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await handleExerciseComplete(dayIdx, idx, totalEx);
                    setSelectedExerciseModal(null);
                  }}
                  disabled={loading}
                  className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50"
                >
                  {loading ? 'SYNCING...' : 'MARK COMPLETE'}
                </button>
              )}

              {/* Dismiss Button */}
              <button
                onClick={() => setSelectedExerciseModal(null)}
                className="mt-4 text-slate-500 font-bold text-sm tracking-widest hover:text-white transition-colors"
              >
                DISMISS
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Workout;
