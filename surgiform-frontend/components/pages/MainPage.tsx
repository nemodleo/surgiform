import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface MainPageProps {
  onComplete: () => void
}

export default function MainPage({ onComplete }: MainPageProps) {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-dark rounded-full mb-6">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-black mb-4">
            SurgiForm
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            빠르고 정확한 수술 동의서 작성
          </p>
          <p className="text-lg text-gray-600 mb-10">
            AI 기반 의료 문서 지원 시스템으로 환자 맞춤형 수술 동의서를 자동으로 생성합니다
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={onComplete} size="lg" className="bg-green-dark hover:bg-green-darker text-white text-lg px-10 py-6">
              수술 동의서 작성 시작 →
            </Button>
            <Button variant="outline" size="lg" className="border-gray-300 text-black px-10 py-6">
              사용 가이드
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-gray-300 hover:border-green-dark transition-colors">
            <CardHeader>
              <svg className="h-10 w-10 text-green-dark mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <CardTitle className="text-black">시간 절약</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                복잡한 수술 동의서를 몇 분 안에 작성할 수 있습니다
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-gray-300 hover:border-green-dark transition-colors">
            <CardHeader>
              <svg className="h-10 w-10 text-green-dark mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <CardTitle className="text-black">정확성 향상</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                최신 의료 정보 기반으로 정확한 내용을 제공합니다
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-gray-300 hover:border-green-dark transition-colors">
            <CardHeader>
              <svg className="h-10 w-10 text-green-dark mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <CardTitle className="text-black">맞춤형 문서</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                환자별 특성을 고려한 개인화된 동의서를 생성합니다
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-gray-300 hover:border-green-dark transition-colors">
            <CardHeader>
              <svg className="h-10 w-10 text-green-dark mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <CardTitle className="text-black">신뢰성 보장</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                UpToDate 기반 신뢰할 수 있는 의료 정보를 제공합니다
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 border-gray-300">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-2xl text-black">주요 기능</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-green-dark text-white rounded-full p-1 mt-1">
                <span className="block w-6 h-6 text-center text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-black">기본 정보 입력</h3>
                <p className="text-gray-600">
                  환자와 수술 관련 기본 정보를 입력하고 POSSUM SCORE를 자동 계산합니다
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-dark text-white rounded-full p-1 mt-1">
                <span className="block w-6 h-6 text-center text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-black">AI 기반 정보 생성</h3>
                <p className="text-gray-600">
                  UpToDate 기반 전문 정보를 조회하고 환자가 이해하기 쉬운 언어로 변환합니다
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-dark text-white rounded-full p-1 mt-1">
                <span className="block w-6 h-6 text-center text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-black">수정 및 보완</h3>
                <p className="text-gray-600">
                  생성된 내용을 검토하고 필요시 챗봇을 통해 추가 정보를 얻을 수 있습니다
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-green-dark text-white rounded-full p-1 mt-1">
                <span className="block w-6 h-6 text-center text-sm font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-black">서명 및 PDF 생성</h3>
                <p className="text-gray-600">
                  전자 서명을 추가하고 완성된 동의서를 PDF로 저장합니다
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <Card className="border-gray-300 text-center">
            <CardContent className="pt-8">
              <div className="text-4xl font-bold text-green-dark mb-2">1,234+</div>
              <p className="text-gray-600">생성된 동의서</p>
            </CardContent>
          </Card>
          <Card className="border-gray-300 text-center">
            <CardContent className="pt-8">
              <div className="text-4xl font-bold text-green-dark mb-2">98%</div>
              <p className="text-gray-600">사용자 만족도</p>
            </CardContent>
          </Card>
          <Card className="border-gray-300 text-center">
            <CardContent className="pt-8">
              <div className="text-4xl font-bold text-green-dark mb-2">5분</div>
              <p className="text-gray-600">평균 작성 시간</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}