import { MapTile, Monster, Character, CombatSession } from '../types/rpg';

export interface DungeonTheme {
  id: string;
  name: string;
  floor: number;
  description: string;
  generate: () => {
    tiles: MapTile[];
    monsters: Monster[];
    startPositions: { x: number; y: number }[];
    areaName: string;
  };
}

const COLS = 16;
const ROWS = 12;

// Helper to make blank wall grid
const createBaseGrid = (): MapTile[] => {
  const tiles: MapTile[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      tiles.push({
        x,
        y,
        type: (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) ? 'wall' : 'floor',
        revealed: false,
        isDoorOpen: false,
        isChestOpen: false,
      });
    }
  }
  return tiles;
};

// 1. Theme 1: The Whispering Catacombs
const generateCatacombs = () => {
  const tiles = createBaseGrid();

  tiles.forEach(t => {
    const { x, y } = t;
    if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) return;

    // Partition walls
    if (x === 5 && (y < 4 || y > 5)) {
      t.type = 'wall';
    } else if (x === 11 && (y < 3 || (y > 4 && y < 9))) {
      t.type = 'wall';
    } else if (y === 6 && (x > 5 && x < 10)) {
      t.type = 'wall';
    }
    // Doors
    else if (x === 5 && (y === 4 || y === 5)) {
      t.type = 'door';
    } else if (x === 11 && y === 4) {
      t.type = 'door';
    }
    // Chest & Stairs
    else if (x === 14 && y === 2) {
      t.type = 'treasure';
    } else if (x === 14 && y === 10) {
      t.type = 'stairs';
    }

    // Start room is revealed
    if (x >= 1 && x <= 5 && y >= 1 && y <= 6) {
      t.revealed = true;
    }
  });

  const monsters: Monster[] = [
    {
      id: `mon-goblin-${Date.now()}-1`,
      name: 'Goblin Sentry',
      type: 'Goblin',
      hp: 14,
      maxHp: 14,
      ac: 13,
      attackModifier: 4,
      damageDice: '1d6+2',
      damageType: 'Piercing',
      position: { x: 7, y: 3 },
      xpReward: 50,
      goldReward: 15,
      isAlive: true,
      avatar: '👺',
      speed: 6,
    },
    {
      id: `mon-skel-${Date.now()}-2`,
      name: 'Crypt Skeleton',
      type: 'Skeleton',
      hp: 18,
      maxHp: 18,
      ac: 13,
      attackModifier: 4,
      damageDice: '1d6+2',
      damageType: 'Piercing',
      position: { x: 8, y: 8 },
      xpReward: 75,
      goldReward: 20,
      isAlive: true,
      avatar: '💀',
      speed: 6,
    },
    {
      id: `mon-orc-${Date.now()}-3`,
      name: 'Orc Berserker',
      type: 'Orc',
      hp: 28,
      maxHp: 28,
      ac: 14,
      attackModifier: 5,
      damageDice: '1d10+3',
      damageType: 'Slashing',
      position: { x: 12, y: 8 },
      xpReward: 150,
      goldReward: 40,
      isAlive: true,
      avatar: '🧌',
      speed: 6,
    },
    {
      id: `mon-boss-${Date.now()}-4`,
      name: 'Grave Revenant',
      type: 'Dungeon Boss',
      hp: 55,
      maxHp: 55,
      ac: 16,
      attackModifier: 6,
      damageDice: '2d8+3',
      damageType: 'Necrotic',
      position: { x: 13, y: 5 },
      xpReward: 400,
      goldReward: 150,
      isAlive: true,
      avatar: '👑',
      speed: 6,
    },
  ];

  const startPositions = [
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 1, y: 2 },
    { x: 4, y: 2 },
  ];

  return {
    tiles,
    monsters,
    startPositions,
    areaName: 'The Whispering Catacombs (Floor 1)',
  };
};

