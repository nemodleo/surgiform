import { useRouter } from "next/router"
import { useEffect } from "react"
import BasicInfoPageMinimal from "@/components/pages/BasicInfoPageMinimal"

export default function BasicInfoRoute() {
  const router = useRouter()

  const handleComplete = (data: unknown) => {
    // Check if navigation is already in progress
    if (typeof window !== 'undefined') {
      const isNavigating = sessionStorage.getItem('basicInfoNavigating')
      if (isNavigating) {
        return
      }
      sessionStorage.setItem('basicInfoNavigating', 'true')
    }

    // Store data in sessionStorage for persistence across routes
    sessionStorage.setItem('formData', JSON.stringify(data))
    router.push('/consent/surgery-info')
  }
  
  // Load existing data if available
  const existingData = typeof window !== 'undefined' 
    ? JSON.parse(sessionStorage.getItem('formData') || '{}')
    : {}
  
  // Store validation function in window for stepper to access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & { validateBasicInfo?: () => void }).validateBasicInfo = () => {
        // Trigger form validation by clicking the submit button
        const submitButton = document.querySelector('button[type="submit"]')
        if (submitButton) {
          (submitButton as HTMLButtonElement).click()
        }
      }
      
      return () => {
        delete (window as Window & { validateBasicInfo?: () => void }).validateBasicInfo
      }
    }
  }, [])
  
  return (
    <BasicInfoPageMinimal 
      onComplete={handleComplete as never}
      initialData={existingData}
    />
  )
}