-- 訪問鍼灸スタッフ管理アプリ DB設計
-- Supabase: vzkfkazjylrkspqrnhnx（共有プロジェクト）

-- スタッフテーブル
CREATE TABLE IF NOT EXISTS houmon_staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  role TEXT DEFAULT '鍼灸師', -- 鍼灸師, マッサージ師, 柔道整復師, etc.
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  license_number TEXT DEFAULT '', -- 免許番号
  hire_date DATE,
  hourly_rate INTEGER DEFAULT 0, -- 時給（円）
  is_active BOOLEAN DEFAULT true,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 訪問患者テーブル
CREATE TABLE IF NOT EXISTS houmon_patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  kana TEXT DEFAULT '', -- フリガナ
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  care_level TEXT DEFAULT '', -- 要介護度: 要支援1,2 要介護1-5
  insurance_number TEXT DEFAULT '', -- 保険証番号
  primary_condition TEXT DEFAULT '', -- 主傷病名
  assigned_staff_id UUID REFERENCES houmon_staff(id),
  sales_staff_id UUID REFERENCES houmon_staff(id), -- 営業担当者
  visit_frequency TEXT DEFAULT '', -- 週2回、月8回 etc.
  visit_day_preference TEXT DEFAULT '', -- 月水金 etc.
  is_active BOOLEAN DEFAULT true,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 訪問スケジュールテーブル
CREATE TABLE IF NOT EXISTS houmon_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  staff_id UUID REFERENCES houmon_staff(id) NOT NULL,
  patient_id UUID REFERENCES houmon_patients(id) NOT NULL,
  visit_date DATE NOT NULL,
  start_time TEXT, -- "09:00"
  end_time TEXT, -- "09:30"
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  treatment_content TEXT DEFAULT '', -- 施術内容
  insurance_type TEXT DEFAULT '医療保険', -- 医療保険, 介護保険
  insurance_points INTEGER DEFAULT 0, -- 保険点数
  self_pay_amount INTEGER DEFAULT 0, -- 自費金額
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- シフトテーブル
CREATE TABLE IF NOT EXISTS houmon_shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  staff_id UUID REFERENCES houmon_staff(id) NOT NULL,
  shift_date DATE NOT NULL,
  start_time TEXT DEFAULT '09:00',
  end_time TEXT DEFAULT '18:00',
  is_off BOOLEAN DEFAULT false, -- 休み
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, shift_date)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_houmon_visits_date ON houmon_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_houmon_visits_staff ON houmon_visits(staff_id);
CREATE INDEX IF NOT EXISTS idx_houmon_shifts_date ON houmon_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_houmon_staff_clinic ON houmon_staff(clinic_id);
CREATE INDEX IF NOT EXISTS idx_houmon_patients_clinic ON houmon_patients(clinic_id);

-- RLS有効化
ALTER TABLE houmon_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE houmon_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE houmon_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE houmon_shifts ENABLE ROW LEVEL SECURITY;

-- 全ユーザーに読み書き許可（anon key使用のため）
CREATE POLICY "allow_all_houmon_staff" ON houmon_staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_houmon_patients" ON houmon_patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_houmon_visits" ON houmon_visits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_houmon_shifts" ON houmon_shifts FOR ALL USING (true) WITH CHECK (true);
