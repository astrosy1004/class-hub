// 서울 열린데이터광장 [내국인] 행정동별 서울 생활인구(250m) — 서비스 Spop250mLocalResdDong 어댑터.
//
// 확인된 규격 (probe 결과)
//   요청: /{키}/json/Spop250mLocalResdDong/{시작}/{끝}/{일자 YYYYMMDD}/{시간 00~23}[/{행정동코드}]
//   응답 한 행 = 일자(YMD) · 시간(TT) · 행정동(H_DNG_CD) 한 곳. SPOP(합계), 남 M00~M70 · 여 F00~F70 (14구간)
//   ※ 행정동코드 필터는 최근(공백이 붙은 코드) 자료에서 동작하지 않는다. 그래서 (일자, 시간)으로 전 행정동(약 427건)을
//     한 번에 받고 우리가 동을 고른다. 한 번에 최대 1000건이라 427건은 1회 호출로 충분하다.
//
// 환경변수
//   SEOUL_API_KEY   인증키
//   SEOUL_SERVICE   서비스명 (기본 Spop250mLocalResdDong)
const BASE = "http://openapi.seoul.go.kr:8088";

export const env = () => ({
  key: process.env.SEOUL_API_KEY || "",
  service: process.env.SEOUL_SERVICE || "Spop250mLocalResdDong",
});

// Kakao 행정동 코드(10자리)의 앞 8자리가 서울 자료의 H_DNG_CD(공백 제거)와 같다
export const dong8 = (dong) => String(dong).trim().slice(0, 8);

export function buildUrl({ date, hour, start = 1, end = 1000 }) {
  const e = env();
  return `${BASE}/${e.key}/json/${e.service}/${start}/${end}/${date}/${hour}`;
}

// 응답 한 행 → { total, bands: [10대이하, 20대, 30대, 40대, 50대+ 합], male, female }
// 숫자는 연령 구간의 시작 나이 (00=0~9세, 10 · 15 → 10대 이하, 20 · 25 → 20대 …, 70=70세 이상)
export function normalizeRow(row) {
  const bands = [0, 0, 0, 0, 0];
  let male = 0, female = 0, found = false;
  for (const [k, raw] of Object.entries(row)) {
    const m = k.match(/^([MF])(\d{2})$/);
    if (!m) continue;
    const v = Number(raw);
    if (!Number.isFinite(v)) continue;
    found = true;
    const start = Number(m[2]);
    bands[start < 20 ? 0 : start < 30 ? 1 : start < 40 ? 2 : start < 50 ? 3 : 4] += v;
    if (m[1] === "M") male += v; else female += v;
  }
  if (!found) throw new Error("연령 컬럼(M00~M70 · F00~F70)을 찾지 못했습니다 — probe 로 응답 컬럼을 확인하세요");
  const total = Number(row.SPOP);
  return { total: Number.isFinite(total) ? total : male + female, bands, male, female };
}

// (일자, 시간)의 전 행정동 → Map<8자리 코드, normalizedRow>. 자료가 없는 시각이면 null
export async function fetchHourAll(date, hour, fetchImpl = fetch) {
  const h = String(hour).padStart(2, "0");
  const out = new Map();
  let start = 1, total = Infinity;
  while (start <= total) {
    const end = start + 999;
    const r = await fetchImpl(buildUrl({ date, hour: h, start, end }));
    if (!r.ok) throw new Error(`서울 열린데이터광장 응답 오류 ${r.status}`);
    const j = await r.json();
    const body = j[env().service];
    if (!body) {
      const code = j.RESULT?.CODE;
      if (code === "INFO-200") return null; // 해당 데이터 없음
      throw new Error(`서울 열린데이터광장 오류 ${code || ""} ${j.RESULT?.MESSAGE || ""}`.trim());
    }
    total = Number(body.list_total_count) || 0;
    const rows = body.row || [];
    for (const row of rows) {
      // 요청 조건이 실제로 적용됐는지 확인 (엉뚱한 날짜 · 시간 행을 쓰지 않도록)
      if (String(row.YMD) !== String(date) || String(row.TT) !== h) {
        throw new Error(`요청 조건이 적용되지 않았습니다 (요청 ${date}/${h}, 응답 ${row.YMD}/${row.TT})`);
      }
      out.set(String(row.H_DNG_CD).trim(), normalizeRow(row));
    }
    if (!rows.length) break;
    start = end + 1;
  }
  return out;
}

// 동시에 n개씩 실행
export async function pool(tasks, n = 6) {
  const out = new Array(tasks.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < tasks.length) {
      const k = i++;
      out[k] = await tasks[k]();
    }
  }));
  return out;
}
