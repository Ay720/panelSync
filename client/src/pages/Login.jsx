import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, Shield, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({ type: 'warning', title: 'Missing fields', message: 'Please enter both email and password' });
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      addToast({ type: 'success', title: 'Welcome back!', message: 'Signed in successfully.' });
      navigate('/');
    } catch (err) {
      addToast({ type: 'error', title: 'Login Failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (role) => {
    setLoading(true);
    try {
      await demoLogin(role);
      addToast({
        type: 'success',
        title: 'Demo Session Started',
        message: `Logged in with ${role.toUpperCase()} privileges.`,
      });
      navigate('/');
    } catch (err) {
      addToast({ type: 'error', title: 'Demo Login Failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-brand-600/20 via-purple-900/10 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Icon */}
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-400 items-center justify-center text-white font-black text-xl shadow-xl shadow-brand-500/25 mb-4">
          PS
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">PanelSync</h2>
        <p className="mt-1 text-xs text-slate-400">
          Smart Multi-Panel Interview Scheduling Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/80 sm:px-10">
          {/* Quick Demo Login Personas */}
          <div className="mb-6 pb-6 border-b border-slate-700">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              ⚡ Instant 1-Click Demo Login
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('admin')}
                className="p-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600/70 text-center transition-all group"
              >
                <Shield className="w-4 h-4 mx-auto text-brand-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="block text-xs font-bold text-white">Admin</span>
                <span className="block text-[10px] text-slate-400">Alexander</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('hr')}
                className="p-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-brand-500/40 text-center transition-all group ring-1 ring-brand-500/30"
              >
                <Sparkles className="w-4 h-4 mx-auto text-brand-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="block text-xs font-bold text-white">HR Lead</span>
                <span className="block text-[10px] text-brand-300 font-semibold">Claire</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoSignIn('interviewer')}
                className="p-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600/70 text-center transition-all group"
              >
                <User className="w-4 h-4 mx-auto text-brand-400 group-hover:scale-110 transition-transform mb-1" />
                <span className="block text-xs font-bold text-white">Panelist</span>
                <span className="block text-[10px] text-slate-400">Dr. Sarah</span>
              </button>
            </div>
          </div>

          {/* Standard Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hr@panelsync.io"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2"
              icon={ArrowRight}
            >
              Sign In to PanelSync
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

