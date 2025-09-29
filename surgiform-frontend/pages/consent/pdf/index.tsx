

import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { transformConsentDataToArray, type ConsentObjectData } from "@/lib/consentDataTransformer"

// PDF 페이지를 동적으로 로드하여 ChunkLoadError 방지
const PDFGenerationPage = dynamic(() => import("@/components/pages/PDFGenerationPage"), {
  ssr: false,
  loading: () => (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-8">
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            수술 동의서 PDF 생성
          </h2>
          <p className="text-sm text-slate-600">
            PDF 생성 페이지를 로딩 중입니다...
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
              <span className="text-slate-700">로딩 중...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function PDFRoute() {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [consentData, setConsentData] = useState<ConsentObjectData>({})
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  
  useEffect(() => {
    // Load data from sessionStorage
    const savedFormData = sessionStorage.getItem('formData')
    const savedConsentSubmissionData = sessionStorage.getItem('consentSubmissionData')
    
    
    if (!savedFormData) {
      router.push('/consent/basic-info')
      return
    }
    
    try {
      const parsedFormData = JSON.parse(savedFormData)
      setFormData(parsedFormData)
      
      // consentData가 없으면 빈 객체로 설정 (PDF 생성에는 formData만 필요)
      if (savedConsentSubmissionData) {
        const parsedConsentData = JSON.parse(savedConsentSubmissionData)
        setConsentData(parsedConsentData)
      } else {
        setConsentData({})
      }
      
      setIsDataLoaded(true)
    } catch (error) {
      console.error('Error parsing stored data:', error)
      router.push('/consent/basic-info')
    }
  }, [router])
  
  const handleHome = () => {
    // Clear all stored data and go home
    sessionStorage.removeItem('formData')
    sessionStorage.removeItem('consentData')
    localStorage.removeItem('signatureData')
    localStorage.removeItem('canvasDrawings')
    router.push('/')
  }
  
  const handleBack = () => {
    router.push('/consent/confirmation')
  }
  
  if (!isDataLoaded || !formData.patient_name) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              수술 동의서 PDF 생성
            </h2>
            <p className="text-sm text-slate-600">
              데이터를 로딩 중입니다...
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                <span className="text-slate-700">데이터 로딩 중...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  

  return (
    <PDFGenerationPage
      formData={formData as never}
      consentData={consentData as never}
      onHome={handleHome}
      onBack={handleBack}
    />
  )
}