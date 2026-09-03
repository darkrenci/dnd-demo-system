import React, { useState } from 'react';
import { Character, Monster, MapTile, Quest, CombatSession, ChatMessage, GameEvent, Item, UserRole, UserProfile, Campaign } from '../../types/rpg';
import { DUNGEON_THEMES } from '../../game/mapGenerator';
import { GameMap } from './GameMap';
import { CombatPanel } from './CombatPanel';
import { QuestPanel } from './QuestPanel';
import { ChatAndLog } from './ChatAndLog';
import { CharacterSheetModal } from '../character/CharacterSheetModal';
import { NpcDialogueModal } from './NpcDialogueModal';
import { PlayerInteractionModal } from './PlayerInteractionModal';
import { 
  calculateAttackResult, 
  calculateMonsterAttack, 
  executeAuthoritativeRoll, 
  executeD20Roll,
  RollCalculation,
  parseDiceNotation
} from '../../game/engine';
import { Dices, Shield, Sword, Sparkles, RefreshCw, Eye, Footprints, DoorOpen, Users, UserX, RotateCcw, ChevronDown, Compass } from 'lucide-react';

interface VirtualTabletopProps {
  characters: Character[];
  myCharacterId: string;
  activeCharacterId?: string;
  userProfile?: UserProfile | null;
  onSelectCharacter?: (id: string) => void;
  monsters: Monster[];
  tiles: MapTile[];
  quest: Quest;
  combat: CombatSession;
  chatMessages: ChatMessage[];
  gameEvents: GameEvent[];
  currentRole: UserRole;
  campaign?: Campaign;
  onUpdateCharacters: (chars: Character[]) => void;
  onUpdateMonsters: (monsters: Monster[]) => void;
  onUpdateTiles: (tiles: MapTile[]) => void;
  onUpdateQuest: (quest: Quest) => void;
  onUpdateCombat: (combat: CombatSession) => void;
  onAddChatMessage: (msg: ChatMessage) => void;
  onAddGameEvent: (evt: GameEvent) => void;
  onRemoveCharacter?: (id: string) => void;
  onResetRoom?: () => void;
  onResetBoard?: (themeId?: string) => void;
}

