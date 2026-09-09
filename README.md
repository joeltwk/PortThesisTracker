# Port Thesis Tracker V1.1

A lightweight GitHub Pages dashboard for monitoring long-term investment theses.

## V1.1 additions
- Fixed refresh with cache-busting and clearer loading/error states.
- Interactive TradingView chart for the selected holding.
- Add custom stocks/ETFs from the dashboard; custom holdings persist in browser local storage.
- Daily GitHub Actions workflow for quote snapshots and news headlines.
- Manual `workflow_dispatch` so you can force an update from Actions.
- No private portfolio dollar amounts are stored in the repository.

## Deploy
1. Upload the contents of this folder to your repository's `main` branch.
2. GitHub → Settings → Pages → Source: **GitHub Actions**.
3. The `Deploy Pages` workflow publishes the dashboard.
4. In Actions, run **Daily market and news update** once manually to test data collection.
5. The scheduled workflow runs on weekdays. GitHub scheduled workflows use UTC unless a timezone is specified.

## Chart
The selected holding uses TradingView's free Advanced Chart embed. It supports changing symbols and time ranges directly in the chart.

## Data
The first updater uses Yahoo Finance's chart endpoint for quote snapshots and Google News RSS for headlines. These are convenience feeds. For production use, replace them with a licensed market/news provider if you need stronger reliability, coverage, or terms suitable for your use case.

## AI next step
V1.1 intentionally does not put an AI API key in browser code. The next stage can add a server-side GitHub Action that classifies news by thesis relevance, source quality, evidence strength, and whether the item changes the thesis. Store any AI key in GitHub Actions Secrets.

## Important design rule
News sentiment and price changes must not directly become HOLD/SELL decisions. Status should change only when the evidence meets the thesis rules.
