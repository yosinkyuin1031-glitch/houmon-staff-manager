'use client'

import { useState, useEffect } from 'react'
import { createClient, getClinicId } from '@/lib/supabase'
import { Patient, Staff, CARE_LEVELS } from '@/lib/types'

export default function PatientsTab() {
  const supabase = createClient()
  const clinicId = getClinicId()
  const [patients, setPatients] = useState<Patient[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [form, setForm] = useState({
    name: '', kana: '', phone: '', care_level: '',
    insurance_number: '', primary_condition: '', assigned_staff_id: '',
    sales_staff_id: '', visit_frequency: '', visit_day_preference: '', notes: '',
  })

  const load = async () => {
    const [pRes, sRes] = await Promise.all([
      supabase.from('houmon_patients').select('*').eq('clinic_id', clinicId).eq('is_active', true).order('kana'),
      supabase.from('houmon_staff').select('*').eq('clinic_id', clinicId).eq('is_active', true).order('name'),
    ])
    setPatients(pRes.data || [])
    setStaffList(sRes.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resetForm = () => {
    setForm({
      name: '', kana: '', phone: '', care_level: '',
      insurance_number: '', primary_condition: '', assigned_staff_id: '',
      sales_staff_id: '', visit_frequency: '', visit_day_preference: '', notes: '',
    })
    setEditing(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    const data = {
      ...form,
      clinic_id: clinicId,
      assigned_staff_id: form.assigned_staff_id || null,
      sales_staff_id: form.sales_staff_id || null,
    }
    if (editing) {
      await supabase.from('houmon_patients').update(data).eq('id', editing.id)
    } else {
      await supabase.from('houmon_patients').insert(data)
    }
    resetForm()
    load()
  }

  const handleEdit = (p: Patient) => {
    setForm({
      name: p.name, kana: p.kana, phone: p.phone,
      care_level: p.care_level, insurance_number: p.insurance_number,
      primary_condition: p.primary_condition,
      assigned_staff_id: p.assigned_staff_id || '',
      sales_staff_id: p.sales_staff_id || '',
      visit_frequency: p.visit_frequency, visit_day_preference: p.visit_day_preference,
      notes: p.notes,
    })
    setEditing(p)
    setShowForm(true)
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('この患者を非アクティブにしますか？')) return
    await supabase.from('houmon_patients').update({ is_active: false }).eq('id', id)
    load()
  }

  const getStaffName = (id: string | null) =>
    staffList.find(s => s.id === id)?.name || '未割当'

  const filtered = patients.filter(p =>
    !search || p.name.includes(search) || p.kana.includes(search)
  )

  if (loading) return <p className="text-center text-gray-400 py-8">読み込み中...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">患者一覧（{patients.length}名）</h2>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium">
          + 追加
        </button>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="名前で検索..."
        className="w-full px-3 py-2 border rounded-lg text-sm"
      />

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h3 className="font-bold">{editing ? '患者編集' : '新規患者'}</h3>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="氏名 *" className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.kana} onChange={e => setForm({ ...form, kana: e.target.value })}
              placeholder="フリガナ" className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="電話番号" className="px-3 py-2 border rounded-lg text-sm" />
            <select value={form.care_level} onChange={e => setForm({ ...form, care_level: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm">
              <option value="">介護度</option>
              {CARE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.insurance_number} onChange={e => setForm({ ...form, insurance_number: e.target.value })}
              placeholder="保険証番号" className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.primary_condition} onChange={e => setForm({ ...form, primary_condition: e.target.value })}
              placeholder="主傷病名" className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <select value={form.assigned_staff_id} onChange={e => setForm({ ...form, assigned_staff_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">施術担当者</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}（{s.role}）</option>)}
          </select>
          <select value={form.sales_staff_id} onChange={e => setForm({ ...form, sales_staff_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">営業担当者</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}（{s.role}）</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.visit_frequency} onChange={e => setForm({ ...form, visit_frequency: e.target.value })}
              placeholder="訪問頻度（例:週2回）" className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.visit_day_preference} onChange={e => setForm({ ...form, visit_day_preference: e.target.value })}
              placeholder="希望曜日（例:月水金）" className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="備考" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!form.name.trim()}
              className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {editing ? '更新' : '登録'}
            </button>
            <button onClick={resetForm}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">キャンセル</button>
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
                {p.primary_condition && (
                  <p className="text-xs text-gray-500 mt-1">{p.primary_condition}</p>
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
                  className="px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs">編集</button>
                <button onClick={() => handleDeactivate(p.id)}
                  className="px-2 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs">無効</button>
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