// 2. Theme 2: The Obsidian Vault
const generateObsidianVault = () => {
  const tiles = createBaseGrid();

  tiles.forEach(t => {
    const { x, y } = t;
    if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) return;

    // Cross-shaped layout partition walls
    if ((x === 5 && y !== 3 && y !== 7) || (x === 10 && y !== 4 && y !== 8)) {
      t.type = 'wall';
    } else if ((y === 4 && (x < 5 || x > 10)) || (y === 8 && (x < 5 || x > 10))) {
      t.type = 'wall';
    }
    // Doors
    else if ((x === 5 && y === 3) || (x === 5 && y === 7) || (x === 10 && y === 4)) {
      t.type = 'door';
    }
    // Magma moat or water decorative channel in central rotunda
    else if (x === 8 && y === 6) {
      t.type = 'water';
    }
    // Treasure & Stairs
    else if ((x === 2 && y === 9) || (x === 14 && y === 2)) {
      t.type = 'treasure';
    } else if (x === 14 && y === 6) {
      t.type = 'stairs';
    }

    // Starting northwestern room revealed
    if (x >= 1 && x <= 4 && y >= 1 && y <= 3) {
      t.revealed = true;
    }
  });

  const monsters: Monster[] = [
    {
      id: `mon-wolf-${Date.now()}-1`,
      name: 'Shadow Stalker',
      type: 'Wolf',
      hp: 22,
      maxHp: 22,
      ac: 13,
      attackModifier: 4,
      damageDice: '2d4+2',
      damageType: 'Piercing',
      position: { x: 3, y: 6 },
      xpReward: 90,
      goldReward: 25,
      isAlive: true,
      avatar: '🐺',
      speed: 8,
    },
    {
      id: `mon-skel-${Date.now()}-2`,
      name: 'Obsidian Guard',
      type: 'Skeleton',
      hp: 24,
      maxHp: 24,
      ac: 14,
      attackModifier: 5,
      damageDice: '1d8+2',
      damageType: 'Slashing',
      position: { x: 7, y: 5 },
      xpReward: 120,
      goldReward: 35,
      isAlive: true,
      avatar: '💀',
      speed: 6,
    },
    {
      id: `mon-orc-${Date.now()}-3`,
      name: 'Flameblood Orc',
      type: 'Orc',
      hp: 34,
      maxHp: 34,
      ac: 15,
      attackModifier: 6,
      damageDice: '1d12+3',
      damageType: 'Fire',
      position: { x: 9, y: 6 },
      xpReward: 180,
      goldReward: 50,
      isAlive: true,
      avatar: '🧌',
      speed: 6,
    },
    {
      id: `mon-boss-${Date.now()}-4`,
      name: 'Obsidian Warlord',
      type: 'Dungeon Boss',
      hp: 65,
      maxHp: 65,
      ac: 17,
      attackModifier: 7,
      damageDice: '2d10+4',
      damageType: 'Bludgeoning',
      position: { x: 13, y: 5 },
      xpReward: 550,
      goldReward: 200,
      isAlive: true,
      avatar: '🗿',
      speed: 6,
    },
  ];

  const startPositions = [
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 1, y: 2 },
    { x: 4, y: 2 },
  ];

  return {
    tiles,
    monsters,
    startPositions,
    areaName: 'The Obsidian Vault (Floor 2)',
  };
};

