// Firebase SDK(CDN) 불러오기 전담. 필요할 때 한 번만 비동기로 불러와서, CDN 이 막혀도 앱의 나머지 기능은 그대로 동작한다.
// 다른 파일은 SDK 를 직접 import 하지 않고 loadFirebase() 만 쓴다. (SDK 버전을 올릴 때는 이 파일만 고친다)
import { CONFIG } from "./config.js";

const VERSION = "12.19.0";
const url = (name) => `https://www.gstatic.com/firebasejs/${VERSION}/firebase-${name}.js`;
let loading = null;

export function loadFirebase() {
  if (!loading) {
    loading = (async () => {
      const [appM, authM, fsM] = await Promise.all([import(url("app")), import(url("auth")), import(url("firestore"))]);
      const app = appM.initializeApp(CONFIG.FIREBASE);
      return { ...authM, ...fsM, auth: authM.getAuth(app), db: fsM.getFirestore(app) };
    })();
    loading.catch(() => { loading = null; }); // 실패하면 다음 시도에서 다시 불러온다
  }
  return loading;
}
