import React from 'react';
import { Quest } from '../../types/rpg';
import { Scroll, CheckCircle2, Circle, Trophy } from 'lucide-react';

interface QuestPanelProps {
  quest: Quest;
  onTalkElderRowan?: () => void;
}

export const QuestPanel: React.FC<QuestPanelProps> = ({
  quest,
  onTalkElderRowan,
}) => {
  const completedCount = quest.objectives.filter(o => o.isCompleted).length;

  return (
    <div className="p-4 bg-[#151518] border border-[#3c3c44] rounded-lg shadow-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3c3c44] pb-2">
        <div className="flex items-center gap-2 text-[#c5a059]">
          <Scroll className="w-4 h-4" />
          <h3 className="font-serif font-bold text-sm uppercase tracking-wider">
            {quest.title}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#c5a059] bg-[#0c0c0e] px-2 py-0.5 rounded border border-[#3c3c44]">
          {completedCount} / {quest.objectives.length} Objectives
        </span>
      </div>

      <p className="text-xs text-[#e0d7c6]/70 leading-relaxed">
        {quest.description}
      </p>

      {/* Objective Checkpoints */}
      <div className="space-y-1.5 pt-1">
        {quest.objectives.map(obj => (
          <div
            key={obj.id}
            className={`p-2 rounded text-xs flex items-center justify-between border ${
              obj.isCompleted
                ? 'bg-[#1a1a1d] border-[#c5a059]/40 text-[#c5a059]'
                : 'bg-[#0c0c0e] border-[#25252b] text-[#e0d7c6]/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {obj.isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80] shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-[#3c3c44] shrink-0" />
              )}
              <span className={obj.isCompleted ? 'font-medium text-[#e0d7c6]' : ''}>
                {obj.title}
              </span>
            </div>
            {obj.id === 1 && onTalkElderRowan && (
              <button
                onClick={onTalkElderRowan}
                className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-[#c5a059]/20 hover:bg-[#c5a059]/40 text-[#c5a059] rounded border border-[#c5a059]/40 cursor-pointer"
              >
                Dialogue
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Quest Reward Summary */}
      <div className="flex items-center justify-between pt-2 border-t border-[#3c3c44] text-[11px] font-mono text-[#c5a059]">
        <span>Reward upon clearance:</span>
        <span>+{quest.xpReward} XP • +{quest.goldReward} Gold</span>
      </div>
    </div>
  );
};
