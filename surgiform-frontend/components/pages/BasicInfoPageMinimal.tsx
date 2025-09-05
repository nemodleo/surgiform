"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import toast from "react-hot-toast"
import { ChevronRight } from "lucide-react"

interface BasicInfoPageProps {
  onComplete: (data: any) => void
  initialData?: any
}

export default function BasicInfoPageMinimal({ onComplete, initialData }: BasicInfoPageProps) {
  const [formData, setFormData] = useState({
    // 환자 정보
    patient_name: initialData?.patient_name || "",
    patient_id: initialData?.patient_id || "",
    patient_age: initialData?.patient_age || "",
    patient_gender: initialData?.patient_gender || "",
    insurance_type: initialData?.insurance_type || "건강보험",
    surgery_part: initialData?.surgery_part || "",
    
    // 수술 정보
    surgery_name: initialData?.surgery_name || "복강경 담낭절제",
    surgery_date: initialData?.surgery_date || "",
    symptoms: initialData?.symptoms || "",
    surgery_objective: initialData?.surgery_objective || "",
    
    // 진단 정보
    diagnosis1: initialData?.diagnosis1 || "",
    diagnosis2: initialData?.diagnosis2 || "",
    diagnosis3: initialData?.diagnosis3 || "",
    
    // 마취 정보
    anesthesia_general: initialData?.anesthesia_general || false,
    anesthesia_spinal: initialData?.anesthesia_spinal || false,
    anesthesia_epidural: initialData?.anesthesia_epidural || false,
    anesthesia_local: initialData?.anesthesia_local || false,
    anesthesia_sedation: initialData?.anesthesia_sedation || false,
    anesthesia_other: initialData?.anesthesia_other || false,
    anesthesia1: initialData?.anesthesia1 || "",
    anesthesia2: initialData?.anesthesia2 || "",
    anesthesia3: initialData?.anesthesia3 || "",
    
    // 의료진 정보
    surgeon: initialData?.surgeon || "",
    surgeonAssist: initialData?.surgeonAssist || "",
    anesthesiologist: initialData?.anesthesiologist || "",
    
    // POSSUM Score
    possum_age: initialData?.possum_age || "",
    possum_cardiac: initialData?.possum_cardiac || "",
    possum_respiratory: initialData?.possum_respiratory || "",
    possum_ecg: initialData?.possum_ecg || "",
    possum_systolic: initialData?.possum_systolic || "",
    possum_pulse: initialData?.possum_pulse || "",
    possum_hemoglobin: initialData?.possum_hemoglobin || "",
    possum_wbc: initialData?.possum_wbc || "",
    possum_urea: initialData?.possum_urea || "",
    possum_sodium: initialData?.possum_sodium || "",
    possum_potassium: initialData?.possum_potassium || "",
    possum_gcs: initialData?.possum_gcs || "",
    
    operation_magnitude: initialData?.operation_magnitude || "",
    operation_multiple: initialData?.operation_multiple || "",
    operation_blood_loss: initialData?.operation_blood_loss || "",
    operation_contamination: initialData?.operation_contamination || "",
    operation_malignancy: initialData?.operation_malignancy || "",
    operation_urgency: initialData?.operation_urgency || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.patient_name || !formData.patient_id || !formData.patient_age || !formData.patient_gender) {
      toast.error("환자 기본 정보를 모두 입력해주세요")
      return
    }
    
    if (!formData.surgery_name || !formData.surgery_date) {
      toast.error("수술 정보를 모두 입력해주세요")
      return
    }
    
    onComplete(formData)
    toast.success("기본 정보가 저장되었습니다")
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Patient Information */}
        <section className="bg-white rounded-xl border border-light p-8">
          <h2 className="text-xl font-semibold mb-6">환자 정보</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="patient_name" className="text-sm font-medium">
                환자명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="patient_name"
                value={formData.patient_name}
                onChange={(e) => setFormData({...formData, patient_name: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_id" className="text-sm font-medium">
                환자 ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="patient_id"
                value={formData.patient_id}
                onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_age" className="text-sm font-medium">
                나이 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="patient_age"
                type="number"
                value={formData.patient_age}
                onChange={(e) => setFormData({...formData, patient_age: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_gender" className="text-sm font-medium">
                성별 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.patient_gender}
                onValueChange={(value) => setFormData({...formData, patient_gender: value})}
              >
                <SelectTrigger className="h-10 border-light focus:border-foreground transition-colors">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="남성">남성</SelectItem>
                  <SelectItem value="여성">여성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="insurance_type" className="text-sm font-medium">보험 유형</Label>
              <Select
                value={formData.insurance_type}
                onValueChange={(value) => setFormData({...formData, insurance_type: value})}
              >
                <SelectTrigger className="h-10 border-light focus:border-foreground transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="건강보험">건강보험</SelectItem>
                  <SelectItem value="의료급여">의료급여</SelectItem>
                  <SelectItem value="일반">일반</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="surgery_part" className="text-sm font-medium">수술 부위</Label>
              <Input
                id="surgery_part"
                value={formData.surgery_part}
                onChange={(e) => setFormData({...formData, surgery_part: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
                placeholder="예: 복부"
              />
            </div>
          </div>
        </section>

        {/* Surgery Information */}
        <section className="bg-white rounded-xl border border-light p-8">
          <h2 className="text-xl font-semibold mb-6">수술 정보</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="surgery_name" className="text-sm font-medium">
                수술명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="surgery_name"
                value={formData.surgery_name}
                onChange={(e) => setFormData({...formData, surgery_name: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surgery_date" className="text-sm font-medium">
                수술 예정일 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="surgery_date"
                type="date"
                value={formData.surgery_date}
                onChange={(e) => setFormData({...formData, surgery_date: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="symptoms" className="text-sm font-medium">증상</Label>
              <Input
                id="symptoms"
                value={formData.symptoms}
                onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
                placeholder="환자의 주요 증상을 입력하세요"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="surgery_objective" className="text-sm font-medium">수술 목적</Label>
              <Input
                id="surgery_objective"
                value={formData.surgery_objective}
                onChange={(e) => setFormData({...formData, surgery_objective: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
                placeholder="수술의 목적을 입력하세요"
              />
            </div>
          </div>
        </section>

        {/* Diagnosis Information */}
        <section className="bg-white rounded-xl border border-light p-8">
          <h2 className="text-xl font-semibold mb-6">진단명</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="diagnosis1" className="text-sm font-medium">주진단</Label>
              <Input
                id="diagnosis1"
                value={formData.diagnosis1}
                onChange={(e) => setFormData({...formData, diagnosis1: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosis2" className="text-sm font-medium">부진단 1</Label>
              <Input
                id="diagnosis2"
                value={formData.diagnosis2}
                onChange={(e) => setFormData({...formData, diagnosis2: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosis3" className="text-sm font-medium">부진단 2</Label>
              <Input
                id="diagnosis3"
                value={formData.diagnosis3}
                onChange={(e) => setFormData({...formData, diagnosis3: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Anesthesia Information */}
        <section className="bg-white rounded-xl border border-light p-8">
          <h2 className="text-xl font-semibold mb-6">마취 방법</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              { id: 'anesthesia_general', label: '전신마취' },
              { id: 'anesthesia_spinal', label: '척추마취' },
              { id: 'anesthesia_epidural', label: '경막외마취' },
              { id: 'anesthesia_local', label: '국소마취' },
              { id: 'anesthesia_sedation', label: '진정' },
              { id: 'anesthesia_other', label: '기타' }
            ].map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox
                  id={item.id}
                  checked={formData[item.id as keyof typeof formData] as boolean}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, [item.id]: checked})
                  }
                  className="border-light data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label 
                  htmlFor={item.id} 
                  className="text-sm font-normal cursor-pointer"
                >
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </section>

        {/* Medical Staff Information */}
        <section className="bg-white rounded-xl border border-light p-8">
          <h2 className="text-xl font-semibold mb-6">의료진 정보</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="surgeon" className="text-sm font-medium">집도의</Label>
              <Input
                id="surgeon"
                value={formData.surgeon}
                onChange={(e) => setFormData({...formData, surgeon: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surgeonAssist" className="text-sm font-medium">보조의</Label>
              <Input
                id="surgeonAssist"
                value={formData.surgeonAssist}
                onChange={(e) => setFormData({...formData, surgeonAssist: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anesthesiologist" className="text-sm font-medium">마취의</Label>
              <Input
                id="anesthesiologist"
                value={formData.anesthesiologist}
                onChange={(e) => setFormData({...formData, anesthesiologist: e.target.value})}
                className="h-10 border-light focus:border-foreground transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-6">
          <Button type="button" variant="outline" className="px-6 h-11 border-light">
            취소
          </Button>
          <Button type="submit" className="px-8 h-11">
            다음 단계
            <ChevronRight className="ml-2 h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </form>
    </div>
  )
}