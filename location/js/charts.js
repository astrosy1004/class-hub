// SVG 그래프 전담. 모두 문자열을 돌려주고, 색은 style.css 의 클래스(CSS 변수)로 칠한다. 외부 라이브러리 없음.
const W = 320;
const r1 = (n) => Math.round(n * 10) / 10;

function smooth(pts) {
  let d = `M${r1(pts[0][0])},${r1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${r1(p1[0] + (p2[0] - p0[0]) / 6)},${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)},${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])},${r1(p2[1])}`;
  }
  return d;
}

const empty = (msg) => `<div class="empty">${msg}</div>`;

/** 꺾은선(면): values 월 평균 등, labels x축, hi 강조할 순번, fmt 값 표시 함수 */
export function lineChart({ values, labels, hi = values.length - 1, fmt = (v) => v, height = 170 }) {
  if (!values || values.length < 2) return empty("추이를 그릴 자료가 부족합니다");
  const H = height, pl = 30, pr = 12, pt = 26, pb = 24;
  const mn = Math.min(...values), mx = Math.max(...values);
  const lo = mn - (mx - mn) * 0.25 || mn * 0.95, hiV = mx + (mx - mn) * 0.15 || mx * 1.05;
  const x = (i) => pl + ((W - pl - pr) * i) / (values.length - 1);
  const y = (v) => pt + (H - pt - pb) * (1 - (v - lo) / (hiV - lo));
  const pts = values.map((v, i) => [x(i), y(v)]);
  let grid = "";
  for (let k = 0; k < 4; k++) {
    const yy = pt + ((H - pt - pb) * k) / 3;
    grid += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" class="grid"/><text x="${pl - 4}" y="${yy + 3}" text-anchor="end" class="ax">${fmt(hiV - ((hiV - lo) * k) / 3)}</text>`;
  }
  const area = `${smooth(pts)} L${x(values.length - 1)},${H - pb} L${pl},${H - pb} Z`;
  const lab = labels.map((t, i) => (t ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle" class="ax">${t}</text>` : "")).join("");
  const tx = Math.min(Math.max(pts[hi][0], pl + 30), W - pr - 30);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="월별 추이 꺾은선 그래프"><defs><linearGradient id="lgA" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="stopA" stop-opacity=".3"/><stop offset="1" class="stopA" stop-opacity="0"/></linearGradient></defs>
  ${grid}<path d="${area}" fill="url(#lgA)"/><path d="${smooth(pts)}" class="line"/>
  ${pts.map((p, i) => `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="${i === hi ? 6 : 3}" class="${i === hi ? "dot-now" : "dot"}"/>`).join("")}
  <rect x="${tx - 30}" y="${pts[hi][1] - 31}" width="60" height="20" rx="8" class="tag"/><text x="${tx}" y="${pts[hi][1] - 17}" text-anchor="middle" class="tag-t">${fmt(values[hi])}</text>${lab}</svg>`;
}

/** 시간대 막대: values 24칸 */
export function hourBars({ values, hi, fmt = (v) => v.toLocaleString("ko-KR") }) {
  const H = 150, pl = 34, bw = (W - pl) / 24, top = 20, base = H - 22;
  const mx = Math.max(...values) * 1.1 || 1;
  const peak = hi ?? values.indexOf(Math.max(...values));
  let s = "";
  [0, 0.5, 1].forEach((k) => {
    const yy = base - (base - top) * k;
    s += `<line x1="${pl}" x2="${W}" y1="${yy}" y2="${yy}" class="grid"/><text x="${pl - 4}" y="${yy + 3}" text-anchor="end" class="ax">${fmt(Math.round((mx * k) / 1000) * 1000)}</text>`;
  });
  values.forEach((v, i) => {
    const h = (base - top) * (v / mx);
    s += `<rect x="${r1(pl + i * bw + 1)}" y="${r1(base - h)}" width="${r1(bw - 2)}" height="${r1(h)}" rx="2.5" class="${i === peak ? "bar-hi" : "bar"}"/>`;
  });
  [0, 6, 12, 18, 23].forEach((i) => (s += `<text x="${pl + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle" class="ax">${i}시</text>`));
  const px = Math.min(pl + peak * bw, W - 56);
  s += `<rect x="${px - 6}" y="0" width="64" height="17" rx="7" class="tag"/><text x="${px + 26}" y="12" text-anchor="middle" class="tag-t">${fmt(values[peak])}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="시간대별 생활인구 막대 그래프">${s}</svg>`;
}

/** 월별 연령 구성 누적 막대: rows[월][5묶음 비중], 맨 위가 마지막 묶음 */
export function stackBars({ rows, labels }) {
  if (!rows || !rows.length) return empty("연령 추이 자료가 없습니다");
  const H = 140, pl = 8, base = H - 22, top = 6, n = rows.length, bw = Math.min(22, (W - pl * 2) / n - 6), gap = (W - pl * 2 - bw * n) / Math.max(1, n - 1);
  let s = "";
  rows.forEach((row, i) => {
    let y = base;
    const tot = row.reduce((a, b) => a + b, 0) || 1;
    row.forEach((v, k) => {
      const h = ((v / tot) * (base - top));
      y -= h;
      s += `<rect x="${r1(pl + i * (bw + gap))}" y="${r1(y)}" width="${bw}" height="${r1(h)}" class="f${k + 1}"/>`;
    });
    s += `<text x="${r1(pl + i * (bw + gap) + bw / 2)}" y="${H - 6}" text-anchor="middle" class="ax">${labels[i]}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="월별 연령대 구성 막대 그래프">${s}</svg>`;
}

/** 히트맵: rowsData = [{label, values:[…]}], cols = 열 이름 */
export function heatmap({ rowsData, cols }) {
  const lw = 34, cw = (W - lw) / cols.length, ch = 26;
  const all = rowsData.flatMap((r) => r.values);
  const mx = Math.max(...all) || 1, mn = Math.min(...all);
  let s = cols.map((t, j) => `<text x="${lw + j * cw + cw / 2}" y="10" text-anchor="middle" class="ax">${t}</text>`).join("");
  rowsData.forEach((r, i) => {
    s += `<text x="${lw - 6}" y="${22 + i * (ch + 4) + 17}" text-anchor="end" class="ax">${r.label}</text>`;
    r.values.forEach((v, j) => {
      const k = (v - mn) / (mx - mn || 1);
      s += `<rect x="${r1(lw + j * cw + 1.5)}" y="${18 + i * (ch + 4)}" width="${r1(cw - 3)}" height="${ch}" rx="6" class="heat" style="opacity:${(0.12 + k * 0.88).toFixed(2)}"/>`;
    });
  });
  return `<svg viewBox="0 0 ${W} ${22 + rowsData.length * (ch + 4)}" role="img" aria-label="평일 주말 시간대 히트맵">${s}</svg>`;
}

/** 도넛: parts [{name, value(0~1)}] — 색은 f1~f5 */
export function donut({ parts }) {
  const R = 46, C = 2 * Math.PI * R;
  let off = 0, s = "";
  parts.forEach((p, i) => {
    const len = p.value * C;
    s += `<circle cx="60" cy="60" r="${R}" fill="none" class="s${i + 1}" stroke-width="20" stroke-dasharray="${r1(Math.max(0, len - 1.5))} ${r1(C - len + 1.5)}" stroke-dashoffset="${r1(-off)}" transform="rotate(-90 60 60)"/>`;
    off += len;
  });
  return `<svg viewBox="0 0 120 120" role="img" aria-label="연령대 비중 도넛">${s}<text x="60" y="58" text-anchor="middle" class="ax">전체</text><text x="60" y="75" text-anchor="middle" class="big-t">100%</text></svg>`;
}

/** 레이더: names 축 이름, sets [{values(0~100|null), cls}] */
export function radar({ names, sets }) {
  const cx = 130, cy = 120, R = 82, n = names.length;
  const pt = (i, r) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [r1(cx + Math.cos(a) * r), r1(cy + Math.sin(a) * r)]; };
  let s = "";
  [0.25, 0.5, 0.75, 1].forEach((k) => (s += `<polygon points="${names.map((_, i) => pt(i, R * k).join(",")).join(" ")}" fill="none" class="grid"/>`));
  names.forEach((nm, i) => { const [x, y] = pt(i, R + 17); s += `<line x1="${cx}" y1="${cy}" x2="${pt(i, R)[0]}" y2="${pt(i, R)[1]}" class="grid"/><text x="${x}" y="${y + 3}" text-anchor="middle" class="ax">${nm}</text>`; });
  sets.forEach((set) => {
    s += `<polygon points="${set.values.map((v, i) => pt(i, (R * (v ?? 0)) / 100).join(",")).join(" ")}" class="rad ${set.cls}"/>`;
  });
  return `<svg viewBox="0 0 260 240" role="img" aria-label="항목별 레이더 그래프">${s}</svg>`;
}
