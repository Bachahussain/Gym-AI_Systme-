import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './components/home/Header';
import axios from 'axios';
import {
    ShieldCheck, Zap, Brain, Dumbbell, Utensils, LineChart,
    CheckCircle2, Crown, Star, ArrowLeft, Sparkles, Lock
} from 'lucide-react';

const FEATURES = [
    { icon: Brain, label: 'AI Plan Generation', desc: 'Custom workout & diet plans built by Gemini AI for your exact body & goals' },
    { icon: Dumbbell, label: 'Unlimited Workout Plans', desc: 'Regenerate your plan every week with variety and progressive overload' },
    { icon: Utensils, label: '7-Day Meal Strategy', desc: 'Full week of personalized nutrition targeting your caloric needs' },
    { icon: LineChart, label: 'Performance Analytics', desc: 'Deep biometric insights, muscle breakdown & achievement tracking' },
    { icon: Zap, label: 'Adaptive Difficulty', desc: 'AI adjusts intensity and volume based on your experience level' },
    { icon: Star, label: 'Priority Support', desc: 'Get help fast with dedicated PRO member support' },
];

const PLANS = [
    {
        id: 'monthly',
        label: 'Monthly',
        price: '$9.99',
        period: '/month',
        badge: null,
        highlight: false,
    },
    {
        id: 'annual',
        label: 'Annual',
        price: '$4.99',
        period: '/month',
        badge: '🔥 Best Value — Save 50%',
        highlight: true,
        note: 'Billed as $59.99/year',
    },
    {
        id: 'lifetime',
        label: 'Lifetime',
        price: '$99',
        period: 'one-time',
        badge: null,
        highlight: false,
        note: 'Pay once, own forever',
    },
];

