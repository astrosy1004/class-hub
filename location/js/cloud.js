// 로그인 사용자의 후보지(saved) · 최근 검색(recent) 저장: Firestore users/{uid}/saved|recent/{문서 id}.
// 보안 규칙(firestore.rules)이 users/{uid} 아래를 본인만 읽고 쓰게 막는다. SDK 는 firebase.js 를 거쳐 불러온다.
import { loadFirebase } from "./firebase.js";
import { toCloudItem, docId } from "./sync.js";

const KINDS = ["saved", "recent"];

export async function fetchAll(uid) {
  const f = await loadFirebase();
  const out = { saved: [], recent: [] };
  for (const kind of KINDS) {
    const snap = await f.getDocs(f.collection(f.db, "users", uid, kind));
    out[kind] = snap.docs.map((d) => d.data());
  }
  return out;
}

// 계정의 한 목록을 이 기기 목록과 똑같이 맞춘다 (없는 건 삭제, 있는 건 덮어쓰기). 항목이 3~8개라 가볍다.
export async function replaceKind(uid, kind, list) {
  const f = await loadFirebase();
  const col = f.collection(f.db, "users", uid, kind);
  const snap = await f.getDocs(col);
  const keep = new Set(list.map((i) => docId(i.key)));
  const batch = f.writeBatch(f.db);
  snap.docs.forEach((d) => { if (!keep.has(d.id)) batch.delete(d.ref); });
  list.forEach((i) => batch.set(f.doc(f.db, "users", uid, kind, docId(i.key)), toCloudItem(i)));
  await batch.commit();
}
