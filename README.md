# Port Thesis Tracker V1.1

A static GitHub Pages dashboard for monitoring long-term portfolio theses.

## Important GitHub Pages setup

Use **Settings → Pages → Source → GitHub Actions**.

Do **not** use the generated `static.yml` workflow. The repository should contain:

- `.github/workflows/deploy.yml` — deploys the site after normal pushes.
- `.github/workflows/daily-update.yml` — fetches news/prices on schedule, commits updated JSON, and explicitly deploys the updated site in the same workflow run.
- `.github/workflows/test.yml` — validates files and JSON.

The daily workflow explicitly deploys after updating data because a commit made with the default `GITHUB_TOKEN` does not trigger another Pages workflow.

## Refresh behavior

The browser **Refresh** buttons reload the latest `data/*.json` files with cache-busting. They do not fetch news directly from Google/Yahoo from the browser.

New news appears only after the GitHub Actions **Daily market and news update** workflow has run successfully. You can run it manually from:

**Actions → Daily market and news update → Run workflow**

The dashboard displays the timestamp of the latest data update.

## Data sources

The initial updater uses:

- Yahoo Finance chart endpoint for quote snapshots.
- Google News RSS for headlines.

These are convenience feeds rather than licensed investment-data APIs. The updater is designed for a personal monitoring dashboard, not trading execution or authoritative market data.

## Custom holdings

Use **+ Add holding** in the dashboard. Custom holdings are stored in this browser's local storage, so they are not automatically part of the server-side daily updater. Built-in holdings in `data/portfolio.json` are updated by the scheduled workflow.

## Live chart

The selected holding uses TradingView's embeddable Advanced Chart widget. The dashboard also displays the latest quote snapshot from `data/prices.json` when available.

## Thesis philosophy

News sentiment and price moves do not automatically change HOLD/MONITOR/REVIEW status. Status changes should be based on the underlying investment thesis and independent fundamental evidence.
