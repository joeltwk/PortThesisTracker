# V1.1 data updater

`update_data.py` is designed to run from GitHub Actions. It fetches daily quote snapshots and news headlines, then writes `data/prices.json` and `data/news.json`.

The first version intentionally avoids putting API keys in browser JavaScript. If you later add an AI provider, keep its key in GitHub Actions Secrets and call it only from the workflow.

For stronger production-grade financial data, replace the Yahoo/Google RSS functions with a licensed market/news API. The dashboard does not treat headline sentiment as a sell signal.
