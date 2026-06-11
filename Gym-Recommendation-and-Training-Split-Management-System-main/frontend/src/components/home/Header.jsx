import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { User, LogOut, ShieldCheck, Settings, ChevronDown, Bell, LayoutDashboard, Dumbbell, Utensils, LineChart } from 'lucide-react';
import axios from 'axios';
import ProfileSidebar from './ProfileSidebar';

const Header = ({ name, logout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [profile, setProfile] = useState(null);

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { label: 'Dashboard', path: '/home', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Workouts', path: '/workout', icon: <Dumbbell className="w-4 h-4" /> },
        { label: 'Nutrition', path: '/nutrition', icon: <Utensils className="w-4 h-4" /> },
        { label: 'Analytics', path: '/analytics', icon: <LineChart className="w-4 h-4" /> },
    ];

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get("http://localhost:3000/user/me", { withCredentials: true });
                setProfile(res.data);
            } catch (err) {
                console.error("Header profile fetch error:", err);
            }
        };
        fetchProfile();
    }, []);

    return (
        <>
            <div className="fixed top-0 left-0 w-full z-50 px-6 py-5 pointer-events-none">
                <header className="container mx-auto max-w-7xl flex justify-between items-center bg-slate-950/40 backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] px-8 py-4 pointer-events-auto shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_40px_rgba(79,70,229,0.1)] relative overflow-hidden group/header">
                    {/* Subtle Internal Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover/header:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

                    {/* Logo Section */}
                    <Link to="/home" className="flex items-center gap-4 group transition-transform hover:scale-[1.02] active:scale-[0.98] relative z-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-600/30 blur-2xl rounded-full scale-150 group-hover:scale-200 transition-transform duration-700"></div>
                            <div className="relative w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center text-white font-black shadow-2xl group-hover:shadow-purple-600/40 transition-all duration-500 border border-white/20">
                                G
                            </div>
                        </div>
                        <span className="text-3xl font-black tracking-tighter text-white italic drop-shadow-lg">
                            GYM<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">AI</span>
                        </span>
                    </Link>

                    {/* Navigation Desktop */}
                    <nav className="hidden xl:flex items-center gap-1 p-1.5 bg-white/[0.03] border border-white/[0.05] rounded-[2rem] backdrop-blur-md relative z-10">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-5 py-2.5 rounded-2xl font-bold transition-all text-xs tracking-tight flex items-center gap-2 ${isActive(item.path)
                                    ? 'text-white bg-white/10 shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        ))}
                        {profile?.is_pro && (
                            <>
                                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                <button className="px-5 py-2.5 rounded-2xl text-yellow-500 font-black hover:bg-yellow-500/10 transition-all flex items-center gap-2 text-xs uppercase tracking-widest group/pro">
                                    <ShieldCheck className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                                    PRO
                                </button>
                            </>
                        )}
                    </nav>

                    {/* User Actions */}
                    <div className="flex items-center gap-4 relative z-10">
                        <div
                            onClick={() => setIsSidebarOpen(true)}
                            className="flex items-center gap-3.5 pl-2 pr-4.5 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-full border border-white/[0.08] transition-all cursor-pointer group shadow-xl hover:border-purple-500/30"
                        >
                            <div className="w-10 h-10 bg-gradient-to-tr from-slate-700 via-slate-800 to-slate-900 rounded-full flex items-center justify-center text-white text-sm font-black border border-white/20 group-hover:scale-105 transition-all duration-300">
                                {name?.charAt(0) || 'U'}
                            </div>
                            <div className="hidden lg:block">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5 opacity-80">{profile?.experience_level || 'Athlete'}</p>
                                <p className="text-[15px] font-black text-slate-200 leading-none tracking-tight">{name}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-all group-hover:rotate-180 duration-500" />
                        </div>
                    </div>
                </header>
            </div>

            <div className="h-32 pointer-events-none"></div> {/* Spacer for fixed header */}

            <ProfileSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                name={name}
                logout={logout}
            />
        </>
    );
};

export default Header;
