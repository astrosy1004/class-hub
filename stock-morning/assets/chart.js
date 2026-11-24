// 차트 공부 시트 화면. 데이터는 ../data/chart-sheets.js (CHART_SHEETS)
//   chart.html       → 시트 목차
//   chart.html#01    → 01번 시트

var THEME_KEY = 'stockMorningTheme';
var DONE_KEY = 'stockMorningChartDone';
var SVGNS = 'http://www.w3.org/2000/svg';

function el(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function svg(tag, attrs, text) {
  var e = document.createElementNS(SVGNS, tag);
  for (var k in attrs) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}

// ---------------------------------------------------------------- 완료 기록 (이 브라우저에만 저장)
function getDone() {
  try { return JSON.parse(localStorage.getItem(DONE_KEY) || '[]'); } catch (e) { return []; }
}
function setDone(list) {
  try { localStorage.setItem(DONE_KEY, JSON.stringify(list)); } catch (e) {}
}

// ---------------------------------------------------------------- 그림

// 캔들 여러 개: items = [{o,h,l,c,label}], prev = 전날 종가(점선)
function drawCandles(fig) {
  var items = fig.items;
  var W = Math.max(260, items.length * 96), H = 200, top = 14, bottom = 40;
  var lo = Infinity, hi = -Infinity;
  items.forEach(function (it) { lo = Math.min(lo, it.l); hi = Math.max(hi, it.h); });
  if (fig.prev != null) { lo = Math.min(lo, fig.prev); hi = Math.max(hi, fig.prev); }
  var pad = (hi - lo) * 0.08 || 1;
  lo -= pad; hi += pad;
  var y = function (v) { return top + (hi - v) / (hi - lo) * (H - top - bottom); };
  var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'fig', role: 'img' });
  if (fig.prev != null) {
    s.appendChild(svg('line', { x1: 0, x2: W, y1: y(fig.prev), y2: y(fig.prev), class: 'f-prev' }));
    s.appendChild(svg('text', { x: 6, y: y(fig.prev) - 6, class: 'f-txt' }, '전날 종가'));
  }
  var step = W / items.length;
  items.forEach(function (it, i) {
    var cx = step * i + step / 2;
    var diff = Math.abs(it.c - it.o) / (hi - lo);
    var kind = diff < 0.01 ? 'doji' : it.c > it.o ? 'up' : 'dn';
    s.appendChild(svg('line', { x1: cx, x2: cx, y1: y(it.h), y2: y(it.l), class: 'f-wick f-' + kind }));
    var y1 = y(Math.max(it.o, it.c)), y2 = y(Math.min(it.o, it.c));
    s.appendChild(svg('rect', { x: cx - 13, y: y1, width: 26, height: Math.max(2, y2 - y1), rx: 2, class: 'f-body f-' + kind }));
    s.appendChild(svg('text', { x: cx, y: H - 14, class: 'f-lbl', 'text-anchor': 'middle' }, it.label));
  });
  return s;
}

// 캔들 구조 설명 그림 (양봉·음봉 각각 네 가지 가격 표시)
function drawAnatomy() {
  var s = svg('svg', { viewBox: '0 0 340 230', class: 'fig', role: 'img' });
  var one = function (x, up) {
    var k = up ? 'up' : 'dn';
    s.appendChild(svg('line', { x1: x, x2: x, y1: 20, y2: 190, class: 'f-wick f-' + k }));
    s.appendChild(svg('rect', { x: x - 18, y: 60, width: 36, height: 90, rx: 3, class: 'f-body f-' + k }));
    var lab = function (yy, t) {
      s.appendChild(svg('line', { x1: x + 22, x2: x + 40, y1: yy, y2: yy, class: 'f-guide' }));
      s.appendChild(svg('text', { x: x + 44, y: yy + 4, class: 'f-txt' }, t));
    };
    lab(20, '고가');
    lab(60, up ? '종가' : '시가');
    lab(150, up ? '시가' : '종가');
    lab(190, '저가');
    s.appendChild(svg('text', { x: x, y: 220, class: 'f-lbl', 'text-anchor': 'middle' }, up ? '양봉 (종가 > 시가)' : '음봉 (종가 < 시가)'));
  };
  one(70, true);
  one(240, false);
  return s;
}

