"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import PDFGenerationPage from "@/components/pages/PDFGenerationPage"

export default function PDFRoute() {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [consentData, setConsentData] = useState<Record<string, unknown>>({})
  
  useEffect(() => {
    // Load data from sessionStorage
    const savedFormData = sessionStorage.getItem('formData')
    const savedConsentData = sessionStorage.getItem('consentData')
    
    if (!savedFormData || !savedConsentData) {
      // Redirect to start if data is missing
      router.push('/consent/basic-info')
      return
    }
    
    setFormData(JSON.parse(savedFormData))
    setConsentData(JSON.parse(savedConsentData))
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
  
  if (!formData.patient_name) {
    return null // Wait for data to load
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