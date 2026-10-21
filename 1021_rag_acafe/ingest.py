# ingest.py — chunks.json 의 청크들을 벡터로 바꿔 Chroma(벡터DB)에 저장합니다.
# 먼저 chunk.py 를 실행해서 chunks.json 을 만들어 두세요.
import json
import sys
from pathlib import Path

import chromadb

import config
from embeddings import COLLECTION_NAME, DB_PATH, current_signature, embed_texts

CHUNKS_PATH = Path("chunks.json")


def main():
    # 임베딩에 필요한 설정(키 등)이 맞는지 먼저 검사합니다. (LLM 키는 아직 필요 없어요)
    config.check_config(check_llm=False)

    if not CHUNKS_PATH.exists():
        print("⚠ chunks.json 이 없어요. 먼저 chunk.py 를 실행하세요.")
        sys.exit(1)
    chunks = json.loads(CHUNKS_PATH.read_text(encoding="utf-8"))

    print(f"임베딩: {current_signature()}")
    print(f"청크 {len(chunks)}개를 벡터로 바꾸는 중... (local은 처음에 모델을 내려받아 오래 걸릴 수 있어요)")
    vectors = embed_texts([c["text"] for c in chunks])

    client = chromadb.PersistentClient(path=DB_PATH)

    # 중복 방지: 같은 이름의 컬렉션이 이미 있으면 지우고 새로 만듭니다.
    # (다시 실행해도 항상 chunks.json 과 똑같은 내용만 남아요)
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass  # 처음 실행이라 지울 게 없는 경우

    collection = client.create_collection(
        name=COLLECTION_NAME,
        # 어떤 임베딩으로 저장했는지 기록 → 나중에 다른 임베딩으로 검색하면 알려줄 수 있어요.
        metadata={
            "embedding_signature": current_signature(),
            "hnsw:space": "cosine",  # 벡터 사이의 "비슷함"을 각도(코사인)로 계산
        },
    )

    collection.add(
        ids=[str(c["id"]) for c in chunks],
        documents=[c["text"] for c in chunks],
        embeddings=vectors,
        metadatas=[{"page": c["page"]} for c in chunks],  # 페이지 번호도 함께 저장
    )

    print(f"\n✅ {collection.count()}개 저장 완료 -> {DB_PATH}")
    print(f"첫 번째 청크의 벡터 (총 {len(vectors[0])}개 숫자 중 앞 5개):")
    print([round(x, 4) for x in vectors[0][:5]])


if __name__ == "__main__":
    main()
