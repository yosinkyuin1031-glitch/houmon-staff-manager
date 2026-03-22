#!/bin/bash
# 訪問鍼灸 データバックアップスクリプト
# 使い方: bash backup.sh

DB="postgresql://postgres.vzkfkazjylrkspqrnhnx:fJZj8SDawfJze7H9@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
DATE=$(date +%Y%m%d_%H%M)
DIR="$(dirname "$0")/backups"
mkdir -p "$DIR"

echo "=== 訪問鍼灸 バックアップ開始 ($DATE) ==="

TABLES=("houmon_staff" "houmon_patients" "houmon_facilities" "houmon_visits" "houmon_shifts")

for TABLE in "${TABLES[@]}"; do
  FILE="$DIR/${TABLE}_${DATE}.json"
  npx supabase db query "SELECT row_to_json(t)::text FROM $TABLE t" --db-url "$DB" > "$FILE" 2>/dev/null
  COUNT=$(npx supabase db query "SELECT count(*)::text as cnt FROM $TABLE" --db-url "$DB" 2>/dev/null | grep -o '"cnt": "[^"]*"' | cut -d'"' -f4)
  echo "  $TABLE: ${COUNT}件 -> $FILE"
done

echo "=== バックアップ完了: $DIR ==="
