"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import BasicInfoPageMinimal from "@/components/pages/BasicInfoPageMinimal"

export default function BasicInfoRoute() {
  const router = useRouter()
  
  const handleComplete = (data: unknown) => {
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
      (window as any).validateBasicInfo = () => {
        // Trigger form validation by clicking the submit button
        const submitButton = document.querySelector('button[type="submit"]')
        if (submitButton) {
          (submitButton as HTMLButtonElement).click()
        }
      }
      
      return () => {
        delete (window as any).validateBasicInfo
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