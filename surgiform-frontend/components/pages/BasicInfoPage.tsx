"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import toast from "react-hot-toast"

interface BasicInfoPageProps {
  onComplete: (data: any) => void
  initialData?: any
}

export default function BasicInfoPage({ onComplete, initialData }: BasicInfoPageProps) {
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
    assistant: initialData?.assistant || "",
    anesthesiologist: initialData?.anesthesiologist || "",
    nurse: initialData?.nurse || "",
    recovery_nurse: initialData?.recovery_nurse || "",
    ward_nurse: initialData?.ward_nurse || "",
    scrub_nurse: initialData?.scrub_nurse || "",
    resident: initialData?.resident || "",
    intern: initialData?.intern || "",
    other_personnel: initialData?.other_personnel || "",
    
    // 체크박스
    surgeon_check: initialData?.surgeon_check || false,
    assistant_check: initialData?.assistant_check || false,
    anesthesiologist_check: initialData?.anesthesiologist_check || false,
    nurse_check: initialData?.nurse_check || false,
    recovery_nurse_check: initialData?.recovery_nurse_check || false,
    ward_nurse_check: initialData?.ward_nurse_check || false,
    scrub_nurse_check: initialData?.scrub_nurse_check || false,
    resident_check: initialData?.resident_check || false,
    intern_check: initialData?.intern_check || false,
    
    // 성별 분석
    gender_analysis: initialData?.gender_analysis || "",
    exclude_limit: initialData?.exclude_limit || false,
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.patient_name || !formData.patient_age || !formData.patient_gender || !formData.surgery_name) {
      toast.error('필수 항목을 모두 입력해주세요')
      return
    }
    
    onComplete(formData)
    toast.success('기본 정보가 저장되었습니다')
  }

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }))
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="border-gray-300">
        <CardHeader className="bg-gray-50 border-b border-gray-300">
          <CardTitle className="text-center text-xl text-black">
            Reference Textbook 조회를 위한 기본 정보를 입력해주세요.
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 수술 정보 섹션 */}
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-black">복강경 담낭절제</h3>
                <Button type="button" variant="outline" size="sm" className="border-gray-300">
                  ◎ 수술 동의서
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="patient_id" className="text-sm">환자번호</Label>
                  <Input
                    id="patient_id"
                    value={formData.patient_id}
                    onChange={(e) => handleChange('patient_id', e.target.value)}
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patient_name" className="text-sm">환자명 *</Label>
                  <Input
                    id="patient_name"
                    value={formData.patient_name}
                    onChange={(e) => handleChange('patient_name', e.target.value)}
                    className="border-gray-300"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="text-sm">나이/성별</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="patient_age"
                      value={formData.patient_age}
                      onChange={(e) => handleChange('patient_age', e.target.value)}
                      placeholder="나이"
                      className="border-gray-300 w-20"
                      required
                    />
                    <span className="text-sm">세 /</span>
                    <Select
                      value={formData.patient_gender}
                      onValueChange={(value) => handleChange('patient_gender', value)}
                    >
                      <SelectTrigger className="border-gray-300 w-24">
                        <SelectValue placeholder="성별" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="남">남</SelectItem>
                        <SelectItem value="여">여</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insurance_type" className="text-sm">사회보험별</Label>
                  <Select
                    value={formData.insurance_type}
                    onValueChange={(value) => handleChange('insurance_type', value)}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="건강보험">건강보험 - 질병분류 (대처사리) 질환</SelectItem>
                      <SelectItem value="의료급여">의료급여</SelectItem>
                      <SelectItem value="산재보험">산재보험</SelectItem>
                      <SelectItem value="자동차보험">자동차보험</SelectItem>
                      <SelectItem value="일반">일반</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">수술부위분석</Label>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender_analysis"
                      value="남"
                      checked={formData.gender_analysis === '남'}
                      onChange={(e) => handleChange('gender_analysis', e.target.value)}
                      className="text-green-dark"
                    />
                    <span className="text-sm">남</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender_analysis"
                      value="여"
                      checked={formData.gender_analysis === '여'}
                      onChange={(e) => handleChange('gender_analysis', e.target.value)}
                    />
                    <span className="text-sm">여</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender_analysis"
                      value="Both"
                      checked={formData.gender_analysis === 'Both'}
                      onChange={(e) => handleChange('gender_analysis', e.target.value)}
                    />
                    <span className="text-sm">Both</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox 
                      checked={formData.exclude_limit}
                      onCheckedChange={(checked) => handleCheckboxChange('exclude_limit', checked as boolean)}
                    />
                    <span className="text-sm">제한없음</span>
                  </label>
                </div>
                <Input
                  value={formData.surgery_part}
                  onChange={(e) => handleChange('surgery_part', e.target.value)}
                  className="border-gray-300"
                  placeholder="(수술부위)"
                />
              </div>
            </div>

            {/* 참여 의료진 정보 */}
            <div className="space-y-2">
              <p className="text-xs text-gray-600">
                ※ 참여 의료진 대표의사 대수련 질환 분포 기준에 우선기 여부(□=Y)
              </p>
            </div>

            {/* 진단 정보 섹션 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">청도의</Label>
                <Input
                  value={formData.diagnosis1}
                  onChange={(e) => handleChange('diagnosis1', e.target.value)}
                  className="border-gray-300"
                />
                <Input
                  value={formData.diagnosis2}
                  onChange={(e) => handleChange('diagnosis2', e.target.value)}
                  className="border-gray-300"
                />
                <Input
                  value={formData.diagnosis3}
                  onChange={(e) => handleChange('diagnosis3', e.target.value)}
                  className="border-gray-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">마취의방법</Label>
                <div className="space-y-2">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <Checkbox 
                        checked={formData.anesthesia_general}
                        onCheckedChange={(checked) => handleCheckboxChange('anesthesia_general', checked as boolean)}
                      />
                      <span className="text-sm">전신욕</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <Checkbox 
                        checked={formData.anesthesia_spinal}
                        onCheckedChange={(checked) => handleCheckboxChange('anesthesia_spinal', checked as boolean)}
                      />
                      <span className="text-sm">척추욕</span>
                    </label>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <Checkbox 
                        checked={formData.anesthesia_epidural}
                        onCheckedChange={(checked) => handleCheckboxChange('anesthesia_epidural', checked as boolean)}
                      />
                      <span className="text-sm">경막욕</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <Checkbox 
                        checked={formData.anesthesia_local}
                        onCheckedChange={(checked) => handleCheckboxChange('anesthesia_local', checked as boolean)}
                      />
                      <span className="text-sm">일부마취</span>
                    </label>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <Checkbox 
                        checked={formData.anesthesia_other}
                        onCheckedChange={(checked) => handleCheckboxChange('anesthesia_other', checked as boolean)}
                      />
                      <span className="text-sm">강진욕</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <Checkbox 
                        checked={formData.anesthesia_sedation}
                        onCheckedChange={(checked) => handleCheckboxChange('anesthesia_sedation', checked as boolean)}
                      />
                      <span className="text-sm">일반마취</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">마취과목</Label>
                <Input
                  value={formData.anesthesia1}
                  onChange={(e) => handleChange('anesthesia1', e.target.value)}
                  className="border-gray-300"
                />
                <Input
                  value={formData.anesthesia2}
                  onChange={(e) => handleChange('anesthesia2', e.target.value)}
                  className="border-gray-300"
                />
                <Input
                  value={formData.anesthesia3}
                  onChange={(e) => handleChange('anesthesia3', e.target.value)}
                  className="border-gray-300"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              *다음의 실무 내용은 선택된 정보가 질환 분포의시험판입니다 자체에 탐시된 시험 플릭의 새로운 정보와나 분야에는 원이 권한이나되지가자료가 어씨어 아이 힌디어트를 검날를 소 도토록 파지 어이 적이 갈단니다.
            </p>

            {/* 의료진 정보 테이블 */}
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2">
                <h3 className="font-semibold text-sm">1. 참여 실무 및 의료사별</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="text-left p-3 text-sm font-medium">의기본의(활동) 내활사/은</th>
                    <th className="text-center p-3 text-sm font-medium w-20">○ 참 촉 부</th>
                    <th className="text-left p-3 text-sm font-medium">담뇨병</th>
                    <th className="text-center p-3 text-sm font-medium w-20">○ 참 촉 부</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="p-3">
                      <Input
                        value={formData.surgeon}
                        onChange={(e) => handleChange('surgeon', e.target.value)}
                        placeholder="출전남부"
                        className="border-gray-300"
                      />
                    </td>
                    <td className="text-center p-3">
                      <Checkbox
                        checked={formData.surgeon_check}
                        onCheckedChange={(checked) => handleCheckboxChange('surgeon_check', checked as boolean)}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        value={formData.nurse}
                        onChange={(e) => handleChange('nurse', e.target.value)}
                        placeholder="담뇨병"
                        className="border-gray-300"
                      />
                    </td>
                    <td className="text-center p-3">
                      <Checkbox
                        checked={formData.nurse_check}
                        onCheckedChange={(checked) => handleCheckboxChange('nurse_check', checked as boolean)}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3">
                      <Input
                        value={formData.assistant}
                        onChange={(e) => handleChange('assistant', e.target.value)}
                        placeholder="조원상부"
                        className="border-gray-300"
                      />
                    </td>
                    <td className="text-center p-3">
                      <Checkbox
                        checked={formData.assistant_check}
                        onCheckedChange={(checked) => handleCheckboxChange('assistant_check', checked as boolean)}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        value={formData.scrub_nurse}
                        onChange={(e) => handleChange('scrub_nurse', e.target.value)}
                        placeholder="고활간"
                        className="border-gray-300"
                      />
                    </td>
                    <td className="text-center p-3">
                      <Checkbox
                        checked={formData.scrub_nurse_check}
                        onCheckedChange={(checked) => handleCheckboxChange('scrub_nurse_check', checked as boolean)}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3">
                      <Input
                        value={formData.anesthesiologist}
                        onChange={(e) => handleChange('anesthesiologist', e.target.value)}
                        placeholder="물제한과 울의 관련개병원"
                        className="border-gray-300"
                      />
                    </td>
                    <td className="text-center p-3">
                      <Checkbox
                        checked={formData.anesthesiologist_check}
                        onCheckedChange={(checked) => handleCheckboxChange('anesthesiologist_check', checked as boolean)}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        value={formData.resident}
                        onChange={(e) => handleChange('resident', e.target.value)}
                        placeholder="지활간"
                        className="border-gray-300"
                      />
                    </td>
                    <td className="text-center p-3">
                      <Checkbox
                        checked={formData.resident_check}
                        onCheckedChange={(checked) => handleCheckboxChange('resident_check', checked as boolean)}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3">
                      <Input
                        value={formData.recovery_nurse}
                        onChange={(e) => handleChange('recovery_nurse', e.target.value)}
                        placeholder="기누미별"
                        className="border-gray-300"
                      />
                    </td>
                    <td className="text-center p-3">
                      <Checkbox
                        checked={formData.recovery_nurse_check}
                        onCheckedChange={(checked) => handleCheckboxChange('recovery_nurse_check', checked as boolean)}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        value={formData.ward_nurse}
                        onChange={(e) => handleChange('ward_nurse', e.target.value)}
                        placeholder="일획관과 관련 협활"
                        className="border-gray-300"
                      />
                    </td>
                    <td className="text-center p-3">
                      <Checkbox
                        checked={formData.ward_nurse_check}
                        onCheckedChange={(checked) => handleCheckboxChange('ward_nurse_check', checked as boolean)}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3">
                      <Input
                        value={formData.intern}
                        onChange={(e) => handleChange('intern', e.target.value)}
                        placeholder="복원미병"
                        className="border-gray-300"
                      />
                    </td>
                    <td className="text-center p-3">
                      <Checkbox
                        checked={formData.intern_check}
                        onCheckedChange={(checked) => handleCheckboxChange('intern_check', checked as boolean)}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        placeholder="신경정쟁"
                        className="border-gray-300"
                      />
                    </td>
                    <td className="text-center p-3">
                      <Checkbox />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      <Input
                        value={formData.other_personnel}
                        onChange={(e) => handleChange('other_personnel', e.target.value)}
                        placeholder="의미특성 또는 의료실인"
                        className="border-gray-300"
                      />
                    </td>
                    <td className="text-center p-3">
                      <Checkbox />
                    </td>
                    <td className="p-3">
                      <Input
                        placeholder="기타"
                        className="border-gray-300"
                      />
                    </td>
                    <td className="text-center p-3">
                      <Checkbox />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                size="lg"
                className="bg-green-dark hover:bg-green-darker text-white px-8"
              >
                수술 동의서 생성하기 →
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}