import { supabase, isSupabaseConfigured } from './supabase';
import { db, ensureFirebaseAuth } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import {
  Character,
  Monster,
  CombatSession,
  MapTile,
  ChatMessage,
  GameEvent,
  UserProfile,
  UserRole,
  Campaign,
} from '../types/rpg';
import { generateNewDungeonBoard, DUNGEON_THEMES, DungeonTheme } from '../game/mapGenerator';

// Local storage key for fallback guest / demo session
const LOCAL_USER_STORAGE_KEY = 'tabletop_rpg_user_profile';
const ROOM_STORAGE_PREFIX = 'tabletop_rpg_room_';

let currentLocalProfile: UserProfile | null = null;
const authListeners: Set<(profile: UserProfile | null) => void> = new Set();

// Active hero controlled by this client instance (protected from remote overwrite)
let activeLocalHero: Character | null = null;

export const setActiveLocalHero = (hero: Character | null) => {
  activeLocalHero = hero;
};

export const getActiveLocalHero = (): Character | null => {
  return activeLocalHero;
};

// Try to restore saved profile from storage
try {
  const saved = localStorage.getItem(LOCAL_USER_STORAGE_KEY);
  if (saved) {
    currentLocalProfile = JSON.parse(saved);
  }
} catch {
  currentLocalProfile = null;
}

const notifyAuthListeners = (profile: UserProfile | null) => {
  currentLocalProfile = profile;
  try {
    if (profile) {
      localStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_USER_STORAGE_KEY);
    }
  } catch {}
  authListeners.forEach((fn) => fn(profile));
};

// --- AUTHENTICATION WITH SUPABASE ---

export const subscribeToAuth = (callback: (profile: UserProfile | null) => void) => {
  authListeners.add(callback);
  callback(currentLocalProfile);

  if (!isSupabaseConfigured || !supabase) {
    return () => {
      authListeners.delete(callback);
    };
  }

  // Subscribe to Supabase Auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = session.user;
      const metadata = user.user_metadata || {};
      const profile: UserProfile = {
        uid: user.id,
        email: user.email || undefined,
        displayName: metadata.displayName || metadata.name || (user.is_anonymous ? 'Guest Adventurer' : 'Adventurer'),
        role: (metadata.role as UserRole) || 'PLAYER',
        isAnonymous: user.is_anonymous || false,
        characterId: metadata.characterId || undefined,
      };
      notifyAuthListeners(profile);
    } else if (event === 'SIGNED_OUT') {
      notifyAuthListeners(null);
    }
  });

  return () => {
    authListeners.delete(callback);
    subscription.unsubscribe();
  };
};

const ACCOUNTS_STORAGE_KEY = 'rpg_registered_accounts_v1';

interface StoredAccount {
  username: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  characterId?: string;
  createdAt: number;
}

const getStoredAccounts = (): Record<string, StoredAccount> => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStoredAccounts = (accounts: Record<string, StoredAccount>) => {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {}
};

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const loginWithUsername = async (
  username: string, 
  pass: string,
  role?: UserRole,
  characterId?: string
): Promise<UserProfile> => {
  const cleanUsername = username.trim();
  if (!cleanUsername) {
    throw new Error('Please enter your username.');
  }
  if (!pass) {
    throw new Error('Please enter your password.');
  }

  const accounts = getStoredAccounts();
  const lowerKey = cleanUsername.toLowerCase();
  let account: StoredAccount | undefined = accounts[lowerKey];

  // If not found in local cache, check Cloud Firestore users collection
  if (!account) {
    try {
      await ensureFirebaseAuth();
      const userDoc = await getDoc(doc(db, 'users', lowerKey));
      if (userDoc.exists()) {
        const cloudData = userDoc.data() as StoredAccount;
        if (cloudData && cloudData.passwordHash && cloudData.salt) {
          account = cloudData;
          accounts[lowerKey] = cloudData;
          saveStoredAccounts(accounts);
        }
      }
    } catch (e) {
      console.warn('[Firestore User Lookup Notice]:', e);
    }
  }

  if (!account) {
    throw new Error(`Adventurer "${cleanUsername}" was not found. Please register this account first.`);
  }

  const computedHash = await hashPassword(pass, account.salt);
  if (computedHash !== account.passwordHash) {
    throw new Error(`Incorrect password for adventurer "${cleanUsername}".`);
  }

  // Update role/character if provided during login
  if (role) account.role = role;
  if (characterId) account.characterId = characterId;
  saveStoredAccounts(accounts);

  // Sync updated profile to Firestore asynchronously
  try {
    setDoc(doc(db, 'users', lowerKey), {
      ...account,
      lastLogin: Date.now(),
    }, { merge: true }).catch(() => {});
  } catch {}

  const profile: UserProfile = {
    uid: 'user_' + encodeURIComponent(lowerKey),
    displayName: account.username,
    role: account.role || 'PLAYER',
    isAnonymous: false,
    characterId: account.characterId,
  };

  notifyAuthListeners(profile);
  return profile;
};

