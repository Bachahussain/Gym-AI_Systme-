import axios from "axios";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChefHat, Dumbbell, Ruler, Weight, User, Settings, Sparkles,
  ChevronRight, Activity, Target, Calendar, Heart, ArrowLeft, Check
} from 'lucide-react';

/* ─── Step config ─────────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: 'Body', icon: User, color: 'purple' },
  { id: 2, label: 'Training', icon: Dumbbell, color: 'indigo' },
  { id: 3, label: 'Health', icon: Heart, color: 'rose' },
];

const GOALS = [
  { key: 'Fat Loss', emoji: '🔥', desc: 'Burn fat & lean out' },
  { key: 'Bodybuilding', emoji: '💪', desc: 'Build muscle & strength' },
  { key: 'Athletic Performance', emoji: '⚡', desc: 'Speed, power & endurance' },
];

const EXPERIENCE = [
  { key: 'Beginner', emoji: '🌱', desc: '< 1 year training' },
  { key: 'Intermediate', emoji: '🔄', desc: '1–3 years training' },
  { key: 'Advanced', emoji: '🏆', desc: '3+ years training' },
];

/* ─── Reusable field wrapper ──────────────────────────────────── */
const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input
    {...props}
    className="w-full bg-slate-800/50 border border-white/[0.08] text-white placeholder:text-slate-600 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20 transition-all"
  />
);

const SelectInput = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full bg-slate-800/50 border border-white/[0.08] text-white rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-purple-500/60 transition-all appearance-none cursor-pointer"
  >
    {children}
  </select>
);

