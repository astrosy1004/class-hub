/* 위키데이터·한국어 위키백과·위키미디어 공용에서 인물 정보를 불러오는 모듈 (전역 WikiLookup)
   - 검색: 위키데이터 (동명이인 구분용 설명 포함, 사람만 남김)
   - 생년월일·경력: 위키백과 정보상자 → 없으면 위키데이터
   - 사진: 공용에서 "이 인물이 찍힌 사진" + 이름 검색, 촬영 연도별 정렬 */
const WikiLookup = (() => {
  const WD = "https://www.wikidata.org/w/api.php";
  const KO = "https://ko.wikipedia.org/w/api.php";
  const CM = "https://commons.wikimedia.org/w/api.php";
  const TITLE_KEYS = ["명칭", "공직", "직책", "직위", "직함", "직무"];

  async function api(base, params) {
    const u = new URL(base);
    Object.entries({ format: "json", formatversion: "2", origin: "*", ...params })
      .forEach(([k, v]) => u.searchParams.set(k, v));
    const r = await fetch(u);
    if (!r.ok) throw new Error(`요청 실패 (${r.status})`);
    const d = await r.json();
    if (d.error) throw new Error(d.error.info);
    return d;
  }

  /* ---- 위키문법 정리 ---- */
  function stripTemplates(t) {
    let prev;
    do { prev = t; t = t.replace(/\{\{[^{}]*\}\}/g, ""); } while (t !== prev);
    return t;
  }
  function clean(raw = "") {
    let t = String(raw)
      .replace(/<ref[^>]*\/>/gi, "")
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
      .replace(/<br\s*\/?>/gi, ", ");
    t = stripTemplates(t)
      .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
      .replace(/\[https?:\/\/\S+\s([^\]]*)\]/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/'{2,}/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^[,\s]+|[,\s]+$/g, "");
    return t;
  }

  // 문서 맨 앞의 "○○ 정보" 정보상자를 key → 원문 값으로
  function parseInfobox(wikitext) {
    const m = /\{\{\s*[^|{}\n]*정보\s*\n?\|/.exec(wikitext);
    if (!m) return {};
    let i = m.index, depth = 0, end = -1;
    for (; i < wikitext.length - 1; i++) {
      const two = wikitext.slice(i, i + 2);
      if (two === "{{") { depth++; i++; } else if (two === "}}") { depth--; i++; if (depth === 0) { end = i; break; } }
    }
    const body = wikitext.slice(m.index + 2, end - 1);
    const parts = [];
    let cur = "", d = 0;
    for (let j = 0; j < body.length; j++) {
      const two = body.slice(j, j + 2);
      if (two === "{{" || two === "[[") { d++; cur += two; j++; continue; }
      if (two === "}}" || two === "]]") { d--; cur += two; j++; continue; }
      if (body[j] === "|" && d === 0) { parts.push(cur); cur = ""; continue; }
      cur += body[j];
    }
    parts.push(cur);
    const box = {};
    parts.slice(1).forEach((p) => {
      const k = p.indexOf("=");
      if (k < 0) return;
      const key = p.slice(0, k).trim().replace(/\s+/g, " ");
      const val = p.slice(k + 1).trim();
      if (val) box[key] = val;
    });
    return box;
  }

  /* ---- 날짜·나이 ---- */
  function parseDate(raw) {
    if (!raw) return null;
    let m = /\{\{[^{}|]*\|\s*(\d{3,4})\s*\|\s*(\d{1,2})\s*(?:\|\s*(\d{1,2}))?/.exec(raw);
    if (m) return { y: +m[1], m: +m[2] || 0, d: +m[3] || 0 };
    const t = clean(raw);
    m = /(\d{3,4})년\s*(?:(\d{1,2})월)?\s*(?:(\d{1,2})일)?/.exec(t);
    if (m) return { y: +m[1], m: +m[2] || 0, d: +m[3] || 0 };
    m = /(\d{4})-(\d{2})-(\d{2})/.exec(t);
    if (m) return { y: +m[1], m: +m[2], d: +m[3] };
    return null;
  }
  function wdDate(v) {
    const m = /^([+-]\d+)-(\d\d)-(\d\d)/.exec(v && v.time || "");
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  }
  const fmtDate = (d) => !d ? "" : `${d.y}년` + (d.m ? ` ${d.m}월` : "") + (d.d ? ` ${d.d}일` : "");
  function ageAt(birth, d) {
    if (!birth || !d) return null;
    let a = d.y - birth.y;
    if (d.m && birth.m && (d.m < birth.m || (d.m === birth.m && d.d && birth.d && d.d < birth.d))) a--;
    return a;
  }
  const dateKey = (d) => d ? d.y * 10000 + (d.m || 0) * 100 + (d.d || 0) : 0;

  /* ---- 1) 이름 검색 ---- */
  async function search(name) {
    const s = await api(WD, { action: "wbsearchentities", search: name, language: "ko", uselang: "ko", type: "item", limit: "15" });
    const hits = s.search || [];
    if (!hits.length) return [];
    const e = await api(WD, { action: "wbgetentities", ids: hits.map((h) => h.id).join("|"), props: "claims|sitelinks", sitefilter: "kowiki" });
    return hits
      .map((h) => ({ h, ent: e.entities[h.id] }))
      .filter(({ ent }) => ent && (ent.claims.P31 || []).some((c) => c.mainsnak.datavalue?.value?.id === "Q5"))
      .map(({ h, ent }) => ({
        id: h.id,
        label: h.label || name,
        description: h.description || "",
        kowiki: ent.sitelinks?.kowiki?.title || "",
      }));
  }

  /* ---- 2) 인물 상세 ---- */
  async function load(cand) {
    const [ent, wiki] = await Promise.all([
      api(WD, { action: "wbgetentities", ids: cand.id, props: "claims|labels", languages: "ko|en" }).then((d) => d.entities[cand.id]),
      cand.kowiki ? loadWiki(cand.kowiki) : Promise.resolve({ box: {}, extract: "" }),
    ]);
    const claims = ent.claims || {};
    const box = wiki.box;
    const enName = ent.labels?.en?.value || "";

    const best = (p) => {
      const list = claims[p] || [];
      return list.find((c) => c.rank === "preferred") || list.find((c) => c.rank !== "deprecated");
    };
    const birth = parseDate(box["출생일"] || box["출생"]) || wdDate(best("P569")?.mainsnak.datavalue?.value);
    const death = parseDate(box["사망일"] || box["사망"]) || wdDate(best("P570")?.mainsnak.datavalue?.value);
    const birthPlace = clean(box["출생지"] || "");
    const party = clean(box["정당"] || "");
    const education = clean(box["학력"] || "");

    const sentences = wiki.extract
      .replace(/\([^)]*\)/g, "")      // 한자·생몰년 괄호 제거
      .split(/(?<=다\.)\s+/)
      .map((x) => x.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const summary = sentences.slice(0, 2).join(" ");

    const events = [];
    const push = (ev) => events.push({ checked: true, ...ev, age: ev.kind === "출생" ? null : ageAt(birth, ev.date) });
    const used = new Set(); // 경력 설명으로 쓴 요약 문장

    // 경력 설명: 요약문 중 같은 연도 + 직책 이름이 들어간 짧은 문장, 없으면 재임 기간
    const describe = (title, start, end) => {
      const period = `${fmtDate(start)} ~ ${end ? fmtDate(end) : "현재"} 재임.`;
      const word = title.replace(/\s*취임$/, "").split(" ").pop();
      const hit = sentences.find((s, i) => i > 0 && !used.has(s) && s.length <= 150 && s.includes(`${start.y}년`) && word && s.includes(word));
      if (!hit) return period;
      used.add(hit);
      return hit;
    };
    const shortTitle = (t) => t.replace(/\s*\([^)]*\)/g, "").trim();

    if (birth) push({ kind: "출생", date: birth, title: "출생", desc: birthPlace ? `${birthPlace}에서 태어났다.` : `${fmtDate(birth)} 태어났다.` });

    // 위키데이터 직책 (P39) — 정보상자 보완용
    const posClaims = (claims.P39 || []).filter((c) => c.rank !== "deprecated" && c.qualifiers?.P580);
    const posIds = [...new Set(posClaims.map((c) => c.mainsnak.datavalue?.value?.id).filter(Boolean))];
    const posLabels = posIds.length
      ? (await api(WD, { action: "wbgetentities", ids: posIds.slice(0, 50).join("|"), props: "labels", languages: "ko" })).entities : {};
    const wdPositions = posClaims.map((c) => ({
      start: wdDate(c.qualifiers.P580[0].datavalue?.value),
      end: c.qualifiers.P582 ? wdDate(c.qualifiers.P582[0].datavalue?.value) : null,
      label: posLabels[c.mainsnak.datavalue?.value?.id]?.labels?.ko?.value,
    })).filter((p) => p.start && p.label);

    // 정보상자 경력 (명칭N / 취임일N / 퇴임일N)
    for (let i = 1; i <= 25; i++) {
      const suf = i === 1 ? "" : String(i);
      const startRaw = box["취임일" + suf] || box["임기시작" + suf] || box["임기 시작" + suf];
      if (!startRaw) continue;
      const start = parseDate(startRaw);
      if (!start) continue;
      const end = parseDate(box["퇴임일" + suf] || box["임기끝" + suf] || box["임기 끝" + suf]);
      let title = clean(TITLE_KEYS.map((k) => box[k + suf]).find((v) => v && clean(v)) || "");
      const nth = clean(box["대수" + suf] || "");
      const nation = clean(box["국가" + suf] || "");
      if (title && title.length <= 4 && nation) title = `${nation} ${title}`;
      if (nth && title && !/제\s*\d/.test(title)) title = `제${nth}대 ${title}`;
      // 정보상자에 직책 이름이 없으면 위키데이터에서 같은 해 시작한 직책으로
      if (!title) title = wdPositions.find((p) => p.start.y === start.y)?.label || "";
      title = shortTitle(title) || "직책(확인 필요)";
      push({ kind: "경력", date: start, end, title: `${title} 취임`, desc: describe(title, start, end) });
    }

    // 위키데이터 직책 중 정보상자에 없는 것
    wdPositions.forEach(({ start, end, label }) => {
      const core = shortTitle(label).replace(/^대한민국\s*/, "");
      // 같은 해 시작했거나, 같은 직책의 정보상자 임기 안에 있으면 중복으로 보고 건너뜀
      const dup = events.some((e) => e.kind === "경력" && (e.date.y === start.y ||
        (e.title.includes(core) && dateKey(start) >= dateKey(e.date) && (!e.end || dateKey(start) <= dateKey(e.end)))));
      if (dup) return;
      push({ kind: "경력", date: start, end, title: `${shortTitle(label)} 취임`, desc: describe(label, start, end) });
    });

    // 요약문 속 연도 문장 — 경력이 충분하면 겹칠 수 있어 선택 해제, 경력이 거의 없으면(기업인 등) 선택
    const fewCareers = events.filter((e) => e.kind === "경력").length < 2;
    sentences.slice(1).forEach((sen) => {
      if (used.has(sen)) return;
      const d = parseDate(sen);
      if (!d || d.y < 1800 || (birth && d.y === birth.y && sen.includes("태어"))) return; // 출생 장면과 중복
      push({ kind: "요약", date: d, title: "주요 활동", desc: sen, checked: fewCareers });
    });

    if (death) push({ kind: "별세", date: death, title: "별세", desc: `${fmtDate(death)} 세상을 떠났다.` });
    else {
      const now = new Date();
      push({ kind: "현재", date: { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() }, title: "현재", desc: sentences[0] || cand.description });
    }
    events.sort((a, b) => dateKey(a.date) - dateKey(b.date));

    const mainImage = (box["그림"] && clean(box["그림"]).split("|")[0]) || best("P18")?.mainsnak.datavalue?.value || "";
    const photos = await loadPhotos(cand, enName, mainImage);

    return {
      id: cand.id, name: cand.label, description: cand.description, enName,
      birth, death, birthPlace, party, education, summary,
      age: birth ? ageAt(birth, death || (() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() }; })()) : null,
      events, photos,
      mainImage: mainImage ? `File:${mainImage.replace(/^(File|파일):/i, "")}` : "",
      wikiUrl: cand.kowiki ? `https://ko.wikipedia.org/wiki/${encodeURIComponent(cand.kowiki)}` : "",
      wikidataUrl: `https://www.wikidata.org/wiki/${cand.id}`,
      fmtDate,
    };
  }

  async function loadWiki(title) {
    const [p, x] = await Promise.all([
      api(KO, { action: "parse", page: title, prop: "wikitext", section: "0", redirects: "1" }),
      api(KO, { action: "query", prop: "extracts", exintro: "1", explaintext: "1", titles: title, redirects: "1" }),
    ]);
    return { box: parseInfobox(p.parse?.wikitext || ""), extract: x.query?.pages?.[0]?.extract || "" };
  }

  /* ---- 3) 사진 후보 ---- */
  async function loadPhotos(cand, enName, mainImage) {
    const iiParams = {
      prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1280",
      iiextmetadatafilter: "DateTimeOriginal|DateTime|LicenseShortName|Artist|ImageDescription",
    };
    const queries = [`haswbstatement:P180=${cand.id} filetype:bitmap`, `"${cand.label}" filetype:bitmap`];
    if (enName) queries.push(`"${enName}" filetype:bitmap`);
    const reqs = queries.map((q) =>
      api(CM, { action: "query", generator: "search", gsrsearch: q, gsrnamespace: "6", gsrlimit: "40", ...iiParams }).catch(() => ({})));
    if (mainImage) {
      const t = `File:${mainImage.replace(/^(File|파일):/i, "")}`;
      reqs.push(api(CM, { action: "query", titles: t, ...iiParams }).catch(() => ({})));
    }
    const results = await Promise.all(reqs);
    const seen = new Map();
    results.forEach((r) => (r.query?.pages || []).forEach((p) => {
      const ii = p.imageinfo?.[0];
      if (!ii || seen.has(p.title)) return;
      const md = ii.extmetadata || {};
      const txt = (k) => clean((md[k]?.value || "").replace(/<[^>]+>/g, " "));
      const yearM = /(1[89]\d\d|20\d\d)/.exec(md.DateTimeOriginal?.value || "") || /(1[89]\d\d|20\d\d)/.exec(p.title);
      seen.set(p.title, {
        key: p.title,
        title: p.title.replace(/^File:/, "").replace(/\.[a-z]+$/i, ""),
        year: yearM ? +yearM[1] : null,
        thumb: ii.thumburl || ii.url,
        page: ii.descriptionurl,
        artist: txt("Artist").slice(0, 60),
        license: txt("LicenseShortName"),
      });
    }));
    return [...seen.values()].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
  }

  return { search, load, fmtDate };
})();
