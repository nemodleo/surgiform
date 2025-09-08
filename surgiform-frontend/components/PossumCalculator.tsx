"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface PossumScore {
  physiological_score: number
  surgery_score: number
  mortality_risk: number
  morbidity_risk: number
}

interface PossumCalculatorProps {
  onComplete: (score: PossumScore) => void
  onCancel: () => void
}

const POSSUM_VARIABLES = {
  age: {
    label: "나이",
    options: [
      { value: 1, label: "≤60" },
      { value: 2, label: "61-70" },
      { value: 4, label: "≥71" }
    ]
  },
  cardiac: {
    label: "심장 징후",
    options: [
      { value: 1, label: "정상" },
      { value: 2, label: "심장약물 복용 중" },
      { value: 4, label: "부종, 와파린, 경계성 심비대" },
      { value: 8, label: "상승된 경정맥압, 심비대" }
    ]
  },
  respiratory: {
    label: "호흡기 징후",
    options: [
      { value: 1, label: "정상" },
      { value: 2, label: "호흡곤란(운동시), 경증 COPD" },
      { value: 4, label: "호흡곤란(계단 1층), 중등도 COPD" },
      { value: 8, label: "휴식시 호흡곤란, 중증 COPD" }
    ]
  },
  systolic_bp: {
    label: "수축기 혈압",
    options: [
      { value: 1, label: "110-130 mmHg" },
      { value: 2, label: "131-170 또는 100-109 mmHg" },
      { value: 4, label: "≥171 또는 90-99 mmHg" },
      { value: 8, label: "≤89 mmHg" }
    ]
  },
  pulse: {
    label: "맥박",
    options: [
      { value: 1, label: "50-80 bpm" },
      { value: 2, label: "81-100 또는 40-49 bpm" },
      { value: 4, label: "101-120 bpm" },
      { value: 8, label: "≥121 또는 ≤39 bpm" }
    ]
  },
  glasgow_coma_scale: {
    label: "Glasgow Coma Scale",
    options: [
      { value: 1, label: "15" },
      { value: 2, label: "12-14" },
      { value: 4, label: "9-11" },
      { value: 8, label: "≤8" }
    ]
  },
  hemoglobin: {
    label: "헤모글로빈",
    options: [
      { value: 1, label: "13-16 g/dL" },
      { value: 2, label: "11.5-12.9 또는 16.1-17 g/dL" },
      { value: 4, label: "10-11.4 또는 17.1-18 g/dL" },
      { value: 8, label: "≤9.9 또는 ≥18.1 g/dL" }
    ]
  },
  wbc: {
    label: "백혈구 수",
    options: [
      { value: 1, label: "4-10 ×10⁹/L" },
      { value: 2, label: "10.1-20 또는 3.1-3.9 ×10⁹/L" },
      { value: 4, label: "≥20.1 또는 ≤3 ×10⁹/L" }
    ]
  },
  urea: {
    label: "요소",
    options: [
      { value: 1, label: "≤7.5 mmol/L" },
      { value: 2, label: "7.6-10 mmol/L" },
      { value: 4, label: "10.1-15 mmol/L" },
      { value: 8, label: "≥15.1 mmol/L" }
    ]
  },
  sodium: {
    label: "나트륨",
    options: [
      { value: 1, label: "≥136 mmol/L" },
      { value: 2, label: "131-135 mmol/L" },
      { value: 4, label: "126-130 mmol/L" },
      { value: 8, label: "≤125 mmol/L" }
    ]
  },
  potassium: {
    label: "칼륨",
    options: [
      { value: 1, label: "3.5-5 mmol/L" },
      { value: 2, label: "3.2-3.4 또는 5.1-5.3 mmol/L" },
      { value: 4, label: "2.9-3.1 또는 5.4-5.9 mmol/L" },
      { value: 8, label: "≤2.8 또는 ≥6 mmol/L" }
    ]
  },
  ecg: {
    label: "심전도",
    options: [
      { value: 1, label: "정상" },
      { value: 4, label: "심방세동(60-90 bpm)" },
      { value: 8, label: "기타 비정상 리듬, ≥5 이소성/분, Q파, ST/T파 변화" }
    ]
  }
}

const SURGERY_SEVERITY = {
  label: "수술 중증도",
  options: [
    { value: 1, label: "경증 (예: 탈장 수술)" },
    { value: 2, label: "중등도 (예: 담낭절제술)" },
    { value: 4, label: "중증 (예: 대장절제술)" },
    { value: 8, label: "매우 중증 (예: 심장 수술)" }
  ]
}

export default function PossumCalculator({ onComplete, onCancel }: PossumCalculatorProps) {
  const [physiologicalScores, setPhysiologicalScores] = useState<Record<string, number>>({})
  const [surgeryScore, setSurgeryScore] = useState<number>(1)

  const handlePhysiologicalChange = (variable: string, value: string) => {
    setPhysiologicalScores(prev => ({
      ...prev,
      [variable]: parseInt(value)
    }))
  }

  const calculateScore = () => {
    const physiologicalTotal = Object.values(physiologicalScores).reduce((sum, val) => sum + val, 0)
    
    const logitMortality = -7.04 + (0.13 * Math.log(physiologicalTotal)) + (0.16 * Math.log(surgeryScore))
    const mortalityRisk = 1 / (1 + Math.exp(-logitMortality))
    
    const logitMorbidity = -5.91 + (0.16 * Math.log(physiologicalTotal)) + (0.19 * Math.log(surgeryScore))
    const morbidityRisk = 1 / (1 + Math.exp(-logitMorbidity))

    onComplete({
      physiological_score: physiologicalTotal,
      surgery_score: surgeryScore,
      mortality_risk: mortalityRisk,
      morbidity_risk: morbidityRisk
    })
  }

  const isComplete = Object.keys(physiologicalScores).length === Object.keys(POSSUM_VARIABLES).length

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>POSSUM Score 계산기</CardTitle>
          <CardDescription>
            수술 위험도를 평가하기 위한 생리학적 점수를 계산합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(POSSUM_VARIABLES).map(([key, variable]) => (
              <div key={key} className="space-y-2">
                <Label>{variable.label}</Label>
                <Select
                  value={physiologicalScores[key]?.toString()}
                  onValueChange={(value) => handlePhysiologicalChange(key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {variable.options.map(option => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>{SURGERY_SEVERITY.label}</Label>
            <Select
              value={surgeryScore.toString()}
              onValueChange={(value) => setSurgeryScore(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {SURGERY_SEVERITY.options.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onCancel}>
              취소
            </Button>
            <Button onClick={calculateScore} disabled={!isComplete}>
              계산 완료
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}