// 예시 주가 만들기: path 의 꺾은선을 따라가며 규칙적인 출렁임을 더한다 (매번 같은 모양).
function makeSeries(path, len, wiggle) {
  var pts = [];
  for (var i = 0; i < len; i++) {
    var t = (i / (len - 1)) * path[path.length - 1][0];
    var k = 0;
    while (k < path.length - 2 && t > path[k + 1][0]) k++;
    var a = path[k], b = path[k + 1];
    var base = a[1] + (b[1] - a[1]) * ((t - a[0]) / (b[0] - a[0] || 1));
    var w = wiggle == null ? 1.5 : wiggle;
    pts.push(base * (1 + (Math.sin(i * 1.7) * 0.6 + Math.sin(i * 0.63) * 0.4 + Math.sin(i * 2.9) * 0.3) * w / 100));
  }
  return pts;
}
function movingAvg(arr, n) {
  return arr.map(function (_, i) {
    if (i < n - 1) return null;
    var s = 0;
    for (var j = i - n + 1; j <= i; j++) s += arr[j];
    return s / n;
  });
}

// 주가 선 + 이동평균선: { type:'lines', path:[[x,가격]...], show:60, mas:[5,20], marks:[{at, text}] }
function drawLines(fig) {
  var show = fig.show || 60;
  var mas = fig.mas || [20];
  var warm = Math.max.apply(null, mas);
  var all = makeSeries(fig.path, show + warm, fig.wiggle);
  var lines = [{ cls: 'f-price', data: all.slice(warm), name: '주가(종가)' }];
  mas.forEach(function (n) { lines.push({ cls: 'f-ma f-ma' + n, data: movingAvg(all, n).slice(warm), name: n + '일선' }); });
  // 거래량 막대를 그리면 아래쪽 70px 를 거래량 영역으로 쓴다.
  var volH = fig.vol ? 70 : 0;
  var W = 520, H = 220 + volH, top = 12, bottom = 34 + volH;
  var vals = [];
  lines.forEach(function (l) { l.data.forEach(function (v) { if (v != null) vals.push(v); }); });
  var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
  var x = function (i) { return 8 + (i / (show - 1)) * (W - 16); };
  var y = function (v) { return top + (hi - v) / (hi - lo || 1) * (H - top - bottom); };
  var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'fig', role: 'img' });
  if (fig.vol) {
    var price = lines[0].data;
    var prevAll = all[warm - 1];
    var vol = price.map(function (_, i) {
      var v = 1 + 0.3 * Math.sin(i * 1.3) + 0.18 * Math.sin(i * 0.7 + 1);
      (fig.vol.spikes || []).forEach(function (sp) {
        var d = Math.abs(i - Math.round(sp.at * (show - 1)));
        if (d === 0) v *= sp.mult;
        else if (d <= (sp.tail || 0)) v *= 1 + (sp.mult - 1) / (d + 1.5);
      });
      if (fig.vol.quietAfter != null && i > fig.vol.quietAfter * (show - 1)) v *= 0.55;
      return v;
    });
    var vmax = Math.max.apply(null, vol);
    var vTop = H - 34 - volH + 8, vBot = H - 34;
    var bw = (W - 16) / show * 0.7;
    s.appendChild(svg('line', { x1: 0, x2: W, y1: vTop - 4, y2: vTop - 4, class: 'f-guide f-sep' }));
    s.appendChild(svg('text', { x: 6, y: vTop + 8, class: 'f-lbl' }, '거래량'));
    vol.forEach(function (v, i) {
      var up = price[i] >= (i ? price[i - 1] : prevAll);
      var hgt = (v / vmax) * (vBot - vTop);
      s.appendChild(svg('rect', { x: x(i) - bw / 2, y: vBot - hgt, width: bw, height: hgt, class: 'f-vol ' + (up ? 'f-up' : 'f-dn') }));
    });
  }
  lines.forEach(function (l) {
    var p = l.data.map(function (v, i) { return v == null ? null : x(i).toFixed(1) + ',' + y(v).toFixed(1); }).filter(Boolean).join(' ');
    s.appendChild(svg('polyline', { points: p, class: l.cls }));
  });
  (fig.marks || []).forEach(function (m) {
    var i = Math.round(m.at * (show - 1));
    var v = lines[0].data[i];
    s.appendChild(svg('circle', { cx: x(i), cy: y(v), r: 4, class: 'f-mark' }));
    var right = x(i) > W * 0.7, left = x(i) < W * 0.3;
    s.appendChild(svg('text', {
      x: right ? x(i) - 8 : left ? x(i) + 8 : x(i),
      y: Math.max(y(v) - 10, 14),
      class: 'f-txt',
      'text-anchor': right ? 'end' : left ? 'start' : 'middle',
    }, m.text));
  });
  // 범례
  var lx = 10;
  lines.forEach(function (l) {
    s.appendChild(svg('line', { x1: lx, x2: lx + 18, y1: H - 12, y2: H - 12, class: l.cls }));
    s.appendChild(svg('text', { x: lx + 22, y: H - 8, class: 'f-lbl' }, l.name));
    lx += 30 + l.name.length * 12;
  });
  if (fig.title) s.appendChild(svg('text', { x: W - 8, y: H - 8, class: 'f-lbl', 'text-anchor': 'end' }, fig.title));
  return s;
}

