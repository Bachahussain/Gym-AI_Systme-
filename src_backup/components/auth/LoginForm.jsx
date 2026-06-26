import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

const LoginForm = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handle = (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        axios.post("http://localhost:3000/auth/login", {
            email,
            password,
        }, { withCredentials: true }
        ).then((res) => {
            localStorage.setItem("token", res.data.token);
            navigate("/home", { state: { name: res.data.name } });
        }).catch((err) => {
            setError(err.response?.data?.error || "Login failed. Please check your credentials.");
            console.log(err);
        }).finally(() => setLoading(false));
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-black text-white tracking-tighter mb-2">
                    Welcome Back
                </h1>
                <p className="text-slate-500 text-sm font-medium">
                    Synchronize with your AI training core
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
                    {error}
                </div>
            )}

            <form onSubmit={handle} className="space-y-4">
                {/* Email */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-slate-800/60 border border-white/[0.07] text-white placeholder:text-slate-600 rounded-2xl pl-11 pr-4 py-4 text-sm font-medium focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                    />
                </div>

                {/* Password */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-slate-500" />
                    </div>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-slate-800/60 border border-white/[0.07] text-white placeholder:text-slate-600 rounded-2xl pl-11 pr-4 py-4 text-sm font-medium focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-60"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            ACCESS SYSTEM
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            {/* Sign up link */}
            <p className="mt-8 text-center text-sm text-slate-600">
                No account?{' '}
                <Link to="/signup" className="text-purple-400 font-bold hover:text-purple-300 transition-colors">
                    Create one now
                </Link>
            </p>
        </div>
    );
};

export default LoginForm;
