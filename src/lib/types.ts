export interface Staff {
  id: string
  clinic_id: string
  name: string
  role: string
  phone: string
  email: string
  license_number: string
  hire_date: string | null
  hourly_rate: number
  is_active: boolean
  notes: string
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  clinic_id: string
  name: string
  kana: string
  phone: string
  address: string
  care_level: string
  insurance_number: string
  primary_condition: string
  acupuncture_condition: string
  massage_condition: string
  assigned_staff_id: string | null
  sales_staff_id: string | null
  visit_frequency: string
  visit_day_preference: string
  is_active: boolean
  notes: string
  created_at: string
  updated_at: string
}

export interface Visit {
  id: string
  clinic_id: string
  staff_id: string
  patient_id: string
  visit_date: string
  start_time: string | null
  end_time: string | null
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  treatment_content: string
  insurance_type: string
  insurance_points: number
  self_pay_amount: number
  notes: string
  created_at: string
  updated_at: string
  // joined
  staff?: Staff
  patient?: Patient
}

export interface Shift {
  id: string
  clinic_id: string
  staff_id: string
  shift_date: string
  start_time: string
  end_time: string
  is_off: boolean
  notes: string
  created_at: string
}

export type TabType = 'home' | 'schedule' | 'staff' | 'patients' | 'report'

export const CARE_LEVELS = [
  '要支援1', '要支援2',
  '要介護1', '要介護2', '要介護3', '要介護4', '要介護5',
  '自立', 'なし',
]

export const STAFF_ROLES = [
  '鍼灸師', 'マッサージ師', '柔道整復師', '理学療法士', '作業療法士', 'その他',
]

export const VISIT_STATUSES: Record<Visit['status'], { label: string; color: string }> = {
  scheduled: { label: '予定', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '完了', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-600' },
  no_show: { label: '不在', color: 'bg-red-100 text-red-600' },
}
