"""Noto Sans KR 글꼴 줄이기 (앱 크기 줄이기용). 글꼴을 바꾸거나 글자를 더할 때만 다시 돌린다.

    pip install fonttools
    python scripts/subset_fonts.py

원본은 @expo-google-fonts/noto-sans-kr 패키지의 ttf. 결과는 assets/fonts/*-subset.ttf
남기는 글자: 영문·숫자·기호, 한글 호환 자모(입력 중 글자), KS X 1001 완성형 한글 2350자.
"""

import os

from fontTools import subset
from fontTools.ttLib import TTFont

SRC = "node_modules/@expo-google-fonts/noto-sans-kr"
WEIGHTS = ["400Regular", "700Bold", "900Black"]


def charset() -> set[int]:
    chars = set(range(0x20, 0x7F)) | set(range(0xA0, 0x100))
    chars |= set(range(0x2010, 0x2028)) | set(range(0x2190, 0x2194))
    chars |= {0x203B, 0x2022, 0x2026, 0x00B7, 0x2116} | set(range(0x2460, 0x2465))
    chars |= set(range(0x3131, 0x318F))  # 호환 자모
    chars |= set(range(0x3000, 0x3004)) | set(range(0x3008, 0x3012))  # 「」 같은 괄호
    for hi in range(0xB0, 0xC9):  # KS X 1001 완성형 한글
        for lo in range(0xA1, 0xFF):
            try:
                chars.add(ord(bytes([hi, lo]).decode("euc-kr")))
            except UnicodeDecodeError:
                pass
    return chars


def main() -> None:
    chars = charset()
    os.makedirs("assets/fonts", exist_ok=True)
    for w in WEIGHTS:
        font = TTFont(f"{SRC}/{w}/NotoSansKR_{w}.ttf")
        opt = subset.Options()
        opt.layout_features = ["*"]
        opt.name_IDs = ["*"]
        opt.notdef_outline = True
        s = subset.Subsetter(opt)
        s.populate(unicodes=chars)
        s.subset(font)
        out = f"assets/fonts/NotoSansKR-{w}-subset.ttf"
        font.save(out)
        print(out, os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()
