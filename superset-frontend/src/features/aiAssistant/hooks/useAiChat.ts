import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { queryEditorSetSql } from 'src/SqlLab/actions/sqlLab';

import { fetchChatHistory, sendChatMessage } from '../api';
import { AIChatMessage } from '../types';

export const useAiChat = () => {
  const dispatch = useDispatch();

  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // ✅ Attachment (NEW ✅)
  const [file, setFile] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false);

  // ✅ SqlLab context
  const activeQueryEditor = useSelector((state: any) => {
    const { activeQueryEditorId, queryEditors } = state.sqlLab;
    return queryEditors?.find((qe: any) => qe.id === activeQueryEditorId);
  });

  // ✅ Load chat history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await fetchChatHistory();
        if (Array.isArray(history)) {
          setMessages(history);
        }
      } catch (err) {
        console.error('[AI] Failed to load history:', err);
      }
    };

    loadHistory();
  }, []);

  // ✅ Auto scroll (UI layer consumes ref)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // ✅ SEND function (renamed: cleaner API ✅)
  const send = async () => {
    if (!inputValue.trim() || isThinking || isSendingRef.current) return;

    const userMessage: AIChatMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      message_type: 'text',
      execution_status: 'completed',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);
    isSendingRef.current = true;

    try {
        const response = await sendChatMessage({
            content: userMessage.content!,

            context: {
                sql: activeQueryEditor?.sql || '',
                databaseId: activeQueryEditor?.dbId || '',
                schema: activeQueryEditor?.schema || '',

                hasAttachment: !!file,
                fileName: file?.name || '',
            },
        });

        setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('[AI] send failed:', error);

      const errorMessage: AIChatMessage = {
        id: Date.now(),
        role: 'assistant',
        content: '⚠️ Failed to fetch response. Please try again.',
        message_type: 'error',
        execution_status: 'failed',
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
      isSendingRef.current = false;
      setFile(null); // ✅ reset attachment
    }
  };

  // ✅ Insert SQL into editor (unchanged)
  const handleInsertSql = (sqlText: string) => {
    if (activeQueryEditor) {
      dispatch(queryEditorSetSql(activeQueryEditor, sqlText));
    }
  };

  return {
    // ✅ state
    messages,
    inputValue,
    setInputValue,
    isThinking,

    // ✅ attachment
    file,
    setFile,

    // ✅ refs
    messagesEndRef,

    // ✅ actions
    send,
    handleInsertSql,
  };
};
