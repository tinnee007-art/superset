import { SupersetClient } from '@superset-ui/core';
import { AIChatMessage, ChatHistoryResponse } from '../types';

/**
 * Fetch chat history
 */
export const fetchChatHistory = async (): Promise<AIChatMessage[]> => {
  try {
    const response = await SupersetClient.get({
      endpoint: '/api/v1/ai/chat/history',
    });

    const data = response.json as ChatHistoryResponse;

    if (!data || !Array.isArray(data.result)) {
      throw new Error('Invalid chat history response structure');
    }

    return data.result;
  } catch (error) {
    console.error('[AI Assistant] fetchChatHistory failed:', error);
    throw error;
  }
};

/**
 * ✅ FINAL FIXED WITH CSRF + SAFE ERROR HANDLING
 */
export const sendChatMessage = async (params: {
  content: string;
  context?: Record<string, any>;
  attachments?: any[];
}): Promise<AIChatMessage> => {
  try {
    // ✅ Step 1: Get CSRF token
    const csrfResponse = await SupersetClient.get({
      endpoint: '/api/v1/security/csrf_token/',
    });

    const csrfToken = csrfResponse.json.result;

    // ✅ Step 2: Send request with CSRF
    const response = await SupersetClient.post({
      endpoint: '/api/v1/ai/chat/send',

      jsonPayload: {
        content: params.content,
        context: params.context || {},
        attachments: params.attachments || [],
      },

      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
    });

    const data = response.json as { result: AIChatMessage };

    if (!data || !data.result) {
      throw new Error('Invalid sendChatMessage response structure');
    }

    return data.result;
  } catch (error) {
    // ✅ ✅ FIX: safe handling of unknown error
    if (error instanceof Error) {
      console.error('[AI Assistant] sendChatMessage failed:', error.message);
    } else {
      console.error('[AI Assistant] sendChatMessage failed:', error);
    }

    throw error;
  }
};