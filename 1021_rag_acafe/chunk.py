# chunk.py — PDF를 페이지별로 읽어 작은 조각(청크)으로 나누고 chunks.json 으로 저장합니다.
import json
from pathlib import Path

from pypdf import PdfReader

PDF_PATH = Path("yeyoung_cafe_manual.pdf")
OUT_PATH = Path("chunks.json")

CHUNK_SIZE = 300  # 한 조각의 길이(글자 수)
OVERLAP = 50      # 앞 조각과 겹치는 글자 수 (문장이 중간에 잘려도 문맥이 이어지게)


def split_text(text):
    """글 하나를 CHUNK_SIZE 길이로 자르되, 매번 (CHUNK_SIZE - OVERLAP)만큼만 앞으로 가서 겹치게 합니다."""
    pieces = []
    step = CHUNK_SIZE - OVERLAP
    for start in range(0, len(text), step):
        piece = text[start:start + CHUNK_SIZE].strip()
        if piece:
            pieces.append(piece)
        if start + CHUNK_SIZE >= len(text):  # 끝까지 왔으면 멈춤 (꼬리만 남은 조각 방지)
            break
    return pieces


def main():
    reader = PdfReader(PDF_PATH)
    chunks = []

    # 페이지를 1번부터 세면서 하나씩 읽습니다.
    for page_number, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        for piece in split_text(text):
            chunks.append({
                "id": len(chunks) + 1,   # 청크 번호 (1, 2, 3 ...)
                "page": page_number,     # 몇 페이지에서 나왔는지
                "text": piece,           # 조각 내용
            })

    # 한글이 깨지지 않게 ensure_ascii=False 로 저장합니다.
    OUT_PATH.write_text(json.dumps(chunks, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"총 {len(chunks)}개의 청크가 만들어졌어요 -> {OUT_PATH}\n")
    for c in chunks[:3]:
        print(f"[청크 {c['id']}] (페이지 {c['page']}, {len(c['text'])}자)")
        print(c["text"])
        print("-" * 40)


if __name__ == "__main__":
    main()
