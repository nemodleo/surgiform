"use client"

import { useState } from "react"
import { StepperMinimal } from "@/components/ui/stepper-minimal"
import { Button } from "@/components/ui/button"
import LandingPageMobbin from "@/components/pages/LandingPageMobbin"
import BasicInfoPageMinimal from "@/components/pages/BasicInfoPageMinimal"
import SurgeryInfoPage from "@/components/pages/SurgeryInfoPage"
import ConfirmationPage from "@/components/pages/ConfirmationPage"
import PDFGenerationPage from "@/components/pages/PDFGenerationPage"
import HeaderMinimal from "@/components/HeaderMinimal"

const STEP_LABELS = [
  "기본 정보",
  "수술 정보",
  "확인 및 서명",
  "PDF 생성"
]

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'home' | 'form' | 'mypage' | 'settings'>('home')
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<any>({})
  const [consentData, setConsentData] = useState<any>(null)

  const handleNavigate = (page: string) => {
    setCurrentPage(page as any)
    if (page === 'home') {
      setCurrentStep(0)
      setFormData({})
      setConsentData(null)
    }
  }

  const handleMainPageComplete = () => {
    setCurrentPage('form')
    setCurrentStep(0)
  }

  const handleStepComplete = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }))
    if (currentStep < STEP_LABELS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleStepClick = (step: number) => {
    setCurrentStep(step)
  }

  const handleGoHome = () => {
    setCurrentPage('home')
    setCurrentStep(0)
    setFormData({})
    setConsentData(null)
  }

  return (
    <div className="min-h-screen bg-white">
      <HeaderMinimal onNavigate={handleNavigate} currentPage={currentPage} />
      
      {currentPage === 'home' && (
        <LandingPageMobbin onComplete={handleMainPageComplete} />
      )}

      {currentPage === 'form' && (
        <div className="container mx-auto px-4 py-4">
          <div className="mb-8 bg-white rounded-xl px-8 py-4">
            <StepperMinimal 
              steps={STEP_LABELS} 
              currentStep={currentStep} 
              onStepClick={handleStepClick}
            />
          </div>

          {currentStep === 0 && (
            <BasicInfoPageMinimal 
              onComplete={(data) => {
                setFormData(data)
                setCurrentStep(1)
              }}
              initialData={formData}
            />
          )}
          
          {currentStep === 1 && (
            <SurgeryInfoPage
              onComplete={(data) => {
                setConsentData(data)
                setCurrentStep(2)
              }}
              onBack={() => setCurrentStep(0)}
              formData={formData}
              initialData={consentData}
            />
          )}
          
          {currentStep === 2 && (
            <ConfirmationPage
              onComplete={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
              formData={formData}
              consentData={consentData}
            />
          )}
          
          {currentStep === 3 && (
            <PDFGenerationPage
              formData={formData}
              consentData={consentData}
              onHome={handleGoHome}
              onBack={() => setCurrentStep(2)}
            />
          )}
        </div>
      )}

      {currentPage === 'mypage' && (
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">마이페이지</h1>
            <div className="bg-white rounded-xl border border-light p-8">
              <p className="text-muted-foreground">사용자 정보와 작성 이력을 확인할 수 있습니다.</p>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'settings' && (
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">설정</h1>
            <div className="bg-white rounded-xl border border-light p-8">
              <p className="text-muted-foreground">시스템 설정을 관리할 수 있습니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
