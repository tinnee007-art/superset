export type AIMessageRole = 'user' | 'assistant';

export type AIMessageType = 'text' | 'error';

export type AIExecutionStatus = 'pending' | 'completed' | 'failed';

export interface AIContentBlock {
  type: 'text' | 'code';
  content: string;
  lang?: 'sql' | 'es' | 'email' | string;
}

export interface AIChatMessage {
  id: number;
  role: AIMessageRole;

  blocks?: AIContentBlock[];

  content?: string;
  attachments?: any[];
  
  message_type: AIMessageType;
  execution_status: AIExecutionStatus;

  created_at: string;

  context?: string;
  question?: string;

  isLive?: boolean;
}

export interface ChatHistoryResponse {
  result: AIChatMessage[];
}
