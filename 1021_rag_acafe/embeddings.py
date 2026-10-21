# embeddings.py — 글을 숫자(벡터)로 바꾸는 함수와 Chroma 연결을 모아 둔 파일
# ingest.py(저장)와 이후의 검색 단계가 같은 코드를 쓰도록 분리했습니다.
import sys
from functools import lru_cache

import chromadb

import config

DB_PATH = "./chroma_db"          # 벡터DB가 저장되는 폴더
COLLECTION_NAME = "cafe_manual"  # DB 안의 "테이블 이름" 같은 것
BATCH_SIZE = 32                  # 한 번에 AI에게 보내는 글 개수


@lru_cache(maxsize=1)
def _load_local_encoder(model):
    """local 모델은 불러오는 데 오래 걸리므로 한 번만 불러서 재사용합니다. (채팅 화면에서 중요해요)"""
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(model)


def embed_texts(texts):
    """글 목록을 받아 벡터 목록(숫자 리스트들)으로 바꿔 돌려줍니다."""
    provider = config.EMBEDDING_PROVIDER
    model = config.EMBEDDING_MODEL
    vectors = []

    if provider == "local":
        # 내 컴퓨터에서 실행. 처음에는 모델 파일을 내려받느라 시간이 걸려요.
        encoder = _load_local_encoder(model)
        return encoder.encode(texts, show_progress_bar=False).tolist()

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        if provider == "gemini":
            from google import genai
            client = genai.Client(api_key=config.GEMINI_API_KEY)
            result = client.models.embed_content(model=model, contents=batch)
            vectors += [e.values for e in result.embeddings]
        elif provider == "openrouter":
            # OpenRouter는 OpenAI와 같은 방식이라 openai 라이브러리를 그대로 씁니다.
            from openai import OpenAI
            client = OpenAI(api_key=config.OPENROUTER_API_KEY,
                            base_url="https://openrouter.ai/api/v1")
            result = client.embeddings.create(model=model, input=batch)
            vectors += [d.embedding for d in result.data]
    return vectors


def current_signature():
    """지금 설정된 임베딩을 한 줄로 표현한 이름. 예: 'local/paraphrase-...'"""
    return f"{config.EMBEDDING_PROVIDER}/{config.EMBEDDING_MODEL}"


def open_collection_for_search():
    """검색용으로 DB를 엽니다. 저장할 때 쓴 임베딩과 지금 설정이 다르면 안내 후 종료합니다."""
    client = chromadb.PersistentClient(path=DB_PATH)
    try:
        collection = client.get_collection(COLLECTION_NAME)
    except Exception:
        print("⚠ 아직 저장된 데이터가 없어요. 먼저 ingest.py 를 실행하세요.")
        sys.exit(1)

    saved = collection.metadata.get("embedding_signature")
    if saved != current_signature():
        print("⚠ DB를 만들 때 쓴 임베딩과 지금 설정이 달라요.")
        print(f"   DB에 저장된 임베딩: {saved}")
        print(f"   지금 설정(.env)   : {current_signature()}")
        print("   → 임베딩이 다르면 검색이 맞지 않아요. ingest.py 를 다시 실행하세요.")
        sys.exit(1)
    return collection
