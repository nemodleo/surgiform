"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Clock, CheckCircle, FileText, Shield, Sparkles, TrendingUp, Users, Zap } from "lucide-react"

interface MainPageProps {
  onComplete: () => void
}

export default function MainPageModern({ onComplete }: MainPageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white">
      {/* Hero Section with Gradient Mesh */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30"></div>
        <div className="container mx-auto px-4 pt-20 pb-32 max-w-7xl relative z-10">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Medical Documentation</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
              <span className="text-gradient">SurgiForm</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              빠르고 정확한 수술 동의서 작성을 위한 차세대 AI 플랫폼
            </p>
            
            <div className="flex gap-4 justify-center pt-8">
              <Button 
                onClick={onComplete} 
                size="lg" 
                className="gradient-primary text-white px-8 py-6 text-lg rounded-xl shadow-card hover:shadow-hover transition-all-smooth group"
              >
                시작하기
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-6 text-lg rounded-xl border-2 hover:bg-secondary transition-all-smooth"
              >
                데모 보기
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-b from-secondary/50 to-transparent">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: FileText, value: "1,234+", label: "생성된 동의서", trend: "+23%" },
              { icon: Users, value: "98%", label: "만족도", trend: "+5%" },
              { icon: Clock, value: "5분", label: "평균 작성 시간", trend: "-45%" },
              { icon: TrendingUp, value: "99.9%", label: "정확도", trend: "최고" }
            ].map((stat, index) => (
              <div 
                key={index} 
                className="text-center group hover:scale-105 transition-all-smooth cursor-pointer"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-all-smooth">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-muted-foreground text-sm mb-2">{stat.label}</div>
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                  <TrendingUp className="w-3 h-3" />
                  {stat.trend}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold">주요 기능</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              의료진과 환자 모두를 위한 혁신적인 기능들
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: "빠른 처리",
                description: "AI가 복잡한 의료 정보를 즉시 처리하여 시간을 절약합니다",
                color: "bg-yellow-500"
              },
              {
                icon: Shield,
                title: "높은 신뢰성",
                description: "UpToDate 기반 검증된 의료 정보만을 사용합니다",
                color: "bg-green-500"
              },
              {
                icon: FileText,
                title: "맞춤형 문서",
                description: "환자별 특성을 반영한 개인화된 동의서를 생성합니다",
                color: "bg-blue-500"
              },
              {
                icon: CheckCircle,
                title: "완벽한 검증",
                description: "자동 검토 시스템으로 누락 없는 완벽한 문서를 보장합니다",
                color: "bg-purple-500"
              }
            ].map((feature, index) => (
              <Card 
                key={index}
                className="border-0 shadow-card hover:shadow-hover transition-all-smooth cursor-pointer group"
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.color} text-white mb-4 ${hoveredFeature === index ? 'scale-110' : ''} transition-transform`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold">간단한 4단계 프로세스</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              복잡한 절차 없이 빠르게 완성되는 동의서
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "정보 입력", description: "환자 기본 정보와 수술 정보 입력" },
              { step: "2", title: "AI 생성", description: "맞춤형 수술 설명 및 위험도 자동 생성" },
              { step: "3", title: "검토 및 수정", description: "생성된 내용 검토 및 필요시 수정" },
              { step: "4", title: "서명 및 완료", description: "전자 서명 후 PDF 다운로드" }
            ].map((step, index) => (
              <div key={index} className="relative">
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/20 -z-10" />
                )}
                <div className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary text-white text-xl font-bold mb-4 group-hover:scale-110 transition-transform">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-0 shadow-card overflow-hidden">
            <div className="gradient-primary p-12 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">
                지금 바로 시작하세요
              </h2>
              <p className="text-xl mb-8 opacity-95">
                더 빠르고 정확한 수술 동의서 작성을 경험해보세요
              </p>
              <Button 
                onClick={onComplete}
                size="lg" 
                variant="secondary"
                className="px-8 py-6 text-lg rounded-xl hover:shadow-hover transition-all-smooth"
              >
                동의서 작성 시작
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}