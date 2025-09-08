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
    setCurrentPage(page as 'home' | 'form' | 'mypage' | 'settings')
    if (page === 'home') {
      router.push('/')
    }
  }
  
  const handleStepClick = (step: number) => {
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