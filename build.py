"""Собирает data.json для сайта и виджета.
python build.py            — скачать с stis.su и собрать
python build.py <папка>    — собрать из уже скачанных файлов (без интернета)
"""
import datetime as dt
import json
import os
import sys
import tempfile

import rasp_kabinet as k

KEEP_DAYS = 10  # старые недели не храним


def build(folder):
    sheets = {}
    today = dt.date.today()
    for f in sorted(os.listdir(folder)):
        try:
            wb = k.load_book(os.path.join(folder, f))
        except Exception as e:
            print("пропуск", f, e)
            continue
        for ws in wb.worksheets:
            m = k.SHEET_RE.search(ws.title)
            if not m:
                continue
            d1, m1, d2, m2 = map(int, m.groups())
            y = today.year if (m1 >= 8) == (today.month >= 8) else (today.year - 1 if m1 >= 8 else today.year + 1)
            try:
                s = dt.date(y, m1, d1)
                e = dt.date(y if m2 >= m1 else y + 1, m2, d2)
            except ValueError:
                continue
            if e < today - dt.timedelta(days=KEEP_DAYS):
                continue
            items = k.parse_sheet(ws, f)
            if not items:
                continue
            groups = sorted({i["group"] for i in items})
            key = ws.title + "|" + ",".join(groups)
            sheets[key] = dict(key=key, f=str(s), t=str(e), l=[
                [i["day"], i["pair"], i["time"], i["group"], i["kind"], i["subj"], i["teacher"], i["room"]]
                for i in items])
    return list(sheets.values())


if __name__ == "__main__":
    if len(sys.argv) > 1:
        folder = sys.argv[1]
    else:
        folder = tempfile.mkdtemp()
        n = k.download_all(folder=folder)
        print("ссылок найдено:", n)
    sheets = build(folder)
    if not sheets:
        sys.exit("Нет данных — data.json не трогаю")
    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=3)))
    with open("data.json", "w", encoding="utf-8") as fh:
        json.dump({"updated": now.strftime("%d.%m.%Y %H:%M"), "sheets": sheets}, fh,
                  ensure_ascii=False, separators=(",", ":"))
    print("листов:", len(sheets))
