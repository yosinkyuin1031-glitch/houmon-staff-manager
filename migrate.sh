#!/bin/bash
DB="postgresql://postgres.vzkfkazjylrkspqrnhnx:fJZj8SDawfJze7H9@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
Q() { npx supabase db query "$1" --db-url "$DB" 2>&1; }

echo "=== スタッフ挿入 ==="
Q "INSERT INTO houmon_staff (clinic_id, name, role, is_active) VALUES ('00000000-0000-0000-0000-000000000001', '安野亮佑', '鍼灸マッサージ師', true)"
Q "INSERT INTO houmon_staff (clinic_id, name, role, is_active) VALUES ('00000000-0000-0000-0000-000000000001', '鈴木太郎', '鍼灸マッサージ師', true)"

echo "=== スタッフID取得 ==="
KAWABATA=$(Q "SELECT id::text FROM houmon_staff WHERE name='川畑大地'" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
YASUNO=$(Q "SELECT id::text FROM houmon_staff WHERE name='安野亮佑'" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
SUZUKI=$(Q "SELECT id::text FROM houmon_staff WHERE name='鈴木太郎'" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
echo "川畑: $KAWABATA"
echo "安野: $YASUNO"
echo "鈴木: $SUZUKI"

echo "=== 施設挿入 ==="
FACILITIES=(
  "百寿荘"
  "ルルポ泉ケ丘"
  "グランドオーク百寿"
  "エコハウスくみのき"
  "グループホームくみのき"
  "ナーシングホームmiraie"
  "特別養護老人ホーム陽だまりの丘"
  "ラフォート東池尻"
  "ラフォート狭山池"
  "ケアハウス美和"
  "幸せの風"
  "さくらの杜池ノ原"
  "グループホームあおぞら"
  "くみのき苑千寿"
  "ベルシャンテハウス"
  "寿里苑花舞の里"
  "みんなのわが家はるか"
  "シェアハウス徒然"
)
for f in "${FACILITIES[@]}"; do
  Q "INSERT INTO houmon_facilities (clinic_id, name, is_active) VALUES ('00000000-0000-0000-0000-000000000001', '$f', true)"
done

echo "=== 施設ID取得 ==="
get_fid() { Q "SELECT id::text FROM houmon_facilities WHERE name='$1' LIMIT 1" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4; }

F_HYAKUJU=$(get_fid "百寿荘")
F_RUROPO=$(get_fid "ルルポ泉ケ丘")
F_GRAND=$(get_fid "グランドオーク百寿")
F_ECO=$(get_fid "エコハウスくみのき")
F_GH_KUMINOKI=$(get_fid "グループホームくみのき")
F_MIRAIE=$(get_fid "ナーシングホームmiraie")
F_HIDAMARI=$(get_fid "特別養護老人ホーム陽だまりの丘")
F_LAFORT_HIGASHI=$(get_fid "ラフォート東池尻")
F_LAFORT_SAYAMA=$(get_fid "ラフォート狭山池")
F_MIWA=$(get_fid "ケアハウス美和")
F_SHIAWASE=$(get_fid "幸せの風")
F_SAKURA=$(get_fid "さくらの杜池ノ原")
F_AOZORA=$(get_fid "グループホームあおぞら")
F_SENJU=$(get_fid "くみのき苑千寿")
F_BELL=$(get_fid "ベルシャンテハウス")
F_JYURIEN=$(get_fid "寿里苑花舞の里")
F_HARUKA=$(get_fid "みんなのわが家はるか")
F_TSUREDURE=$(get_fid "シェアハウス徒然")

echo "=== 患者挿入 ==="
# 旧営業担当マッピング: mmwt6ojopqmhiqr=川畑, mmwt6ropa71f63u=安野, mmwt6u0z97imcmh=鈴木

ins_patient() {
  local name="$1" kana="$2" fid="$3" sales="$4" notes="$5" active="$6" addr="$7"
  local fid_sql="NULL"
  local sales_sql="NULL"
  [ -n "$fid" ] && fid_sql="'$fid'"
  [ -n "$sales" ] && sales_sql="'$sales'"
  [ -z "$active" ] && active="true"
  Q "INSERT INTO houmon_patients (clinic_id, name, kana, facility_id, sales_staff_id, notes, is_active, address) VALUES ('00000000-0000-0000-0000-000000000001', '$name', '$kana', $fid_sql, $sales_sql, '$notes', $active, '$addr')"
}

ins_patient "青木迪子" "あおきみちこ" "$F_JYURIEN" "$KAWABATA" "保険: 後期高齢(1割) / 施術: 鍼灸＋マッサージ / 状態: 施術中 / 医師: 永木Doctor / 部位数: 5 / 負担割合: 10% / 場所: 施設" "true"
ins_patient "青森勝野" "あおもりかつの" "" "$KAWABATA" "保険: 大阪府重度障害医療 / 施術: 鍼灸＋マッサージ / 状態: 施術中 / 部位数: 5 / 場所: 自宅" "true"
ins_patient "石田芳枝" "いしだよしえ" "" "$KAWABATA" "保険: 後期高齢(1割) / 施術: 鍼灸＋マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 自宅" "true"
ins_patient "石本加代子" "いしもとかよこ" "$F_HARUKA" "$KAWABATA" "保険: 後期高齢(1割) / 施術: マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 施設" "true"
ins_patient "井上正廣" "いのうえまさひろ" "$F_TSUREDURE" "$YASUNO" "保険: 後期高齢(1割) / 施術: 鍼灸＋マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 施設" "true"
ins_patient "井上マサヨ" "いのうえまさよ" "$F_GRAND" "$YASUNO" "保険: 後期高齢(1割) / 施術: マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 施設" "true"
ins_patient "今田圭子" "いまだけいこ" "$F_MIRAIE" "" "保険: 後期高齢(1割) / 施術: 鍼灸＋マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 施設" "true"
ins_patient "入交喬子" "いりまじりきょうこ" "$F_GH_KUMINOKI" "$SUZUKI" "保険: 後期高齢(3割) / 施術: マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 30% / 場所: 施設" "true"
ins_patient "上本保彰" "うえもとやすあき" "" "$KAWABATA" "保険: その他医療証 / 施術: マッサージ / 状態: 施術中 / 部位数: 5 / 場所: 自宅" "true"
ins_patient "岩谷久子" "いわたにひさこ" "$F_AOZORA" "$YASUNO" "保険: 後期高齢(1割) / 施術: マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 施設" "true"
ins_patient "上野ミツホ" "うえのみつほ" "$F_GH_KUMINOKI" "$SUZUKI" "保険: 後期高齢(1割) / 施術: マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 施設" "true" "大阪狭山市茱萸木３丁目１６２番地の15"
ins_patient "内田リツ子" "うちだりつこ" "" "$YASUNO" "保険: 後期高齢(1割) / 施術: 鍼灸＋マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 自宅" "true"
ins_patient "海野ミヤコ" "うみのみやこ" "$F_HYAKUJU" "$YASUNO" "保険: 後期高齢(1割) / 施術: マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 施設" "true"
ins_patient "沖谷恵子" "おきたにけいこ" "$F_SHIAWASE" "$KAWABATA" "保険: 後期高齢(1割) / 施術: 鍼灸＋マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 施設" "true"
ins_patient "沖本曙美" "おきもとあけみ" "" "$KAWABATA" "保険: 後期高齢(2割) / 施術: 鍼灸＋マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 20% / 場所: 自宅" "true"
ins_patient "奥中千恵子" "おくなかちえこ" "$F_SAKURA" "$KAWABATA" "保険: 後期高齢(1割) / 施術: マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 施設" "true"
ins_patient "奥本ふじ子" "おくもとふじこ" "$F_RUROPO" "$SUZUKI" "保険: 後期高齢(1割) / 施術: マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 施設" "true"
ins_patient "小野寺節子" "おのでらせつこ" "" "$KAWABATA" "保険: 後期高齢(1割) / 施術: 鍼灸＋マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 自宅" "true"
ins_patient "椛島恭子" "かばしまきょうこ" "$F_AOZORA" "$SUZUKI" "保険: 後期高齢(1割) / 施術: マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 施設" "true"
ins_patient "川崎孝広" "かわさきたかひろ" "" "$YASUNO" "保険: その他医療証 / 施術: マッサージ / 状態: 施術中 / 部位数: 5 / 場所: 自宅" "true"
ins_patient "木澤育代" "きざわいくよ" "" "" "保険: 後期高齢(1割) / 施術: 鍼灸＋マッサージ / 状態: 施術中 / 部位数: 5 / 負担割合: 10% / 場所: 自宅" "true" "大阪府南河内郡千早赤阪村小吹68-909"
ins_patient "木澤清司" "きざわせいじ" "" "$KAWABATA" "保険: 後期高齢(1割) / 施術: 鍼灸＋マッサージ / 状態: 休止中 / 部位数: 5 / 負担割合: 10% / 場所: 自宅" "false" "大阪府南河内郡千早赤阪村小吹68-909"

echo "=== 確認 ==="
Q "SELECT count(*)::text as cnt FROM houmon_staff WHERE clinic_id='00000000-0000-0000-0000-000000000001'"
Q "SELECT count(*)::text as cnt FROM houmon_facilities WHERE clinic_id='00000000-0000-0000-0000-000000000001'"
Q "SELECT count(*)::text as cnt FROM houmon_patients WHERE clinic_id='00000000-0000-0000-0000-000000000001'"

echo "=== 移行完了 ==="
