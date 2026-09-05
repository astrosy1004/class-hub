// 2시간마다 실행: 피드를 모아 data/news.js 로 저장한다.
// (정적 페이지가 fetch 없이 <script src>로 읽으므로 file:// 에서도 동작)
const fs = require('fs');
const path = require('path');
const { collectAll } = require('./lib');

// 직전 수집 결과를 읽어둔다. (일부 출처가 실패하면 그 부분만 이어 쓴다)
function readPrevious(file) {
  try {
    const src = fs.readFileSync(file, 'utf8');
    return JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
  } catch (e) {
    return null;
  }
}

async function main() {
  const out = path.join(__dirname, '..', 'data', 'news.js');
  const data = await collectAll(readPrevious(out));
  const ok = data.categories.filter((c) => !c.error).length;
  if (ok === 0) {
    console.error('모든 카테고리 수집 실패 — 기존 데이터를 유지합니다.');
    process.exit(1);
  }
  const body =
    '// 이 파일은 .github/workflows/mynews-collect.yml 이 2시간마다 자동 생성합니다. 직접 수정하지 마세요.\n' +
    'window.MYNEWS_DATA = ' + JSON.stringify(data, null, 2) + ';\n';
  fs.writeFileSync(out, body, 'utf8');
  console.log(`저장 완료: ${path.relative(process.cwd(), out)} (${data.categories.reduce((n, c) => n + c.items.length, 0)}건)`);
}

main();
