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
export function transformConsentDataToArray(objectData: ConsentObjectData): ConsentArrayData {
  const consents: ConsentItem[] = []

  if (objectData.consents) {
    const c = objectData.consents

    if (c.prognosis_without_surgery) {
      consents.push({
        item_title: "수술하지 않을 경우 예후",
        description: c.prognosis_without_surgery,
        category: "예후"
      })
    }

    if (c.alternative_treatments) {
      consents.push({
        item_title: "대체 가능한 치료",
        description: c.alternative_treatments,
        category: "대체치료"
      })
    }

    if (c.surgery_purpose_necessity_effect) {
      consents.push({
        item_title: "수술의 목적, 필요성, 효과",
        description: c.surgery_purpose_necessity_effect,
        category: "수술 목적"
      })
    }

    if (c.surgery_method_content?.overall_description) {
      consents.push({
        item_title: "수술 방법 및 내용",
        description: c.surgery_method_content.overall_description,
        category: "수술 방법"
      })
    }

    if (c.surgery_method_content?.estimated_duration) {
      consents.push({
        item_title: "예상 수술 시간",
        description: c.surgery_method_content.estimated_duration,
        category: "수술 방법"
      })
    }

    if (c.surgery_method_content?.method_change_or_addition) {
      consents.push({
        item_title: "수술 방법 변경 또는 추가 가능성",
        description: c.surgery_method_content.method_change_or_addition,
        category: "수술 방법"
      })
    }

    if (c.surgery_method_content?.transfusion_possibility) {
      consents.push({
        item_title: "수혈 가능성",
        description: c.surgery_method_content.transfusion_possibility,
        category: "수술 방법"
      })
    }

    if (c.surgery_method_content?.surgeon_change_possibility) {
      consents.push({
        item_title: "집도의 변경 가능성",
        description: c.surgery_method_content.surgeon_change_possibility,
        category: "수술 방법"
      })
    }

    if (c.possible_complications_sequelae) {
      consents.push({
        item_title: "발생 가능한 합병증 및 후유증",
        description: c.possible_complications_sequelae,
        category: "합병증"
      })
    }

    if (c.emergency_measures) {
      consents.push({
        item_title: "응급상황 발생 시 조치사항",
        description: c.emergency_measures,
        category: "응급조치"
      })
    }

    if (c.mortality_risk) {
      consents.push({
        item_title: "사망 위험성",
        description: c.mortality_risk,
        category: "위험성"
      })
    }
  }

  return {
    consents,
    references: objectData.references
  }
}

// Transform array format back to object format if needed
export function transformConsentDataToObject(arrayData: ConsentArrayData): ConsentObjectData {
  const consents: ConsentObjectData['consents'] = {}

  arrayData.consents.forEach(item => {
    if (item.category === "예후" && item.item_title?.includes("수술하지 않을 경우")) {
      consents.prognosis_without_surgery = item.description
    } else if (item.category === "대체치료") {
      consents.alternative_treatments = item.description
    } else if (item.category === "수술 목적") {
      consents.surgery_purpose_necessity_effect = item.description
    } else if (item.category === "수술 방법") {
      if (!consents.surgery_method_content) {
        consents.surgery_method_content = {}
      }
      if (item.item_title?.includes("수술 방법 및 내용")) {
        consents.surgery_method_content.overall_description = item.description
      } else if (item.item_title?.includes("예상 수술 시간")) {
        consents.surgery_method_content.estimated_duration = item.description
      } else if (item.item_title?.includes("방법 변경")) {
        consents.surgery_method_content.method_change_or_addition = item.description
      } else if (item.item_title?.includes("수혈")) {
        consents.surgery_method_content.transfusion_possibility = item.description
      } else if (item.item_title?.includes("집도의")) {
        consents.surgery_method_content.surgeon_change_possibility = item.description
      }
    } else if (item.category === "합병증") {
      consents.possible_complications_sequelae = item.description
    } else if (item.category === "응급조치") {
      consents.emergency_measures = item.description
    } else if (item.category === "위험성") {
      consents.mortality_risk = item.description
    }
  })

  return {
    consents,
    references: arrayData.references
  }
}