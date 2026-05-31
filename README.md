# Височините на сградите във Варна — Дашборд-оферта

Интерактивна оферта (static SPA) към Община Варна за анализ на съответствието на височините на сградите с устройствените планове. Построена с Vite + React + TypeScript + Leaflet. Данните идват от citywide preflight на проекта (79 115 имота).

## Live

След деплой: <https://ahelia-consulting-eood.github.io/varna-roofs/>

## Локално стартиране

```bash
npm install
npm run build       # build to dist/
npm run preview     # http://127.0.0.1:4173/
# или за разработка с hot reload:
npm run dev
# регенерация на данните от изходните CSV/GeoJSON (изисква Python 3 + pyproj):
python3 scripts/generate_data.py
```

## Деплой

Push на `main` стартира `.github/workflows/deploy.yml`, който билдва с `BASE_PATH=/varna-roofs/` и публикува `dist/` на GitHub Pages.

Еднократна настройка:
1. **Settings → Pages → Source:** „GitHub Actions"
2. Workflow-ът се стартира при следващия push на `main`
3. След ~30 секунди адресът става достъпен

## Структура

```
varna-roofs/
├── public/data/              # статични JSON/GeoJSON
├── scripts/
│   └── generate_data.py      # извежда динамичните данни от изходните Codex outputs
├── src/
│   ├── components/           # HeaderBar, HeadlineBand, VarnaMap, PricingPanel, и т.н.
│   ├── lib/                  # useDashboardData, colors, types
│   └── App.tsx
├── .github/workflows/        # GitHub Pages auto-deploy
└── dist/                     # build артефакт (gzipped .gz siblings included)
```

Изходните данни (citywide preflight, legal corpus, AGUP registry) остават в отделен локален workspace и не са включени в това repo.
