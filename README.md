# PortThesisTracker V1

A lightweight personal portfolio thesis dashboard designed for GitHub Pages.

## What V1 includes

- Six tracked holdings: VWRA, VOO, QQQ, SMH, NVDA, TSM
- Thesis health score for each holding
- HOLD / MONITOR / REVIEW / THESIS AT RISK statuses
- Written thesis and explicit sell/reduce triggers
- Recent signal log
- Conceptual exposure-overlap view
- Responsive dashboard
- GitHub Actions validation
- GitHub Pages deployment workflow

V1 intentionally does **not** contain live market prices, automated news ingestion, AI analysis, or private portfolio dollar amounts.

## Deploy to GitHub Pages

1. Push this project to the `main` branch of your repository.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Push a change or manually run the `Deploy Thesis Tracker to GitHub Pages` workflow.
5. Open the Pages URL shown by the workflow.

GitHub Pages supports custom Actions workflows for deploying static sites.

## Editing the data

Edit:

- `data/portfolio.json` for holdings, thesis statements, statuses and triggers.
- `data/signals.json` for manually recorded evidence.

Do not put private account numbers, brokerage credentials, or other sensitive financial information into a public repository.

## Roadmap

### V2 — Live market data
- Prices
- Performance
- Market-cap / valuation snapshots where available
- Portfolio overlap calculations

### V3 — News engine
- Daily news ingestion
- Deduplication
- Source quality ranking
- Ticker/topic tagging

### V4 — AI thesis analysis
- Fact extraction
- Thesis relevance
- Evidence strength
- Fundamental-vs-sentiment separation
- Status recommendations with explanations and source links

### V5 — Alerts and history
- Status-change history
- Daily/weekly digest
- Alert only when meaningful thesis evidence changes

## Design principle

The dashboard is a monitoring system, not a trading signal generator.

A price drop does not automatically break a thesis. The key question is whether the reason for owning the asset has materially deteriorated.
