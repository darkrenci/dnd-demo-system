import React from 'react';
import { Sparkles, Shield, Dices, Users, Swords, Crown, ArrowRight, Play } from 'lucide-react';

interface LandingPageProps {
  onStartDemo: () => void;
  onOpenDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartDemo,
  onOpenDashboard,
}) => {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-12">
      
      {/* Hero Section */}
      <section className="text-center space-y-6 py-8 sm:py-12 border-b border-[#3c3c44]">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/40 text-[#c5a059] text-xs font-serif font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" /> Full Phase 1 to 12 Architecture Complete
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-bold text-[#e0d7c6] uppercase tracking-wider leading-tight">
          Aetherfall RPG
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#e0d7c6]/70 leading-relaxed font-sans">
          An authentic online multiplayer virtual tabletop fantasy RPG engine. Experience server-authoritative combat, dynamic 2D dungeon maps with fog of war, character creation across 3 races &amp; 3 classes, and real-time Dungeon Master live orchestration.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={onStartDemo}
            className="px-8 py-3.5 bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold uppercase tracking-widest text-xs rounded shadow-[0_0_25px_rgba(197,160,89,0.35)] flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
          >
            <Play className="w-4 h-4" />
            <span>Launch Virtual Tabletop</span>
          </button>
          
          <button
            onClick={onOpenDashboard}
            className="px-8 py-3.5 bg-[#151518] hover:bg-[#1a1a1d] text-[#e0d7c6] border border-[#3c3c44] hover:border-[#c5a059] font-serif font-bold uppercase tracking-widest text-xs rounded transition-all cursor-pointer"
          >
            <span>Hero Dashboard</span>
          </button>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#151518] border border-[#3c3c44] rounded-lg space-y-3 shadow-xl">
          <div className="w-10 h-10 rounded bg-[#1a1a1d] border border-[#c5a059] text-[#c5a059] flex items-center justify-center text-lg font-bold">
            <Dices className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-base text-[#c5a059] uppercase tracking-wider">
            Authoritative Dice &amp; Rules
          </h3>
          <p className="text-xs text-[#e0d7c6]/70 leading-relaxed">
            Full d4, d6, d8, d10, d12, d20, and d100 engine with natural 20 critical successes, natural 1 fumbles, and modifier math verified server-side.
          </p>
        </div>

        <div className="p-6 bg-[#151518] border border-[#3c3c44] rounded-lg space-y-3 shadow-xl">
          <div className="w-10 h-10 rounded bg-[#1a1a1d] border border-[#c5a059] text-[#c5a059] flex items-center justify-center text-lg font-bold">
            <Swords className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-base text-[#c5a059] uppercase tracking-wider">
            Grid Combat &amp; Fog of War
          </h3>
          <p className="text-xs text-[#e0d7c6]/70 leading-relaxed">
            2D tile-based dungeon with line-of-sight exploration, tactical movement (WASD or on-screen D-Pad), monster engagement, and initiative trackers.
          </p>
        </div>

        <div className="p-6 bg-[#151518] border border-[#3c3c44] rounded-lg space-y-3 shadow-xl">
          <div className="w-10 h-10 rounded bg-[#1a1a1d] border border-[#c5a059] text-[#c5a059] flex items-center justify-center text-lg font-bold">
            <Crown className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-base text-[#c5a059] uppercase tracking-wider">
            Dungeon Master Console
          </h3>
          <p className="text-xs text-[#e0d7c6]/70 leading-relaxed">
            Real-time DM orchestration: spawn Goblins, Skeletons, Dire Wolves, or the Grave Revenant, toggle map visibility, and broadcast live campaign narration.
          </p>
        </div>
      </section>

      {/* Demo Campaign Teaser */}
      <section className="p-8 rounded-lg border border-[#3c3c44] bg-[#151518] flex flex-wrap items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <span className="text-[10px] uppercase tracking-widest text-[#c5a059] font-mono">
            Demo Campaign Available Now
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#e0d7c6]">
            The Lost Dungeon: The Whispering Halls
          </h2>
          <p className="text-xs text-[#e0d7c6]/70 leading-relaxed">
            Take up arms alongside Aric Silverleaf (Warrior), Elara Moonwhisper (Mage), or Kane Stonehammer (Rogue). Cleanse the clocktower catacombs for Elder Rowan and defeat the ancient Grave Revenant.
          </p>
        </div>

        <button
          onClick={onStartDemo}
          className="px-6 py-3 bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold uppercase tracking-widest text-xs rounded shadow-[0_0_15px_rgba(197,160,89,0.3)] cursor-pointer"
        >
          Enter Dungeon Now
        </button>
      </section>

    </div>
  );
};
