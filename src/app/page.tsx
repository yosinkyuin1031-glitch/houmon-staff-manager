'use client'

import { useState } from 'react'
import { TabType } from '@/lib/types'
import HomeTab from '@/components/HomeTab'
import ScheduleTab from '@/components/ScheduleTab'
import StaffTab from '@/components/StaffTab'
import PatientsTab from '@/components/PatientsTab'
import ReportTab from '@/components/ReportTab'

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'home', label: 'ホーム', icon: '🏠' },
  { id: 'schedule', label: 'スケジュール', icon: '📅' },
  { id: 'staff', label: 'スタッフ', icon: '👤' },
  { id: 'patients', label: '患者', icon: '🏥' },
  { id: 'report', label: 'レポート', icon: '📊' },
]

export default function Home() {
  const [tab, setTab] = useState<TabType>('home')

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-teal-600 text-white sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-lg font-bold">訪問鍼灸スタッフ管理</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {tab === 'home' && <HomeTab />}
        {tab === 'schedule' && <ScheduleTab />}
        {tab === 'staff' && <StaffTab />}
        {tab === 'patients' && <PatientsTab />}
        {tab === 'report' && <ReportTab />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
        <div className="max-w-lg mx-auto flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
                tab === t.id ? 'text-teal-600' : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
