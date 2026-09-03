import { Character, Monster, Item, Quest, MapTile, Campaign, ChatMessage, GameEvent } from '../types/rpg';

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'item-sword-1',
    name: 'Iron Longsword',
    type: 'weapon',
    description: 'A finely forged steel versatile blade with leather grip (1d8 Slashing).',
    icon: '⚔️',
    damageDice: '1d8',
    damageType: 'Slashing',
    value: 25,
    isEquipped: true,
  },
  {
    id: 'item-shield-1',
    name: 'Oak Heater Shield',
    type: 'armor',
    description: 'Sturdy reinforced wood offering reliable deflection (+2 Armor Class).',
    icon: '🛡️',
    defenseBonus: 2,
    value: 15,
    isEquipped: true,
  },
  {
    id: 'item-staff-1',
    name: 'Runed Ash Staff',
    type: 'weapon',
    description: 'Channeled focus wood topped with an azure arcane crystal (1d6 Bludgeoning).',
    icon: '🪄',
    damageDice: '1d6',
    damageType: 'Bludgeoning',
    value: 30,
    isEquipped: true,
  },
  {
    id: 'item-dagger-1',
    name: 'Shadow Dagger',
    type: 'weapon',
    description: 'Lightweight finesse steel for swift sneak strikes (1d4 Piercing).',
    icon: '🗡️',
    damageDice: '1d4',
    damageType: 'Piercing',
    value: 20,
    isEquipped: true,
  },
  {
    id: 'item-pot-heal-1',
    name: 'Potion of Healing',
    type: 'potion',
    description: 'A glowing crimson tincture that restores 2d4+2 HP (avg 10 HP).',
    icon: '🧪',
    healAmount: 10,
    value: 50,
  },
  {
    id: 'item-pot-mana-1',
    name: 'Mana Restorative Draught',
    type: 'potion',
    description: 'An azure brew replenishing 1st and 2nd level spell slots.',
    icon: '⚗️',
    manaAmount: 10,
    value: 50,
  },
  {
    id: 'item-key-1',
    name: 'Ancient Crypt Key',
    type: 'misc',
    description: 'A heavy brass key bearing the signet of the Clocktower.',
    icon: '🗝️',
    value: 50,
  },
];

