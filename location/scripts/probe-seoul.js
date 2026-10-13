// 서울 열린데이터광장 키 확인용: 실제로 몇 건을 호출해 서비스 · 컬럼 이름을 출력한다. (키는 화면에 출력하지 않음)
//
// 1) 컬럼 확인 (인자 없이):      node scripts/probe-seoul.js
// 2) 요청 인자 순서 찾기:        node scripts/probe-seoul.js scan 20261008 12 11440710
//    → 인자를 여러 형태(날짜/시간/행정동 조합)로 붙여 호출하고, 형태마다 "전체 건수 + 첫 3행의 날짜|시간|행정동"을 한 줄씩 보여준다.
// 3) 한 번만 호출해 보기:        node scripts/probe-seoul.js 20261008 12 11440710
//
// 키는 환경변수 SEOUL_API_KEY 로 넣는다 (cmd: set SEOUL_API_KEY=키 / PowerShell: $env:SEOUL_API_KEY="키").
// 서비스명은 기본 Spop250mLocalResdDong, 바꾸려면 SEOUL_SERVICE.
const args = process.argv.slice(2);
const scan = args[0] === "scan";
const [date = "", hour = "12", dong = ""] = scan ? args.slice(1) : args;
const key = process.env.SEOUL_API_KEY, service = process.env.SEOUL_SERVICE || "Spop250mLocalResdDong";
if (!key) {
  console.error("SEOUL_API_KEY 환경변수가 필요합니다");
  process.exit(1);
}

async function call(tpl, n = 5) {
  const path = tpl.replace("{key}", key).replace("{service}", service).replace("{n}", n).replace("{date}", date).replace("{hour}", hour).replace("{dongpad}", encodeURIComponent(dong.padEnd(13, " "))).replace("{olddate}", "20260826").replace("{dong}", dong);
  const res = await fetch(`http://openapi.seoul.go.kr:8088/${path}`);
  let j;
  try { j = await res.json(); } catch (e) { return { path, status: res.status, error: "JSON 이 아닌 응답" }; }
  return { path, status: res.status, j };
}
const mask = (p) => p.split(key).join("***");

// 3) 코드 찾기:  node scripts/probe-seoul.js find 20261008 12 11440
//    그 날짜·시간의 전체 행(한 번에 최대 1000건)에서 코드가 접두어(구 코드 5자리)로 시작하는 행정동을 나열하고,
//    각 코드를 "행정동 필터"로 직접 조회해 몇 건이 나오는지 보여준다 (공백 없이 / 공백 5칸 / 앞뒤 공백 포함 원문 그대로).
if (args[0] === "find") {
  const [, fdate, fhour, prefix] = args;
  if (!fdate || !prefix) { console.error("사용: node scripts/probe-seoul.js find 날짜 시간 구코드5자리   예) find 20261008 12 11440"); process.exit(1); }
  const r = await (await fetch(`http://openapi.seoul.go.kr:8088/${key}/json/${service}/1/1000/${fdate}/${fhour}`)).json();
  const rows = (r[service]?.row || []).filter((x) => String(x.H_DNG_CD).trim().startsWith(prefix));
  console.log(`${fdate} ${fhour}시 전체 ${r[service]?.list_total_count}건 중 ${prefix}로 시작하는 행정동 ${rows.length}개
`);
  for (const x of rows) {
    const raw = String(x.H_DNG_CD);
    const code = raw.trim();
    const tests = [["공백없음", code], ["원문그대로", raw], ["공백5칸", code + "     "]];
    const out = [];
    for (const [label, v] of tests) {
      const q = await (await fetch(`http://openapi.seoul.go.kr:8088/${key}/json/${service}/1/3/${fdate}/${fhour}/${encodeURIComponent(v)}`)).json();
      out.push(`${label}=${q[service]?.list_total_count ?? "0(" + (q.RESULT?.CODE || "") + ")"}`);
    }
    console.log(`${code} (원문길이 ${raw.length})  SPOP=${x.SPOP}  필터시험: ${out.join("  ")}`);
  }
  process.exit(0);
}

if (scan) {
  if (!date || !dong) {
    console.error("사용: node scripts/probe-seoul.js scan 날짜 시간 행정동코드(8자리)   예) scan 20261008 12 11440710");
    process.exit(1);
  }
  const variants = [
    ["날짜/시간/행정동", "{key}/json/{service}/1/{n}/{date}/{hour}/{dong}"],
    ["시간/행정동", "{key}/json/{service}/1/{n}/{hour}/{dong}"],
    ["날짜/행정동", "{key}/json/{service}/1/{n}/{date}/{dong}"],
    ["날짜/시간", "{key}/json/{service}/1/{n}/{date}/{hour}"],
    ["행정동", "{key}/json/{service}/1/{n}/{dong}"],
    ["날짜", "{key}/json/{service}/1/{n}/{date}"],
    ["시간", "{key}/json/{service}/1/{n}/{hour}"],
    ["행정동/날짜", "{key}/json/{service}/1/{n}/{dong}/{date}"],
    ["날짜/행정동/시간", "{key}/json/{service}/1/{n}/{date}/{dong}/{hour}"],
    ["날짜/시간/행정동(공백 패딩 13자)", "{key}/json/{service}/1/{n}/{date}/{hour}/{dongpad}"],
    ["8월 날짜(20260826)/시간/행정동", "{key}/json/{service}/1/{n}/{olddate}/{hour}/{dong}"],
    ["8월 날짜(20260826)/시간", "{key}/json/{service}/1/{n}/{olddate}/{hour}"],
  ];
  console.log(`요청 값: 날짜=${date} 시간=${hour} 행정동=${dong}\n`);
  for (const [name, tpl] of variants) {
    try {
      const r = await call(tpl, 3);
      const b = r.j?.[service];
      const rows = b?.row || [];
      const head = rows.map((x) => `${x.YMD}|${x.TT}|${String(x.H_DNG_CD).trim()}`).join(", ");
      const result = r.j?.RESULT?.CODE || b?.RESULT?.CODE || "";
      console.log(`[${name}] HTTP ${r.status} ${result} 건수=${b?.list_total_count ?? "-"}  ${head || r.error || ""}`);
    } catch (e) {
      console.log(`[${name}] 호출 오류: ${e.message}`);
    }
  }
  process.exit(0);
}

const tpl = process.env.SEOUL_PATH || (date ? "{key}/json/{service}/1/{n}/{date}/{hour}/{dong}" : "{key}/json/{service}/1/{n}/");
const r = await call(tpl, 5);
console.log("요청 경로(키 가림):", mask(r.path));
console.log("HTTP", r.status);
const j = r.j;
if (j?.RESULT) console.log("RESULT", j.RESULT);
const body = j?.[service];
if (body) {
  console.log("전체 건수 list_total_count:", body.list_total_count, body.RESULT || "");
  const row = body.row?.[0];
  console.log(row ? "컬럼 이름:\n" + Object.keys(row).join("\n") : "row 없음");
  if (row) console.log("\n첫 행 일부:", JSON.stringify(Object.fromEntries(Object.entries(row).slice(0, 6))));
}
