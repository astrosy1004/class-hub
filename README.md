# 클래스 허브 (Class Hub)

개인 수업용 링크 모음 정적 사이트입니다. 상단 상위 메뉴 3개와 하단 하위 메뉴로
ICT 수업 자료 · 생성형 AI 서비스 · 정보사이트를 한곳에서 오갈 수 있습니다.

## 파일 구성

| 파일 | 역할 |
| --- | --- |
| `index.html` | 마크업 골격 (상단 바 / 본문 / 하단 바) |
| `styles.css` | 디자인 · 라이트/다크 테마 · 반응형 |
| `script.js` | 콘텐츠 데이터 + 메뉴/카드 렌더링 + 스크롤 이동 + 테마 전환 |
| `.nojekyll` | GitHub Pages의 Jekyll 처리 비활성화 |

모든 리소스는 상대 경로(`styles.css`, `script.js`)로 연결되어 있어
저장소 루트에 그대로 두면 GitHub Pages에서 바로 동작합니다.
(Google Fonts만 외부에서 불러옵니다.)

## 로컬에서 확인하기

가장 간단한 방법 — `index.html`을 브라우저로 바로 열기:

```powershell
start index.html
```

또는 로컬 서버로 띄우기(권장, 해시 라우팅·폰트 캐시가 더 자연스럽게 동작):

```powershell
# Python 3
python -m http.server 5500
# 브라우저에서 http://localhost:5500 접속
```

## GitHub Pages 배포

1. 이 폴더를 GitHub 저장소 루트로 커밋/푸시합니다. (`index.html`이 루트에 있어야 함)
   ```powershell
   git init
   git add .
   git commit -m "클래스 허브 정적 사이트"
   git branch -M main
   git remote add origin https://github.com/<사용자>/<저장소>.git
   git push -u origin main
   ```
2. GitHub 저장소 → **Settings → Pages**
3. **Build and deployment → Source**를 `Deploy from a branch`로 설정
4. Branch를 `main` / 폴더를 `/ (root)`로 지정하고 저장
5. 잠시 후 `https://<사용자>.github.io/<저장소>/` 에서 확인

## 콘텐츠 수정 방법

`script.js` 상단의 `CATEGORIES` 배열만 편집하면 됩니다.

- 상위 메뉴 = `CATEGORIES` 항목 (`id`, `label`, `title`, `desc`)
- 하위 메뉴 = 각 항목의 `sections` (`id`, `label`)
- 링크 카드 = 각 `section`의 `links`
  - `url`이 없으면(`null`) 클릭 불가 카드로 표시됩니다. (예: 퍼블릭시트)
  - `desc`는 선택 항목입니다. 없으면 제목 + "바로가기"만 표시됩니다.

## 디자인 메모 (Apple 스타일)

- 톤: 크롬은 물러나고 콘텐츠가 주인공. 섹션 구분은 테두리/그림자가 아니라
  밝은(`--canvas`) ↔ 파치먼트(`--parchment`) 타일의 **면 전환**으로 처리(edge-to-edge).
- 인터랙션 색은 **Action Blue 하나** — 라이트 `#0066cc`, 다크 `#2997ff`.
  링크·CTA·포커스 링이 모두 이 색. 두 번째 강조색은 쓰지 않음.
- 카테고리 식별: 제목 옆 작은 점(`--dot`)만 카테고리색 유지
  (ICT `#1584A3` · 생성형 AI `#FF6A45` · 정보사이트 `#3C9A62`), `body[data-category]`로 전환.
- 폰트: `-apple-system` → `Inter` → `Noto Sans KR` 순 (Apple 기기에서는 실제 SF Pro로 해석).
  디스플레이 텍스트는 음수 자간(`letter-spacing`)으로 "Apple tight" 느낌.
- 그림자 없음. 버튼/카드 눌림 상태만 `transform: scale(0.95)`.
- 상단 바: 항상 검정 글로벌 내비 `position: sticky; top` (높이 48px).
- 하단 바: 파치먼트 프로스티드(`backdrop-filter: saturate(180%) blur(20px)`) 서브 내비
  `position: sticky; bottom` (높이 52px), 왼쪽 카테고리명 + 오른쪽 섹션 링크.
- 테마: 시스템 설정 자동 반영 + 우측 상단 버튼으로 수동 전환(선택값은 `localStorage`에 저장).
