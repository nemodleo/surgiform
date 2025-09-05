"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Clock, Database, FileText, AlertCircle, Users, Zap, ChevronRight } from "lucide-react"
import Image from "next/image"

interface LandingPageProps {
  onComplete: () => void
}

export default function LandingPage({ onComplete }: LandingPageProps) {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white py-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                시스템 정상
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                1분 1초가 소중한
                <br />
                <span className="text-green-600">응급외과의 시간</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                수술동의서를 작성하는 가장 빠르고 정확한 방법,
                <br />
                SurgiForm을 통해 환자와 의료진 모두를 위한
                <br />
                최적의 수술동의서를 생성하세요.
              </p>
              
              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={onComplete} 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-white px-8 h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  수술 동의서 생성하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {/* Document Previews */}
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow-lg p-4 transform rotate-[-2deg] hover:rotate-0 transition-transform">
                    <div className="aspect-[210/297] bg-gray-50 rounded border border-gray-200 p-3">
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded"></div>
                        <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                        <div className="mt-4 h-20 bg-gray-100 rounded"></div>
                        <div className="space-y-1 mt-4">
                          <div className="h-1.5 bg-gray-200 rounded"></div>
                          <div className="h-1.5 bg-gray-200 rounded"></div>
                          <div className="h-1.5 bg-gray-200 rounded w-4/5"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">수술 동의서 샘플 1</p>
                  </div>
                </div>
                
                <div className="space-y-4 mt-8">
                  <div className="bg-white rounded-lg shadow-lg p-4 transform rotate-[2deg] hover:rotate-0 transition-transform">
                    <div className="aspect-[210/297] bg-gray-50 rounded border border-gray-200 p-3">
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-300 rounded w-2/3"></div>
                        <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                        <div className="mt-4 h-16 bg-gray-100 rounded"></div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="h-12 bg-gray-100 rounded"></div>
                          <div className="h-12 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">수술 동의서 샘플 2</p>
                  </div>
                </div>
              </div>

              {/* Doctor Illustration */}
              <div className="absolute -bottom-4 -right-4 w-48 h-48 bg-green-100 rounded-full opacity-50"></div>
              <div className="absolute -top-4 -left-4 w-32 h-32 bg-green-100 rounded-full opacity-30"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Why SurgiForm Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <h2 className="text-4xl font-bold text-center mb-4">Why SurgiForm?</h2>
          <p className="text-xl text-gray-600 text-center mb-12">응급외과 의료진이 직면한 문제를 해결합니다</p>
          
          {/* Problems */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
              <h3 className="font-semibold mb-2">표준화되지 않은 문서</h3>
              <p className="text-sm text-gray-600">
                다양한 종류의 수술로 인해 정해진 양식이 없는 응급외상외과 수술 동의서
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <Clock className="h-8 w-8 text-orange-500 mb-4" />
              <h3 className="font-semibold mb-2">시간 부족</h3>
              <p className="text-sm text-gray-600">
                개별 환자의 정보에 맞춰진 최신 레퍼런스 참고 시간 부족
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <AlertCircle className="h-8 w-8 text-yellow-600 mb-4" />
              <h3 className="font-semibold mb-2">실수 및 누락</h3>
              <p className="text-sm text-gray-600">
                위급한 상황 속 반복되는 업무로 인한 실수 및 누락
              </p>
            </div>
          </div>

          {/* Solutions */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center group hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <FileText className="h-8 w-8 text-green-600 group-hover:text-white" />
              </div>
              <h4 className="font-semibold mb-2">익숙한 템플릿</h4>
              <p className="text-sm text-gray-600">
                교수님들에게 익숙한 정보 입력 & 출력 템플릿
              </p>
            </div>
            
            <div className="text-center group hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Database className="h-8 w-8 text-green-600 group-hover:text-white" />
              </div>
              <h4 className="font-semibold mb-2">최신 데이터베이스</h4>
              <p className="text-sm text-gray-600">
                최신 데이터로 학습한 정확하고 방대한 연구 데이터베이스
              </p>
            </div>
            
            <div className="text-center group hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Zap className="h-8 w-8 text-green-600 group-hover:text-white" />
              </div>
              <h4 className="font-semibold mb-2">AI 자동 생성</h4>
              <p className="text-sm text-gray-600">
                LLM을 통한 빠르고 빠짐없는 문서 생성
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What is SurgiForm Section */}
      <section className="py-20 bg-green-50">
        <div className="container mx-auto px-6 max-w-7xl">
          <h2 className="text-4xl font-bold text-center mb-4">What is SurgiForm?</h2>
          <p className="text-xl text-gray-600 text-center mb-12">간단한 3단계로 완성되는 수술 동의서</p>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                  <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-center mb-2">STEP 1</h3>
                  <p className="text-center text-gray-600">
                    간단한 수술 관련 정보 입력
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ChevronRight className="h-8 w-8 text-green-400" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                  <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-center mb-2">STEP 2</h3>
                  <p className="text-center text-gray-600">
                    빠르고 정확한 수술동의서 생성
                  </p>
                </div>
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <ChevronRight className="h-8 w-8 text-green-400" />
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                  <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-center mb-2">STEP 3</h3>
                  <p className="text-center text-gray-600">
                    PDF 출력 및 동의 진행 & 저장
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <h2 className="text-4xl font-bold text-center mb-4">
            약 <span className="text-green-600">20개 병원</span>의 응급외상외과가 선택한 'SurgiForm'
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">실제 의료진의 생생한 사용 후기</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 relative hover:shadow-lg transition-shadow">
              <div className="absolute -top-2 left-6 text-6xl text-green-200 font-serif">"</div>
              <p className="text-sm text-gray-700 mb-4 relative z-10">
                SurgiForm 덕분에 수술동의서 작성 시간이 크게 줄었습니다. 70% 이상 시간을 절약하고 있어요.
              </p>
              <div className="border-t pt-4">
                <p className="font-semibold text-sm">김철수 교수</p>
                <p className="text-xs text-gray-500">서울대학교병원 외과</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 relative hover:shadow-lg transition-shadow">
              <div className="absolute -top-2 left-6 text-6xl text-green-200 font-serif">"</div>
              <p className="text-sm text-gray-700 mb-4 relative z-10">
                응급 상황에서 놓칠 수 있는 부분을 빠짐없이 챙겨줘서 진료에 큰 도움이 됩니다.
              </p>
              <div className="border-t pt-4">
                <p className="font-semibold text-sm">이영희 교수</p>
                <p className="text-xs text-gray-500">분당서울대병원 외과</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 relative hover:shadow-lg transition-shadow">
              <div className="absolute -top-2 left-6 text-6xl text-green-200 font-serif">"</div>
              <p className="text-sm text-gray-700 mb-4 relative z-10">
                환자별 맞춤 정보를 자동으로 생성해주니 설명 시간이 단축되고 환자 이해도도 높아졌습니다.
              </p>
              <div className="border-t pt-4">
                <p className="font-semibold text-sm">박민수 교수</p>
                <p className="text-xs text-gray-500">삼성서울병원 외과</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 relative hover:shadow-lg transition-shadow">
              <div className="absolute -top-2 left-6 text-6xl text-green-200 font-serif">"</div>
              <p className="text-sm text-gray-700 mb-4 relative z-10">
                최신 정보를 반영하여 정확한 수술 정보를 제공하는 훌륭한 문서화 지원 서비스입니다.
              </p>
              <div className="border-t pt-4">
                <p className="font-semibold text-sm">정수진 교수</p>
                <p className="text-xs text-gray-500">부산대학교병원 외과</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            지금 바로 SurgiForm을 시작하세요
          </h2>
          <p className="text-xl text-green-100 mb-8">
            응급외과 의료진을 위한 최고의 수술동의서 솔루션
          </p>
          <Button 
            onClick={onComplete}
            size="lg" 
            className="bg-white text-green-600 hover:bg-gray-100 px-12 h-14 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
          >
            SurgiForm 시작하기
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  )
}