function figure(f) {
  if (f.type === 'anatomy') return drawAnatomy();
  if (f.type === 'candles') return drawCandles(f);
  if (f.type === 'lines') return drawLines(f);
  return el('div');
}

// ---------------------------------------------------------------- 목차

function renderList(root) {
  var done = getDone();
  var ready = CHART_SHEETS.filter(function (s) { return s.ready; });
  var doneCount = ready.filter(function (s) { return done.indexOf(s.id) >= 0; }).length;

  var intro = el('section', 'sheet-intro');
  intro.appendChild(el('h2', null, '차트, 한 장씩 차근차근'));
  intro.appendChild(el('p', null, '시트 하나는 10~25분 분량입니다. 순서대로 읽고, 끝의 확인 문제와 실습까지 해 본 뒤 "공부 완료"를 눌러 주세요. 리포트의 "차트상 관심주"를 읽는 데 필요한 내용만 골라 담았습니다.'));
  var bar = el('div', 'progress');
  var fill = el('span');
  fill.style.width = (ready.length ? (doneCount / CHART_SHEETS.length) * 100 : 0) + '%';
  bar.appendChild(fill);
  intro.appendChild(bar);
  intro.appendChild(el('p', 'muted small', '진도 ' + doneCount + ' / ' + CHART_SHEETS.length + ' (공개된 시트 ' + ready.length + '장, 진도는 이 기기에만 저장됩니다)'));
  root.appendChild(intro);

  var ul = el('ul', 'sheet-list');
  CHART_SHEETS.forEach(function (s) {
    var li = el('li', s.ready ? '' : 'locked');
    var box = el(s.ready ? 'a' : 'div', 'sheet-item');
    if (s.ready) box.href = '#' + s.id;
    var num = el('span', 'sheet-num', s.id);
    var body = el('div');
    var t = el('div', 'sheet-title', s.title);
    if (done.indexOf(s.id) >= 0) t.appendChild(el('span', 'badge-done', '✓ 완료'));
    body.appendChild(t);
    body.appendChild(el('div', 'sheet-sum', s.summary));
    body.appendChild(el('div', 'sheet-meta', s.level + ' · ' + s.time + (s.ready ? '' : ' · 준비 중')));
    box.appendChild(num);
    box.appendChild(body);
    li.appendChild(box);
    ul.appendChild(li);
  });
  root.appendChild(ul);
}

// ---------------------------------------------------------------- 시트

