import { useState } from 'react';
import { AIChatMessage } from '../types';
import { 
  MessageRow, 
  MessageBubble, 
  MessageTimestamp, 
  AvatarContainer, 
  AvatarImg,
  SqlLinkText
} from './styles';
import SqlPreviewModal from './SqlPreviewModal';

// ✅ IMPORT NATIVE PNG ASSET
import botAvatar from '../asset/bot-avatar.png';

interface Props {
  msg: AIChatMessage;
  parsedContent?: any;
  isContinued?: boolean;
}

export default function ChatMessageItem({ msg, parsedContent, isContinued }: Props) {
  const [sqlModal, setSqlModal] = useState<{
    visible: boolean;
    sql: string;
  }>({
    visible: false,
    sql: '',
  });

  const openSql = (sql: string) => {
    setSqlModal({ visible: true, sql });
  };

  const closeSql = () => {
    setSqlModal({ visible: false, sql: '' });
  };

  // Safe local date formatting utility
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      let safeDateStr = dateStr;
      if (safeDateStr.includes('T') && !safeDateStr.endsWith('Z')) {
        safeDateStr += 'Z';
      }
      const d = new Date(safeDateStr);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const timeStr = formatTime(msg.created_at);

  /**
   * Internal Content Renderer Core
   */
  const renderBubbles = () => {

    const renderAttachments = () => {
        if (!Array.isArray(msg.attachments) || msg.attachments.length === 0) {
            return null;
        }

        return (
            <div style={{
                marginBottom: 8,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
            }}>
            {msg.attachments.map((f: any, i: number) => (
                <div
                key={f.id || i}
                style={{
                    fontSize: 12,
                    padding: '6px 10px', 
                    borderRadius: 8,
                    background: 'var(--ant-color-fill-secondary)',
                    border: '1px solid var(--ant-color-border)',
                }}
                >
                <span style={{ marginRight: 4 }}>
                    {f.t === 'pdf' ? '📄' : f.t === 'image' ? '🖼️' : '📁'}
                </span>
                <span title={f.name || f.n}>
                        {f.name || f.n || 'file'}
                    </span>
                </div>
            ))}
            </div>
        );
    };
    
    // ✅ NEW: Smart text formatter to automatically bold the editor name
    const formatText = (text?: string) => {
      if (!text) return null;
      
      // If the backend is sending the editor name wrapped in asterisks (e.g., *AI Generated Query 15*)
      if (text.includes('*')) {
        const parts = text.split(/\*(.*?)\*/g);
        return parts.map((part, index) => 
          index % 2 === 1 ? <strong key={index}>{part}</strong> : part
        );
      }
      
      // Fallback: If it's pure plain text, split at "sql editor:" and bold whatever comes after it
      if (text.toLowerCase().includes('sql editor:')) {
        // Find the exact casing used in the string
        const splitIndex = text.toLowerCase().indexOf('sql editor:') + 11; 
        const before = text.substring(0, splitIndex);
        const after = text.substring(splitIndex);
        
        return (
          <>
            {before}<strong>{after}</strong>
          </>
        );
      }
      
      return text;
    };

    // CASE 1: Standard raw text fallback
    if (!parsedContent || !parsedContent.data) {
        return (
            <MessageBubble role={msg.role} style={{ maxWidth: '100%' }}>
            {renderAttachments()}

            <div style={{ whiteSpace: 'pre-wrap' }}>
                {formatText(msg.content)}
            </div>

            {timeStr && <MessageTimestamp>{timeStr}</MessageTimestamp>}
            </MessageBubble>
        );
    }

    if (!Array.isArray(parsedContent.data.message)) {
        return null;
    }

        return (
        <>
            {renderAttachments()}

            {parsedContent.data.message.map((block: any, index: number) => {
            if (block.type === 'text') {
                return (
                <MessageBubble key={index} role={msg.role}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                    {formatText(block.content)}
                    </div>
                    {timeStr && <MessageTimestamp>{timeStr}</MessageTimestamp>}
                </MessageBubble>
                );
            }

            if (block.type === 'code') {
                return (
                <MessageBubble key={index} role={msg.role}>
                    <div>
                    SQL query generated — View{' '}
                    <SqlLinkText onClick={() => openSql(block.content)}>
                        SQL
                    </SqlLinkText>
                    </div>
                    {timeStr && <MessageTimestamp>{timeStr}</MessageTimestamp>}
                </MessageBubble>
                );
            }

            return null;
            })}
        </>
        );
  };

  return (
    <MessageRow role={msg.role} isContinued={isContinued}>
      {/* ✅ AVATAR PLACEMENT */}
      {msg.role === 'assistant' && (
        isContinued ? (
          <div style={{ width: '30px', minWidth: '30px', flexShrink: 0 }} />
        ) : (
          <AvatarContainer>
            <AvatarImg 
              src={botAvatar} 
              alt="AskAI" 
              isLoading={false} 
            />
          </AvatarContainer>
        )
      )}

      {/* ✅ MULTIPLE BUBBLE WRAPPER */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px', 
          alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          maxWidth: '80%' 
        }}
      >
        {/* The bubbles now contain their own timestamps internally */}
        {renderBubbles()}
      </div>

      {/* MODAL CONTROLLER LAYER */}
      <SqlPreviewModal
        visible={sqlModal.visible}
        sql={sqlModal.sql}
        onClose={closeSql}
      />
    </MessageRow>
  );
}