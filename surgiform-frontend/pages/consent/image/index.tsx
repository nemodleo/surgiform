import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import ImageGenerationPage from "@/components/pages/ImageGenerationPage"

export interface SurgicalStep {
  id: string
  index: number
  title: string
  desc: string
  geminiPrompt: string
}

export interface GeneratedImage {
  stepId: string
  mimeType: string
  data: string // Base64 encoded image
  url?: string
}

export interface ImageData {
  steps: SurgicalStep[]
  images: GeneratedImage[]
}

export default function ImageGenerationRoute() {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [imageData, setImageData] = useState<ImageData | null>(null)

  useEffect(() => {
    // Load form data from sessionStorage
    const savedFormData = sessionStorage.getItem('formData')
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData))
    } else {
      // Redirect to basic info if no form data exists
      router.push('/consent/basic-info')
      return
    }

    // Load image data if exists
    const savedImageData = sessionStorage.getItem('imageData')
    if (savedImageData) {
      setImageData(JSON.parse(savedImageData))
    }
  }, [router])

  const handleComplete = (data: ImageData) => {
    // Store image data
    sessionStorage.setItem('imageData', JSON.stringify(data))
    router.push('/consent/confirmation')
  }

  const handleBack = () => {
    router.push('/consent/surgery-info')
  }

  if (!formData.patient_name) {
    return null // Wait for data to load
  }

  return (
    <ImageGenerationPage
      onComplete={handleComplete}
      onBack={handleBack}
      formData={formData}
      initialData={imageData || undefined}
    />
  )
}