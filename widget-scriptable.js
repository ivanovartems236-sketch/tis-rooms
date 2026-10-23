// Виджет «Кабинеты ТИС» для приложения Scriptable (iPhone).
// 1) Впиши адрес своего сайта ниже.
// 2) На экране «Домой» добавь виджет Scriptable → выбери этот скрипт →
//    в поле Parameter впиши аудиторию (например СЗ или К-121).
const SITE = "https://ИМЯ.github.io/tis-rooms/";   // <- поменяй ИМЯ на свой логин GitHub

const ROOM = (args.widgetParameter || "СЗ").trim();
const WD = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

async function getData() {
  const fm = FileManager.local();
  const cache = fm.joinPath(fm.documentsDirectory(), "tis-rooms.json");
  try {
    const d = await new Request(SITE + "data.json?" + Date.now()).loadJSON();
    fm.writeString(cache, JSON.stringify(d));
    return d;
  } catch (e) {
    return fm.fileExists(cache) ? JSON.parse(fm.readString(cache)) : { sheets: [], updated: "" };
  }
}

function pairsFor(data, day, room) {
  const k = iso(day), w = (day.getDay() + 6) % 7, map = new Map();
  for (const sh of data.sheets) {
    if (sh.f > k || k > sh.t) continue;
    for (const x of sh.l) {
      if (x[0] !== w || x[7] !== room) continue;
      const key = x[1] + "|" + x[5];
      if (!map.has(key)) map.set(key, { pair: x[1], time: x[2], kind: x[4], subj: x[5], teacher: x[6], groups: [] });
      const g = map.get(key); if (!g.groups.includes(x[3])) g.groups.push(x[3]);
    }
  }
  return [...map.values()].sort((a, b) => a.pair - b.pair);
}

const endMin = t => { const r = t.match(/-(\d+)\.(\d+)/); return r ? +r[1] * 60 + +r[2] : 0; };
const startMin = t => { const r = t.match(/(\d+)\.(\d+)-/); return r ? +r[1] * 60 + +r[2] : 0; };

const data = await getData();
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const items = pairsFor(data, today, ROOM);
const m = now.getHours() * 60 + now.getMinutes();

const accent = Color.dynamic(new Color("#1d5fa8"), new Color("#7fb2ec"));
const nowC = Color.dynamic(new Color("#c2410c"), new Color("#fb923c"));
const muted = Color.dynamic(new Color("#5f6b78"), new Color("#97a3b0"));
const fg = Color.dynamic(new Color("#17202b"), new Color("#e6ebf1"));

const w = new ListWidget();
w.backgroundColor = Color.dynamic(new Color("#ffffff"), new Color("#171e27"));
w.url = SITE;
w.setPadding(12, 14, 12, 14);

const head = w.addStack();
const t = head.addText(ROOM === "СЗ" ? "Спортзал" : ROOM);
t.font = Font.boldSystemFont(16); t.textColor = fg;
head.addSpacer();
const dt = head.addText(`${today.getDate()}.${String(today.getMonth() + 1).padStart(2, "0")} ${WD[now.getDay()]}`);
dt.font = Font.mediumSystemFont(12); dt.textColor = muted;
w.addSpacer(6);

const fam = config.widgetFamily || "large";
const limit = fam === "small" ? 2 : fam === "medium" ? 3 : 8;
const shown = (fam === "large" ? items : items.filter(i => endMin(i.time) >= m)).slice(0, limit);

if (!items.length) {
  const e = w.addText("Сегодня занятий нет");
  e.font = Font.systemFont(13); e.textColor = muted;
} else if (!shown.length) {
  const e = w.addText("Пары на сегодня закончились");
  e.font = Font.systemFont(13); e.textColor = muted;
}
for (const i of shown) {
  const isNow = m >= startMin(i.time) && m <= endMin(i.time);
  const row = w.addStack(); row.layoutVertically();
  const l1 = row.addText(`${i.pair} пара · ${i.time.trim()}${isNow ? " · сейчас" : ""}`);
  l1.font = Font.semiboldSystemFont(11); l1.textColor = isNow ? nowC : accent;
  const l2 = row.addText(i.subj); l2.font = Font.systemFont(13); l2.textColor = fg; l2.lineLimit = fam === "small" ? 1 : 2;
  if (fam !== "small") {
    const l3 = row.addText(`${i.teacher} · ${i.groups.join(", ")}`);
    l3.font = Font.systemFont(10); l3.textColor = muted; l3.lineLimit = 1;
  }
  w.addSpacer(5);
}
w.addSpacer();
const ft = w.addText("обновлено " + (data.updated || "—"));
ft.font = Font.systemFont(9); ft.textColor = muted;

w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
if (config.runsInWidget) Script.setWidget(w); else await w.presentLarge();
Script.complete();
