import React, { useState, useEffect, useRef } from 'react';
import { 
  Character, 
  Monster, 
  MapTile, 
  Quest, 
  CombatSession, 
  ChatMessage, 
  GameEvent, 
  Campaign, 
  UserRole,
  UserProfile,
  Item
} from './types/rpg';
import { 
  DEMO_CHARACTERS, 
  DEMO_MONSTERS, 
  DEMO_QUEST, 
  DEMO_CAMPAIGN, 
  INITIAL_CHAT, 
  INITIAL_EVENTS, 
  generateDemoMap 
} from './game/demoData';
import { 
  subscribeToAuth, 
  logoutUser, 
  getCurrentUserProfile,
  initializeRoomIfNotExists, 
  subscribeToRoomPlayers, 
  subscribeToRoomMonsters, 
  subscribeToRoomCombat, 
  subscribeToRoomTiles, 
  subscribeToRoomMessages, 
  subscribeToRoomEvents, 
  syncPlayerToRoom, 
  syncRoomCharacters,
  syncMonsterToRoom, 
  syncCombatToRoom, 
  syncTilesToRoom, 
  broadcastRoomMessage, 
  broadcastRoomEvent 
} from './lib/multiplayerService';
import { Header } from './components/navigation/Header';
import { LandingPage } from './components/landing/LandingPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { CharacterCreator } from './components/character/CharacterCreator';
import { VirtualTabletop } from './components/tabletop/VirtualTabletop';
import { DMDashboard } from './components/dm/DMDashboard';
import { CharacterSheetModal } from './components/character/CharacterSheetModal';
import { AuthModal } from './components/auth/AuthModal';
import { LoginScreen } from './components/auth/LoginScreen';