export const registerWithUsername = async (
  username: string, 
  pass: string,
  role: UserRole = 'PLAYER',
  characterId?: string
): Promise<UserProfile> => {
  const cleanUsername = username.trim();
  if (!cleanUsername) {
    throw new Error('Please choose a username.');
  }
  if (cleanUsername.length < 2) {
    throw new Error('Username must be at least 2 characters long.');
  }
  if (!pass || pass.length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  const accounts = getStoredAccounts();
  const lowerKey = cleanUsername.toLowerCase();
  let existing = accounts[lowerKey];

  // Also verify with Cloud Firestore if not found locally
  if (!existing) {
    try {
      await ensureFirebaseAuth();
      const userDoc = await getDoc(doc(db, 'users', lowerKey));
      if (userDoc.exists()) {
        existing = userDoc.data() as StoredAccount;
        accounts[lowerKey] = existing;
        saveStoredAccounts(accounts);
      }
    } catch {}
  }

  if (existing) {
    // If account already exists, check if password matches
    const checkHash = await hashPassword(pass, existing.salt);
    if (checkHash === existing.passwordHash) {
      existing.role = role;
      if (characterId) existing.characterId = characterId;
      saveStoredAccounts(accounts);

      try {
        setDoc(doc(db, 'users', lowerKey), {
          ...existing,
          lastLogin: Date.now(),
        }, { merge: true }).catch(() => {});
      } catch {}

      const profile: UserProfile = {
        uid: 'user_' + encodeURIComponent(lowerKey),
        displayName: existing.username,
        role: existing.role,
        isAnonymous: false,
        characterId: existing.characterId,
      };
      notifyAuthListeners(profile);
      return profile;
    } else {
      throw new Error(`Username "${cleanUsername}" is already registered. Please sign in with the correct password.`);
    }
  }

  // Create new account
  const salt = Math.random().toString(36).substring(2, 12);
  const passwordHash = await hashPassword(pass, salt);

  const newAccount: StoredAccount = {
    username: cleanUsername,
    passwordHash,
    salt,
    role,
    characterId,
    createdAt: Date.now(),
  };

  accounts[lowerKey] = newAccount;
  saveStoredAccounts(accounts);

  // Persist directly to Cloud Firestore users collection
  try {
    await ensureFirebaseAuth();
    setDoc(doc(db, 'users', lowerKey), newAccount, { merge: true }).catch((err) => {
      console.warn('[Firestore User Save Notice]:', err);
    });
  } catch (e) {
    console.warn('[Firestore User Save Warning]:', e);
  }

  const profile: UserProfile = {
    uid: 'user_' + encodeURIComponent(lowerKey),
    displayName: cleanUsername,
    role,
    isAnonymous: false,
    characterId,
  };

  notifyAuthListeners(profile);
  return profile;
};

export const authenticateWithUsername = async (
  username: string,
  pass: string,
  role: UserRole = 'PLAYER',
  characterId?: string
): Promise<UserProfile> => {
  const cleanUsername = username.trim();
  if (!cleanUsername) {
    throw new Error('Please enter a username.');
  }
  if (!pass || pass.length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  const accounts = getStoredAccounts();
  const lowerKey = cleanUsername.toLowerCase();
  const existing = accounts[lowerKey];

  if (existing) {
    return loginWithUsername(cleanUsername, pass, role, characterId);
  } else {
    return registerWithUsername(cleanUsername, pass, role, characterId);
  }
};

export const loginWithEmail = async (emailOrUser: string, pass: string): Promise<void> => {
  const username = emailOrUser.includes('@') ? emailOrUser.split('@')[0] : emailOrUser;
  await authenticateWithUsername(username, pass, 'PLAYER');
};

export const signUpWithEmail = async (
  emailOrUser: string,
  pass: string,
  displayName: string,
  role: UserRole,
  characterId?: string
): Promise<void> => {
  const username = displayName || (emailOrUser.includes('@') ? emailOrUser.split('@')[0] : emailOrUser);
  await registerWithUsername(username, pass, role, characterId);
};

export const loginAsGuest = async (
  displayName = 'Brave Adventurer',
  role: UserRole = 'PLAYER',
  characterId?: string
): Promise<void> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            displayName,
            role,
            characterId: characterId || null,
          },
        },
      });
      if (!error && data.user) {
        notifyAuthListeners({
          uid: data.user.id,
          email: undefined,
          displayName,
          role,
          isAnonymous: true,
          characterId,
        });
        return;
      }
    } catch {
      // Fall through to guest session
    }
  }

  // Fast guest session
  const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
  notifyAuthListeners({
    uid: guestId,
    email: undefined,
    displayName,
    role,
    isAnonymous: true,
    characterId,
  });
};

export const updateUserCharacter = async (uid: string, characterId: string): Promise<void> => {
  if (currentLocalProfile && currentLocalProfile.uid === uid) {
    notifyAuthListeners({
      ...currentLocalProfile,
      characterId,
    });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.updateUser({
        data: { characterId },
      });
    } catch (e) {
      console.warn('Could not update Supabase user character metadata:', e);
    }
  }
};

export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  if (currentLocalProfile && currentLocalProfile.uid === uid) {
    notifyAuthListeners({
      ...currentLocalProfile,
      role,
    });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.updateUser({
        data: { role },
      });
    } catch (e) {
      console.warn('Could not update Supabase user role metadata:', e);
    }
  }
};