export const VirtualTabletop: React.FC<VirtualTabletopProps> = ({
  characters,
  myCharacterId,
  activeCharacterId,
  userProfile,
  onSelectCharacter,
  monsters,
  tiles,
  quest,
  combat,
  chatMessages,
  gameEvents,
  currentRole,
  campaign,
  onUpdateCharacters,
  onUpdateMonsters,
  onUpdateTiles,
  onUpdateQuest,
  onUpdateCombat,
  onAddChatMessage,
  onAddGameEvent,
  onRemoveCharacter,
  onResetRoom,
  onResetBoard,
}) => {
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | null>(monsters[0]?.id || null);
  const [showSheet, setShowSheet] = useState(false);
  const [inspectedCharacterId, setInspectedCharacterId] = useState<string>(myCharacterId);
  const [showDialogue, setShowDialogue] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [interactingCharacter, setInteractingCharacter] = useState<Character | null>(null);

  // Strictly bind control to the user's hero with multi-stage fallback
  const activeChar = characters.find(c => c.id === myCharacterId) 
    || (userProfile?.uid && characters.find(c => c.ownerId === userProfile.uid))
    || (userProfile?.displayName && characters.find(c => c.ownerName?.toLowerCase() === userProfile.displayName.toLowerCase()))
    || characters.find(c => !c.ownerId)
    || characters[0];
  const inspectedChar = characters.find(c => c.id === inspectedCharacterId) || activeChar;
  const selectedMonster = monsters.find(m => m.id === selectedMonsterId) || null;

  // Active player's display username
  const displayUsername = userProfile?.displayName || activeChar.ownerName || 'Adventurer';

  // Single character update helper
  const handleUpdateActiveChar = (updatedChar: Character) => {
    onUpdateCharacters(characters.map(c => c.id === updatedChar.id ? updatedChar : c));
  };

  // Move active character (5ft per grid cell)
  const handleMovePlayer = (dx: number, dy: number) => {
    // Check unconscious status
    if (activeChar.hp <= 0) {
      onAddGameEvent({
        id: `evt-uncon-${Date.now()}`,
        message: `⚠️ ${activeChar.name} is Unconscious and cannot move! Roll a Death Saving Throw.`,
        type: 'combat',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      return;
    }

    // In combat, check movement budget
    if (combat.isActive && activeChar.movementRemaining <= 0) {
      onAddGameEvent({
        id: `evt-move-depleted-${Date.now()}`,
        message: `⛔ Movement budget depleted this turn (${activeChar.speed}ft used). Use Dash or End Turn.`,
        type: 'combat',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      return;
    }

    const newX = activeChar.position.x + dx;
    const newY = activeChar.position.y + dy;

    // Check target tile
    const targetTile = tiles.find(t => t.x === newX && t.y === newY);
    if (!targetTile || targetTile.type === 'wall') {
      return; // Blocked
    }

    // If door, automatically open it
    let currentTiles = tiles;
    if (targetTile.type === 'door') {
      currentTiles = tiles.map(t => t.x === newX && t.y === newY ? { ...t, type: 'floor' as const, revealed: true } : t);
      onUpdateTiles(currentTiles);
      onAddGameEvent({
        id: `evt-door-${Date.now()}`,
        message: `🚪 ${activeChar.name} pushed open a dungeon door, illuminating the corridor ahead.`,
        type: 'explore',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    // Update position and deduct 1 square from movement budget
    const newMovementBudget = combat.isActive ? Math.max(0, activeChar.movementRemaining - 1) : activeChar.movementRemaining;
    const updatedChars = characters.map(c => 
      c.id === activeChar.id ? { 
        ...c, 
        position: { x: newX, y: newY }, 
        movementRemaining: newMovementBudget,
        lastAction: `Moved to (${newX}, ${newY})`,
        lastSeen: Date.now(),
        isOnline: true,
      } : c
    );
    onUpdateCharacters(updatedChars);

    // Reveal fog of war radius 2
    const updatedTiles = currentTiles.map(t => {
      const dist = Math.abs(t.x - newX) + Math.abs(t.y - newY);
      if (dist <= 3 && !t.revealed) {
        return { ...t, revealed: true };
      }
      return t;
    });
    onUpdateTiles(updatedTiles);

    // Check interaction with monster proximity (trigger combat if adjacent)
    const adjacentMonster = monsters.find(m => 
      m.isAlive && Math.abs(m.position.x - newX) <= 1 && Math.abs(m.position.y - newY) <= 1
    );

    if (adjacentMonster && !combat.isActive) {
      setSelectedMonsterId(adjacentMonster.id);
      onUpdateCombat({
        isActive: true,
        round: 1,
        turnIndex: 0,
        participants: [
          { id: activeChar.id, name: activeChar.name, isPlayer: true, initiative: 18, hp: activeChar.hp, maxHp: activeChar.maxHp, ac: activeChar.ac },
          { id: adjacentMonster.id, name: adjacentMonster.name, isPlayer: false, initiative: 12, hp: adjacentMonster.hp, maxHp: adjacentMonster.maxHp, ac: adjacentMonster.ac },
        ],
        targetMonsterId: adjacentMonster.id,
      });

      onAddGameEvent({
        id: `evt-${Date.now()}`,
        message: `⚔️ Initiative rolled! Hostile combat started with ${adjacentMonster.name}.`,
        type: 'combat',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    // Check treasure chest tile
    if (targetTile.type === 'treasure' && !targetTile.isChestOpen) {
      const chestTiles = updatedTiles.map(t => t.x === newX && t.y === newY ? { ...t, isChestOpen: true } : t);
      onUpdateTiles(chestTiles);
      
      // Update quest for Ancient Key
      const updatedObjs = quest.objectives.map(o => o.id === 4 ? { ...o, isCompleted: true } : o);
      onUpdateQuest({ ...quest, objectives: updatedObjs });

      const lootGold = 35;
      const charsWithGold = characters.map(c => c.id === activeChar.id ? { ...c, gold: c.gold + lootGold } : c);
      onUpdateCharacters(charsWithGold);

      onAddGameEvent({
        id: `evt-${Date.now()}`,
        message: `🪙 Found Ancient Crypt Key & +${lootGold} Gold inside heavy iron-bound chest!`,
        type: 'loot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    // Check Elder Rowan NPC at (2,1)
    if (newX === 2 && newY === 1) {
      setShowDialogue(true);
    }
  };

  // Perform D&D Attack with Advantage/Disadvantage
  const handleAttack = (mode: 'normal' | 'advantage' | 'disadvantage') => {
    if (!selectedMonster || isRolling || activeChar.hp <= 0) return;
    setIsRolling(true);

    setTimeout(() => {
      const result = calculateAttackResult(activeChar, selectedMonster, mode);
      setIsRolling(false);

      // Deduct action
      const updatedCharWithAction: Character = {
        ...activeChar,
        actionEconomy: { ...activeChar.actionEconomy, actionUsed: true },
        lastAction: `Attacked ${selectedMonster.name} (${result.isHit ? 'Hit' : 'Miss'})`,
        lastSeen: Date.now(),
        isOnline: true,
      };

      // Apply monster damage
      const updatedMonsters = monsters.map(m => {
        if (m.id === selectedMonster.id) {
          return { ...m, hp: result.newTargetHp, isAlive: !result.isDefeated };
        }
        return m;
      });
      onUpdateMonsters(updatedMonsters);

      onAddGameEvent({
        id: `evt-${Date.now()}`,
        message: result.message,
        type: 'combat',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      // Monster defeated
      if (result.isDefeated) {
        const xpGain = selectedMonster.xpReward;
        const goldGain = selectedMonster.goldReward;

        const updatedChars = characters.map(c => 
          c.id === activeChar.id ? { ...updatedCharWithAction, xp: c.xp + xpGain, gold: c.gold + goldGain } : c
        );
        onUpdateCharacters(updatedChars);

        // Advance quest objectives
        let newObjs = [...quest.objectives];
        if (selectedMonster.type === 'Goblin') {
          newObjs = newObjs.map(o => o.id === 3 ? { ...o, isCompleted: true } : o);
        } else if (selectedMonster.type === 'Dungeon Boss') {
          newObjs = newObjs.map(o => o.id === 5 ? { ...o, isCompleted: true } : o);
        }
        onUpdateQuest({ ...quest, objectives: newObjs });

        onAddGameEvent({
          id: `evt-loot-${Date.now()}`,
          message: `🏆 ${selectedMonster.name} fell! Awarded +${xpGain} XP & +${goldGain} Gold to party.`,
          type: 'loot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        // Close encounter if no other live foes
        const remainingAlive = updatedMonsters.filter(m => m.isAlive);
        if (remainingAlive.length === 0) {
          onUpdateCombat({ ...combat, isActive: false, targetMonsterId: null });
        } else {
          setSelectedMonsterId(remainingAlive[0].id);
        }
        return;
      }

      onUpdateCharacters(characters.map(c => c.id === activeChar.id ? updatedCharWithAction : c));

      // Monster retaliation attack
      setTimeout(() => {
        const counter = calculateMonsterAttack(selectedMonster, updatedCharWithAction);
        const charsWithDamage = characters.map(c => 
          c.id === activeChar.id ? { ...c, hp: counter.newPlayerHp, conditions: counter.isPlayerDown ? [...c.conditions, 'Unconscious'] : c.conditions } : c
        );
        onUpdateCharacters(charsWithDamage);

        onAddGameEvent({
          id: `evt-${Date.now()}`,
          message: counter.message,
          type: 'combat',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }, 500);

    }, 250);
  };

  // Cast D&D Spell
  const handleCastSpell = (spellName: string, manaCost: number, damageDice?: string) => {
    if (!selectedMonster || activeChar.mp < manaCost || isRolling || activeChar.hp <= 0) return;

    let damage = 0;
    if (damageDice) {
      const { count, sides } = parseDiceNotation(damageDice);
      const roll = executeAuthoritativeRoll(sides, count, 0);
      damage = roll.total;
    } else {
      damage = 8;
    }

    const newTargetHp = Math.max(0, selectedMonster.hp - damage);
    const isDefeated = newTargetHp <= 0;

    // Update character MP & action economy
    const updatedChars = characters.map(c => 
      c.id === activeChar.id ? { 
        ...c, 
        mp: Math.max(0, c.mp - manaCost),
        actionEconomy: { ...c.actionEconomy, actionUsed: true },
        lastAction: `Cast ${spellName} for ${damage} dmg`,
        lastSeen: Date.now(),
        isOnline: true,
      } : c
    );
    onUpdateCharacters(updatedChars);

    const updatedMonsters = monsters.map(m => 
      m.id === selectedMonster.id ? { ...m, hp: newTargetHp, isAlive: !isDefeated } : m
    );
    onUpdateMonsters(updatedMonsters);

    onAddGameEvent({
      id: `evt-spell-${Date.now()}`,
      message: `✨ ${activeChar.name} casts ${spellName} on ${selectedMonster.name} for ${damage} magic damage! (${selectedMonster.hp} → ${newTargetHp} HP)`,
      type: 'combat',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    if (isDefeated) {
      const xpGain = selectedMonster.xpReward;
      const goldGain = selectedMonster.goldReward;
      const charsWithLoot = updatedChars.map(c => c.id === activeChar.id ? { ...c, xp: c.xp + xpGain, gold: c.gold + goldGain } : c);
      onUpdateCharacters(charsWithLoot);

      onAddGameEvent({
        id: `evt-loot-${Date.now()}`,
        message: `🏆 ${selectedMonster.name} slain by magic! Awarded +${xpGain} XP & +${goldGain} Gold.`,
        type: 'loot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
  };

  // End turn & reset action economy & movement budget
  const handleEndTurn = () => {
    const nextRound = combat.isActive ? combat.round + 1 : 1;
    const speedSquares = Math.floor(activeChar.speed / 5);

    const updatedChars = characters.map(c => 
      c.id === activeChar.id ? {
        ...c,
        movementRemaining: speedSquares,
        actionEconomy: { actionUsed: false, bonusActionUsed: false, reactionUsed: false },
        conditions: c.conditions.filter(cond => cond !== 'Dodging'),
      } : c
    );
    onUpdateCharacters(updatedChars);

    if (combat.isActive) {
      onUpdateCombat({
        ...combat,
        round: nextRound,
        turnIndex: (combat.turnIndex + 1) % Math.max(1, combat.participants.length),
      });
    }

    onAddGameEvent({
      id: `evt-turn-${Date.now()}`,
      message: `🔄 ${activeChar.name} ended turn. Movement and action economy refreshed.`,
      type: 'combat',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  // Quick d20 roll from header
  const handleQuickRoll = () => {
    const roll = executeD20Roll(activeChar.initiativeModifier, 'normal', `${activeChar.name} d20`);
    onAddGameEvent({
      id: `evt-dice-${Date.now()}`,
      message: `🎲 ${roll.message}`,
      type: 'dice',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  // Use Potion item
  const handleUseItem = (item: Item) => {
    if (item.type === 'potion' && item.healAmount) {
      const newHp = Math.min(activeChar.maxHp, activeChar.hp + item.healAmount);
      const remainingInv = activeChar.inventory.filter(i => i.id !== item.id);
      
      const updatedChars = characters.map(c => 
        c.id === activeChar.id ? { 
          ...c, 
          hp: newHp, 
          inventory: remainingInv,
          lastAction: `Used ${item.name}`,
          lastSeen: Date.now(),
          isOnline: true,
        } : c
      );
      onUpdateCharacters(updatedChars);

      onAddGameEvent({
        id: `evt-pot-${Date.now()}`,
        message: `🧪 ${activeChar.name} drank ${item.name} (+${item.healAmount} HP)`,
        type: 'loot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Party Avatar Roster */}
      <div className="flex flex-wrap items-center justify-between p-3 bg-[#151518] border border-[#3c3c44] rounded-lg shadow-lg gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-serif font-bold text-[#c5a059] tracking-wider">
              Party Adventurers:
            </span>
            {onResetRoom && (
              <button
                onClick={() => {
                  if (window.confirm('Reset party to default archetypes and clear inactive/ghost character tokens?')) {
                    onResetRoom();
                  }
                }}
                title="Reset party and clear ghost tokens from earlier sessions"
                className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#1a1a1d] hover:bg-amber-950/60 text-[#c5a059] border border-[#3c3c44] hover:border-amber-600/60 rounded flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Reset Party</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {characters.map(char => {
              const isMyHero = char.id === myCharacterId || char.id === activeChar.id;
              return (
                <div
                  key={char.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-serif transition-all border ${
                    isMyHero
                      ? 'bg-[#221f18] text-[#c5a059] border-[#c5a059] font-bold shadow-[0_0_12px_rgba(197,160,89,0.35)] ring-1 ring-[#c5a059]'
                      : 'bg-[#1a1a1d] text-[#e0d7c6]/70 border-[#3c3c44]'
                  }`}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full inline-block" 
                    style={{ backgroundColor: char.color }}
                  />
                  <span>{char.name.split(' ')[0]}</span>
                  <span className="text-[10px] font-mono opacity-80">
                    ({char.hp}/{char.maxHp} HP)
                  </span>

                  {isMyHero ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#c5a059] text-black font-black">
                        YOU
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-600/50 px-1.5 py-0.5 rounded">
                        @{displayUsername}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {char.ownerName && (
                        <span 
                          title={`Player: @${char.ownerName} • Activity: ${char.lastAction || 'Exploring'}`}
                          className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-700/40 cursor-default"
                        >
                          @{char.ownerName}
                        </span>
                      )}
                      <button
                        onClick={() => setInteractingCharacter(char)}
                        title={`Interact with ally ${char.name} (@${char.ownerName || 'Companion'})`}
                        className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Interact</span>
                      </button>
                      <button
                        onClick={() => {
                          setInspectedCharacterId(char.id);
                          setShowSheet(true);
                        }}
                        title={`Inspect ${char.name}'s sheet (Read-Only)`}
                        className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#0c0c0e] hover:bg-[#25252b] text-[#e0d7c6]/80 hover:text-[#c5a059] border border-[#3c3c44] cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-2.5 h-2.5" />
                        <span>Inspect</span>
                      </button>
                      {onRemoveCharacter && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Dismiss ${char.name} (@${char.ownerName || 'Companion'}) token from campaign room?`)) {
                              onRemoveCharacter(char.id);
                            }
                          }}
                          title={`Dismiss ghost/inactive token ${char.name} (@${char.ownerName || 'Companion'})`}
                          className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800/40 cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <UserX className="w-2.5 h-2.5 text-red-400" />
                          <span>Dismiss</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Character Sheet Quick Trigger */}
        <button
          onClick={() => {
            setInspectedCharacterId(activeChar.id);
            setShowSheet(true);
          }}
          className="px-3.5 py-1.5 bg-[#1a1a1d] border border-[#3c3c44] hover:border-[#c5a059] text-[#c5a059] rounded text-xs font-serif uppercase tracking-wider cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>My 5e Sheet ({activeChar.name.split(' ')[0]})</span>
        </button>
      </div>

      {/* Main 3-Column Tabletop Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT / CENTER: Virtual Tabletop Grid Canvas (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#151518] border border-[#3c3c44] rounded-lg p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-[#3c3c44] pb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-bold text-base text-[#e0d7c6] uppercase tracking-wider">
                    {campaign?.currentArea || 'The Whispering Catacombs (Floor 1)'}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-600/40 flex items-center gap-1">
                    <span className="text-emerald-500/70 font-semibold">Player:</span>
                    <strong className="font-bold">@{displayUsername}</strong>
                  </span>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-[#c5a059] font-mono mt-0.5">
                  Hero: {activeChar.name} • Coordinates: X:{activeChar.position.x}, Y:{activeChar.position.y} • Speed: {activeChar.speed}ft • AC: {activeChar.ac}
                </p>
              </div>

              <div className="flex items-center gap-2 relative">
                {onResetBoard && (
                  <div className="relative">
                    <button
                      onClick={() => setShowBoardMenu(!showBoardMenu)}
                      className="px-2.5 py-1.5 bg-[#1f1f26] hover:bg-[#2c2c36] text-[#c5a059] border border-[#3c3c44] hover:border-[#c5a059]/70 rounded text-xs font-serif uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                      title="Reset all board tiles, spawn fresh monsters, and create a new dungeon"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Reset Board &amp; Create New</span>
                      <span className="sm:hidden">New Board</span>
                      <ChevronDown className="w-3 h-3 text-[#c5a059]/70" />
                    </button>

                    {showBoardMenu && (
                      <div className="absolute right-0 mt-1.5 w-72 bg-[#151518] border border-[#4a4a55] rounded-lg shadow-2xl p-2 z-50 space-y-1">
                        <div className="px-2 py-1 border-b border-[#2d2d34] text-[11px] font-serif uppercase tracking-wider text-[#e0d7c6] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Compass className="w-3 h-3 text-[#c5a059]" />
                            <span>Select Dungeon Theme</span>
                          </span>
                          <span className="text-[9px] font-mono text-[#c5a059]">16x12 Grid</span>
                        </div>
                        <button
                          onClick={() => {
                            setShowBoardMenu(false);
                            if (window.confirm('Reset all board tiles, spawn fresh monsters, and generate a new random dungeon layout?')) {
                              onResetBoard('random');
                            }
                          }}
                          className="w-full text-left px-2.5 py-2 rounded text-xs hover:bg-[#25252d] text-[#e0d7c6] flex items-center justify-between group cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">🎲</span>
                            <div>
                              <div className="font-bold text-[#c5a059] group-hover:text-amber-300">Random Dungeon</div>
                              <div className="text-[10px] text-stone-400">Rolls a surprise floor layout &amp; encounters</div>
                            </div>
                          </div>
                        </button>
                        {DUNGEON_THEMES.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => {
                              setShowBoardMenu(false);
                              if (window.confirm(`Reset board and generate "${theme.name}"?`)) {
                                onResetBoard(theme.id);
                              }
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded text-xs hover:bg-[#25252d] text-[#e0d7c6] flex items-start gap-2 group cursor-pointer transition-colors"
                          >
                            <span className="text-base mt-0.5">
                              {theme.id === 'catacombs' ? '🏰' : theme.id === 'obsidian' ? '🌋' : theme.id === 'sunken' ? '🐍' : '⛓️'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-[#e0d7c6] group-hover:text-[#c5a059] truncate">{theme.name}</div>
                              <div className="text-[10px] text-stone-400 line-clamp-1">{theme.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleQuickRoll}
                  className="px-3 py-1.5 bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold text-xs uppercase tracking-wider rounded cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Roll d20</span>
                </button>
              </div>
            </div>

            {/* Grid Map Component */}
            <GameMap
              tiles={tiles}
              players={characters}
              activePlayerId={myCharacterId}
              activePlayerUsername={displayUsername}
              monsters={monsters}
              selectedMonsterId={selectedMonsterId}
              onSelectMonster={setSelectedMonsterId}
              onMovePlayer={handleMovePlayer}
              onSelectPlayerToken={(targetChar) => setInteractingCharacter(targetChar)}
              onInteractTile={(t) => {
                if (t.x === 2 && t.y === 1) setShowDialogue(true);
                if (t.type === 'door') {
                  const currentTiles = tiles.map(tile => tile.x === t.x && tile.y === t.y ? { ...tile, type: 'floor' as const, revealed: true } : tile);
                  onUpdateTiles(currentTiles);
                }
              }}
              isDMView={currentRole === 'DM'}
            />
          </div>

          {/* D&D 5e Tabletop Combat Actions & Mechanics */}
          <CombatPanel
            combat={combat}
            activeCharacter={activeChar}
            selectedMonster={selectedMonster}
            onAttack={handleAttack}
            onCastSpell={handleCastSpell}
            onEndTurn={handleEndTurn}
            onUpdateCharacter={handleUpdateActiveChar}
            onLogDice={(msg, type) => {
              onAddGameEvent({
                id: `evt-${Date.now()}`,
                message: msg,
                type: type === 'dice' ? 'dice' : 'combat',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              });
            }}
            isRolling={isRolling}
          />
        </div>

        {/* RIGHT: Quest Tracker & Synchronized Chat/Log (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <QuestPanel 
            quest={quest} 
            onTalkElderRowan={() => setShowDialogue(true)} 
          />

          <ChatAndLog
            chatMessages={chatMessages}
            gameEvents={gameEvents}
            onSendMessage={(text) => {
              onAddChatMessage({
                id: `msg-${Date.now()}`,
                sender: currentRole === 'DM' 
                  ? `Master Aldren [DM] (@${displayUsername})` 
                  : `${activeChar.name} (@${displayUsername})`,
                role: currentRole === 'DM' ? 'DM' : 'PLAYER',
                text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                color: activeChar.color,
              });
            }}
            activePlayerName={currentRole === 'DM' ? 'Master Aldren' : activeChar.name}
            activePlayerUsername={displayUsername}
          />
        </div>

      </div>

      {/* Character Sheet Modal */}
      {showSheet && (
        <CharacterSheetModal
          character={inspectedChar}
          onClose={() => setShowSheet(false)}
          onUseItem={inspectedChar.id === activeChar.id ? handleUseItem : undefined}
          isReadOnly={inspectedChar.id !== activeChar.id && currentRole !== 'DM'}
        />
      )}

      {/* Elder Rowan NPC Dialogue Modal */}
      {showDialogue && (
        <NpcDialogueModal
          onClose={() => setShowDialogue(false)}
          isQuestFinished={quest.objectives[4]?.isCompleted}
          onAcceptReward={() => {
            const updated = quest.objectives.map(o => ({ ...o, isCompleted: true }));
            onUpdateQuest({ ...quest, objectives: updated, isCompleted: true });
            setShowDialogue(false);
          }}
        />
      )}

      {/* Player-to-Player Multiplayer Interaction Modal */}
      {interactingCharacter && (
        <PlayerInteractionModal
          isOpen={!!interactingCharacter}
          onClose={() => setInteractingCharacter(null)}
          myCharacter={activeChar}
          targetCharacter={interactingCharacter}
          allCharacters={characters}
          onUpdateCharacters={onUpdateCharacters}
          onAddGameEvent={onAddGameEvent}
          onInspectSheet={(id) => {
            setInspectedCharacterId(id);
            setShowSheet(true);
          }}
          onPingLocation={(x, y) => {
            onAddGameEvent({
              id: `evt-ping-${Date.now()}`,
              message: `📍 ${displayUsername} marked rally point at (${x}, ${y})!`,
              type: 'movement',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          }}
          onFocusChat={(username) => {
            onAddChatMessage({
              id: `chat-${Date.now()}`,
              sender: displayUsername,
              role: 'PLAYER',
              text: `(Whisper to @${username}) Greetings ally! I've got your back.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          }}
        />
      )}

    </div>
  );
};
