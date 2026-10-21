# ask.py — 터미널에서 질문하면 매뉴얼을 근거로 답해 주는 RAG 프로그램
# 사용법: python ask.py "호수공원점 일요일 영업시간은?"   (질문 없이 실행하면 계속 물어볼 수 있어요)
import sys

import config
from embeddings import embed_texts, open_collection_for_search

TOP_K = 3  # 가져올 청크 개수

# AI에게 지킬 규칙을 알려주는 글 (시스템 프롬프트)
SYSTEM_PROMPT = (
    "당신은 예영카페 매뉴얼 안내 도우미입니다. 다음 규칙을 반드시 지키세요.\n"
    "1. 반드시 [자료] 안의 내용만 근거로 답하세요. 자료 밖의 지식이나 추측은 쓰지 마세요.\n"
    "2. 자료에 답이 없으면 '매뉴얼에서 찾을 수 없는 내용입니다'라고만 답하세요.\n"
    "3. 답변은 한국어로 간결하게 쓰세요.\n"
    "4. 답을 찾았다면 답변 맨 끝에 근거가 된 페이지 번호를 '📍 출처: n쪽' 형식으로 적으세요. "
    "여러 쪽이면 '📍 출처: 2쪽, 6쪽'처럼 적으세요."
)


# ── R: 검색 ──────────────────────────────────────────────
def retrieve(question):
    """질문을 벡터로 바꾸고, DB에서 가장 비슷한 청크 TOP_K개를 찾습니다."""
    collection = open_collection_for_search()  # 임베딩이 다르면 여기서 안내 후 종료
    question_vector = embed_texts([question])[0]
    found = collection.query(query_embeddings=[question_vector], n_results=TOP_K)

    results = []
    for text, meta, dist in zip(found["documents"][0], found["metadatas"][0], found["distances"][0]):
        # Chroma는 "거리"를 돌려줍니다(작을수록 비슷). 1 에서 빼서 "유사도"(클수록 비슷)로 바꿔요.
        results.append({"page": meta["page"], "score": 1 - dist, "text": text})
    return results


# ── A: 증강 ──────────────────────────────────────────────
def build_user_prompt(question, results):
    """찾은 청크를 질문과 함께 하나의 프롬프트로 묶습니다."""
    material = "\n\n".join(f"(페이지 {r['page']})\n{r['text']}" for r in results)
    return f"[자료]\n{material}\n\n[질문]\n{question}"


# ── G: 생성 ──────────────────────────────────────────────
def generate(user_prompt):
    """선택한 LLM_PROVIDER 로 답변을 만듭니다."""
    provider, model = config.LLM_PROVIDER, config.LLM_MODEL

    if provider == "claude":
        import anthropic
        client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        reply = client.messages.create(
            model=model,
            max_tokens=800,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return reply.content[0].text

    if provider == "gemini":
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=config.GEMINI_API_KEY)
        reply = client.models.generate_content(
            model=model,
            contents=user_prompt,
            config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
        )
        return reply.text

    # openrouter (OpenAI 방식 그대로 사용)
    from openai import OpenAI
    client = OpenAI(api_key=config.OPENROUTER_API_KEY, base_url="https://openrouter.ai/api/v1")
    reply = client.chat.completions.create(
        model=model,
        max_tokens=800,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    return reply.choices[0].message.content


def ask(question):
    print(f"🔢 임베딩: {config.EMBEDDING_PROVIDER} / ✍️ 답변 AI: {config.LLM_PROVIDER}({config.LLM_MODEL})\n")

    results = retrieve(question)
    print(f"[검색된 청크 {len(results)}개]")
    for i, r in enumerate(results, start=1):
        preview = r["text"].replace("\n", " ")[:60]
        print(f"  {i}. {r['page']}쪽 | 유사도 {r['score']:.3f} | {preview}...")

    try:
        answer = generate(build_user_prompt(question, results))
    except Exception as e:
        # 키가 틀렸거나 네트워크 문제일 때, 긴 오류 대신 쉬운 안내를 보여줍니다.
        print("\n⚠ 답변을 만들지 못했어요.")
        if "401" in str(e) or "authentication" in str(e).lower() or "API key" in str(e):
            print(f"   → {config.KEY_NAMES[config.LLM_PROVIDER]} 가 올바르지 않은 것 같아요. .env 의 키를 다시 확인하세요.")
        else:
            print(f"   → {e}")
        sys.exit(1)
    print("\n[최종 답변]")
    print(answer)


if __name__ == "__main__":
    config.check_config()  # 키가 빠졌으면 어떤 키인지 한국어로 안내
    if len(sys.argv) > 1:
        ask(" ".join(sys.argv[1:]))
    else:
        while True:
            q = input("\n질문 (끝내려면 엔터) > ").strip()
            if not q:
                break
            ask(q)
