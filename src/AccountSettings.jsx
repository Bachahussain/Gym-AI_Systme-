import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Save, Shield, User, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import Header from './components/home/Header';

const AccountSettings = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Athlete');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const logout = () =>
    axios.post('http://localhost:3000/auth/logout', {}, { withCredentials: true })
      .then(() => navigate('/'))
      .catch(console.error);

  useEffect(() => {
    const init = async () => {
      try {
        const [meRes, accountRes] = await Promise.all([
          axios.get('http://localhost:3000/user/me', { withCredentials: true }),
          axios.get('http://localhost:3000/user/account-settings', { withCredentials: true }),
        ]);

        setUserName(meRes.data?.name || 'Athlete');
        setForm((prev) => ({
          ...prev,
          name: accountRes.data?.name || '',
          email: accountRes.data?.email || '',
        }));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load account settings');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const setValue = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage('');
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload = {
        name: form.name,
        email: form.email,
      };

      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      const res = await axios.put('http://localhost:3000/user/account-settings', payload, { withCredentials: true });
      setMessage(res.data?.message || 'Account settings updated');
      setUserName(res.data?.user?.name || form.name);
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update account settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-[3px] border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] min-h-screen text-slate-100 font-sans selection:bg-purple-500/30 relative">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-purple-600/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/8 rounded-full blur-[140px]" />
      </div>

      <Header name={userName} logout={logout} />

      <main className="container mx-auto px-4 py-10 max-w-4xl" style={{ paddingBottom: '8rem' }}>
        <div className="mb-6">
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight">Account Settings</h1>
            <p className="text-slate-500 text-sm font-medium mt-2">Update your name, email, and password. Body stats are managed in profile setup only.</p>
          </div>

          {(error || message) && (
            <div className={`mb-6 p-4 rounded-2xl border text-sm font-bold ${error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
              {error || message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="space-y-2 block">
                <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <User className="w-3 h-3" /> Name
                </span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setValue('name', e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/[0.08] text-white rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-purple-500/60 transition-all"
                  required
                />
              </label>

              <label className="space-y-2 block">
                <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <Mail className="w-3 h-3" /> Email
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setValue('email', e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/[0.08] text-white rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-purple-500/60 transition-all"
                  required
                />
              </label>
            </div>

            <div className="border border-white/[0.06] rounded-2xl p-5 bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-4 text-slate-300">
                <Shield className="w-4 h-4 text-purple-400" />
                <p className="text-sm font-black">Change Password</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="password"
                  placeholder="Current password"
                  value={form.currentPassword}
                  onChange={(e) => setValue('currentPassword', e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-purple-500/60 transition-all"
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={form.newPassword}
                  onChange={(e) => setValue('newPassword', e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-purple-500/60 transition-all"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={form.confirmPassword}
                  onChange={(e) => setValue('confirmPassword', e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-purple-500/60 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black tracking-wider text-sm transition-all shadow-xl shadow-purple-500/20 disabled:opacity-60"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AccountSettings;
