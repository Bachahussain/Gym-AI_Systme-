import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, LineChart, Sparkles, TrendingUp } from 'lucide-react';
import Header from './components/home/Header';

const GOAL_INFO = {
  weight_loss: { label: 'Fat Loss', color: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  muscle_gain: { label: 'Bodybuilding', color: 'text-indigo-300', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  maintenance: { label: 'Athletic Performance', color: 'text-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
};

const getGoalText = (goal) => {
  if (goal === 'weight_loss') return 'Focus on slow, consistent downward trend with preserved training quality.';
  if (goal === 'muscle_gain') return 'Focus on steady upward trend while strength and recovery improve.';
  return 'Focus on stable bodyweight while training output and recovery improve.';
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
};

const formatNumber = (value, suffix = '') => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(1)}${suffix}`;
};

const formatDelta = (value, suffix = '') => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}${suffix}`;
};

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Athlete');
  const [profile, setProfile] = useState(null);
  const [progressHistory, setProgressHistory] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [userRes, historyRes] = await Promise.all([
          axios.get('http://localhost:3000/user/me', { withCredentials: true }),
          axios.get('http://localhost:3000/user/stats/history', { withCredentials: true }).catch(() => ({ data: { entries: [], summary: null } })),
        ]);

        setUserName(userRes.data?.name || 'Athlete');
        setProfile(userRes.data || null);
        setProgressHistory(historyRes.data?.entries || []);
        setProgressSummary(historyRes.data?.summary || null);
      } catch (error) {
        console.error('Analytics init error:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const logout = () =>
    axios.post('http://localhost:3000/auth/logout', {}, { withCredentials: true })
      .then(() => navigate('/'))
      .catch(console.error);

  const goalInfo = GOAL_INFO[profile?.goal] || GOAL_INFO.maintenance;

  const comparisonRows = useMemo(() => {
    const metrics = progressSummary?.metrics || {};

    return [
      {
        key: 'weight',
        label: 'Weight',
        previous: formatNumber(metrics.weight?.previous, ' kg'),
        current: formatNumber(metrics.weight?.current ?? profile?.weight, ' kg'),
        delta: formatDelta(metrics.weight?.changeFromPrevious, ' kg'),
      },
      {
        key: 'bmi',
        label: 'BMI',
        previous: formatNumber(metrics.bmi?.previous),
        current: formatNumber(metrics.bmi?.current ?? profile?.bmi),
        delta: formatDelta(metrics.bmi?.changeFromPrevious),
      },
      {
        key: 'experience',
        label: 'Experience Level',
        previous: metrics.experienceLevel?.previous || '—',
        current: metrics.experienceLevel?.current || profile?.experience_level || '—',
        delta: metrics.experienceLevel?.previous
          ? `${metrics.experienceLevel.previous} to ${metrics.experienceLevel.current || profile?.experience_level || '—'}`
          : '—',
      },
      {
        key: 'days',
        label: 'Days / Week',
        previous: formatNumber(metrics.workoutDays?.previous),
        current: formatNumber(metrics.workoutDays?.current ?? profile?.workout_days),
        delta: formatDelta(metrics.workoutDays?.changeFromPrevious),
      },
    ];
  }, [progressSummary, profile]);

  return (
    <div className="bg-[#0f172a] min-h-screen text-slate-100 font-sans selection:bg-purple-500/30 relative">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-purple-600/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/8 rounded-full blur-[140px]" />
      </div>

      <Header name={userName} logout={logout} />

      <main className="container mx-auto px-4 py-10 max-w-7xl animate-in fade-in duration-700" style={{ paddingBottom: '8rem' }}>
        <div className="mb-10">
          <div className="flex items-center gap-3 text-purple-400 font-black text-[9px] tracking-[0.4em] mb-3 uppercase">
            <div className="w-8 h-[2px] bg-purple-500" />
            Performance Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none mb-2">
            Progress <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Analytics</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Single-source body progress comparison with full timeline history.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-purple-500/20 blur-[60px] rounded-full animate-pulse" />
              <div className="relative p-10 bg-slate-900 border border-purple-500/20 rounded-[3rem] shadow-2xl">
                <LineChart className="w-14 h-14 text-purple-400 animate-bounce" />
              </div>
            </div>
            <p className="text-slate-500 font-black uppercase tracking-[0.25em] text-xs">Aggregating Neural Data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Body Achievement
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Previous vs Current Snapshot</p>
                </div>
                <div className={`px-4 py-2 rounded-xl border ${goalInfo.bg} ${goalInfo.border}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${goalInfo.color}`}>{goalInfo.label}</p>
                </div>
              </div>

              <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-6">
                <p className="text-sm font-bold text-indigo-100">{getGoalText(profile?.goal)}</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-950/35">
                <div className="grid grid-cols-4 gap-0 text-[10px] uppercase tracking-widest font-black text-slate-500 border-b border-white/5">
                  <div className="p-3">Metric</div>
                  <div className="p-3 border-l border-white/5">Previous</div>
                  <div className="p-3 border-l border-white/5">Current</div>
                  <div className="p-3 border-l border-white/5">Change</div>
                </div>

                {comparisonRows.map((row) => {
                  const deltaClass = row.delta.startsWith('+')
                    ? 'text-emerald-300'
                    : row.delta.startsWith('-')
                      ? 'text-rose-300'
                      : 'text-slate-300';

                  return (
                    <div key={row.key} className="grid grid-cols-4 gap-0 border-b border-white/5 last:border-b-0">
                      <div className="p-4 text-sm font-black text-white">{row.label}</div>
                      <div className="p-4 border-l border-white/5 text-sm font-bold text-slate-300">{row.previous}</div>
                      <div className="p-4 border-l border-white/5 text-sm font-bold text-white">{row.current}</div>
                      <div className={`p-4 border-l border-white/5 text-sm font-black ${deltaClass}`}>{row.delta}</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Timeline</p>
                    <h3 className="text-xl font-black text-white">All Saved Stats</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                    {progressSummary?.totalEntries || 0} entries
                  </span>
                </div>

                {progressHistory.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <p className="text-[11px] text-slate-400 font-medium">No progress entries yet. Add a new stat update to start the timeline.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
                    {progressHistory.map((entry, idx) => (
                      <div key={entry.id || idx} className={`p-4 rounded-2xl border ${idx === 0 ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-white/5 bg-slate-900/30'}`}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="text-sm font-black text-white">{formatNumber(entry.weight, ' kg')}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{formatDate(entry.recordedAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-300">BMI {formatNumber(entry.bmi)}</p>
                            <p className="text-[10px] font-black text-slate-400 mt-1">Days/Week {formatNumber(entry.workoutDays)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                            Level {entry.experienceLevel || '—'}
                          </div>
                          <div className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                            Delta {formatDelta(entry.changeFromPrevious, ' kg')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] p-8 shadow-2xl">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Profile Context</p>
                <h3 className="text-xl font-black text-white mb-5">Static Profile Signals</h3>

                <div className="space-y-3">
                  {[
                    { label: 'Age', value: profile?.age ? `${profile.age} years` : '—' },
                    { label: 'Height', value: profile?.height ? `${profile.height} cm` : '—' },
                    { label: 'Activity Level', value: profile?.activity_level || '—' },
                    { label: 'Preferred Split', value: profile?.preferred_split || '—' },
                    { label: 'Diet Preference', value: profile?.dietary_preference || 'none' },
                    { label: 'Medical Conditions', value: profile?.medical_conditions || 'none' },
                  ].map((item) => (
                    <div key={item.label} className="p-4 bg-slate-950/40 rounded-xl border border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-sm font-black text-white capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-4 bg-slate-950/30 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-purple-300" />
                    <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Consistency Window</p>
                  </div>
                  <p className="text-sm font-bold text-slate-200">
                    {progressSummary?.elapsedDays ?? 0} tracked days between first and latest recorded body snapshot.
                  </p>
                </div>

                <div className="mt-5 p-4 bg-slate-950/30 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-indigo-300" />
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Current Momentum</p>
                  </div>
                  <p className="text-sm font-bold text-slate-200">
                    {formatDelta(progressSummary?.changeFromStart, ' kg')} from first recorded weight.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
