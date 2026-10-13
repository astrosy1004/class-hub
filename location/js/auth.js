// 구글 로그인 · 로그아웃 · 로그인 상태 구독 전담.
// SDK 는 앱을 열 때 미리 불러 둔다 — 로그인 팝업은 클릭 처리 안에서 바로 열어야 브라우저가 막지 않기 때문이다.
import { loadFirebase } from "./firebase.js";

let fb = null;

const pick = (u) => (u ? { uid: u.uid, name: u.displayName || "", email: u.email || "", photo: u.photoURL || "" } : null);

// 로그인 상태가 바뀔 때마다 onChange(user | null, ok) 를 부른다. SDK 를 못 불러오면 onChange(null, false)
export async function initAuth(onChange) {
  try {
    fb = await loadFirebase();
    fb.onAuthStateChanged(fb.auth, (u) => onChange(pick(u), true));
  } catch (e) {
    onChange(null, false);
  }
}

// 클릭 처리 안에서 await 없이 바로 호출해야 한다 (앞에 비동기 작업이 끼면 팝업이 차단됨)
export function signIn() {
  if (!fb) return Promise.reject(Object.assign(new Error("로그인을 준비 중이에요. 잠시 후 다시 눌러 주세요."), { code: "app/not-ready" }));
  return fb.signInWithPopup(fb.auth, new fb.GoogleAuthProvider());
}

export function signOutUser() {
  return fb ? fb.signOut(fb.auth) : Promise.resolve();
}

// 로그인 오류를 사용자에게 보여 줄 문장으로 (null = 조용히 넘어가도 되는 경우)
export function authErrorMessage(e) {
  switch (e?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null;
    case "auth/popup-blocked":
      return "팝업이 차단되었어요. 브라우저의 팝업 허용 후 다시 눌러 주세요.";
    case "auth/operation-not-allowed":
      return "구글 로그인이 아직 켜져 있지 않아요 (Firebase 콘솔 > Authentication 설정 필요).";
    case "auth/unauthorized-domain":
      return "이 주소는 로그인이 허용되지 않았어요 (Firebase 콘솔의 승인된 도메인 확인).";
    case "auth/network-request-failed":
      return "네트워크 연결을 확인해 주세요.";
    case "app/not-ready":
      return e.message;
    default:
      return `로그인하지 못했어요 (${e?.code || e?.message || "알 수 없는 오류"})`;
  }
}
