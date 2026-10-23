# Кабинеты ТИС

Занятость аудиторий ТИС (филиал ДГТУ) по расписанию stis.su.

- `build.py` + `rasp_kabinet.py` — качают и разбирают расписание, пишут `data.json`
- `.github/workflows/update.yml` — запускает сборку каждый час (06–20 МСК, пн–сб)
- `index.html` — сайт/приложение (GitHub Pages), на iPhone: Safari → Поделиться → «На экран Домой»
- `widget-scriptable.js` — виджет для приложения Scriptable
- `rasp_kabinet.py` можно запускать и отдельно на ПК — окно с тем же функционалом
