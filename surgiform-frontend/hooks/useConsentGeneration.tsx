'use client';

import { useState, useCallback } from 'react';
import { surgiformAPI, ConsentGenerateIn, ConsentGenerateOut } from '@/lib/api';
import toast from 'react-hot-toast';

interface UseConsentGenerationProps {
  onSuccess?: (result: ConsentGenerateOut) => void;
  onError?: (error: Error) => void;
}

export const useConsentGeneration = ({ onSuccess, onError }: UseConsentGenerationProps = {}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const generateConsent = useCallback(async (data: ConsentGenerateIn) => {
    try {
      setIsGenerating(true);
      setProgress(0);
      setProgressMessage('동의서 생성을 시작합니다...');

      console.log('진행률 추적 시작'); // 디버그용

      const result = await surgiformAPI.generateConsentWithProgress(
        data,
        (newProgress, message) => {
          console.log(`API 완료: ${newProgress}% - ${message}`); // 디버그용
          // 진행률은 SurgeryInfoPage에서 관리하므로 여기서는 로그만
        }
      );

      console.log('API 호출 완료');
      toast.success('수술동의서가 성공적으로 생성되었습니다.');
      
      onSuccess?.(result);
      return result;

    } catch (error) {
      console.error('동의서 생성 오류:', error); // 디버그용
      const errorMessage = error instanceof Error ? error.message : '동의서 생성에 실패했습니다.';
      toast.error(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [onSuccess, onError]);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setProgressMessage('');
  }, []);

  return {
    generateConsent,
    isGenerating,
    progress,
    progressMessage,
    resetProgress,
  };
};

export default useConsentGeneration;
