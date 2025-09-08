"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check, FileText, Zap, ArrowUpRight } from "lucide-react"

interface LandingPageProps {
  onComplete: () => void
}

export default function LandingPageMobbin({ onComplete }: LandingPageProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [showCursor, setShowCursor] = useState(true)
  const fullText = "1분 1초가 소중한"
  
  useEffect(() => {
    const typewriterLoop = () => {
      let currentIndex = 0
      setDisplayedText("")
      setShowCursor(true)
      
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setDisplayedText(fullText.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(typingInterval)
          setShowCursor(false)
          
          // Wait 3 seconds then restart
          setTimeout(() => {
            typewriterLoop()
          }, 3000)
        }
      }, 100) // 100ms per character
      
      return typingInterval
    }
    
    const initialInterval = typewriterLoop()
    
    return () => {
      if (initialInterval) clearInterval(initialInterval)
    }
  }, [])
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Clean and Minimal */}
      <section className="relative overflow-hidden bg-white">
        <div className="container-max section-spacing">
          <div className="grid lg:grid-cols-2 gap-16 items-center relative">
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
                  <span className="inline-block min-h-[1.2em]">
                    {displayedText}
                    {showCursor && <span className="animate-pulse">|</span>}
                  </span>
                  <span className="block text-slate-900">
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
                  동의서 작성 시작
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
                  <span className="font-semibold text-slate-900">00+ 병원</span>에서 사용중
                </p>
              </div>
            </div>

            {/* Right Visual - 3 A4 Documents Horizontally Overlapped */}
            <div className="relative lg:pl-8">
              <div className="flex items-center justify-center">
                <div className="flex -space-x-20">
                  {[
                    { title: "복강경 수술", subtitle: "동의서", highlight: "최소침습" },
                    { title: "응급 수술", subtitle: "동의서", highlight: "긴급처치" },
                    { title: "장 절제술", subtitle: "동의서", highlight: "외과수술" }
                  ].map((doc, index) => (
                    <div
                      key={index}
                      className="relative bg-white rounded-lg shadow-xl border border-slate-200 w-48 h-64 p-4 hover:z-10 transition-all hover:scale-105"
                      style={{
                        transform: `rotate(${index === 0 ? -5 : index === 1 ? 0 : 5}deg)`,
                        zIndex: index === 1 ? 2 : 1
                      }}
                    >
                      {/* Document Content */}
                      <div className="h-full flex flex-col text-xs">
                        {/* Header */}
                        <div className="mb-3 text-center">
                          <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                          <p className="text-slate-500 text-xs">{doc.subtitle}</p>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 space-y-2 text-slate-600">
                          <div className="bg-slate-50 p-2 rounded">
                            <p className="font-semibold text-slate-700 text-xs mb-1">{doc.highlight}</p>
                            <div className="space-y-0.5">
                              <div className="h-1 bg-slate-200 rounded"></div>
                              <div className="h-1 bg-slate-200 rounded w-4/5"></div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-[10px] leading-relaxed">환자명: ___________</p>
                            <p className="text-[10px] leading-relaxed">수술일: 2025.__.__</p>
                            <p className="text-[10px] leading-relaxed">담당의: ___________</p>
                          </div>
                          
                          <div className="space-y-0.5">
                            <div className="h-1 bg-slate-100 rounded"></div>
                            <div className="h-1 bg-slate-100 rounded"></div>
                            <div className="h-1 bg-slate-100 rounded w-3/4"></div>
                          </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="pt-2 mt-auto border-t text-[10px]">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">서명란</span>
                            <div className="h-4 w-12 border-b border-slate-300"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section - Streamlined */}
      <section className="bg-white">
        <div className="container-max section-spacing">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">왜 SurgiForm인가?</h2>
            <p className="text-xl text-slate-600">응급외과 의료진이 매일 직면하는 문제를 해결합니다</p>
          </div>
          
          {/* Combined Problem-Solution List */}
          <div className="content-wrapper">
            <div className="space-y-6">
              {[
                {
                  problem: "표준화되지 않은 양식",
                  solution: "익숙한 템플릿",
                  detail: "다양한 수술에 대응하는 맞춤형 동의서 템플릿 제공"
                },
                {
                  problem: "시간 부족",
                  solution: "AI 자동 생성",
                  detail: "환자 정보 기반 즉시 생성으로 작성 시간 70% 단축"
                },
                {
                  problem: "실수 및 누락",
                  solution: "최신 데이터베이스",
                  detail: "검증된 의료 정보로 완벽한 동의서 자동 완성"
                }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4 group">
                  {/* Problem */}
                  <div className="flex-1 text-right">
                    <span className="text-lg font-medium text-slate-500 line-through">{item.problem}</span>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex-shrink-0">
                    <ArrowRight className="h-5 w-5 text-slate-400" />
                  </div>
                  
                  {/* Solution */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{item.solution}</h3>
                    <p className="text-sm text-slate-600">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-white">
        <div className="container-max section-spacing">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">간단한 3단계</h2>
            <p className="text-xl text-slate-600">복잡한 과정 없이 빠르게 완성되는 수술 동의서</p>
          </div>
          
          <div className="content-wrapper">
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
      <section className="bg-white">
        <div className="container-max section-spacing">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              <span className="text-slate-900">00개 병원</span>이 선택한 이유
            </h2>
            <p className="text-xl text-slate-600">실제 의료진의 생생한 후기</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                quote: "수술동의서 작성 시간이 70% 이상 단축되었습니다.",
                author: "김OO 교수",
                hospital: "서울OO 병원"
              },
              {
                quote: "응급 상황에서 놓칠 수 있는 부분을 완벽하게 챙겨줍니다.",
                author: "이OO 교수",
                hospital: "분당OO 병원"
              },
              {
                quote: "환자별 맞춤 정보로 설명 시간이 크게 줄었습니다.",
                author: "박OO 교수",
                hospital: "서울OO병원"
              },
              {
                quote: "최신 정보 기반의 정확한 문서를 제공합니다.",
                author: "정OO 교수",
                hospital: "부산OO 병원"
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
      <section className="bg-white">
        <div className="container-max section-spacing text-center">
          <div className="content-wrapper">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              지금 시작하세요
            </h2>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              응급외과 의료진을 위한 최고의 수술동의서 솔루션을 경험해보세요
            </p>
            <Button 
              onClick={onComplete}
              className="bg-slate-900 text-white hover:bg-slate-800 px-10 py-6 text-lg font-medium rounded-lg"
            >
              동의서 작성 시작
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}