// 이 기기 목록과 계정(Firestore) 목록을 합치는 순수 계산. 네트워크 · SDK 와 무관해서 시험할 수 있다.

// 계정에 올릴 모양으로 정리: 필요한 필드만, 그리고 "현재 위치"로 찾은 장소는 정확한 좌표를 올리지 않는다
// (다시 열 때는 행정동 이름으로 위치를 찾는다).
export function toCloudItem(item) {
  const p = item.place || {};
  const place = { name: p.name ?? null, gu: p.gu ?? null, guName: p.guName ?? null, dongCode: p.dongCode ?? null, source: p.source ?? null };
  if (!p.isCurrent && p.lat != null && p.lng != null) {
    place.lat = p.lat;
    place.lng = p.lng;
  }
  return {
    key: String(item.key), place,
    industryKey: item.industryKey, industryName: item.industryName,
    total: item.total ?? null, grade: item.grade || "", at: item.at || Date.now(),
  };
}

// Firestore 문서 id 로 쓸 수 있게 ('/' 제거)
export const docId = (key) => String(key).replace(/\//g, "_");

// 같은 key 는 더 최근(at) 것을 남기고, 최근순으로 최대 max 개. dropped = 넘쳐서 빠진 key
export function mergeLists(local, cloud, max) {
  const map = new Map();
  for (const it of [...cloud, ...local]) {
    const prev = map.get(it.key);
    if (!prev || (it.at || 0) > (prev.at || 0)) map.set(it.key, it);
  }
  const all = [...map.values()].sort((a, b) => (b.at || 0) - (a.at || 0));
  return { merged: all.slice(0, max), dropped: all.slice(max).map((i) => i.key) };
}
