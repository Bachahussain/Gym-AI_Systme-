import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from './components/home/Header';
import StatsGrid from './components/home/StatsGrid';
import WeeklySplit from './components/home/WeeklySplit';
import axios from 'axios';
import {
  Flame, CheckCircle2, TrendingUp, Sparkles,
  Weight, Ruler, Activity,
  Dumbbell
} from 'lucide-react';

const GOAL_INFO = {
  weight_loss: { label: 'Fat Loss', emoji: '🔥', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  muscle_gain: { label: 'Muscle Gain', emoji: '💪', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/25' },
  maintenance: { label: 'Athletic', emoji: '⚡', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/25' },
};

const getBMICategory = (bmi) => {
  if (!bmi) return null;
  const n = parseFloat(bmi);
  if (n < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
  if (n < 25) return { label: 'Normal', color: 'text-emerald-400' };
  if (n < 30) return { label: 'Overweight', color: 'text-orange-400' };
  return { label: 'Obese', color: 'text-red-400' };
};

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { title: 'Streak', value: '0 days', icon: <Flame className="w-5 h-5" /> },
    { title: 'This Week', value: '0/0 workouts', icon: <CheckCircle2 className="w-5 h-5" /> },
    { title: 'XP', value: '0 xp', icon: <Sparkles className="w-5 h-5" /> },
    { title: 'Progress', value: '0% goal', icon: <TrendingUp className="w-5 h-5" /> },
  ]);
  const [weeklySplit, setWeeklySplit] = useState(null);
  const [todayActiveDay, setTodayActiveDay] = useState(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(() => (new Date().getDay() + 6) % 7);
  const [userName, setUserName] = useState('Athlete');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const userRes = await fetchUserInfo();
      await fetchHomeData(userRes);
      setLoading(false);
    };
    init();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await axios.get('http://localhost:3000/user/me', { withCredentials: true });
      setUserName(res.data.name);
      setProfile(res.data);
      return res.data;
    } catch { return null; }
  };

  const fetchHomeData = async (userProfile) => {
    try {
      const statsRes = await axios.get('http://localhost:3000/user/stats', { withCredentials: true });
      const s = statsRes.data;
      setStats([
        { title: 'Streak', value: `${s.streak} days`, icon: <Flame className="w-5 h-5" /> },
        { title: 'This Week', value: `${s.weeklyProgress}/${s.weeklyGoal} workouts`, icon: <CheckCircle2 className="w-5 h-5" /> },
        { title: 'XP', value: `${s.totalXp ?? 0} xp`, icon: <Sparkles className="w-5 h-5" /> },
        { title: 'Progress', value: `${s.progressPercentage}% goal`, icon: <TrendingUp className="w-5 h-5" /> },
      ]);

      const planRes = await axios.get('http://localhost:3000/api/my-plans', { withCredentials: true });
      const p = planRes.data;

      // Fetch workout progress to know today's active day and current day index
      try {
        const progressRes = await axios.get('http://localhost:3000/user/workout-progress', { withCredentials: true });
        const prog = progressRes.data;
        setTodayActiveDay(prog.todayActiveDay !== undefined ? prog.todayActiveDay : null);
        if (Number.isInteger(prog.currentDayIndex)) setCurrentDayIndex(prog.currentDayIndex);
        if (p.workoutPlan) {
          setWeeklySplit(p.workoutPlan.map((day, idx) => ({
            day: day.day,
            focus: day.muscle_focus,
            status: (prog.completedDays || []).includes(idx) ? 'Completed' : 'Pending',
          })));
        } else {
          setWeeklySplit([]);
        }
      } catch {
        if (p.workoutPlan) {
          setWeeklySplit(p.workoutPlan.map((day, idx) => ({
            day: day.day,
            focus: day.muscle_focus,
            status: s.completedDays?.includes(idx) ? 'Completed' : 'Pending',
          })));
        } else {
          setWeeklySplit([]);
        }
      }
    } catch { /* quiet */ }
  };

  const logout = () =>
    axios.post('http://localhost:3000/auth/logout', {}, { withCredentials: true })
      .then(() => navigate('/'))
      .catch(console.error);

  const goalInfo = GOAL_INFO[profile?.goal] || GOAL_INFO.maintenance;
  const bmiInfo = getBMICategory(profile?.bmi);
  const firstName = userName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="bg-[#0f172a] min-h-screen text-slate-100 font-sans selection:bg-purple-500/30 relative">
      {/* Ambient blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-purple-600/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/8 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[25%] h-[25%] bg-violet-700/4 rounded-full blur-[100px]" />
      </div>

      <Header name={userName} logout={logout} />

      <main className="container mx-auto px-4 py-10 max-w-7xl animate-in fade-in duration-700" style={{ paddingBottom: '8rem' }}>

        {/* ── HERO BANNER ── */}
        <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] p-8 md:p-10 mb-8 shadow-2xl overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            {/* Left */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{greeting}</span>
                </div>
                {profile?.goal && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 ${goalInfo.bg} ${goalInfo.border} border rounded-xl`}>
                    <span className="text-xs">{goalInfo.emoji}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${goalInfo.color}`}>{goalInfo.label}</span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-3">
                {firstName},<br />
                <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Let's crush it.
                </span>
              </h1>
              <p className="text-slate-400 text-sm font-medium max-w-md leading-relaxed">
                Your neural-optimized plan is active. Stay consistent and your AI will keep adapting.
              </p>
            </div>

            {/* Right — biometric chips */}
            <div className="flex flex-wrap md:flex-col gap-3 md:items-end shrink-0">
              {[
                { icon: Weight, label: 'Weight', value: profile?.weight ? `${profile.weight} kg` : '—' },
                { icon: Ruler, label: 'Height', value: profile?.height ? `${profile.height} cm` : '—' },
                { icon: Activity, label: 'BMI', value: profile?.bmi ? String(profile.bmi) : '—', extra: bmiInfo },
              ].map(({ icon: Icon, label, value, extra }) => (
                <div key={label} className="flex items-center gap-3 px-5 py-3 bg-slate-800/50 border border-white/5 rounded-2xl">
                  <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-black text-white leading-tight">
                      {value}
                      {extra && <span className={`ml-2 text-[10px] font-bold ${extra.color}`}>{extra.label}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <StatsGrid stats={stats} />

        {/* ── WEEKLY SPLIT ── */}
        <div className="mb-8">
          {weeklySplit !== null ? (
            weeklySplit.length > 0
              ? <WeeklySplit
                  weeklySplit={weeklySplit}
                  todayActiveDay={todayActiveDay}
                  currentDayIndex={currentDayIndex}
                  onDayClick={(dayIndex) => navigate(`/workout?day=${dayIndex}`)}
                />
              : (
                <div className="bg-slate-900/40 backdrop-blur-xl border border-dashed border-slate-700/60 rounded-[2.5rem] p-12 flex flex-col items-center justify-center h-full text-center">
                  <div className="w-14 h-14 bg-slate-800/50 border border-slate-700/50 rounded-2xl flex items-center justify-center mb-4">
                    <Dumbbell className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="text-slate-500 font-black text-sm uppercase tracking-widest mb-3">No plan active</p>
                  <button onClick={() => navigate('/workout')} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-black text-xs tracking-widest hover:bg-purple-500 transition-all">
                    Generate Plan
                  </button>
                </div>
              )
          ) : (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/30 rounded-[2.5rem] p-12 flex items-center justify-center h-64">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Loading plan data...</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
