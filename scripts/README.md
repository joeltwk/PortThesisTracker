# Automation placeholder

V1 deliberately keeps data static and transparent. Later versions can add a daily updater here.

Recommended V2 pipeline:

1. Fetch trusted news and market/fundamental data.
2. Deduplicate articles.
3. Classify each article by ticker and thesis category.
4. Extract factual claims and source URLs.
5. Score evidence strength.
6. Recalculate thesis status using the rulebook.
7. Write updated JSON/data to the repository.
8. Deploy the dashboard automatically.

Important rule: news sentiment alone must never trigger a sell status. Require thesis-relevant fundamental evidence and preferably multiple independent signals.
