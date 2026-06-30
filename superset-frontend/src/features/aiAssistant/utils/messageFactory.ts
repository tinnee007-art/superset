import {
  AIChatMessage,
  AIExecutionStatus,
  AIMessageType,
  AIMessageRole,
} from '../types';

export const createMessage = ({
  role,
  content,
  message_type = 'text',
  execution_status = 'completed',
}: {
  role: AIMessageRole;
  content: string;
  message_type?: AIMessageType;
  execution_status?: AIExecutionStatus;
}): AIChatMessage => ({
  id: Date.now(),
  role,
  content,
  message_type,
  execution_status,
  created_at: new Date().toISOString(),
});