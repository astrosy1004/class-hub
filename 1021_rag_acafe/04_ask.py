# 4단계: 찾은 청크 + 질문을 Claude에게 보내 답을 만듭니다. (생성 = RAG의 G)
# 사용법: python 04_ask.py "질문"   (질문 없이 실행하면 계속 물어볼 수 있어요)
import os
import sys

import anthropic

from importlib import import_module

search = import_module("03_search").search

MODEL = "claude-haiku-5-5"


def build_prompt(question, results):
    context = "\n\n".join(f"[페이지 {r['page']}]\n{r['text']}" for r in results)
    return (
        "아래 '매뉴얼 발췌'만 근거로 질문에 한국어로 답하세요.\n"
        "발췌에 답이 없으면 '매뉴얼에서 찾을 수 없어요'라고 말하세요.\n\n"
        f"# 매뉴얼 발췌\n{context}\n\n# 질문\n{question}"
    )


def ask(question):
    results = search(question, top_k=3)

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("(ANTHROPIC_API_KEY가 없어 AI 답변 대신 검색된 매뉴얼 내용만 보여드려요)\n")
        for r in results:
            print(f"--- 페이지 {r['page']} (유사도 {r['score']:.2f})\n{r['text']}\n")
        return

    client = anthropic.Anthropic()
    reply = client.messages.create(
        model=MODEL,
        max_tokens=800,
        messages=[{"role": "user", "content": build_prompt(question, results)}],
    )
    print(reply.content[0].text)
    print("\n근거 페이지:", ", ".join(str(r["page"]) for r in results))


if __name__ == "__main__":
    if len(sys.argv) > 1:
        ask(" ".join(sys.argv[1:]))
    else:
        while True:
            q = input("\n질문 (종료: 엔터만) > ").strip()
            if not q:
                break
            ask(q)
