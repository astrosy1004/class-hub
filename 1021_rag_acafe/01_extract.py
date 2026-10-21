# 1단계: PDF에서 텍스트를 뽑아 data/manual.txt 로 저장합니다.
from pathlib import Path
from pypdf import PdfReader

PDF_PATH = Path("yeyoung_cafe_manual.pdf")
OUT_PATH = Path("data/manual.txt")


def main():
    reader = PdfReader(PDF_PATH)
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        pages.append(f"[페이지 {i}]\n{text}")

    OUT_PATH.parent.mkdir(exist_ok=True)
    OUT_PATH.write_text("\n\n".join(pages), encoding="utf-8")
    print(f"{len(reader.pages)}페이지 추출 완료 -> {OUT_PATH}")


if __name__ == "__main__":
    main()