// 3. Theme 3: The Sunken Serpent Temple
const generateSunkenTemple = () => {
  const tiles = createBaseGrid();

  tiles.forEach(t => {
    const { x, y } = t;
    if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) return;

    // Flooded temple walls & chambers
    if (x === 6 && (y < 4 || y > 7)) {
      t.type = 'wall';
    } else if (x === 11 && (y < 5 || y > 6)) {
      t.type = 'wall';
    } else if (y === 4 && (x > 6 && x < 11 && x !== 8)) {
      t.type = 'wall';
    }
    // Doors
    else if (x === 6 && (y === 5 || y === 6)) {
      t.type = 'door';
    } else if (x === 11 && (y === 5 || y === 6)) {
      t.type = 'door';
    }
    // Sunken water canal
    else if (y === 8 && x >= 3 && x <= 10) {
      t.type = 'water';
    }
    // Ancient relic chests & stairs
    else if (x === 14 && y === 2) {
      t.type = 'treasure';
    } else if (x === 9 && y === 2) {
      t.type = 'treasure';
    } else if (x === 14 && y === 9) {
      t.type = 'stairs';
    }

    // Southwest start camp is revealed
    if (x >= 1 && x <= 5 && y >= 1 && y <= 5) {
      t.revealed = true;
    }
  });

  const monsters: Monster[] = [
    {
      id: `mon-goblin-${Date.now()}-1`,
      name: 'Bog Goblin Trapper',
      type: 'Goblin',
      hp: 16,
      maxHp: 16,
      ac: 13,
      attackModifier: 4,
      damageDice: '1d6+2',
      damageType: 'Poison',
      position: { x: 4, y: 7 },
      xpReward: 60,
      goldReward: 20,
      isAlive: true,
      avatar: '👺',
      speed: 6,
    },
    {
      id: `mon-skel-${Date.now()}-2`,
      name: 'Drowned Mariner',
      type: 'Skeleton',
      hp: 20,
      maxHp: 20,
      ac: 13,
      attackModifier: 4,
      damageDice: '1d8+2',
      damageType: 'Cold',
      position: { x: 8, y: 6 },
      xpReward: 95,
      goldReward: 30,
      isAlive: true,
      avatar: '💀',
      speed: 6,
    },
    {
      id: `mon-wolf-${Date.now()}-3`,
      name: 'Marsh Serpent',
      type: 'Wolf',
      hp: 30,
      maxHp: 30,
      ac: 14,
      attackModifier: 5,
      damageDice: '2d6+3',
      damageType: 'Poison',
      position: { x: 9, y: 3 },
      xpReward: 160,
      goldReward: 45,
      isAlive: true,
      avatar: '🐍',
      speed: 7,
    },
    {
      id: `mon-boss-${Date.now()}-4`,
      name: 'Leviathan Priestess',
      type: 'Dungeon Boss',
      hp: 60,
      maxHp: 60,
      ac: 16,
      attackModifier: 7,
      damageDice: '2d8+4',
      damageType: 'Cold',
      position: { x: 13, y: 5 },
      xpReward: 500,
      goldReward: 180,
      isAlive: true,
      avatar: '🐉',
      speed: 6,
    },
  ];

  const startPositions = [
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 1, y: 3 },
    { x: 4, y: 3 },
  ];

  return {
    tiles,
    monsters,
    startPositions,
    areaName: 'The Sunken Serpent Temple (Floor 3)',
  };
};

// 4. Theme 4: The Ironhold Prison & Labyrinth
const generateIronholdLabyrinth = () => {
  const tiles = createBaseGrid();

  tiles.forEach(t => {
    const { x, y } = t;
    if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) return;

    // Fortress cell block walls
    if (x === 4 && (y < 4 || y > 5)) {
      t.type = 'wall';
    } else if (x === 9 && (y < 3 || (y > 4 && y < 8))) {
      t.type = 'wall';
    } else if (y === 4 && (x > 9 && x < 14)) {
      t.type = 'wall';
    } else if (y === 7 && (x > 3 && x < 9)) {
      t.type = 'wall';
    }
    // Heavy iron doors
    else if (x === 4 && (y === 4 || y === 5)) {
      t.type = 'door';
    } else if (x === 9 && y === 4) {
      t.type = 'door';
    } else if (x === 12 && y === 4) {
      t.type = 'door';
    }
    // Armory treasure & dungeon stairs
    else if (x === 13 && y === 2) {
      t.type = 'treasure';
    } else if (x === 6 && y === 9) {
      t.type = 'treasure';
    } else if (x === 14 && y === 9) {
      t.type = 'stairs';
    }

    // Entrance barracks revealed
    if (x >= 1 && x <= 4 && y >= 1 && y <= 5) {
      t.revealed = true;
    }
  });

  const monsters: Monster[] = [
    {
      id: `mon-goblin-${Date.now()}-1`,
      name: 'Ironhold Jailer',
      type: 'Goblin',
      hp: 18,
      maxHp: 18,
      ac: 14,
      attackModifier: 4,
      damageDice: '1d6+2',
      damageType: 'Bludgeoning',
      position: { x: 6, y: 5 },
      xpReward: 70,
      goldReward: 25,
      isAlive: true,
      avatar: '👺',
      speed: 6,
    },
    {
      id: `mon-skel-${Date.now()}-2`,
      name: 'Chained Skeleton',
      type: 'Skeleton',
      hp: 22,
      maxHp: 22,
      ac: 13,
      attackModifier: 4,
      damageDice: '1d8+2',
      damageType: 'Slashing',
      position: { x: 7, y: 9 },
      xpReward: 100,
      goldReward: 30,
      isAlive: true,
      avatar: '💀',
      speed: 6,
    },
    {
      id: `mon-orc-${Date.now()}-3`,
      name: 'Ironclad Executioner',
      type: 'Orc',
      hp: 36,
      maxHp: 36,
      ac: 16,
      attackModifier: 6,
      damageDice: '2d6+3',
      damageType: 'Slashing',
      position: { x: 11, y: 7 },
      xpReward: 200,
      goldReward: 60,
      isAlive: true,
      avatar: '🧌',
      speed: 6,
    },
    {
      id: `mon-boss-${Date.now()}-4`,
      name: 'Ironhold High Inquisitor',
      type: 'Dungeon Boss',
      hp: 70,
      maxHp: 70,
      ac: 17,
      attackModifier: 7,
      damageDice: '2d10+4',
      damageType: 'Fire',
      position: { x: 13, y: 8 },
      xpReward: 600,
      goldReward: 220,
      isAlive: true,
      avatar: '👹',
      speed: 6,
    },
  ];

  const startPositions = [
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 1, y: 2 },
    { x: 4, y: 2 },
  ];

  return {
    tiles,
    monsters,
    startPositions,
    areaName: 'The Ironhold Labyrinth (Floor 4)',
  };
};

