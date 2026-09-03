import React, { useState } from 'react';
import { Character, Race, ClassType } from '../../types/rpg';
import { executeAuthoritativeRoll } from '../../game/engine';
import { Shield, Sparkles, Wand2, ArrowRight, Check, Dices, RotateCcw } from 'lucide-react';

interface CharacterCreatorProps {
  onCharacterCreated: (character: Character) => void;
  onCancel: () => void;
}

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({
  onCharacterCreated,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('Theron Valen');
  const [race, setRace] = useState<Race>('Human');
  const [classType, setClassType] = useState<ClassType>('Warrior');
  
  // Ability scores with roll feature
  const [stats, setStats] = useState({
    strength: 15,
    dexterity: 14,
    constitution: 14,
    intelligence: 10,
    wisdom: 12,
    charisma: 11,
  });

  const rollNewStats = () => {
    // 4d6 drop lowest method
    const rollScore = () => {
      const rolls = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ].sort((a, b) => b - a);
      return rolls[0] + rolls[1] + rolls[2];
    };

    setStats({
      strength: rollScore(),
      dexterity: rollScore(),
      constitution: rollScore(),
      intelligence: rollScore(),
      wisdom: rollScore(),
      charisma: rollScore(),
    });
  };

  const raceDescriptions: Record<Race, { desc: string; bonus: string }> = {
    Human: { desc: 'Versatile and ambitious survivors with balanced vigor across all endeavors.', bonus: '+1 to all attributes, bonus inventory capacity.' },
    Elf: { desc: 'Ancient, grace-touched wanderers attuned to arcane currents and shadows.', bonus: '+2 Dexterity, +1 Intelligence, innate Mana focus.' },
    Dwarf: { desc: 'Resilient mountain dwellers fortified against blade, poison, and fatigue.', bonus: '+2 Constitution, +1 Strength, high armor durability.' },
  };

  const classDescriptions: Record<ClassType, { desc: string; role: string; equip: string }> = {
    Warrior: { desc: 'Heavy armor frontliner masters of martial combat and defensive shielding.', role: 'Tank / Melee DPS', equip: 'Iron Longsword & Oak Heater Shield' },
    Mage: { desc: 'Scholars of elemental forces weaving devastating destructive spells and barriers.', role: 'Spellcaster / Ranged DPS', equip: 'Runed Ash Staff & Mana Draught' },
    Rogue: { desc: 'Lethal opportunists striking with stealth, critical precision, and evasion.', role: 'Stealth / Critical Burst', equip: 'Shadow Daggers & Lockpicks' },
  };

  const handleFinish = () => {
    // Calculate HP and MP based on class & constitution
    const conMod = Math.floor((stats.constitution - 10) / 2);
    let baseHp = 12;
    let baseMp = 6;
    let ac = 14;

    if (classType === 'Warrior') {
      baseHp = 22 + conMod * 2;
      baseMp = 4;
      ac = 16;
    } else if (classType === 'Mage') {
      baseHp = 16 + conMod;
      baseMp = 18;
      ac = 12;
    } else if (classType === 'Rogue') {
      baseHp = 18 + conMod;
      baseMp = 8;
      ac = 15;
    }

    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: name.trim() || 'Nameless Adventurer',
      race,
      classType,
      level: 1,
      hp: baseHp,
      maxHp: baseHp,
      mp: baseMp,
      maxMp: baseMp,
      ac,
      speed: race === 'Dwarf' ? 25 : 30,
      movementRemaining: race === 'Dwarf' ? 5 : 6,
      initiativeModifier: Math.floor((stats.dexterity - 10) / 2),
      proficiencyBonus: 2,
      conditions: [],
      deathSaves: { successes: 0, failures: 0 },
      spellSlots: {
        level1: { current: classType === 'Mage' ? 2 : 0, max: classType === 'Mage' ? 2 : 0 },
        level2: { current: 0, max: 0 },
      },
      actionEconomy: {
        actionUsed: false,
        bonusActionUsed: false,
        reactionUsed: false,
      },
      stats,
      skillProficiencies: classType === 'Warrior' ? ['Athletics', 'Intimidation'] : classType === 'Mage' ? ['Arcana', 'History'] : ['Stealth', 'Acrobatics'],
      savingThrowProficiencies: classType === 'Warrior' ? ['strength', 'constitution'] : classType === 'Mage' ? ['intelligence', 'wisdom'] : ['dexterity', 'intelligence'],
      inventory: [
        {
          id: `item-weap-${Date.now()}`,
          name: classType === 'Warrior' ? 'Steel Longsword' : classType === 'Mage' ? 'Apprentice Staff' : 'Twin Daggers',
          type: 'weapon',
          description: 'Starting standard issue combat weapon.',
          icon: classType === 'Warrior' ? '⚔️' : classType === 'Mage' ? '🪄' : '🗡️',
          damageDice: classType === 'Warrior' ? '1d8' : classType === 'Mage' ? '1d6' : '1d4',
          damageType: classType === 'Warrior' ? 'Slashing' : classType === 'Mage' ? 'Bludgeoning' : 'Piercing',
          value: 15,
          isEquipped: true,
        },
        {
          id: `item-pot-${Date.now()}`,
          name: 'Minor Healing Potion',
          type: 'potion',
          description: 'Restores 10 HP instantly.',
          icon: '🧪',
          healAmount: 10,
          value: 8,
        },
      ],
      gold: 50,
      xp: 0,
      position: { x: 2, y: 3 },
      color: classType === 'Warrior' ? '#c5a059' : classType === 'Mage' ? '#60a5fa' : '#34d399',
      avatarSeed: name,
      abilities: [
        {
          name: classType === 'Warrior' ? 'Crushing Blow' : classType === 'Mage' ? 'Arcane Bolt' : 'Sneak Attack',
          description: 'Class primary combat technique.',
          manaCost: 2,
          actionType: 'action',
          damageDice: '2d6',
          damageType: classType === 'Mage' ? 'Force' : 'Physical',
          effect: 'Deal 2d6 heavy damage',
        },
      ],
    };

    onCharacterCreated(newChar);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-[#3c3c44] pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#c5a059] uppercase tracking-wider">
            Character Forge
          </h2>
          <p className="text-xs text-[#e0d7c6]/60">
            Step {step} of 5 • {step === 1 ? 'Heroic Identity' : step === 2 ? 'Choose Race' : step === 3 ? 'Choose Class' : step === 4 ? 'Determine Attributes' : 'Review & Seal'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs uppercase tracking-widest text-[#e0d7c6]/50 hover:text-[#e0d7c6] border border-[#3c3c44] px-3 py-1.5 rounded bg-[#1a1a1d] cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-between gap-2 border border-[#3c3c44] bg-[#151518] p-2.5 rounded-lg text-xs font-serif uppercase tracking-wider">
        {['1. Name', '2. Race', '3. Class', '4. Stats', '5. Review'].map((label, idx) => (
          <div
            key={idx}
            className={`flex-1 text-center py-1.5 rounded transition-colors ${
              step === idx + 1
                ? 'bg-[#c5a059] text-black font-bold shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                : step > idx + 1
                ? 'text-[#c5a059] bg-[#1a1a1d]'
                : 'text-[#e0d7c6]/40'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Step 1: Name */}
      {step === 1 && (
        <div className="p-6 rounded-lg border border-[#3c3c44] bg-[#151518] space-y-4">
          <label className="block text-xs uppercase font-bold tracking-widest text-[#c5a059]">
            Character Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Aric Silverleaf"
            className="w-full text-lg px-4 py-3 bg-[#0c0c0e] border border-[#3c3c44] rounded text-[#e0d7c6] focus:outline-none focus:border-[#c5a059]"
          />
          <p className="text-xs text-[#e0d7c6]/60">
            This name will be inscribed into the campaign ledger and announced to the Dungeon Master and party members.
          </p>
        </div>
      )}

      {/* Step 2: Race */}
      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['Human', 'Elf', 'Dwarf'] as Race[]).map(r => (
            <div
              key={r}
              onClick={() => setRace(r)}
              className={`p-5 rounded-lg border transition-all cursor-pointer space-y-3 ${
                race === r
                  ? 'bg-[#1a1a1d] border-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.25)]'
                  : 'bg-[#151518] border-[#3c3c44] hover:border-[#c5a059]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg text-[#c5a059]">{r}</h3>
                {race === r && <Check className="w-5 h-5 text-[#c5a059]" />}
              </div>
              <p className="text-xs text-[#e0d7c6]/70 leading-relaxed font-sans">
                {raceDescriptions[r].desc}
              </p>
              <div className="text-[11px] font-mono text-emerald-400 bg-[#0c0c0e] p-2 rounded border border-[#3c3c44]">
                Bonus: {raceDescriptions[r].bonus}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Class */}
      {step === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['Warrior', 'Mage', 'Rogue'] as ClassType[]).map(c => (
            <div
              key={c}
              onClick={() => setClassType(c)}
              className={`p-5 rounded-lg border transition-all cursor-pointer space-y-3 ${
                classType === c
                  ? 'bg-[#1a1a1d] border-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.25)]'
                  : 'bg-[#151518] border-[#3c3c44] hover:border-[#c5a059]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-lg text-[#c5a059]">{c}</h3>
                {classType === c && <Check className="w-5 h-5 text-[#c5a059]" />}
              </div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#e0d7c6]/50">
                {classDescriptions[c].role}
              </div>
              <p className="text-xs text-[#e0d7c6]/70 leading-relaxed font-sans">
                {classDescriptions[c].desc}
              </p>
              <div className="text-[11px] text-amber-300/80 bg-[#0c0c0e] p-2 rounded border border-[#3c3c44]">
                Starting Gear: {classDescriptions[c].equip}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 4: Stats */}
      {step === 4 && (
        <div className="p-6 rounded-lg border border-[#3c3c44] bg-[#151518] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-[#c5a059] uppercase tracking-wider">
                Ability Scores (4d6 Drop Lowest)
              </h3>
              <p className="text-xs text-[#e0d7c6]/60">
                Roll random hero attributes or adjust manually according to your build.
              </p>
            </div>
            <button
              onClick={rollNewStats}
              className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1d] border border-[#c5a059] hover:bg-[#c5a059] hover:text-black text-[#c5a059] font-serif font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer"
            >
              <Dices className="w-4 h-4" />
              <span>Reroll All</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(Object.keys(stats) as Array<keyof typeof stats>).map(attr => {
              const val = stats[attr];
              const mod = Math.floor((val - 10) / 2);
              return (
                <div key={attr} className="p-3 bg-[#1a1a1d] border border-[#3c3c44] rounded text-center space-y-1">
                  <span className="block text-[10px] uppercase tracking-widest opacity-60">
                    {attr}
                  </span>
                  <div className="text-2xl font-bold font-serif text-[#e0d7c6]">{val}</div>
                  <span className="text-[11px] font-mono text-[#c5a059]">
                    Modifier: {mod >= 0 ? `+${mod}` : mod}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <div className="p-6 rounded-lg border border-[#3c3c44] bg-[#151518] space-y-6">
          <h3 className="font-serif font-bold text-lg text-[#c5a059] uppercase tracking-wider">
            Review Hero Record
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
            <div className="p-4 bg-[#1a1a1d] border border-[#3c3c44] rounded space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-[#c5a059]">Identity</div>
              <div className="text-lg font-serif font-bold text-[#e0d7c6]">{name}</div>
              <div className="text-stone-300">{race} {classType} • Level 1</div>
            </div>

            <div className="p-4 bg-[#1a1a1d] border border-[#3c3c44] rounded space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-[#c5a059]">Starting Vitals</div>
              <div className="flex gap-4">
                <div>HP: <strong className="text-red-400 font-mono">{classType === 'Warrior' ? 24 : classType === 'Mage' ? 16 : 18}</strong></div>
                <div>MP: <strong className="text-blue-400 font-mono">{classType === 'Mage' ? 18 : classType === 'Warrior' ? 4 : 8}</strong></div>
                <div>AC: <strong className="text-amber-300 font-mono">{classType === 'Warrior' ? 16 : classType === 'Mage' ? 12 : 15}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#3c3c44]">
        {step > 1 ? (
          <button
            onClick={() => setStep(s => s - 1)}
            className="px-5 py-2.5 rounded bg-[#1a1a1d] border border-[#3c3c44] text-[#e0d7c6] hover:border-[#c5a059] text-xs font-serif uppercase tracking-wider cursor-pointer"
          >
            Back
          </button>
        ) : <div />}

        {step < 5 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="px-6 py-2.5 rounded bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(197,160,89,0.3)] flex items-center gap-2 cursor-pointer"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="px-8 py-3 rounded bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(197,160,89,0.4)] flex items-center gap-2 cursor-pointer"
          >
            <span>Forge &amp; Enter Campaign</span>
            <Sparkles className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
