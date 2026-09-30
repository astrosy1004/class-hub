// 로그인 · 로그아웃 · 로그인 상태 구독 전담 파일.
// Firebase SDK는 여기서 직접 불러오지 않고 항상 ./firebase.js를 거친다.

import {
  auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "./firebase.js?v=2";

const provider = new GoogleAuthProvider();

function log(...args) {
  console.log("[AUTH]", ...args);
}

/**
 * 구글 로그인 팝업을 연다.
 * 반드시 클릭 이벤트 처리 안에서 다른 await 없이 바로 호출해야 한다.
 * 앞에 비동기 작업이 끼면 브라우저가 팝업을 막는다(auth/popup-blocked).
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export function signInWithGoogle() {
  log("로그인 시도");
  return signInWithPopup(auth, provider);
}

export function signOutUser() {
  log("로그아웃");
  return signOut(auth);
}

/**
 * 로그인 상태 변화를 구독한다. 앱 전체에서 onAuthStateChanged는 이 함수 한 곳에서만 부른다.
 * @param {(user: import("firebase/auth").User | null) => void} callback
 * @returns {() => void} 구독 해제 함수
 */
export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, (user) => {
    log("인증 상태 변경:", user ? user.uid : null);
    callback(user);
  });
}
