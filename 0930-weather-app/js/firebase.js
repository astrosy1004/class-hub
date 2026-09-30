// Firebase SDK를 CDN에서 불러오는 유일한 파일.
// SDK 버전을 올리거나 프로젝트를 바꿀 때 이 파일만 고치면 된다.
// 다른 파일은 이 파일이 다시 내보내는(re-export) 것만 가져다 쓴다.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Firebase 콘솔 → 프로젝트 설정 → 내 앱에서 복사한 값.
// apiKey는 비밀번호가 아니라 프로젝트 식별 정보라 코드에 넣어도 된다.
const firebaseConfig = {
  apiKey: "AIzaSyApl7vmISGc9vD2ftLTkRlPc9u-U1RSOlI",
  authDomain: "weath-app-sykim.firebaseapp.com",
  projectId: "weath-app-sykim",
  storageBucket: "weath-app-sykim.firebasestorage.app",
  messagingSenderId: "550979738633",
  appId: "1:550979738633:web:bb43b5d5f1b85a9cdaacd8",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 3단계에서 db(Firestore)가 여기 추가될 예정이다.
export { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged };
