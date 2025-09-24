"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X, Calculator } from "lucide-react"

// POSSUM physiological variables
const physiologicalVariables = {
  "Age": {
    "options": ["≤ 60", "61-70", "≥ 71"],
    "scores": [1, 2, 4]
  },
  "Cardiac signs | Chest X-ray": {
    "options": [
      "Normal",
      "Cardiac drugs or steroids",
      "Oedema; warfarin | Borderline cardiomegaly",
      "Jugular venous pressure | Cardiomegaly"
    ],
    "scores": [1, 2, 4, 8]
  },
  "Respiratory signs | Chest X-ray": {
    "options": [
      "Normal",
      "Shortness of breath on exertion | Mild chronic obstructive airway disease",
      "Shortness of breath on stairs | Moderate chronic obstructive airway disease",
      "Shortness of breath at rest | Any other change"
    ],
    "scores": [1, 2, 4, 8]
  },
  "Systolic blood pressure (mmHg)": {
    "options": ["110-130", "131-170 or 100-109", "≥ 171 or 90-99", "≤ 89"],
    "scores": [1, 2, 4, 8]
  },
  "Pulse rate (bpm)": {
    "options": ["50-80", "81-100 or 40-49", "101-120 or ≤ 39", "≥ 121"],
    "scores": [1, 2, 4, 8]
  },
  "Glasgow Coma Scale": {
    "options": ["15", "12-14", "9-11", "≤ 8"],
    "scores": [1, 2, 4, 8]
  },
  "Hemoglobin (g/dL)": {
    "options": [
      "13-16 (male), 11.5-14.5 (female)",
      "10-12.9 or 16.1-17",
      "8-9.9 or 17.1-18",
      "≤ 7.9 or ≥ 18.1"
    ],
    "scores": [1, 2, 4, 8]
  },
  "White cell count (×10⁹/L)": {
    "options": ["4-10", "10.1-20 or 3.1-3.9", "≥ 20.1 or ≤ 3", "N/A"],
    "scores": [1, 2, 4, 8]
  },
  "Urea (mmol/L)": {
    "options": ["≤ 7.5", "7.6-10", "10.1-15", "≥ 15.1"],
    "scores": [1, 2, 4, 8]
  },
  "Sodium (mmol/L)": {
    "options": ["≥ 136", "131-135", "126-130", "≤ 125"],
    "scores": [1, 2, 4, 8]
  },
  "Potassium (mmol/L)": {
    "options": ["3.5-5", "3.2-3.4 or 5.1-5.3", "2.9-3.1 or 5.4-5.9", "≤ 2.8 or ≥ 6"],
    "scores": [1, 2, 4, 8]
  },
  "ECG": {
    "options": [
      "Normal",
      "Atrial fibrillation (rate 60-90)",
      "Other arrhythmia or minor abnormality",
      "Ventricular arrhythmia or multiple abnormalities"
    ],
    "scores": [1, 2, 4, 8]
  }
}

// Operative variables
const operativeVariables = {
  "Operative severity": {
    "options": ["Minor", "Intermediate", "Major", "Major+"],
    "scores": [1, 2, 4, 8]
  },
  "Multiple procedures": {
    "options": ["No", "Yes, 2 procedures", "Yes, major procedure", "Yes, >1 major procedure"],
    "scores": [1, 2, 4, 8]
  },
  "Total blood loss (ml)": {
    "options": ["< 100", "100-500", "501-999", "≥ 1000"],
    "scores": [1, 2, 4, 8]
  },
  "Peritoneal soiling": {
    "options": ["None", "Minor (serous fluid)", "Local pus", "Free pus or blood or feces"],
    "scores": [1, 2, 4, 8]
  },
  "Presence of malignancy": {
    "options": ["None", "Primary only", "Nodal mets", "Distant mets"],
    "scores": [1, 2, 4, 8]
  },
  "Timing of surgery": {
    "options": ["Elective", "Emergency (within 24h)", "Emergency (within 6h)", "Emergency (immediate)"],
    "scores": [1, 2, 4, 8]
  }
}

interface PossumResults {
  mortality_risk: number
  morbidity_risk: number
}

interface PossumCalculatorProps {
  isOpen: boolean
  onClose: () => void
  onCalculate: (results: PossumResults) => void
}

