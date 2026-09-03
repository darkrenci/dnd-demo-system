import React from 'react';
import { MapTile, Character, Monster } from '../../types/rpg';
import { Shield, Sparkles, User, Sword } from 'lucide-react';

interface GameMapProps {
  tiles: MapTile[];
  players: Character[];
  activePlayerId: string;
  activePlayerUsername?: string;
  monsters: Monster[];
  selectedMonsterId: string | null;
  onSelectMonster: (monsterId: string) => void;
  onMovePlayer: (dx: number, dy: number) => void;
  onInteractTile: (tile: MapTile) => void;
  onSelectPlayerToken?: (player: Character) => void;
  isDMView?: boolean;
}

export const GameMap: React.FC<GameMapProps> = ({
  tiles,
  players,
  activePlayerId,
  activePlayerUsername,
  monsters,
  selectedMonsterId,
  onSelectMonster,
  onMovePlayer,
  onInteractTile,
  onSelectPlayerToken,
  isDMView = false,
}) => {
  const activeChar = players.find(p => p.id === activePlayerId) || players[0];
  const cols = 16;
  const rows = 12;

  // Key listeners for WASD / Arrow keys
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        onMovePlayer(0, -1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onMovePlayer(0, 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onMovePlayer(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onMovePlayer(1, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMovePlayer]);

  return (
    <div className="flex flex-col items-center space-y-4 select-none">
      
      {/* Map Stage Canvas Container */}
      <div className="relative border-2 border-[#3c3c44] rounded-lg bg-[#0c0c0e] p-2 shadow-2xl overflow-x-auto max-w-full">
        <div 
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(32px, 42px))`,
            gridTemplateRows: `repeat(${rows}, minmax(32px, 42px))`,
          }}
        >
          {tiles.map(tile => {
            const isRevealed = isDMView || tile.revealed;
            const playersHere = players.filter(p => p.position.x === tile.x && p.position.y === tile.y);
            const monsterHere = monsters.find(m => m.isAlive && m.position.x === tile.x && m.position.y === tile.y);
            const isTargetMonster = monsterHere && monsterHere.id === selectedMonsterId;

            return (
              <div
                key={`${tile.x}-${tile.y}`}
                onClick={() => onInteractTile(tile)}
                className={`relative flex items-center justify-center rounded transition-all text-xs font-mono cursor-pointer ${
                  !isRevealed
                    ? 'bg-[#08080a] border border-[#1f1f24] text-stone-700'
                    : tile.type === 'wall'
                    ? 'bg-[#1e1e24] border border-[#3c3c44] shadow-inner'
                    : tile.type === 'door'
                    ? 'bg-[#3b2d1d] border border-[#c5a059] text-[#c5a059]'
                    : tile.type === 'treasure'
                    ? 'bg-[#292212] border border-[#d97706] text-amber-300 animate-pulse'
                    : tile.type === 'stairs'
                    ? 'bg-[#15222b] border border-sky-600 text-sky-300'
                    : 'bg-[#151518] border border-[#25252b] hover:bg-[#202026]'
                }`}
                title={`(${tile.x}, ${tile.y}) ${tile.type}${!isRevealed ? ' [Fog of War]' : ''}`}
              >
                {/* Tile Type Icons when no tokens present */}
                {isRevealed && playersHere.length === 0 && !monsterHere && (
                  <>
                    {tile.type === 'wall' && <span className="opacity-20">🪨</span>}
                    {tile.type === 'door' && <span>🚪</span>}
                    {tile.type === 'treasure' && <span>🪙</span>}
                    {tile.type === 'stairs' && <span>🪜</span>}
                  </>
                )}

                {/* NPC Elder Rowan in Room 1 */}
                {isRevealed && tile.x === 2 && tile.y === 1 && playersHere.length === 0 && (
                  <div 
                    title="Elder Rowan (NPC)" 
                    className="w-7 h-7 rounded-full bg-amber-900 border border-amber-400 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  >
                    🧙‍♂️
                  </div>
                )}

                {/* Monster Token */}
                {isRevealed && monsterHere && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMonster(monsterHere.id);
                    }}
                    title={`${monsterHere.name} (HP: ${monsterHere.hp}/${monsterHere.maxHp})`}
                    className={`relative w-7 h-7 rounded-full flex items-center justify-center text-sm transition-transform cursor-pointer ${
                      isTargetMonster
                        ? 'border-2 border-red-500 scale-110 shadow-[0_0_15px_rgba(239,68,68,0.7)] z-20 bg-red-950'
                        : 'border border-red-700 bg-[#2d1414] hover:scale-105'
                    }`}
                  >
                    <span>{monsterHere.avatar}</span>
                    {/* Small Monster HP pip */}
                    <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[#2d1414] rounded-full overflow-hidden border border-[#552222]">
                      <div 
                        className="h-full bg-red-500" 
                        style={{ width: `${Math.max(0, (monsterHere.hp / monsterHere.maxHp) * 100)}%` }} 
                      />
                    </div>
                  </div>
                )}

                {/* Player Tokens (handles single or stacked players) */}
                {isRevealed && playersHere.length > 0 && (
                  <div className="relative flex items-center justify-center">
                    {playersHere.map((p, pIdx) => {
                      const isActiveChar = p.id === activePlayerId;
                      return (
                        <div
                          key={p.id}
                          onClick={(e) => {
                            if (!isActiveChar && onSelectPlayerToken) {
                              e.stopPropagation();
                              onSelectPlayerToken(p);
                            }
                          }}
                          title={`${p.name} (${p.classType}) • Player: @${p.ownerName || 'Adventurer'} • Activity: ${p.lastAction || 'Exploring'}${!isActiveChar ? ' (Click to Interact)' : ' (Controlled by YOU)'}`}
                          className={`relative rounded-full flex items-center justify-center text-xs font-serif font-bold transition-all ${
                            playersHere.length > 1 ? 'w-6 h-6 -ml-2 first:ml-0' : 'w-7 h-7'
                          } ${
                            isActiveChar
                              ? 'border-2 border-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.9)] scale-115 z-30 ring-2 ring-[#c5a059]/40'
                              : 'border-2 border-emerald-500/80 hover:border-emerald-300 hover:scale-110 z-20 cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                          }`}
                          style={{ backgroundColor: p.color, color: '#0c0c0e' }}
                        >
                          <span>{p.name[0]}</span>

                          {/* YOU & Username Badge */}
                          {isActiveChar && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#c5a059] text-black text-[7px] font-mono font-bold uppercase rounded shadow-md whitespace-nowrap leading-tight pointer-events-none z-40 flex items-center gap-1 border border-amber-900/40">
                              <span>YOU</span>
                              {activePlayerUsername && (
                                <span className="text-emerald-950 font-black">(@{activePlayerUsername})</span>
                              )}
                            </div>
                          )}

                          {/* Ally Player Username Badge */}
                          {!isActiveChar && p.ownerName && (
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-1 py-0.2 bg-[#0c0c0e]/95 text-emerald-400 border border-emerald-600/50 text-[6px] font-mono font-bold rounded shadow-sm whitespace-nowrap leading-tight pointer-events-none z-20">
                              @{p.ownerName}
                            </div>
                          )}

                          {/* HP Mini Bar */}
                          <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[#2d1414] rounded-full overflow-hidden border border-[#552222]">
                            <div 
                              className="h-full bg-emerald-500" 
                              style={{ width: `${Math.max(0, (p.hp / p.maxHp) * 100)}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fog of War mask for unrevealed tiles */}
                {!isRevealed && (
                  <div className="absolute inset-0 bg-[#08080a]/95 flex items-center justify-center text-[10px] text-stone-800">
                    •
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Movement D-Pad for Mobile and Quick Clicks */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-xl px-2 gap-4">
        <div className="flex items-center gap-2 text-xs text-[#e0d7c6]/60">
          <span className="font-mono bg-[#1a1a1d] px-2 py-1 rounded border border-[#3c3c44] text-[#c5a059]">WASD</span>
          <span>or Arrow keys to step across grid</span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#151518] p-1 rounded-lg border border-[#3c3c44]">
          <button
            onClick={() => onMovePlayer(-1, 0)}
            className="w-8 h-8 rounded bg-[#1a1a1d] border border-[#3c3c44] hover:border-[#c5a059] text-xs font-bold text-[#c5a059] flex items-center justify-center cursor-pointer"
            title="Move West"
          >
            ←
          </button>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onMovePlayer(0, -1)}
              className="w-8 h-8 rounded bg-[#1a1a1d] border border-[#3c3c44] hover:border-[#c5a059] text-xs font-bold text-[#c5a059] flex items-center justify-center cursor-pointer"
              title="Move North"
            >
              ↑
            </button>
            <button
              onClick={() => onMovePlayer(0, 1)}
              className="w-8 h-8 rounded bg-[#1a1a1d] border border-[#3c3c44] hover:border-[#c5a059] text-xs font-bold text-[#c5a059] flex items-center justify-center cursor-pointer"
              title="Move South"
            >
              ↓
            </button>
          </div>
          <button
            onClick={() => onMovePlayer(1, 0)}
            className="w-8 h-8 rounded bg-[#1a1a1d] border border-[#3c3c44] hover:border-[#c5a059] text-xs font-bold text-[#c5a059] flex items-center justify-center cursor-pointer"
            title="Move East"
          >
            →
          </button>
        </div>
      </div>

    </div>
  );
};
