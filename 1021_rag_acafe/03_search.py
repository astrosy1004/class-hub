# 3단계: 질문과 가장 비슷한 청크를 찾습니다. (검색 = RAG의 R)
# 한국어는 띄어쓰기만으로 단어를 나누기 어려워서, 글자 2~3개 단위(n-gram)로 비교합니다.
import json
import sys
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

CHUNKS_PATH = Path("data/chunks.json")


def load_chunks():
    return json.loads(CHUNKS_PATH.read_text(encoding="utf-8"))


def search(question, top_k=3):
    chunks = load_chunks()
    vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 3))
    chunk_vectors = vectorizer.fit_transform([c["text"] for c in chunks])
    question_vector = vectorizer.transform([question])

    scores = cosine_similarity(question_vector, chunk_vectors)[0]
    best = scores.argsort()[::-1][:top_k]
    return [{**chunks[i], "score": float(scores[i])} for i in best]


if __name__ == "__main__":
    q = " ".join(sys.argv[1:]) or "마감할 때 해야 할 일은?"
    for r in search(q):
        print(f"--- (페이지 {r['page']}, 점수 {r['score']:.2f})")
        print(r["text"])