export default function App() {
  // Navigation & Role State - Starts on Login Screen as requested
  const [activeTab, setActiveTab] = useState<'login' | 'landing' | 'dashboard' | 'tabletop' | 'dm' | 'creator'>('login');
  const [currentRole, setCurrentRole] = useState<UserRole>('PLAYER');

  // Online Multiplayer Room & Auth State
  const [roomCode, setRoomCode] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('room') || 'whispering-catacombs';
    } catch {
      return 'whispering-catacombs';
    }
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Core Game Entities State
  const [characters, setCharacters] = useState<Character[]>(DEMO_CHARACTERS);

  // Custom forged hero archetypes saved by player
  const [customArchetypes, setCustomArchetypes] = useState<Character[]>(() => {
    try {
      const saved = localStorage.getItem('dnd_custom_archetypes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Canonical selectable hero archetypes for login / hero selection
  // Guarantees each character archetype (Aric, Elara, Kane, + unique custom forged heroes) appears EXACTLY ONCE
  const selectableArchetypes = React.useMemo(() => {
    const combined = [...DEMO_CHARACTERS, ...customArchetypes];
    const seenNames = new Set<string>();
    const uniqueList: Character[] = [];

    for (const char of combined) {
      const normalizedName = char.name.trim().toLowerCase();
      // Filter out any runtime session clone tokens (e.g. hero_user_*) and duplicate names
      if (!char.id.startsWith('hero_') && !seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        uniqueList.push({
          ...char,
          ownerId: undefined,
          ownerName: undefined,
          isOnline: false,
        });
      }
    }
    return uniqueList.length > 0 ? uniqueList : DEMO_CHARACTERS;
  }, [customArchetypes]);

  const [myCharacterId, setMyCharacterId] = useState<string>(() => {
    return localStorage.getItem('dnd_my_character_id') || DEMO_CHARACTERS[0].id;
  });
  const [activeCharacterId, setActiveCharacterId] = useState<string>(DEMO_CHARACTERS[0].id);
  const [monsters, setMonsters] = useState<Monster[]>(DEMO_MONSTERS);
  const [tiles, setTiles] = useState<MapTile[]>(generateDemoMap());
  const [quest, setQuest] = useState<Quest>(DEMO_QUEST);
  const [campaign, setCampaign] = useState<Campaign>(DEMO_CAMPAIGN);

  // Synchronized Event State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>(INITIAL_EVENTS);

  // Combat State
  const [combat, setCombat] = useState<CombatSession>({
    isActive: false,
    round: 1,
    turnIndex: 0,
    participants: [],
    targetMonsterId: null,
  });

  // Modal State
  const [showGlobalSheet, setShowGlobalSheet] = useState<boolean>(false);
  const [fogRevealedAll, setFogRevealedAll] = useState<boolean>(false);

  const activeChar = characters.find(c => c.id === activeCharacterId) || characters[0];
  const isSyncingFromRemote = useRef(false);

  // 1. Subscribe to Firebase Authentication
  useEffect(() => {
    const unsubscribe = subscribeToAuth((profile) => {
      setUserProfile(profile);
      if (profile?.role) {
        setCurrentRole(profile.role);
      }
      if (profile?.characterId) {
        setMyCharacterId(profile.characterId);
        setActiveCharacterId(profile.characterId);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleEnterGame = (
    characterId: string, 
    role: UserRole, 
    targetRoomCode: string,
    enteredProfile?: UserProfile | null
  ) => {
    const activeProf = enteredProfile || userProfile || getCurrentUserProfile();
    if (activeProf) {
      setUserProfile(activeProf);
    }

    const userDisplayName = activeProf?.displayName || 'Adventurer';
    const userUid = activeProf?.uid || `user_${Date.now()}`;

    // Unique hero ID bound to this user account so 2 accounts picking the same archetype remain distinct!
    const playerHeroId = `hero_${userUid}`;
    setMyCharacterId(playerHeroId);
    setActiveCharacterId(playerHeroId);
    setCurrentRole(role);
    setRoomCode(targetRoomCode);
    try {
      localStorage.setItem('dnd_my_character_id', playerHeroId);
    } catch (e) {}

    // Find the base archetype template from clean selectable archetypes
    const baseChar = selectableArchetypes.find(c => c.id === characterId) 
      || DEMO_CHARACTERS.find(c => c.id === characterId) 
      || selectableArchetypes.find(c => c.name.toLowerCase() === characterId.toLowerCase()) 
      || DEMO_CHARACTERS[0];
    
    // Check if hero already exists in current room
    const existingHero = characters.find(c => c.id === playerHeroId || (c.ownerId && c.ownerId === userUid));

    // Calculate spawn coordinates to prevent stacking directly on top of another player initially
    let spawnX = existingHero ? existingHero.position.x : baseChar.position.x;
    let spawnY = existingHero ? existingHero.position.y : baseChar.position.y;
    const occupiedCoords = characters
      .filter(c => c.ownerId && c.ownerId !== userUid)
      .map(c => `${c.position.x},${c.position.y}`);

    if (!existingHero && occupiedCoords.includes(`${spawnX},${spawnY}`)) {
      if (!occupiedCoords.includes(`${spawnX + 1},${spawnY}`)) spawnX += 1;
      else if (!occupiedCoords.includes(`${spawnX},${spawnY + 1}`)) spawnY += 1;
      else spawnX += 2;
    }

    const myHero: Character = {
      ...(existingHero || baseChar),
      id: playerHeroId,
      ownerId: userUid,
      ownerName: userDisplayName,
      isOnline: true,
      lastSeen: Date.now(),
      lastAction: `Joined campaign ${targetRoomCode}`,
      position: { x: spawnX, y: spawnY },
    };

    // Keep all other online players' heroes
    const otherPlayers = characters.filter(c => c.id !== playerHeroId && c.ownerId && c.ownerId !== userUid);
    
    // Unassigned companions are non-player archetypes not picked by any active player in this room
    const otherPlayerNames = new Set(otherPlayers.map(p => p.name.toLowerCase()));
    const unassignedCompanions = selectableArchetypes.filter(c => 
      c.id !== baseChar.id && 
      c.name.toLowerCase() !== baseChar.name.toLowerCase() &&
      !otherPlayerNames.has(c.name.toLowerCase())
    );

    const mergedList: Character[] = [
      myHero,
      ...otherPlayers,
      ...unassignedCompanions
    ];

    setCharacters(mergedList);
    syncRoomCharacters(targetRoomCode, mergedList);

    handleAddGameEvent({
      id: `evt-enter-${Date.now()}`,
      message: `🎲 ${userDisplayName} entered campaign ${targetRoomCode} as ${baseChar.name}.`,
      type: 'combat',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    if (role === 'DM') {
      setActiveTab('dm');
    } else {
      setActiveTab('tabletop');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUserProfile(null);
    setCharacters(selectableArchetypes);
    setActiveTab('login');
  };

  // 2. Initialize and subscribe to Multiplayer Campaign Room via Supabase Realtime
  useEffect(() => {
    // Only connect and sync once the user has entered the game
    if (activeTab === 'login') {
      return;
    }

    // Seed room if new
    initializeRoomIfNotExists(roomCode, {
      campaign,
      characters,
      monsters,
      tiles,
      combat,
    });

    // Real-time players sync
    const unsubPlayers = subscribeToRoomPlayers(roomCode, (remotePlayers) => {
      if (remotePlayers && remotePlayers.length > 0) {
        isSyncingFromRemote.current = true;
        setCharacters(remotePlayers);
        setTimeout(() => { isSyncingFromRemote.current = false; }, 100);
      }
    });

    // Real-time monsters sync
    const unsubMonsters = subscribeToRoomMonsters(roomCode, (remoteMonsters) => {
      if (remoteMonsters && remoteMonsters.length > 0) {
        setMonsters(remoteMonsters);
      }
    });

    // Real-time combat sync
    const unsubCombat = subscribeToRoomCombat(roomCode, (remoteCombat) => {
      if (remoteCombat) {
        setCombat(remoteCombat);
      }
    });

    // Real-time tiles sync
    const unsubTiles = subscribeToRoomTiles(roomCode, (remoteTiles) => {
      if (remoteTiles && remoteTiles.length > 0) {
        setTiles(remoteTiles);
      }
    });

    // Real-time chat sync
    const unsubMessages = subscribeToRoomMessages(roomCode, (remoteMsgs) => {
      if (remoteMsgs && remoteMsgs.length > 0) {
        setChatMessages(remoteMsgs);
      }
    });

    // Real-time game events sync
    const unsubEvents = subscribeToRoomEvents(roomCode, (remoteEvts) => {
      if (remoteEvts && remoteEvts.length > 0) {
        setGameEvents(remoteEvts);
      }
    });

    return () => {
      unsubPlayers();
      unsubMonsters();
      unsubCombat();
      unsubTiles();
      unsubMessages();
      unsubEvents();
    };
  }, [roomCode, activeTab, userProfile]);

  // Synchronized Mutation Handlers
  const handleUpdateCharacters = (chars: Character[]) => {
    setCharacters(chars);
    if (!isSyncingFromRemote.current) {
      syncRoomCharacters(roomCode, chars);
    }
  };

  const handleUpdateMonsters = (mons: Monster[]) => {
    setMonsters(mons);
    mons.forEach(m => syncMonsterToRoom(roomCode, m));
  };

  const handleUpdateCombat = (newCombat: CombatSession) => {
    setCombat(newCombat);
    syncCombatToRoom(roomCode, newCombat);
  };

  const handleUpdateTiles = (newTiles: MapTile[]) => {
    setTiles(newTiles);
    syncTilesToRoom(roomCode, newTiles);
  };

  const handleAddChatMessage = (msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg]);
    broadcastRoomMessage(roomCode, msg);
  };

  const handleAddGameEvent = (evt: GameEvent) => {
    setGameEvents(prev => [evt, ...prev.slice(0, 30)]);
    broadcastRoomEvent(roomCode, evt);
  };

  const handleCharacterCreated = (newChar: Character) => {
    // Save to custom archetypes so it is available on login screen and hero selection
    setCustomArchetypes(prev => {
      const updated = [newChar, ...prev.filter(c => c.name.toLowerCase() !== newChar.name.toLowerCase())];
      try {
        localStorage.setItem('dnd_custom_archetypes', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setCharacters(prev => [newChar, ...prev]);
    setActiveCharacterId(newChar.id);
    setActiveTab('tabletop');

    // Broadcast to room
    syncPlayerToRoom(roomCode, newChar);

    handleAddGameEvent({
      id: `evt-forge-${Date.now()}`,
      message: `✨ ${newChar.name} (${newChar.race} ${newChar.classType}) entered campaign room ${roomCode}.`,
      type: 'loot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    handleAddChatMessage({
      id: `chat-forge-${Date.now()}`,
      sender: 'Master Aldren',
      role: 'DM',
      text: `${newChar.name} joined the expedition in The Whispering Halls!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  // DM Controls Handlers
  const handleSpawnMonster = (type: Monster['type']) => {
    const newMonster: Monster = {
      id: `mon-${type.toLowerCase()}-${Date.now()}`,
      name: `Dungeon ${type}`,
      type,
      hp: type === 'Dungeon Boss' ? 60 : type === 'Orc' ? 30 : 16,
      maxHp: type === 'Dungeon Boss' ? 60 : type === 'Orc' ? 30 : 16,
      ac: type === 'Dungeon Boss' ? 16 : 13,
      attackModifier: type === 'Dungeon Boss' ? 6 : 4,
      damageDice: type === 'Dungeon Boss' ? '2d8' : '1d8',
      position: { x: Math.floor(Math.random() * 8) + 5, y: Math.floor(Math.random() * 6) + 3 },
      xpReward: type === 'Dungeon Boss' ? 400 : 80,
      goldReward: type === 'Dungeon Boss' ? 120 : 25,
      isAlive: true,
      avatar: type === 'Goblin' ? '👹' : type === 'Skeleton' ? '💀' : type === 'Wolf' ? '🐺' : type === 'Orc' ? '🧌' : '👑',
    };

    setMonsters(prev => [...prev, newMonster]);
    syncMonsterToRoom(roomCode, newMonster);

    handleAddGameEvent({
      id: `evt-spawn-${Date.now()}`,
      message: `⚡ DM spawned hostile entity: ${newMonster.name} at (${newMonster.position.x}, ${newMonster.position.y})`,
      type: 'dm',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const handleToggleFog = () => {
    setFogRevealedAll(prev => !prev);
    handleAddGameEvent({
      id: `evt-fog-${Date.now()}`,
      message: `👁️ DM modified Fog of War visibility.`,
      type: 'dm',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const handleStartEncounter = () => {
    const firstAlive = monsters.find(m => m.isAlive);
    if (!firstAlive) return;

    const newCombat: CombatSession = {
      isActive: true,
      round: 1,
      turnIndex: 0,
      participants: [
        { id: activeChar.id, name: activeChar.name, isPlayer: true, initiative: 18, hp: activeChar.hp, maxHp: activeChar.maxHp, ac: activeChar.ac },
        { id: firstAlive.id, name: firstAlive.name, isPlayer: false, initiative: 14, hp: firstAlive.hp, maxHp: firstAlive.maxHp, ac: firstAlive.ac },
      ],
      targetMonsterId: firstAlive.id,
    };

    setCombat(newCombat);
    syncCombatToRoom(roomCode, newCombat);

    handleAddGameEvent({
      id: `evt-enc-${Date.now()}`,
      message: `⚔️ DM sounded combat alarms! Battle initiated with ${firstAlive.name}.`,
      type: 'combat',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setActiveTab('tabletop');
  };

  const handleBroadcastNarration = (text: string) => {
    const chatMsg: ChatMessage = {
      id: `chat-dm-${Date.now()}`,
      sender: 'Master Aldren',
      role: 'DM',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    handleAddChatMessage(chatMsg);

    handleAddGameEvent({
      id: `evt-dm-${Date.now()}`,
      message: `📜 DM Narration: "${text}"`,
      type: 'dm',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  // If on login screen, render full dedicated gateway
  if (activeTab === 'login') {
    return (
      <LoginScreen
        characters={selectableArchetypes}
        defaultRoomCode={roomCode}
        onEnterGame={handleEnterGame}
        onOpenCharacterCreator={() => setActiveTab('creator')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-[#e0d7c6] font-sans selection:bg-[#c5a059] selection:text-black flex flex-col">
      {/* Top Universal App Navigation Bar */}
      <Header
        currentRole={currentRole}
        activeCharacter={activeChar}
        userProfile={userProfile}
        roomCode={roomCode}
        onSwitchRole={setCurrentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCharacterSheet={() => setShowGlobalSheet(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        connectedCount={characters.length}
      />

      {/* Main View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'landing' && (
          <LandingPage
            onStartDemo={() => setActiveTab('tabletop')}
            onOpenDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            characters={characters}
            activeCharacterId={myCharacterId}
            onSelectCharacter={(id) => {
              setMyCharacterId(id);
              setActiveCharacterId(id);
              setActiveTab('tabletop');
            }}
            campaign={campaign}
            onEnterTabletop={() => setActiveTab('tabletop')}
            onCreateCharacter={() => setActiveTab('creator')}
            onOpenDM={() => {
              setCurrentRole('DM');
              setActiveTab('dm');
            }}
          />
        )}

        {activeTab === 'creator' && (
          <CharacterCreator
            onCharacterCreated={handleCharacterCreated}
            onCancel={() => setActiveTab('tabletop')}
          />
        )}

        {activeTab === 'tabletop' && (
          <VirtualTabletop
            characters={characters}
            myCharacterId={myCharacterId}
            activeCharacterId={activeCharacterId}
            userProfile={userProfile}
            onSelectCharacter={setActiveCharacterId}
            monsters={monsters}
            tiles={tiles}
            quest={quest}
            combat={combat}
            chatMessages={chatMessages}
            gameEvents={gameEvents}
            currentRole={currentRole}
            onUpdateCharacters={handleUpdateCharacters}
            onUpdateMonsters={handleUpdateMonsters}
            onUpdateTiles={handleUpdateTiles}
            onUpdateQuest={setQuest}
            onUpdateCombat={handleUpdateCombat}
            onAddChatMessage={handleAddChatMessage}
            onAddGameEvent={handleAddGameEvent}
          />
        )}

        {activeTab === 'dm' && (
          <DMDashboard
            characters={characters}
            monsters={monsters}
            onSpawnMonster={handleSpawnMonster}
            onToggleFogOfWar={handleToggleFog}
            onStartEncounter={handleStartEncounter}
            onBroadcastNarration={handleBroadcastNarration}
            fogRevealedAll={fogRevealedAll}
          />
        )}
      </main>

      {/* Global Character Sheet Modal */}
      {showGlobalSheet && (
        <CharacterSheetModal
          character={activeChar}
          onClose={() => setShowGlobalSheet(false)}
          onUseItem={(item: Item) => {
            if (item.type === 'potion' && item.healAmount) {
              const newHp = Math.min(activeChar.maxHp, activeChar.hp + item.healAmount);
              const remaining = activeChar.inventory.filter(i => i.id !== item.id);
              handleUpdateCharacters(characters.map(c => c.id === activeChar.id ? { ...c, hp: newHp, inventory: remaining } : c));
            }
          }}
        />
      )}

      {/* Authentication & Guest Login Modal */}
      {showAuthModal && (
        <AuthModal
          currentRole={currentRole}
          onClose={() => setShowAuthModal(false)}
          onRoleSelected={(role) => setCurrentRole(role)}
        />
      )}

      {/* Immersive Tabletop Footer */}
      <footer className="border-t border-[#3c3c44] bg-[#1a1a1d] px-6 py-3 mt-auto shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="font-serif uppercase tracking-wider text-[#c5a059] font-bold">
              Firebase Real-Time Multiplayer Synchronized
            </span>
            <span className="hidden sm:inline text-[#e0d7c6]/50">|</span>
            <span className="hidden sm:inline text-[#e0d7c6]/70">
              Active Hero: <strong>{activeChar.name}</strong> ({activeChar.classType}) • Room: <strong>{roomCode}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-[#e0d7c6]/70">
            <span>HP: <strong className="text-red-400">{activeChar.hp}/{activeChar.maxHp}</strong></span>
            <span>MP: <strong className="text-blue-400">{activeChar.mp}/{activeChar.maxMp}</strong></span>
            <span>Speed: <strong className="text-sky-400">{activeChar.speed || 30}ft</strong></span>
            <span>Gold: <strong className="text-[#c5a059]">{activeChar.gold}</strong></span>
            <span>XP: <strong className="text-emerald-400">{activeChar.xp}</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
