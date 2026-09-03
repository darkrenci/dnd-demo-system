import React from 'react';
import { X, Sparkles, MessageCircle } from 'lucide-react';

interface NpcDialogueModalProps {
  onClose: () => void;
  onAcceptReward?: () => void;
  isQuestFinished: boolean;
}

export const NpcDialogueModal: React.FC<NpcDialogueModalProps> = ({
  onClose,
  onAcceptReward,
  isQuestFinished,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#151518] border border-[#3c3c44] rounded-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-[#1a1a1d] border-b border-[#3c3c44] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-950 border border-amber-500 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              🧙‍♂️
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#c5a059]">
                Elder Rowan
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-[#e0d7c6]/60">
                Village Elder of Oakhaven
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#e0d7c6]/60 hover:text-[#e0d7c6] p-1.5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Narrative Box */}
        <div className="p-5 space-y-4 text-xs font-sans text-[#e0d7c6]/90 leading-relaxed bg-[#0c0c0e]">
          {!isQuestFinished ? (
            <>
              <p className="italic text-[#c5a059]">
                "Greetings, traveler. I am glad you received my summons in Oakhaven."
              </p>
              <p>
                "Centuries ago, the Clocktower kept vigil over our valleys. But malice has seeped into the catacombs beneath. Goblin sentries have encroached upon our orchards, and late at night, the unholy wailing of the Grave Revenant keeps the villagers in terror."
              </p>
              <p className="bg-[#1a1a1d] p-3 rounded border border-[#3c3c44] text-amber-200/90 font-mono text-[11px]">
                "Descend into the Whispering Halls. Slay the sentry, search the alcoves for the Crypt Key, and extinguish the Revenant once and for all. Oakhaven will reward your valor handsomely."
              </p>
            </>
          ) : (
            <>
              <p className="italic text-[#c5a059]">
                "By the light of the stars! You have returned from the depths alive!"
              </p>
              <p>
                "The cursed chill has lifted from the soil, and the bells of the tower chime peace once more. Here is the bounty promised by Oakhaven."
              </p>
              <div className="bg-[#1a1a1d] p-3 rounded border border-[#c5a059] text-[#c5a059] font-mono text-center text-xs">
                ⭐ Quest Completed: +500 XP &amp; +200 Gold Bestowed!
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1a1a1d] border-t border-[#3c3c44] flex justify-end gap-3">
          {isQuestFinished && onAcceptReward && (
            <button
              onClick={onAcceptReward}
              className="px-4 py-2 bg-[#c5a059] hover:bg-[#d9b876] text-black font-serif font-bold text-xs uppercase tracking-wider rounded cursor-pointer"
            >
              Claim Rewards
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#25252b] hover:bg-[#32323a] text-[#e0d7c6] font-serif text-xs uppercase tracking-wider rounded cursor-pointer"
          >
            Leave Dialogue
          </button>
        </div>

      </div>
    </div>
  );
};
