# 나의 뉴스 모음

매일 확인하는 뉴스와 정보 사이트를 분야별로 모아둔 개인 뉴스 페이지입니다.

## 구성

- `index.html`: 웹사이트 본문
- `assets/styles.css`: 디자인 스타일 (CSS 변수 + 다크 모드)
- `assets/app.js`: 뉴스 사이트 데이터, 왼쪽 메뉴, 검색, 다크 모드
- `.nojekyll`: GitHub Pages 배포용

## 수정 방법

분야와 사이트 목록은 `assets/app.js` 최상단의 두 배열에서 수정합니다.

- `categories`: 왼쪽 메뉴에 표시할 분야 (`id`, `title`, `meta`, `icon`)
- `newsSites`: 카드로 표시할 사이트 (`category`, `title`, `url`, `icon`, `description`)

`newsSites`의 `category` 값은 `categories`의 `id` 와 같아야 합니다.
색상은 `assets/styles.css` 의 `:root` / `[data-theme="dark"]` CSS 변수에서 바꿉니다.

## 로컬 확인

`index.html` 파일을 브라우저로 열면 바로 확인할 수 있습니다.

## 배포

`main` 브랜치에 커밋 후 push 하면 GitHub Pages에 반영됩니다.
주소: `https://astrosy1004.github.io/class-hub/0905-mynews/`
