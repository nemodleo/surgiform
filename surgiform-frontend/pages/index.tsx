import { useState } from "react"
import { useRouter } from "next/router"
import LandingPageMobbin from "@/components/pages/LandingPageMobbin"

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'home' | 'form' | 'mypage' | 'settings'>('home')
  const router = useRouter()

  const handleNavigate = (page: string) => {
    setCurrentPage(page as 'home' | 'form' | 'mypage' | 'settings')
    if (page === 'form') {
      router.push('/consent')
    }
  }

  const handleMainPageComplete = () => {
    router.push('/consent/basic-info')
  }

  return (
    <div className="min-h-screen bg-white">
      {currentPage === 'home' && (
        <LandingPageMobbin onComplete={handleMainPageComplete} />
      )}

      {currentPage === 'mypage' && (
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">마이페이지</h1>
            <div className="bg-white rounded-xl border border-light p-8">
              <p className="text-muted-foreground">사용자 정보와 작성 이력을 확인할 수 있습니다.</p>
            </div>
          </div>
        </div>
      )}

      {currentPage === 'settings' && (
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">설정</h1>
            <div className="bg-white rounded-xl border border-light p-8">
              <p className="text-muted-foreground">시스템 설정을 관리할 수 있습니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}