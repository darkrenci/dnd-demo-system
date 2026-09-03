export type Race = 'Human' | 'Elf' | 'Dwarf';
export type ClassType = 'Warrior' | 'Mage' | 'Rogue';
export type UserRole = 'PLAYER' | 'DM';

export type DnDSkill = 
  | 'Acrobatics'
  | 'Animal Handling'
  | 'Arcana'
  | 'Athletics'
  | 'Deception'
  | 'History'
  | 'Insight'
  | 'Intimidation'
  | 'Investigation'
  | 'Medicine'
  | 'Nature'
  | 'Perception'
  | 'Performance'
  | 'Persuasion'
  | 'Religion'
  | 'Sleight of Hand'
  | 'Stealth'
  | 'Survival';

export interface Attributes {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface SpellSlot {
  current: number;
  max: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'misc';
  description: string;
  icon: string;
  damageDice?: string; // e.g. "1d8", "2d6"
  damageType?: 'Slashing' | 'Piercing' | 'Bludgeoning' | 'Fire' | 'Force';
  defenseBonus?: number;
  healAmount?: number;
  manaAmount?: number;
  value: number; // gold value
  isEquipped?: boolean;
}

export interface Character {
  id: string;
  ownerId?: string;
  ownerName?: string;
  lastAction?: string;
  isOnline?: boolean;
  lastSeen?: number;
  name: string;
  race: Race;
  classType: ClassType;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  ac: number; // Armor Class
  speed: number; // Base speed in feet (standard 30 ft = 6 squares)
  movementRemaining: number; // In squares for current turn
  initiativeModifier: number;
  proficiencyBonus: number; // e.g. +2
  stats: Attributes;
  inventory: Item[];
  gold: number;
  xp: number;
  position: { x: number; y: number };
  color: string;
  avatarSeed: string;
  conditions: string[]; // e.g. 'Unconscious', 'Poisoned', 'Blessed', 'Dodging'
  deathSaves: {
    successes: number;
    failures: number;
  };
  spellSlots: {
    level1: SpellSlot;
    level2: SpellSlot;
  };
  actionEconomy: {
    actionUsed: boolean;
    bonusActionUsed: boolean;
    reactionUsed: boolean;
  };
  skillProficiencies: DnDSkill[];
  savingThrowProficiencies: (keyof Attributes)[];
  abilities: {
    name: string;
    description: string;
    manaCost: number;
    actionType: 'action' | 'bonus' | 'reaction';
    damageDice?: string;
    damageType?: string;
    effect: string;
  }[];
}

export interface Monster {
  id: string;
  name: string;
  type: 'Goblin' | 'Skeleton' | 'Wolf' | 'Orc' | 'Dungeon Boss';
  hp: number;
  maxHp: number;
  ac: number;
  attackModifier: number;
  damageDice: string;
  damageType?: string;
  position: { x: number; y: number };
  xpReward: number;
  goldReward: number;
  isAlive: boolean;
  avatar: string;
  speed?: number;
}

export interface QuestObjective {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
}

export interface Quest {
  id: string;
  title: string;
  giver: string;
  description: string;
  objectives: QuestObjective[];
  xpReward: number;
  goldReward: number;
  isCompleted: boolean;
}

export interface CombatParticipant {
  id: string;
  name: string;
  isPlayer: boolean;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  avatar?: string;
}

export interface CombatSession {
  isActive: boolean;
  round: number;
  turnIndex: number;
  participants: CombatParticipant[];
  targetMonsterId: string | null;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: 'PLAYER' | 'DM' | 'SYSTEM';
  text: string;
  timestamp: string;
  color?: string;
}

export interface GameEvent {
  id: string;
  message: string;
  type: 'combat' | 'quest' | 'movement' | 'dice' | 'dm' | 'loot' | 'spell' | 'rest';
  timestamp: string;
}

export interface MapTile {
  x: number;
  y: number;
  type: 'floor' | 'wall' | 'door' | 'stairs' | 'treasure' | 'water';
  revealed: boolean;
  isDoorOpen?: boolean;
  isChestOpen?: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  dmName: string;
  hostUid: string;
  maxPlayers: number;
  playerCount: number;
  status: 'Active' | 'Recruiting' | 'Completed';
  currentArea: string;
  roomCode: string;
  updatedAt?: number;
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName: string;
  role: UserRole;
  isAnonymous: boolean;
  characterId?: string;
}
