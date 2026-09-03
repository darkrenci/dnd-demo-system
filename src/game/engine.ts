import { Character, Monster, Item, Attributes, DnDSkill } from '../types/rpg';

export interface RollCalculation {
  dieSides: number;
  count: number;
  rolls: number[];
  modifier: number;
  subtotal: number;
  total: number;
  isCritSuccess: boolean;
  isCritFail: boolean;
}

export interface D20CheckResult {
  d20Roll: number;
  modifier: number;
  total: number;
  mode: 'normal' | 'advantage' | 'disadvantage';
  rolls: number[];
  isCritSuccess: boolean;
  isCritFail: boolean;
  message: string;
}

export const executeAuthoritativeRoll = (
  dieSides: number,
  count = 1,
  modifier = 0
): RollCalculation => {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * dieSides) + 1);
  }
  const subtotal = rolls.reduce((sum, val) => sum + val, 0);
  const total = subtotal + modifier;
  const isCritSuccess = dieSides === 20 && count === 1 && rolls[0] === 20;
  const isCritFail = dieSides === 20 && count === 1 && rolls[0] === 1;

  return {
    dieSides,
    count,
    rolls,
    modifier,
    subtotal,
    total,
    isCritSuccess,
    isCritFail,
  };
};

// D&D Advantage / Disadvantage d20 roll
export const executeD20Roll = (
  modifier = 0,
  mode: 'normal' | 'advantage' | 'disadvantage' = 'normal',
  label = 'Check'
): D20CheckResult => {
  const roll1 = Math.floor(Math.random() * 20) + 1;
  const roll2 = Math.floor(Math.random() * 20) + 1;

  let chosenRoll = roll1;
  const rolls = [roll1];

  if (mode === 'advantage') {
    rolls.push(roll2);
    chosenRoll = Math.max(roll1, roll2);
  } else if (mode === 'disadvantage') {
    rolls.push(roll2);
    chosenRoll = Math.min(roll1, roll2);
  }

  const total = chosenRoll + modifier;
  const isCritSuccess = chosenRoll === 20;
  const isCritFail = chosenRoll === 1;

  let modeText = '';
  if (mode === 'advantage') modeText = ' [Advantage: ' + rolls.join(', ') + ']';
  if (mode === 'disadvantage') modeText = ' [Disadvantage: ' + rolls.join(', ') + ']';

  const critText = isCritSuccess ? ' (NATURAL 20 CRITICAL SUCCESS!)' : isCritFail ? ' (NATURAL 1 CRITICAL FUMBLE!)' : '';
  const message = `${label}: Rolled ${chosenRoll}${modeText} + ${modifier} = ${total}${critText}`;

  return {
    d20Roll: chosenRoll,
    modifier,
    total,
    mode,
    rolls,
    isCritSuccess,
    isCritFail,
    message,
  };
};

export const getAbilityModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

export const SKILL_ABILITY_MAP: Record<DnDSkill, keyof Attributes> = {
  Athletics: 'strength',
  Acrobatics: 'dexterity',
  'Sleight of Hand': 'dexterity',
  Stealth: 'dexterity',
  Arcana: 'intelligence',
  History: 'intelligence',
  Investigation: 'intelligence',
  Nature: 'intelligence',
  Religion: 'intelligence',
  'Animal Handling': 'wisdom',
  Insight: 'wisdom',
  Medicine: 'wisdom',
  Perception: 'wisdom',
  Survival: 'wisdom',
  Deception: 'charisma',
  Intimidation: 'charisma',
  Performance: 'charisma',
  Persuasion: 'charisma',
};

// Skill Check with proficiency addition
export const executeSkillCheck = (
  character: Character,
  skill: DnDSkill,
  mode: 'normal' | 'advantage' | 'disadvantage' = 'normal',
  dc?: number
): { result: D20CheckResult; isSuccess?: boolean } => {
  const statKey = SKILL_ABILITY_MAP[skill];
  const statMod = getAbilityModifier(character.stats[statKey]);
  const isProficient = character.skillProficiencies?.includes(skill);
  const totalMod = statMod + (isProficient ? character.proficiencyBonus : 0);

  const result = executeD20Roll(totalMod, mode, `${character.name} ${skill} Check`);
  const isSuccess = dc !== undefined ? result.total >= dc : undefined;

  return { result, isSuccess };
};

// Saving Throw
export const executeSavingThrow = (
  character: Character,
  stat: keyof Attributes,
  mode: 'normal' | 'advantage' | 'disadvantage' = 'normal',
  dc?: number
): { result: D20CheckResult; isSuccess?: boolean } => {
  const statMod = getAbilityModifier(character.stats[stat]);
  const isProficient = character.savingThrowProficiencies?.includes(stat);
  const totalMod = statMod + (isProficient ? character.proficiencyBonus : 0);

  const result = executeD20Roll(totalMod, mode, `${character.name} ${stat.toUpperCase()} Save`);
  const isSuccess = dc !== undefined ? result.total >= dc : undefined;

  return { result, isSuccess };
};

