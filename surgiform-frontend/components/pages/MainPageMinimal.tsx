"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check, Zap, Shield, Users } from "lucide-react"

interface MainPageProps {
  onComplete: () => void
}

export default function MainPageMinimal({ onComplete }: MainPageProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const features = [
    {
      icon: Zap,
      title: "5분 내 작성",
      description: "AI가 복잡한 의료 정보를 즉시 처리"
    },
    {
      icon: Shield,
      title: "99.9% 정확도",
      description: "UpToDate 기반 검증된 의료 정보"
    },
    {
      icon: Users,
      title: "1,234+ 사용자",
      description: "의료진이 신뢰하는 플랫폼"
    }
  ]

  const steps = [
    "환자 정보 입력",
    "AI 자동 생성",
    "검토 및 수정",
    "서명 및 완료"
  ]

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="section-padding">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
              AI-Powered Documentation
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              수술 동의서를<br />
              <span className="text-muted-foreground">더 빠르고 정확하게</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              복잡한 수술 동의서 작성을 AI가 도와드립니다.
              의료진과 환자 모두를 위한 스마트한 솔루션.
            </p>
            
            <div className="flex gap-3 justify-center pt-4">
              <Button 
                onClick={onComplete} 
                size="lg" 
                className="px-8 h-12 text-sm font-medium active-scale"
              >
                시작하기
                <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.5} />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 h-12 text-sm font-medium border-light active-scale"
              >
                데모 보기
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-light">
        <div className="container mx-auto px-6 max-w-5xl py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`p-6 rounded-xl border transition-all ${
                  hoveredCard === index ? 'border-foreground bg-secondary' : 'border-light'
                }`}>
                  <feature.icon className="h-5 w-5 mb-4" strokeWidth={1.5} />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-light bg-secondary/30">
        <div className="container mx-auto px-6 max-w-5xl py-20">
          <h2 className="text-3xl font-bold text-center mb-12">간단한 프로세스</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 bg-white rounded-lg border border-light hover-lift cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium">{step}</span>
                  <Check className="h-4 w-4 ml-auto text-muted-foreground" strokeWidth={1.5} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-light">
        <div className="container mx-auto px-6 max-w-5xl py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-1">1,234</div>
              <div className="text-sm text-muted-foreground">동의서 생성</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">98%</div>
              <div className="text-sm text-muted-foreground">만족도</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">5분</div>
              <div className="text-sm text-muted-foreground">평균 시간</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">24/7</div>
              <div className="text-sm text-muted-foreground">지원</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-light">
        <div className="container mx-auto px-6 max-w-5xl py-20">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold">
              지금 시작하세요
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              더 나은 의료 문서 작성 경험을 제공합니다
            </p>
            <Button 
              onClick={onComplete}
              size="lg" 
              className="px-8 h-12 text-sm font-medium active-scale"
            >
              동의서 작성 시작
              <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}