function renderSheet(root, s) {
  var idx = CHART_SHEETS.indexOf(s);
  var back = el('a', 'back', '← 시트 목차');
  back.href = '#';
  root.appendChild(back);

  var head = el('section', 'sheet-head');
  head.appendChild(el('div', 'sheet-meta', 'SHEET ' + s.id + ' · ' + s.level + ' · ' + s.time));
  head.appendChild(el('h2', null, s.title));
  var goals = el('ul', 'goals');
  s.goals.forEach(function (g) { goals.appendChild(el('li', null, g)); });
  head.appendChild(el('b', null, '이 시트를 마치면'));
  head.appendChild(goals);
  root.appendChild(head);

  s.sections.forEach(function (sec) {
    var box = el('section', 'sheet-sec');
    if (sec.h) box.appendChild(el('h3', null, sec.h));
    var body = el('div');
    body.innerHTML = sec.html; // 시트 데이터는 저장소 안에서 직접 작성한 내용
    box.appendChild(body);
    if (sec.figure) box.appendChild(figure(sec.figure));
    root.appendChild(box);
  });

  if (s.quiz && s.quiz.length) {
    var qz = el('section', 'sheet-sec quiz');
    var qh = el('h3', null, ' 확인 문제');
    qh.insertBefore(iconNode('ok'), qh.firstChild);
    qz.appendChild(qh);
    s.quiz.forEach(function (q, qi) {
      var item = el('div', 'q');
      item.appendChild(el('p', 'q-text', (qi + 1) + '. ' + q.q));
      var opts = el('div', 'q-opts');
      var exp = el('p', 'q-exp');
      exp.hidden = true;
      q.options.forEach(function (o, oi) {
        var b = el('button', 'q-opt', o);
        b.type = 'button';
        b.addEventListener('click', function () {
          var all = opts.querySelectorAll('button');
          for (var i = 0; i < all.length; i++) {
            all[i].disabled = true;
            if (i === q.answer) all[i].classList.add('right');
          }
          if (oi !== q.answer) b.classList.add('wrong');
          exp.textContent = ' ' + (oi === q.answer ? '정답! ' : '정답은 "' + q.options[q.answer] + '" — ') + q.explain;
          exp.insertBefore(iconNode(oi === q.answer ? 'ok' : 'no'), exp.firstChild);
          exp.hidden = false;
        });
        opts.appendChild(b);
      });
      item.appendChild(opts);
      item.appendChild(exp);
      qz.appendChild(item);
    });
    root.appendChild(qz);
  }

  var pr = el('section', 'sheet-sec practice');
  var ph = el('h3', null, ' 리포트로 실습하기');
  ph.insertBefore(iconNode('pen'), ph.firstChild);
  pr.appendChild(ph);
  var p = el('p');
  p.innerHTML = s.practice;
  pr.appendChild(p);
  var latest = typeof REPORTS !== 'undefined' && REPORTS.length ? REPORTS[0] : null;
  if (latest) {
    var a = el('a', 'btn', '최신 리포트(' + latest.date + ')의 차트상 관심주 열기 →');
    a.href = './analysis/' + latest.date + '.html#chart';
    pr.appendChild(a);
  }
  if (s.link30) {
    var lp = el('p', 'muted small', ' ' + s.link30);
    lp.insertBefore(iconNode('study'), lp.firstChild);
    pr.appendChild(lp);
  }
  root.appendChild(pr);

  // 완료 버튼 + 다음 시트
  var foot = el('section', 'sheet-foot');
  var done = getDone();
  var btn = el('button', 'btn', done.indexOf(s.id) >= 0 ? '✓ 공부 완료함 (취소하려면 누르기)' : '공부 완료');
  btn.type = 'button';
  btn.addEventListener('click', function () {
    var d = getDone();
    var i = d.indexOf(s.id);
    if (i >= 0) d.splice(i, 1); else d.push(s.id);
    setDone(d);
    btn.textContent = i >= 0 ? '공부 완료' : '✓ 공부 완료함 (취소하려면 누르기)';
  });
  foot.appendChild(btn);
  var next = CHART_SHEETS[idx + 1];
  if (next) {
    if (next.ready) {
      var n = el('a', 'next', '다음 시트: ' + next.id + ' ' + next.title + ' →');
      n.href = '#' + next.id;
      foot.appendChild(n);
    } else {
      foot.appendChild(el('p', 'muted small', '다음 시트 "' + next.title + '"는 준비 중입니다.'));
    }
  }
  root.appendChild(foot);
}

// ---------------------------------------------------------------- 라우팅·테마

function route() {
  var root = document.getElementById('chart-root');
  root.innerHTML = '';
  var id = location.hash.replace('#', '');
  var sheet = null;
  CHART_SHEETS.forEach(function (s) { if (s.id === id && s.ready) sheet = s; });
  if (sheet) renderSheet(root, sheet); else renderList(root);
  window.scrollTo(0, 0);
}

function setupTheme() {
  var btn = document.getElementById('theme');
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  function sync() {
    btn.innerHTML = ICONS[document.documentElement.getAttribute('data-theme') === 'dark' ? 'sun' : 'moon'];
  }
  btn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    sync();
  });
  sync();
}

setupTheme();
route();
window.addEventListener('hashchange', route);
