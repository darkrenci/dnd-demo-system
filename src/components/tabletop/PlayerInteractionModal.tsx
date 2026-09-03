import React, { useState } from 'react';
import { Character, GameEvent, Item } from '../../types/rpg';
import { 
  Heart, 
  Gift, 
  Shield, 
  Sparkles, 
  MessageSquare, 
  Eye, 
  MapPin, 
  X, 
  Hand,
  CheckCircle2
} from 'lucide-react';

interface PlayerInteractionModalProps {
  myCharacter: Character;
  targetCharacter: Character;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCharacters: (characters: Character[]) => void;
  onAddGameEvent: (event: GameEvent) => void;
  onInspectSheet: (characterId: string) => void;
  onPingLocation: (x: number, y: number) => void;
  onFocusChat: (username: string) => void;
  allCharacters: Character[];
}

export const PlayerInteractionModal: React.FC<PlayerInteractionModalProps> = ({
  myCharacter,
  targetCharacter,
  isOpen,
  onClose,
  onUpdateCharacters,
  onAddGameEvent,
  onInspectSheet,
  onPingLocation,
  onFocusChat,
  allCharacters,
}) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // 1. Cast Cure Wounds / Heal
  const handleHealAlly = () => {
    const healAmount = 8;
    const newHp = Math.min(targetCharacter.maxHp, targetCharacter.hp + healAmount);
    
    // Deduct spell slot if available or mana
    let updatedMyChar = { ...myCharacter };
    if (updatedMyChar.spellSlots?.level1 && updatedMyChar.spellSlots.level1.current > 0) {
      updatedMyChar.spellSlots.level1.current -= 1;
    } else if (updatedMyChar.mp >= 10) {
      updatedMyChar.mp = Math.max(0, updatedMyChar.mp - 10);
    }
    updatedMyChar.lastAction = `Healed @${targetCharacter.ownerName || targetCharacter.name} for +${healAmount} HP`;

    const updatedTarget: Character = {
      ...targetCharacter,
      hp: newHp,
      lastAction: `Healed by @${myCharacter.ownerName || myCharacter.name} (+${healAmount} HP)`,
    };

    const updatedList = allCharacters.map(c => {
      if (c.id === myCharacter.id) return updatedMyChar;
      if (c.id === targetCharacter.id) return updatedTarget;
      return c;
    });

    onUpdateCharacters(updatedList);
    onAddGameEvent({
      id: `evt-heal-${Date.now()}`,
      message: `✨ @${myCharacter.ownerName || myCharacter.name} cast Cure Wounds on @${targetCharacter.ownerName || targetCharacter.name} restoring +${healAmount} HP! (${newHp}/${targetCharacter.maxHp} HP)`,
      type: 'spell',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    showToast(`Restored +${healAmount} HP to @${targetCharacter.ownerName || targetCharacter.name}!`);
  };

  // 2. Gift Potion
  const handleGiftPotion = () => {
    const potionIndex = myCharacter.inventory.findIndex(i => i.type === 'potion');
    if (potionIndex === -1) {
      showToast('You do not have any potions in your inventory to give.');
      return;
    }

    const potionItem = myCharacter.inventory[potionIndex];
    const newMyInv = [...myCharacter.inventory];
    newMyInv.splice(potionIndex, 1);

    const newTargetInv = [...targetCharacter.inventory, potionItem];

    const updatedMyChar: Character = {
      ...myCharacter,
      inventory: newMyInv,
      lastAction: `Gifted ${potionItem.name} to @${targetCharacter.ownerName || targetCharacter.name}`,
    };

    const updatedTarget: Character = {
      ...targetCharacter,
      inventory: newTargetInv,
      lastAction: `Received ${potionItem.name} from @${myCharacter.ownerName || myCharacter.name}`,
    };

    const updatedList = allCharacters.map(c => {
      if (c.id === myCharacter.id) return updatedMyChar;
      if (c.id === targetCharacter.id) return updatedTarget;
      return c;
    });

    onUpdateCharacters(updatedList);
    onAddGameEvent({
      id: `evt-gift-${Date.now()}`,
      message: `🎁 @${myCharacter.ownerName || myCharacter.name} handed ${potionItem.name} to @${targetCharacter.ownerName || targetCharacter.name}.`,
      type: 'loot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    showToast(`Transferred ${potionItem.name} to @${targetCharacter.ownerName || targetCharacter.name}'s bag!`);
  };

  // 3. Tactical Help Action (Advantage)
  const handleAssistAlly = () => {
    const updatedTarget: Character = {
      ...targetCharacter,
      conditions: Array.from(new Set([...targetCharacter.conditions, 'Blessed (Advantage)'])),
      lastAction: `Assisted by @${myCharacter.ownerName || myCharacter.name}`,
    };

    const updatedMyChar: Character = {
      ...myCharacter,
      lastAction: `Assisting @${targetCharacter.ownerName || targetCharacter.name}`,
    };

    const updatedList = allCharacters.map(c => {
      if (c.id === myCharacter.id) return updatedMyChar;
      if (c.id === targetCharacter.id) return updatedTarget;
      return c;
    });

    onUpdateCharacters(updatedList);
    onAddGameEvent({
      id: `evt-assist-${Date.now()}`,
      message: `🛡️ @${myCharacter.ownerName || myCharacter.name} used the Help Action to assist @${targetCharacter.ownerName || targetCharacter.name}, granting Advantage on their next roll!`,
      type: 'combat',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    showToast(`Granted tactical Advantage to @${targetCharacter.ownerName || targetCharacter.name}!`);
  };

  // 4. Heroic High-Five / Cheer
  const handleHighFive = () => {
    onAddGameEvent({
      id: `evt-cheer-${Date.now()}`,
      message: `🙌 @${myCharacter.ownerName || myCharacter.name} and @${targetCharacter.ownerName || targetCharacter.name} exchanged a resounding heroic high-five! Morale is soaring!`,
      type: 'rest',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    showToast(`Exchanged a heroic high-five with @${targetCharacter.ownerName || targetCharacter.name}! 🙌`);
  };

  // 5. Ping Location
  const handlePing = () => {
    onPingLocation(targetCharacter.position.x, targetCharacter.position.y);
    onAddGameEvent({
      id: `evt-ping-${Date.now()}`,
      message: `📍 @${myCharacter.ownerName || myCharacter.name} signaled a rally beacon on @${targetCharacter.ownerName || targetCharacter.name}'s position (${targetCharacter.position.x}, ${targetCharacter.position.y})!`,
      type: 'movement',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    showToast(`Rally beacon marked at (${targetCharacter.position.x}, ${targetCharacter.position.y})!`);
  };

  const hasPotion = myCharacter.inventory.some(i => i.type === 'potion');
  const distance = Math.max(
    Math.abs(myCharacter.position.x - targetCharacter.position.x),
    Math.abs(myCharacter.position.y - targetCharacter.position.y)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#151518] border border-[#3c3c44] rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#25252b] bg-[#1a1a1d]">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-serif font-bold text-black border-2 border-[#c5a059]"
              style={{ backgroundColor: targetCharacter.color }}
            >
              {targetCharacter.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-[#e0d7c6]">
                  {targetCharacter.name}
                </h3>
                {targetCharacter.ownerName && (
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 rounded">
                    @{targetCharacter.ownerName}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-[#e0d7c6]/60">
                Level {targetCharacter.level} {targetCharacter.race} {targetCharacter.classType} • Grid ({targetCharacter.position.x}, {targetCharacter.position.y})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#e0d7c6]/60 hover:text-[#e0d7c6] hover:bg-[#25252b] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Status & Activity Bar */}
        <div className="p-4 bg-[#111113] border-b border-[#25252b] space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-semibold">Active Player</span>
            </div>
            <div className="text-[#e0d7c6]/70">
              Distance: <span className="text-[#c5a059] font-bold">{distance * 5} ft</span> ({distance} tiles)
            </div>
          </div>

          {/* HP Bar */}
          <div>
            <div className="flex justify-between text-[11px] font-mono mb-1 text-[#e0d7c6]/80">
              <span>Hit Points (HP)</span>
              <span className="font-bold text-emerald-400">{targetCharacter.hp} / {targetCharacter.maxHp}</span>
            </div>
            <div className="w-full h-2 bg-[#25252b] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
                style={{ width: `${Math.max(0, (targetCharacter.hp / targetCharacter.maxHp) * 100)}%` }}
              />
            </div>
          </div>

          {/* Current Activity */}
          <div className="text-xs bg-[#1a1a1d] border border-[#2c2c34] p-2.5 rounded text-[#e0d7c6]/90 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
            <div>
              <span className="font-mono text-[10px] text-[#c5a059] uppercase block font-bold">Current Activity:</span>
              <span className="font-mono text-xs">{targetCharacter.lastAction || 'Exploring the dungeon catacombs'}</span>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {successMessage && (
          <div className="m-3 p-2.5 bg-emerald-950/90 border border-emerald-500/60 rounded-lg text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Cooperative Action Buttons */}
        <div className="p-4 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#c5a059] font-bold block mb-2">
            Party Interactions:
          </span>

          <div className="grid grid-cols-2 gap-2">
            {/* Cast Cure Wounds */}
            <button
              onClick={handleHealAlly}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-[#1a1a1d] border border-[#3c3c44] hover:border-emerald-500 hover:bg-emerald-950/30 text-xs font-serif text-[#e0d7c6] hover:text-emerald-300 transition-all cursor-pointer text-left"
            >
              <Heart className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold">Cure Wounds</div>
                <div className="text-[10px] text-emerald-400/80 font-mono">+8 HP restoration</div>
              </div>
            </button>

            {/* Gift Potion */}
            <button
              onClick={handleGiftPotion}
              disabled={!hasPotion}
              className={`flex items-center gap-2 p-2.5 rounded-lg bg-[#1a1a1d] border text-xs font-serif text-left transition-all ${
                hasPotion 
                  ? 'border-[#3c3c44] hover:border-amber-500 hover:bg-amber-950/30 text-[#e0d7c6] hover:text-amber-300 cursor-pointer'
                  : 'border-[#25252b] text-[#e0d7c6]/40 cursor-not-allowed opacity-50'
              }`}
            >
              <Gift className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold">Give Potion</div>
                <div className="text-[10px] font-mono">{hasPotion ? 'From inventory' : 'No potions'}</div>
              </div>
            </button>

            {/* Help / Assist */}
            <button
              onClick={handleAssistAlly}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-[#1a1a1d] border border-[#3c3c44] hover:border-sky-500 hover:bg-sky-950/30 text-xs font-serif text-[#e0d7c6] hover:text-sky-300 transition-all cursor-pointer text-left"
            >
              <Shield className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <div className="font-bold">Assist / Help</div>
                <div className="text-[10px] text-sky-400/80 font-mono">Grant Advantage</div>
              </div>
            </button>

            {/* High Five */}
            <button
              onClick={handleHighFive}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-[#1a1a1d] border border-[#3c3c44] hover:border-[#c5a059] hover:bg-[#221f18] text-xs font-serif text-[#e0d7c6] hover:text-[#c5a059] transition-all cursor-pointer text-left"
            >
              <Hand className="w-4 h-4 text-[#c5a059] shrink-0" />
              <div>
                <div className="font-bold">Heroic Cheer</div>
                <div className="text-[10px] text-[#c5a059]/80 font-mono">High-five morale</div>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            {/* Ping on Map */}
            <button
              onClick={handlePing}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#1a1a1d] border border-[#3c3c44] hover:border-[#c5a059] text-xs text-[#e0d7c6] hover:text-[#c5a059] transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[10px] font-mono">Ping Map</span>
            </button>

            {/* Whisper Chat */}
            <button
              onClick={() => {
                onFocusChat(targetCharacter.ownerName || targetCharacter.name);
                onClose();
              }}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#1a1a1d] border border-[#3c3c44] hover:border-emerald-500 text-xs text-[#e0d7c6] hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[10px] font-mono">Whisper</span>
            </button>

            {/* Inspect Sheet */}
            <button
              onClick={() => {
                onInspectSheet(targetCharacter.id);
                onClose();
              }}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#1a1a1d] border border-[#3c3c44] hover:border-[#c5a059] text-xs text-[#e0d7c6] hover:text-[#c5a059] transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#c5a059] mb-1" />
              <span className="text-[10px] font-mono">5e Sheet</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
