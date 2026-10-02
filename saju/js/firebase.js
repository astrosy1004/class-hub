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
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Firebase 콘솔 → 프로젝트 설정 → 내 앱(saju-app)에서 받은 값.
// apiKey는 비밀번호가 아니라 프로젝트 식별 정보라 코드에 넣어도 된다. 데이터 보호는 firestore.rules가 맡는다.
const firebaseConfig = {
  apiKey: "AIzaSyB12diOVXr6GAEPAy9dTfZo6KwkNwgcEA0",
  authDomain: "saju-app-sykim.firebaseapp.com",
  projectId: "saju-app-sykim",
  storageBucket: "saju-app-sykim.firebasestorage.app",
  messagingSenderId: "642552513638",
  appId: "1:642552513638:web:60e11a4a3ade417f0019a7",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged };
export { doc, setDoc, deleteDoc, serverTimestamp, collection, query, orderBy, onSnapshot };
