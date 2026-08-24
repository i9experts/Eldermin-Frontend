// ============================================================
// RESELLER PORTAL LOGIN — Eldermin Partner Network (Phase 2)
// Deliberately its own page, outside the main tenant/Super-Admin
// <Layout> — a partner has no school tenant and no reason to see any
// of that chrome. See services/resellerPortalAuth.ts for the isolated
// token storage.
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Handshake, Loader2 } from 'lucide-react';
import { resellerPortalLogin } from '../../services/resellerPortalAuth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resellerPortalLogin(email, password);
      navigate('/partner');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1e30] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
            <Handshake size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Eldermin Partner Portal</p>
            <p className="text-[10px] text-gray-400">For certified resellers &amp; distributors</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg p-2.5">{error}</div>}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#16304f] disabled:opacity-60">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-[11px] text-gray-400 text-center">
          Don't have partner portal access yet? Contact your Eldermin account manager.
        </p>
      </div>
    </div>
  );
};

export default Login;