export const logoutUser = async (): Promise<void> => {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
  notifyAuthListeners(null);
};

export const getCurrentUserProfile = (): UserProfile | null => {
  return currentLocalProfile;
};

// --- SUPABASE REALTIME MULTIPLAYER CAMPAIGN SYNC ---

type RoomData = {
  campaign: Campaign;
  characters: Character[];
  monsters: Monster[];
  tiles: MapTile[];
  combat: CombatSession;
  messages: ChatMessage[];
  events: GameEvent[];
};

// In-memory cache of room data
const roomCache: Record<string, RoomData> = {};

// Active Supabase channel per room
const activeSupabaseChannels: Record<string, any> = {};

// Local browser BroadcastChannel for cross-tab multi-window synchronization
const localBroadcastChannels: Record<string, BroadcastChannel | null> = {};

// Callback registries for room events
type ListenerMap<T> = Map<string, Set<(data: T) => void>>;
const playerListeners: ListenerMap<Character[]> = new Map();
const monsterListeners: ListenerMap<Monster[]> = new Map();
const combatListeners: ListenerMap<CombatSession> = new Map();
const tileListeners: ListenerMap<MapTile[]> = new Map();
const campaignListeners: ListenerMap<Campaign> = new Map();
const messageListeners: ListenerMap<ChatMessage[]> = new Map();
const eventListeners: ListenerMap<GameEvent[]> = new Map();

const getLocalChannel = (campaignId: string): BroadcastChannel | null => {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!localBroadcastChannels[campaignId]) {
    try {
      const bc = new BroadcastChannel(`tabletop_rpg_${campaignId}`);
      bc.onmessage = (event) => {
        handleIncomingBroadcast(campaignId, event.data?.event, event.data?.payload);
      };
      localBroadcastChannels[campaignId] = bc;
    } catch {
      localBroadcastChannels[campaignId] = null;
    }
  }
  return localBroadcastChannels[campaignId];
};

