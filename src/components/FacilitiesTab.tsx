'use client'

import { useState, useEffect } from 'react'
import { createClient, getClinicId } from '@/lib/supabase'
import { Facility } from '@/lib/types'
import { SkeletonList, useConfirm, useToast } from '@/components/ui'

export default function FacilitiesTab() {
  const supabase = createClient()
  const clinicId = getClinicId()
  const { confirm, modal: confirmModal } = useConfirm()
  const { showToast } = useToast()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Facility | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  const resetForm = () => {
    setForm({ name: '', address: '', phone: '', contact_person: '', notes: '' })
    setEditing(null)
    setShowForm(false)
    setFormErrors({})
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = '施設名を入力してください'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    const data = { ...form, clinic_id: clinicId }
    if (editing) {
      const { error } = await supabase.from('houmon_facilities').update(data).eq('id', editing.id)
      if (error) { showToast('更新に失敗しました', 'error'); return }
      showToast('施設情報を更新しました')
    } else {
      const { error } = await supabase.from('houmon_facilities').insert(data)
      if (error) { showToast('登録に失敗しました', 'error'); return }
      showToast('施設を登録しました')
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
    setFormErrors({})
  }

  const handleDeactivate = async (id: string) => {
    const ok = await confirm('施設の無効化', 'この施設を非アクティブにしますか？一覧から非表示になります。', 'danger')
    if (!ok) return
    const { error } = await supabase.from('houmon_facilities').update({ is_active: false }).eq('id', id)
    if (error) { showToast('無効化に失敗しました', 'error'); return }
    showToast('施設を非アクティブにしました')
    load()
  }

  const filtered = facilities.filter(f =>
    !search || f.name.includes(search) || f.address.includes(search)
  )

  if (loading) return <SkeletonList count={3} />

  return (
    <div className="space-y-4">
      {confirmModal}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">施設一覧（{facilities.length}件）</h2>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium"
          aria-label="施設を追加">
          + 追加
        </button>
      </div>

      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="施設名・住所で検索..."
        className="w-full px-3 py-2 border rounded-lg text-sm"
        aria-label="施設を検索"
      />

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3" role="form" aria-label={editing ? '施設編集フォーム' : '新規施設登録フォーム'}>
          <h3 className="font-bold">{editing ? '施設編集' : '新規施設'}</h3>
          <div>
            <input value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setFormErrors(prev => ({ ...prev, name: '' })) }}
              placeholder="施設名 *" className={`w-full px-3 py-2 border rounded-lg text-sm ${formErrors.name ? 'border-red-400' : ''}`}
              aria-label="施設名" aria-invalid={!!formErrors.name} aria-required="true" />
            {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
          </div>
          <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
            placeholder="住所" className="w-full px-3 py-2 border rounded-lg text-sm" aria-label="住所" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="電話番号" className="px-3 py-2 border rounded-lg text-sm" aria-label="電話番号" type="tel" />
            <input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })}
              placeholder="担当者名" className="px-3 py-2 border rounded-lg text-sm" aria-label="担当者名" />
          </div>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="備考" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" aria-label="備考" />
          <div className="flex gap-2">
            <button onClick={handleSave}
              className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              aria-label={editing ? '施設情報を更新' : '施設を登録'}>
              {editing ? '更新' : '登録'}
            </button>
            <button onClick={resetForm}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm" aria-label="フォームを閉じる">キャンセル</button>
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
                    className="px-2 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs"
                    aria-label={`${f.name}の住所を地図で表示`}>地図</a>
                )}
                <button onClick={() => handleEdit(f)}
                  className="px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs"
                  aria-label={`${f.name}を編集`}>編集</button>
                <button onClick={() => handleDeactivate(f.id)}
                  className="px-2 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs"
                  aria-label={`${f.name}を無効にする`}>無効</button>
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