export const DEMO_CHARACTERS: Character[] = [
  {
    id: 'char-aric',
    name: 'Aric Silverleaf',
    race: 'Human',
    classType: 'Warrior',
    level: 2,
    hp: 24,
    maxHp: 24,
    mp: 6,
    maxMp: 6,
    ac: 16,
    speed: 30,
    movementRemaining: 6,
    initiativeModifier: 2,
    proficiencyBonus: 2,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
    spellSlots: {
      level1: { current: 0, max: 0 },
      level2: { current: 0, max: 0 },
    },
    actionEconomy: {
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
    },
    stats: {
      strength: 16,
      dexterity: 14,
      constitution: 15,
      intelligence: 10,
      wisdom: 12,
      charisma: 11,
    },
    skillProficiencies: ['Athletics', 'Intimidation', 'Perception', 'Survival'],
    savingThrowProficiencies: ['strength', 'constitution'],
    inventory: [
      INITIAL_ITEMS[0], // Sword
      INITIAL_ITEMS[1], // Shield
      { ...INITIAL_ITEMS[4], id: 'aric-pot-1' },
      { ...INITIAL_ITEMS[4], id: 'aric-pot-2' },
    ],
    gold: 145,
    xp: 300,
    position: { x: 2, y: 2 },
    color: '#c5a059',
    avatarSeed: 'Aric',
    abilities: [
      {
        name: 'Second Wind',
        description: 'Regain 1d10 + Fighter Level HP as a Bonus Action (recharges on rest).',
        manaCost: 2,
        actionType: 'bonus',
        damageDice: '1d10',
        effect: 'Heals 1d10+2 hit points instantly',
      },
      {
        name: 'Action Surge',
        description: 'Push beyond limits to gain an additional standard Action this turn.',
        manaCost: 3,
        actionType: 'bonus',
        effect: 'Resets action availability for a second strike',
      },
      {
        name: 'Shield Slam',
        description: 'Bash with heavy shield dealing 1d6 + 3 damage and staggering the foe.',
        manaCost: 1,
        actionType: 'action',
        damageDice: '1d6',
        damageType: 'Bludgeoning',
        effect: 'Knocks target off-balance (Advantage on next attack)',
      },
    ],
  },
  {
    id: 'char-elara',
    name: 'Elara Moonwhisper',
    race: 'Elf',
    classType: 'Mage',
    level: 2,
    hp: 16,
    maxHp: 16,
    mp: 20,
    maxMp: 20,
    ac: 12,
    speed: 30,
    movementRemaining: 6,
    initiativeModifier: 3,
    proficiencyBonus: 2,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
    spellSlots: {
      level1: { current: 3, max: 3 },
      level2: { current: 1, max: 1 },
    },
    actionEconomy: {
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
    },
    stats: {
      strength: 9,
      dexterity: 15,
      constitution: 12,
      intelligence: 17,
      wisdom: 14,
      charisma: 13,
    },
    skillProficiencies: ['Arcana', 'History', 'Insight', 'Investigation'],
    savingThrowProficiencies: ['intelligence', 'wisdom'],
    inventory: [
      INITIAL_ITEMS[2], // Staff
      { ...INITIAL_ITEMS[5], id: 'elara-mana-1' },
      { ...INITIAL_ITEMS[5], id: 'elara-mana-2' },
      { ...INITIAL_ITEMS[4], id: 'elara-heal-1' },
    ],
    gold: 180,
    xp: 320,
    position: { x: 3, y: 2 },
    color: '#60a5fa',
    avatarSeed: 'Elara',
    abilities: [
      {
        name: 'Fire Bolt (Cantrip)',
        description: 'Hurl a mote of fire dealing 1d10 Fire damage vs target AC at 60ft range.',
        manaCost: 0,
        actionType: 'action',
        damageDice: '1d10',
        damageType: 'Fire',
        effect: 'Ranged spell attack dealing 1d10 fire damage',
      },
      {
        name: 'Magic Missile (1st Level)',
        description: 'Create 3 glowing darts of magical force that unerringly strike for 3d4+3 Force damage.',
        manaCost: 3,
        actionType: 'action',
        damageDice: '3d4',
        damageType: 'Force',
        effect: 'Guaranteed 3d4+3 force damage (auto-hits target)',
      },
      {
        name: 'Misty Step (2nd Level)',
        description: 'Surrounded by silver mist, teleport up to 30 feet as a Bonus Action.',
        manaCost: 5,
        actionType: 'bonus',
        effect: 'Instant reposition without provoking opportunity attacks',
      },
    ],
  },
  {
    id: 'char-kane',
    name: 'Kane Stonehammer',
    race: 'Dwarf',
    classType: 'Rogue',
    level: 2,
    hp: 20,
    maxHp: 20,
    mp: 8,
    maxMp: 8,
    ac: 14,
    speed: 25,
    movementRemaining: 5,
    initiativeModifier: 3,
    proficiencyBonus: 2,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
    spellSlots: {
      level1: { current: 0, max: 0 },
      level2: { current: 0, max: 0 },
    },
    actionEconomy: {
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
    },
    stats: {
      strength: 13,
      dexterity: 16,
      constitution: 15,
      intelligence: 11,
      wisdom: 12,
      charisma: 10,
    },
    skillProficiencies: ['Acrobatics', 'Deception', 'Sleight of Hand', 'Stealth'],
    savingThrowProficiencies: ['dexterity', 'intelligence'],
    inventory: [
      INITIAL_ITEMS[3], // Dagger
      { ...INITIAL_ITEMS[4], id: 'kane-pot-1' },
      { ...INITIAL_ITEMS[4], id: 'kane-pot-2' },
    ],
    gold: 210,
    xp: 290,
    position: { x: 2, y: 3 },
    color: '#34d399',
    avatarSeed: 'Kane',
    abilities: [
      {
        name: 'Sneak Attack',
        description: 'Exploit foe distraction to deal an extra 1d6 precision damage with finesse weapon.',
        manaCost: 1,
        actionType: 'action',
        damageDice: '1d6',
        damageType: 'Piercing',
        effect: 'Deals additional 1d6 sneak attack damage on hit',
      },
      {
        name: 'Cunning Action: Dash',
        description: 'Use a Bonus Action to Dash, doubling movement speed this round.',
        manaCost: 0,
        actionType: 'bonus',
        effect: 'Doubles movement budget for current turn',
      },
      {
        name: 'Cunning Action: Disengage',
        description: 'Use a Bonus Action to Disengage, slipping past enemies without triggering attacks.',
        manaCost: 0,
        actionType: 'bonus',
        effect: 'Evades enemy reactions and opportunity attacks',
      },
    ],
  },
];

export const DEMO_MONSTERS: Monster[] = [
  {
    id: 'mon-goblin-1',
    name: 'Goblin Sentry',
    type: 'Goblin',
    hp: 14,
    maxHp: 14,
    ac: 13,
    attackModifier: 3,
    damageDice: '1d6',
    damageType: 'Slashing',
    position: { x: 6, y: 4 },
    xpReward: 60,
    goldReward: 15,
    isAlive: true,
    avatar: '👹',
    speed: 6,
  },
  {
    id: 'mon-skeleton-1',
    name: 'Skeleton Archer',
    type: 'Skeleton',
    hp: 16,
    maxHp: 16,
    ac: 12,
    attackModifier: 4,
    damageDice: '1d6',
    damageType: 'Piercing',
    position: { x: 10, y: 3 },
    xpReward: 75,
    goldReward: 20,
    isAlive: true,
    avatar: '💀',
    speed: 6,
  },
  {
    id: 'mon-wolf-1',
    name: 'Dire Cave Wolf',
    type: 'Wolf',
    hp: 18,
    maxHp: 18,
    ac: 13,
    attackModifier: 4,
    damageDice: '1d8',
    damageType: 'Piercing',
    position: { x: 8, y: 7 },
    xpReward: 90,
    goldReward: 10,
    isAlive: true,
    avatar: '🐺',
    speed: 8,
  },
  {
    id: 'mon-orc-1',
    name: 'Orc Berserker',
    type: 'Orc',
    hp: 28,
    maxHp: 28,
    ac: 14,
    attackModifier: 5,
    damageDice: '1d10',
    damageType: 'Slashing',
    position: { x: 12, y: 8 },
    xpReward: 150,
    goldReward: 40,
    isAlive: true,
    avatar: '🧌',
    speed: 6,
  },
  {
    id: 'mon-boss-1',
    name: 'Grave Revenant',
    type: 'Dungeon Boss',
    hp: 55,
    maxHp: 55,
    ac: 16,
    attackModifier: 6,
    damageDice: '2d8',
    damageType: 'Necrotic',
    position: { x: 14, y: 5 },
    xpReward: 400,
    goldReward: 150,
    isAlive: true,
    avatar: '👑',
    speed: 6,
  },
];

