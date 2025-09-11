"use client"

import { useState } from "react"
import { StepperMinimal } from "@/components/ui/stepper-minimal"
import HeaderMinimal from "@/components/HeaderMinimal"
import { usePathname, useRouter } from "next/navigation"

const STEP_LABELS = [
  "기본 정보",
  "수술 정보", 
  "확인 및 서명",
  "PDF 생성"
]

const STEP_PATHS = [
  "/consent/basic-info",
  "/consent/surgery-info",
  "/consent/confirmation",
  "/consent/pdf"
]

export default function ConsentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState<'home' | 'form' | 'mypage' | 'settings'>('form')
  
  // Determine current step based on pathname
  const currentStep = STEP_PATHS.findIndex(path => pathname.startsWith(path))
  
  const handleNavigate = (page: string) => {
    console.log('🧭 Navigation requested to page:', page)
    setCurrentPage(page as 'home' | 'form' | 'mypage' | 'settings')
    if (page === 'home') {
      console.log('🏠 Leaving consent flow - clearing sessionStorage')
      // Clear consent-related sessionStorage when leaving consent flow
      sessionStorage.removeItem('formData')
      sessionStorage.removeItem('consentData')
      sessionStorage.removeItem('confirmationSignatures')
      sessionStorage.removeItem('confirmationCanvases')
      sessionStorage.removeItem('signatureData')
      sessionStorage.removeItem('confirmationCompleted')
      console.log('🗑️ SessionStorage cleared')
      router.push('/')
    }
  }
  
  const handleStepClick = (step: number) => {
    console.log(`📍 Step click: from step ${currentStep} to step ${step}`)
    
    // If trying to go to next step from basic info page, validate first
    if (currentStep === 0 && step === 1) {
      if (typeof window !== 'undefined') {
        const validateBasicInfo = (window as Window & { validateBasicInfo?: () => void }).validateBasicInfo
        if (validateBasicInfo) {
          validateBasicInfo()
          return
        }
      }
    }
    
    // If trying to go to next step from surgery info page, validate first
    if (currentStep === 1 && step === 2) {
      if (typeof window !== 'undefined') {
        const validateSurgeryInfo = (window as Window & { validateSurgeryInfo?: () => void }).validateSurgeryInfo
        if (validateSurgeryInfo) {
          validateSurgeryInfo()
          return
        }
      }
    }
    
    // If trying to go to next step from confirmation page, validate first
    if (currentStep === 2 && step === 3) {
      if (typeof window !== 'undefined') {
        const validateConfirmation = (window as Window & { validateConfirmation?: () => void }).validateConfirmation
        if (validateConfirmation) {
          validateConfirmation()
          return
        }
      }
    }
    
    // Otherwise, allow navigation for going backward or same step
    console.log(`➡️ Navigating to path: ${STEP_PATHS[step]}`)
    router.push(STEP_PATHS[step])
  }
  
  return (
    <div className="min-h-screen bg-white">
      <HeaderMinimal onNavigate={handleNavigate} currentPage={currentPage} />
      
      <div className="container mx-auto px-4 py-4">
        {currentStep >= 0 && (
          <div className="mb-8 bg-white rounded-xl px-8 py-4">
            <StepperMinimal 
              steps={STEP_LABELS} 
              currentStep={currentStep} 
              onStepClick={handleStepClick}
            />
          </div>
        )}
        
        {children}
      </div>
    </div>
  )
}