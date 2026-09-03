import React, { useState } from 'react';
import { loginWithUsername, registerWithUsername, loginAsGuest } from '../../lib/multiplayerService';
import { UserRole } from '../../types/rpg';
import { Shield, Sparkles, User, Lock, Crown, X, UserCheck } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  currentRole: UserRole;
  onRoleSelected: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  currentRole,
  onRoleSelected,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup' | 'guest'>('guest');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const finalUser = username.trim();
      if (!finalUser) throw new Error('Please enter your username.');
      if (!password) throw new Error('Please enter your password.');
      await loginWithUsername(finalUser, password, selectedRole);
      onRoleSelected(selectedRole);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in. Check username and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const finalUser = username.trim();
      if (!finalUser) throw new Error('Please choose a username.');
      if (!password || password.length < 4) throw new Error('Password must be at least 4 characters long.');
      await registerWithUsername(finalUser, password, selectedRole);
      onRoleSelected(selectedRole);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginAsGuest(username.trim() || 'Guest Hero', selectedRole);
      onRoleSelected(selectedRole);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to enter as guest.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#151518] border border-[#3c3c44] rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header Banner */}
        <div className="p-5 bg-gradient-to-b from-[#222228] to-[#1a1a1d] border-b border-[#3c3c44] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#c5a059]/10 border border-[#c5a059] flex items-center justify-center text-[#c5a059]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#e0d7c6] uppercase tracking-wider">
                Adventurer Portal
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-[#c5a059]">
                Online Multiplayer Tabletop Session
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#e0d7c6]/60 hover:text-[#e0d7c6] p-1.5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 border-b border-[#3c3c44] bg-[#0c0c0e] text-xs font-serif uppercase tracking-wider">
          <button
            onClick={() => { setTab('guest'); setError(null); }}
            className={`py-3 text-center border-b-2 transition-all cursor-pointer ${
              tab === 'guest'
                ? 'border-[#c5a059] text-[#c5a059] font-bold bg-[#1a1a1d]'
                : 'border-transparent text-[#e0d7c6]/60 hover:text-[#e0d7c6]'
            }`}
          >
            Instant Guest
          </button>
          <button
            onClick={() => { setTab('signin'); setError(null); }}
            className={`py-3 text-center border-b-2 transition-all cursor-pointer ${
              tab === 'signin'
                ? 'border-[#c5a059] text-[#c5a059] font-bold bg-[#1a1a1d]'
                : 'border-transparent text-[#e0d7c6]/60 hover:text-[#e0d7c6]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setError(null); }}
            className={`py-3 text-center border-b-2 transition-all cursor-pointer ${
              tab === 'signup'
                ? 'border-[#c5a059] text-[#c5a059] font-bold bg-[#1a1a1d]'
                : 'border-transparent text-[#e0d7c6]/60 hover:text-[#e0d7c6]'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded text-xs text-red-200">
              {error}
            </div>
          )}

          {/* Role Choice */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-serif uppercase tracking-widest text-[#c5a059]">
              Choose Your Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('PLAYER')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  selectedRole === 'PLAYER'
                    ? 'border-[#c5a059] bg-[#c5a059]/10 text-[#c5a059] font-bold shadow-[0_0_10px_rgba(197,160,89,0.2)]'
                    : 'border-[#3c3c44] bg-[#1a1a1d] text-[#e0d7c6]/70 hover:border-[#c5a059]/50'
                }`}
              >
                <User className="w-4 h-4 text-[#c5a059]" />
                <div>
                  <div className="text-xs font-serif uppercase">Player Hero</div>
                  <div className="text-[9px] text-[#e0d7c6]/50">Command a character</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('DM')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  selectedRole === 'DM'
                    ? 'border-amber-500 bg-amber-950/30 text-amber-300 font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'border-[#3c3c44] bg-[#1a1a1d] text-[#e0d7c6]/70 hover:border-amber-500/50'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-serif uppercase">Dungeon Master</div>
                  <div className="text-[9px] text-[#e0d7c6]/50">Control monsters &amp; world</div>
                </div>
              </button>
            </div>
          </div>

          {/* Guest Mode Content */}
          {tab === 'guest' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#0c0c0e] border border-[#3c3c44] rounded text-xs text-[#e0d7c6]/70 leading-relaxed">
                Jump directly into the live multiplayer campaign as an anonymous guest with full sync across tabs and devices.
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-serif uppercase tracking-widest text-[#e0d7c6]/80">
                  Hero Name or Title
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Valerius the Bold"
                  className="w-full p-2.5 bg-[#0c0c0e] border border-[#3c3c44] rounded text-xs text-[#e0d7c6] focus:border-[#c5a059] focus:outline-none"
                />
              </div>

              <button
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full py-3 bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold uppercase tracking-widest text-xs rounded transition-all cursor-pointer shadow-[0_0_15px_rgba(197,160,89,0.3)] disabled:opacity-50"
              >
                {loading ? 'Joining Session...' : 'Enter Live Campaign as Guest'}
              </button>
            </div>
          )}

          {/* Sign In Form */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="text-[11px] font-serif uppercase tracking-widest text-[#e0d7c6]/80 block mb-1">
                  Adventurer Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-[#e0d7c6]/40" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Valerius, Rency"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0c0c0e] border border-[#3c3c44] rounded text-xs text-[#e0d7c6] focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-serif uppercase tracking-widest text-[#e0d7c6]/80 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-[#e0d7c6]/40" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0c0c0e] border border-[#3c3c44] rounded text-xs text-[#e0d7c6] focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold uppercase tracking-widest text-xs rounded transition-all cursor-pointer shadow-[0_0_15px_rgba(197,160,89,0.3)] disabled:opacity-50 mt-2"
              >
                {loading ? 'Signing In...' : 'Sign In & Enter'}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="text-[11px] font-serif uppercase tracking-widest text-[#e0d7c6]/80 block mb-1">
                  Choose Adventurer Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-[#e0d7c6]/40" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Valerius the Bold"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0c0c0e] border border-[#3c3c44] rounded text-xs text-[#e0d7c6] focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-serif uppercase tracking-widest text-[#e0d7c6]/80 block mb-1">
                  Password (min 4 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-[#e0d7c6]/40" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0c0c0e] border border-[#3c3c44] rounded text-xs text-[#e0d7c6] focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold uppercase tracking-widest text-xs rounded transition-all cursor-pointer shadow-[0_0_15px_rgba(197,160,89,0.3)] disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Character Profile...' : 'Register Account & Join Campaign'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
