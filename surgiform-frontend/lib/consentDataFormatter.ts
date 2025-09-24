// Transform form data to the desired consent format
export interface ConsentFormData {
  surgery_name: string
  registration_no: string
  patient_name: string
  age: number
  gender: "M" | "F"
  scheduled_date: string
  diagnosis: string
  surgical_site_mark: string
  participants: Array<{
    name: string
    is_specialist: boolean
    department: string
  }>
  patient_condition: string
  special_conditions: {
    past_history: boolean
    diabetes: boolean
    smoking: boolean
    hypertension: boolean
    allergy: boolean
    cardiovascular: boolean
    respiratory: boolean
    coagulation: boolean
    medications: boolean
    renal: boolean
    drug_abuse: boolean
    other: string | null
  }
  possum_score?: {
    mortality_risk: number
    morbidity_risk: number
  }
}

// Map form field names to consent format
export function transformFormDataToConsent(formData: Record<string, unknown>): ConsentFormData {
  // Extract medical team participants
  const medicalTeam = (formData.medical_team as Array<{
    name: string
    is_specialist: boolean
    department: string
  }>) || []

  // Convert gender from Korean to English
  const genderMap: Record<string, "M" | "F"> = {
    "남": "M",
    "여": "F",
    "MALE": "M",
    "FEMALE": "F"
  }

  const gender = genderMap[formData.patient_gender as string] || "M"

  // Format the surgery site mark (use only the detail textarea)
  let surgicalSiteMark = ""
  if (formData.surgery_site_detail && typeof formData.surgery_site_detail === 'string' && formData.surgery_site_detail.trim()) {
    surgicalSiteMark = formData.surgery_site_detail.trim()
  }

  // Format the diagnosis
  let diagnosis = formData.diagnosis as string || ""
  if (formData.diagnosis_detail) {
    diagnosis += ` - ${formData.diagnosis_detail}`
  }

  // Determine patient condition based on medical history
  let patientCondition = "Stable"
  const hasAnyCondition = [
    formData.medical_history,
    formData.diabetes,
    formData.hypertension,
    formData.cardiovascular,
    formData.respiratory_disease,
    formData.kidney_disease
  ].some(condition => condition === true)

  if (hasAnyCondition) {
    patientCondition = "Requires monitoring"
  }

  // Format other conditions
  let otherConditions: string | null = null
  if (formData.other_conditions && typeof formData.other_conditions === 'string' && formData.other_conditions.trim()) {
    otherConditions = formData.other_conditions.trim()
  }

  // Handle possum_score conditionally
  let possumScore: { mortality_risk: number; morbidity_risk: number } | undefined = undefined

  const mortalityRisk = typeof formData.mortality_risk === 'string'
    ? parseFloat(formData.mortality_risk)
    : formData.mortality_risk as number
  const morbidityRisk = typeof formData.morbidity_risk === 'string'
    ? parseFloat(formData.morbidity_risk)
    : formData.morbidity_risk as number

  // Only include possum_score if both values are provided and valid
  if (!isNaN(mortalityRisk) && !isNaN(morbidityRisk) && mortalityRisk > 0 && morbidityRisk > 0) {
    possumScore = {
      mortality_risk: mortalityRisk,
      morbidity_risk: morbidityRisk
    }
  }

  const result: ConsentFormData = {
    surgery_name: formData.surgery_name as string || diagnosis || "수술",
    registration_no: (formData.registration_number as string || formData.registration_no as string || "").replace(/[^\d]/g, ''),
    patient_name: formData.patient_name as string || "",
    age: parseInt(formData.patient_age as string || "0", 10),
    gender,
    scheduled_date: formData.surgery_date as string || new Date().toISOString().split('T')[0],
    diagnosis,
    surgical_site_mark: surgicalSiteMark,
    participants: medicalTeam.map(member => ({
      name: member.name,
      is_specialist: member.is_specialist,
      department: member.department
    })),
    patient_condition: patientCondition,
    special_conditions: {
      past_history: formData.medical_history === true,
      diabetes: formData.diabetes === true,
      smoking: formData.smoking === true,
      hypertension: formData.hypertension === true,
      allergy: formData.allergy === true,
      cardiovascular: formData.cardiovascular === true,
      respiratory: formData.respiratory_disease === true,
      coagulation: formData.blood_coagulation === true,
      medications: formData.medication === true,
      renal: formData.kidney_disease === true,
      drug_abuse: formData.drug_abuse === true,
      other: otherConditions
    }
  }

  // Only add possum_score if it has valid values
  if (possumScore) {
    result.possum_score = possumScore
  }

  return result
}

// Create a formatted consent object for API submission
export function createConsentSubmission(formData: Record<string, unknown>): ConsentFormData {
  return transformFormDataToConsent(formData)
}