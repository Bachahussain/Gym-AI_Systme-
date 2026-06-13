import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

const SignupForm = () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handle = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        setError(null);
        axios.post("http://localhost:3000/auth/send-otp", {
            name,
            email,
            password,
        }, { withCredentials: true }
        ).then((res) => {
            // Navigate to OTP verification page, passing the email in state
            navigate("/verify-otp", { state: { email, name } });
        }).catch((err) => {
            setError(err.response?.data?.error || "Signup failed. Please try again.");
            console.log(err);
        }).finally(() => setLoading(false));
    };

    const fields = [
        { icon: <User className="w-4 h-4 text-slate-500" />, type: "text", placeholder: "Full Name", value: name, onChange: (e) => setName(e.target.value) },
        { icon: <Mail className="w-4 h-4 text-slate-500" />, type: "email", placeholder: "Email address", value: email, onChange: (e) => setEmail(e.target.value) },
        { icon: <Lock className="w-4 h-4 text-slate-500" />, type: "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value) },
        { icon: <Lock className="w-4 h-4 text-slate-500" />, type: "password", placeholder: "Confirm Password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value) },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-black text-white tracking-tighter mb-2">
                    Initialize Profile
                </h1>
                <p className="text-slate-500 text-sm font-medium">
                    Begin your AI-optimized fitness journey
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
                    {error}
                </div>
            )}

            <form onSubmit={handle} className="space-y-4">
                {fields.map((field, i) => (
                    <div key={i} className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            {field.icon}
                        </div>
                        <input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={field.value}
                            onChange={field.onChange}
                            required
                            className="w-full bg-slate-800/60 border border-white/[0.07] text-white placeholder:text-slate-600 rounded-2xl pl-11 pr-4 py-4 text-sm font-medium focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                        />
                    </div>
                ))}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-60"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            SEND OTP
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            {/* Login link */}
            <p className="mt-8 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/" className="text-purple-400 font-bold hover:text-purple-300 transition-colors">
                    Sign in
                </Link>
            </p>
        </div>
    );
};

export default SignupForm;
