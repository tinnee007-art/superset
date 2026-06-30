import React from 'react';
import { 
  MessageList, 
  ThinkingBubble, 
  MessageRow, 
  AvatarContainer, 
  AvatarRing, 
  AvatarImg,
  ThinkingText,
} from './styles';
import ChatMessageItem from './ChatMessageItem';
import { AIChatMessage } from '../types';

import botAvatar from '../asset/bot-avatar.png';

interface Props {
  messages: AIChatMessage[];
  isTyping: boolean;
  endRef: React.RefObject<HTMLDivElement>;
}

export default function ChatMessageList({
  messages,
  isTyping,
  endRef,
}: Props) {

  /**
   * ✅ RESTORED: Smart parser that handles both objects and raw strings safely
   */
  const parseContent = (content: any) => {
    try {
      if (!content) return null;

      // If it's already an object, return it directly
      if (typeof content === 'object') {
        return content;
      }

      // Try JSON parsing string responses
      return JSON.parse(content);
    } catch {
      return null;
    }
  };

  // 🗓️ WhatsApp-style Date Label Utility
  const getDateLabel = (dateStr?: string): string => {
    if (!dateStr) return 'Today';
    
    try {
      let safeDateStr = dateStr;
      if (safeDateStr.includes('T') && !safeDateStr.endsWith('Z')) {
        safeDateStr += 'Z';
      }
      
      const targetDate = new Date(safeDateStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (targetDate.toDateString() === today.toDateString()) {
        return 'Today';
      }
      if (targetDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }

      return targetDate.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Today';
    }
  };


  return (
    <MessageList style={{ paddingBottom: 12 }}>
      {messages.map((msg, index) => {
        // Calculate the date label for the current message item
        const currentDateLabel = getDateLabel(msg.created_at);
        const prevMsg = index > 0 ? messages[index - 1] : null;

        const prevDateLabel = prevMsg
        ? getDateLabel(prevMsg.created_at)
        : null;

        const showSeparator = currentDateLabel !== prevDateLabel;

        
        // Coerced strict boolean evaluation to protect TypeScript props assignment
        const isContinued = !!(prevMsg && prevMsg.role === msg.role && !showSeparator);
        const parsed = parseContent(msg.content);

        return (
          <React.Fragment key={msg.id ?? `${msg.created_at}-${index}`}>
            {/* 💬 WhatsApp Date Separator Pill Container */}
            {showSeparator && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                margin: '20px 0 10px 0',
                width: '100%'
              }}>
                <div style={{
                  background: 'var(--ant-color-fill-tertiary, #f5f5f5)',
                  border: '1px solid var(--ant-color-border-secondary)',
                  color: 'var(--ant-color-text-secondary, #666)',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '8px',
                  textTransform: 'none',
                  letterSpacing: '0.3px',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
                  opacity: 0.85,
                }}>
                  {currentDateLabel}
                </div>
              </div>
            )}

            {/* Chat Bubble Item Component */}
            <ChatMessageItem
              msg={msg}
              parsedContent={parsed}
              isContinued={isContinued} 
            />
          </React.Fragment>
        );
      })}

      {/* ✅ RESTORED: Premium Radar Ring and Shimmer Gloss Text Animations */}
      {isTyping && (
        <MessageRow role="assistant">
          <AvatarContainer>
            <AvatarRing />
            <AvatarImg 
              src={botAvatar} 
              alt="AI Assistant" 
              isLoading={true} 
            />
          </AvatarContainer>

          <ThinkingBubble>
            <ThinkingText>Thinking...</ThinkingText>
          </ThinkingBubble>
        </MessageRow>
      )}

      <div ref={endRef} />
    </MessageList>
  );
}