export const DEMO_QUEST: Quest = {
  id: 'quest-lost-dungeon',
  title: 'The Lost Dungeon',
  giver: 'Elder Rowan',
  description: 'Cleanse the corrupted catacombs beneath the shattered clocktower and defeat the Grave Revenant.',
  xpReward: 500,
  goldReward: 200,
  isCompleted: false,
  objectives: [
    { id: 1, title: 'Talk to Elder Rowan', description: 'Meet the town elder in Oakhaven village square.', isCompleted: true },
    { id: 2, title: 'Enter the Dungeon', description: 'Cross through the iron archway into the Crypts.', isCompleted: true },
    { id: 3, title: 'Defeat the Goblin Guard', description: 'Vanquish the sentry watching the northern threshold.', isCompleted: false },
    { id: 4, title: 'Find the Ancient Key', description: 'Search the crypt alcoves for the lock opener.', isCompleted: false },
    { id: 5, title: 'Defeat the Dungeon Boss', description: 'Slay the Grave Revenant in the inner chamber.', isCompleted: false },
    { id: 6, title: 'Return to Elder Rowan', description: 'Report your victory to Oakhaven village.', isCompleted: false },
  ],
};

export const DEMO_CAMPAIGN: Campaign = {
  id: 'camp-lost-dungeon',
  name: 'The Lost Dungeon',
  dmName: 'Master Aldren',
  hostUid: 'dm-master-aldren',
  roomCode: 'whispering-catacombs',
  maxPlayers: 5,
  playerCount: 3,
  status: 'Active',
  currentArea: 'The Whispering Halls (Floor 1)',
};

export const INITIAL_CHAT: ChatMessage[] = [
  { id: 'c1', sender: 'Master Aldren', role: 'DM', text: 'Welcome brave adventurers. The torchlight flickers as cold air sweeps up from the lower tombs.', timestamp: '10:30' },
  { id: 'c2', sender: 'Aric Silverleaf', role: 'PLAYER', text: 'I draw my longsword and shield. Kane, check the shadows.', timestamp: '10:31', color: '#c5a059' },
  { id: 'c3', sender: 'Elara Moonwhisper', role: 'PLAYER', text: 'My arcane senses detect dark enchantments beyond this portal.', timestamp: '10:32', color: '#60a5fa' },
];

export const INITIAL_EVENTS: GameEvent[] = [
  { id: 'e1', message: 'Party gathered in Oakhaven Village.', type: 'movement', timestamp: '10:28' },
  { id: 'e2', message: 'Elder Rowan bestowed quest: "The Lost Dungeon"', type: 'quest', timestamp: '10:29' },
  { id: 'e3', message: 'Party breached the threshold into The Whispering Halls.', type: 'dm', timestamp: '10:30' },
];

export const generateDemoMap = (): MapTile[] => {
  const tiles: MapTile[] = [];
  const cols = 16;
  const rows = 12;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let type: MapTile['type'] = 'floor';

      // Outer boundary walls
      if (x === 0 || x === cols - 1 || y === 0 || y === rows - 1) {
        type = 'wall';
      }
      // Inner chamber partition walls
      else if (x === 5 && (y < 4 || y > 5)) {
        type = 'wall';
      }
      else if (x === 11 && (y < 3 || (y > 4 && y < 9))) {
        type = 'wall';
      }
      else if (y === 6 && (x > 5 && x < 10)) {
        type = 'wall';
      }
      // Doors
      else if (x === 5 && (y === 4 || y === 5)) {
        type = 'door';
      }
      else if (x === 11 && y === 4) {
        type = 'door';
      }
      // Special interactive spots
      else if (x === 14 && y === 2) {
        type = 'treasure';
      }
      else if (x === 14 && y === 10) {
        type = 'stairs';
      }

      // Initial fog of war: Start room (x: 1-5, y: 1-6) is revealed
      const initiallyRevealed = (x >= 1 && x <= 5 && y >= 1 && y <= 6);

      tiles.push({
        x,
        y,
        type,
        revealed: initiallyRevealed,
        isDoorOpen: false,
        isChestOpen: false,
      });
    }
  }

  return tiles;
};
