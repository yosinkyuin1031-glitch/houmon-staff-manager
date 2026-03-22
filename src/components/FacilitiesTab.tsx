'use client'

import { useState, useEffect } from 'react'
import { createClient, getClinicId } from '@/lib/supabase'
import { Facility } from '@/lib/types'

export default function FacilitiesTab() {
  const supabase = createClient()
  const clinicId = getClinicId()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Facility | null>(null)
  const [form, setForm] = useState({
    name: '', address: '', phone: '', contact_person: '', notes: '',
  })

  const load = async () => {
    const { data } = await supabase
      .from('houmon_facilities')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name')
    setFacilities(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resetForm = () => {
    setForm({ name: '', address: '', phone: '', contact_person: '', notes: '' })
    setEditing(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    const data = { ...form, clinic_id: clinicId }
    if (editing) {
      await supabase.from('houmon_facilities').update(data).eq('id', editing.id)
    } else {
      await supabase.from('houmon_facilities').insert(data)
    }
    resetForm()
    load()
  }

  const handleEdit = (f: Facility) => {
    setForm({
      name: f.name, address: f.address, phone: f.phone,
      contact_person: f.contact_person, notes: f.notes,
    })
    setEditing(f)
    setShowForm(true)
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('この施設を非アクティブにしますか？')) return
    await supabase.from('houmon_facilities').update({ is_active: false }).eq('id', id)
    load()
  }

  const filtered = facilities.filter(f =>
    !search || f.name.includes(search) || f.address.includes(search)
  )

  if (loading) return <p className="text-center text-gray-400 py-8">読み込み中...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">施設一覧（{facilities.length}件）</h2>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium">
          + 追加
        </button>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="施設名・住所で検索..."
        className="w-full px-3 py-2 border rounded-lg text-sm"
      />

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h3 className="font-bold">{editing ? '施設編集' : '新規施設'}</h3>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="施設名 *" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
            placeholder="住所" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="電話番号" className="px-3 py-2 border rounded-lg text-sm" />
            <input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })}
              placeholder="担当者名" className="px-3 py-2 border rounded-lg text-sm" />
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
        {filtered.map(f => (
          <div key={f.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800">{f.name}</h3>
                {f.address && <p className="text-xs text-gray-500 mt-0.5">{f.address}</p>}
                <p className="text-xs text-gray-400 mt-0.5">
                  {f.phone && `TEL: ${f.phone}`}
                  {f.contact_person && ` / 担当: ${f.contact_person}`}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {f.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-2 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs">地図</a>
                )}
                <button onClick={() => handleEdit(f)}
                  className="px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs">編集</button>
                <button onClick={() => handleDeactivate(f.id)}
                  className="px-2 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs">無効</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-400 text-center py-8">施設が登録されていません</p>
        )}
      </div>
    </div>
  )
}
