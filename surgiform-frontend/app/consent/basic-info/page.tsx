"use client"

import { useRouter } from "next/navigation"
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
  
  return (
    <BasicInfoPageMinimal 
      onComplete={handleComplete as never}
      initialData={existingData}
    />
  )
}