import React, { useState } from 'react';
import { UserRole, Character, UserProfile } from '../../types/rpg';
import { Flame, Shield, User, Crown, LogOut, Compass, Sparkles, Wifi, Copy, Check, Users, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface HeaderProps {
  currentRole: UserRole;
  activeCharacter: Character;
  userProfile: UserProfile | null;
  roomCode: string;
  onSwitchRole: (role: UserRole) => void;
  activeTab: 'login' | 'landing' | 'dashboard' | 'tabletop' | 'dm' | 'creator';
  setActiveTab: (tab: 'login' | 'landing' | 'dashboard' | 'tabletop' | 'dm' | 'creator') => void;
  onOpenCharacterSheet: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  connectedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  activeCharacter,
  userProfile,
  roomCode,
  onSwitchRole,
  activeTab,
  setActiveTab,
  onOpenCharacterSheet,
  onOpenAuthModal,
  onLogout,
  connectedCount,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyRoom = () => {
    try {
      const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomCode)}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <header className="border-b border-[#3c3c44] bg-[#1a1a1d] sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Logo & Campaign room info */}
        <div className="flex items-center gap-3 select-none">
          <div 
            onClick={() => setActiveTab('tabletop')}
            className="w-10 h-10 bg-[#c5a059] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(197,160,89,0.3)] text-black font-serif font-bold text-xl cursor-pointer hover:scale-105 transition-transform"
          >
            Ω
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 
                onClick={() => setActiveTab('tabletop')}
                className="text-base sm:text-lg font-serif font-bold tracking-wider uppercase text-[#c5a059] cursor-pointer hover:text-[#e0d7c6] transition-colors"
              >
                The Lost Dungeon
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-[#0c0c0e] text-[#4ade80] border border-[#3c3c44] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse"></span>
                {isSupabaseConfigured ? 'Supabase Realtime' : 'Multiplayer Ready'}
              </span>
            </div>
            
            {/* Room Code Badge */}
            <div className="flex items-center gap-2 mt-0.5">
              <button
                onClick={handleCopyRoom}
                title="Click to copy Room Invite Link to share with friends"
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#0c0c0e] border border-[#3c3c44] hover:border-[#c5a059] text-[9px] font-mono text-[#e0d7c6]/70 hover:text-[#c5a059] transition-colors cursor-pointer"
              >
                <span className="text-[#c5a059]">Room:</span>
                <span className={copied ? 'text-emerald-400 font-bold' : ''}>{copied ? 'Link Copied!' : roomCode}</span>
                {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-[#e0d7c6]/40" />}
              </button>

              <span className="text-[10px] text-[#e0d7c6]/50 flex items-center gap-1 font-mono">
                <Users className="w-3 h-3 text-[#c5a059]" />
                <span>{connectedCount} online</span>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-[#151518] p-1 rounded-lg border border-[#3c3c44] text-xs font-serif uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('tabletop')}
            className={`px-3.5 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'tabletop'
                ? 'bg-[#c5a059] text-black font-bold shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                : 'text-[#e0d7c6]/70 hover:text-[#e0d7c6] hover:bg-[#1a1a1d]'
            }`}
          >
            Tabletop
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#c5a059] text-black font-bold shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                : 'text-[#e0d7c6]/70 hover:text-[#e0d7c6] hover:bg-[#1a1a1d]'
            }`}
          >
            Campaign
          </button>
          <button
            onClick={() => setActiveTab('creator')}
            className={`px-3.5 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'creator'
                ? 'bg-[#c5a059] text-black font-bold shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                : 'text-[#e0d7c6]/70 hover:text-[#e0d7c6] hover:bg-[#1a1a1d]'
            }`}
          >
            + Create Hero
          </button>
          <button
            onClick={() => {
              onSwitchRole('DM');
              setActiveTab('dm');
            }}
            className={`px-3.5 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dm' || currentRole === 'DM'
                ? 'bg-amber-950/80 border border-amber-600/60 text-[#c5a059] font-bold'
                : 'text-[#e0d7c6]/70 hover:text-[#c5a059] hover:bg-[#1a1a1d]'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>DM Screen</span>
          </button>
        </nav>

        {/* User Account / Auth & Role Switcher */}
        <div className="flex items-center gap-2.5">
          
          {/* Active Player Persona & Account Username */}
          <div className="flex items-center gap-2 bg-[#121215] border border-[#3c3c44] px-2.5 py-1.5 rounded-lg shadow-sm">
            <div className="w-7 h-7 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/60 flex items-center justify-center text-[#c5a059] shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-[#c5a059] uppercase font-mono tracking-wider font-semibold">User:</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  @{userProfile?.displayName || activeCharacter.ownerName || 'Adventurer'}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" title="Connected & Active" />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] text-[#e0d7c6]/60 font-mono">Hero:</span>
                <span className="text-xs font-serif font-bold text-[#e0d7c6] max-w-[120px] truncate">
                  {currentRole === 'DM' ? 'Master Aldren (DM)' : activeCharacter.name}
                </span>
                <span className="text-[9px] text-[#c5a059]/80 font-mono hidden sm:inline">
                  {currentRole === 'DM' ? '• DM' : `• Lvl ${activeCharacter.level}`}
                </span>
              </div>
            </div>
          </div>

          {/* Character Sheet Trigger Button */}
          {currentRole === 'PLAYER' && (
            <button
              onClick={onOpenCharacterSheet}
              title="Inspect Your D&D 5e Character Sheet"
              className="w-9 h-9 rounded-full border-2 border-[#c5a059] bg-[#151518] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-[#c5a059] shadow-[0_0_10px_rgba(197,160,89,0.2)] cursor-pointer"
            >
              <span className="font-serif font-bold text-xs">{activeCharacter.name[0]}</span>
            </button>
          )}

          {currentRole === 'DM' && (
            <div className="w-9 h-9 rounded-full border-2 border-amber-500 bg-amber-950 flex items-center justify-center text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              <Crown className="w-4 h-4" />
            </div>
          )}

          {/* Switch Hero / Logout Button */}
          <button
            onClick={() => {
              setActiveTab('login');
            }}
            title="Switch Hero or Re-login"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#151518] border border-[#3c3c44] hover:border-[#c5a059] text-xs font-serif text-[#e0d7c6]/80 hover:text-[#c5a059] transition-all cursor-pointer shadow-sm"
          >
            <User className="w-3.5 h-3.5 text-[#c5a059]" />
            <span className="hidden sm:inline">Switch Hero</span>
          </button>

          {/* Logout / Exit Button */}
          {userProfile && (
            <button
              onClick={onLogout}
              title="Sign Out / Return to Login Screen"
              className="p-1.5 rounded bg-[#151518] border border-[#3c3c44] hover:border-red-500/60 text-[#e0d7c6]/60 hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Role Toggle */}
          <button
            onClick={() => {
              const nextRole = currentRole === 'PLAYER' ? 'DM' : 'PLAYER';
              onSwitchRole(nextRole);
              if (nextRole === 'DM') setActiveTab('dm');
              else setActiveTab('tabletop');
            }}
            className="hidden sm:inline-block px-2.5 py-1.5 rounded bg-[#151518] border border-[#3c3c44] hover:border-[#c5a059] text-[10px] uppercase tracking-wider text-[#c5a059] font-serif transition-colors cursor-pointer"
          >
            Role: {currentRole}
          </button>

        </div>
      </div>
    </header>
  );
};
