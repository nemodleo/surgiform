import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.surgi-form.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes timeout for consent generation
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ConsentGenerateIn {
  surgery_name: string;
  registration_no: string;
  patient_name: string;
  age: number;
  gender: 'M' | 'F';
  scheduled_date: string;
  diagnosis: string;
  surgical_site_mark: string;
  participants: Array<{
    name: string;
    is_specialist: boolean;
    department: string;
  }>;
  patient_condition: string;
  special_conditions: {
    past_history: boolean;
    diabetes: boolean;
    smoking: boolean;
    hypertension: boolean;
    allergy: boolean;
    cardiovascular: boolean;
    respiratory: boolean;
    coagulation: boolean;
    medications: boolean;
    renal: boolean;
    drug_abuse: boolean;
    other: string | null;
  };
  possum_score?: {
    mortality_risk: number;
    morbidity_risk: number;
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

  // Consent generation with progress tracking
  generateConsentWithProgress: (
    data: ConsentGenerateIn, 
    onProgress?: (progress: number, message: string) => void
  ) => {
    return new Promise<ConsentGenerateOut>((resolve, reject) => {
      // 진행률은 SurgeryInfoPage.tsx에서 관리하므로 여기서는 API 호출만
      // 실제 API 호출
      api.post<ConsentGenerateOut>('/consent', data)
        .then(response => {
          onProgress?.(100, "동의서 생성 완료!");
          resolve(response.data);
        })
        .catch(error => {
          reject(error);
        });
    });
  },

  // Submit consent data to backend
  submitConsentData: (data: ConsentGenerateIn) =>
    api.post<{ success: boolean; message: string }>('/consent/submit', data),

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