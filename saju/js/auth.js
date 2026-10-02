// 로그인 · 로그아웃 · 로그인 상태 구독 전담 파일.
// Firebase SDK는 여기서 직접 불러오지 않고 항상 ./firebase.js를 거친다.

import { auth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "./firebase.js";

const provider = new GoogleAuthProvider();

/**
 * 구글 로그인 팝업을 연다.
 * 반드시 클릭 이벤트 처리 안에서 다른 await 없이 바로 호출해야 한다.
 * 앞에 비동기 작업이 끼면 브라우저가 팝업을 막는다(auth/popup-blocked).
 */
export function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function signOutUser() {
  return signOut(auth);
}

/** 로그인 상태 변화를 구독한다. 앱 전체에서 onAuthStateChanged는 여기 한 곳에서만 부른다. */
export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
