# 나만의 AI 채팅 (mychat/)

내 OpenAI API 키로 쓰는 개인 채팅 페이지입니다. 서버 없이 브라우저에서 OpenAI API를 직접 호출합니다.

## 기능

- **채팅**: 답변이 실시간으로 한 글자씩 나타나는 스트리밍, 생성 중지 버튼
- **음성 입력 (STT)**: 🎙 버튼 → 말하기 → 다시 누르면 글자로 변환 (`/v1/audio/transcriptions`)
- **음성 읽기 (TTS)**: 답변마다 🔊 듣기 버튼, 설정에서 "자동으로 읽기"를 켜면 음성 대화처럼 사용 (`/v1/audio/speech`)
- 대화 목록 저장·삭제, 시스템 프롬프트(말투) 설정, 모델·목소리·속도 선택, 다크 모드

## 구성

```
mychat/
  index.html         화면 구조 (사이드바, 채팅창, 설정 창)
  assets/styles.css  디자인 (:root CSS 변수, [data-theme="dark"] 다크 모드)
  assets/app.js      최상단 배열: 모델·목소리·예시 질문·기본 설정 / 아래: 동작 코드
  assets/logo.svg    아이콘
  .nojekyll          GitHub Pages용
```

## 사용 방법

1. `index.html`을 브라우저(Chrome/Edge 권장)로 엽니다.
2. 처음 열리는 설정 창에 OpenAI API 키(`sk-...`)를 넣고 저장합니다.
   키 발급: https://platform.openai.com/api-keys
3. 글자로 입력하거나 🎙 버튼으로 말해 보세요.

## 수정 방법

- 모델 목록, 목소리 목록, 예시 질문, 기본값은 `assets/app.js` 맨 위 배열/객체만 고치면 됩니다.
- 색상은 `assets/styles.css`의 `:root` 변수를 바꿉니다.

## 주의

- API 키는 **이 브라우저의 localStorage에만** 저장되며 코드나 저장소에는 들어가지 않습니다.
  다만 공용 PC에서는 사용 후 설정에서 키를 지워 주세요.
- 마이크는 `https://`(GitHub Pages) 또는 `file://`·`localhost`에서만 동작합니다. 처음 한 번 마이크 권한을 허용해야 합니다.
- 사용한 만큼 OpenAI 계정에 요금이 청구됩니다. 사용량은 https://platform.openai.com/usage 에서 확인하세요.
