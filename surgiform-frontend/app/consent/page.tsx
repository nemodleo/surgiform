"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ConsentPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the first step
    router.replace('/consent/basic-info')
  }, [router])
  
  return null
}