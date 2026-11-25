// 명리 30일 — 그림(SVG) 전담 파일. 가는 선 위주로 그리고, 색은 모두 styles.css 의 CSS 변수(클래스)에서 가져온다.
// app.js 보다 먼저 불러온다. 전역 Charts 하나만 내보낸다.

const Charts = (() => {
  const EL = ["wood", "fire", "earth", "metal", "water"];
  const KO = ["목", "화", "토", "금", "수"];
  const HAN = ["木", "火", "土", "金", "水"];
  const GROUP = ["비겁", "식상", "재성", "관성", "인성"]; // 일간 기준 (e - dm) 순서
  const f = (n) => Math.round(n * 10) / 10;
  const rad = (deg) => (deg * Math.PI) / 180;

  /**
   * 오행 상생·상극 다이어그램.
   *  counts: [목,화,토,금,수] 개수 (없으면 모두 같은 크기)
   *  dm: 일간 오행 순번 (있으면 '나' 표시와 십신 묶음 이름을 단다)
   *  highlight: 강조할 오행 순번 배열 (용신 후보 등)
   */
  function wuxing({ counts = null, dm = null, highlight = [], caption = "" } = {}) {
    const cx = 180;
    const cy = 168;
    const R = 112;
    // 화를 맨 위에 두고 시계 방향으로 토 · 금 · 수 · 목 (상생 순서가 시계 방향)
    const angleOf = (e) => -90 + 72 * ((e - 1 + 5) % 5);
    const radiusOf = (e) => (counts ? 21 + Math.min(counts[e], 5) * 5 : 30);
    const pos = EL.map((_, e) => ({ x: cx + R * Math.cos(rad(angleOf(e))), y: cy + R * Math.sin(rad(angleOf(e))), r: radiusOf(e) }));

    // 상생: 큰 원 + 인접 노드 사이 화살표
    let gen = `<circle class="wx-orbit" cx="${cx}" cy="${cy}" r="${R}"/>`;
    for (let e = 0; e < 5; e++) {
      const mid = angleOf(e) + 36;
      const x = cx + R * Math.cos(rad(mid));
      const y = cy + R * Math.sin(rad(mid));
      gen += `<path class="wx-arrow" d="M-4.5 -4 L4.5 0 L-4.5 4" transform="translate(${f(x)} ${f(y)}) rotate(${f(mid + 90)})"/>`;
    }
    // 상극: 별 모양 점선 (e → e+2)
    let ctl = "";
    for (let e = 0; e < 5; e++) {
      const a = pos[e];
      const b = pos[(e + 2) % 5];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;
      const sx = a.x + ux * (a.r + 4);
      const sy = a.y + uy * (a.r + 4);
      const ex = b.x - ux * (b.r + 6);
      const ey = b.y - uy * (b.r + 6);
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      ctl += `<line class="wx-ctl" x1="${f(sx)}" y1="${f(sy)}" x2="${f(ex)}" y2="${f(ey)}"/><path class="wx-ctl-head" d="M-4 -3.5 L3 0 L-4 3.5" transform="translate(${f(ex)} ${f(ey)}) rotate(${f(ang)})"/>`;
    }
    // 노드
    let nodes = "";
    for (let e = 0; e < 5; e++) {
      const { x, y, r } = pos[e];
      const isMe = dm === e;
      const hl = highlight.includes(e);
      const sub = dm != null ? `${GROUP[(e - dm + 5) % 5]}${counts ? ` ${counts[e]}` : ""}` : `${KO[e]}${counts ? ` · ${counts[e]}` : ""}`;
      nodes += `<g class="wx-node el-${EL[e]}${counts && counts[e] === 0 ? " empty" : ""}${hl ? " hl" : ""}">
        ${isMe ? `<circle class="wx-me-ring" cx="${f(x)}" cy="${f(y)}" r="${r + 6}"/>` : ""}
        ${hl ? `<circle class="wx-hl-ring" cx="${f(x)}" cy="${f(y)}" r="${r + 6}"/>` : ""}
        <circle class="wx-dot" cx="${f(x)}" cy="${f(y)}" r="${r}"/>
        <text class="wx-han" x="${f(x)}" y="${f(y - 2)}">${HAN[e]}</text>
        <text class="wx-sub" x="${f(x)}" y="${f(y + 14)}">${sub}</text>
        ${isMe ? `<text class="wx-me" x="${f(x)}" y="${f(y - r - 11)}">나</text>` : ""}
      </g>`;
    }
    return `<figure class="viz wuxing">
      <svg viewBox="0 0 360 330" role="img" aria-label="오행 상생 상극 다이어그램">${gen}${ctl}${nodes}</svg>
      <figcaption><span class="lg lg-gen"></span>상생 (시계 방향) <span class="lg lg-ctl"></span>상극${caption ? ` · ${caption}` : ""}</figcaption>
    </figure>`;
  }

  /** 30일 진도 링: 30칸 조각, 완료한 날은 채우고 오늘은 테두리 */
  function ring({ done = [], today = 1, total = 30, size = 150 } = {}) {
    const c = 75;
    const r = 60;
    const step = 360 / total;
    let segs = "";
    for (let i = 0; i < total; i++) {
      const a1 = rad(-90 + i * step + 1.4);
      const a2 = rad(-90 + (i + 1) * step - 1.4);
      const p1 = [c + r * Math.cos(a1), c + r * Math.sin(a1)];
      const p2 = [c + r * Math.cos(a2), c + r * Math.sin(a2)];
      const day = i + 1;
      const cls = done.includes(day) ? "done" : day === today ? "today" : "";
      segs += `<path class="ring-seg ${cls}" d="M${f(p1[0])} ${f(p1[1])} A${r} ${r} 0 0 1 ${f(p2[0])} ${f(p2[1])}"><title>Day ${day}</title></path>`;
    }
    return `<svg class="viz ring" viewBox="0 0 150 150" width="${size}" height="${size}" role="img" aria-label="30일 진도 ${done.length}일 완료">
      ${segs}
      <text class="ring-num" x="75" y="74">${done.length}<tspan class="ring-of">/${total}</tspan></text>
      <text class="ring-cap" x="75" y="94">강 완료</text>
    </svg>`;
  }

  /** 신강·신약 반원 게이지 (ratio 0~1) */
  function gauge(ratio, label) {
    const cx = 130;
    const cy = 124;
    const r = 100;
    const pt = (t) => {
      const a = Math.PI + t * Math.PI;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    const arc = (t1, t2, cls) => {
      const [x1, y1] = pt(t1);
      const [x2, y2] = pt(t2);
      return `<path class="${cls}" d="M${f(x1)} ${f(y1)} A${r} ${r} 0 0 1 ${f(x2)} ${f(y2)}"/>`;
    };
    const a = Math.PI + Math.min(1, Math.max(0, ratio)) * Math.PI;
    const nx = cx + (r - 18) * Math.cos(a);
    const ny = cy + (r - 18) * Math.sin(a);
    const ticks = [0.4, 0.6].map((t) => {
      const [x1, y1] = pt(t);
      const ia = Math.PI + t * Math.PI;
      return `<line class="g-tick" x1="${f(x1)}" y1="${f(y1)}" x2="${f(cx + (r - 14) * Math.cos(ia))}" y2="${f(cy + (r - 14) * Math.sin(ia))}"/>`;
    }).join("");
    return `<figure class="viz gauge">
      <svg viewBox="0 0 260 150" role="img" aria-label="일간 강약 ${Math.round(ratio * 100)}%">
        ${arc(0, 1, "g-track")}${arc(0, 0.4, "g-weak")}${arc(0.4, 0.6, "g-mid")}${arc(0.6, 1, "g-strong")}${ticks}
        <line class="g-needle" x1="${cx}" y1="${cy}" x2="${f(nx)}" y2="${f(ny)}"/>
        <circle class="g-hub" cx="${cx}" cy="${cy}" r="6"/>
        <text class="g-end" x="${cx - r}" y="${cy + 20}">신약</text>
        <text class="g-end" x="${cx}" y="${cy - r - 10}">중화</text>
        <text class="g-end" x="${cx + r}" y="${cy + 20}">신강</text>
      </svg>
      <figcaption><b>${label}</b> · 돕는 힘 ${Math.round(ratio * 100)}%</figcaption>
    </figure>`;
  }

  /** 음양 비율 막대 */
  function yinyang(yang, yin) {
    const total = yang + yin || 1;
    return `<div class="viz yy" role="img" aria-label="양 ${yang} 음 ${yin}">
      <div class="yy-bar"><span class="yy-yang" style="flex:${yang}">양 ${yang}</span><span class="yy-yin" style="flex:${yin}">음 ${yin}</span></div>
      <div class="yy-scale"><span>${Math.round((yang / total) * 100)}%</span><span>${Math.round((yin / total) * 100)}%</span></div>
    </div>`;
  }

  /** 오행 분포 가로 누적 막대 (한 줄 요약) */
  function stack(counts) {
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    return `<div class="viz stack" role="img" aria-label="오행 분포">
      ${counts.map((n, e) => (n ? `<span class="el-bg-${EL[e]}" style="flex:${n}" title="${KO[e]} ${n}"></span>` : "")).join("")}
    </div>
    <div class="stack-legend">${counts.map((n, e) => `<span><i class="el-bg-${EL[e]}"></i>${KO[e]} ${n}</span>`).join("")}</div>`;
  }

  /** 대운 타임라인: 나이 축 위에 10년 구간, 현재 나이 표시 */
  function timeline(list, age) {
    const items = list.slice(0, 9);
    if (!items.length) return "";
    const start = items[0].startAge;
    const end = items[items.length - 1].startAge + 10;
    const pct = (a) => ((a - start) / (end - start)) * 100;
    const now = age >= start && age < end ? `<div class="tl-now" style="left:${pct(age)}%"><span>지금 ${age}세</span></div>` : "";
    return `<div class="viz tl">
      <div class="tl-track">
        ${items.map((d) => `<div class="tl-seg ${d.current ? "now" : ""}" style="left:${pct(d.startAge)}%;width:${100 / items.length}%">
          <b><span class="el-${EL[d.stemEl]}">${d.stemHan}</span><span class="el-${EL[d.branchEl]}">${d.branchHan}</span></b>
          <small>${d.stemGod}</small>
          <em>${d.startAge}</em>
        </div>`).join("")}
        ${now}
      </div>
    </div>`;
  }

  /** 12지지 계절 바퀴: 태어난 달(월지)을 강조. 子가 맨 아래(북·겨울), 午가 맨 위(남·여름) */
  function seasons(monthBranch, hanList) {
    const cx = 130;
    const cy = 130;
    const r1 = 62;
    const r2 = 104;
    const seasonOf = (b) => (b >= 2 && b <= 4 ? "spring" : b >= 5 && b <= 7 ? "summer" : b >= 8 && b <= 10 ? "autumn" : "winter");
    let out = "";
    for (let b = 0; b < 12; b++) {
      const mid = 90 + b * 30; // 子(0)=아래, 시계 방향으로 丑·寅…
      const a1 = rad(mid - 15 + 1);
      const a2 = rad(mid + 15 - 1);
      const p = (r, a) => `${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`;
      const d = `M${p(r1, a1)} L${p(r2, a1)} A${r2} ${r2} 0 0 1 ${p(r2, a2)} L${p(r1, a2)} A${r1} ${r1} 0 0 0 ${p(r1, a1)}Z`;
      const tx = cx + ((r1 + r2) / 2) * Math.cos(rad(mid));
      const ty = cy + ((r1 + r2) / 2) * Math.sin(rad(mid));
      out += `<path class="sw-seg sw-${seasonOf(b)}${b === monthBranch ? " on" : ""}" d="${d}"/><text class="sw-txt${b === monthBranch ? " on" : ""}" x="${f(tx)}" y="${f(ty + 5)}">${hanList[b]}</text>`;
    }
    const lab = [["여름", cx, cy - 20], ["겨울", cx, cy + 30], ["봄", cx - 30, cy + 5], ["가을", cx + 30, cy + 5]];
    return `<figure class="viz seasons"><svg viewBox="0 0 260 260" role="img" aria-label="12지지 계절 바퀴">${out}${lab.map(([t, x, y]) => `<text class="sw-season" x="${x}" y="${y}">${t}</text>`).join("")}</svg><figcaption>진하게 표시된 칸 = 내가 태어난 달(월지)</figcaption></figure>`;
  }

  return { wuxing, ring, gauge, yinyang, stack, timeline, seasons, GROUP };
})();