export const DUNGEON_THEMES: DungeonTheme[] = [
  {
    id: 'catacombs',
    name: 'The Whispering Catacombs',
    floor: 1,
    description: 'Ancient subterranean crypts with stone sarcophagi, goblin guards, and necrotic shadows.',
    generate: generateCatacombs,
  },
  {
    id: 'obsidian',
    name: 'The Obsidian Vault',
    floor: 2,
    description: 'Fortified subterranean stronghold flanked by molten channels and obsidian-clad guardians.',
    generate: generateObsidianVault,
  },
  {
    id: 'sunken',
    name: 'The Sunken Serpent Temple',
    floor: 3,
    description: 'Moss-covered flooded sanctuary where marsh beasts and submerged horrors lurk.',
    generate: generateSunkenTemple,
  },
  {
    id: 'ironhold',
    name: 'The Ironhold Labyrinth',
    floor: 4,
    description: 'High-security iron-barred dungeon and execution courtyard overseen by the High Inquisitor.',
    generate: generateIronholdLabyrinth,
  },
];

export const generateNewDungeonBoard = (
  themeIdOrRandom?: string,
  existingParty: Character[] = []
): {
  tiles: MapTile[];
  monsters: Monster[];
  characters: Character[];
  combat: CombatSession;
  areaName: string;
  theme: DungeonTheme;
} => {
  let theme: DungeonTheme;
  if (themeIdOrRandom && themeIdOrRandom !== 'random') {
    theme = DUNGEON_THEMES.find(t => t.id === themeIdOrRandom) || DUNGEON_THEMES[0];
  } else {
    // Pick random or cycle
    const randIdx = Math.floor(Math.random() * DUNGEON_THEMES.length);
    theme = DUNGEON_THEMES[randIdx];
  }

  const { tiles, monsters, startPositions, areaName } = theme.generate();

  // Reposition party at starting coordinates with restored vitality
  const updatedCharacters = existingParty.map((char, index) => {
    const pos = startPositions[index % startPositions.length] || { x: 2, y: 2 };
    return {
      ...char,
      position: { x: pos.x, y: pos.y },
      hp: char.maxHp,
      mp: char.maxMp,
      movementRemaining: Math.floor(char.speed / 5),
      conditions: [],
      actionEconomy: {
        actionUsed: false,
        bonusActionUsed: false,
        reactionUsed: false,
      },
      lastAction: `Arrived at ${areaName}`,
      isOnline: true,
      lastSeen: Date.now(),
    };
  });

  const combat: CombatSession = {
    isActive: false,
    round: 1,
    turnIndex: 0,
    participants: [],
    targetMonsterId: null,
  };

  return {
    tiles,
    monsters,
    characters: updatedCharacters,
    combat,
    areaName,
    theme,
  };
};