export default function PossumCalculator({ isOpen, onClose, onCalculate }: PossumCalculatorProps) {
  const [physiologicalSelections, setPhysiologicalSelections] = useState<Record<string, string>>({})
  const [operativeSelections, setOperativeSelections] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const getScore = (variable: string, type: 'physiological' | 'operative'): number => {
    const selections = type === 'physiological' ? physiologicalSelections : operativeSelections
    const selected = selections[variable]

    if (!selected) return 0

    if (type === 'physiological') {
      const variableData = physiologicalVariables[variable as keyof typeof physiologicalVariables]
      if (!variableData) return 0
      const optionIndex = variableData.options.indexOf(selected)
      return optionIndex !== -1 ? variableData.scores[optionIndex] : 0
    } else {
      const variableData = operativeVariables[variable as keyof typeof operativeVariables]
      if (!variableData) return 0
      const optionIndex = variableData.options.indexOf(selected)
      return optionIndex !== -1 ? variableData.scores[optionIndex] : 0
    }
  }

  const calculateTotalScore = (type: 'physiological' | 'operative'): number => {
    const variables = type === 'physiological' ? physiologicalVariables : operativeVariables

    return Object.keys(variables).reduce((total, variable) => {
      return total + getScore(variable, type)
    }, 0)
  }

  const calculateRisk = () => {
    const physiologicalScore = calculateTotalScore('physiological')
    const operativeScore = calculateTotalScore('operative')

    if (physiologicalScore === 0 || operativeScore === 0) {
      alert("모든 생리학적 및 수술적 평가를 완료해 주세요.")
      return
    }

    // POSSUM equations
    // Mortality: ln(R1/(1-R1)) = -9.065 + 0.1692 * physiological + 0.1550 * operative
    // Morbidity: ln(R2/(1-R2)) = -5.91 + 0.16 * physiological + 0.19 * operative

    const logitMortality = -9.065 + 0.1692 * physiologicalScore + 0.1550 * operativeScore
    const logitMorbidity = -5.91 + 0.16 * physiologicalScore + 0.19 * operativeScore

    const mortalityRisk = 1 / (1 + Math.exp(-logitMortality))
    const morbidityRisk = 1 / (1 + Math.exp(-logitMorbidity))

    const results = {
      mortality_risk: mortalityRisk,
      morbidity_risk: morbidityRisk
    }

    onCalculate(results)
    onClose()
  }

  const handlePhysiologicalChange = (variable: string, value: string) => {
    setPhysiologicalSelections(prev => ({ ...prev, [variable]: value }))
  }

  const handleOperativeChange = (variable: string, value: string) => {
    setOperativeSelections(prev => ({ ...prev, [variable]: value }))
  }

  const physiologicalScore = calculateTotalScore('physiological')
  const operativeScore = calculateTotalScore('operative')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">POSSUM Calculator</h2>
              <p className="text-sm text-slate-600">Physiological and Operative Severity Score for the enUmeration of Mortality and Morbidity</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-8">
            {/* Physiological Score Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">생리학적 점수 (Physiological Score)</h3>
                <div className="text-sm font-medium text-blue-600">총점: {physiologicalScore}</div>
              </div>

              <div className="grid gap-6">
                {Object.entries(physiologicalVariables).map(([variable, data], index) => (
                  <div key={variable} className="bg-slate-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-slate-700 mb-3 block">
                      {index + 1}. {variable}
                    </Label>
                    <div className="space-y-2">
                      {data.options.map((option, optionIndex) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`physio_${variable}`}
                            value={option}
                            checked={physiologicalSelections[variable] === option}
                            onChange={(e) => handlePhysiologicalChange(variable, e.target.value)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-slate-700">
                            {option} <span className="text-blue-600 font-medium">({data.scores[optionIndex]})</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operative Score Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">수술적 점수 (Operative Score)</h3>
                <div className="text-sm font-medium text-green-600">총점: {operativeScore}</div>
              </div>

              <div className="grid gap-6">
                {Object.entries(operativeVariables).map(([variable, data], index) => (
                  <div key={variable} className="bg-slate-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-slate-700 mb-3 block">
                      {index + 1}. {variable}
                    </Label>
                    <div className="space-y-2">
                      {data.options.map((option, optionIndex) => (
                        <label key={option} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`opera_${variable}`}
                            value={option}
                            checked={operativeSelections[variable] === option}
                            onChange={(e) => handleOperativeChange(variable, e.target.value)}
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="text-sm text-slate-700">
                            {option} <span className="text-green-600 font-medium">({data.scores[optionIndex]})</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-slate-600">생리학적 점수:</span>
                <span className="font-semibold text-blue-600 ml-2">{physiologicalScore}</span>
              </div>
              <div>
                <span className="text-slate-600">수술적 점수:</span>
                <span className="font-semibold text-green-600 ml-2">{operativeScore}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                취소
              </Button>
              <Button
                onClick={calculateRisk}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                위험도 계산
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}