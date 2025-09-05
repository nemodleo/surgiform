"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Check, Clock, Database, FileText, AlertCircle, Zap, ChevronRight, ArrowUpRight } from "lucide-react"

interface LandingPageProps {
  onComplete: () => void
}

export default function LandingPageMobbin({ onComplete }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Clean and Minimal */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50/20"></div>
        <div className="relative container-max section-spacing">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                실시간 서비스 운영중
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
                  1분 1초가 소중한
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-900">
                    응급외과의 시간
                  </span>
                </h1>
                
                <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                  수술동의서를 작성하는 가장 빠르고 정확한 방법.
                  AI 기반 자동화로 의료진의 시간을 절약하세요.
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  onClick={onComplete} 
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-6 text-base font-medium rounded-lg group"
                >
                  동의서 생성 시작
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <button className="text-slate-600 hover:text-slate-900 font-medium text-sm flex items-center gap-1 group">
                  데모 영상 보기
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600">
                      {i}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">20+ 병원</span>에서 사용중
                </p>
              </div>
            </div>

            {/* Right Visual - Document Cards */}
            <div className="relative lg:pl-8">
              <div className="relative">
                {/* Floating cards */}
                <div className="space-y-4">
                  {[0, 1, 2].map((index) => (
                    <div 
                      key={index}
                      className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                        index === 1 ? 'ml-8' : index === 2 ? 'ml-16' : ''
                      }`}
                      style={{
                        transform: `rotate(${index === 0 ? -2 : index === 1 ? 0 : 2}deg)`,
                      }}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="h-2 bg-slate-200 rounded w-24"></div>
                          <div className="text-xs text-slate-400">PDF</div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-1.5 bg-slate-100 rounded"></div>
                          <div className="h-1.5 bg-slate-100 rounded w-4/5"></div>
                          <div className="h-1.5 bg-slate-100 rounded w-3/5"></div>
                        </div>
                        <div className="h-16 bg-slate-50 rounded-lg"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="border-t border-slate-100">
        <div className="container-max section-spacing">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">왜 SurgiForm인가?</h2>
            <p className="text-lg text-slate-600">응급외과 의료진이 매일 직면하는 문제를 해결합니다</p>
          </div>
          
          {/* Problems */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: AlertCircle,
                title: "표준화되지 않은 양식",
                description: "다양한 종류의 수술로 인해 정해진 양식이 없는 응급외상외과 수술 동의서",
                color: "text-red-500",
                bg: "bg-red-50"
              },
              {
                icon: Clock,
                title: "시간 부족",
                description: "개별 환자의 정보에 맞춰진 최신 레퍼런스 참고 시간 부족",
                color: "text-amber-500",
                bg: "bg-amber-50"
              },
              {
                icon: AlertCircle,
                title: "실수 및 누락",
                description: "위급한 상황 속 반복되는 업무로 인한 실수 및 누락",
                color: "text-orange-500",
                bg: "bg-orange-50"
              }
            ].map((problem, index) => (
              <div key={index} className="group">
                <div className="h-full p-6 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className={`inline-flex p-2 rounded-lg ${problem.bg} mb-4`}>
                    <problem.icon className={`h-5 w-5 ${problem.color}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{problem.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div className="flex justify-center my-8">
            <ChevronRight className="h-8 w-8 text-slate-300 rotate-90" />
          </div>

          {/* Solutions */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: "익숙한 템플릿",
                description: "교수님들에게 익숙한 정보 입력 & 출력 템플릿"
              },
              {
                icon: Database,
                title: "최신 데이터베이스",
                description: "최신 데이터로 학습한 정확하고 방대한 연구 데이터베이스"
              },
              {
                icon: Zap,
                title: "AI 자동 생성",
                description: "LLM을 통한 빠르고 빠짐없는 문서 생성"
              }
            ].map((solution, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="h-full p-6 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="inline-flex p-2 rounded-lg bg-white mb-4">
                    <solution.icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{solution.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {solution.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-slate-50 border-t border-slate-100">
        <div className="container-max section-spacing">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">간단한 3단계</h2>
            <p className="text-lg text-slate-600">복잡한 과정 없이 빠르게 완성되는 수술 동의서</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connection Line */}
              <div className="absolute top-8 left-8 right-8 h-0.5 bg-slate-200 hidden md:block"></div>
              
              {/* Steps */}
              <div className="grid md:grid-cols-3 gap-8 relative">
                {[
                  {
                    step: "01",
                    title: "정보 입력",
                    description: "간단한 수술 관련 정보 입력",
                    icon: FileText
                  },
                  {
                    step: "02",
                    title: "AI 생성",
                    description: "빠르고 정확한 수술동의서 생성",
                    icon: Zap
                  },
                  {
                    step: "03",
                    title: "완료",
                    description: "PDF 출력 및 동의 진행 & 저장",
                    icon: Check
                  }
                ].map((item, index) => (
                  <div key={index} className="relative">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-4xl font-bold text-slate-100">{item.step}</span>
                        <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center">
                          <item.icon className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-slate-100">
        <div className="container-max section-spacing">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-900">20개 병원</span>이 선택한 이유
            </h2>
            <p className="text-lg text-slate-600">실제 의료진의 생생한 후기</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                quote: "수술동의서 작성 시간이 70% 이상 단축되었습니다.",
                author: "김철수 교수",
                hospital: "서울대학교병원"
              },
              {
                quote: "응급 상황에서 놓칠 수 있는 부분을 완벽하게 챙겨줍니다.",
                author: "이영희 교수",
                hospital: "분당서울대병원"
              },
              {
                quote: "환자별 맞춤 정보로 설명 시간이 크게 줄었습니다.",
                author: "박민수 교수",
                hospital: "삼성서울병원"
              },
              {
                quote: "최신 정보 기반의 정확한 문서를 제공합니다.",
                author: "정수진 교수",
                hospital: "부산대학교병원"
              }
            ].map((testimonial, index) => (
              <div key={index} className="group">
                <div className="h-full p-6 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all hover:-translate-y-1">
                  <div className="mb-4">
                    <svg className="h-8 w-8 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-700 mb-4 leading-relaxed">
                    {testimonial.quote}
                  </p>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="font-medium text-sm text-slate-900">{testimonial.author}</p>
                    <p className="text-xs text-slate-500">{testimonial.hospital}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900">
        <div className="container-max section-spacing text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            지금 시작하세요
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            응급외과 의료진을 위한 최고의 수술동의서 솔루션을 경험해보세요
          </p>
          <Button 
            onClick={onComplete}
            className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-6 text-base font-medium rounded-lg"
          >
            무료로 시작하기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}