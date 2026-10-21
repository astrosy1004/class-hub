# config.py — 어떤 AI를 쓸지 한 곳에서 정하는 설정 파일
# .env 파일의 값을 읽어서, 다른 파일들이 `import config` 로 가져다 씁니다.
import os
import sys

from dotenv import load_dotenv

# 윈도우 한글 콘솔(cp949)은 이모지를 못 그려서 오류가 날 수 있어요.
# 표시 못 하는 글자는 ?로 바꿔 출력하게 해서 프로그램이 멈추지 않게 합니다.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(errors="replace")

# .env 파일을 읽어서 환경변수로 등록합니다.
load_dotenv()

# ── 1. 어떤 서비스를 쓸지 고르기 ─────────────────────────
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "local").strip().lower()
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "claude").strip().lower()

# ── 2. API 키 (없으면 빈 문자열) ─────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()

# ── 3. 기본 모델 (.env에서 비워 두면 이 값을 씁니다) ──────
# 임베딩 = 글을 숫자(벡터)로 바꾸는 모델 / LLM = 답변을 쓰는 모델
DEFAULT_EMBEDDING_MODELS = {
    # 무료, 내 컴퓨터에서 실행, 한국어 포함 50개 이상 언어 지원 (처음 실행 때 약 470MB 다운로드)
    "local": "paraphrase-multilingual-MiniLM-L12-v2",
    "gemini": "gemini-embedding-001",
    "openrouter": "openai/text-embedding-3-small",
}
DEFAULT_LLM_MODELS = {
    "gemini": "gemini-3.5-flash",
    "openrouter": "anthropic/claude-sonnet-5-5",
    "claude": "claude-sonnet-5-5",
}

# 각 서비스에 필요한 키 이름 (local 임베딩은 키가 필요 없음)
KEY_NAMES = {
    "gemini": "GEMINI_API_KEY",
    "openrouter": "OPENROUTER_API_KEY",
    "claude": "ANTHROPIC_API_KEY",
}
KEY_VALUES = {
    "gemini": GEMINI_API_KEY,
    "openrouter": OPENROUTER_API_KEY,
    "claude": ANTHROPIC_API_KEY,
}


def _model(env_name, defaults, provider):
    """.env에 모델 이름이 있으면 그것을, 비어 있으면 기본 모델을 돌려줍니다."""
    return os.getenv(env_name, "").strip() or defaults.get(provider, "")


EMBEDDING_MODEL = _model("EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODELS, EMBEDDING_PROVIDER)
LLM_MODEL = _model("LLM_MODEL", DEFAULT_LLM_MODELS, LLM_PROVIDER)


def check_config(check_embedding=True, check_llm=True):
    """설정이 올바른지 검사하고, 문제가 있으면 쉬운 한국어로 알려준 뒤 종료합니다.
    ingest.py 처럼 임베딩만 쓰는 단계는 check_llm=False 로 LLM 키 검사를 건너뜁니다."""
    problems = []

    if not check_embedding:
        pass
    elif EMBEDDING_PROVIDER not in DEFAULT_EMBEDDING_MODELS:
        problems.append(
            f"EMBEDDING_PROVIDER 값 '{EMBEDDING_PROVIDER}' 은(는) 사용할 수 없어요.\n"
            "   → local, gemini, openrouter 중 하나로 적어 주세요."
        )
    elif EMBEDDING_PROVIDER != "local" and not KEY_VALUES[EMBEDDING_PROVIDER]:
        problems.append(
            f"임베딩에 {EMBEDDING_PROVIDER}를 쓰려면 {KEY_NAMES[EMBEDDING_PROVIDER]} 가 필요한데 비어 있어요.\n"
            "   → .env 파일에 키를 적어 주세요. (키가 없다면 EMBEDDING_PROVIDER=local 로 바꾸면 무료예요)"
        )

    if not check_llm:
        pass
    elif LLM_PROVIDER not in DEFAULT_LLM_MODELS:
        problems.append(
            f"LLM_PROVIDER 값 '{LLM_PROVIDER}' 은(는) 사용할 수 없어요.\n"
            "   → gemini, openrouter, claude 중 하나로 적어 주세요."
        )
    elif not KEY_VALUES[LLM_PROVIDER]:
        problems.append(
            f"답변에 {LLM_PROVIDER}를 쓰려면 {KEY_NAMES[LLM_PROVIDER]} 가 필요한데 비어 있어요.\n"
            "   → .env 파일에 키를 적어 주세요."
        )

    if problems:
        print("⚠ 설정을 확인해 주세요:\n")
        print("\n\n".join(f"{i}. {p}" for i, p in enumerate(problems, start=1)))
        print("\n(.env 파일이 없다면 .env.example 을 복사해서 .env 로 만드세요)")
        sys.exit(1)


if __name__ == "__main__":
    # `python config.py` 로 현재 설정을 확인할 수 있어요. (키 값은 보여주지 않습니다)
    print(f"임베딩: {EMBEDDING_PROVIDER} / {EMBEDDING_MODEL}")
    print(f"LLM   : {LLM_PROVIDER} / {LLM_MODEL}")
    check_config()
    print("설정이 올바릅니다 ✅")
