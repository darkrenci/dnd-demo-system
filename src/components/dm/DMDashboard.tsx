import React from 'react';
import { Monster, Character } from '../../types/rpg';
import { Eye, EyeOff, PlusCircle, Volume2, ShieldAlert, Sparkles, RefreshCw, UserX } from 'lucide-react';

interface DMDashboardProps {
  characters: Character[];
  monsters: Monster[];
  onSpawnMonster: (type: Monster['type']) => void;
  onToggleFogOfWar: () => void;
  onStartEncounter: () => void;
  onBroadcastNarration: (text: string) => void;
  fogRevealedAll: boolean;
  onRemoveCharacter?: (id: string) => void;
  onResetRoom?: () => void;
}

export const DMDashboard: React.FC<DMDashboardProps> = ({
  characters,
  monsters,
  onSpawnMonster,
  onToggleFogOfWar,
  onStartEncounter,
  onBroadcastNarration,
  fogRevealedAll,
  onRemoveCharacter,
  onResetRoom,
}) => {
  const [narrationInput, setNarrationInput] = React.useState('');

  const handleSendNarration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrationInput.trim()) return;
    onBroadcastNarration(narrationInput.trim());
    setNarrationInput('');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* DM Master Header */}
      <div className="p-6 rounded-lg border border-amber-600/40 bg-[#1a1a1d] shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#c5a059]">
            <span className="text-2xl">👑</span>
            <h2 className="text-2xl font-serif font-bold tracking-wide uppercase">
              Dungeon Master Live Console
            </h2>
          </div>
          <p className="text-xs text-[#e0d7c6]/60">
            Campaign: The Lost Dungeon • Active Session Control &amp; World Events
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleFogOfWar}
            className="flex items-center gap-2 px-4 py-2 bg-[#151518] border border-[#3c3c44] hover:border-[#c5a059] text-xs font-serif uppercase tracking-wider text-[#c5a059] rounded cursor-pointer transition-colors"
          >
            {fogRevealedAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{fogRevealedAll ? 'Restore Fog of War' : 'Reveal Entire Map'}</span>
          </button>

          <button
            onClick={onStartEncounter}
            className="flex items-center gap-2 px-4 py-2 bg-red-950 border border-red-700 hover:bg-red-900 text-xs font-serif uppercase tracking-wider text-red-200 rounded cursor-pointer transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Trigger Encounter</span>
          </button>
        </div>
      </div>

      {/* Grid of DM Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Player Telemetry & Monster Bestiary Spawner (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Players Party Vitals */}
          <div className="p-5 bg-[#151518] border border-[#3c3c44] rounded-lg shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-[#c5a059] uppercase tracking-wider">
                Adventuring Party Status ({characters.length} Heroes)
              </h3>
              {onResetRoom && (
                <button
                  onClick={() => {
                    if (window.confirm('Reset party to default archetypes and clear all inactive/ghost tokens from room?')) {
                      onResetRoom();
                    }
                  }}
                  title="Reset party and clear ghost tokens"
                  className="text-[10px] font-mono uppercase px-2.5 py-1 bg-[#1a1a1d] hover:bg-amber-950/70 text-[#c5a059] border border-[#3c3c44] hover:border-amber-600/60 rounded flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Party</span>
                </button>
              )}
            </div>
            <div className="space-y-2">
              {characters.map(char => (
                <div 
                  key={char.id}
                  className="flex items-center justify-between p-3 bg-[#0c0c0e] border border-[#3c3c44] rounded text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-black"
                      style={{ backgroundColor: char.color }}
                    >
                      {char.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#e0d7c6]">{char.name}</span>
                        {char.ownerName && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-600/40 px-1.5 py-0.2 rounded font-semibold">
                            @{char.ownerName}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#e0d7c6]/50">
                        {char.race} {char.classType} • Pos ({char.position.x}, {char.position.y})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <div>
                      HP: <strong className="text-red-400">{char.hp}/{char.maxHp}</strong>
                    </div>
                    <div>
                      MP: <strong className="text-blue-400">{char.mp}/{char.maxMp}</strong>
                    </div>
                    <div>
                      AC: <strong className="text-[#c5a059]">{char.ac}</strong>
                    </div>

                    {onRemoveCharacter && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Kick token ${char.name} (@${char.ownerName || 'Companion'}) from campaign room?`)) {
                            onRemoveCharacter(char.id);
                          }
                        }}
                        title={`Remove ${char.name} token from campaign`}
                        className="ml-2 px-2 py-1 bg-red-950/60 hover:bg-red-900 border border-red-800/40 text-red-300 rounded text-[10px] font-mono uppercase cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <UserX className="w-3 h-3 text-red-400" />
                        <span>Kick</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monster Spawner Panel */}
          <div className="p-5 bg-[#151518] border border-[#3c3c44] rounded-lg shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-sm text-[#c5a059] uppercase tracking-wider">
              Spawn Hostile Encounters
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(['Goblin', 'Skeleton', 'Wolf', 'Orc', 'Dungeon Boss'] as Monster['type'][]).map(type => (
                <button
                  key={type}
                  onClick={() => onSpawnMonster(type)}
                  className="p-3 bg-[#1a1a1d] border border-[#3c3c44] hover:border-red-500 rounded text-left transition-all cursor-pointer group space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">
                      {type === 'Goblin' ? '👹' : type === 'Skeleton' ? '💀' : type === 'Wolf' ? '🐺' : type === 'Orc' ? '🧌' : '👑'}
                    </span>
                    <PlusCircle className="w-4 h-4 text-red-400 opacity-60 group-hover:opacity-100" />
                  </div>
                  <div className="font-serif font-bold text-xs text-[#e0d7c6] group-hover:text-red-300">
                    Spawn {type}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT: Live Broadcast & Dungeon Bestiary Inventory (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* DM Narration Broadcast */}
          <div className="p-5 bg-[#151518] border border-[#3c3c44] rounded-lg shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-[#c5a059]">
              <Volume2 className="w-4 h-4" />
              <h3 className="font-serif font-bold text-sm uppercase tracking-wider">
                Broadcast DM Narration
              </h3>
            </div>
            <form onSubmit={handleSendNarration} className="space-y-3">
              <textarea
                value={narrationInput}
                onChange={e => setNarrationInput(e.target.value)}
                placeholder="The stone ceiling groans as dust rains down..."
                rows={3}
                className="w-full p-3 bg-[#0c0c0e] border border-[#3c3c44] rounded text-xs text-[#e0d7c6] focus:outline-none focus:border-[#c5a059]"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold uppercase tracking-widest text-xs rounded transition-all cursor-pointer"
              >
                Send to All Players
              </button>
            </form>
          </div>

          {/* Active Monsters on Grid */}
          <div className="p-5 bg-[#151518] border border-[#3c3c44] rounded-lg shadow-xl space-y-3">
            <h3 className="font-serif font-bold text-sm text-[#c5a059] uppercase tracking-wider">
              Active Grid Monsters ({monsters.filter(m => m.isAlive).length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {monsters.map(m => (
                <div 
                  key={m.id}
                  className={`p-2.5 bg-[#0c0c0e] border rounded text-xs flex items-center justify-between ${
                    m.isAlive ? 'border-[#3c3c44]' : 'border-stone-800 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{m.avatar}</span>
                    <span className="font-bold text-[#e0d7c6]">{m.name}</span>
                  </div>
                  <div className="font-mono text-[11px] text-red-400">
                    {m.isAlive ? `${m.hp}/${m.maxHp} HP` : 'Defeated'}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
