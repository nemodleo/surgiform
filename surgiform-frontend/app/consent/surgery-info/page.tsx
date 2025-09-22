"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import SurgeryInfoPage from "@/components/pages/SurgeryInfoPage"

interface ConsentData {
  consents?: {
    prognosis_without_surgery?: string
    alternative_treatments?: string
    surgery_purpose_necessity_effect?: string
    surgery_method_content?: {
      overall_description?: string
      estimated_duration?: string
      method_change_or_addition?: string
      transfusion_possibility?: string
      surgeon_change_possibility?: string
    }
    possible_complications_sequelae?: string
    emergency_measures?: string
    mortality_risk?: string
  }
  references?: unknown
}

export default function SurgeryInfoRoute() {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [consentData, setConsentData] = useState<ConsentData | null>(null)
  
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
  
  const handleComplete = (data: ConsentData) => {
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
      initialData={consentData || undefined}
    />
  )
}