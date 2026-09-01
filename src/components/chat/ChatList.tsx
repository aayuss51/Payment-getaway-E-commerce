import React from 'react';
import { ChatThread } from '../../types';
import { User, Store, Clock } from 'lucide-react';

interface ChatListProps {
  chats: ChatThread[];
  activeChatId?: string;
  onChatSelect: (chat: ChatThread) => void;
  currentUserType: 'user' | 'vendor';
}

export const ChatList: React.FC<ChatListProps> = ({ 
  chats, 
  activeChatId, 
  onChatSelect,
  currentUserType
}) => {
  return (
    <div className="flex flex-col h-full bg-paper rounded-[2rem] lux-border shadow-xl overflow-hidden">
      <div className="p-6 border-b border-red-200/30 bg-red-50/50">
        <h2 className="text-2xl font-serif italic text-primary ">Conversations</h2>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {chats.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 font-serif italic">No heritage of conversation yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-red-100/50">
            {chats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const isSelf = chat.userId === chat.vendorId;
              const displayTitle = isSelf ? "Message Yourself (You)" : (currentUserType === 'user' ? chat.vendorName : chat.userName);
              
              return (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat)}
                  className={`w-full p-6 flex items-center gap-5 transition-all duration-500 border-l-2 ${
                    isActive 
                      ? 'bg-red-50/50 border-secondary' 
                      : 'border-transparent'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-paper border border-red-200 flex items-center justify-center shrink-0 overflow-hidden lux-shadow">
                    {currentUserType === 'user' ? <Store className="w-7 h-7 text-secondary" /> : <User className="w-7 h-7 text-secondary" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-serif italic text-lg text-primary truncate">{displayTitle}</h4>
                      <span className="text-[9px] font-bold text-gray-400   pt-1">
                        {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-xs truncate leading-tight ${isActive ? 'text-primary font-medium' : 'text-gray-400 font-serif italic'}`}>
                      {chat.lastMessage || 'Beginning of a dialogue'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};