/* ─── Option card picker ──────────────────────────────────────── */
const OptionCard = ({ item, selected, onSelect, accentColor = 'purple' }) => {
  const activeClass = {
    purple: 'bg-purple-500 border-purple-500 shadow-purple-500/25',
    indigo: 'bg-indigo-500 border-indigo-500 shadow-indigo-500/25',
    rose: 'bg-rose-500   border-rose-500   shadow-rose-500/25',
  }[accentColor];

  return (
    <button
      type="button"
      onClick={() => onSelect(item.key)}
      className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 shadow-lg ${selected
          ? `${activeClass} text-white`
          : 'bg-slate-800/30 border-white/5 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
        }`}
    >
      <div className="text-2xl mb-1.5">{item.emoji}</div>
      <p className="font-black text-sm tracking-tight">{item.key}</p>
      <p className="text-[10px] opacity-70 mt-0.5">{item.desc}</p>
    </button>
  );
};

/* ─── Main Component ──────────────────────────────────────────── */
const ProfileSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const forceFullForm = new URLSearchParams(location.search).get('full') === '1';
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState('');
  const [formData, setFormData] = useState({
    age: '', weight: '', height: '', gender: 'male',
    goal: 'Bodybuilding', experience: 'Beginner',
    days: '3', split: 'Full Body',
    dietary_preference: 'none', medical_conditions: 'none',
  });

  useEffect(() => { fetchExistingProfile(); }, [forceFullForm]);

  const fetchExistingProfile = async () => {
    try {
      const res = await axios.get("http://localhost:3000/user/me", { withCredentials: true });
      if (res.data?.user_id) {
        setIsUpdateMode(!forceFullForm);
        setFormData(prev => ({
          ...prev,
          age: res.data.age || '',
          weight: res.data.weight || '',
          height: res.data.height || '',
          gender: res.data.gender || 'male',
          goal: res.data.goal === 'weight_loss' ? 'Fat Loss' : res.data.goal === 'muscle_gain' ? 'Bodybuilding' : 'Athletic Performance',
          experience: res.data.experience_level || 'Beginner',
          days: res.data.workout_days?.toString() || '3',
          split: res.data.preferred_split || 'Full Body',
          dietary_preference: res.data.dietary_preference || 'none',
          medical_conditions: res.data.medical_conditions || 'none',
        }));
      }
    } catch { /* new user */ }
    finally { setLoading(false); }
  };

  const set = (key, value) => {
    setStepError('');
    setFormData(prev => ({ ...prev, [key]: value }));
  };
  const handleChange = e => {
    setStepError('');
    set(e.target.name, e.target.value);
  };

  const isStepValid = (currentStep = step) => {
    if (currentStep === 1) {
      return Boolean(
        String(formData.age).trim() &&
        String(formData.height).trim() &&
        String(formData.weight).trim() &&
        String(formData.gender).trim()
      );
    }

    if (currentStep === 2) {
      return Boolean(
        String(formData.goal).trim() &&
        String(formData.experience).trim() &&
        String(formData.days).trim() &&
        String(formData.split).trim()
      );
    }

    return true;
  };

  const handleNextStep = () => {
    if (!isStepValid()) {
      setStepError('Please fill all required fields before continuing.');
      return;
    }
    setStepError('');
    setStep(s => s + 1);
  };

  const completeSetup = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post("http://localhost:3000/user/profile-setup", formData, { withCredentials: true });
      if (res.data.success) navigate("/home");
    } catch (err) {
      console.error("Profile setup failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading screen ── */
  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-12 h-12 border-[3px] border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  /* ── Quick update mode (returning user) ── */
  if (isUpdateMode) return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans flex items-center justify-center p-4 relative overflow-hidden selection:bg-purple-500/30">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[55%] h-[55%] bg-indigo-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-black text-lg tracking-tight">GYM<span className="text-purple-400">AI</span></span>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.07] rounded-[2.5rem] p-10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-purple-500/10 text-purple-400 mb-5">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Quick Sync</h1>
            <p className="text-slate-500 text-sm font-medium">Update your metrics to recalibrate your AI plan</p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Weight (kg)" icon={Weight}>
                <Input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="75" />
              </Field>
              <Field label="Workout Days" icon={Calendar}>
                <SelectInput name="days" value={formData.days} onChange={handleChange}>
                  {[1, 2, 3, 4, 5, 6, 7].map(d => <option key={d} value={d}>{d} days/week</option>)}
                </SelectInput>
              </Field>
            </div>

            <Field label="Primary Goal" icon={Target}>
              <div className="grid grid-cols-3 gap-2">
                {GOALS.map(g => (
                  <OptionCard key={g.key} item={g} selected={formData.goal === g.key} onSelect={v => set('goal', v)} />
                ))}
              </div>
            </Field>

            <button
              onClick={completeSetup}
              disabled={submitting}
              className="w-full mt-2 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-500/20 disabled:opacity-60"
            >
              {submitting ? 'Syncing...' : <><Sparkles className="w-4 h-4" /> Sync Progress</>}
            </button>

            <button
              onClick={() => setIsUpdateMode(false)}
              className="w-full text-slate-500 font-bold text-sm flex items-center justify-center gap-2 hover:text-slate-400 transition-colors py-2"
            >
              <Settings className="w-4 h-4" /> Reconfigure Full Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Full wizard setup ── */
  const totalSteps = STEPS.length;
  const progress = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans flex items-center justify-center p-4 relative overflow-hidden selection:bg-purple-500/30">
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[55%] h-[55%] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-violet-700/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-black text-lg tracking-tight">GYM<span className="text-purple-400">AI</span></span>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.07] rounded-[2.5rem] p-8 md:p-10 shadow-2xl">

          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((s, i) => {
                const done = step > s.id;
                const active = step === s.id;
                const Icon = s.icon;
                return (
                  <React.Fragment key={s.id}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${done ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                          : active ? 'bg-slate-800 border-2 border-purple-500 text-purple-400'
                            : 'bg-slate-800/50 border border-white/5 text-slate-600'
                        }`}>
                        {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-purple-400' : done ? 'text-slate-400' : 'text-slate-600'}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="flex-1 mx-3 h-[2px] bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all duration-500"
                          style={{ width: step > s.id ? '100%' : '0%' }} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step content */}
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-400" key={step}>

            {/* ── STEP 1: Body Metrics ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white tracking-tighter mb-1">Body Metrics</h2>
                  <p className="text-slate-500 text-sm">Your physical baseline for AI calibration</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Age" icon={User}>
                    <Input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="25" />
                  </Field>
                  <Field label="Gender">
                    <SelectInput name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </SelectInput>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Height (cm)" icon={Ruler}>
                    <Input type="number" name="height" value={formData.height} onChange={handleChange} placeholder="175" />
                  </Field>
                  <Field label="Weight (kg)" icon={Weight}>
                    <Input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="75" />
                  </Field>
                </div>
              </div>
            )}

            {/* ── STEP 2: Training Preferences ── */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white tracking-tighter mb-1">Training Setup</h2>
                  <p className="text-slate-500 text-sm">How you train defines your AI plan</p>
                </div>

                <Field label="Fitness Goal" icon={Target}>
                  <div className="grid grid-cols-3 gap-3">
                    {GOALS.map(g => (
                      <OptionCard key={g.key} item={g} selected={formData.goal === g.key} onSelect={v => set('goal', v)} accentColor="purple" />
                    ))}
                  </div>
                </Field>

                <Field label="Experience Level" icon={Activity}>
                  <div className="grid grid-cols-3 gap-3">
                    {EXPERIENCE.map(e => (
                      <OptionCard key={e.key} item={e} selected={formData.experience === e.key} onSelect={v => set('experience', v)} accentColor="indigo" />
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Days per Week" icon={Calendar}>
                    <SelectInput name="days" value={formData.days} onChange={handleChange}>
                      {[1, 2, 3, 4, 5, 6, 7].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}/week</option>)}
                    </SelectInput>
                  </Field>
                  <Field label="Preferred Split" icon={Dumbbell}>
                    <SelectInput name="split" value={formData.split} onChange={handleChange}>
                      <option value="Full Body">Full Body</option>
                      <option value="Push/Pull/Legs">Push/Pull/Legs</option>
                      <option value="Upper/Lower">Upper/Lower</option>
                      <option value="Bro Split">Bro Split</option>
                    </SelectInput>
                  </Field>
                </div>
              </div>
            )}

            {/* ── STEP 3: Health & Diet ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white tracking-tighter mb-1">Health & Diet</h2>
                  <p className="text-slate-500 text-sm">So your AI plan stays safe and personalized</p>
                </div>

                <Field label="Dietary Preference" icon={ChefHat}>
                  <Input
                    type="text" name="dietary_preference"
                    value={formData.dietary_preference} onChange={handleChange}
                    placeholder="e.g. Vegan, Keto, No Seafood"
                  />
                </Field>

                <Field label="Medical Conditions (Optional)" icon={Heart}>
                  <Input
                    type="text" name="medical_conditions"
                    value={formData.medical_conditions} onChange={handleChange}
                    placeholder="e.g. Asthma, Knee Injury"
                  />
                </Field>

                {/* Summary preview */}
                <div className="p-5 bg-purple-500/8 border border-purple-500/20 rounded-2xl space-y-2">
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3">Profile Summary</p>
                  {[
                    [`Goal`, formData.goal],
                    [`Level`, formData.experience],
                    [`Training`, `${formData.days} days/week · ${formData.split}`],
                    [`Body`, `${formData.height}cm · ${formData.weight}kg`],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                      <span className="text-xs font-bold text-white">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => {
                  setStepError('');
                  setStep(s => s - 1);
                }}
                className="px-5 py-4 bg-slate-800/60 border border-white/5 text-slate-400 rounded-2xl font-black hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {step < totalSteps ? (
              <button
                onClick={handleNextStep}
                disabled={!isStepValid()}
                className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed text-white rounded-2xl font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-500/20"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={completeSetup}
                disabled={submitting}
                className="flex-1 py-4 bg-white hover:bg-slate-100 text-slate-950 rounded-2xl font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-60"
              >
                {submitting ? 'Initializing...' : <><Sparkles className="w-4 h-4" /> Initialize System</>}
              </button>
            )}
          </div>

          {stepError && (
            <p className="mt-3 text-xs font-bold text-red-400">{stepError}</p>
          )}

          <p className="text-center text-slate-600 text-xs mt-5 font-bold">Step {step} of {totalSteps}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
