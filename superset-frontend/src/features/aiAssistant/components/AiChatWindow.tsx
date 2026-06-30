import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';

import {
  ChatContainer,
  ChatContentWrapper,
  ResizeHandle,
  CollapsedEdgeTab,
  ChatHeader,
} from './styles';

import ChatInputBar from './ChatInputBar';
import ChatMessageList from './ChatMessageList';
import AttachmentPreview from './AttachmentPreview';

import { AIChatMessage } from '../types';
import { CloseButton } from './styles';
import { HeaderTitle } from './styles';
import { sendChatMessage, fetchChatHistory } from '../api';
import { isFeatureEnabled } from '../utils/featureFlags';

interface Props {
  isStandalone?: boolean;
}

export default function AiChatWindow({ isStandalone = false }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState<number>(320);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);

  const [files, setFiles] = useState<any[]>([]);

  const [warning, setWarning] = useState<string | null>(null);

  const attachmentEnabled = isFeatureEnabled('AI_ATTACHMENTS');

  const containerRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);


  // ✅ Auto scroll
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages, isTyping]);

  // 🔄 FETCH HISTORY ON MOUNT (Fixes persistence on refresh/tab switch)
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await fetchChatHistory();
        if (Array.isArray(history)) {
          setMessages(history);
        }
      } catch (err) {
        console.error('[AI Assistant] Failed to load persistent chat history:', err);
      }
    };

    loadHistory();
  }, []); // Empty dependency array ensures this runs exactly once when window mounts

  // ✅ Resize logic
  const startResizing = useCallback(
    (e: React.MouseEvent) => {
      if (isStandalone) return;

      e.preventDefault();

      const move = (ev: MouseEvent) => {
        const newWidth = window.innerWidth - ev.clientX;

        if (newWidth >= 260 && newWidth <= 600) {
          setPanelWidth(newWidth);
        }
      };

      const stop = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', stop);
      };

      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', stop);
    },
    [isStandalone],
  );
  const handleSqlExecution = (
    response: AIChatMessage,
    sqlBlock: { content: string }
  ) => {

    try {
      const sql = sqlBlock.content;
      const context = response.question || response.context || '';

      const finalSql = `
        -- AI Generated Query
        -- Context:
        -- ${context}

        ${sql}
            `.trim();

      
      // ✅ Pass a callback function in the event detail!
      window.dispatchEvent(
        new CustomEvent('ai-run-sql', {
          detail: { 
            sql: finalSql,
            // This function will be triggered by App/index.tsx
            onTabCreated: (exactTabName: string) => {
              const infoMsg: AIChatMessage = {
                id: Date.now(), // Local only, disappears on refresh
                role: 'assistant',
                // We wrap the dynamic name in asterisks for italics
                content: `✅ Your query is running in new sql editor: *${exactTabName}*`,
                message_type: 'text',
                execution_status: 'completed',
                created_at: new Date().toISOString(),
              };
              setMessages(prev => [...prev, infoMsg]);
            }
          },
        }),
      );

    } catch (e) {
      console.error('SQL execution error', e);
    }
  };

  // ✅ Send logic
  const handleSend = async () => {
    if ((inputValue.trim().length === 0 && files.length === 0) || isSendingRef.current) return;

    const formatBytes = (bytes: number) => {
      if (!+bytes) return '0 KB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const lightweightAttachments = files.map(f => {
      const fileObj = f.file || {};
      const typeStr = (fileObj.type || '').toLowerCase();
      return {
        n: fileObj.name || 'Unknown File',
        s: formatBytes(fileObj.size || 0),
        t: typeStr.includes('pdf') ? 'pdf' : typeStr.includes('image') ? 'image' : 'file'
      };
    });

    const userMsg: AIChatMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      attachments: lightweightAttachments,
      message_type: 'text',
      execution_status: 'completed',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setFiles([]);
    setIsTyping(true);
    isSendingRef.current = true;

    try {
        const response = await sendChatMessage({
        content: userMsg.content!,
        attachments: lightweightAttachments,
        });

        const liveResponse: AIChatMessage = {
        ...response,
        isLive: true,
        };
        
        if (liveResponse?.content) {
            setMessages(prev => [...prev, liveResponse]);
        }



        if (liveResponse.content) {
        try {
            let parsed;
            try {
                parsed = JSON.parse(liveResponse.content);
            } catch {
                parsed = null;
            }

            const messages = parsed?.data?.message || [];

            const foundSql = messages.find(
            (item: any) =>
                item.type === 'code' &&
                item.lang?.toLowerCase() === 'sql',
            );

            if (foundSql) {

            handleSqlExecution(liveResponse, {
                content: foundSql.content,
            });
            } else {
            }

        } catch (err) {
            console.error('JSON PARSE ERROR:', err);
        }
        }
    } catch {
      const errorMsg: AIChatMessage = {
        id: Date.now(),
        role: 'assistant',
        content: '⚠️ Failed to fetch response.',
        message_type: 'error',
        execution_status: 'failed',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      isSendingRef.current = false;
      setWarning(null);
    }
  };

  return (
    <ChatContainer
      ref={containerRef}
      isCollapsed={isCollapsed}
      panelWidth={panelWidth}
      isStandalone={isStandalone}
    >
      {/* ✅ Resize bar */}
      {!isStandalone && !isCollapsed && (
        <ResizeHandle onMouseDown={startResizing} />
      )}

      {/* ✅ Collapsed edge tab */}
      {!isStandalone && isCollapsed && (
        <CollapsedEdgeTab onClick={() => setIsCollapsed(false)}>
          <span>AI Assistant</span>
        </CollapsedEdgeTab>
      )}

      {/* ✅ Chat Content */}
      <ChatContentWrapper isCollapsed={isCollapsed}>

        {/* ✅ ✅ UPDATED HEADER (TAB STYLE) */}
        <ChatHeader>
          <div className="ai-header-tab">
            <HeaderTitle>AI Assistant</HeaderTitle>
          </div>

          {!isStandalone && (
            <CloseButton onClick={() => setIsCollapsed(true)}>
              ✕
            </CloseButton>
          )}
        </ChatHeader>

        <ChatMessageList
          messages={messages}
          isTyping={isTyping}
          endRef={messageEndRef}
        />

        {attachmentEnabled && (
            <div style={{ padding: '0 12px 8px 12px' }}>
                {warning && (
                <div
                    style={{
                    marginBottom: 8,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'var(--ant-color-warning-bg)',
                    color: 'var(--ant-color-warning-text)',
                    fontSize: 12,
                    }}
                >
                    {warning}
                </div>
                )}

                {files.length > 0 && (
                <AttachmentPreview
                    files={files.map(f => ({
                    id: f.id,
                    name: f.file?.name || '',
                    size: f.file?.size || 0,
                    type: f.file?.type || '',
                    previewUrl: f.previewUrl,
                    }))}
                    removeFile={id => {
                    setFiles(prev => prev.filter(f => f.id !== id));
                    }}
                    showRemove
                />
                )}
            </div>
        )}

        <div style={{
            borderTop: '1px solid var(--ant-color-border)',
            paddingTop: 8
            }}>
            <ChatInputBar
                value={inputValue}
                setValue={setInputValue}
                onSend={handleSend}
                isStandalone={isStandalone}
                attachmentEnabled={attachmentEnabled}
                files={files}
                setFiles={setFiles}
                setWarning={setWarning}
            />
        </div>
      </ChatContentWrapper>
    </ChatContainer>
  );
}
