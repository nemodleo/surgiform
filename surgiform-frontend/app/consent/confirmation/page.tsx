"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ConfirmationPage from "@/components/pages/ConfirmationPage"

export default function ConfirmationRoute() {
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
  
  const handleComplete = () => {
    router.push('/consent/pdf')
  }
  
  const handleBack = () => {
    router.push('/consent/surgery-info')
  }
  
  if (!formData.patient_name) {
    return null // Wait for data to load
  }
  
  return (
    <ConfirmationPage
      onComplete={handleComplete}
      onBack={handleBack}
      formData={formData as never}
      consentData={consentData as never}
    />
  )
}