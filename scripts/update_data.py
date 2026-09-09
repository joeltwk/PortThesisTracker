"""Daily data updater for Port Thesis Tracker.

No API key is required for the initial market/news feeds used here:
- Yahoo Finance chart endpoint for daily quote snapshots.
- Google News RSS for headline collection.

Treat these feeds as convenience inputs, not authoritative investment research.
"""
import json, os, re, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA=os.path.join(ROOT,'data')
UA='PortThesisTracker/1.1 (+https://github.com/joeltwk/PortThesisTracker)'

def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA})
    with urllib.request.urlopen(req,timeout=20) as r:return r.read()

def load(name,default):
    p=os.path.join(DATA,name)
    try:
        with open(p,encoding='utf-8') as f:return json.load(f)
    except Exception:return default

def save(name,obj):
    with open(os.path.join(DATA,name),'w',encoding='utf-8') as f:json.dump(obj,f,indent=2,ensure_ascii=False)

def yahoo_quote(ticker):
    url='https://query1.finance.yahoo.com/v8/finance/chart/'+urllib.parse.quote(ticker)+'?range=5d&interval=1d&events=div%2Csplits'
    data=json.loads(get(url)); result=data['chart']['result'][0]; meta=result.get('meta',{})
    return {'ticker':ticker,'price':meta.get('regularMarketPrice'),'currency':meta.get('currency'),'exchange':meta.get('exchangeName'),'asOf':datetime.fromtimestamp(meta.get('regularMarketTime',0),timezone.utc).isoformat() if meta.get('regularMarketTime') else None}

def news_for(ticker):
    q=urllib.parse.quote(ticker+' stock')
    url=f'https://news.google.com/rss/search?q={q}&hl=en-SG&gl=SG&ceid=SG:en'
    root=ET.fromstring(get(url));out=[]
    for item in root.findall('./channel/item')[:8]:
        title=(item.findtext('title') or '').strip(); link=(item.findtext('link') or '').strip(); pub=(item.findtext('pubDate') or '').strip(); source=item.findtext('source') or 'Google News'
        if title and link:out.append({'ticker':ticker,'title':title,'url':link,'published':pub,'source':source})
    return out

def main():
    portfolio=load('portfolio.json',{'holdings':[]})
    tickers=[h.get('ticker') for h in portfolio.get('holdings',[]) if h.get('ticker')]
    prices=[]; articles=[]
    for t in tickers:
        try: prices.append(yahoo_quote(t))
        except Exception as e: print('price error',t,e)
        try: articles.extend(news_for(t))
        except Exception as e: print('news error',t,e)
    now=datetime.now(timezone.utc).isoformat()
    save('prices.json',{'lastUpdated':now,'quotes':prices})
    # de-dupe by URL
    seen=set();dedup=[]
    for a in articles:
        if a['url'] not in seen:seen.add(a['url']);dedup.append(a)
    save('news.json',{'lastUpdated':now,'articles':dedup[:60]})
    portfolio['lastUpdated']=now
    save('portfolio.json',portfolio)
    print('updated',len(prices),'quotes and',len(dedup),'news articles')
if __name__=='__main__':main()
