// 데이터는 ../data/study.js (STUDY_WEEKS, STUDY_PLAN) 와 ../data/reports.js (REPORTS) 에 있습니다.
// 보고서 목록은 GitHub Actions 가 매일 갱신하고, 30일 공부 내용은 study.js 만 고치면 메일과 화면이 함께 바뀝니다.

var THEME_KEY = 'stockMorningTheme';

function el(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function renderReports() {
  var list = document.getElementById('report-list');
  var reports = typeof REPORTS !== 'undefined' ? REPORTS : [];
  if (!reports.length) {
    var li = el('li', 'empty', '첫 보고서는 다음 평일 아침 7시에 도착합니다.');
    list.appendChild(li);
    return;
  }
  reports.forEach(function (r) {
    var li = el('li');
    var a = el('a');
    a.href = './analysis/' + r.date + '.html';
    var left = el('div');
    left.appendChild(el('div', 'report-date', r.date + ' 장 정리'));
    left.appendChild(el('div', 'report-title', r.headline));
    a.appendChild(left);
    if (typeof r.kospi === 'number') {
      var up = r.kospi >= 0;
      a.appendChild(el('span', up ? 'up' : 'down', '코스피 ' + (up ? '▲ ' : '▼ ') + Math.abs(r.kospi).toFixed(2) + '%'));
    }
    li.appendChild(a);
    list.appendChild(li);
  });
}

// 맨 위 핵심 요약: 최신 리포트의 "꼭 알아야 할 3가지" + 최근 10개 리포트에서 반복된 재료
function renderDigest() {
  var root = document.getElementById('digest');
  var reports = typeof REPORTS !== 'undefined' ? REPORTS : [];
  if (!reports.length) return;
  var latest = reports[0];
  var box = el('section', 'digest');
  box.appendChild(el('h2', null, '📌 꼭 알아야 할 핵심 — ' + latest.date + ' 장'));
  var title = el('a', 'digest-title', latest.headline);
  title.href = './analysis/' + latest.date + '.html';
  box.appendChild(title);
  if (latest.points && latest.points.length) {
    var ol = el('ol');
    latest.points.forEach(function (p) { ol.appendChild(el('li', null, p)); });
    box.appendChild(ol);
  }

  var recent = reports.slice(0, 10);
  var count = {};
  recent.forEach(function (r) {
    (r.tags || []).forEach(function (t) { count[t] = (count[t] || 0) + 1; });
  });
  var tags = Object.keys(count).filter(function (t) { return count[t] >= 2; })
    .sort(function (a, b) { return count[b] - count[a]; }).slice(0, 10);
  if (tags.length) {
    var row = el('div', 'digest-tags');
    row.appendChild(el('b', null, '🔁 최근 ' + recent.length + '개 리포트에서 반복된 재료 '));
    tags.forEach(function (t) {
      var s = el('span', null, '#' + t + ' ');
      s.appendChild(el('i', null, count[t] + '회'));
      row.appendChild(s);
    });
    box.appendChild(row);
  }

  var trend = recent.filter(function (r) { return typeof r.kospi === 'number'; });
  if (trend.length >= 2) {
    var sum = trend.reduce(function (a, r) { return a + r.kospi; }, 0);
    var up = trend.filter(function (r) { return r.kospi > 0; }).length;
    box.appendChild(el('p', 'digest-note', '최근 ' + trend.length + '거래일 코스피: 상승 ' + up + '일 · 하락 ' + (trend.length - up) + '일 · 등락률 합계 ' + (sum > 0 ? '+' : '') + sum.toFixed(2) + '%'));
  }
  root.appendChild(box);
}

function renderStudy() {
  var root = document.getElementById('study-list');
  STUDY_WEEKS.forEach(function (w, wi) {
    var sec = el('section', 'week');
    var h = el('h2', null, w.week + '주차 · ' + w.theme);
    h.appendChild(el('small', null, w.days));
    sec.appendChild(h);
    STUDY_PLAN.slice(wi * 5, wi * 5 + 5).forEach(function (d) {
      var det = el('details', 'day');
      var sum = el('summary');
      sum.appendChild(el('span', 'badge', d.day + '일차'));
      sum.appendChild(el('span', null, d.title));
      det.appendChild(sum);
      var body = el('div', 'day-body');
      body.appendChild(el('p', 'goal', '목표: ' + d.goal));
      var ul = el('ul');
      d.learn.forEach(function (l) { ul.appendChild(el('li', null, l)); });
      body.appendChild(ul);
      body.appendChild(el('div', 'practice', '✍️ 실습 — ' + d.practice));
      det.appendChild(body);
      sec.appendChild(det);
    });
    root.appendChild(sec);
  });
}

function showTab() {
  var tab = location.hash === '#study' ? 'study' : 'reports';
  document.getElementById('panel-reports').hidden = tab !== 'reports';
  document.getElementById('panel-study').hidden = tab !== 'study';
  document.querySelectorAll('.tabs a').forEach(function (a) {
    a.classList.toggle('on', a.getAttribute('data-tab') === tab);
  });
}

function setupTheme() {
  var btn = document.getElementById('theme');
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  function sync() {
    btn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
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
renderDigest();
renderReports();
renderStudy();
showTab();
window.addEventListener('hashchange', showTab);
