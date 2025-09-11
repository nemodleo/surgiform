"use client"

import { useState, useEffect } from "react"
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
  
  // Function to clear all consent-related data
  const clearConsentData = () => {
    console.log('🗑️ Clearing all consent-related data...')
    // Clear sessionStorage
    sessionStorage.removeItem('formData')
    sessionStorage.removeItem('consentData')
    sessionStorage.removeItem('confirmationSignatures')
    sessionStorage.removeItem('confirmationCanvases')
    sessionStorage.removeItem('signatureData')
    sessionStorage.removeItem('confirmationCompleted')
    sessionStorage.removeItem('surgeryInfoTextareas')
    sessionStorage.removeItem('canvasDrawings')
    // Clear localStorage backup
    localStorage.removeItem('signatureData')
    localStorage.removeItem('canvasDrawings')
    console.log('✅ All consent data cleared')
  }
  
  // Clear data when navigating away from consent
  useEffect(() => {
    // Check if we're not on a consent page
    if (!pathname.startsWith('/consent')) {
      console.log('🚪 Left consent flow - pathname:', pathname)
      clearConsentData()
    }
  }, [pathname])
  
  const handleNavigate = (page: string) => {
    console.log('🧭 Navigation requested to page:', page)
    setCurrentPage(page as 'home' | 'form' | 'mypage' | 'settings')
    if (page === 'home') {
      console.log('🏠 Leaving consent flow')
      clearConsentData()
      router.push('/')
    }
  }
  
  const handleStepClick = (step: number) => {
    
    // If trying to go to next step from basic info page, validate first
    if (currentStep === 0 && step === 1) {
      if (typeof window !== 'undefined') {
        const validateBasicInfo = (window as Window & { validateBasicInfo?: () => void }).validateBasicInfo
        if (validateBasicInfo) {
          validateBasicInfo()
          return
        }
      }
      // If no validation function exists, allow navigation
      console.log(`➡️ No validation for basic-info, navigating to: ${STEP_PATHS[step]}`)
      router.push(STEP_PATHS[step])
      return
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
      // If no validation function exists, allow navigation
      console.log(`➡️ No validation for surgery-info, navigating to: ${STEP_PATHS[step]}`)
      router.push(STEP_PATHS[step])
      return
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
      // If no validation function exists, allow navigation
      console.log(`➡️ No validation for confirmation, navigating to: ${STEP_PATHS[step]}`)
      router.push(STEP_PATHS[step])
      return
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