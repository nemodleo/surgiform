import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.surgi-form.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes timeout for consent generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error('[API] 요청 오류:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('[API] 응답 오류:', error);
    
    if (error.response) {
      // 서버가 응답했지만 오류 상태 코드
      console.error('[API] 응답 상태:', error.response.status);
      console.error('[API] 응답 데이터:', error.response.data);
      console.error('[API] 응답 데이터 상세:', JSON.stringify(error.response.data, null, 2));
      console.error('[API] 응답 헤더:', error.response.headers);
    } else if (error.request) {
      // 요청이 전송되었지만 응답을 받지 못함
      console.error('[API] 요청 전송됨, 응답 없음:', error.request);
    } else {
      // 요청 설정 중 오류
      console.error('[API] 요청 설정 오류:', error.message);
    }
    
    if (error.code === 'ERR_NETWORK') {
      console.error('[API] 네트워크 오류: 서버에 연결할 수 없습니다.');
    } else if (error.code === 'ERR_CONNECTION_TIMED_OUT') {
      console.error('[API] 연결 시간 초과: 서버 응답이 너무 느립니다.');
    }
    
    return Promise.reject(error);
  }
);

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
  consents?: any;
  references?: any;
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

  // Consent generation with progress tracking (단순 API 호출)
  generateConsentWithProgress: (
    data: ConsentGenerateIn, 
    onProgress?: (progress: number, message: string) => void
  ) => {
    return api.post<ConsentGenerateOut>('/consent', data);
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