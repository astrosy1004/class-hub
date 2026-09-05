// 2시간마다 실행: 피드를 모아 data/news.js 로 저장한다.
// (정적 페이지가 fetch 없이 <script src>로 읽으므로 file:// 에서도 동작)
const fs = require('fs');
const path = require('path');
const { collectAll } = require('./lib');

async function main() {
  const data = await collectAll();
  const ok = data.sources.filter((s) => !s.error).length;
  if (ok === 0) {
    console.error('모든 피드 수집 실패 — 기존 데이터를 유지합니다.');
    process.exit(1);
  }
  const out = path.join(__dirname, '..', 'data', 'news.js');
  const body =
    '// 이 파일은 .github/workflows/mynews-collect.yml 이 2시간마다 자동 생성합니다. 직접 수정하지 마세요.\n' +
    'window.MYNEWS_DATA = ' + JSON.stringify(data, null, 2) + ';\n';
  fs.writeFileSync(out, body, 'utf8');
  console.log(`저장 완료: ${path.relative(process.cwd(), out)} (${data.sources.reduce((n, s) => n + s.items.length, 0)}건)`);
}

main();
