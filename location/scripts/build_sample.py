"""보유 CSV(서울 생활인구, 자치구 단위, CP949)에서 구 단위 표본 data/sample-gu.json 을 만든다.

사용: py scripts/build_sample.py "<CSV 경로>"
- 구마다: 평일/주말 24시간 평균, 연령 5묶음(남+여), 성별 비율, 월별 평균 · 월별 연령 비중(완전한 달만), 기준일
- 동 단위 자료가 아니라 "구 단위 표본"이다. 동 단위 API 연결 전의 임시 자료이며 화면에 그렇게 표시한다.
표준 라이브러리만 사용한다.
"""
import csv
import datetime
import json
import sys
from collections import defaultdict

GU = {
    "11110": "종로구", "11140": "중구", "11170": "용산구", "11200": "성동구", "11215": "광진구",
    "11230": "동대문구", "11260": "중랑구", "11290": "성북구", "11305": "강북구", "11320": "도봉구",
    "11350": "노원구", "11380": "은평구", "11410": "서대문구", "11440": "마포구", "11470": "양천구",
    "11500": "강서구", "11530": "구로구", "11545": "금천구", "11560": "영등포구", "11590": "동작구",
    "11620": "관악구", "11650": "서초구", "11680": "강남구", "11710": "송파구", "11740": "강동구",
}
# 연령 5묶음: 컬럼 이름의 연령 구간 → 묶음
GROUP = {"0~9세": "g10m", "10~14세": "g10m", "15~19세": "g10m", "20~24세": "g20", "25~29세": "g20",
         "30~34세": "g30", "35~39세": "g30", "40~44세": "g40", "45~49세": "g40"}


ORDER = ("g10m", "g20", "g30", "g40", "g50p")


def group_of(age):
    return GROUP.get(age, "g50p")


def main(path):
    f = open(path, encoding="cp949")
    r = csv.reader(f)
    head = next(r)
    cols = []  # (index, sex, group)
    for i, h in enumerate(head):
        if h.startswith("남자 ") or h.startswith("여자 "):
            cols.append((i, h[0], group_of(h[3:])))

    hour = defaultdict(lambda: [[0.0, 0] for _ in range(24)])  # (gu, wk) -> 24 x (합, 개수)
    age = defaultdict(float)  # gu -> 합 per group
    agem = defaultdict(float)  # (gu, 월, 묶음) 합
    sex = defaultdict(float)
    mon = defaultdict(lambda: defaultdict(lambda: [0.0, 0]))  # gu -> 월 -> (합, 개수)
    days_in_month = defaultdict(set)
    last = ""
    for row in r:
        d, h, gu = row[0], int(row[1]), row[2]
        if gu not in GU:
            continue
        last = max(last, d)
        wk = "end" if datetime.date(int(d[:4]), int(d[4:6]), int(d[6:])).weekday() >= 5 else "day"
        total = float(row[3])
        slot = hour[(gu, wk)][h]
        slot[0] += total
        slot[1] += 1
        m = d[:6]
        mon[gu][m][0] += total
        mon[gu][m][1] += 1
        days_in_month[m].add(d)
        for i, sx, g in cols:
            v = float(row[i])
            age[(gu, g)] += v
            agem[(gu, m, g)] += v
            sex[(gu, sx)] += v

    # 완전한 달: 그 달의 모든 날짜가 24시간 모두 있는 달 (마지막 달이 중간에 끊기면 제외)
    ly, lm, ld = int(last[:4]), int(last[4:6]), int(last[6:])
    nxt = datetime.date(ly + (lm == 12), lm % 12 + 1, 1)
    last_dim = (nxt - datetime.timedelta(days=1)).day
    months = sorted(days_in_month)
    if ld < last_dim:
        months = [m for m in months if m != last[:6]]

    out = {"asOf": f"{last[:4]}-{last[4:6]}-{last[6:]}", "source": "서울 열린데이터광장 생활인구(자치구 단위) 표본", "level": "gu", "months": months, "gu": {}}
    for gu, name in GU.items():
        tot_age = sum(age[(gu, g)] for g in ("g10m", "g20", "g30", "g40", "g50p")) or 1
        tot_sex = (sex[(gu, "남")] + sex[(gu, "여")]) or 1
        out["gu"][gu] = {
            "name": name,
            "weekday": [round(a / max(1, n)) for a, n in hour[(gu, "day")]],
            "weekend": [round(a / max(1, n)) for a, n in hour[(gu, "end")]],
            "age": {g: round(age[(gu, g)] / tot_age, 4) for g in ("g10m", "g20", "g30", "g40", "g50p")},
            "female": round(sex[(gu, "여")] / tot_sex, 4),
            "monthly": [round(mon[gu][m][0] / mon[gu][m][1]) for m in months],
            "ageMonthly": [[round(agem[(gu, m, g)] / (sum(agem[(gu, m, k)] for k in ORDER) or 1), 4) for g in ORDER] for m in months],
        }
    json.dump(out, open("data/sample-gu.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("완료:", len(out["gu"]), "개 구, 완전한 달", months, "기준일", out["asOf"])


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
