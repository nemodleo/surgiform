"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import SurgeryInfoPage from "@/components/pages/SurgeryInfoPage"

export default function SurgeryInfoRoute() {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [consentData, setConsentData] = useState<Record<string, unknown> | null>(null)
  
  useEffect(() => {
    // Load form data from sessionStorage
    const savedFormData = sessionStorage.getItem('formData')
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData))
    } else {
      // Redirect to basic info if no form data exists
      router.push('/consent/basic-info')
    }
    
    // Load consent data if exists
    const savedConsentData = sessionStorage.getItem('consentData')
    if (savedConsentData) {
      setConsentData(JSON.parse(savedConsentData))
    }
  }, [router])
  
  const handleComplete = (data: Record<string, unknown>) => {
    // Store consent data
    sessionStorage.setItem('consentData', JSON.stringify(data))
    router.push('/consent/confirmation')
  }
  
  const handleBack = () => {
    router.push('/consent/basic-info')
  }
  
  if (!formData.patient_name) {
    return null // Wait for data to load
  }
  
  return (
    <SurgeryInfoPage
      onComplete={handleComplete}
      onBack={handleBack}
      formData={formData}
      initialData={consentData as Record<string, unknown> | undefined}
    />
  )
}