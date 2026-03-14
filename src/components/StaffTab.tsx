'use client'

import { useState, useEffect } from 'react'
import { createClient, getClinicId } from '@/lib/supabase'
import { Staff, STAFF_ROLES } from '@/lib/types'

export default function StaffTab() {
  const supabase = createClient()
  const clinicId = getClinicId()
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [form, setForm] = useState({
    name: '', role: '鍼灸師', phone: '', email: '',
    license_number: '', hire_date: '', hourly_rate: 0, notes: '',
  })

  const load = async () => {
    const { data } = await supabase
      .from('houmon_staff')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name')
    setStaffList(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resetForm = () => {
    setForm({ name: '', role: '鍼灸師', phone: '', email: '', license_number: '', hire_date: '', hourly_rate: 0, notes: '' })
    setEditing(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return

    const data = {
      ...form,
      clinic_id: clinicId,
      hire_date: form.hire_date || null,
      hourly_rate: form.hourly_rate || 0,
    }

    if (editing) {
      await supabase.from('houmon_staff').update(data).eq('id', editing.id)
    } else {
      await supabase.from('houmon_staff').insert(data)
    }
    resetForm()
    load()
  }

  const handleEdit = (s: Staff) => {
    setForm({
      name: s.name, role: s.role, phone: s.phone, email: s.email,
      license_number: s.license_number, hire_date: s.hire_date || '',
      hourly_rate: s.hourly_rate, notes: s.notes,
    })
    setEditing(s)
    setShowForm(true)
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('このスタッフを無効にしますか？')) return
    await supabase.from('houmon_staff').update({ is_active: false }).eq('id', id)
    load()
  }

  if (loading) return <p className="text-center text-gray-400 py-8">読み込み中...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">スタッフ一覧（{staffList.length}名）</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium"
        >
          + 追加
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h3 className="font-bold">{editing ? 'スタッフ編集' : '新規スタッフ'}</h3>
          <input
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="氏名 *" className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <select
            value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="電話番号" className="px-3 py-2 border rounded-lg text-sm"
            />
            <input
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="メール" className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })}
              placeholder="免許番号" className="px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="date" value={form.hire_date}
              onChange={e => setForm({ ...form, hire_date: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">時給（円）</label>
            <input
              type="number" value={form.hourly_rate}
              onChange={e => setForm({ ...form, hourly_rate: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <textarea
            value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="備考" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!form.name.trim()}
              className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {editing ? '更新' : '登録'}
            </button>
            <button onClick={resetForm}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {staffList.map((s) => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800">{s.name}</h3>
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{s.role}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {s.phone && `TEL: ${s.phone}`}
                  {s.license_number && ` / 免許: ${s.license_number}`}
                </p>
                {s.hourly_rate > 0 && (
                  <p className="text-xs text-gray-400">時給: {s.hourly_rate.toLocaleString()}円</p>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(s)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs">
                  編集
                </button>
                <button onClick={() => handleDeactivate(s.id)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs">
                  無効
                </button>
              </div>
            </div>
          </div>
        ))}
        {staffList.length === 0 && (
          <p className="text-gray-400 text-center py-8">スタッフが登録されていません</p>
        )}
      </div>
    </div>
  )
}
