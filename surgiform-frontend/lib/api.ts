import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.surgi-form.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ConsentGenerateIn {
  patient_name: string;
  age: number;
  gender: 'M' | 'F';
  surgery_name: string;
  scheduled_date: string;
  diagnosis: string;
  surgical_site_mark: string;
  patient_condition: string;
  registration_no: string;
  participants?: Array<{
    name: string;
    is_specialist: boolean;
    department: string;
  }>;
  special_conditions?: {
    possum_score?: {
      physiological_score: number;
      surgery_score: number;
      mortality_risk: number;
      morbidity_risk: number;
    };
  };
}

export interface ConsentGenerateOut {
  consents: Array<{
    category: string;
    item_title: string;
    description: string;
  }>;
  references: Array<{
    category: string;
    title: string;
    content: string;
    references: Array<{
      title: string;
      url: string;
    }>;
  }>;
}

interface ConsentItem {
  category: string;
  item_title: string;
  description: string;
}

interface ReferenceItem {
  category: string;
  title: string;
  content: string;
  references: Array<{
    title: string;
    url: string;
  }>;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  history?: ChatMessage[];
  system_prompt?: string;
  consents?: ConsentItem[];
  references?: ReferenceItem[];
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  history: ChatMessage[];
  updated_consents?: ConsentItem[];
  updated_references?: ReferenceItem[];
  is_content_modified: boolean;
}

export const surgiformAPI = {
  // Health check
  healthCheck: () => api.get('/health'),

  // Consent generation
  generateConsent: (data: ConsentGenerateIn) => 
    api.post<ConsentGenerateOut>('/consent', data),

  // Transform API
  transformContent: (data: { content: string; format?: string }) =>
    api.post('/transform', data),

  // Chat APIs
  createChatSession: (systemPrompt?: string) =>
    api.post('/chat/session', { system_prompt: systemPrompt }),

  sendChatMessage: (data: ChatRequest) =>
    api.post<ChatResponse>('/chat', data),

  getChatHistory: (conversationId: string) =>
    api.get<ChatMessage[]>(`/chat/${conversationId}/history`),

  getChatSessions: () =>
    api.get('/chat/sessions'),

  deleteChatSession: (conversationId: string) =>
    api.delete(`/chat/${conversationId}`),
};