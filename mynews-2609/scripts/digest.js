// 매일 오전 9시(KST) 실행: 최근 24시간 뉴스를 카테고리별로 요약해 디스코드 웹훅으로 보낸다.
// 필요한 환경변수: DISCORD_WEBHOOK_URL (GitHub 저장소 Secret)
// 미리보기: node scripts/digest.js --dry
const { collectAll, kst } = require('./lib');

const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PER_CATEGORY = 6;

function recent(items) {
  const since = Date.now() - DAY_MS;
  const fresh = items.filter((i) => i.date && Date.parse(i.date) >= since);
  return fresh.length ? fresh : items;
}

function line(item, categoryId) {
  const time = item.date ? kst(item.date, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const title = item.title.length > 100 ? item.title.slice(0, 98) + '…' : item.title;
  if (categoryId === 'weather') return '· ' + title;
  // 대괄호는 디스코드 링크 문법을 깨뜨리므로 비슷한 기호로 바꾼다.
  const safe = title.split('[').join('〔').split(']').join('〕');
  const head = item.link ? '[' + safe + '](' + item.link + ')' : safe;
  const meta = [item.source, time].filter(Boolean).join(' · ');
  return '· ' + head + (meta ? ' — `' + meta + '`' : '');
}

function buildEmbeds(data) {
  const embeds = [];
  for (const c of data.categories) {
    if (c.error) {
      embeds.push({ title: c.emoji + ' ' + c.name, description: '⚠️ 수집 실패: ' + c.error, color: 0x9aa0a6 });
      continue;
    }
    const picked = (c.id === 'weather' ? c.items : recent(c.items)).slice(0, MAX_PER_CATEGORY);
    if (!picked.length) continue;

    let desc = picked.map((i) => line(i, c.id)).join('\n');
    if (desc.length > 3800) desc = desc.slice(0, 3800) + '…';

    const fresh = c.items.filter((i) => i.date && Date.now() - Date.parse(i.date) < DAY_MS).length;
    const feeds = c.feeds || [];
    const failed = feeds.filter((f) => f.error);
    const foot = ['출처 ' + feeds.length + '곳', '최근 24시간 ' + fresh + '건', '수집 ' + c.items.length + '건'];
    if (failed.length) foot.push('실패: ' + failed.map((f) => f.source).join(', '));

    embeds.push({
      title: c.emoji + ' ' + c.name,
      description: desc,
      color: c.color,
      footer: { text: foot.join(' · ') },
    });
  }
  // 디스코드는 한 메시지의 임베드 총 길이를 6000자로 제한한다.
  const limited = [];
  let budget = 5600;
  for (const e of embeds.slice(0, 10)) {
    if (JSON.stringify(e).length > budget) {
      const lines = e.description.split('\n');
      while (lines.length > 1 && JSON.stringify({ ...e, description: lines.join('\n') }).length > budget) lines.pop();
      e.description = lines.join('\n');
    }
    budget -= JSON.stringify(e).length;
    limited.push(e);
    if (budget <= 0) break;
  }
  return limited;
}

async function main() {
  const dry = process.argv.includes('--dry');
  if (!WEBHOOK && !dry) {
    console.error('DISCORD_WEBHOOK_URL 이 설정되지 않았습니다. (저장소 Settings → Secrets → Actions)');
    process.exit(1);
  }

  const data = await collectAll();
  const today = kst(data.updatedAt, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const total = data.categories.reduce((n, c) => n + c.items.length, 0);
  const fresh = data.categories.reduce(
    (n, c) => n + c.items.filter((i) => i.date && Date.now() - Date.parse(i.date) < DAY_MS).length, 0);

  const payload = {
    username: '나의 뉴스 브리핑',
    content: '📰 **' + today + ' 오전 브리핑** — 최근 24시간 ' + fresh + '건 (수집 ' + total + '건)',
    embeds: buildEmbeds(data),
    allowed_mentions: { parse: [] },
  };

  if (dry) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const res = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    console.error('디스코드 전송 실패: HTTP ' + res.status + ' ' + (await res.text()));
    process.exit(1);
  }
  console.log('디스코드 전송 완료');
}

main();
