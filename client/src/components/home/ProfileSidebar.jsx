import React, { useEffect, useState, useRef } from 'react';
import {
    Settings, LogOut, ChevronRight, Crown, Sparkles,
    ShieldCheck, User, Copy, Check, Dumbbell, LineChart,
    Zap, Award
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/* Generate a stable "referral" code from the user id or name */
const makeReferralCode = (name = '') =>
    'REF' + Array.from(name.toUpperCase().replace(/\s/g, '') + '000000')
        .slice(0, 6)
        .map(c => c.charCodeAt(0))
        .reduce((a, b) => a + b, 0)
        .toString()
        .padStart(9, '7');

const ProfileSidebar = ({ isOpen, onClose, name, logout }) => {
    const navigate = useNavigate();
    const ref = useRef(null);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    /* Close on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose]);

    const fetchData = async () => {
        try {
            const [profileRes, statsRes] = await Promise.all([
                axios.get('http://localhost:3000/user/me', { withCredentials: true }),
                axios.get('http://localhost:3000/user/stats', { withCredentials: true }),
            ]);
            setProfile(profileRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error('ProfileSidebar fetch error:', err);
        }
    };

    const goTo = (path) => { navigate(path); onClose(); };

    const copyReferral = () => {
        const code = makeReferralCode(name);
        navigator.clipboard.writeText(code).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const referralCode = makeReferralCode(name);

    /* Tier label */
    const tierLabel = profile?.is_pro ? 'PRO Member' : 'Free Tier';
    const tierColor = profile?.is_pro ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20' : 'text-slate-400 bg-slate-700/50 border border-white/5';

    /* Nav items */
    const navItems = [
        { icon: User, label: 'Account Settings', action: () => goTo('/account-settings') },
        { icon: Crown, label: 'Subscription', action: () => goTo('/premium') },
        { icon: Dumbbell, label: 'My Workouts', action: () => goTo('/workout') },
        { icon: LineChart, label: 'Analytics', action: () => goTo('/analytics') },
    ];

    if (!isOpen) return null;

    return (
        <>
            {/* invisible backdrop */}
            <div className="fixed inset-0 z-[65]" onClick={onClose} />

            {/* Dropdown card — positioned below the header avatar */}
            <div
                ref={ref}
                className="fixed top-[88px] right-6 z-[70] w-[320px] bg-[#141424] border border-white/10 rounded-[1.75rem] shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                style={{ backdropFilter: 'blur(24px)' }}
            >
                {/* ── Profile header ── */}
                <div className="px-5 pt-5 pb-4">
                    <div 
                        className="flex items-center gap-3.5 mb-3 cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-2xl transition-all"
                        onClick={() => goTo('/premium')}
                    >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-black shrink-0 shadow-lg shadow-purple-500/20 relative">
                            {name?.charAt(0)?.toUpperCase() || 'U'}
                            {profile?.is_pro && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-[#141424]">
                                    <ShieldCheck className="w-2 h-2 text-slate-900 fill-current" />
                                </div>
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-black text-white leading-tight tracking-tight truncate">{name || 'Athlete'}</p>
                            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{profile?.email || '—'}</p>
                            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${tierColor}`}>
                                {profile?.is_pro ? <><ShieldCheck className="w-2.5 h-2.5" /> PRO Member</> : 'Free Tier'}
                            </span>
                        </div>
                    </div>

                    {/* Mini stat / PRO info card */}
                    {profile?.is_pro ? (
                        <div className="mt-1 px-4 py-3 bg-yellow-500/8 border border-yellow-500/15 rounded-2xl flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-500/10 rounded-xl flex items-center justify-center shrink-0">
                                <Crown className="w-4 h-4 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-yellow-400">AI Plans Unlocked</p>
                                <p className="text-[10px] text-slate-500 font-medium">All premium features active</p>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => goTo('/premium')}
                            className="w-full mt-1 px-4 py-3 bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 rounded-2xl flex items-center gap-3 transition-all group"
                        >
                            <div className="w-8 h-8 bg-purple-500/10 rounded-xl flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-xs font-black text-purple-300">Upgrade to PRO</p>
                                <p className="text-[10px] text-slate-500 font-medium">Unlock AI-powered plans</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    )}
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.06] mx-4" />

                {/* ── Nav items ── */}
                <div className="px-3 py-2">
                    {navItems.map(({ icon: Icon, label, action }) => (
                        <button
                            key={label}
                            onClick={action}
                            className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-white/5 transition-all group text-left"
                        >
                            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-white/8 transition-all">
                                <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{label}</span>
                        </button>
                    ))}
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.06] mx-4" />

                {/* ── Streak / XP mini-card ── */}
                <div className="px-4 py-3">
                    <div className="px-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-orange-500/10 rounded-lg flex items-center justify-center shrink-0">
                                <Zap className="w-3.5 h-3.5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Streak</p>
                                <p className="text-sm font-black text-white">{stats?.streak ?? '—'} <span className="text-[10px] font-bold text-slate-500">days</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total XP</p>
                            <p className="text-sm font-black text-white">{(stats?.totalXp ?? 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-500">xp</span></p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.06] mx-4" />

                {/* ── Logout ── */}
                <div className="px-3 py-2 pb-3">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-red-500/10 transition-all group text-left"
                    >
                        <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500/20 transition-all">
                            <LogOut className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-red-500">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default ProfileSidebar;
