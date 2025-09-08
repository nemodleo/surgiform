import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ConsentGenerateIn {
  patient_name: string;
  patient_age: number;
  patient_gender: 'MALE' | 'FEMALE';
  surgery_name: string;
  symptoms: string;
  diagnosis_codes?: string[];
  surgery_objective: string;
  anesthesia_codes?: string[];
  special_conditions?: {
    possum_score?: {
      physiological_score: number;
      surgery_score: number;
      mortality_risk: number;
      morbidity_risk: number;
    };
  };
  participants?: Array<{
    name: string;
    department: string;
    role: string;
  }>;
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
  message: string;
  conversation_id?: string;
  consents?: ConsentItem[];
  references?: ReferenceItem[];
}

export interface ChatResponse {
  answer: string;
  conversation_id: string;
  is_content_modified: boolean;
  response?: Record<string, unknown>;
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
  createChatSession: (systemPrompt: string) =>
    api.post('/chat/session', { system_prompt: systemPrompt }),

  sendChatMessage: (data: ChatMessage) =>
    api.post<ChatResponse>('/chat', data),

  getChatSessions: () =>
    api.get('/chat/sessions'),
};