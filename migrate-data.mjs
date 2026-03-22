import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vzkfkazjylrkspqrnhnx.supabase.co',
  'sb_publishable_H1Ch2D2XIuSQMzNL-ns8zg_gAqrx7wL'
)

const CLINIC_ID = '00000000-0000-0000-0000-000000000001'

async function migrate() {
  // 1. houmon_data から全データ取得
  const { data: rawData, error: fetchError } = await supabase.from('houmon_data').select('*')
  if (fetchError) { console.error('fetch error:', fetchError); return }
  console.log(`houmon_data: ${rawData.length}行取得`)

  const getByKey = (key) => {
    const row = rawData.find(r => r.key === key && r.data && (Array.isArray(r.data) ? r.data.length > 0 : r.data !== '[]'))
    if (!row) return []
    return typeof row.data === 'string' ? JSON.parse(row.data) : row.data
  }

  const therapists = getByKey('houmon_therapists')
  const salesStaff = getByKey('houmon_sales_staff')
  const facilitiesData = getByKey('houmon_facilities')
  const patientsData = getByKey('houmon_patients')

  console.log(`施術者: ${therapists.length}名`)
  console.log(`施設: ${facilitiesData.length}件`)
  console.log(`患者: ${patientsData.length}名`)

  // 2. スタッフ挿入（施術者 + 営業担当の統合）
  const staffMap = {} // old_id -> new_uuid
  const allStaffNames = new Set()

  for (const t of therapists) {
    if (allStaffNames.has(t.name)) continue
    allStaffNames.add(t.name)
    const { data, error } = await supabase.from('houmon_staff').insert({
      clinic_id: CLINIC_ID,
      name: t.name,
      role: t.license || '鍼灸マッサージ師',
      is_active: t.active !== false,
    }).select('id').single()
    if (error) { console.error('staff insert error:', t.name, error); continue }
    staffMap[t.id] = data.id
    console.log(`  スタッフ: ${t.name} -> ${data.id}`)
  }

  // 営業担当者のマッピング（同じ人がいればマッピング、いなければ追加）
  const salesMap = {}
  for (const s of salesStaff) {
    // 名前で施術者と同一人物を探す
    const existingEntry = Object.entries(staffMap).find(([oldId]) => {
      const therapist = therapists.find(t => t.id === oldId)
      return therapist && therapist.name === s.name
    })
    if (existingEntry) {
      salesMap[s.id] = existingEntry[1]
    } else if (!allStaffNames.has(s.name)) {
      allStaffNames.add(s.name)
      const { data, error } = await supabase.from('houmon_staff').insert({
        clinic_id: CLINIC_ID,
        name: s.name,
        role: '営業',
        is_active: s.active !== false,
      }).select('id').single()
      if (error) { console.error('sales staff insert error:', s.name, error); continue }
      salesMap[s.id] = data.id
      console.log(`  営業スタッフ: ${s.name} -> ${data.id}`)
    }
  }
  // 施術者と営業が同名の場合のマッピング
  for (const s of salesStaff) {
    if (!salesMap[s.id]) {
      const matchingTherapist = therapists.find(t => t.name === s.name)
      if (matchingTherapist && staffMap[matchingTherapist.id]) {
        salesMap[s.id] = staffMap[matchingTherapist.id]
      }
    }
  }

  // 3. 施設挿入
  const facilityMap = {} // old_id -> new_uuid
  for (const f of facilitiesData) {
    const { data, error } = await supabase.from('houmon_facilities').insert({
      clinic_id: CLINIC_ID,
      name: f.name,
      address: f.address || '',
      notes: f.notes || '',
      is_active: true,
    }).select('id').single()
    if (error) { console.error('facility insert error:', f.name, error); continue }
    facilityMap[f.id] = data.id
    console.log(`  施設: ${f.name} -> ${data.id}`)
  }

  // 4. 患者挿入
  for (const p of patientsData) {
    // 施術担当者のマッピング（施術者の中から探す）
    // patientsData にはtherapistIdがない。旧データの構造を確認
    // salesStaffId は営業担当者
    const facilityId = p.facilityId ? (facilityMap[p.facilityId] || null) : null
    const salesStaffId = p.salesStaffId ? (salesMap[p.salesStaffId] || null) : null

    const { data, error } = await supabase.from('houmon_patients').insert({
      clinic_id: CLINIC_ID,
      name: p.name,
      kana: p.furigana || '',
      phone: '',
      address: p.address || '',
      care_level: '',
      insurance_number: '',
      primary_condition: '',
      acupuncture_condition: p.harikyu || '',
      massage_condition: '',
      facility_id: facilityId,
      assigned_staff_id: null,
      sales_staff_id: salesStaffId,
      visit_frequency: '',
      visit_day_preference: '',
      is_active: p.status !== '終了',
      notes: [
        p.insuranceType && `保険: ${p.insuranceType}`,
        p.treatmentType && `施術: ${p.treatmentType}`,
        p.status && `状態: ${p.status}`,
        p.doctorName && `医師: ${p.doctorName}`,
        p.bodyPartCount && `部位数: ${p.bodyPartCount}`,
        p.copayRate > 0 && `負担割合: ${p.copayRate * 100}%`,
        p.treatmentLocation && `場所: ${p.treatmentLocation === 'facility' ? '施設' : '自宅'}`,
      ].filter(Boolean).join(' / '),
    }).select('id').single()
    if (error) { console.error('patient insert error:', p.name, error); continue }
    console.log(`  患者: ${p.name} (${p.furigana}) -> ${data.id}`)
  }

  console.log('\n移行完了!')
}

migrate().catch(console.error)
