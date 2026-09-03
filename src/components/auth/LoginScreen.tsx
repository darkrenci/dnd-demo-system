import React, { useState } from 'react';
import { Character, UserRole, UserProfile } from '../../types/rpg';
import { 
  loginWithUsername, 
  registerWithUsername, 
  loginAsGuest 
} from '../../lib/multiplayerService';
import { 
  Shield, 
  Sparkles, 
  Sword, 
  Crown, 
  User, 
  Lock, 
  Users, 
  Flame, 
  Compass, 
  Check, 
  ArrowRight,
  PlusCircle,
  Dices,
  KeyRound
} from 'lucide-react';

interface LoginScreenProps {
  characters: Character[];
  defaultRoomCode: string;
  onEnterGame: (characterId: string, role: UserRole, roomCode: string, profile?: UserProfile | null) => void;
  onOpenCharacterCreator: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  characters,
  defaultRoomCode,
  onEnterGame,
  onOpenCharacterCreator,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'quick'>('signin');

  // Strictly deduplicate hero choices by archetype name and filter out any in-game session tokens (hero_*)
  // Ensures that even if multiple players pick the same hero in a campaign, the login screen only ever presents each hero archetype once.
  const availableHeroChoices = React.useMemo(() => {
    const seen = new Set<string>();
    const result: Character[] = [];
    for (const c of characters) {
      const normalized = c.name.trim().toLowerCase();
      // Exclude runtime session clone IDs that start with hero_
      if (!seen.has(normalized) && !c.id.startsWith('hero_')) {
        seen.add(normalized);
        result.push({
          ...c,
          ownerId: undefined,
          ownerName: undefined,
          isOnline: false,
        });
      }
    }
    return result.length > 0 ? result : characters;
  }, [characters]);

  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    availableHeroChoices[0]?.id || 'char-aric'
  );

  // If selected hero ID is not in available choices, synchronize it
  React.useEffect(() => {
    if (!availableHeroChoices.some(c => c.id === selectedCharacterId)) {
      if (availableHeroChoices[0]) {
        setSelectedCharacterId(availableHeroChoices[0].id);
      }
    }
  }, [availableHeroChoices, selectedCharacterId]);

  const [selectedRole, setSelectedRole] = useState<UserRole>('PLAYER');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState('');
  const [roomCode, setRoomCode] = useState<string>(defaultRoomCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosenChar = availableHeroChoices.find(c => c.id === selectedCharacterId) || availableHeroChoices[0] || characters[0];

  const handleQuickPlay = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const finalName = username.trim() || (selectedRole === 'DM' ? 'Master Aldren' : chosenChar.name);
      const profile = await loginAsGuest(finalName, selectedRole, selectedCharacterId);
      onEnterGame(selectedCharacterId, selectedRole, roomCode.trim() || defaultRoomCode, profile);
    } catch (err: any) {
      setError(err?.message || 'Failed to enter campaign as guest.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const finalUser = username.trim();
      if (!finalUser) {
        throw new Error('Please enter your username.');
      }
      if (!password) {
        throw new Error('Please enter your password.');
      }
      const profile = await loginWithUsername(finalUser, password, selectedRole, selectedCharacterId);
      onEnterGame(selectedCharacterId, selectedRole, roomCode.trim() || defaultRoomCode, profile);
    } catch (err: any) {
      setError(err?.message || 'Invalid username or password.');
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
      if (!finalUser) {
        throw new Error('Please choose a username.');
      }
      if (!password || password.length < 4) {
        throw new Error('Password must be at least 4 characters long.');
      }
      const profile = await registerWithUsername(finalUser, password, selectedRole, selectedCharacterId);
      onEnterGame(selectedCharacterId, selectedRole, roomCode.trim() || defaultRoomCode, profile);
    } catch (err: any) {
      setError(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-[#e0d7c6] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* Background Ambience / Subtle Grid & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#241f15]/40 via-[#0c0c0e]/80 to-[#08080a] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#3c3c44 1px, transparent 1px), linear-gradient(to right, #3c3c44 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-4xl bg-[#151518]/95 border border-[#3c3c44] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-md">
        
        {/* Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-[#222228] to-[#151518] border-b border-[#3c3c44] text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#c5a059]/10 border-2 border-[#c5a059] text-[#c5a059] font-serif font-bold text-2xl shadow-[0_0_20px_rgba(197,160,89,0.3)] mb-3">
            Ω
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-wider uppercase text-[#c5a059]">
            The Lost Dungeon: Virtual Tabletop
          </h1>
          <p className="text-xs sm:text-sm text-[#e0d7c6]/70 max-w-xl mx-auto mt-2 font-mono">
            D&D 5e Tabletop Session • Log in and take command of your chosen adventurer
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] uppercase font-mono tracking-widest text-[#c5a059]/90">
            <span className="px-2.5 py-1 rounded bg-[#0c0c0e] border border-[#3c3c44]">
              Real-time Multiplayer
            </span>
            <span className="px-2.5 py-1 rounded bg-[#0c0c0e] border border-[#3c3c44]">
              Independent Character Control
            </span>
            <span className="px-2.5 py-1 rounded bg-[#0c0c0e] border border-[#3c3c44]">
              Fog of War &amp; 5e Combat
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-[#3c3c44] bg-[#0c0c0e] text-xs font-serif uppercase tracking-wider">
          <button
            onClick={() => { setActiveTab('signin'); setError(null); }}
            className={`py-3.5 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'signin'
                ? 'border-[#c5a059] text-[#c5a059] font-bold bg-[#151518]'
                : 'border-transparent text-[#e0d7c6]/60 hover:text-[#e0d7c6]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setError(null); }}
            className={`py-3.5 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'signup'
                ? 'border-[#c5a059] text-[#c5a059] font-bold bg-[#151518]'
                : 'border-transparent text-[#e0d7c6]/60 hover:text-[#e0d7c6]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Register Account</span>
          </button>
          <button
            onClick={() => { setActiveTab('quick'); setError(null); }}
            className={`py-3.5 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'quick'
                ? 'border-[#c5a059] text-[#c5a059] font-bold bg-[#151518]'
                : 'border-transparent text-[#e0d7c6]/60 hover:text-[#e0d7c6]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Play</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {error && (
            <div className="p-3.5 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-200 space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-bold text-red-400 text-sm leading-none">⚠️</span>
                <span className="flex-1">{error}</span>
              </div>
            </div>
          )}

          {/* Role Selection: Player vs DM */}
          <div className="space-y-2">
            <label className="text-[11px] font-serif uppercase tracking-widest text-[#c5a059] font-bold block">
              1. Select Tabletop Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('PLAYER')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                  selectedRole === 'PLAYER'
                    ? 'border-[#c5a059] bg-[#c5a059]/10 text-[#c5a059] font-bold shadow-[0_0_15px_rgba(197,160,89,0.2)]'
                    : 'border-[#3c3c44] bg-[#1a1a1d] text-[#e0d7c6]/70 hover:border-[#c5a059]/50'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#c5a059]/10 border border-[#c5a059] flex items-center justify-center text-[#c5a059]">
                  <Sword className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-serif uppercase tracking-wide">Player Hero</div>
                  <div className="text-[10px] text-[#e0d7c6]/50">Command your personal character on the grid</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('DM')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                  selectedRole === 'DM'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'border-[#3c3c44] bg-[#1a1a1d] text-[#e0d7c6]/70 hover:border-amber-500/50'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-amber-950/40 border border-amber-500 flex items-center justify-center text-amber-400">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-serif uppercase tracking-wide">Dungeon Master</div>
                  <div className="text-[10px] text-[#e0d7c6]/50">Manage monsters, fog of war &amp; narration</div>
                </div>
              </button>
            </div>
          </div>

          {/* Character Selection Grid (Only if Player) */}
          {selectedRole === 'PLAYER' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-serif uppercase tracking-widest text-[#c5a059] font-bold">
                  2. Select Your Controllable Hero
                </label>
                <button
                  type="button"
                  onClick={onOpenCharacterCreator}
                  className="text-[11px] text-[#c5a059] hover:text-[#e0d7c6] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Forge Custom Hero</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {availableHeroChoices.map(char => {
                  const isSelected = char.id === selectedCharacterId;
                  return (
                    <div
                      key={char.id}
                      onClick={() => setSelectedCharacterId(char.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#c5a059] bg-[#221f18] shadow-[0_0_15px_rgba(197,160,89,0.3)] ring-1 ring-[#c5a059]'
                          : 'border-[#3c3c44] bg-[#1a1a1d] hover:border-[#c5a059]/60'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] uppercase tracking-wider font-mono text-[#c5a059] bg-[#0c0c0e] px-1.5 py-0.5 rounded border border-[#c5a059]">
                          <Check className="w-2.5 h-2.5" />
                          <span>Selected</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-serif font-bold text-sm text-black shadow-sm"
                          style={{ backgroundColor: char.color }}
                        >
                          {char.name[0]}
                        </div>
                        <div>
                          <div className="font-serif font-bold text-sm text-[#e0d7c6]">
                            {char.name}
                          </div>
                          <div className="text-[10px] uppercase font-mono text-[#c5a059]">
                            {char.race} • {char.classType}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-[#3c3c44]/60 text-[11px] font-mono text-[#e0d7c6]/70">
                        <div className="flex justify-between">
                          <span>Hit Points:</span>
                          <span className="text-red-400 font-bold">{char.hp}/{char.maxHp} HP</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Armor Class:</span>
                          <span className="text-amber-300 font-bold">{char.ac} AC</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Speed:</span>
                          <span className="text-sky-300">{char.speed} ft</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-[#e0d7c6]/60 italic font-mono mt-1">
                🛡️ Note: Once in the tabletop, only this character token will be controllable by you. Other adventurers will be visible as party allies.
              </p>
            </div>
          )}

          {/* Sign In Tab Content */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-serif uppercase tracking-widest text-[#e0d7c6]/80 block mb-1">
                    Adventurer Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3.5 text-[#e0d7c6]/40" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Valerius, Gandalf, Rency"
                      className="w-full pl-10 pr-3 py-3 bg-[#0c0c0e] border border-[#3c3c44] rounded-lg text-xs text-[#e0d7c6] focus:border-[#c5a059] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-serif uppercase tracking-widest text-[#e0d7c6]/80 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3.5 text-[#e0d7c6]/40" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-3 bg-[#0c0c0e] border border-[#3c3c44] rounded-lg text-xs text-[#e0d7c6] focus:border-[#c5a059] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-serif uppercase tracking-widest text-[#e0d7c6]/80 block mb-1">
                  Campaign Room Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-[#e0d7c6]/40" />
                  <input
                    type="text"
                    required
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="whispering-catacombs"
                    className="w-full pl-10 pr-3 py-3 bg-[#0c0c0e] border border-[#3c3c44] rounded-lg text-xs text-[#e0d7c6] focus:border-[#c5a059] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold uppercase tracking-widest text-sm rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(197,160,89,0.35)] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In & Enter Campaign'}
              </button>

              <div className="flex items-center justify-between text-[11px] text-[#e0d7c6]/60 pt-1">
                <span>First time adventuring?</span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('signup'); setError(null); }}
                  className="text-[#c5a059] hover:underline cursor-pointer"
                >
                  Create new account &rarr;
                </button>
              </div>
            </form>
          )}

          {/* Register Tab Content */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-serif uppercase tracking-widest text-[#e0d7c6]/80 block mb-1">
                    Choose Adventurer Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3.5 text-[#e0d7c6]/40" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Valerius, Rency"
                      className="w-full pl-10 pr-3 py-3 bg-[#0c0c0e] border border-[#3c3c44] rounded-lg text-xs text-[#e0d7c6] focus:border-[#c5a059] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-serif uppercase tracking-widest text-[#e0d7c6]/80 block mb-1">
                    Choose Password (min 4 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3.5 text-[#e0d7c6]/40" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-3 bg-[#0c0c0e] border border-[#3c3c44] rounded-lg text-xs text-[#e0d7c6] focus:border-[#c5a059] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-serif uppercase tracking-widest text-[#e0d7c6]/80 block mb-1">
                  Campaign Room Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-[#e0d7c6]/40" />
                  <input
                    type="text"
                    required
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="whispering-catacombs"
                    className="w-full pl-10 pr-3 py-3 bg-[#0c0c0e] border border-[#3c3c44] rounded-lg text-xs text-[#e0d7c6] focus:border-[#c5a059] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold uppercase tracking-widest text-sm rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(197,160,89,0.35)] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Register & Enter Campaign'}
              </button>

              <div className="flex items-center justify-between text-[11px] text-[#e0d7c6]/60 pt-1">
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('signin'); setError(null); }}
                  className="text-[#c5a059] hover:underline cursor-pointer"
                >
                  Sign in here &rarr;
                </button>
              </div>
            </form>
          )}

          {/* Quick Play Tab Content */}
          {activeTab === 'quick' && (
            <form onSubmit={handleQuickPlay} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-serif uppercase tracking-widest text-[#e0d7c6]/80 block mb-1">
                    Adventurer Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3.5 text-[#e0d7c6]/40" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={selectedRole === 'DM' ? 'Master Aldren' : chosenChar?.name || 'Valerius'}
                      className="w-full pl-10 pr-3 py-3 bg-[#0c0c0e] border border-[#3c3c44] rounded-lg text-xs text-[#e0d7c6] focus:border-[#c5a059] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-serif uppercase tracking-widest text-[#e0d7c6]/80 block mb-1">
                    Multiplayer Room Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-[#e0d7c6]/40" />
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      placeholder="whispering-catacombs"
                      className="w-full pl-10 pr-3 py-3 bg-[#0c0c0e] border border-[#3c3c44] rounded-lg text-xs text-[#e0d7c6] focus:border-[#c5a059] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold uppercase tracking-widest text-sm rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(197,160,89,0.35)] flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>Entering The Lost Dungeon...</span>
                ) : (
                  <>
                    <span>
                      {selectedRole === 'DM' 
                        ? 'Enter Catacombs as Dungeon Master' 
                        : `Take Command of ${chosenChar?.name || 'Hero'}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* How Multiplayer Works Guide */}
        <div className="px-6 py-4 bg-[#111114] border-t border-[#3c3c44]/80 text-xs">
          <div className="flex items-center gap-2 text-[#c5a059] font-serif font-bold uppercase tracking-wider mb-2">
            <Users className="w-4 h-4" />
            <span>How Party Multiplayer Works:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-[#e0d7c6]/70 font-mono">
            <div className="p-2.5 rounded bg-[#0c0c0e] border border-[#2c2c34]">
              <span className="text-[#c5a059] font-bold block mb-1">1. Share Room Code</span>
              <span>Send the Room Code <code className="text-[#e0d7c6] bg-black/50 px-1 py-0.5 rounded font-bold">{roomCode}</code> or invite URL to your party members.</span>
            </div>
            <div className="p-2.5 rounded bg-[#0c0c0e] border border-[#2c2c34]">
              <span className="text-[#c5a059] font-bold block mb-1">2. Each Selects a Hero</span>
              <span>Player 1 picks Aric, Player 2 picks Lyra, or forge custom heroes. Each player commands only their hero!</span>
            </div>
            <div className="p-2.5 rounded bg-[#0c0c0e] border border-[#2c2c34]">
              <span className="text-[#c5a059] font-bold block mb-1">3. Live Tabletop Sync</span>
              <span>Token movements (WASD), attacks, HP damage, dice rolls, and chat sync live across all connected screens.</span>
            </div>
          </div>
          <div className="mt-2.5 text-[10px] text-[#e0d7c6]/50 flex items-center gap-1.5 font-mono">
            <span className="text-emerald-400">💡 Quick Test:</span>
            <span>Open this app URL in a second browser window or tab right now to see two heroes moving live on the same board!</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-[#0c0c0e] border-t border-[#3c3c44] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#e0d7c6]/60 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
            <span>Room: <strong>{roomCode}</strong></span>
            <span className="text-[#3c3c44]">|</span>
            <span className="text-emerald-400 font-semibold">Supabase Realtime</span>
          </div>
          <div>
            Controlling: <strong className="text-[#c5a059]">{selectedRole === 'DM' ? 'Master Aldren (DM)' : chosenChar.name}</strong>
          </div>
        </div>

      </div>

    </div>
  );
};
