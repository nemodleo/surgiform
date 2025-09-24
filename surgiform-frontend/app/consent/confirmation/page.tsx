"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ConfirmationPage from "@/components/pages/ConfirmationPage"
import { transformConsentDataToArray, type ConsentObjectData } from "@/lib/consentDataTransformer"

export default function ConfirmationRoute() {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [consentData, setConsentData] = useState<ConsentObjectData>({})

  useEffect(() => {
    // Load data from sessionStorage
    const savedFormData = sessionStorage.getItem('formData')
    const savedConsentData = sessionStorage.getItem('consentData')

    console.log('📦 ConfirmationRoute - Raw savedFormData:', savedFormData)
    console.log('📦 ConfirmationRoute - Raw savedConsentData:', savedConsentData)

    if (!savedFormData || !savedConsentData) {
      // Redirect to start if data is missing
      console.log('❌ Missing data, redirecting to basic-info')
      router.push('/consent/basic-info')
      return
    }

    const parsedFormData = JSON.parse(savedFormData)
    const parsedConsentData = JSON.parse(savedConsentData)

    console.log('📦 ConfirmationRoute - Parsed formData:', parsedFormData)
    console.log('📦 ConfirmationRoute - Special conditions:', {
      medical_history: parsedFormData.medical_history,
      diabetes: parsedFormData.diabetes,
      other_conditions: parsedFormData.other_conditions,
      mortality_risk: parsedFormData.mortality_risk,
      morbidity_risk: parsedFormData.morbidity_risk
    })

    setFormData(parsedFormData)
    setConsentData(parsedConsentData)
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
      consentData={transformConsentDataToArray(consentData)}
    />
  )
}