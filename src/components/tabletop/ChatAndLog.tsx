import React, { useState } from 'react';
import { ChatMessage, GameEvent } from '../../types/rpg';
import { Send, Scroll, MessageSquare } from 'lucide-react';

interface ChatAndLogProps {
  chatMessages: ChatMessage[];
  gameEvents: GameEvent[];
  onSendMessage: (text: string) => void;
  activePlayerName: string;
  activePlayerUsername?: string;
}

export const ChatAndLog: React.FC<ChatAndLogProps> = ({
  chatMessages,
  gameEvents,
  onSendMessage,
  activePlayerName,
  activePlayerUsername,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'events'>('chat');
  const [inputText, setInputText] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#151518] border border-[#3c3c44] rounded-lg shadow-xl overflow-hidden">
      
      {/* Top Tabs */}
      <div className="flex items-center border-b border-[#3c3c44] bg-[#1a1a1d] text-xs font-serif uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'chat'
              ? 'text-[#c5a059] border-b-2 border-[#c5a059] bg-[#151518] font-bold'
              : 'text-[#e0d7c6]/60 hover:text-[#e0d7c6]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Party Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'events'
              ? 'text-[#c5a059] border-b-2 border-[#c5a059] bg-[#151518] font-bold'
              : 'text-[#e0d7c6]/60 hover:text-[#e0d7c6]'
          }`}
        >
          <Scroll className="w-3.5 h-3.5" />
          <span>Combat Log</span>
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 max-h-60 sm:max-h-80 text-xs">
        {activeTab === 'chat' ? (
          chatMessages.map(msg => {
            const hasUsernameMatch = msg.sender.match(/\(@([^)]+)\)/);
            const userTag = hasUsernameMatch ? hasUsernameMatch[1] : null;
            const cleanSenderName = msg.sender.replace(/\(@[^)]+\)/, '').trim();

            return (
              <div key={msg.id} className="space-y-0.5">
                <div className="flex items-baseline justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span 
                      className="font-serif font-bold uppercase tracking-wider"
                      style={{ color: msg.role === 'DM' ? '#f59e0b' : msg.color || '#c5a059' }}
                    >
                      {cleanSenderName} {msg.role === 'DM' && !cleanSenderName.includes('[DM]') ? '[DM]' : ''}
                    </span>
                    {userTag && (
                      <span className="text-[9px] font-mono font-semibold text-emerald-400 bg-emerald-950/70 px-1.5 py-0.2 rounded border border-emerald-600/40 normal-case">
                        @{userTag}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[#e0d7c6]/40 text-[9px]">{msg.timestamp}</span>
                </div>
                <p className="text-[#e0d7c6]/90 font-sans leading-relaxed break-words bg-[#0c0c0e] p-2 rounded border border-[#25252b]">
                  {msg.text}
                </p>
              </div>
            );
          })
        ) : (
          gameEvents.map(evt => (
            <div 
              key={evt.id} 
              className={`p-2 rounded text-[11px] font-mono border ${
                evt.type === 'combat' 
                  ? 'bg-red-950/20 border-red-900/40 text-red-300'
                  : evt.type === 'quest'
                  ? 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                  : evt.type === 'dice'
                  ? 'bg-purple-950/20 border-purple-900/40 text-purple-300'
                  : 'bg-[#0c0c0e] border-[#3c3c44] text-[#e0d7c6]/80'
              }`}
            >
              <div className="flex items-center justify-between text-[9px] opacity-60 mb-0.5">
                <span className="uppercase tracking-widest">{evt.type}</span>
                <span>{evt.timestamp}</span>
              </div>
              <div>{evt.message}</div>
            </div>
          ))
        )}
      </div>

      {/* Input Field */}
      {activeTab === 'chat' && (
        <form onSubmit={handleSend} className="p-2 border-t border-[#3c3c44] bg-[#1a1a1d] flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`Message party as ${activePlayerName}${activePlayerUsername ? ` (@${activePlayerUsername})` : ''}...`}
            className="flex-1 px-3 py-1.5 text-xs bg-[#0c0c0e] border border-[#3c3c44] rounded text-[#e0d7c6] focus:outline-none focus:border-[#c5a059]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#c5a059] hover:bg-[#d9b876] text-black rounded font-serif font-bold text-xs uppercase cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
