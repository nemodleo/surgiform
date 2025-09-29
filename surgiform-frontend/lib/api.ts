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
    console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API 응답: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API 응답 오류:', error);
    
    if (error.response) {
      // 서버가 응답했지만 오류 상태 코드
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
      console.error('응답 데이터 상세:', JSON.stringify(error.response.data, null, 2));
      console.error('응답 헤더:', error.response.headers);
    } else if (error.request) {
      // 요청이 전송되었지만 응답을 받지 못함
      console.error('요청 전송됨, 응답 없음:', error.request);
    } else {
      // 요청 설정 중 오류
      console.error('요청 설정 오류:', error.message);
    }
    
    if (error.code === 'ERR_NETWORK') {
      console.error('네트워크 오류: 서버에 연결할 수 없습니다.');
    } else if (error.code === 'ERR_CONNECTION_TIMED_OUT') {
      console.error('연결 시간 초과: 서버 응답이 너무 느립니다.');
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

  // Consent generation with progress tracking
  generateConsentWithProgress: (
    data: ConsentGenerateIn, 
    onProgress?: (progress: number, message: string) => void
  ) => {
    return new Promise<ConsentGenerateOut>((resolve, reject) => {
      // 진행률 시뮬레이션 (실제 API 호출과 함께)
      const progressMessages = [
        { progress: 10, message: "서버 연결 확인 중..." },
        { progress: 20, message: "환자 정보 분석 중..." },
        { progress: 35, message: "수술 정보 처리 중..." },
        { progress: 50, message: "의학적 위험도 평가 중..." },
        { progress: 65, message: "동의서 내용 생성 중..." },
        { progress: 80, message: "참고 문헌 검색 중..." },
        { progress: 90, message: "최종 검토 중..." },
        { progress: 100, message: "동의서 생성 완료!" }
      ];

      let currentStep = 0;
      
      // 진행률 업데이트 함수
      const updateProgress = () => {
        if (currentStep < progressMessages.length) {
          const { progress, message } = progressMessages[currentStep];
          onProgress?.(progress, message);
          currentStep++;
          
          // 마지막 단계가 아니면 다음 단계로
          if (currentStep < progressMessages.length) {
            setTimeout(updateProgress, Math.random() * 2000 + 1000); // 1-3초 랜덤
          }
        }
      };

      // 진행률 업데이트 시작
      updateProgress();

      // 실제 API 호출
      api.post<ConsentGenerateOut>('/consent', data)
        .then(response => {
          // API 완료 시 100% 보장
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