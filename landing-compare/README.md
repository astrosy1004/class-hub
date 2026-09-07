# landing-compare

물류 SaaS 랜딩 페이지 두 종과, 그 둘을 비교하는 페이지 한 종을 담은 정적 사이트입니다.
서로 다른 브리프로 같은 종류의 제품(창고/물류 SaaS) 랜딩을 만들었을 때 배경색·서체·여백 등이 어떻게 갈라지는지 보여 줍니다.

## 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 비교 페이지. 두 결과물 링크 + 여섯 가지 축(배경색·강조색·서체·여백·레이아웃·모션)별 차이와 그 이유 |
| `loop.html` | 브리프 1 — "물류 SaaS 랜딩 페이지. 깔끔하고 모던하게." 결과물. 파렛트 풀링 플랫폼 **루프(LOOP)** |
| `palletto.html` | 브리프 2 — 창고 관리자가 하루 6시간+ 보는 사내 대시보드(신뢰감·저피로·다크 우선·고밀도) 결과물 **Palletto** |

## 로컬 확인

각 `.html` 파일을 브라우저로 직접 엽니다. 빌드 과정이 없습니다.
글꼴은 Google Fonts에서 불러오므로 확인 시 인터넷 연결이 필요합니다.

## 배포

`main`에 push 하면 GitHub Pages에 반영됩니다.

- 비교 페이지: `/class-hub/landing-compare/`
- 루프: `/class-hub/landing-compare/loop.html`
- Palletto: `/class-hub/landing-compare/palletto.html`

## 수정 방법

- 세 파일 모두 순수 HTML + 인라인 CSS/JS 단일 파일입니다. 번들러·패키지 없음.
- 색상은 각 파일 상단 `<style>`의 `:root` CSS 변수에서 조정합니다.
- 다크 모드는 `document.documentElement`의 `data-theme` 속성 + `localStorage`(키: `loopTheme` / `pallettoTheme` / `compareTheme`)로 저장합니다.
- `loop.html`은 라이트 기본 + 다크 토글, `palletto.html`은 다크 기본 + 라이트 토글입니다.
