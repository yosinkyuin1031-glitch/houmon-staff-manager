'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient, getClinicId } from '@/lib/supabase'
import { Visit, Staff, Patient, VISIT_STATUSES } from '@/lib/types'

export default function ScheduleTab() {
  const supabase = createClient()
  const clinicId = getClinicId()
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [visits, setVisits] = useState<(Visit & { staff: Staff; patient: Patient })[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    staff_id: '', patient_id: '', start_time: '09:00', end_time: '09:30',
    treatment_content: '' as string, insurance_type: '医療保険', notes: '',
  })

  const TREATMENT_OPTIONS = ['鍼灸', 'マッサージ', '徒手矯正', '鍼灸+マッサージ', '鍼灸+徒手矯正', 'マッサージ+徒手矯正']

  const load = async () => {
    const [vRes, sRes, pRes] = await Promise.all([
      supabase
        .from('houmon_visits')
        .select('*, staff:houmon_staff(*), patient:houmon_patients(*)')
        .eq('clinic_id', clinicId)
        .eq('visit_date', selectedDate)
        .order('start_time'),
      supabase.from('houmon_staff').select('*').eq('clinic_id', clinicId).eq('is_active', true).order('name'),
      supabase.from('houmon_patients').select('*').eq('clinic_id', clinicId).eq('is_active', true).order('kana'),
    ])
    setVisits((vRes.data || []) as (Visit & { staff: Staff; patient: Patient })[])
    setStaffList(sRes.data || [])
    setPatients(pRes.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [selectedDate])

  const handleAddVisit = async () => {
    if (!form.staff_id || !form.patient_id) return
    await supabase.from('houmon_visits').insert({
      clinic_id: clinicId,
      staff_id: form.staff_id,
      patient_id: form.patient_id,
      visit_date: selectedDate,
      start_time: form.start_time,
      end_time: form.end_time,
      treatment_content: form.treatment_content,
      insurance_type: form.insurance_type,
      notes: form.notes,
      status: 'scheduled',
    })
    setShowForm(false)
    setForm({ staff_id: '', patient_id: '', start_time: '09:00', end_time: '09:30', treatment_content: '', insurance_type: '医療保険', notes: '' })
    load()
  }

  const handleStatusChange = async (id: string, status: Visit['status']) => {
    await supabase.from('houmon_visits').update({ status }).eq('id', id)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この訪問予定を削除しますか？')) return
    await supabase.from('houmon_visits').delete().eq('id', id)
    load()
  }

  const changeDate = (days: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  // 訪問施術料カテゴリ自動計算（同一スタッフ・同一日・同一施設）
  const visitFeeCategory = useMemo(() => {
    const categoryMap: Record<string, number> = {}
    // スタッフ×施設住所でグループ化
    const groups: Record<string, string[]> = {}
    for (const v of visits) {
      const addr = v.patient?.address || `個別_${v.patient_id}`
      const key = `${v.staff_id}_${addr}`
      if (!groups[key]) groups[key] = []
      groups[key].push(v.id)
    }
    // 各グループ内で時間順にソートして①②③を割当
    for (const ids of Object.values(groups)) {
      const sorted = ids.sort((a, b) => {
        const va = visits.find(v => v.id === a)
        const vb = visits.find(v => v.id === b)
        return (va?.start_time || '').localeCompare(vb?.start_time || '')
      })
      sorted.forEach((id, i) => {
        categoryMap[id] = Math.min(i + 1, 3) // 1=①, 2=②, 3+=③
      })
    }
    return categoryMap
  }, [visits])

  const FEE_LABELS: Record<number, { label: string; color: string }> = {
    1: { label: '①', color: 'bg-blue-100 text-blue-700' },
    2: { label: '②', color: 'bg-yellow-100 text-yellow-700' },
    3: { label: '③', color: 'bg-gray-100 text-gray-600' },
  }

  // スタッフ別にグループ化
  const groupedByStaff = useMemo(() => {
    const groups: Record<string, { staff: Staff; visits: (Visit & { patient: Patient })[] }> = {}
    for (const v of visits) {
      if (!groups[v.staff_id]) {
        groups[v.staff_id] = { staff: v.staff, visits: [] }
      }
      groups[v.staff_id].visits.push(v as Visit & { patient: Patient })
    }
    return Object.values(groups)
  }, [visits])

  const dateObj = new Date(selectedDate)
  const dayLabel = `${dateObj.getMonth() + 1}/${dateObj.getDate()}（${['日','月','火','水','木','金','土'][dateObj.getDay()]}）`

  if (loading) return <p className="text-center text-gray-400 py-8">読み込み中...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">◀</button>
        <div className="text-center">
          <input
            type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-center font-bold text-lg border-none bg-transparent"
          />
          <p className="text-xs text-gray-500">{dayLabel}</p>
        </div>
        <button onClick={() => changeDate(1)} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">▶</button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium"
        >
          今日
        </button>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium">
          + 訪問追加
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-sm">訪問追加（{dayLabel}）</h3>
          <select value={form.staff_id} onChange={e => setForm({ ...form, staff_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">スタッフを選択 *</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}（{s.role}）</option>)}
          </select>
          <select value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">患者を選択 *</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}{p.address ? ` (${p.address})` : ''}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">開始</label>
              <input type="time" value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">終了</label>
              <input type="time" value={form.end_time}
                onChange={e => setForm({ ...form, end_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <select value={form.treatment_content} onChange={e => setForm({ ...form, treatment_content: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">施術内容を選択</option>
            {TREATMENT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={form.insurance_type} onChange={e => setForm({ ...form, insurance_type: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="医療保険">医療保険</option>
            <option value="介護保険">介護保険</option>
            <option value="自費">自費</option>
          </select>
          <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="メモ" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="flex gap-2">
            <button onClick={handleAddVisit} disabled={!form.staff_id || !form.patient_id}
              className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              追加
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">キャンセル</button>
          </div>
        </div>
      )}

      {/* スタッフ別表示 */}
      {groupedByStaff.length === 0 ? (
        <p className="text-gray-400 text-center py-8">この日の訪問予定はありません</p>
      ) : (
        groupedByStaff.map(({ staff, visits: sv }) => (
          <div key={staff.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-teal-50 px-4 py-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-teal-800 text-sm">
                  {staff.name}
                  <span className="text-xs font-normal text-teal-600 ml-1">（{sv.length}件）</span>
                </h3>
                <div className="flex gap-1 text-xs">
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                    ①{sv.filter(v => visitFeeCategory[v.id] === 1).length}
                  </span>
                  {sv.some(v => visitFeeCategory[v.id] === 2) && (
                    <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">
                      ②{sv.filter(v => visitFeeCategory[v.id] === 2).length}
                    </span>
                  )}
                  {sv.some(v => visitFeeCategory[v.id] === 3) && (
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                      ③{sv.filter(v => visitFeeCategory[v.id] === 3).length}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {sv.map(v => {
                const st = VISIT_STATUSES[v.status]
                const fee = FEE_LABELS[visitFeeCategory[v.id]] || FEE_LABELS[1]
                return (
                  <div key={v.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-600">{v.start_time || '--:--'}</span>
                          <span className="font-medium text-sm">{v.patient?.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${fee.color}`}>
                            施術料{fee.label}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${st.color}`}>{st.label}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {v.patient?.address && `📍${v.patient.address}`}
                          {v.treatment_content && ` / ${v.treatment_content}`}
                          {v.insurance_type && ` / ${v.insurance_type}`}
                          {v.notes && ` / ${v.notes}`}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        {v.status === 'scheduled' && (
                          <>
                            <button onClick={() => handleStatusChange(v.id, 'completed')}
                              className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs">完了</button>
                            <button onClick={() => handleStatusChange(v.id, 'cancelled')}
                              className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs">取消</button>
                          </>
                        )}
                        {v.patient?.address && (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.patient.address)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs">地図</a>
                        )}
                        <button onClick={() => handleDelete(v.id)}
                          className="px-2 py-1 bg-red-50 text-red-500 rounded text-xs">削除</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      <p className="text-xs text-gray-400 text-center">
        合計: {visits.length}件
        （完了: {visits.filter(v => v.status === 'completed').length}件）
      </p>
    </div>
  )
}
