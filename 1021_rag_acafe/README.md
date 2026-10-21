# ☕ 예영카페 매뉴얼 RAG 챗봇

`yeyoung_cafe_manual.pdf`를 근거로 질문에 답하는 RAG 실습 프로젝트입니다.

**RAG** = 검색(**R**etrieval) → 프롬프트에 자료 붙이기(**A**ugmented) → 답변 생성(**G**eneration).
AI가 외운 지식이 아니라 **내 문서**를 근거로 답하게 만드는 방법이에요.

## 구성

| 파일 | 하는 일 |
|---|---|
| `config.py` | `.env`를 읽어 사용할 AI·모델·키를 정함 (빠진 키는 한국어로 안내) |
| `chunk.py` | PDF → 300자 조각(50자 겹침) → `chunks.json` |
| `ingest.py` | 조각을 벡터로 바꿔 `chroma_db/`에 저장 (다시 실행해도 중복 없음) |
| `embeddings.py` | 임베딩 함수와 DB 연결 (저장할 때와 다른 임베딩이면 경고) |
| `ask.py` | 터미널 질문 → 검색 → 답변 |
| `app.py` | Streamlit 채팅 화면 (`ask.py`의 함수를 재사용) |

## 실행 방법 (Windows PowerShell)

### 1. 처음 한 번: 준비
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

### 2. `.env` 설정
```
EMBEDDING_PROVIDER=local        # 무료, 내 컴퓨터에서 실행
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...    # 본인 키 입력
```
`EMBEDDING_MODEL`, `LLM_MODEL`은 비워 두면 `config.py`의 기본 모델을 씁니다.
`python config.py`로 설정이 맞는지 확인할 수 있어요.

### 3. 데이터 준비 (처음 한 번, PDF나 임베딩을 바꿀 때마다)
```powershell
python chunk.py      # PDF -> chunks.json
python ingest.py     # chunks.json -> chroma_db
```
`local` 임베딩은 처음 실행할 때 모델(약 470MB)을 내려받아 시간이 걸립니다.

### 4. 질문하기
```powershell
# 터미널
python ask.py "호수공원점 일요일 영업시간은?"

# 채팅 화면 (브라우저가 열립니다)
streamlit run app.py
```

## 자주 겪는 문제
- **"ingest.py를 다시 실행하세요"** — `.env`의 임베딩을 바꾸면 기존 DB와 맞지 않아요. `python ingest.py`를 다시 실행하세요.
- **"…KEY가 비어 있어요"** — `.env`에 해당 키를 적었는지 확인하세요.
- **한글이 깨져 보일 때** — `$env:PYTHONUTF8 = 1` 입력 후 다시 실행하세요.

## 참고
`01_extract.py` ~ `04_ask.py`는 처음에 만든 간단한 버전(TF-IDF 검색)이고, 위 구성과는 별개로 동작합니다.
