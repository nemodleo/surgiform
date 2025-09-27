import { useEffect } from "react"
import { useRouter } from "next/router"

export default function ConsentRoute() {
  const router = useRouter()

  useEffect(() => {
    // /consent로 접근하면 자동으로 /consent/basic-info로 리다이렉트
    router.replace('/consent/basic-info')
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
        <p className="text-slate-600">페이지를 이동하는 중...</p>
      </div>
    </div>
  )
}
