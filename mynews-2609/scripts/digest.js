// 매일 오전 9시(KST) 실행: 최근 24시간 뉴스를 요약해 디스코드 웹훅으로 보낸다.
// 필요한 환경변수: DISCORD_WEBHOOK_URL (GitHub 저장소 Secret)
const { collectAll, kst } = require('./lib');

const WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PER_SOURCE = 5;

function recent(items) {
  const since = Date.now() - DAY_MS;
  const fresh = items.filter((i) => i.date && Date.parse(i.date) >= since);
  return fresh.length ? fresh : items.slice(0, MAX_PER_SOURCE);
}

function line(item, feedId) {
  const time = item.date ? kst(item.date, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const title = item.title.length > 110 ? item.title.slice(0, 108) + '…' : item.title;
  if (feedId === 'weather') return `· ${title}`;
  const head = item.link ? `[${title.replace(/[[\]]/g, '')}](${item.link})` : title;
  return `· ${head}${time ? ` — \`${time}\`` : ''}`;
}

function buildEmbeds(data) {
  const embeds = [];
  for (const s of data.sources) {
    if (s.error) {
      embeds.push({ title: `${s.emoji} ${s.name}`, description: `⚠️ 수집 실패: ${s.error}`, color: 0x9aa0a6 });
      continue;
    }
    const picked = (s.id === 'weather' ? s.items.slice(0, 6) : recent(s.items)).slice(0, MAX_PER_SOURCE + 1);
    if (!picked.length) continue;
    let desc = picked.map((i) => line(i, s.id)).join('\n');
    if (desc.length > 3900) desc = desc.slice(0, 3900) + '…';
    embeds.push({
      title: `${s.emoji} ${s.name}`,
      description: desc,
      color: s.color,
      footer: { text: `${s.source} · 최근 24시간 ${s.items.filter((i) => i.date && Date.now() - Date.parse(i.date) < DAY_MS).length}건 / 전체 ${s.items.length}건` },
    });
  }
  return embeds.slice(0, 10);
}

async function main() {
  const dry = process.argv.includes('--dry');
  if (!WEBHOOK && !dry) {
    console.error('DISCORD_WEBHOOK_URL 이 설정되지 않았습니다. (저장소 Settings → Secrets → Actions)');
    process.exit(1);
  }
  const data = await collectAll();
  const today = kst(data.updatedAt, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const total = data.sources.reduce((n, s) => n + s.items.length, 0);

  const payload = {
    username: '나의 뉴스 브리핑',
    content: `📰 **${today} 오전 브리핑** — 총 ${total}건`,
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
    console.error(`디스코드 전송 실패: HTTP ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log('디스코드 전송 완료');
}

main();
