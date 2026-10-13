// 반경 분할 검색: Kakao 검색은 한 번에 최대 45곳만 주므로, 꽉 찬 칸(45곳)은 4칸으로 나눠 다시 검색하고 합친다.
// Kakao 와 무관한 순수 로직 (검색 함수를 받아서 쓴다) — check.html 에서 가짜 검색 함수로 검증한다.
//
// searchFn(lat, lng, radius) → Promise<{ items: [{id, lat, lng, name}], capped: boolean }>
//   capped = 결과가 조회 한도에 닿아 더 있을 수 있음
// 반환: { items(중복 제거 · 반경 안), count, capped(최대 깊이에서도 꽉 찬 칸이 있음 = 실제는 더 많음), calls(검색 횟수) }

const M_PER_DEG_LAT = 111000;

export function distanceM(lat1, lng1, lat2, lng2) {
  const dy = (lat2 - lat1) * M_PER_DEG_LAT;
  const dx = (lng2 - lng1) * M_PER_DEG_LAT * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
  return Math.sqrt(dx * dx + dy * dy);
}

export async function searchSplit(searchFn, lat, lng, radius, { maxDepth = 2, maxCalls = 30 } = {}) {
  const seen = new Map();
  let calls = 0;
  let saturated = false; // 최대 깊이에서도 꽉 찬 칸이 있었는지

  async function visit(cLat, cLng, r, depth) {
    if (calls >= maxCalls) { saturated = true; return; }
    calls += 1;
    const res = await searchFn(cLat, cLng, Math.round(r));
    res.items.forEach((it) => seen.set(it.id ?? `${it.lat},${it.lng},${it.name}`, it));
    if (!res.capped) return;
    if (depth >= maxDepth) { saturated = true; return; }
    // 원 하나를 덮는 4개의 작은 원: 중심을 (±r/2, ±r/2) 로, 반지름 r/√2
    const d = r / 2;
    const dLat = d / M_PER_DEG_LAT;
    const dLng = d / (M_PER_DEG_LAT * Math.cos(cLat * (Math.PI / 180)));
    const subs = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => visit(cLat + a * dLat, cLng + b * dLng, r / Math.SQRT2, depth + 1));
    await Promise.all(subs);
  }

  await visit(lat, lng, radius, 0);
  const items = [...seen.values()]
    .map((it) => ({ ...it, dist: Math.round(distanceM(lat, lng, it.lat, it.lng)) }))
    .filter((it) => it.dist <= radius)
    .sort((a, b) => a.dist - b.dist);
  return { items, count: items.length, capped: saturated, calls };
}