// Death Saving Throw (when HP is 0)
export const executeDeathSavingThrow = (
  character: Character
): {
  roll: number;
  isSuccess: boolean;
  isCritSuccess: boolean;
  isCritFail: boolean;
  newDeathSaves: { successes: number; failures: number };
  regainedConsciousness: boolean;
  isDead: boolean;
  message: string;
} => {
  const roll = Math.floor(Math.random() * 20) + 1;
  const currentSaves = character.deathSaves || { successes: 0, failures: 0 };
  let successes = currentSaves.successes;
  let failures = currentSaves.failures;
  let regainedConsciousness = false;
  let message = '';

  if (roll === 20) {
    // Nat 20: instantly revive with 1 HP
    regainedConsciousness = true;
    message = `🌟 Natural 20 on Death Save! ${character.name} miraculously surges with life, regaining 1 HP!`;
    return {
      roll,
      isSuccess: true,
      isCritSuccess: true,
      isCritFail: false,
      newDeathSaves: { successes: 0, failures: 0 },
      regainedConsciousness: true,
      isDead: false,
      message,
    };
  } else if (roll === 1) {
    // Nat 1: 2 failures!
    failures += 2;
    message = `💀 Natural 1 on Death Save! ${character.name} suffers 2 critical failures (${failures}/3)!`;
  } else if (roll >= 10) {
    successes += 1;
    message = `🛡️ Death Save Success: Rolled ${roll} (${successes}/3 successes).`;
  } else {
    failures += 1;
    message = `🩸 Death Save Failure: Rolled ${roll} (${failures}/3 failures).`;
  }

  const isDead = failures >= 3;
  if (isDead) {
    message += ` ${character.name} has succumbed to mortal wounds.`;
  } else if (successes >= 3) {
    message += ` ${character.name} is stabilized!`;
  }

  return {
    roll,
    isSuccess: roll >= 10,
    isCritSuccess: false,
    isCritFail: roll === 1,
    newDeathSaves: { successes, failures },
    regainedConsciousness,
    isDead,
    message,
  };
};

// Parse dice notation like "1d8", "2d6", etc.
export const parseDiceNotation = (diceStr: string): { count: number; sides: number } => {
  const parts = diceStr.toLowerCase().split('d');
  if (parts.length === 2) {
    return {
      count: parseInt(parts[0], 10) || 1,
      sides: parseInt(parts[1], 10) || 6,
    };
  }
  return { count: 1, sides: 6 };
};

// D&D Player Attack calculation vs Armor Class
export const calculateAttackResult = (
  attacker: Character,
  target: Monster,
  mode: 'normal' | 'advantage' | 'disadvantage' = 'normal',
  abilityBonusDmg = 0
): {
  isHit: boolean;
  attackRoll: D20CheckResult;
  damageRoll?: RollCalculation;
  finalDamage: number;
  newTargetHp: number;
  isDefeated: boolean;
  message: string;
} => {
  // Attacker modifier based on class / weapon finesse
  let statMod = getAbilityModifier(attacker.stats.strength);
  if (attacker.classType === 'Rogue') {
    statMod = getAbilityModifier(attacker.stats.dexterity);
  } else if (attacker.classType === 'Mage') {
    statMod = getAbilityModifier(attacker.stats.intelligence);
  }

  const attackBonus = statMod + attacker.proficiencyBonus;
  const attackRoll = executeD20Roll(attackBonus, mode, `${attacker.name} Attack vs ${target.name} (AC ${target.ac})`);

  const isHit = attackRoll.isCritSuccess || (!attackRoll.isCritFail && attackRoll.total >= target.ac);

  if (!isHit) {
    return {
      isHit: false,
      attackRoll,
      finalDamage: 0,
      newTargetHp: target.hp,
      isDefeated: false,
      message: `${attacker.name} attacks ${target.name}: Rolled ${attackRoll.total} vs AC ${target.ac} (MISS)`,
    };
  }

  // Damage calculation based on equipped weapon
  const weapon = attacker.inventory.find(i => i.type === 'weapon' && i.isEquipped) || attacker.inventory[0];
  const { count, sides } = parseDiceNotation(weapon?.damageDice || '1d6');
  const damageMod = Math.max(0, statMod);
  const damageRoll = executeAuthoritativeRoll(sides, count, damageMod);

  // Critical hit doubles dice pool
  let finalDamage = attackRoll.isCritSuccess ? damageRoll.total + damageRoll.subtotal : damageRoll.total;
  finalDamage += abilityBonusDmg;
  finalDamage = Math.max(1, finalDamage);

  const newTargetHp = Math.max(0, target.hp - finalDamage);
  const isDefeated = newTargetHp <= 0;

  const critText = attackRoll.isCritSuccess ? ' ⚡ CRITICAL HIT!' : '';
  const message = `${attacker.name} strikes ${target.name}${critText} for ${finalDamage} ${weapon?.damageType || 'physical'} damage! (${target.hp} → ${newTargetHp} HP)`;

  return {
    isHit: true,
    attackRoll,
    damageRoll,
    finalDamage,
    newTargetHp,
    isDefeated,
    message,
  };
};

