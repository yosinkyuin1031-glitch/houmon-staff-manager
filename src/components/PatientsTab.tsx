'use client'

import { useState, useEffect } from 'react'
import { createClient, getClinicId } from '@/lib/supabase'
import { Patient, Staff, Facility, CARE_LEVELS } from '@/lib/types'
import { SkeletonList, useConfirm, useToast } from '@/components/ui'

export default function PatientsTab() {
  const supabase = createClient()
  const clinicId = getClinicId()
  const { confirm, modal: confirmModal } = useConfirm()
  const { showToast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '', kana: '', phone: '', care_level: '',
    insurance_number: '', acupuncture_condition: '', massage_condition: '',
    facility_id: '', assigned_staff_id: '', sales_staff_id: '',
    visit_frequency: '', visit_day_preference: '', notes: '',
  })

  const load = async () => {
    const [pRes, sRes, fRes] = await Promise.all([
      supabase.from('houmon_patients').select('*').eq('clinic_id', clinicId).eq('is_active', true).order('kana'),
      supabase.from('houmon_staff').select('*').eq('clinic_id', clinicId).eq('is_active', true).order('name'),
      supabase.from('houmon_facilities').select('*').eq('clinic_id', clinicId).eq('is_active', true).order('name'),
    ])
    setPatients(pRes.data || [])
    setStaffList(sRes.data || [])
    setFacilities(fRes.data || [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  const resetForm = () => {
    setForm({
      name: '', kana: '', phone: '', care_level: '',
      insurance_number: '', acupuncture_condition: '', massage_condition: '',
      facility_id: '', assigned_staff_id: '', sales_staff_id: '',
      visit_frequency: '', visit_day_preference: '', notes: '',
    })
    setEditing(null)
    setShowForm(false)
    setFormErrors({})
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = '氏名を入力してください'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    const data = {
      ...form,
      clinic_id: clinicId,
      facility_id: form.facility_id || null,
      assigned_staff_id: form.assigned_staff_id || null,
      sales_staff_id: form.sales_staff_id || null,
    }
    if (editing) {
      const { error } = await supabase.from('houmon_patients').update(data).eq('id', editing.id)
      if (error) { showToast('更新に失敗しました', 'error'); return }
      showToast('患者情報を更新しました')
    } else {
      const { error } = await supabase.from('houmon_patients').insert(data)
      if (error) { showToast('登録に失敗しました', 'error'); return }
      showToast('患者を登録しました')
    }
    resetForm()
    load()
  }

  const handleEdit = (p: Patient) => {
    setForm({
      name: p.name, kana: p.kana, phone: p.phone,
      care_level: p.care_level, insurance_number: p.insurance_number,
      acupuncture_condition: p.acupuncture_condition || '',
      massage_condition: p.massage_condition || '',
      facility_id: p.facility_id || '',
      assigned_staff_id: p.assigned_staff_id || '',
      sales_staff_id: p.sales_staff_id || '',
      visit_frequency: p.visit_frequency, visit_day_preference: p.visit_day_preference,
      notes: p.notes,
    })
    setEditing(p)
    setShowForm(true)
    setFormErrors({})
  }

  const handleDeactivate = async (id: string) => {
    const ok = await confirm('患者の無効化', 'この患者を非アクティブにしますか？一覧から非表示になります。', 'danger')
    if (!ok) return
    const { error } = await supabase.from('houmon_patients').update({ is_active: false }).eq('id', id)
    if (error) { showToast('無効化に失敗しました', 'error'); return }
    showToast('患者を非アクティブにしました')
    load()
  }

  const getStaffName = (id: string | null) =>
    staffList.find(s => s.id === id)?.name || '未割当'

  const getFacilityName = (id: string | null) =>
    facilities.find(f => f.id === id)?.name || ''

  const filtered = patients.filter(p =>
    !search || p.name.includes(search) || p.kana.includes(search)
  )

  if (loading) return <SkeletonList count={4} />

  return (
    <div className="space-y-4">
      {confirmModal}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">患者一覧（{patients.length}名）</h2>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium"
          aria-label="患者を追加">
          + 追加
        </button>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="名前で検索..."
        className="w-full px-3 py-2 border rounded-lg text-sm"
        aria-label="患者を検索"
      />

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3" role="form" aria-label={editing ? '患者編集フォーム' : '新規患者登録フォーム'}>
          <h3 className="font-bold">{editing ? '患者編集' : '新規患者'}</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setFormErrors(prev => ({ ...prev, name: '' })) }}
                placeholder="氏名 *" className={`w-full px-3 py-2 border rounded-lg text-sm ${formErrors.name ? 'border-red-400' : ''}`}
                aria-label="氏名" aria-invalid={!!formErrors.name} aria-required="true" />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <input value={form.kana} onChange={e => setForm({ ...form, kana: e.target.value })}
              placeholder="フリガナ" className="px-3 py-2 border rounded-lg text-sm" aria-label="フリガナ" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="電話番号" className="px-3 py-2 border rounded-lg text-sm" aria-label="電話番号" type="tel" />
            <select value={form.care_level} onChange={e => setForm({ ...form, care_level: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm" aria-label="介護度を選択">
              <option value="">介護度</option>
              {CARE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <select value={form.facility_id} onChange={e => setForm({ ...form, facility_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm" aria-label="施設を選択">
            <option value="">施設を選択</option>
            {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <input value={form.insurance_number} onChange={e => setForm({ ...form, insurance_number: e.target.value })}
            placeholder="保険証番号" className="w-full px-3 py-2 border rounded-lg text-sm" aria-label="保険証番号" />
          <input value={form.acupuncture_condition} onChange={e => setForm({ ...form, acupuncture_condition: e.target.value })}
            placeholder="鍼灸同意書の症状名" className="w-full px-3 py-2 border rounded-lg text-sm" aria-label="鍼灸同意書の症状名" />
          <input value={form.massage_condition} onChange={e => setForm({ ...form, massage_condition: e.target.value })}
            placeholder="マッサージ同意書傷病名" className="w-full px-3 py-2 border rounded-lg text-sm" aria-label="マッサージ同意書傷病名" />
          <select value={form.assigned_staff_id} onChange={e => setForm({ ...form, assigned_staff_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm" aria-label="施術担当者を選択">
            <option value="">施術担当者</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}（{s.role}）</option>)}
          </select>
          <select value={form.sales_staff_id} onChange={e => setForm({ ...form, sales_staff_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm" aria-label="営業担当者を選択">
            <option value="">営業担当者</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}（{s.role}）</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.visit_frequency} onChange={e => setForm({ ...form, visit_frequency: e.target.value })}
              placeholder="訪問頻度（例:週2回）" className="px-3 py-2 border rounded-lg text-sm" aria-label="訪問頻度" />
            <input value={form.visit_day_preference} onChange={e => setForm({ ...form, visit_day_preference: e.target.value })}
              placeholder="希望曜日（例:月水金）" className="px-3 py-2 border rounded-lg text-sm" aria-label="希望曜日" />
          </div>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="備考" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" aria-label="備考" />
          <div className="flex gap-2">
            <button onClick={handleSave}
              className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              aria-label={editing ? '患者情報を更新' : '患者を登録'}>
              {editing ? '更新' : '登録'}
            </button>
            <button onClick={resetForm}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm" aria-label="フォームを閉じる">キャンセル</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800">{p.name}</h3>
                  {p.care_level && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{p.care_level}</span>
                  )}
                </div>
                {p.kana && <p className="text-xs text-gray-400">{p.kana}</p>}
                {p.facility_id && (
                  <p className="text-xs text-teal-600 mt-0.5">{getFacilityName(p.facility_id)}</p>
                )}
                {(p.acupuncture_condition || p.massage_condition) && (
                  <p className="text-xs text-gray-500 mt-1">
                    {p.acupuncture_condition && `鍼灸: ${p.acupuncture_condition}`}
                    {p.acupuncture_condition && p.massage_condition && ' / '}
                    {p.massage_condition && `マ: ${p.massage_condition}`}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  施術: {getStaffName(p.assigned_staff_id)}
                  {' / '}営業: {getStaffName(p.sales_staff_id)}
                  {p.visit_frequency && ` / ${p.visit_frequency}`}
                  {p.visit_day_preference && `（${p.visit_day_preference}）`}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => handleEdit(p)}
                  className="px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs"
                  aria-label={`${p.name}を編集`}>編集</button>
                <button onClick={() => handleDeactivate(p.id)}
                  className="px-2 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs"
                  aria-label={`${p.name}を無効にする`}>無効</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-400 text-center py-8">患者が登録されていません</p>
        )}
      </div>
    </div>
  )
}
