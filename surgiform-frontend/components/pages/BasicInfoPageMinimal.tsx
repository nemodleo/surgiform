"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"
import { ChevronRight, Plus, Trash2, AlertCircle, Check, Loader2, Calculator } from "lucide-react"
import PossumCalculator from "@/components/possum/PossumCalculator"

interface MedicalTeamMember {
  name: string
  is_specialist: boolean
  department: string
}

interface FormData {
  registration_number: string
  patient_name: string
  patient_age: string
  patient_gender: string
  surgery_name: string
  surgery_date: string
  diagnosis: string
  diagnosis_detail: string
  surgery_site: string
  surgery_site_detail: string
  medical_team: MedicalTeamMember[]
  medical_history: boolean
  smoking: boolean
  allergy: boolean
  airway_abnormal: boolean
  respiratory_disease: boolean
  medication: boolean
  drug_abuse: boolean
  diabetes: boolean
  hypertension: boolean
  hypotension: boolean
  cardiovascular: boolean
  blood_coagulation: boolean
  kidney_disease: boolean
  other_conditions: string
  mortality_risk: number | string
  morbidity_risk: number | string
}

interface BasicInfoPageProps {
  onComplete: (data: FormData) => void
  initialData?: Partial<FormData>
}

export default function BasicInfoPageMinimal({ onComplete, initialData }: BasicInfoPageProps) {
  const [formData, setFormData] = useState<FormData>({
    registration_number: initialData?.registration_number || "",
    patient_name: initialData?.patient_name || "",
    patient_age: initialData?.patient_age || "",
    patient_gender: initialData?.patient_gender || "",
    surgery_name: initialData?.surgery_name || "",
    surgery_date: initialData?.surgery_date || "",
    diagnosis: initialData?.diagnosis || "",
    diagnosis_detail: initialData?.diagnosis_detail || "",
    surgery_site: initialData?.surgery_site || "",
    surgery_site_detail: initialData?.surgery_site_detail || "",
    medical_team: initialData?.medical_team || [
      { name: "", is_specialist: true, department: "" }
    ],
    medical_history: initialData?.medical_history || false,
    smoking: initialData?.smoking || false,
    allergy: initialData?.allergy || false,
    airway_abnormal: initialData?.airway_abnormal || false,
    respiratory_disease: initialData?.respiratory_disease || false,
    medication: initialData?.medication || false,
    drug_abuse: initialData?.drug_abuse || false,
    diabetes: initialData?.diabetes || false,
    hypertension: initialData?.hypertension || false,
    hypotension: initialData?.hypotension || false,
    cardiovascular: initialData?.cardiovascular || false,
    blood_coagulation: initialData?.blood_coagulation || false,
    kidney_disease: initialData?.kidney_disease || false,
    other_conditions: initialData?.other_conditions || "",
    mortality_risk: initialData?.mortality_risk || "",
    morbidity_risk: initialData?.morbidity_risk || "",
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({})
  const [isValidating, setIsValidating] = useState<Partial<Record<keyof FormData, boolean>>>({})
  const [isPossumOpen, setIsPossumOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedFields, setCompletedFields] = useState<Set<keyof FormData>>(new Set())
  const [isComposing, setIsComposing] = useState(false)
  
  // Refs for auto-focus on error
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({})

  // Track if form has already been submitted to prevent duplicate submissions
  const hasSubmittedRef = useRef(false)

  // Reset submission flag when component unmounts
  useEffect(() => {
    return () => {
      hasSubmittedRef.current = false
    }
  }, [])

  // Auto-format registration number with hyphen (XXXX-XXXX format)
  const formatRegistrationNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 4) return numbers
    if (numbers.length <= 8) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 8)}`
  }

  // Real-time validation with debounce (skip during IME composition)
  useEffect(() => {
    if (isComposing) return // Skip validation during IME composition
    
    const timer = setTimeout(() => {
      Object.keys(touched).forEach(field => {
        if (touched[field as keyof FormData]) {
          validateField(field as keyof FormData, formData[field as keyof FormData], false)
        }
      })
    }, 500) // Increased delay for better Korean input
    return () => clearTimeout(timer)
  }, [formData, touched, isComposing])

  // Comprehensive validation function
  const validateField = useCallback(async (field: keyof FormData, value: unknown, showLoading = true) => {
    const newErrors = { ...errors }
    let isValid = false
    
    if (showLoading) {
      setIsValidating({ ...isValidating, [field]: true })
    }
    
    // Simulate async validation
    await new Promise(resolve => setTimeout(resolve, 200))
    
    switch (field) {
      case 'registration_number':
        const regValue = value as string
        const cleanedNum = regValue.replace(/[^\d]/g, '')
        if (!regValue) {
          newErrors.registration_number = '등록번호를 입력해주세요'
        } else if (cleanedNum.length !== 8) {
          newErrors.registration_number = '등록번호는 8자리 숫자여야 합니다'
        } else if (regValue !== formatRegistrationNumber(regValue)) {
          newErrors.registration_number = '올바른 형식이 아닙니다 (XXXX-XXXX)'
        } else {
          delete newErrors.registration_number
          isValid = true
        }
        break
        
      case 'patient_name':
        const nameValue = value as string
        if (!nameValue) {
          newErrors.patient_name = '환자명을 입력해주세요'
        } else if (nameValue.length < 2) {
          newErrors.patient_name = '2자 이상 입력해주세요'
        } else {
          delete newErrors.patient_name
          isValid = true
        }
        break
        
      case 'patient_age':
        const ageValue = value as string
        const age = parseInt(ageValue)
        if (!ageValue) {
          newErrors.patient_age = '나이를 입력해주세요'
        } else if (isNaN(age) || age < 0 || age > 150) {
          newErrors.patient_age = '올바른 나이를 입력해주세요 (0-150)'
        } else {
          delete newErrors.patient_age
          isValid = true
        }
        break
        
      case 'patient_gender':
        const genderValue = value as string
        if (!genderValue) {
          newErrors.patient_gender = '성별을 선택해주세요'
        } else {
          delete newErrors.patient_gender
          isValid = true
        }
        break
        
      case 'surgery_date':
        const dateValue = value as string
        if (dateValue) {
          const selectedDate = new Date(dateValue)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          selectedDate.setHours(0, 0, 0, 0)
          
          if (selectedDate < today) {
            newErrors.surgery_date = '과거 날짜는 선택할 수 없습니다'
          } else {
            delete newErrors.surgery_date
            isValid = true
          }
        }
        break
        
      case 'diagnosis':
        const diagnosisValue = value as string
        if (diagnosisValue && diagnosisValue.length < 2) {
          newErrors.diagnosis = '2자 이상 입력해주세요'
        } else if (diagnosisValue) {
          delete newErrors.diagnosis
          isValid = true
        }
        break
        
      case 'surgery_site':
        const siteValue = value as string
        if (siteValue) {
          delete newErrors.surgery_site
          isValid = true
        }
        break
    }
    
    setErrors(newErrors)
    setIsValidating({ ...isValidating, [field]: false })
    
    // Update completed fields
    if (isValid) {
      setCompletedFields(prev => new Set([...prev, field]))
    } else {
      setCompletedFields(prev => {
        const newSet = new Set(prev)
        newSet.delete(field)
        return newSet
      })
    }
  }, [errors, isValidating])

  const handleFieldChange = async (field: keyof FormData, value: string) => {
    let processedValue = value
    
    // Apply formatting based on field type
    if (field === 'registration_number') {
      processedValue = formatRegistrationNumber(value)
      if (processedValue.replace(/[^\d]/g, '').length > 8) return
    }
    
    if (field === 'patient_age') {
      // Only allow numbers
      const cleanedAge = value.replace(/[^\d]/g, '')
      if (cleanedAge.length > 3) return
      processedValue = cleanedAge
    }
    
    // No filtering for patient_name - allow all characters
    
    setFormData({ ...formData, [field]: processedValue })
    
    // Validate if field has been touched
    if (touched[field]) {
      await validateField(field, processedValue)
    }
  }

  const handleBlur = async (field: keyof FormData) => {
    setTouched({ ...touched, [field]: true })
    await validateField(field, formData[field])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting || hasSubmittedRef.current) return

    hasSubmittedRef.current = true
    setIsSubmitting(true)
    
    // Validate all required fields
    const requiredFields: (keyof FormData)[] = [
      'registration_number', 
      'patient_name', 
      'patient_age', 
      'patient_gender'
    ]
    
    let hasError = false
    const newTouched: Partial<Record<keyof FormData, boolean>> = {}
    
    // Mark all required fields as touched
    for (const field of requiredFields) {
      newTouched[field] = true
      await validateField(field, formData[field], false)
      if (!formData[field] || errors[field]) {
        hasError = true
      }
    }
    
    setTouched({ ...touched, ...newTouched })
    
    if (hasError) {
      toast.error("필수 정보를 올바르게 입력해주세요")
      hasSubmittedRef.current = false
      setIsSubmitting(false)
      
      // Focus on first error field
      const firstErrorField = requiredFields.find(field => 
        !formData[field] || errors[field]
      )
      if (firstErrorField && inputRefs.current[firstErrorField]) {
        inputRefs.current[firstErrorField]?.focus()
        inputRefs.current[firstErrorField]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      }
      return
    }
    
    // Check medical team
    if (formData.medical_team.length === 0) {
      toast.error("최소 1명의 의료진을 추가해주세요")
      hasSubmittedRef.current = false
      setIsSubmitting(false)
      return
    }
    
    const invalidTeamMember = formData.medical_team.find(
      member => !member.name || !member.department
    )
    
    if (invalidTeamMember) {
      toast.error("의료진 정보를 완성해주세요")
      hasSubmittedRef.current = false
      setIsSubmitting(false)
      return
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    console.log('🔄 BasicInfo form submission - Final formData:', formData)
    console.log('🔄 Special conditions in formData:', {
      medical_history: formData.medical_history,
      diabetes: formData.diabetes,
      smoking: formData.smoking,
      hypertension: formData.hypertension,
      allergy: formData.allergy,
      other_conditions: formData.other_conditions,
      mortality_risk: formData.mortality_risk,
      morbidity_risk: formData.morbidity_risk
    })

    onComplete(formData)
    toast.success("기본 정보가 저장되었습니다")
    setIsSubmitting(false)
  }

  const addMedicalTeamMember = () => {
    setFormData({
      ...formData,
      medical_team: [...formData.medical_team, { name: "", is_specialist: true, department: "" }]
    })
  }

  const removeMedicalTeamMember = (index: number) => {
    setFormData({
      ...formData,
      medical_team: formData.medical_team.filter((_, i) => i !== index)
    })
  }

  const handlePossumCalculate = (results: { mortality_risk: number; morbidity_risk: number }) => {
    setFormData({
      ...formData,
      mortality_risk: (results.mortality_risk * 100).toFixed(2),
      morbidity_risk: (results.morbidity_risk * 100).toFixed(2)
    })
    toast.success("POSSUM 점수가 계산되었습니다")
  }

  const openPossumCalculator = () => {
    setIsPossumOpen(true)
  }

  const closePossumCalculator = () => {
    setIsPossumOpen(false)
  }

  const updateMedicalTeamMember = (index: number, field: keyof MedicalTeamMember, value: string | boolean) => {
    const updatedTeam = [...formData.medical_team]
    updatedTeam[index] = { ...updatedTeam[index], [field]: value }
    setFormData({ ...formData, medical_team: updatedTeam })
  }

  // Dynamic input styling based on state
  const getInputStyle = (field: keyof FormData) => {
    const baseStyle = "h-10 bg-white border border-slate-200 transition-all duration-150 rounded-md"
    const focusStyle = "focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none"
    const errorStyle = errors[field] && touched[field] 
      ? "border-red-400 focus:border-red-500 focus:ring-red-100" 
      : ""
    
    return `${baseStyle} ${focusStyle} ${errorStyle}`
  }

  const labelStyle = "text-sm font-medium text-slate-700"

  // Get today's date for surgery date min value
  const today = new Date().toISOString().split('T')[0]
  

  return (
    <div className="max-w-4xl mx-auto">
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 환자 기본 정보 */}
        <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-6">
              환자 정보
            </h3>
            <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className={labelStyle}>
                  등록번호 <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    ref={el => { inputRefs.current['registration_number'] = el; }}
                    value={formData.registration_number}
                    onChange={(e) => handleFieldChange('registration_number', e.target.value)}
                    onBlur={() => handleBlur('registration_number')}
                    className={getInputStyle('registration_number')}
                    placeholder="0000-0000"
                    maxLength={9}
                    autoComplete="off"
                  />
                  {isValidating.registration_number && (
                    <Loader2 className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 animate-spin" />
                  )}
                  {!isValidating.registration_number && completedFields.has('registration_number') && (
                    <Check className="absolute right-3 top-3.5 h-4 w-4 text-emerald-500" />
                  )}
                </div>
                {errors.registration_number && touched.registration_number && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.registration_number}
                  </p>
                )}
              </div>

              <div>
                <Label className={labelStyle}>
                  환자명 <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    ref={el => { inputRefs.current['patient_name'] = el; }}
                    value={formData.patient_name}
                    onChange={(e) => handleFieldChange('patient_name', e.target.value)}
                    onBlur={() => handleBlur('patient_name')}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={(e) => {
                      setIsComposing(false)
                      const event = e as React.CompositionEvent<HTMLInputElement>
                      handleFieldChange('patient_name', event.currentTarget.value)
                    }}
                    className={getInputStyle('patient_name')}
                    placeholder="홍길동"
                    autoComplete="name"
                  />
                  {isValidating.patient_name && (
                    <Loader2 className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 animate-spin" />
                  )}
                  {!isValidating.patient_name && completedFields.has('patient_name') && (
                    <Check className="absolute right-3 top-3.5 h-4 w-4 text-emerald-500" />
                  )}
                </div>
                {errors.patient_name && touched.patient_name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.patient_name}
                  </p>
                )}
              </div>

              <div>
                <Label className={labelStyle}>
                  나이/성별 <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      ref={el => { inputRefs.current['patient_age'] = el; }}
                      value={formData.patient_age}
                      onChange={(e) => handleFieldChange('patient_age', e.target.value)}
                      onBlur={() => handleBlur('patient_age')}
                      className={`${getInputStyle('patient_age')} w-20`}
                      placeholder="45"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>
                  <select 
                    ref={el => { inputRefs.current['patient_gender'] = el; }}
                    className={`${getInputStyle('patient_gender')} px-3 rounded-md text-sm flex-1 cursor-pointer`}
                    value={formData.patient_gender}
                    onChange={(e) => handleFieldChange('patient_gender', e.target.value)}
                    onBlur={() => handleBlur('patient_gender')}
                  >
                    <option value="">선택</option>
                    <option value="남">남</option>
                    <option value="여">여</option>
                  </select>
                </div>
                {((errors.patient_age && touched.patient_age) || (errors.patient_gender && touched.patient_gender)) && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {(errors.patient_age && touched.patient_age) ? errors.patient_age : errors.patient_gender}
                  </p>
                )}
              </div>

              <div>
                <Label className={labelStyle}>
                  시행예정일
                </Label>
                <div className="relative mt-1">
                  <Input
                    type="date"
                    value={formData.surgery_date}
                    onChange={(e) => handleFieldChange('surgery_date', e.target.value)}
                    onBlur={() => handleBlur('surgery_date')}
                    className={getInputStyle('surgery_date')}
                    min={today}
                  />
                </div>
                {errors.surgery_date && touched.surgery_date && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.surgery_date}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
              <div>
                <Label className={labelStyle}>
                  진단명
                </Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      value={formData.diagnosis}
                      onChange={(e) => handleFieldChange('diagnosis', e.target.value)}
                      onBlur={() => handleBlur('diagnosis')}
                      className={getInputStyle('diagnosis')}
                      placeholder="예: Acute cholecystitis"
                    />
                  </div>
                  <Input
                    value={formData.diagnosis_detail}
                    onChange={(e) => setFormData({...formData, diagnosis_detail: e.target.value})}
                    className="h-10 w-40 bg-white border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none rounded-md"
                    placeholder="추가 진단"
                  />
                </div>
                {errors.diagnosis && touched.diagnosis && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.diagnosis}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className={labelStyle}>
                    수술명
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      value={formData.surgery_name}
                      onChange={(e) => setFormData({...formData, surgery_name: e.target.value})}
                      className="h-10 bg-white border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none rounded-md"
                      placeholder="예: 복강경하 담낭절제술"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <Label className={labelStyle}>수술부위표시</Label>
                  <div className="relative mt-1">
                    <Input
                      value={formData.surgery_site_detail}
                      onChange={(e) => setFormData({...formData, surgery_site_detail: e.target.value})}
                      className="h-10 bg-white border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none rounded-md"
                      placeholder="예: RUQ, 우상복부"
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* 참여 의료진 */}
        <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-slate-900">
                참여 의료진
                <span className="ml-2 text-xs font-normal text-slate-500">({formData.medical_team.length}명)</span>
              </h3>
              <Button
                type="button"
                onClick={addMedicalTeamMember}
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs border-slate-200 hover:bg-slate-50"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                추가
              </Button>
            </div>
            <div className="space-y-2">
              {formData.medical_team.map((member, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div>
                    <Label className="text-xs font-medium text-slate-600">{index === 0 ? "집도의" : "보조의사"}</Label>
                    <Input
                      value={member.name}
                      onChange={(e) => updateMedicalTeamMember(index, "name", e.target.value)}
                      className="h-9 mt-1 bg-white border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none rounded-md"
                      placeholder="이름 입력"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">전문의 여부</Label>
                    <select 
                      className="h-9 mt-1 w-full px-3 bg-white border border-slate-200 rounded-md text-sm focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none cursor-pointer"
                      value={member.is_specialist ? "전문의" : "일반의"}
                      onChange={(e) => updateMedicalTeamMember(index, "is_specialist", e.target.value === "전문의")}
                    >
                      <option value="전문의">전문의</option>
                      <option value="일반의">일반의</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-slate-600">진료과목</Label>
                    <Input
                      value={member.department}
                      onChange={(e) => updateMedicalTeamMember(index, "department", e.target.value)}
                      className="h-9 mt-1 bg-white border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none rounded-md"
                      placeholder="예: GS"
                    />
                  </div>
                  <div className="flex items-end">
                    {formData.medical_team.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeMedicalTeamMember(index)}
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 안내문 */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed">
              다음의 설명 내용은 의료진이 환자 본인이나 대리인(보호자)에게 환자가 시행 받을 검사에 대한 정보를 제공하여
              환자 본인이나 대리인이 자주적 의사에 따라 검사 여부를 결정할 수 있도록 하기 위한 것입니다.
              설명 내용 중 이해가 되지 않는 부분이 있다면 설명의사에게 추가 설명을 요청할 수 있습니다.
            </p>
        </div>

        {/* 환자 상태 및 특이사항 */}
        <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-6">
              환자 상태 및 특이사항
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { id: "medical_history", label: "과거병력 (질병/상해/수술)" },
                { id: "smoking", label: "흡연여부" },
                { id: "allergy", label: "알레르기 등 특이체질" },
                { id: "airway_abnormal", label: "기도이상" },
                { id: "respiratory_disease", label: "호흡기질환" },
                { id: "medication", label: "복용약" },
                { id: "drug_abuse", label: "마약복용 혹은 약물사고" },
                { id: "diabetes", label: "당뇨병" },
                { id: "hypertension", label: "고혈압" },
                { id: "hypotension", label: "저혈압" },
                { id: "cardiovascular", label: "심혈관질환" },
                { id: "blood_coagulation", label: "혈액응고 관련 질환" },
                { id: "kidney_disease", label: "신장질환" },
              ].map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span className="text-sm text-slate-700">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={item.id}
                        checked={formData[item.id as keyof FormData] === true}
                        onChange={() => {
                          console.log(`Setting ${item.id} to true`)
                          setFormData({...formData, [item.id]: true})
                        }}
                        className="mr-1.5"
                      />
                      <span className="text-sm">유</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name={item.id}
                        checked={formData[item.id as keyof FormData] === false}
                        onChange={() => {
                          console.log(`Setting ${item.id} to false`)
                          setFormData({...formData, [item.id]: false})
                        }}
                        className="mr-1.5"
                      />
                      <span className="text-sm">무</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Label className={labelStyle}>기타</Label>
              <Input
                value={formData.other_conditions}
                onChange={(e) => setFormData({...formData, other_conditions: e.target.value})}
                className="h-10 bg-white border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none rounded-md"
                placeholder="기타 특이사항을 입력하세요"
              />
            </div>
          </div>
        </div>

        {/* POSSUM 점수 */}
        <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-slate-900">
                POSSUM 점수
              </h3>
              <Button
                type="button"
                onClick={openPossumCalculator}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-lg flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                계산하기
              </Button>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={labelStyle}>사망률 위험도 (%)</Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.mortality_risk}
                    onChange={(e) => setFormData({...formData, mortality_risk: e.target.value})}
                    className="h-10 bg-white border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none rounded-md"
                    placeholder=""
                  />
                </div>
              </div>
              <div>
                <Label className={labelStyle}>합병증 위험도 (%)</Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.morbidity_risk}
                    onChange={(e) => setFormData({...formData, morbidity_risk: e.target.value})}
                    className="h-10 bg-white border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none rounded-md"
                    placeholder=""
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-slate-500">
            <span className="text-red-500">*</span> 표시는 필수 입력 항목입니다
          </div>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-6 py-3 h-auto font-medium rounded-lg transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                처리중...
              </>
            ) : (
              <>
                다음 단계
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* POSSUM Calculator Modal */}
      <PossumCalculator
        isOpen={isPossumOpen}
        onClose={closePossumCalculator}
        onCalculate={handlePossumCalculate}
      />
    </div>
  )
}