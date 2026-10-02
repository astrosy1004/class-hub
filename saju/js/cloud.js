// 로그인 사용자의 명식 목록 전담 파일. 저장 위치는 Firestore의 users/{uid}/charts/{명식 id}.
// 명식 id는 이 기기에서 만든 id를 그대로 써서, 같은 명식을 다시 올려도 문서가 늘지 않는다.
// Firestore SDK는 여기서 직접 불러오지 않고 항상 ./firebase.js를 거친다.

import { db, doc, setDoc, deleteDoc, serverTimestamp, collection, query, orderBy, onSnapshot } from "./firebase.js";

// 저장하는 필드만 골라 담는다 (화면용 값이 섞여 들어가지 않게)
const FIELDS = ["name", "relation", "gender", "calendar", "leap", "date", "time", "city", "longitude", "applyDst", "nightZi", "consent"];

function chartsCollection(uid) {
  return collection(db, "users", uid, "charts");
}

export async function saveCloudChart(uid, chart) {
  const data = Object.fromEntries(FIELDS.map((k) => [k, chart[k] ?? null]));
  await setDoc(doc(db, "users", uid, "charts", chart.id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCloudChart(uid, id) {
  await deleteDoc(doc(db, "users", uid, "charts", id));
}

/**
 * 명식 목록을 최근 수정순으로 실시간 구독한다.
 * @returns {() => void} 구독 해제 함수
 */
export function subscribeCloudCharts(uid, callback, onError) {
  const q = query(chartsCollection(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }))),
    (err) => onError?.(err),
  );
}