const getOrCreateSupabaseChannel = (campaignId: string) => {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  if (!activeSupabaseChannels[campaignId]) {
    const channel = supabase.channel(`campaign_room_${campaignId}`, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    channel
      .on('broadcast', { event: 'player_sync' }, ({ payload }: { payload: Character }) => {
        handleIncomingBroadcast(campaignId, 'player_sync', payload);
      })
      .on('broadcast', { event: 'player_remove' }, ({ payload }: { payload: { id: string } }) => {
        handleIncomingBroadcast(campaignId, 'player_remove', payload);
      })
      .on('broadcast', { event: 'room_reset' }, ({ payload }: { payload: { characters: Character[] } }) => {
        handleIncomingBroadcast(campaignId, 'room_reset', payload);
      })
      .on('broadcast', { event: 'board_reset' }, ({ payload }: { payload: any }) => {
        handleIncomingBroadcast(campaignId, 'board_reset', payload);
      })
      .on('broadcast', { event: 'monster_sync' }, ({ payload }: { payload: Monster }) => {
        handleIncomingBroadcast(campaignId, 'monster_sync', payload);
      })
      .on('broadcast', { event: 'combat_sync' }, ({ payload }: { payload: CombatSession }) => {
        handleIncomingBroadcast(campaignId, 'combat_sync', payload);
      })
      .on('broadcast', { event: 'tiles_sync' }, ({ payload }: { payload: MapTile[] }) => {
        handleIncomingBroadcast(campaignId, 'tiles_sync', payload);
      })
      .on('broadcast', { event: 'chat_message' }, ({ payload }: { payload: ChatMessage }) => {
        handleIncomingBroadcast(campaignId, 'chat_message', payload);
      })
      .on('broadcast', { event: 'game_event' }, ({ payload }: { payload: GameEvent }) => {
        handleIncomingBroadcast(campaignId, 'game_event', payload);
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Supabase Realtime] Connected to campaign room: ${campaignId}`);
        }
      });

    activeSupabaseChannels[campaignId] = channel;
  }

  return activeSupabaseChannels[campaignId];
};

const activeFirestoreListeners: Record<string, Unsubscribe> = {};

const handleRemoteRoomUpdate = (campaignId: string, data: Partial<RoomData>) => {
  const currentRoom = roomCache[campaignId];
  if (!currentRoom) return;

  if (data.characters && Array.isArray(data.characters) && data.characters.length > 0) {
    let mergedChars = [...data.characters];

    // CRITICAL: Protect the local player's hero from being dropped by remote snapshots!
    if (activeLocalHero) {
      const exists = mergedChars.some((c) => 
        c.id === activeLocalHero!.id || 
        (c.ownerId && activeLocalHero!.ownerId && c.ownerId === activeLocalHero!.ownerId) ||
        (c.ownerName && activeLocalHero!.ownerName && c.ownerName.toLowerCase() === activeLocalHero!.ownerName.toLowerCase())
      );

      if (!exists) {
        // Local hero wasn't present in remote characters; prepend and re-sync
        mergedChars = [activeLocalHero, ...mergedChars];
        try {
          const roomDocRef = doc(db, 'campaigns', campaignId);
          setDoc(roomDocRef, {
            characters: mergedChars,
            updatedAt: Date.now(),
          }, { merge: true }).catch(() => {});
        } catch {}
      } else {
        // Ensure the local player's active hero ID and credentials take precedence
        mergedChars = mergedChars.map((c) => {
          if (
            c.id === activeLocalHero!.id || 
            (c.ownerId && activeLocalHero!.ownerId && c.ownerId === activeLocalHero!.ownerId) ||
            (c.ownerName && activeLocalHero!.ownerName && c.ownerName.toLowerCase() === activeLocalHero!.ownerName.toLowerCase())
          ) {
            return {
              ...c,
              id: activeLocalHero!.id,
              ownerId: activeLocalHero!.ownerId,
              ownerName: activeLocalHero!.ownerName,
              isOnline: true,
              lastSeen: Date.now(),
            };
          }
          return c;
        });
      }
    }

    currentRoom.characters = mergedChars;
    try {
      localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(currentRoom));
    } catch {}
    playerListeners.get(campaignId)?.forEach((cb) => cb([...currentRoom.characters]));
  }

  if (data.monsters && Array.isArray(data.monsters) && data.monsters.length > 0) {
    currentRoom.monsters = data.monsters;
    monsterListeners.get(campaignId)?.forEach((cb) => cb([...currentRoom.monsters]));
  }

  if (data.combat) {
    currentRoom.combat = data.combat;
    combatListeners.get(campaignId)?.forEach((cb) => cb(data.combat));
  }

  if (data.tiles && Array.isArray(data.tiles) && data.tiles.length > 0) {
    currentRoom.tiles = data.tiles;
    tileListeners.get(campaignId)?.forEach((cb) => cb([...data.tiles]));
  }

  if (data.campaign && currentRoom.campaign) {
    currentRoom.campaign = { ...currentRoom.campaign, ...data.campaign };
    campaignListeners.get(campaignId)?.forEach((cb) => cb({ ...currentRoom.campaign }));
  }

  if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
    currentRoom.messages = data.messages;
    messageListeners.get(campaignId)?.forEach((cb) => cb([...currentRoom.messages]));
  }

  if (data.events && Array.isArray(data.events) && data.events.length > 0) {
    currentRoom.events = data.events;
    eventListeners.get(campaignId)?.forEach((cb) => cb([...currentRoom.events]));
  }
};

const handleIncomingBroadcast = (campaignId: string, eventType: string, payload: any) => {
  if (!payload) return;
  const currentRoom = roomCache[campaignId];

  switch (eventType) {
    case 'player_sync': {
      const char = payload as Character;
      if (currentRoom) {
        const idx = currentRoom.characters.findIndex((c) => 
          c.id === char.id || (c.ownerId && char.ownerId && c.ownerId === char.ownerId)
        );
        if (idx >= 0) {
          currentRoom.characters[idx] = char;
        } else {
          currentRoom.characters.push(char);
        }
        playerListeners.get(campaignId)?.forEach((cb) => cb([...currentRoom.characters]));
      }
      break;
    }
    case 'player_remove': {
      const { id } = payload;
      if (currentRoom) {
        currentRoom.characters = currentRoom.characters.filter((c) => c.id !== id);
        try {
          localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(currentRoom));
        } catch {}
        playerListeners.get(campaignId)?.forEach((cb) => cb([...currentRoom.characters]));
      }
      break;
    }
    case 'room_reset': {
      const { characters } = payload;
      if (currentRoom && Array.isArray(characters)) {
        currentRoom.characters = characters;
        try {
          localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(currentRoom));
        } catch {}
        playerListeners.get(campaignId)?.forEach((cb) => cb([...characters]));
      }
      break;
    }
    case 'board_reset': {
      const { tiles, monsters, combat, characters, areaName, campaign } = payload;
      if (currentRoom) {
        if (tiles) currentRoom.tiles = tiles;
        if (monsters) currentRoom.monsters = monsters;
        if (combat) currentRoom.combat = combat;
        if (campaign) {
          currentRoom.campaign = campaign;
        } else if (areaName && currentRoom.campaign) {
          currentRoom.campaign.currentArea = areaName;
        }
        if (characters && Array.isArray(characters)) {
          let updatedChars = characters;
          if (activeLocalHero) {
            updatedChars = characters.map((c: Character) => {
              if (
                c.id === activeLocalHero!.id || 
                (c.ownerId && activeLocalHero!.ownerId && c.ownerId === activeLocalHero!.ownerId) ||
                (c.ownerName && activeLocalHero!.ownerName && c.ownerName.toLowerCase() === activeLocalHero!.ownerName.toLowerCase())
              ) {
                return {
                  ...c,
                  id: activeLocalHero!.id,
                  ownerId: activeLocalHero!.ownerId,
                  ownerName: activeLocalHero!.ownerName,
                };
              }
              return c;
            });
          }
          currentRoom.characters = updatedChars;
        }
        try {
          localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(currentRoom));
        } catch {}
        if (tiles) tileListeners.get(campaignId)?.forEach((cb) => cb([...tiles]));
        if (monsters) monsterListeners.get(campaignId)?.forEach((cb) => cb([...monsters]));
        if (combat) combatListeners.get(campaignId)?.forEach((cb) => cb(combat));
        if (characters) playerListeners.get(campaignId)?.forEach((cb) => cb([...currentRoom.characters]));
        if (currentRoom.campaign) campaignListeners.get(campaignId)?.forEach((cb) => cb({ ...currentRoom.campaign }));
      }
      break;
    }
    case 'monster_sync': {
      const monster = payload as Monster;
      if (currentRoom) {
        const idx = currentRoom.monsters.findIndex((m) => m.id === monster.id);
        if (idx >= 0) {
          currentRoom.monsters[idx] = monster;
        } else {
          currentRoom.monsters.push(monster);
        }
        monsterListeners.get(campaignId)?.forEach((cb) => cb([...currentRoom.monsters]));
      }
      break;
    }
    case 'combat_sync': {
      const combat = payload as CombatSession;
      if (currentRoom) {
        currentRoom.combat = combat;
        combatListeners.get(campaignId)?.forEach((cb) => cb(combat));
      }
      break;
    }
    case 'tiles_sync': {
      const tiles = payload as MapTile[];
      if (currentRoom) {
        currentRoom.tiles = tiles;
        tileListeners.get(campaignId)?.forEach((cb) => cb(tiles));
      }
      break;
    }
    case 'chat_message': {
      const msg = payload as ChatMessage;
      if (currentRoom) {
        if (!currentRoom.messages.some((m) => m.id === msg.id)) {
          currentRoom.messages.push(msg);
          messageListeners.get(campaignId)?.forEach((cb) => cb([...currentRoom.messages]));
        }
      }
      break;
    }
    case 'game_event': {
      const evt = payload as GameEvent;
      if (currentRoom) {
        if (!currentRoom.events.some((e) => e.id === evt.id)) {
          currentRoom.events.push(evt);
          eventListeners.get(campaignId)?.forEach((cb) => cb([...currentRoom.events]));
        }
      }
      break;
    }
  }
};

const broadcastToTransport = async (campaignId: string, event: string, payload: any) => {
  // 1. Cross-tab local broadcast
  const localBc = getLocalChannel(campaignId);
  if (localBc) {
    try {
      localBc.postMessage({ event, payload });
    } catch {}
  }

  // 2. Supabase Realtime channel broadcast
  const channel = getOrCreateSupabaseChannel(campaignId);
  if (channel) {
    try {
      await channel.send({
        type: 'broadcast',
        event,
        payload,
      });
    } catch (e) {
      console.warn('[Supabase Realtime Broadcast Error]:', e);
    }
  }
};

export const initializeRoomIfNotExists = async (
  campaignId: string,
  initialData: {
    campaign: Campaign;
    characters: Character[];
    monsters: Monster[];
    tiles: MapTile[];
    combat: CombatSession;
  }
): Promise<void> => {
  // Ensure Firebase Auth is ready
  ensureFirebaseAuth().catch(() => {});

  if (!roomCache[campaignId]) {
    // Try to load persisted room from localStorage
    let savedRoom: RoomData | null = null;
    try {
      const raw = localStorage.getItem(ROOM_STORAGE_PREFIX + campaignId);
      if (raw) savedRoom = JSON.parse(raw);
    } catch {}

    roomCache[campaignId] = savedRoom || {
      campaign: initialData.campaign,
      characters: [...initialData.characters],
      monsters: [...initialData.monsters],
      tiles: [...initialData.tiles],
      combat: initialData.combat,
      messages: [],
      events: [],
    };
  }

  // Ensure current active local hero is present in roomCache
  if (activeLocalHero && roomCache[campaignId]) {
    const chars = roomCache[campaignId].characters;
    const exists = chars.some((c) => 
      c.id === activeLocalHero!.id || 
      (c.ownerId && activeLocalHero!.ownerId && c.ownerId === activeLocalHero!.ownerId) ||
      (c.ownerName && activeLocalHero!.ownerName && c.ownerName.toLowerCase() === activeLocalHero!.ownerName.toLowerCase())
    );
    if (!exists) {
      roomCache[campaignId].characters = [activeLocalHero, ...chars];
    }
  }

  // Initialize transports
  getLocalChannel(campaignId);
  getOrCreateSupabaseChannel(campaignId);

  // Firestore persistent real-time listener & hydration
  if (!activeFirestoreListeners[campaignId]) {
    try {
      const roomDocRef = doc(db, 'campaigns', campaignId);

      // 1. Hydrate immediately from Firestore if document already exists
      getDoc(roomDocRef).then((snap) => {
        if (snap.exists()) {
          const remoteData = snap.data() as Partial<RoomData>;
          if (remoteData) {
            handleRemoteRoomUpdate(campaignId, remoteData);
          }
        } else {
          // Room does not exist in Firestore yet; initialize with local room state
          setDoc(roomDocRef, {
            ...roomCache[campaignId],
            updatedAt: Date.now(),
          }, { merge: true }).catch(() => {});
        }
      }).catch((err) => {
        console.warn('[Firestore Initial Fetch Notice]:', err);
      });

      // 2. Real-time onSnapshot listener for instant cross-device updates
      const unsub = onSnapshot(roomDocRef, (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data() as Partial<RoomData>;
          if (remoteData) {
            handleRemoteRoomUpdate(campaignId, remoteData);
          }
        }
      }, (error) => {
        console.warn('[Firestore onSnapshot Notice]:', error);
      });

      activeFirestoreListeners[campaignId] = unsub;
    } catch (e) {
      console.warn('[Firestore setup Notice]:', e);
    }
  }
};

// Real-time listener for players in the campaign room
export const subscribeToRoomPlayers = (
  campaignId: string,
  onPlayers: (players: Character[]) => void
) => {
  if (!playerListeners.has(campaignId)) {
    playerListeners.set(campaignId, new Set());
  }
  playerListeners.get(campaignId)!.add(onPlayers);

  // Send current cached players immediately
  if (roomCache[campaignId]) {
    onPlayers([...roomCache[campaignId].characters]);
  }

  return () => {
    playerListeners.get(campaignId)?.delete(onPlayers);
  };
};

// Real-time listener for monsters
export const subscribeToRoomMonsters = (
  campaignId: string,
  onMonsters: (monsters: Monster[]) => void
) => {
  if (!monsterListeners.has(campaignId)) {
    monsterListeners.set(campaignId, new Set());
  }
  monsterListeners.get(campaignId)!.add(onMonsters);

  if (roomCache[campaignId]) {
    onMonsters([...roomCache[campaignId].monsters]);
  }

  return () => {
    monsterListeners.get(campaignId)?.delete(onMonsters);
  };
};

// Real-time listener for combat session
export const subscribeToRoomCombat = (
  campaignId: string,
  onCombat: (combat: CombatSession) => void
) => {
  if (!combatListeners.has(campaignId)) {
    combatListeners.set(campaignId, new Set());
  }
  combatListeners.get(campaignId)!.add(onCombat);

  if (roomCache[campaignId]) {
    onCombat(roomCache[campaignId].combat);
  }

  return () => {
    combatListeners.get(campaignId)?.delete(onCombat);
  };
};

// Real-time listener for tiles
export const subscribeToRoomTiles = (
  campaignId: string,
  onTiles: (tiles: MapTile[]) => void
) => {
  if (!tileListeners.has(campaignId)) {
    tileListeners.set(campaignId, new Set());
  }
  tileListeners.get(campaignId)!.add(onTiles);

  if (roomCache[campaignId]) {
    onTiles([...roomCache[campaignId].tiles]);
  }

  return () => {
    tileListeners.get(campaignId)?.delete(onTiles);
  };
};

// Real-time listener for chat messages
export const subscribeToRoomMessages = (
  campaignId: string,
  onMessages: (msgs: ChatMessage[]) => void
) => {
  if (!messageListeners.has(campaignId)) {
    messageListeners.set(campaignId, new Set());
  }
  messageListeners.get(campaignId)!.add(onMessages);

  if (roomCache[campaignId]) {
    onMessages([...roomCache[campaignId].messages]);
  }

  return () => {
    messageListeners.get(campaignId)?.delete(onMessages);
  };
};

// Real-time listener for authoritative game events
export const subscribeToRoomEvents = (
  campaignId: string,
  onEvents: (events: GameEvent[]) => void
) => {
  if (!eventListeners.has(campaignId)) {
    eventListeners.set(campaignId, new Set());
  }
  eventListeners.get(campaignId)!.add(onEvents);

  if (roomCache[campaignId]) {
    onEvents([...roomCache[campaignId].events]);
  }

  return () => {
    eventListeners.get(campaignId)?.delete(onEvents);
  };
};

// Real-time listener for campaign info & area updates
export const subscribeToRoomCampaign = (
  campaignId: string,
  onCampaign: (campaign: Campaign) => void
) => {
  if (!campaignListeners.has(campaignId)) {
    campaignListeners.set(campaignId, new Set());
  }
  campaignListeners.get(campaignId)!.add(onCampaign);

  if (roomCache[campaignId]?.campaign) {
    onCampaign({ ...roomCache[campaignId].campaign });
  }

  return () => {
    campaignListeners.get(campaignId)?.delete(onCampaign);
  };
};

// --- SYNC MUTATION METHODS (Online multiplayer updates via Supabase Realtime & Cloud Firestore) ---

const createDefaultRoom = (campaignId: string, chars: Character[] = []): RoomData => ({
  campaign: {
    id: campaignId,
    name: 'The Lost Dungeon',
    dmName: 'Master Aldren',
    hostUid: 'dm-master-aldren',
    roomCode: campaignId,
    maxPlayers: 6,
    playerCount: chars.length || 1,
    status: 'Active',
    currentArea: 'Dungeon Level 1',
  },
  characters: chars,
  monsters: [],
  tiles: [],
  combat: {
    isActive: false,
    round: 1,
    turnIndex: 0,
    participants: [],
    targetMonsterId: null,
  },
  messages: [],
  events: [],
});

export const joinCampaignRoom = async (campaignId: string, hero: Character): Promise<Character[]> => {
  setActiveLocalHero(hero);

  if (!roomCache[campaignId]) {
    roomCache[campaignId] = createDefaultRoom(campaignId, [hero]);
  }

  const currentRoom = roomCache[campaignId];
  const idx = currentRoom.characters.findIndex((c) => 
    c.id === hero.id || 
    (c.ownerId && hero.ownerId && c.ownerId === hero.ownerId) ||
    (c.ownerName && hero.ownerName && c.ownerName.toLowerCase() === hero.ownerName.toLowerCase())
  );

  if (idx >= 0) {
    currentRoom.characters[idx] = { ...currentRoom.characters[idx], ...hero, isOnline: true, lastSeen: Date.now() };
  } else {
    currentRoom.characters = [hero, ...currentRoom.characters];
  }

  try {
    localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(currentRoom));
  } catch {}

  playerListeners.get(campaignId)?.forEach((cb) => cb([...currentRoom.characters]));
  await broadcastToTransport(campaignId, 'player_sync', hero);

  try {
    const roomDocRef = doc(db, 'campaigns', campaignId);
    await setDoc(roomDocRef, {
      characters: currentRoom.characters,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore joinCampaignRoom notice]:', err);
  }

  return [...currentRoom.characters];
};

export const removeCharacterFromRoom = async (campaignId: string, characterId: string): Promise<Character[]> => {
  if (!roomCache[campaignId]) return [];
  const currentRoom = roomCache[campaignId];
  currentRoom.characters = currentRoom.characters.filter((c) => c.id !== characterId);

  try {
    localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(currentRoom));
  } catch {}

  await broadcastToTransport(campaignId, 'player_remove', { id: characterId });
  playerListeners.get(campaignId)?.forEach((cb) => cb([...currentRoom.characters]));

  try {
    const roomDocRef = doc(db, 'campaigns', campaignId);
    await setDoc(roomDocRef, {
      characters: currentRoom.characters,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore removeCharacter notice]:', err);
  }

  return [...currentRoom.characters];
};

export const resetRoomToDefaults = async (
  campaignId: string,
  defaultArchetypes: Character[],
  myHero?: Character
): Promise<Character[]> => {
  if (!roomCache[campaignId]) {
    roomCache[campaignId] = createDefaultRoom(campaignId);
  }
  const currentRoom = roomCache[campaignId];

  const resetList = myHero
    ? [myHero, ...defaultArchetypes.filter((c) => c.id !== myHero.id && c.name.toLowerCase() !== myHero.name.toLowerCase())]
    : [...defaultArchetypes];

  currentRoom.characters = resetList;

  try {
    localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(currentRoom));
  } catch {}

  playerListeners.get(campaignId)?.forEach((cb) => cb([...currentRoom.characters]));
  await broadcastToTransport(campaignId, 'room_reset', { characters: resetList });

  try {
    const roomDocRef = doc(db, 'campaigns', campaignId);
    await setDoc(roomDocRef, {
      characters: resetList,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore resetRoom notice]:', err);
  }

  return resetList;
};

export const resetBoardAndCreateNew = async (
  campaignId: string,
  themeIdOrRandom?: string,
  currentCharacters?: Character[]
): Promise<{
  tiles: MapTile[];
  monsters: Monster[];
  characters: Character[];
  combat: CombatSession;
  areaName: string;
}> => {
  if (!roomCache[campaignId]) {
    roomCache[campaignId] = createDefaultRoom(campaignId);
  }
  const currentRoom = roomCache[campaignId];

  // Prioritize active party characters currently in the room
  const partyToUse = (currentCharacters && currentCharacters.length > 0)
    ? currentCharacters
    : currentRoom.characters;

  const generated = generateNewDungeonBoard(themeIdOrRandom, partyToUse);

  currentRoom.tiles = generated.tiles;
  currentRoom.monsters = generated.monsters;
  currentRoom.combat = generated.combat;
  currentRoom.characters = generated.characters;
  if (currentRoom.campaign) {
    currentRoom.campaign = {
      ...currentRoom.campaign,
      currentArea: generated.areaName,
    };
  }

  try {
    localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(currentRoom));
  } catch {}

  // Broadcast to all connected clients & tabs
  await broadcastToTransport(campaignId, 'board_reset', {
    tiles: generated.tiles,
    monsters: generated.monsters,
    combat: generated.combat,
    characters: generated.characters,
    areaName: generated.areaName,
    campaign: currentRoom.campaign,
  });

  // Trigger local listeners
  tileListeners.get(campaignId)?.forEach((cb) => cb([...generated.tiles]));
  monsterListeners.get(campaignId)?.forEach((cb) => cb([...generated.monsters]));
  combatListeners.get(campaignId)?.forEach((cb) => cb(generated.combat));
  playerListeners.get(campaignId)?.forEach((cb) => cb([...generated.characters]));
  if (currentRoom.campaign) {
    campaignListeners.get(campaignId)?.forEach((cb) => cb({ ...currentRoom.campaign }));
  }

  // Persist to Cloud Firestore
  try {
    const roomDocRef = doc(db, 'campaigns', campaignId);
    await setDoc(roomDocRef, {
      tiles: generated.tiles,
      monsters: generated.monsters,
      combat: generated.combat,
      characters: generated.characters,
      campaign: currentRoom.campaign,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore resetBoard notice]:', err);
  }

  return {
    tiles: generated.tiles,
    monsters: generated.monsters,
    characters: generated.characters,
    combat: generated.combat,
    areaName: generated.areaName,
  };
};

export const syncPlayerToRoom = async (campaignId: string, character: Character): Promise<void> => {
  if (!roomCache[campaignId]) {
    roomCache[campaignId] = createDefaultRoom(campaignId, [character]);
  }
  const currentRoom = roomCache[campaignId];
  const idx = currentRoom.characters.findIndex((c) => 
    c.id === character.id || 
    (c.ownerId && character.ownerId && c.ownerId === character.ownerId) ||
    (c.ownerName && character.ownerName && c.ownerName.toLowerCase() === character.ownerName.toLowerCase())
  );

  if (idx >= 0) {
    currentRoom.characters[idx] = character;
  } else {
    currentRoom.characters.push(character);
  }

  try {
    localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(currentRoom));
  } catch {}

  // Broadcast to local tabs and realtime transports
  await broadcastToTransport(campaignId, 'player_sync', character);

  // Sync to Cloud Firestore
  try {
    const roomDocRef = doc(db, 'campaigns', campaignId);
    await setDoc(roomDocRef, {
      characters: currentRoom.characters,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore syncPlayerToRoom notice]:', err);
  }
};

export const syncRoomCharacters = async (campaignId: string, characters: Character[]): Promise<void> => {
  if (!roomCache[campaignId]) {
    roomCache[campaignId] = createDefaultRoom(campaignId, [...characters]);
  }
  const currentRoom = roomCache[campaignId];
  currentRoom.characters = [...characters];

  try {
    localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(currentRoom));
  } catch {}

  characters.forEach(char => {
    broadcastToTransport(campaignId, 'player_sync', char);
  });

  try {
    const roomDocRef = doc(db, 'campaigns', campaignId);
    await setDoc(roomDocRef, {
      characters: currentRoom.characters,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore syncRoomCharacters notice]:', err);
  }
};

export const syncMonsterToRoom = async (campaignId: string, monster: Monster): Promise<void> => {
  if (!roomCache[campaignId]) return;
  const currentRoom = roomCache[campaignId];
  const idx = currentRoom.monsters.findIndex((m) => m.id === monster.id);
  if (idx >= 0) {
    currentRoom.monsters[idx] = monster;
  } else {
    currentRoom.monsters.push(monster);
  }

  try {
    localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(currentRoom));
  } catch {}

  await broadcastToTransport(campaignId, 'monster_sync', monster);

  try {
    const roomDocRef = doc(db, 'campaigns', campaignId);
    await setDoc(roomDocRef, {
      monsters: currentRoom.monsters,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {}
};

export const syncCombatToRoom = async (campaignId: string, combat: CombatSession): Promise<void> => {
  if (!roomCache[campaignId]) return;
  roomCache[campaignId].combat = combat;

  try {
    localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(roomCache[campaignId]));
  } catch {}

  await broadcastToTransport(campaignId, 'combat_sync', combat);

  try {
    const roomDocRef = doc(db, 'campaigns', campaignId);
    await setDoc(roomDocRef, {
      combat: roomCache[campaignId].combat,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {}
};

export const syncTilesToRoom = async (campaignId: string, tiles: MapTile[]): Promise<void> => {
  if (!roomCache[campaignId]) return;
  roomCache[campaignId].tiles = tiles;

  try {
    localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(roomCache[campaignId]));
  } catch {}

  await broadcastToTransport(campaignId, 'tiles_sync', tiles);

  try {
    const roomDocRef = doc(db, 'campaigns', campaignId);
    await setDoc(roomDocRef, {
      tiles: roomCache[campaignId].tiles,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {}
};

export const broadcastRoomMessage = async (campaignId: string, message: ChatMessage): Promise<void> => {
  if (!roomCache[campaignId]) return;
  if (!roomCache[campaignId].messages.some((m) => m.id === message.id)) {
    roomCache[campaignId].messages.push(message);
  }

  try {
    localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(roomCache[campaignId]));
  } catch {}

  await broadcastToTransport(campaignId, 'chat_message', message);

  try {
    const roomDocRef = doc(db, 'campaigns', campaignId);
    await setDoc(roomDocRef, {
      messages: roomCache[campaignId].messages.slice(-50),
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {}
};

export const broadcastRoomEvent = async (campaignId: string, event: GameEvent): Promise<void> => {
  if (!roomCache[campaignId]) return;
  if (!roomCache[campaignId].events.some((e) => e.id === event.id)) {
    roomCache[campaignId].events.push(event);
  }

  try {
    localStorage.setItem(ROOM_STORAGE_PREFIX + campaignId, JSON.stringify(roomCache[campaignId]));
  } catch {}

  await broadcastToTransport(campaignId, 'game_event', event);

  try {
    const roomDocRef = doc(db, 'campaigns', campaignId);
    await setDoc(roomDocRef, {
      events: roomCache[campaignId].events.slice(-50),
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {}
};