// Monster AI counter-attack
export const calculateMonsterAttack = (
  monster: Monster,
  target: Character
): {
  isHit: boolean;
  attackRoll: RollCalculation;
  damage: number;
  newPlayerHp: number;
  isPlayerDown: boolean;
  message: string;
} => {
  // Check if player is dodging
  const isDodging = target.conditions.includes('Dodging');
  const roll1 = Math.floor(Math.random() * 20) + 1;
  const roll2 = Math.floor(Math.random() * 20) + 1;
  const d20 = isDodging ? Math.min(roll1, roll2) : roll1;

  const total = d20 + monster.attackModifier;
  const isCritSuccess = d20 === 20;
  const isCritFail = d20 === 1;

  const attackRoll: RollCalculation = {
    dieSides: 20,
    count: 1,
    rolls: [d20],
    modifier: monster.attackModifier,
    subtotal: d20,
    total,
    isCritSuccess,
    isCritFail,
  };

  const isHit = isCritSuccess || (!isCritFail && total >= target.ac);

  if (!isHit) {
    const dodgeNote = isDodging ? ' [Dodge Evaded]' : '';
    return {
      isHit: false,
      attackRoll,
      damage: 0,
      newPlayerHp: target.hp,
      isPlayerDown: false,
      message: `${monster.name} strikes at ${target.name}: Rolled ${total} vs AC ${target.ac} (DEFLECTED${dodgeNote})`,
    };
  }

  const { count, sides } = parseDiceNotation(monster.damageDice);
  const dmgRoll = executeAuthoritativeRoll(sides, count, Math.floor(monster.attackModifier / 2));
  const damage = isCritSuccess ? dmgRoll.total + dmgRoll.subtotal : dmgRoll.total;
  const newPlayerHp = Math.max(0, target.hp - damage);
  const isPlayerDown = newPlayerHp <= 0;

  const critText = isCritSuccess ? ' 💥 CRITICAL HIT!' : '';
  const downText = isPlayerDown ? ` [${target.name} collapses into Death Saves!]` : '';

  return {
    isHit: true,
    attackRoll,
    damage,
    newPlayerHp,
    isPlayerDown,
    message: `${monster.name} hit ${target.name}${critText} for ${damage} ${monster.damageType || 'damage'}! (${target.hp} → ${newPlayerHp} HP)${downText}`,
  };
};

// Short Rest: Spend Hit Dice to regain HP, reset short-rest features
export const executeShortRest = (
  character: Character
): { newChar: Character; healed: number; message: string } => {
  const conMod = getAbilityModifier(character.stats.constitution);
  const hitDieSides = character.classType === 'Warrior' ? 10 : character.classType === 'Rogue' ? 8 : 6;
  const roll = Math.floor(Math.random() * hitDieSides) + 1;
  const healAmount = Math.max(1, roll + conMod);
  const newHp = Math.min(character.maxHp, character.hp + healAmount);
  const healed = newHp - character.hp;

  const newChar: Character = {
    ...character,
    hp: newHp,
    mp: Math.min(character.maxMp, character.mp + 4),
    conditions: character.conditions.filter(c => c !== 'Dodging'),
    deathSaves: { successes: 0, failures: 0 },
    actionEconomy: { actionUsed: false, bonusActionUsed: false, reactionUsed: false },
    movementRemaining: Math.floor(character.speed / 5),
  };

  return {
    newChar,
    healed,
    message: `🏕️ Short Rest: ${character.name} spends a Hit Die (d${hitDieSides}+${conMod}) and recovers ${healed} HP & 4 MP!`,
  };
};

// Long Rest: Full 8-hour slumber, restoring full HP, spell slots, and clearing death saves
export const executeLongRest = (
  character: Character
): { newChar: Character; message: string } => {
  const newChar: Character = {
    ...character,
    hp: character.maxHp,
    mp: character.maxMp,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
    spellSlots: {
      level1: { current: character.spellSlots.level1.max, max: character.spellSlots.level1.max },
      level2: { current: character.spellSlots.level2.max, max: character.spellSlots.level2.max },
    },
    actionEconomy: { actionUsed: false, bonusActionUsed: false, reactionUsed: false },
    movementRemaining: Math.floor(character.speed / 5),
  };

  return {
    newChar,
    message: `🛌 Long Rest: ${character.name} finishes an 8-hour sleep. HP, MP, Spell Slots, and Hit Dice fully restored!`,
  };
};

// Reset round action economy at start of turn
export const resetTurnActionEconomy = (character: Character): Character => {
  return {
    ...character,
    actionEconomy: {
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
    },
    movementRemaining: Math.floor(character.speed / 5),
    conditions: character.conditions.filter(c => c !== 'Dodging'),
  };
};
