import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import '@/styles/globals.css'
import '@/styles/mobbin-design-system.css'
import HeaderMinimal from '@/components/HeaderMinimal'
import { StepperMinimal } from '@/components/ui/stepper-minimal'
import { Toaster } from 'react-hot-toast'

const STEP_LABELS = [
  "정보 입력",
  "동의서 작성",
  "이미지 생성",
  "확인 · 서명",
  "PDF 변환"
]

const STEP_PATHS = [
  "/consent/basic-info",
  "/consent/surgery-info",
  "/consent/image",
  "/consent/confirmation",
  "/consent/pdf"
]

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState('home')
  
  const currentStep = STEP_PATHS.findIndex(path => router.pathname.startsWith(path))
  const isConsentPage = router.pathname.startsWith('/consent')
  
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
    // Validation logic for navigating between steps
    if (step === 0) {
      router.push('/consent/basic-info')
    } else if (step === 1) {
      router.push('/consent/surgery-info')
    } else if (step === 2) {
      router.push('/consent/image')
    } else if (step === 3) {
      router.push('/consent/confirmation')
    } else if (step === 4) {
      router.push('/consent/pdf')
    }
  }

  return (
    <>
      <Head>
        <title>Surgiform</title>
        <meta name="description" content="Surgiform - AI-powered surgical consent form generation" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

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
