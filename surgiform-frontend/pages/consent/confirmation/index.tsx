

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


    if (!savedFormData || !savedConsentData) {
      // Redirect to start if data is missing
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
        setGeneratedImages(parsedImageData.images || [])
      } catch (error) {
        console.error('❌ Failed to parse image data:', error)
      }
    }

    setFormData(parsedFormData)
    setConsentData(parsedConsentData)
  }, [])
  
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