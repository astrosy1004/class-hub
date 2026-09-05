// 화면 표시 설정 — 내용 수정은 여기만 보면 됩니다.
// 실제 뉴스 데이터는 ../data/news.js (GitHub Actions가 2시간마다 자동 생성)
var CONFIG = {
  themeKey: 'mynewsTheme',   // 다크 모드 저장 키 (폴더마다 다르게)
  reloadMinutes: 30,         // 열어둔 화면이 새 데이터를 다시 읽는 주기
  clickableSources: true,    // 항목 클릭 시 원문 열기
};

var DATA = window.MYNEWS_DATA || { updatedAt: null, categories: [] };

/* ---------- 다크 모드 ---------- */
function initTheme() {
  var saved = null;
  try { saved = localStorage.getItem(CONFIG.themeKey); } catch (e) {}
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved || (prefersDark ? 'dark' : 'light'));

  document.getElementById('theme-toggle').addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem(CONFIG.themeKey, next); } catch (e) {}
  });
}

function setTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  document.getElementById('theme-toggle').textContent = mode === 'dark' ? '☀️' : '🌙';
}

/* ---------- 시간 표시 ---------- */
function fmt(iso, opts) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ko-KR', Object.assign({ timeZone: 'Asia/Seoul' }, opts)).format(new Date(iso));
  } catch (e) { return ''; }
}

function relative(iso) {
  if (!iso) return '';
  var diff = Date.now() - new Date(iso).getTime();
  var future = diff < 0;
  var min = Math.round(Math.abs(diff) / 60000);
  var text;
  if (min < 1) text = '방금';
  else if (min < 60) text = min + '분';
  else if (min < 1440) text = Math.round(min / 60) + '시간';
  else text = Math.round(min / 1440) + '일';
  if (text === '방금') return text;
  return future ? text + ' 후' : text + ' 전';
}

/* ---------- 렌더 ---------- */
function render(keyword) {
  var board = document.getElementById('board');
  var q = (keyword || '').trim().toLowerCase();
  board.innerHTML = '';

  DATA.categories.forEach(function (source) {
    var items = source.items || [];
    if (q) {
      items = items.filter(function (it) {
        return (it.title + ' ' + (it.summary || '')).toLowerCase().indexOf(q) !== -1;
      });
    }

    var card = document.createElement('section');
    card.className = 'card';

    var head = document.createElement('div');
    head.className = 'card-head';
    head.innerHTML =
      '<span class="emoji"></span><div class="head-text"><h2></h2><p class="from"></p></div><span class="count"></span>';
    head.querySelector('.emoji').textContent = source.emoji || '📄';
    head.querySelector('h2').textContent = source.name;
    head.querySelector('.from').textContent = describeFeeds(source.feeds);
    head.querySelector('.count').textContent = items.length + '건';
    card.appendChild(head);

    if (source.error) {
      var err = document.createElement('p');
      err.className = 'error';
      err.textContent = '수집 실패: ' + source.error;
      card.appendChild(err);
    } else if (items.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = q ? '검색 결과가 없습니다.' : '표시할 항목이 없습니다.';
      card.appendChild(empty);
    } else {
      var list = document.createElement('ul');
      list.className = 'list';
      items.forEach(function (it) {
        list.appendChild(renderItem(it, source));
      });
      card.appendChild(list);
    }

    board.appendChild(card);
  });
}

// 카드 머리말에 출처 구성과 실패한 곳을 요약해 보여준다.
function describeFeeds(feeds) {
  if (!feeds || !feeds.length) return '';
  var names = feeds.map(function (f) { return f.source; }).join(' · ');
  var failed = feeds.filter(function (f) { return f.error && !f.stale; });
  var stale = feeds.filter(function (f) { return f.stale; });
  var notes = [];
  if (failed.length) notes.push('수집 실패: ' + failed.map(function (f) { return f.source; }).join(', '));
  if (stale.length) notes.push('직전 데이터 유지: ' + stale.map(function (f) { return f.source; }).join(', '));
  return notes.length ? names + '  (' + notes.join(' / ') + ')' : names;
}

function renderItem(it, source) {
  var li = document.createElement('li');
  var linkable = CONFIG.clickableSources && it.link;
  var node = document.createElement(linkable ? 'a' : 'div');
  node.className = 'item' + (linkable ? '' : ' plain');
  if (linkable) {
    node.href = it.link;
    node.target = '_blank';
    node.rel = 'noopener';
  }

  var title = document.createElement('div');
  title.className = 't';
  title.textContent = it.title;
  node.appendChild(title);

  var meta = document.createElement('div');
  meta.className = 'm';
  var bits = [it.source, fmt(it.date, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }), relative(it.date)];
  bits.filter(Boolean).forEach(function (text) {
    var span = document.createElement('span');
    span.textContent = text;
    meta.appendChild(span);
  });
  node.appendChild(meta);

  li.appendChild(node);
  return li;
}

function renderUpdated() {
  var el = document.getElementById('updated');
  if (!DATA.updatedAt) {
    el.textContent = '아직 수집된 데이터가 없습니다. (GitHub Actions 첫 실행 대기 중)';
    return;
  }
  var total = DATA.categories.reduce(function (n, c) { return n + (c.items ? c.items.length : 0); }, 0);
  el.textContent = '마지막 수집 ' + fmt(DATA.updatedAt, { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) +
    ' (' + relative(DATA.updatedAt) + ') · 총 ' + total + '건 · 2시간마다 자동 갱신';
}

function init() {
  initTheme();
  renderUpdated();
  render('');

  var search = document.getElementById('search');
  search.addEventListener('input', function () { render(search.value); });

  if (location.protocol.indexOf('http') === 0) {
    setTimeout(function () { location.reload(); }, CONFIG.reloadMinutes * 60000);
  }
}

init();
