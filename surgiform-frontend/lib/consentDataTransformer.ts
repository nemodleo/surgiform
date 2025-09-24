// Utility to transform consent data between object and array formats

export interface ConsentObjectData {
  consents?: {
    prognosis_without_surgery?: string
    alternative_treatments?: string
    surgery_purpose_necessity_effect?: string
    surgery_method_content?: {
      overall_description?: string
      estimated_duration?: string
      method_change_or_addition?: string
      transfusion_possibility?: string
      surgeon_change_possibility?: string
    }
    possible_complications_sequelae?: string
    emergency_measures?: string
    mortality_risk?: string
  }
  references?: unknown
}

export interface ConsentItem {
  item_title: string
  description: string
  category?: string
}

export interface ConsentArrayData {
  consents: ConsentItem[]
  references?: unknown
}

// Transform object format to array format for legacy components
// 현재는 1-8번 항목만 사용하므로 API 생성 동의 내용은 빈 배열 반환
export function transformConsentDataToArray(objectData: ConsentObjectData): ConsentArrayData {
  // 1-8번 항목만 사용하므로 API에서 생성된 동의 내용들은 표시하지 않음
  return {
    consents: [],
    references: objectData.references
  }
}

// Transform array format back to object format if needed
// 현재는 1-8번 항목만 사용하므로 빈 객체 반환
export function transformConsentDataToObject(arrayData: ConsentArrayData): ConsentObjectData {
  // 1-8번 항목만 사용하므로 API로 변환할 동의 내용 없음
  return {
    consents: {},
    references: arrayData.references
  }
}