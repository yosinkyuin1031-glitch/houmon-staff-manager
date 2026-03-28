'use client'

import { useState, useEffect } from 'react'
import { createClient, getClinicId } from '@/lib/supabase'
import { Visit, Staff, Patient, VISIT_STATUSES } from '@/lib/types'
import { HomeSkeleton } from '@/components/ui'

export default function HomeTab() {
  const supabase = createClient()
  const clinicId = getClinicId()
  const [todayVisits, setTodayVisits] = useState<(Visit & { staff: Staff; patient: Patient })[]>([])
  const [staffCount, setStaffCount] = useState(0)
  const [patientCount, setPatientCount] = useState(0)
  const [monthStats, setMonthStats] = useState({ visits: 0, completed: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0]
      const monthStart = today.slice(0, 7) + '-01'

      const [visitsRes, staffRes, patientRes, monthRes] = await Promise.all([
        supabase
          .from('houmon_visits')
          .select('*, staff:houmon_staff(*), patient:houmon_patients(*)')
          .eq('clinic_id', clinicId)
          .eq('visit_date', today)
          .order('start_time'),
        supabase
          .from('houmon_staff')
          .select('id', { count: 'exact' })
          .eq('clinic_id', clinicId)
          .eq('is_active', true),
        supabase
          .from('houmon_patients')
          .select('id', { count: 'exact' })
          .eq('clinic_id', clinicId)
          .eq('is_active', true),
        supabase
          .from('houmon_visits')
          .select('status, insurance_points, self_pay_amount')
          .eq('clinic_id', clinicId)
          .gte('visit_date', monthStart)
          .lte('visit_date', today),
      ])

      setTodayVisits((visitsRes.data || []) as (Visit & { staff: Staff; patient: Patient })[])
      setStaffCount(staffRes.count || 0)
      setPatientCount(patientRes.count || 0)

      const monthData = monthRes.data || []
      setMonthStats({
        visits: monthData.length,
        completed: monthData.filter(v => v.status === 'completed').length,
        revenue: monthData.reduce((sum, v) => sum + (v.insurance_points * 10) + (v.self_pay_amount || 0), 0),
      })

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <HomeSkeleton />

  const today = new Date()
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日（${['日','月','火','水','木','金','土'][today.getDay()]}）`

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{staffCount}</p>
          <p className="text-xs text-gray-500">スタッフ</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{patientCount}</p>
          <p className="text-xs text-gray-500">患者</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{todayVisits.length}</p>
          <p className="text-xs text-gray-500">今日の訪問</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-bold text-gray-800 mb-1">今月の実績</h3>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-gray-500">訪問数:</span>{' '}
            <span className="font-bold">{monthStats.completed}/{monthStats.visits}</span>
          </div>
          <div>
            <span className="text-gray-500">売上:</span>{' '}
            <span className="font-bold text-teal-600">{monthStats.revenue.toLocaleString()}円</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-bold text-gray-800 mb-3">本日のスケジュール（{dateStr}）</h3>
        {todayVisits.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">本日の訪問予定はありません</p>
        ) : (
          <div className="space-y-2">
            {todayVisits.map((v) => {
              const st = VISIT_STATUSES[v.status]
              return (
                <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-mono text-gray-600 w-16">
                    {v.start_time || '--:--'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {v.patient?.name || '不明'}
                    </p>
                    <p className="text-xs text-gray-500">
                      担当: {v.staff?.name || '不明'}
                      {v.patient?.address && ` / ${v.patient.address}`}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.color}`}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
