# app.py — Streamlit 채팅 화면. 검색·프롬프트·답변 생성은 ask.py 의 함수를 그대로 가져다 씁니다.
# 실행: streamlit run app.py
import contextlib
import io

import streamlit as st

import config
from ask import build_user_prompt, generate, retrieve

st.set_page_config(page_title="예영카페 매뉴얼 챗봇", page_icon="☕")

EXAMPLES = [
    "호수공원점 일요일 영업시간은?",
    "홀케이크 예약 취소하면 환불돼?",
    "본점 주차는 얼마야?",
]


def run_checked(func, *args):
    """ask.py / embeddings.py 는 문제가 있으면 안내문을 출력하고 종료(SystemExit)합니다.
    채팅 화면에서는 그 안내문을 잡아서 빨간 오류 상자로 보여줍니다."""
    buffer = io.StringIO()
    try:
        with contextlib.redirect_stdout(buffer):
            return func(*args)
    except SystemExit:
        st.error(buffer.getvalue() or "설정을 확인해 주세요.")
        st.stop()


# ── 사이드바 ─────────────────────────────────────────────
with st.sidebar:
    st.header("설정")
    st.write(f"🔢 **임베딩**: {config.EMBEDDING_PROVIDER}")
    st.caption(config.EMBEDDING_MODEL)
    st.write(f"✍️ **답변 AI**: {config.LLM_PROVIDER}")
    st.caption(config.LLM_MODEL)

    st.divider()
    st.subheader("예시 질문")
    clicked = None
    for i, example in enumerate(EXAMPLES):
        if st.button(example, key=f"example_{i}", use_container_width=True):
            clicked = example

# ── 본문 ─────────────────────────────────────────────────
st.title("☕ 예영카페 매뉴얼 챗봇")
st.caption("매뉴얼 PDF에 있는 내용만 근거로 답해요.")

run_checked(config.check_config)  # 키가 빠졌으면 여기서 안내하고 멈춤

# 대화 기록은 st.session_state 에 보관합니다. (화면이 다시 그려져도 유지돼요)
if "messages" not in st.session_state:
    st.session_state.messages = []


def show_sources(results):
    """답변 아래 '참고한 자료' 펼침 메뉴"""
    with st.expander("🔍 AI가 참고한 자료 보기"):
        for i, r in enumerate(results, start=1):
            st.markdown(f"**{i}. {r['page']}쪽** (유사도 {r['score']:.3f})")
            st.text(r["text"])


# 지금까지의 대화를 다시 그림
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if msg.get("sources"):
            show_sources(msg["sources"])

# 입력창에 쓴 질문 또는 사이드바 예시 버튼 중 하나가 질문이 됩니다.
question = st.chat_input("매뉴얼에 대해 궁금한 점을 물어보세요") or clicked

if question:
    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user"):
        st.markdown(question)

    with st.chat_message("assistant"):
        with st.spinner("매뉴얼을 찾아보는 중..."):
            results = run_checked(retrieve, question)                          # R: 검색
            prompt = build_user_prompt(question, results)                      # A: 증강
            try:
                answer = generate(prompt)                                      # G: 생성
            except Exception as e:
                st.error(f"답변을 만드는 중 오류가 났어요: {e}")
                st.stop()
        st.markdown(answer)
        show_sources(results)

    st.session_state.messages.append({"role": "assistant", "content": answer, "sources": results})
