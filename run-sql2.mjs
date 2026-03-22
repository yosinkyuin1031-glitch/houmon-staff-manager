import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres:fJZj8SDawfJze7H9@db.vzkfkazjylrkspqrnhnx.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

await client.connect();

// Execute as single transaction
const sql = `
CREATE TABLE IF NOT EXISTS houmon_staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  role TEXT DEFAULT '鍼灸師',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  license_number TEXT DEFAULT '',
  hire_date DATE,
  hourly_rate INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS houmon_patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  kana TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  care_level TEXT DEFAULT '',
  insurance_number TEXT DEFAULT '',
  primary_condition TEXT DEFAULT '',
  assigned_staff_id UUID REFERENCES houmon_staff(id),
  visit_frequency TEXT DEFAULT '',
  visit_day_preference TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS houmon_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  staff_id UUID REFERENCES houmon_staff(id) NOT NULL,
  patient_id UUID REFERENCES houmon_patients(id) NOT NULL,
  visit_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  status TEXT DEFAULT 'scheduled',
  treatment_content TEXT DEFAULT '',
  insurance_type TEXT DEFAULT '医療保険',
  insurance_points INTEGER DEFAULT 0,
  self_pay_amount INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS houmon_shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  staff_id UUID REFERENCES houmon_staff(id) NOT NULL,
  shift_date DATE NOT NULL,
  start_time TEXT DEFAULT '09:00',
  end_time TEXT DEFAULT '18:00',
  is_off BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, shift_date)
);
`;

try {
  await client.query(sql);
  console.log('Tables created successfully!');

  // Indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_houmon_visits_date ON houmon_visits(visit_date)',
    'CREATE INDEX IF NOT EXISTS idx_houmon_visits_staff ON houmon_visits(staff_id)',
    'CREATE INDEX IF NOT EXISTS idx_houmon_shifts_date ON houmon_shifts(shift_date)',
    'CREATE INDEX IF NOT EXISTS idx_houmon_staff_clinic ON houmon_staff(clinic_id)',
    'CREATE INDEX IF NOT EXISTS idx_houmon_patients_clinic ON houmon_patients(clinic_id)',
  ];
  for (const idx of indexes) {
    await client.query(idx);
    console.log('OK:', idx.slice(0, 60));
  }

  // RLS
  const rls = [
    'ALTER TABLE houmon_staff ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE houmon_patients ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE houmon_visits ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE houmon_shifts ENABLE ROW LEVEL SECURITY',
  ];
  for (const r of rls) {
    try { await client.query(r); console.log('OK:', r); } catch(e) { console.log('Skip:', e.message.slice(0, 60)); }
  }

  // Policies
  const policies = [
    `CREATE POLICY "allow_all_houmon_staff" ON houmon_staff FOR ALL USING (true) WITH CHECK (true)`,
    `CREATE POLICY "allow_all_houmon_patients" ON houmon_patients FOR ALL USING (true) WITH CHECK (true)`,
    `CREATE POLICY "allow_all_houmon_visits" ON houmon_visits FOR ALL USING (true) WITH CHECK (true)`,
    `CREATE POLICY "allow_all_houmon_shifts" ON houmon_shifts FOR ALL USING (true) WITH CHECK (true)`,
  ];
  for (const p of policies) {
    try { await client.query(p); console.log('OK:', p.slice(0, 60)); } catch(e) { console.log('Skip:', e.message.slice(0, 60)); }
  }

  console.log('Done!');
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await client.end();
}
