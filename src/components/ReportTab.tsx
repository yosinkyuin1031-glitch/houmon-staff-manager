'use client'

import { useState, useEffect } from 'react'
import { createClient, getClinicId } from '@/lib/supabase'
import { Staff } from '@/lib/types'
import { ReportSkeleton } from '@/components/ui'

interface DailyStats {
  date: string
  total: number
  completed: number
  cancelled: number
  no_show: number
  revenue: number
}

interface StaffStats {
  staff: Staff
  total: number
  completed: number
  revenue: number
}

export default function ReportTab() {
  const supabase = createClient()
  const clinicId = getClinicId()
  const [period, setPeriod] = useState<'week' | 'month'>('month')
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [staffStats, setStaffStats] = useState<StaffStats[]>([])
  const [totals, setTotals] = useState({ visits: 0, completed: 0, revenue: 0, patients: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const now = new Date()
      const startDate = new Date()
      if (period === 'week') {
        startDate.setDate(now.getDate() - 7)
      } else {
        startDate.setDate(1)
      }
      const start = startDate.toISOString().split('T')[0]
      const end = now.toISOString().split('T')[0]

      const [visitsRes, staffRes] = await Promise.all([
        supabase
          .from('houmon_visits')
          .select('*, staff:houmon_staff(*)')
          .eq('clinic_id', clinicId)
          .gte('visit_date', start)
          .lte('visit_date', end),
        supabase
          .from('houmon_staff')
          .select('*')
          .eq('clinic_id', clinicId)
          .eq('is_active', true),
      ])

      const visits = visitsRes.data || []
      const staff = staffRes.data || []

      // 日別集計
      const byDate: Record<string, DailyStats> = {}
      for (const v of visits) {
        if (!byDate[v.visit_date]) {
          byDate[v.visit_date] = { date: v.visit_date, total: 0, completed: 0, cancelled: 0, no_show: 0, revenue: 0 }
        }
        const d = byDate[v.visit_date]
        d.total++
        if (v.status === 'completed') {
          d.completed++
          d.revenue += (v.insurance_points * 10) + (v.self_pay_amount || 0)
        } else if (v.status === 'cancelled') d.cancelled++
        else if (v.status === 'no_show') d.no_show++
      }
      const daily = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date))

      // スタッフ別集計
      const byStaff: Record<string, StaffStats> = {}
      for (const s of staff) {
        byStaff[s.id] = { staff: s, total: 0, completed: 0, revenue: 0 }
      }
      for (const v of visits) {
        if (byStaff[v.staff_id]) {
          byStaff[v.staff_id].total++
          if (v.status === 'completed') {
            byStaff[v.staff_id].completed++
            byStaff[v.staff_id].revenue += (v.insurance_points * 10) + (v.self_pay_amount || 0)
          }
        }
      }

      const uniquePatients = new Set(visits.filter(v => v.status === 'completed').map(v => v.patient_id))

      setDailyStats(daily)
      setStaffStats(Object.values(byStaff).filter(s => s.total > 0).sort((a, b) => b.completed - a.completed))
      setTotals({
        visits: visits.length,
        completed: visits.filter(v => v.status === 'completed').length,
        revenue: visits.filter(v => v.status === 'completed')
          .reduce((sum, v) => sum + (v.insurance_points * 10) + (v.self_pay_amount || 0), 0),
        patients: uniquePatients.size,
      })
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  if (loading) return <ReportSkeleton />

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist" aria-label="期間選択">
        <button onClick={() => setPeriod('week')}
          role="tab" aria-selected={period === 'week'} aria-label="直近7日間のレポート"
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${period === 'week' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          直近7日
        </button>
        <button onClick={() => setPeriod('month')}
          role="tab" aria-selected={period === 'month'} aria-label="今月のレポート"
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${period === 'month' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          今月
        </button>
      </div>

      {/* サマリ */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{totals.completed}</p>
          <p className="text-xs text-gray-500">施術完了数</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totals.patients}</p>
          <p className="text-xs text-gray-500">施術患者数</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {totals.visits > 0 ? Math.round((totals.completed / totals.visits) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-500">完了率</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-xl font-bold text-green-600">{totals.revenue.toLocaleString()}円</p>
          <p className="text-xs text-gray-500">売上合計</p>
        </div>
      </div>

      {/* スタッフ別 */}
      {staffStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-bold text-gray-800 mb-3">スタッフ別実績</h3>
          <div className="space-y-2">
            {staffStats.map(({ staff, total, completed, revenue }) => (
              <div key={staff.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{staff.name}</p>
                  <p className="text-xs text-gray-400">{staff.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{completed}/{total}件</p>
                  <p className="text-xs text-green-600">{revenue.toLocaleString()}円</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 日別 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-bold text-gray-800 mb-3">日別実績</h3>
        {dailyStats.length === 0 ? (
          <p className="text-gray-400 text-center py-4 text-sm">データがありません</p>
        ) : (
          <div className="space-y-1">
            {dailyStats.map(d => {
              const date = new Date(d.date)
              const dayName = ['日','月','火','水','木','金','土'][date.getDay()]
              return (
                <div key={d.date} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <span className="font-mono">{d.date.slice(5)}</span>
                    <span className={`text-xs ml-1 ${dayName === '日' ? 'text-red-500' : dayName === '土' ? 'text-blue-500' : 'text-gray-400'}`}>
                      ({dayName})
                    </span>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="text-green-600 font-medium">{d.completed}件</span>
                    {d.cancelled > 0 && <span className="text-gray-400 text-xs">取消{d.cancelled}</span>}
                    {d.no_show > 0 && <span className="text-red-400 text-xs">不在{d.no_show}</span>}
                    <span className="text-xs text-gray-500 w-20 text-right">{d.revenue.toLocaleString()}円</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
