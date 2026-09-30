// 최근 검색한 도시 기록 전담 파일. 저장 위치는 Firestore의 users/{uid}/history.
// Firestore SDK는 여기서 직접 불러오지 않고 항상 ./firebase.js를 거친다.

import {
  db,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
} from "./firebase.js";

const MAX_HISTORY = 5;

function log(...args) {
  console.log("[HISTORY]", ...args);
}

function historyCollection(uid) {
  return collection(db, "users", uid, "history");
}

/**
 * 도시를 최근 검색 기록에 추가(또는 갱신)한다.
 * 문서 ID로 도시 고유 id(Open-Meteo geocoding 결과의 id)를 써서, 같은 도시를 다시
 * 검색하면 새 문서를 만들지 않고 viewedAt만 갱신한다 (중복 방지 + 최신순 정렬).
 * 저장 후 5개를 넘으면 가장 오래된 것부터 지운다.
 * @param {string} uid
 * @param {object} place searchCity 결과 항목 (id, name, admin1, country, latitude, longitude)
 */
export async function saveToHistory(uid, place) {
  if (place.id == null) {
    log("place.id가 없어 기록을 남기지 않음:", place.name);
    return;
  }
  const ref = doc(db, "users", uid, "history", String(place.id));
  await setDoc(ref, {
    name: place.name,
    admin1: place.admin1 ?? null,
    country: place.country ?? null,
    latitude: place.latitude,
    longitude: place.longitude,
    viewedAt: serverTimestamp(),
  });
  log("기록 저장:", place.name);
  await trimHistory(uid);
}

// 최근순으로 MAX_HISTORY개보다 많으면 넘치는 만큼(가장 오래된 것부터) 지운다.
async function trimHistory(uid) {
  const q = query(historyCollection(uid), orderBy("viewedAt", "desc"));
  const snapshot = await getDocs(q);
  const overflow = snapshot.docs.slice(MAX_HISTORY);
  if (overflow.length === 0) return;
  await Promise.all(overflow.map((d) => deleteDoc(d.ref)));
  log(`${overflow.length}개 초과분 삭제`);
}

/**
 * 최근 검색 기록(최대 5개, 최신순)을 실시간 구독한다.
 * @param {string} uid
 * @param {(items: Array<object>) => void} callback
 * @returns {() => void} 구독 해제 함수
 */
export function subscribeHistory(uid, callback) {
  const q = query(historyCollection(uid), orderBy("viewedAt", "desc"), limit(MAX_HISTORY));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    (err) => {
      log("구독 오류:", err);
    }
  );
}