const Premium = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('Athlete');
    const [profile, setProfile] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState('annual');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:3000/user/me', { withCredentials: true })
            .then(res => { setUserName(res.data.name); setProfile(res.data); })
            .catch(console.error);
    }, []);

    const logout = () =>
        axios.post('http://localhost:3000/auth/logout', {}, { withCredentials: true })
            .then(() => navigate('/'))
            .catch(console.error);

    const handleSubscribe = async () => {
        if (profile?.is_pro) return;
        setLoading(true);
        try {
            await axios.post('http://localhost:3000/user/upgrade', {}, { withCredentials: true });
            setSuccess(true);
            // Refresh profile
            const res = await axios.get('http://localhost:3000/user/me', { withCredentials: true });
            setProfile(res.data);
        } catch (err) {
            console.error('Upgrade failed:', err);
        } finally {
            setLoading(false);
        }
    };

    /* ── Already PRO screen ── */
    if (profile?.is_pro && !success) return (
        <div className="bg-[#0f172a] min-h-screen text-slate-100 font-sans selection:bg-yellow-500/30 relative">
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-yellow-600/8 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-20%] right-[-15%] w-[55%] h-[55%] bg-amber-600/8 rounded-full blur-[140px]" />
            </div>
            <Header name={userName} logout={logout} />
            <main className="container mx-auto px-4 py-20 pb-24 max-w-2xl text-center">
                <div className="inline-flex p-6 bg-yellow-500/10 border border-yellow-500/25 rounded-[2rem] mb-8">
                    <Crown className="w-16 h-16 text-yellow-400" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-3">You're already <span className="text-yellow-400">PRO</span></h1>
                <p className="text-slate-400 text-lg mb-10">All premium features are unlocked for your account. Enjoy your AI-powered journey.</p>
                <button onClick={() => navigate('/home')} className="px-8 py-4 bg-yellow-500 text-slate-950 rounded-2xl font-black tracking-widest uppercase hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20">
                    Go to Dashboard
                </button>
            </main>
        </div>
    );

    /* ── Success screen ── */
    if (success) return (
        <div className="bg-[#0f172a] min-h-screen text-slate-100 font-sans flex items-center justify-center relative">
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute inset-0 bg-yellow-500/5 rounded-full blur-[200px]" />
            </div>
            <div className="text-center">
                <div className="inline-flex p-6 bg-yellow-500/10 border border-yellow-500/25 rounded-[2rem] mb-8 animate-bounce">
                    <ShieldCheck className="w-16 h-16 text-yellow-400" />
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter mb-3">Welcome to <span className="text-yellow-400">PRO</span> 🎉</h1>
                <p className="text-slate-400 text-lg mb-10">Your AI-powered fitness journey starts now.</p>
                <button onClick={() => navigate('/workout')} className="px-8 py-4 bg-yellow-500 text-slate-950 rounded-2xl font-black tracking-widest uppercase hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20">
                    Generate First AI Plan
                </button>
            </div>
        </div>
    );

    const chosen = PLANS.find(p => p.id === selectedPlan);

    return (
        <div className="bg-[#0f172a] min-h-screen text-slate-100 font-sans selection:bg-yellow-500/20 relative">
            {/* Ambient blobs */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-yellow-600/6 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-600/6 rounded-full blur-[160px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-orange-600/3 rounded-full blur-[120px]" />
            </div>

            <Header name={userName} logout={logout} />

            <main className="container mx-auto px-4 py-12 pb-24 max-w-6xl animate-in fade-in duration-700">

                {/* Back button */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white text-sm font-bold mb-10 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
                </button>

                {/* Hero */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/25 rounded-full mb-6">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em]">GymAI PRO Membership</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4">
                        Unlock Your
                        <br />
                        <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">Full Potential</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium leading-relaxed">
                        Let our AI design your perfect workout and meal plan — tailored to your body, your goals, and your schedule.
                    </p>
                </div>

                {/* Features grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
                    {FEATURES.map(({ icon: Icon, label, desc }) => (
                        <div key={label} className="group p-6 bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-[2rem] hover:border-yellow-500/20 hover:bg-slate-900/70 transition-all duration-300">
                            <div className="w-11 h-11 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-400 mb-4 group-hover:scale-110 transition-transform shadow-lg">
                                <Icon className="w-5 h-5" />
                            </div>
                            <p className="font-black text-white text-sm mb-1.5">{label}</p>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>

                {/* Pricing */}
                <div className="max-w-3xl mx-auto">
                    <p className="text-center text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">Choose your plan</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {PLANS.map(plan => (
                            <button
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative p-6 rounded-[2rem] border text-left transition-all duration-200 ${selectedPlan === plan.id
                                    ? plan.highlight
                                        ? 'bg-gradient-to-b from-yellow-500/15 to-amber-500/5 border-yellow-500/50 shadow-2xl shadow-yellow-500/10'
                                        : 'bg-slate-800/60 border-purple-500/40 shadow-xl shadow-purple-500/10'
                                    : 'bg-slate-900/40 border-white/5 hover:border-slate-600'
                                    }`}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-yellow-500 text-slate-900 text-[9px] font-black uppercase rounded-full whitespace-nowrap shadow-lg">
                                        {plan.badge}
                                    </div>
                                )}
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{plan.label}</p>
                                <p className="text-3xl font-black text-white leading-none">{plan.price}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{plan.period}</p>
                                {plan.note && <p className="text-[9px] text-slate-600 mt-2 font-bold">{plan.note}</p>}

                                {selectedPlan === plan.id && (
                                    <div className="absolute top-4 right-4">
                                        <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="text-center">
                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full max-w-sm py-5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 rounded-2xl font-black tracking-widest uppercase text-sm shadow-2xl shadow-yellow-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3 mx-auto"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> Activating...</>
                            ) : (
                                <><ShieldCheck className="w-5 h-5" /> Subscribe — {chosen?.price} {chosen?.period}</>
                            )}
                        </button>
                        <p className="text-slate-600 text-xs mt-4 font-medium">No hidden fees · Cancel anytime · Instant access</p>
                    </div>
                </div>

                {/* Free vs Pro comparison */}
                <div className="mt-20 max-w-2xl mx-auto">
                    <p className="text-center text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">Free vs PRO</p>
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] overflow-hidden">
                        {[
                            { feature: 'View workout structure', free: true, pro: true },
                            { feature: 'View nutrition layout', free: true, pro: true },
                            { feature: 'Track weekly progress', free: true, pro: true },
                            { feature: 'AI Workout Plan Generation', free: false, pro: true },
                            { feature: 'AI Diet Plan Generation', free: false, pro: true },
                            { feature: 'Adaptive Plan Regeneration', free: false, pro: true },
                            { feature: 'Biometric Analytics', free: false, pro: true },
                        ].map(({ feature, free, pro }, i) => (
                            <div key={feature} className={`flex items-center justify-between px-8 py-4 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''} border-b border-white/5 last:border-0`}>
                                <span className="text-sm font-bold text-slate-300">{feature}</span>
                                <div className="flex gap-10">
                                    <div className="w-12 flex justify-center">
                                        {free
                                            ? <CheckCircle2 className="w-5 h-5 text-slate-500" />
                                            : <Lock className="w-4 h-4 text-slate-700" />}
                                    </div>
                                    <div className="w-12 flex justify-center">
                                        {pro && <CheckCircle2 className="w-5 h-5 text-yellow-400" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="flex items-center justify-end gap-10 px-8 py-3 bg-slate-950/30">
                            <div className="w-12 text-center text-[9px] font-black text-slate-600 uppercase tracking-widest">Free</div>
                            <div className="w-12 text-center text-[9px] font-black text-yellow-500 uppercase tracking-widest">Pro</div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Premium;
