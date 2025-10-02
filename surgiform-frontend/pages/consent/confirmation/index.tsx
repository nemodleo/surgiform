

import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import ConfirmationPage from "@/components/pages/ConfirmationPage"
import { transformConsentDataToArray, type ConsentObjectData } from "@/lib/consentDataTransformer"

interface GeneratedImage {
  stepId: string;
  mimeType: string;
  data: string; // Base64 encoded image
  url?: string;
}

export default function ConfirmationRoute() {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [consentData, setConsentData] = useState<ConsentObjectData>({})
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])

  useEffect(() => {
    // Load data from sessionStorage
    const savedFormData = sessionStorage.getItem('formData')
    const savedConsentData = sessionStorage.getItem('consentData')
    const savedImageData = sessionStorage.getItem('imageData')

    console.log('📦 ConfirmationRoute - Raw savedFormData:', savedFormData)
    console.log('📦 ConfirmationRoute - Raw savedConsentData:', savedConsentData)
    console.log('📦 ConfirmationRoute - Raw savedImageData:', savedImageData)

    if (!savedFormData || !savedConsentData) {
      // Redirect to start if data is missing
      console.log('❌ Missing data, redirecting to basic-info')
      router.push('/consent/basic-info')
      return
    }

    const parsedFormData = JSON.parse(savedFormData)
    const parsedConsentData = JSON.parse(savedConsentData)

    // Parse generated images if available
    let parsedImageData = { images: [] }
    if (savedImageData) {
      try {
        parsedImageData = JSON.parse(savedImageData)
        console.log('📦 ConfirmationRoute - Parsed imageData:', parsedImageData)
        setGeneratedImages(parsedImageData.images || [])
      } catch (error) {
        console.error('❌ Failed to parse image data:', error)
      }
    }

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
    router.push('/consent/image')
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
      generatedImages={generatedImages}
    />
  )
}