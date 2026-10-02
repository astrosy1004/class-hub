# 나의 북마크

자주 쓰는 AI 도구와 **내가 만든 프로그램**을 한곳에 모아둔 개인 북마크 페이지입니다.
원티드(wanted.co.kr) 첫 화면 스타일입니다: 흰 헤더와 헤더 아래로 펼쳐지는 검색창, 아이콘 빠른 메뉴, 가로로 넘기는 카드 줄(내 프로그램 · 수업 바로가기), 밑줄 탭 북마크 목록.

## 구성

- `index.html`: 헤더(메뉴 · 검색창) · 빠른 메뉴 · 내가 만든 프로그램 · 수업 바로가기 · 전체 북마크 · 등록 대화상자
- `assets/styles.css`: 디자인 스타일 (색상은 `:root` 변수, 다크 모드는 `[data-theme="dark"]`, 글꼴은 Pretendard CDN)
- `assets/logo.svg`: 로고 겸 파비콘 (인성(印星)이 많은 나: 펼친 책 · 북마크 리본 · 印 도장)
- `assets/app.js`: 데이터 배열과 화면 그리기, 메뉴, 검색, 프로그램 등록, 다크 모드
- `assets/bookmark-hero.png`: 예전 디자인의 상단 이미지 (현재는 사용하지 않음)

## 수정 방법

`assets/app.js` 상단의 데이터 배열을 고칩니다.

- `categories`: 북마크 카테고리. `tone` 은 아이콘 색
- `programs`: 기본으로 보이는 **내가 만든 프로그램** 목록
  - `type`: `webapp` · `game` · `plan` · `portfolio` · `landing` · `etc`
  - `status`: `live`(배포됨) · `local`(로컬 확인) · `draft`(기획 중)
  - `url`: `https://…` 주소 또는 이 폴더 기준 상대 경로(`../game01/index.html`)
  - `features`: 주요 기능 목록, `tags`: 태그 목록
- `bookmarks`: 북마크 링크. `secretLabel` / `secretValue` 를 넣으면 복사 버튼이 생깁니다.

## 화면에서 프로그램 등록

헤더의 **프로그램 등록** 버튼이나 카드 줄 끝의 **새 프로그램 등록** 카드로 이름 · 주소 · 소개 · 분류 · 상태 · 아이콘 · 색상 · 기능 · 태그를 입력하면 카드가 추가됩니다.

- 화면에서 등록한 항목은 **이 브라우저(localStorage, 키 `bookmarkPrograms`)에만** 저장됩니다. 직접 등록한 카드만 수정 · 삭제할 수 있습니다.
- 다른 기기나 배포 사이트에도 보이게 하려면 **JSON 내보내기**로 복사한 내용을 `app.js` 의 `programs` 배열에 붙여 넣고 커밋하세요.

## 로컬 확인

`index.html` 파일을 브라우저로 열면 바로 확인할 수 있습니다.

## GitHub Pages 배포

`main` 브랜치에 커밋 후 push 하면 https://astrosy1004.github.io/class-hub/bookmark/ 에 반영됩니다.
