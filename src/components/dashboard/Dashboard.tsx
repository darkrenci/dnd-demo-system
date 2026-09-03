import React from 'react';
import { Character, Campaign } from '../../types/rpg';
import { Sparkles, PlusCircle, Play, Shield, Users, Crown } from 'lucide-react';

interface DashboardProps {
  characters: Character[];
  activeCharacterId: string;
  onSelectCharacter: (id: string) => void;
  campaign: Campaign;
  onEnterTabletop: () => void;
  onCreateCharacter: () => void;
  onOpenDM: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  characters,
  activeCharacterId,
  onSelectCharacter,
  campaign,
  onEnterTabletop,
  onCreateCharacter,
  onOpenDM,
}) => {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Welcome Banner */}
      <div className="p-6 rounded-lg border border-[#3c3c44] bg-[#1a1a1d] shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#c5a059]">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-2xl font-serif font-bold tracking-wide uppercase">
              Adventurer Sanctuary
            </h2>
          </div>
          <p className="text-xs text-[#e0d7c6]/60">
            Manage your registered heroes, join live campaign lobbies, or assume the mantle of Dungeon Master.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCreateCharacter}
            className="flex items-center gap-2 px-4 py-2 bg-[#151518] border border-[#3c3c44] hover:border-[#c5a059] text-xs font-serif uppercase tracking-wider text-[#c5a059] rounded cursor-pointer transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Hero</span>
          </button>

          <button
            onClick={onEnterTabletop}
            className="flex items-center gap-2 px-5 py-2 bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold text-xs uppercase tracking-wider rounded shadow-[0_0_15px_rgba(197,160,89,0.3)] cursor-pointer transition-all"
          >
            <Play className="w-4 h-4" />
            <span>Enter Tabletop</span>
          </button>
        </div>
      </div>

      {/* Hero Selection Grid */}
      <div className="space-y-3">
        <h3 className="font-serif font-bold text-sm text-[#c5a059] uppercase tracking-wider">
          Your Hero Roster ({characters.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {characters.map(char => {
            const isSelected = char.id === activeCharacterId;
            return (
              <div
                key={char.id}
                onClick={() => onSelectCharacter(char.id)}
                className={`p-5 rounded-lg border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-[#1a1a1d] border-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.25)] scale-[1.02]'
                    : 'bg-[#151518] border-[#3c3c44] hover:border-[#c5a059]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-black text-base shadow-md"
                      style={{ backgroundColor: char.color }}
                    >
                      {char.name[0]}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#e0d7c6]">
                        {char.name}
                      </h4>
                      <p className="text-[10px] uppercase tracking-widest text-[#e0d7c6]/60">
                        Level {char.level} {char.race} {char.classType}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#3c3c44] text-center text-xs font-mono">
                  <div className="p-1.5 bg-[#0c0c0e] rounded">
                    <span className="text-[9px] text-[#e0d7c6]/40 uppercase block">HP</span>
                    <span className="text-red-400 font-bold">{char.hp}/{char.maxHp}</span>
                  </div>
                  <div className="p-1.5 bg-[#0c0c0e] rounded">
                    <span className="text-[9px] text-[#e0d7c6]/40 uppercase block">MP</span>
                    <span className="text-blue-400 font-bold">{char.mp}/{char.maxMp}</span>
                  </div>
                  <div className="p-1.5 bg-[#0c0c0e] rounded">
                    <span className="text-[9px] text-[#e0d7c6]/40 uppercase block">AC</span>
                    <span className="text-[#c5a059] font-bold">{char.ac}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#e0d7c6]/60 pt-1">
                  <span>Wealth: <strong className="text-[#c5a059] font-mono">{char.gold} Gold</strong></span>
                  <span className="text-xs font-serif text-[#c5a059]">
                    {isSelected ? '✓ Active Hero' : 'Select Hero'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Campaign Card */}
      <div className="p-5 bg-[#151518] border border-[#3c3c44] rounded-lg shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#3c3c44] pb-2">
          <div className="flex items-center gap-2 text-[#c5a059]">
            <Shield className="w-4 h-4" />
            <h3 className="font-serif font-bold text-sm uppercase tracking-wider">
              Active Tabletop Campaign
            </h3>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#4ade80] bg-[#1a1a1d] px-2 py-0.5 rounded border border-[#3c3c44]">
            ● {campaign.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-serif font-bold text-lg text-[#e0d7c6]">
              {campaign.name}
            </h4>
            <p className="text-xs text-[#e0d7c6]/60">
              Dungeon Master: <strong className="text-[#c5a059]">{campaign.dmName}</strong> • Current Zone: <em>{campaign.currentArea}</em>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenDM}
              className="px-4 py-2 bg-[#1a1a1d] border border-[#3c3c44] hover:border-amber-500 text-amber-300 rounded text-xs font-serif uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>DM Mode</span>
            </button>
            <button
              onClick={onEnterTabletop}
              className="px-5 py-2 bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold text-xs uppercase tracking-wider rounded shadow-[0_0_10px_rgba(197,160,89,0.3)] cursor-pointer"
            >
              Join Session
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
