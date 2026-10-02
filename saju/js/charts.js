// SVG 그래프 만들기 전담. 모두 문자열(SVG/HTML)을 돌려주고, 색은 style.css의 클래스(CSS 변수)로 칠한다.
// 외부 그래프 라이브러리 없이 viewBox로 그려서 화면 폭에 맞게 늘어난다.

const W = 320;

const round = (n) => Math.round(n * 10) / 10;

// 점들을 부드러운 곡선 path로 (캣멀롬 → 베지어)
function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M${round(pts[0][0])},${round(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${round(c1[0])},${round(c1[1])} ${round(c2[0])},${round(c2[1])} ${round(p2[0])},${round(p2[1])}`;
  }
  return d;
}

/**
 * 꺾은선(면) 그래프
 * values: 점수 배열, labels: x축 글자, current: 현재 위치 순번, peak: 강조할 최고점 순번,
 * futureFrom: 이 순번부터 점선, band: [from, to, "라벨"] 배경 강조 구간, selected: 선택한 점
 */
export function lineChart({ values, labels, current = -1, peak = -1, futureFrom = null, band = null, selected = -1, height = 180, caption = "" }) {
  const H = height;
  const padX = 16;
  const top = 30;
  const bottom = 26;
  const n = values.length;
  const x = (i) => padX + ((W - padX * 2) * i) / Math.max(1, n - 1);
  const y = (v) => top + (H - top - bottom) * (1 - v / 100);
  const pts = values.map((v, i) => [x(i), y(v)]);
  const base = H - bottom;

  let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${caption}">`;
  for (const v of [25, 50, 75]) svg += `<line class="chart-grid" x1="${padX}" x2="${W - padX}" y1="${y(v)}" y2="${y(v)}"/>`;
  if (band) {
    const [a, b, text] = band;
    const bx = x(a) - 6;
    svg += `<rect class="chart-band" x="${bx}" y="${top - 18}" width="${x(b) - x(a) + 12}" height="${base - top + 18}" rx="6"/>`;
    svg += `<text class="chart-band-label" x="${(x(a) + x(b)) / 2}" y="${top - 6}" text-anchor="middle">${text}</text>`;
  }
  const line = smoothPath(pts);
  svg += `<path class="chart-area" d="${line} L${x(n - 1)},${base} L${x(0)},${base} Z"/>`;
  if (futureFrom != null && futureFrom > 0 && futureFrom < n) {
    svg += `<path class="chart-line" d="${smoothPath(pts.slice(0, futureFrom + 1))}"/>`;
    svg += `<path class="chart-line future" d="${smoothPath(pts.slice(futureFrom))}"/>`;
  } else {
    svg += `<path class="chart-line" d="${line}"/>`;
  }
  pts.forEach(([px, py], i) => {
    const cls = i === current ? "now" : i === selected ? "sel" : "";
    svg += `<circle class="chart-dot ${cls}" cx="${px}" cy="${py}" r="${i === current ? 6 : 3.5}"/>`;
    if (i === current) svg += `<text class="chart-value now" x="${px}" y="${py - 11}" text-anchor="middle">지금 ${values[i]}</text>`;
    else if (i === peak || i === selected) svg += `<text class="chart-value" x="${px}" y="${py - 10}" text-anchor="middle">${values[i]}</text>`;
    svg += `<text class="chart-axis ${i === current ? "now" : ""}" x="${px}" y="${H - 8}" text-anchor="middle">${labels[i]}</text>`;
    svg += `<rect class="chart-hit" data-i="${i}" x="${px - 18}" y="0" width="36" height="${H}"><title>${labels[i]} ${values[i]}점</title></rect>`;
  });
  return svg + "</svg>";
}

/**
 * 세로 막대 그래프
 * bars: [{ label, value, state: "past" | "now" | "future" | "low", show: 값 표시 여부 }]
 */
export function barChart({ bars, height = 170, caption = "" }) {
  const H = height;
  const padX = 6;
  const top = 18;
  const bottom = 22;
  const n = bars.length;
  const slot = (W - padX * 2) / n;
  const bw = Math.min(26, slot * 0.66);
  let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${caption}">`;
  bars.forEach((b, i) => {
    const h = ((H - top - bottom) * b.value) / 100;
    const bx = padX + slot * i + (slot - bw) / 2;
    const by = H - bottom - h;
    svg += `<rect class="bar-${b.state || "future"}" x="${round(bx)}" y="${round(by)}" width="${round(bw)}" height="${round(h)}" rx="${Math.min(6, bw / 3)}"><title>${b.label} ${b.value}점</title></rect>`;
    if (b.show) svg += `<text class="chart-value ${b.state === "now" ? "now" : ""}" x="${round(bx + bw / 2)}" y="${round(by - 5)}" text-anchor="middle">${b.value}</text>`;
    svg += `<text class="chart-axis ${b.state === "now" ? "now" : ""}" x="${round(bx + bw / 2)}" y="${H - 6}" text-anchor="middle">${b.label}</text>`;
  });
  return svg + "</svg>";
}

/** 레이더(육각형) 그래프. axes: [{ label, value }] — 가장 높은 축은 굵게, 가장 낮은 축은 강조색 */
export function radarChart({ axes, size = 300 }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.32;
  const n = axes.length;
  const ang = (i) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const max = Math.max(...axes.map((a) => a.value));
  const min = Math.min(...axes.map((a) => a.value));
  let svg = `<svg class="chart" viewBox="0 0 ${size} ${size}" role="img" aria-label="영역별 점수">`;
  for (const k of [0.33, 0.66, 1]) svg += `<polygon class="radar-grid" points="${axes.map((_, i) => pt(i, R * k).map(round).join(",")).join(" ")}"/>`;
  axes.forEach((_, i) => {
    const [px, py] = pt(i, R);
    svg += `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${round(px)}" y2="${round(py)}"/>`;
  });
  const shape = axes.map((a, i) => pt(i, (R * a.value) / 100));
  svg += `<polygon class="radar-shape" points="${shape.map((p) => p.map(round).join(",")).join(" ")}"/>`;
  axes.forEach((a, i) => {
    const [px, py] = shape[i];
    svg += `<circle class="radar-dot ${a.value === min ? "low" : ""}" cx="${round(px)}" cy="${round(py)}" r="4"/>`;
    const [lx, ly] = pt(i, R + 24);
    const anchor = Math.abs(lx - cx) < 4 ? "middle" : lx > cx ? "start" : "end";
    const cls = a.value === max ? "top" : a.value === min ? "low" : "";
    svg += `<text class="radar-label ${cls}" x="${round(lx)}" y="${round(ly + 4)}" text-anchor="${anchor}">${a.label} ${a.value}</text>`;
  });
  return svg + "</svg>";
}

/** 도넛 그래프. segs: [{ value, cls: "stroke-0" 등 }], center: [작은 글자, 큰 글자] */
export function donutChart({ segs, center }) {
  const r = 42;
  const C = 2 * Math.PI * r;
  const total = segs.reduce((a, s) => a + s.value, 0) || 1;
  let offset = 0;
  let svg = `<svg class="chart" viewBox="0 0 120 120" role="img" aria-label="오행 비율"><g transform="rotate(-90 60 60)"><circle class="donut-track" cx="60" cy="60" r="${r}"/>`;
  for (const s of segs) {
    if (!s.value) continue;
    const len = (C * s.value) / total;
    const gap = segs.filter((x) => x.value).length > 1 ? 2 : 0;
    svg += `<circle class="donut-seg ${s.cls}" cx="60" cy="60" r="${r}" stroke-dasharray="${round(Math.max(0, len - gap))} ${round(C)}" stroke-dashoffset="${round(-offset)}"/>`;
    offset += len;
  }
  svg += `</g><text class="donut-small" x="60" y="54" text-anchor="middle">${center[0]}</text>`;
  svg += `<text class="donut-big" x="60" y="71" text-anchor="middle">${center[1]}</text>`;
  return svg + "</svg>";
}

/** 반원 게이지 */
export function gaugeChart({ value, caption }) {
  const cx = 120;
  const cy = 112;
  const r = 86;
  const arc = (v) => {
    const a = Math.PI * (1 - v / 100);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  };
  const [sx, sy] = arc(0);
  const [ex, ey] = arc(100);
  const [vx, vy] = arc(Math.max(1, value));
  let svg = `<svg class="chart" viewBox="0 0 240 140" role="img" aria-label="${caption} ${value}점">`;
  svg += `<path class="gauge-track" d="M${sx},${sy} A${r},${r} 0 0 1 ${ex},${ey}"/>`;
  svg += `<path class="gauge-value" d="M${sx},${sy} A${r},${r} 0 0 1 ${round(vx)},${round(vy)}"/>`;
  svg += `<text class="gauge-num" x="${cx}" y="${cy - 14}" text-anchor="middle">${value}</text>`;
  svg += `<text class="gauge-cap" x="${cx}" y="${cy + 6}" text-anchor="middle">${caption}</text>`;
  svg += `<text class="gauge-tick" x="${sx}" y="${cy + 24}" text-anchor="middle">0</text><text class="gauge-tick" x="${ex}" y="${cy + 24}" text-anchor="middle">100</text>`;
  return svg + "</svg>";
}

/** 가로 막대 목록 (HTML). items: [{ label, value, right, fillClass }] */
export function hBars(items) {
  return `<div class="hbars">${items
    .map(
      (it) => `<div>
        <div class="hbar-top"><span>${it.label}</span><b class="${it.rightClass || ""}">${it.right ?? it.value}</b></div>
        <div class="hbar-track"><div class="hbar-fill ${it.fillClass || ""}" style="width:${it.value}%"></div></div>
      </div>`,
    )
    .join("")}</div>`;
}

/** 두 계열 비교 막대 (HTML). items: [{ label, a, b }] — a(지금, 연한색) 위에 b(다음, 진한색)를 겹친다 */
export function compareBars(items) {
  return `<div class="hbars">${items
    .map((it) => {
      const up = it.b >= it.a;
      return `<div>
        <div class="hbar-top"><span>${it.label}</span><span class="cmp ${up ? "up" : "down"}"><b>${it.a} → ${it.b}</b> ${up ? "▲" : "▼"}</span></div>
        <div class="hbar-track">
          ${up
            ? `<div class="hbar-fill front" style="width:${it.b}%"></div><div class="hbar-fill soft" style="width:${it.a}%"></div>`
            : `<div class="hbar-fill soft" style="width:${it.a}%"></div><div class="hbar-fill front" style="width:${it.b}%"></div>`}
        </div>
      </div>`;
    })
    .join("")}</div>`;
}
