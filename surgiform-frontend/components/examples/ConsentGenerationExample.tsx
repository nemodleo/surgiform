'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressModal } from '@/components/ui/ProgressModal';
import { useConsentGeneration } from '@/hooks/useConsentGeneration';
import { ConsentGenerateIn } from '@/lib/api';

export const ConsentGenerationExample: React.FC = () => {
  const [showProgress, setShowProgress] = useState(false);
  
  const { generateConsent, isGenerating, progress, progressMessage } = useConsentGeneration({
    onSuccess: (result) => {
      setShowProgress(false);
      console.log('생성 완료:', result);
      // 결과 처리 로직
    },
    onError: (error) => {
      setShowProgress(false);
      console.error('생성 실패:', error);
    }
  });

  const handleGenerateConsent = async () => {
    setShowProgress(true);

    const sampleData: ConsentGenerateIn = {
      surgery_name: "복강경 담낭절제술",
      registration_no: "2024001",
      patient_name: "김환자",
      age: 35,
      gender: "F",
      scheduled_date: "2025-09-30",
      diagnosis: "담석증",
      surgical_site_mark: "우상복부",
      participants: [
        {
          name: "이의사",
          is_specialist: true,
          department: "외과"
        }
      ],
      patient_condition: "고혈압, 당뇨병 있음",
      special_conditions: {
        past_history: false,
        diabetes: true,
        smoking: false,
        hypertension: true,
        allergy: false,
        cardiovascular: false,
        respiratory: false,
        coagulation: false,
        medications: true,
        renal: false,
        drug_abuse: false,
        other: "혈압약 복용 중"
      }
    };

    try {
      await generateConsent(sampleData);
    } catch (error) {
      // 에러는 hook에서 처리됨
    }
  };

  const handleCancel = () => {
    setShowProgress(false);
    // 실제로는 API 요청을 취소해야 하지만, 현재는 UI만 닫음
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>수술동의서 생성</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleGenerateConsent}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? '생성 중...' : '동의서 생성'}
        </Button>

        <ProgressModal
          isOpen={showProgress}
          progress={progress}
          message={progressMessage}
          onCancel={handleCancel}
        />
      </CardContent>
    </Card>
  );
};

export default ConsentGenerationExample;
