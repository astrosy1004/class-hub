// 외부 서비스 설정값. 비어 있으면 예시(표본) 모드로 동작한다.
// Kakao JS 키는 브라우저에 보이는 값이므로 Kakao Developers 에서 "허용 도메인"으로 제한한다.
// 서울 열린데이터광장 인증키는 여기 넣지 않는다 (GitHub Secrets 에만 보관, 수집기가 사용).
export const CONFIG = {
  KAKAO_JS_KEY: "970ae30d16ffcda61e57991d8958886a", // 예: "abcd1234..." (Kakao Developers > 앱 > JavaScript 키)
  // 생활인구는 Firestore 의 livingPop/{행정동8자리} 요약 문서를 읽는다 (매일 GitHub Actions 수집기가 갱신). projectId 가 비어 있으면 개발용 예시 표본 모드.
  // Firebase 웹 API 키는 공개용 값이다 (접근은 firestore.rules 로 제한).
  FIREBASE: { projectId: "location-app-sykim", apiKey: "AIzaSyD1l3o2Dib_hCUHLUzxtmSWfIgQjRO8pZM" },
  LIVE_POP: true, // 수집기를 한 번 실행해 Firestore 에 요약이 생기면 true 로 바꾼다 (false 면 개발용 예시 표본)
  RADIUS_M: 500, // 경쟁 점포 분석 반경
  SAMPLE_URL: "./data/sample-gu.json",
};
