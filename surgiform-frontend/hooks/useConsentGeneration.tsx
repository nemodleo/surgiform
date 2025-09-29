'use client';

import { useState, useCallback } from 'react';
import { surgiformAPI, ConsentGenerateIn, ConsentGenerateOut, ChatMessage, ChatRequest } from '@/lib/api';
import toast from 'react-hot-toast';

interface UseConsentGenerationProps {
  onSuccess?: (result: ConsentGenerateOut) => void;
  onError?: (error: Error) => void;
}

export const useConsentGeneration = ({ onSuccess, onError }: UseConsentGenerationProps = {}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // ChatUI 관련 상태
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const generateConsent = useCallback(async (data: ConsentGenerateIn) => {
    try {
      setIsGenerating(true);

      // 먼저 서버 헬스체크
      try {
        await surgiformAPI.healthCheck();
      } catch (healthError) {
        console.error('[useConsentGeneration] 서버 연결 실패:', healthError);
        throw new Error('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
      }

      const result = await surgiformAPI.generateConsentWithProgress(data);

      toast.success('수술동의서가 성공적으로 생성되었습니다.');
      
      onSuccess?.(result.data);
      return result;

    } catch (error) {
      console.error('[useConsentGeneration] 동의서 생성 오류:', error);
      
      let errorMessage = '동의서 생성에 실패했습니다.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
          errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
        } else if (error.message.includes('ERR_CONNECTION_TIMED_OUT')) {
          errorMessage = '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [onSuccess, onError]);


  // ChatUI 관련 함수
  const handleSendMessage = useCallback(async (message: string, history: ChatMessage[], consentData?: any) => {
    try {
      
      // consentData가 없거나 consents가 없는 경우 기본값 제공
      const consents = consentData?.consents || {};
      // references는 빈 객체로 설정 (완전 제거 대신)
      const references = {};
      
      // 2~8번 항목을 제외한 나머지 내용을 consent_information으로 통합
      const consentInfoParts = [];
      
      // 환자 정보
      if (consentData?.formData?.patient_name) {
        consentInfoParts.push(`환자명: ${consentData.formData.patient_name}`);
      }
      if (consentData?.formData?.patient_age) {
        consentInfoParts.push(`나이: ${consentData.formData.patient_age}세`);
      }
      if (consentData?.formData?.patient_gender) {
        consentInfoParts.push(`성별: ${consentData.formData.patient_gender}`);
      }
      if (consentData?.formData?.surgery_name) {
        consentInfoParts.push(`수술명: ${consentData.formData.surgery_name}`);
      }
      if (consentData?.formData?.diagnosis) {
        consentInfoParts.push(`진단명: ${consentData.formData.diagnosis}`);
      }
      
      // 의료진 정보
      if (consentData?.formData?.medical_team && consentData.formData.medical_team.length > 0) {
        const medicalTeamInfo = consentData.formData.medical_team.map((doctor: any) =>
          `${doctor.name} (${doctor.is_specialist ? '전문의' : '전공의'}, ${doctor.department})`
        ).join(', ');
        consentInfoParts.push(`참여 의료진: ${medicalTeamInfo}`);
      }
      
      // 환자 상태 및 특이사항
      if (consents.patient_condition) {
        consentInfoParts.push(`환자 상태: ${consents.patient_condition}`);
      }
      
      // 특수 조건
      if (consentData?.formData?.special_conditions) {
        const specialConditions = consentData.formData.special_conditions;
        const conditions = Object.entries(specialConditions)
          .filter(([key, value]) => value && value !== '')
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        if (conditions) {
          consentInfoParts.push(`특수 조건: ${conditions}`);
        }
      }
      
      const consentInformation = consentInfoParts.join('\n');
      
      // 백엔드에서 요구하는 필수 필드들을 포함하는 필터링된 consents 생성
      const filteredConsents = {
        // 백엔드 ConsentBase에서 필수로 요구하는 필드들
        prognosis_without_surgery: consents.prognosis_without_surgery || '',
        alternative_treatments: consents.alternative_treatments || '',
        surgery_purpose_necessity_effect: consents.surgery_purpose_necessity_effect || '',
        surgery_method_content: {
          overall_description: consents.surgery_method_content?.overall_description || '',
          estimated_duration: consents.surgery_method_content?.estimated_duration || '약 1-2시간 정도 소요될 예정입니다.',
          method_change_or_addition: consents.surgery_method_content?.method_change_or_addition || '수술 중 상황에 따라 방법이 변경되거나 추가 수술이 필요할 수 있습니다.',
          transfusion_possibility: consents.surgery_method_content?.transfusion_possibility || '수술 중 출혈이 발생할 경우 수혈이 필요할 수 있습니다.',
          surgeon_change_possibility: consents.surgery_method_content?.surgeon_change_possibility || '응급상황이나 특별한 사정이 있을 경우 집도의가 변경될 수 있습니다.'
        },
        possible_complications_sequelae: consents.possible_complications_sequelae || '',
        emergency_measures: consents.emergency_measures || '',
        mortality_risk: consents.mortality_risk || '',
        consent_information: consentInformation
      };
      
      
      const chatRequest: ChatRequest = {
        message,
        conversation_id: conversationId,
        history,
        consents: filteredConsents,
        references: references
      };

      
      const response = await surgiformAPI.sendChatMessage(chatRequest);
      const chatResponse = response.data;

      setConversationId(chatResponse.conversation_id);
      
      // 메시지 상태 관리는 chat.tsx에서 처리하므로 여기서는 하지 않음
      return chatResponse;
    } catch (error) {
      console.error('[useConsentGeneration] 채팅 오류:', error);
      throw error;
    }
  }, [conversationId]);

  return {
    generateConsent,
    isGenerating,
    // ChatUI 관련
    showChat,
    setShowChat,
    chatMessages,
    setChatMessages,
    conversationId,
    setConversationId,
    handleSendMessage,
  };
};

export default useConsentGeneration;
