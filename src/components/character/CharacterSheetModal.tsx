import React from 'react';
import { Character, Item, DnDSkill } from '../../types/rpg';
import { SKILL_ABILITY_MAP, getAbilityModifier } from '../../game/engine';
import { Shield, Sparkles, X, Heart, Zap, Coins, Sword, Backpack, Footprints, Award, Star, Activity } from 'lucide-react';

interface CharacterSheetModalProps {
  character: Character;
  onClose: () => void;
  onUseItem?: (item: Item) => void;
  onEquipItem?: (item: Item) => void;
  isReadOnly?: boolean;
}

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({
  character,
  onClose,
  onUseItem,
  onEquipItem,
  isReadOnly = false,
}) => {
  const wisMod = getAbilityModifier(character.stats.wisdom);
  const isPerceptionProf = character.skillProficiencies?.includes('Perception');
  const passivePerception = 10 + wisMod + (isPerceptionProf ? (character.proficiencyBonus || 2) : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-[#151518] border border-[#3c3c44] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Banner if inspecting party ally */}
        {isReadOnly && (
          <div className="bg-amber-950/70 border-b border-amber-800/80 px-5 py-2 text-xs text-amber-200 flex items-center justify-between font-mono">
            <span>🛡️ Inspecting Party Ally Sheet (Read-Only • Controlled by party companion)</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">View Mode</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#3c3c44] bg-[#1a1a1d]">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-lg border-2 border-[#c5a059] flex items-center justify-center font-serif font-bold text-lg text-black shadow-[0_0_15px_rgba(197,160,89,0.3)]"
              style={{ backgroundColor: character.color || '#c5a059' }}
            >
              {character.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-serif font-bold text-[#c5a059] tracking-wide">
                  {character.name}
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-[#0c0c0e] text-[#4ade80] border border-[#3c3c44]">
                  D&amp;D 5e Standard
                </span>
                {character.ownerName && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-600/40 font-semibold">
                    Player: @{character.ownerName}
                  </span>
                )}
              </div>
              <p className="text-xs uppercase tracking-widest text-[#e0d7c6]/70 font-mono">
                Level {character.level} • {character.race} • {character.classType}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#25252b] text-[#e0d7c6]/60 hover:text-[#e0d7c6] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Vitals Bar & D&D Combat Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-[#1a1a1d] border border-[#3c3c44] rounded-lg text-center">
              <span className="text-[10px] uppercase tracking-widest text-[#e0d7c6]/60 block mb-1">
                Hit Points
              </span>
              <div className="text-xl font-serif font-bold text-red-400">
                {character.hp} <span className="text-xs text-[#e0d7c6]/40 font-mono">/ {character.maxHp}</span>
              </div>
            </div>

            <div className="p-3 bg-[#1a1a1d] border border-[#3c3c44] rounded-lg text-center">
              <span className="text-[10px] uppercase tracking-widest text-[#e0d7c6]/60 block mb-1">
                Armor Class
              </span>
              <div className="text-xl font-serif font-bold text-[#c5a059]">
                {character.ac} <span className="text-[10px] text-[#e0d7c6]/40">AC</span>
              </div>
            </div>

            <div className="p-3 bg-[#1a1a1d] border border-[#3c3c44] rounded-lg text-center">
              <span className="text-[10px] uppercase tracking-widest text-[#e0d7c6]/60 block mb-1">
                Speed
              </span>
              <div className="text-xl font-serif font-bold text-sky-400">
                {character.speed || 30} <span className="text-[10px] text-[#e0d7c6]/40">ft</span>
              </div>
            </div>

            <div className="p-3 bg-[#1a1a1d] border border-[#3c3c44] rounded-lg text-center">
              <span className="text-[10px] uppercase tracking-widest text-[#e0d7c6]/60 block mb-1">
                Proficiency
              </span>
              <div className="text-xl font-serif font-bold text-emerald-400">
                +{character.proficiencyBonus || 2}
              </div>
            </div>

            <div className="p-3 bg-[#1a1a1d] border border-[#3c3c44] rounded-lg text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase tracking-widest text-[#e0d7c6]/60 block mb-1">
                Passive Perception
              </span>
              <div className="text-xl font-serif font-bold text-purple-400">
                {passivePerception}
              </div>
            </div>
          </div>

          {/* Core Ability Scores & Modifiers */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-serif font-bold tracking-widest text-[#c5a059]">
              Ability Scores &amp; Saving Throws
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
              {(Object.entries(character.stats) as [string, number][]).map(([stat, val]) => {
                const mod = getAbilityModifier(val);
                const isSaveProf = character.savingThrowProficiencies?.includes(stat as any);
                const saveTotal = mod + (isSaveProf ? (character.proficiencyBonus || 2) : 0);

                return (
                  <div key={stat} className="p-2.5 bg-[#0c0c0e] border border-[#3c3c44] rounded-lg relative overflow-hidden">
                    <div className="text-[9px] uppercase tracking-wider text-[#e0d7c6]/50">
                      {stat.slice(0, 3)}
                    </div>
                    <div className="text-lg font-bold font-serif text-[#e0d7c6]">{val}</div>
                    <div className="text-[11px] font-mono text-[#c5a059] font-bold">
                      {mod >= 0 ? `+${mod}` : mod}
                    </div>
                    <div className="mt-1 pt-1 border-t border-[#25252b] text-[9px] text-[#e0d7c6]/60 flex items-center justify-center gap-1">
                      <span>Save:</span>
                      <strong className={isSaveProf ? 'text-emerald-400' : 'text-[#e0d7c6]'}>
                        {saveTotal >= 0 ? `+${saveTotal}` : saveTotal}
                      </strong>
                      {isSaveProf && <span className="text-emerald-400 text-[10px]">●</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* D&D Skill Proficiencies */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-serif font-bold tracking-widest text-[#c5a059]">
              Skills &amp; Proficiencies
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#0c0c0e] border border-[#3c3c44] p-3 rounded-lg text-xs">
              {(Object.entries(SKILL_ABILITY_MAP) as [DnDSkill, keyof typeof character.stats][]).map(([skill, stat]) => {
                const statMod = getAbilityModifier(character.stats[stat]);
                const isProf = character.skillProficiencies?.includes(skill);
                const total = statMod + (isProf ? (character.proficiencyBonus || 2) : 0);

                return (
                  <div key={skill} className="flex items-center justify-between p-1 rounded hover:bg-[#1a1a1d]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`text-[10px] ${isProf ? 'text-[#c5a059]' : 'text-[#e0d7c6]/20'}`}>
                        {isProf ? '★' : '☆'}
                      </span>
                      <span className={isProf ? 'text-[#e0d7c6] font-medium' : 'text-[#e0d7c6]/50'}>
                        {skill}
                      </span>
                      <span className="text-[9px] text-[#e0d7c6]/30 uppercase">({String(stat).slice(0, 3)})</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#c5a059] font-bold">
                      {total >= 0 ? `+${total}` : total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spells & Class Abilities */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-serif font-bold tracking-widest text-[#c5a059]">
                Class Features &amp; Spells
              </h3>
              {character.spellSlots?.level1?.max > 0 && (
                <div className="flex items-center gap-3 text-[11px] font-mono text-[#e0d7c6]/80">
                  <span>
                    Level 1 Slots: <strong className="text-sky-400">{character.spellSlots.level1.current}/{character.spellSlots.level1.max}</strong>
                  </span>
                  <span>
                    Level 2 Slots: <strong className="text-sky-400">{character.spellSlots.level2.current}/{character.spellSlots.level2.max}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {character.abilities.map((ability, idx) => (
                <div key={idx} className="p-3 bg-[#1a1a1d] border border-[#3c3c44] rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm font-serif font-bold text-[#e0d7c6] flex items-center gap-2">
                      <span>{ability.name}</span>
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0c0c0e] text-[#c5a059] border border-[#3c3c44]">
                        {ability.actionType}
                      </span>
                    </div>
                    <div className="text-xs text-[#e0d7c6]/60 mt-0.5">{ability.description}</div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    {ability.damageDice && (
                      <span className="text-[10px] font-mono text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/60">
                        {ability.damageDice} {ability.damageType || ''}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800">
                      {ability.manaCost} MP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory & Equipment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-serif font-bold tracking-widest text-[#c5a059]">
                Equipment &amp; Wealth
              </h3>
              <div className="flex items-center gap-1 text-xs font-mono text-[#c5a059]">
                <Coins className="w-3.5 h-3.5" />
                <span>{character.gold} Gold Pieces</span>
              </div>
            </div>

            <div className="space-y-1.5">
              {character.inventory.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-[#0c0c0e] border border-[#3c3c44] rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="font-semibold text-[#e0d7c6] flex items-center gap-1.5">
                        {item.name}
                        {item.isEquipped && (
                          <span className="text-[9px] uppercase px-1 rounded bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40">
                            Equipped
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#e0d7c6]/50">{item.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.type === 'potion' && onUseItem && !isReadOnly && (
                      <button
                        onClick={() => onUseItem(item)}
                        className="px-2.5 py-1 rounded bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        Drink
                      </button>
                    )}
                    {item.damageDice && (
                      <span className="font-mono text-[10px] text-[#c5a059] bg-[#1a1a1d] px-2 py-0.5 rounded border border-[#3c3c44]">
                        {item.damageDice} {item.damageType || ''}
                      </span>
                    )}
                    {item.defenseBonus && (
                      <span className="font-mono text-[10px] text-emerald-400 bg-[#1a1a1d] px-2 py-0.5 rounded border border-[#3c3c44]">
                        +{item.defenseBonus} AC
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#3c3c44] bg-[#1a1a1d] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#c5a059] text-black font-serif font-bold uppercase tracking-widest text-xs rounded hover:bg-[#d9b876] shadow-[0_0_15px_rgba(197,160,89,0.25)] cursor-pointer"
          >
            Close Sheet
          </button>
        </div>

      </div>
    </div>
  );
};
