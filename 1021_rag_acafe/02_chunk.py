# 2단계: 긴 텍스트를 작은 조각(청크)으로 잘라 data/chunks.json 으로 저장합니다.
# 왜 자를까? 질문과 관련된 "부분"만 찾아서 AI에게 주기 위해서입니다.
import json
import re
from pathlib import Path

IN_PATH = Path("data/manual.txt")
OUT_PATH = Path("data/chunks.json")

CHUNK_SIZE = 400  # 한 조각의 최대 글자 수
OVERLAP = 80      # 앞 조각과 겹치는 글자 수 (문맥이 끊기지 않게)


def split_text(text, page):
    chunks = []
    start = 0
    while start < len(text):
        piece = text[start:start + CHUNK_SIZE].strip()
        if piece:
            chunks.append({"page": page, "text": piece})
        start += CHUNK_SIZE - OVERLAP
    return chunks


def main():
    raw = IN_PATH.read_text(encoding="utf-8")
    # "[페이지 N]" 표시 기준으로 페이지별로 나눈다
    parts = re.split(r"\[페이지 (\d+)\]\n", raw)
    chunks = []
    for i in range(1, len(parts), 2):
        page = int(parts[i])
        chunks += split_text(parts[i + 1], page)

    OUT_PATH.write_text(json.dumps(chunks, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"청크 {len(chunks)}개 생성 -> {OUT_PATH}")


if __name__ == "__main__":
    main()
