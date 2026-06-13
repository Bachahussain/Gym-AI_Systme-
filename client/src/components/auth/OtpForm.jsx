import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ArrowRight } from 'lucide-react';

const OtpForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { email, name } = location.state || {};
    
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const inputRefs = useRef([]);

    // Redirect back to signup if accessed directly without email state
    useEffect(() => {
        if (!email) {
            navigate('/signup');
        }
    }, [email, navigate]);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;
        
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Focus next input
        if (element.value !== "" && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (otp[index] === '' && index > 0) {
                inputRefs.current[index - 1].focus();
            } else {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain').slice(0, 6).split('');
        if (pastedData.some(isNaN)) return;
        
        const newOtp = [...otp];
        pastedData.forEach((char, index) => {
            if (index < 6) newOtp[index] = char;
        });
        setOtp(newOtp);
        
        // Focus the appropriate input
        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex].focus();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError("Please enter all 6 digits.");
            return;
        }

        setLoading(true);
        setError(null);

        axios.post("http://localhost:3000/auth/verify-otp", {
            email,
            otp: otpString,
        }, { withCredentials: true })
        .then((res) => {
            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
            }
            navigate("/profile-setup", { state: { name: res.data.name || name } });
        })
        .catch((err) => {
            setError(err.response?.data?.error || "OTP verification failed. Please try again.");
            setOtp(['', '', '', '', '', '']); // Clear OTP on error
            inputRefs.current[0].focus();
        })
        .finally(() => setLoading(false));
    };

    const handleResend = () => {
        // Normally you would trigger send-otp again here.
        // Assuming we need password to send-otp, you might need to handle this differently in a real app,
        // or have a specific /auth/resend-otp endpoint that only takes email if the user is already in the map.
        // For now, we redirect to signup.
        navigate('/signup');
    };

    // Mask email for display
    const maskEmail = (email) => {
        if (!email) return '';
        const [local, domain] = email.split('@');
        return `${local[0]}***@${domain}`;
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-black text-white tracking-tighter mb-2">
                    Check your email
                </h1>
                <p className="text-slate-500 text-sm font-medium">
                    We sent a 6-digit code to {maskEmail(email)}
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-between gap-2" onPaste={handlePaste}>
                    {otp.map((data, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength="1"
                            ref={el => inputRefs.current[index] = el}
                            value={data}
                            onChange={(e) => handleChange(e.target, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className="w-12 h-14 text-center bg-slate-800/60 border border-white/[0.07] text-white rounded-xl text-xl font-bold focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
                        />
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={loading || timeLeft <= 0}
                    className="w-full mt-6 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-60"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            VERIFY & CONTINUE
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            {/* Resend / Timer */}
            <div className="mt-8 text-center text-sm font-medium">
                {timeLeft > 0 ? (
                    <p className="text-slate-500">
                        Code expires in <span className="text-purple-400">{formatTime(timeLeft)}</span>
                    </p>
                ) : (
                    <div className="space-y-2">
                        <p className="text-red-400">Code has expired.</p>
                        <button 
                            onClick={handleResend}
                            className="text-purple-400 hover:text-purple-300 font-bold transition-colors"
                        >
                            Back to Sign Up
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OtpForm;
