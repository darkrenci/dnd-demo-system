import React, { useState } from 'react';
import { Monster, Character, CombatSession, DnDSkill } from '../../types/rpg';
import { 
  executeD20Roll, 
  executeAuthoritativeRoll, 
  executeDeathSavingThrow, 
  executeShortRest, 
  executeLongRest, 
  executeSkillCheck, 
  executeSavingThrow,
  D20CheckResult
} from '../../game/engine';
import { 
  Sword, 
  Shield, 
  Skull, 
  Zap, 
  Dices, 
  Heart, 
  Moon, 
  Tent, 
  Sparkles, 
  ChevronDown, 
  RotateCcw,
  Footprints,
  Flame,
  AlertTriangle
} from 'lucide-react';

interface CombatPanelProps {
  combat: CombatSession;
  activeCharacter: Character;
  selectedMonster: Monster | null;
  onAttack: (mode: 'normal' | 'advantage' | 'disadvantage') => void;
  onCastSpell: (spellName: string, manaCost: number, damageDice?: string) => void;
  onEndTurn: () => void;
  onUpdateCharacter: (char: Character) => void;
  onLogDice: (msg: string, type: 'dice' | 'combat' | 'rest') => void;
  isRolling: boolean;
}

export const CombatPanel: React.FC<CombatPanelProps> = ({
  combat,
  activeCharacter,
  selectedMonster,
  onAttack,
  onCastSpell,
  onEndTurn,
  onUpdateCharacter,
  onLogDice,
  isRolling,
}) => {
  const [advantageMode, setAdvantageMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [showDiceTray, setShowDiceTray] = useState<boolean>(true);
  const [showSkillDrawer, setShowSkillDrawer] = useState<boolean>(false);
  const [lastDiceResult, setLastDiceResult] = useState<string | null>(null);

  const isPlayerTurn = !combat.isActive || combat.participants[combat.turnIndex]?.isPlayer;
  const isUnconscious = activeCharacter.hp <= 0;

  // Manual Dice Roller (d4, d6, d8, d10, d12, d20, d100)
  const rollDie = (sides: number) => {
    if (sides === 20) {
      const res = executeD20Roll(0, advantageMode, `d20 Roll`);
      setLastDiceResult(res.message);
      onLogDice(`🎲 ${activeCharacter.name}: ${res.message}`, 'dice');
    } else {
      const res = executeAuthoritativeRoll(sides, 1, 0);
      const text = `d${sides} Roll: ${res.total}`;
      setLastDiceResult(text);
      onLogDice(`🎲 ${activeCharacter.name} rolled ${text}`, 'dice');
    }
  };

  // Death Saving Throw
  const handleDeathSave = () => {
    const result = executeDeathSavingThrow(activeCharacter);
    onLogDice(result.message, 'combat');
    setLastDiceResult(result.message);

    if (result.regainedConsciousness) {
      onUpdateCharacter({
        ...activeCharacter,
        hp: 1,
        deathSaves: { successes: 0, failures: 0 },
        conditions: activeCharacter.conditions.filter(c => c !== 'Unconscious'),
      });
    } else {
      onUpdateCharacter({
        ...activeCharacter,
        deathSaves: result.newDeathSaves,
        conditions: result.isDead 
          ? [...activeCharacter.conditions, 'Dead'] 
          : activeCharacter.conditions.includes('Unconscious') 
          ? activeCharacter.conditions 
          : [...activeCharacter.conditions, 'Unconscious'],
      });
    }
  };

  // Perform Skill Check
  const handleSkillRoll = (skill: DnDSkill) => {
    const { result } = executeSkillCheck(activeCharacter, skill, advantageMode);
    setLastDiceResult(result.message);
    onLogDice(`🎯 ${result.message}`, 'dice');
  };

  // Perform Short Rest
  const handleShortRest = () => {
    const { newChar, message } = executeShortRest(activeCharacter);
    onUpdateCharacter(newChar);
    onLogDice(message, 'rest');
  };

  // Perform Long Rest
  const handleLongRest = () => {
    const { newChar, message } = executeLongRest(activeCharacter);
    onUpdateCharacter(newChar);
    onLogDice(message, 'rest');
  };

  // D&D Action: Dodge
  const handleDodgeAction = () => {
    if (activeCharacter.actionEconomy.actionUsed) return;
    const updated: Character = {
      ...activeCharacter,
      conditions: [...activeCharacter.conditions.filter(c => c !== 'Dodging'), 'Dodging'],
      actionEconomy: { ...activeCharacter.actionEconomy, actionUsed: true },
    };
    onUpdateCharacter(updated);
    onLogDice(`🛡️ ${activeCharacter.name} takes the Dodge action! Attackers have Disadvantage and DEX saves have Advantage until next turn.`, 'combat');
  };

  // D&D Action: Dash
  const handleDashAction = () => {
    if (activeCharacter.actionEconomy.actionUsed) return;
    const addedSquares = Math.floor(activeCharacter.speed / 5);
    const updated: Character = {
      ...activeCharacter,
      movementRemaining: activeCharacter.movementRemaining + addedSquares,
      actionEconomy: { ...activeCharacter.actionEconomy, actionUsed: true },
    };
    onUpdateCharacter(updated);
    onLogDice(`🏃 ${activeCharacter.name} takes the Dash action! Movement budget increased by +${activeCharacter.speed}ft (+${addedSquares} squares).`, 'combat');
  };

  // Bonus Action: Second Wind (for Warrior)
  const handleSecondWind = () => {
    if (activeCharacter.actionEconomy.bonusActionUsed) return;
    const roll = Math.floor(Math.random() * 10) + 1;
    const heal = roll + activeCharacter.level;
    const newHp = Math.min(activeCharacter.maxHp, activeCharacter.hp + heal);
    const updated: Character = {
      ...activeCharacter,
      hp: newHp,
      actionEconomy: { ...activeCharacter.actionEconomy, bonusActionUsed: true },
    };
    onUpdateCharacter(updated);
    onLogDice(`✨ ${activeCharacter.name} uses Second Wind as a Bonus Action, rolling 1d10+${activeCharacter.level} to regain ${heal} HP! (${activeCharacter.hp} → ${newHp})`, 'combat');
  };

  return (
    <div className="space-y-4">
      
      {/* Active Combat Card */}
      <div className={`p-4 bg-[#151518] rounded-xl border ${
        combat.isActive ? 'border-red-900/80 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-[#3c3c44] shadow-xl'
      } space-y-4`}>
        
        {/* Header Banner */}
        <div className="flex items-center justify-between border-b border-[#3c3c44] pb-2.5">
          <div className="flex items-center gap-2.5">
            {combat.isActive ? (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-serif font-bold text-sm uppercase text-red-400 tracking-wider">
                  D&amp;D Combat: Round {combat.round}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#c5a059]" />
                <span className="font-serif font-bold text-sm uppercase text-[#c5a059] tracking-wider">
                  Exploration &amp; Tactical Mode
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Rest Actions */}
            <button
              onClick={handleShortRest}
              title="Short Rest: Spend Hit Die to heal & regain abilities"
              className="px-2 py-1 bg-[#1a1a1d] hover:bg-[#25252b] text-[#c5a059] border border-[#3c3c44] rounded text-[10px] font-serif uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Tent className="w-3 h-3" />
              <span>Short Rest</span>
            </button>
            <button
              onClick={handleLongRest}
              title="Long Rest: 8-Hour slumber restoring all HP and spell slots"
              className="px-2 py-1 bg-[#1a1a1d] hover:bg-[#25252b] text-sky-400 border border-[#3c3c44] rounded text-[10px] font-serif uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Moon className="w-3 h-3" />
              <span>Long Rest</span>
            </button>
          </div>
        </div>

        {/* Action Economy & Movement Budget */}
        <div className="p-3 bg-[#0c0c0e] border border-[#3c3c44] rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-serif text-[#e0d7c6]/60">Action:</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeCharacter.actionEconomy.actionUsed ? 'bg-red-950/60 text-red-400 border border-red-800' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
              }`}>
                {activeCharacter.actionEconomy.actionUsed ? 'Used' : 'Available'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-serif text-[#e0d7c6]/60">Bonus:</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeCharacter.actionEconomy.bonusActionUsed ? 'bg-red-950/60 text-red-400 border border-red-800' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
              }`}>
                {activeCharacter.actionEconomy.bonusActionUsed ? 'Used' : 'Available'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-serif text-[#e0d7c6]/60">Reaction:</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeCharacter.actionEconomy.reactionUsed ? 'bg-red-950/60 text-red-400 border border-red-800' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
              }`}>
                {activeCharacter.actionEconomy.reactionUsed ? 'Used' : 'Available'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-[#e0d7c6]/80">
            <Footprints className="w-3.5 h-3.5 text-sky-400" />
            <span>Movement Left: <strong className="text-sky-300">{activeCharacter.movementRemaining * 5} ft</strong> ({activeCharacter.movementRemaining} squares)</span>
          </div>
        </div>

        {/* Death Saving Throws (If HP <= 0) */}
        {isUnconscious && (
          <div className="p-4 bg-red-950/40 border-2 border-red-600 rounded-lg space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400 font-serif font-bold text-xs uppercase tracking-wider">
                <Skull className="w-4 h-4 text-red-500" />
                <span>Unconscious: Rolling Death Saving Throws!</span>
              </div>
              <span className="text-[10px] text-red-300 font-mono">
                3 Successes = Stabilized • 3 Failures = Dead
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-2.5 bg-[#0c0c0e] border border-red-900 rounded flex items-center justify-between text-xs">
                <span className="text-[#4ade80] font-serif font-bold">Successes</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className={`w-4 h-4 rounded-full border border-[#4ade80] flex items-center justify-center text-[10px] ${
                      (activeCharacter.deathSaves?.successes || 0) > i ? 'bg-[#4ade80] text-black font-bold' : 'bg-transparent'
                    }`}>
                      {(activeCharacter.deathSaves?.successes || 0) > i ? '✓' : ''}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-2.5 bg-[#0c0c0e] border border-red-900 rounded flex items-center justify-between text-xs">
                <span className="text-red-400 font-serif font-bold">Failures</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className={`w-4 h-4 rounded-full border border-red-500 flex items-center justify-center text-[10px] ${
                      (activeCharacter.deathSaves?.failures || 0) > i ? 'bg-red-500 text-black font-bold' : 'bg-transparent'
                    }`}>
                      {(activeCharacter.deathSaves?.failures || 0) > i ? '✕' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleDeathSave}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-black font-serif font-bold uppercase tracking-widest text-xs rounded transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            >
              Roll Death Save (d20)
            </button>
          </div>
        )}

        {/* Target Monster Status */}
        {selectedMonster ? (
          <div className="p-3 bg-[#0c0c0e] border border-red-900/60 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedMonster.avatar}</span>
                <div>
                  <div className="font-serif font-bold text-xs text-red-400">
                    {selectedMonster.name}
                  </div>
                  <div className="text-[10px] text-[#e0d7c6]/60 font-mono">
                    AC {selectedMonster.ac} • Atk +{selectedMonster.attackModifier} • Dmg {selectedMonster.damageDice} ({selectedMonster.damageType || 'Physical'})
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-serif font-bold text-red-400">
                  {selectedMonster.hp} / {selectedMonster.maxHp} HP
                </div>
              </div>
            </div>

            {/* Health Bar */}
            <div className="w-full h-2 bg-[#2d1414] rounded-full overflow-hidden border border-[#552222]">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                style={{ width: `${Math.max(0, (selectedMonster.hp / selectedMonster.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#0c0c0e] border border-[#3c3c44] rounded-lg text-xs text-[#e0d7c6]/60 text-center">
            Target: None designated. Select a monster token on the map to target with attacks.
          </div>
        )}

        {/* Advantage / Disadvantage D&D Modifier Selector */}
        <div className="flex items-center justify-between gap-2 p-2 bg-[#1a1a1d] rounded-lg border border-[#3c3c44]">
          <span className="text-[10px] font-serif uppercase tracking-widest text-[#c5a059]">
            Roll Stance:
          </span>
          <div className="flex gap-1.5 text-xs font-serif uppercase">
            <button
              onClick={() => setAdvantageMode('normal')}
              className={`px-3 py-1 rounded cursor-pointer transition-all ${
                advantageMode === 'normal'
                  ? 'bg-[#c5a059] text-black font-bold'
                  : 'text-[#e0d7c6]/60 hover:text-[#e0d7c6] hover:bg-[#25252b]'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setAdvantageMode('advantage')}
              className={`px-3 py-1 rounded cursor-pointer transition-all ${
                advantageMode === 'advantage'
                  ? 'bg-emerald-500 text-black font-bold shadow-[0_0_10px_rgba(74,222,128,0.4)]'
                  : 'text-[#e0d7c6]/60 hover:text-emerald-400 hover:bg-[#25252b]'
              }`}
            >
              Advantage (2d20 High)
            </button>
            <button
              onClick={() => setAdvantageMode('disadvantage')}
              className={`px-3 py-1 rounded cursor-pointer transition-all ${
                advantageMode === 'disadvantage'
                  ? 'bg-amber-600 text-black font-bold shadow-[0_0_10px_rgba(217,119,6,0.4)]'
                  : 'text-[#e0d7c6]/60 hover:text-amber-400 hover:bg-[#25252b]'
              }`}
            >
              Disadvantage (2d20 Low)
            </button>
          </div>
        </div>

        {/* Standard Actions Grid */}
        <div className="space-y-2">
          <div className="text-[10px] font-serif uppercase tracking-widest text-[#e0d7c6]/50">
            Standard Actions (1 Action per turn)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => onAttack(advantageMode)}
              disabled={!selectedMonster || isRolling || isUnconscious}
              className="py-2.5 px-3 rounded-lg bg-red-800 hover:bg-red-700 text-[#e0d7c6] font-serif font-bold text-xs uppercase tracking-wider disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
            >
              <Sword className="w-4 h-4" />
              <span>Weapon Atk</span>
            </button>

            <button
              onClick={() => onCastSpell('Fire Bolt', 0, '1d10')}
              disabled={!selectedMonster || isRolling || isUnconscious}
              className="py-2.5 px-3 rounded-lg bg-sky-800 hover:bg-sky-700 text-[#e0d7c6] font-serif font-bold text-xs uppercase tracking-wider disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(14,165,233,0.2)]"
            >
              <Zap className="w-4 h-4" />
              <span>Cast Cantrip</span>
            </button>

            <button
              onClick={handleDodgeAction}
              disabled={isRolling || isUnconscious || activeCharacter.actionEconomy.actionUsed}
              className="py-2.5 px-3 rounded-lg bg-[#1a1a1d] border border-[#3c3c44] hover:border-[#c5a059] text-[#c5a059] font-serif font-bold text-xs uppercase tracking-wider disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Shield className="w-4 h-4" />
              <span>Dodge</span>
            </button>

            <button
              onClick={handleDashAction}
              disabled={isRolling || isUnconscious || activeCharacter.actionEconomy.actionUsed}
              className="py-2.5 px-3 rounded-lg bg-[#1a1a1d] border border-[#3c3c44] hover:border-[#c5a059] text-[#c5a059] font-serif font-bold text-xs uppercase tracking-wider disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Footprints className="w-4 h-4" />
              <span>Dash (2x Spd)</span>
            </button>
          </div>
        </div>

        {/* Bonus Actions Row */}
        <div className="space-y-2">
          <div className="text-[10px] font-serif uppercase tracking-widest text-[#e0d7c6]/50">
            Bonus Actions (1 Bonus Action per turn)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={handleSecondWind}
              disabled={activeCharacter.actionEconomy.bonusActionUsed || isUnconscious}
              className="py-2 px-3 rounded bg-emerald-950/70 border border-emerald-700 hover:bg-emerald-900 text-emerald-300 font-serif text-xs uppercase tracking-wider disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5 text-emerald-400" />
              <span>Second Wind (Heal)</span>
            </button>

            <button
              onClick={() => onCastSpell('Magic Missile', 3, '3d4')}
              disabled={activeCharacter.mp < 3 || isUnconscious}
              className="py-2 px-3 rounded bg-purple-950/70 border border-purple-700 hover:bg-purple-900 text-purple-300 font-serif text-xs uppercase tracking-wider disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Magic Missile (3 MP)</span>
            </button>

            <button
              onClick={onEndTurn}
              disabled={isRolling}
              className="py-2 px-3 rounded bg-[#25252b] border border-[#c5a059] hover:bg-[#c5a059] hover:text-black text-[#c5a059] font-serif font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Pass Turn</span>
            </button>
          </div>
        </div>

      </div>

      {/* D&D Polyhedral Dice Tray Bar */}
      <div className="p-3 bg-[#151518] border border-[#3c3c44] rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#3c3c44] pb-2">
          <div className="flex items-center gap-2">
            <Dices className="w-4 h-4 text-[#c5a059]" />
            <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#c5a059]">
              Polyhedral Dice Tray
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSkillDrawer(!showSkillDrawer)}
              className="text-[10px] font-serif uppercase tracking-wider text-[#e0d7c6]/70 hover:text-[#c5a059] underline cursor-pointer"
            >
              {showSkillDrawer ? 'Hide Skills' : 'Roll Skill Check'}
            </button>
          </div>
        </div>

        {/* Dice buttons */}
        <div className="grid grid-cols-7 gap-2 text-xs font-mono">
          {[4, 6, 8, 10, 12, 20, 100].map(sides => (
            <button
              key={sides}
              onClick={() => rollDie(sides)}
              className="py-2 rounded bg-[#0c0c0e] border border-[#3c3c44] hover:border-[#c5a059] text-[#e0d7c6] hover:text-[#c5a059] font-bold text-center transition-all cursor-pointer shadow-inner active:scale-95"
            >
              d{sides}
            </button>
          ))}
        </div>

        {/* Skill drawer if toggled */}
        {showSkillDrawer && (
          <div className="p-2.5 bg-[#0c0c0e] border border-[#3c3c44] rounded-lg space-y-2 animate-in fade-in">
            <div className="text-[10px] uppercase font-serif tracking-widest text-[#c5a059]">
              Quick D&amp;D Skill Checks (+Proficiency)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
              {(['Athletics', 'Acrobatics', 'Stealth', 'Arcana', 'Perception', 'Insight'] as DnDSkill[]).map(s => (
                <button
                  key={s}
                  onClick={() => handleSkillRoll(s)}
                  className="p-1.5 rounded bg-[#1a1a1d] hover:bg-[#25252b] border border-[#3c3c44] text-left text-[11px] text-[#e0d7c6]/80 hover:text-[#c5a059] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>{s}</span>
                  <span className="font-mono text-[9px] text-[#c5a059]">Roll</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {lastDiceResult && (
          <div className="p-2 bg-[#0c0c0e] border border-[#c5a059]/40 rounded text-xs font-mono text-[#c5a059]">
            {lastDiceResult}
          </div>
        )}
      </div>

    </div>
  );
};
