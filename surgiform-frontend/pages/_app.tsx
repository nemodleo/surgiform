import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import '@/styles/globals.css'
import '@/styles/mobbin-design-system.css'
import HeaderMinimal from '@/components/HeaderMinimal'
import { StepperMinimal } from '@/components/ui/stepper-minimal'

const STEP_LABELS = [
  "기본 정보",
  "동의서 작성", 
  "확인 · 서명",
  "PDF 변환"
]

const STEP_PATHS = [
  "/consent/basic-info",
  "/consent/surgery-info",
  "/consent/confirmation",
  "/consent/pdf"
]

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState('home')
  
  // Determine current step based on pathname
  const currentStep = STEP_PATHS.findIndex(path => router.pathname.startsWith(path))
  const isConsentPage = router.pathname.startsWith('/consent')
  
  // 페이지 변경 감지
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url.includes('/consent')) {
        setCurrentPage('form')
      } else if (url === '/') {
        setCurrentPage('home')
      }
    }

    router.events.on('routeChangeStart', handleRouteChange)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [router])

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
    if (page === 'form') {
      router.push('/consent/basic-info')
    } else if (page === 'home') {
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
    <>
      <Head>
        <title>Surgiform</title>
        <meta name="description" content="Surgiform - AI-powered surgical consent form generation" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-white">
        <HeaderMinimal onNavigate={handleNavigate} currentPage={currentPage} />
        
        {isConsentPage && currentStep >= 0 && (
          <div className="container mx-auto px-4 py-4">
            <div className="mb-8 bg-white rounded-xl px-8 py-4">
              <StepperMinimal 
                steps={STEP_LABELS} 
                currentStep={currentStep} 
                onStepClick={handleStepClick}
              />
            </div>
          </div>
        )}
        
        <Component {...pageProps} />
      </div>
    </>
  )
}
