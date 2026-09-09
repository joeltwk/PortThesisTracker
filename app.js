const state = { portfolio:null, signals:null, news:null, prices:null, selectedTicker:null };
const $ = s => document.querySelector(s);
const LS_KEY = 'ptt_custom_holdings_v11';

function esc(v){return String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function statusLabel(s){return ({HOLD:'HOLD',MONITOR:'MONITOR',REVIEW:'REVIEW',THESIS_AT_RISK:'THESIS AT RISK'})[s]||s}
function statusClass(s){return `status-${s}`}
function customHoldings(){try{return JSON.parse(localStorage.getItem(LS_KEY)||'[]')}catch{return []}}
function mergedHoldings(){
  const base = state.portfolio?.holdings || [];
  const custom = customHoldings();
  const byTicker = new Map(base.map(h=>[h.ticker.toUpperCase(),h]));
  custom.forEach(h=>byTicker.set(h.ticker.toUpperCase(),h));
  return [...byTicker.values()];
}
async function loadJson(path){const r=await fetch(`${path}?v=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(`Could not load ${path} (${r.status})`);return r.json()}
async function loadData(){
  const [p,s,n,pr] = await Promise.all([
    loadJson('data/portfolio.json'),
    loadJson('data/signals.json'),
    loadJson('data/news.json').catch(()=>({articles:[],lastUpdated:null})),
    loadJson('data/prices.json').catch(()=>({quotes:[]}))
  ]);
  state.portfolio=p;state.signals=s;state.news=n;state.prices=pr;
}
function render(){
  const holdings=mergedHoldings(); const signals=state.signals?.signals||[]; const overlap=state.portfolio?.overlap||[];
  const counts=holdings.reduce((a,h)=>(a[h.status]=(a[h.status]||0)+1,a),{});
  const avg=holdings.length?Math.round(holdings.reduce((x,h)=>x+(Number(h.health)||0),0)/holdings.length):0;
  const alerts=signals.filter(s=>s.severity==='warning').length;
  $('#lastUpdated').textContent=`Data: ${state.portfolio?.lastUpdated||'local'}`;
  $('#systemHeadline').textContent=avg>=85?'Core thesis is healthy; monitor the satellites.':'Portfolio needs a closer thesis review.';
  $('#systemSummary').textContent=`${counts.HOLD||0} HOLD · ${counts.MONITOR||0} MONITOR · ${counts.REVIEW||0} REVIEW · ${counts.THESIS_AT_RISK||0} AT RISK · ${alerts} watch signals.`;
  $('#portfolioScore').textContent=avg;
  $('#statsGrid').innerHTML=[['Average thesis health',`${avg}/100`,'Across tracked holdings'],['HOLD',counts.HOLD||0,'Thesis intact'],['MONITOR',(counts.MONITOR||0),'Warning signals, not sell signals'],['Watch signals',alerts,'Needs context, not automatic action']].map(([a,b,c])=>`<div class="stat"><div class="eyebrow">${a}</div><div class="stat-value">${b}</div><div class="muted">${c}</div></div>`).join('');
  renderHoldings(holdings);renderSignals(signals);renderOverlap(overlap);renderNews();
  if(!state.selectedTicker && holdings[0]) state.selectedTicker=holdings[0].ticker;
  if(state.selectedTicker) loadChart(state.selectedTicker);
}
function renderHoldings(holdings){
  const filter=$('#statusFilter').value; const visible=filter==='ALL'?holdings:holdings.filter(h=>h.status===filter);
  $('#holdingsGrid').innerHTML=visible.map(h=>`<article class="card holding" data-ticker="${esc(h.ticker)}"><div class="holding-top"><div><div class="ticker">${esc(h.ticker)}</div><div class="name">${esc(h.name||h.ticker)}</div></div><span class="status ${statusClass(h.status)}">● ${statusLabel(h.status)}</span></div><div class="health-row"><span class="muted">Thesis health</span><strong>${Number(h.health)||0}/100</strong></div><div class="progress"><div style="width:${Math.max(0,Math.min(100,Number(h.health)||0))}%"></div></div><p class="thesis">${esc(h.thesis||'No thesis added yet.')}</p><div class="tags">${(h.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></article>`).join('')||'<div class="card" style="padding:20px">No holdings match this filter.</div>';
  document.querySelectorAll('.holding').forEach(c=>c.addEventListener('click',()=>{state.selectedTicker=c.dataset.ticker;openHolding(c.dataset.ticker);loadChart(c.dataset.ticker)}));
}
function renderSignals(signals){
  const recent=[...signals].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,8);
  $('#signalsList').innerHTML=recent.map(s=>`<div class="signal"><div class="signal-head"><div class="signal-title">${esc(s.ticker)} · ${esc(s.title)}</div><div class="signal-meta">${esc(s.date)}</div></div><div class="signal-meta">${esc(s.type)} · <span class="${s.severity==='warning'?'warning':''}">${esc(s.severity)}</span></div><p>${esc(s.detail)}</p></div>`).join('')||'<p class="muted">No signals yet.</p>';
}
function renderOverlap(overlap){$('#overlapGrid').innerHTML=(overlap||[]).map(o=>{const width=o.level==='HIGH'?100:65;return `<div class="overlap-item"><strong>${esc(o.theme)}</strong><div class="overlap-bar"><span style="width:${width}%"></span></div><div class="overlap-meta">${esc(o.level)} · ${esc((o.assets||[]).join(' · '))}</div><p class="muted" style="font-size:11px;margin:7px 0 0">${esc(o.note)}</p></div>`}).join('')||'<p class="muted">No overlap data.</p>'}
function renderNews(){
  const articles=state.news?.articles||[]; const ticker=state.selectedTicker;
  const filtered=ticker?articles.filter(a=>!a.ticker||a.ticker.toUpperCase()===ticker.toUpperCase()):articles;
  const list=(filtered.length?filtered:articles).slice(0,10);
  $('#newsList').innerHTML=list.map(a=>`<article class="news-item"><a href="${esc(a.url)}" target="_blank" rel="noopener"><div class="news-title">${esc(a.title)}</div><div class="news-meta">${esc(a.source||'News')} · ${esc(a.published||'')}</div></a></article>`).join('')||'<p class="muted">No news has been fetched yet. The daily workflow can populate data/news.json.</p>';
}
function tvSymbol(t){
  const map={VWRA:'LSE:VWRA',VOO:'AMEX:VOO',QQQ:'NASDAQ:QQQ',SMH:'NASDAQ:SMH',NVDA:'NASDAQ:NVDA',TSM:'NYSE:TSM'};
  return map[t.toUpperCase()]||`NASDAQ:${t.toUpperCase()}`;
}
function loadChart(ticker){
  state.selectedTicker=ticker; const h=mergedHoldings().find(x=>x.ticker.toUpperCase()===ticker.toUpperCase());
  $('#chartTitle').textContent=`${ticker} · ${h?.name||'Selected stock'}`; const q=(state.prices?.quotes||[]).find(x=>x.ticker.toUpperCase()===ticker.toUpperCase()); $('#chartPrice').textContent=q?.price!=null?`${q.currency||'USD'} ${Number(q.price).toLocaleString(undefined,{maximumFractionDigits:2})}`:'Price pending'; renderNews();
  const c=$('#chartContainer'); c.innerHTML='';
  const wrap=document.createElement('div');wrap.className='tradingview-widget-container';wrap.style='height:100%;width:100%';
  const inner=document.createElement('div');inner.className='tradingview-widget-container__widget';inner.style='height:calc(100% - 32px);width:100%';wrap.appendChild(inner);
  const credit=document.createElement('div');credit.className='tradingview-widget-copyright';credit.innerHTML='<a href="https://www.tradingview.com/" target="_blank" rel="noopener">Chart by TradingView</a>';wrap.appendChild(credit);c.appendChild(wrap);
  const script=document.createElement('script');script.src='https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';script.async=true;script.type='text/javascript';script.innerHTML=JSON.stringify({autosize:true,symbol:tvSymbol(ticker),interval:'D',timezone:'Asia/Singapore',theme:'light',style:'1',locale:'en',allow_symbol_change:true,withdateranges:true,save_image:false,details:true,hotlist:false,calendar:false,support_host:'https://www.tradingview.com'});wrap.appendChild(script);
}
function openHolding(ticker){
  const h=mergedHoldings().find(x=>x.ticker.toUpperCase()===ticker.toUpperCase());if(!h)return;
  const sig=(state.signals?.signals||[]).filter(s=>s.ticker.toUpperCase()===ticker.toUpperCase());
  $('#modalContent').innerHTML=`<div class="detail-header"><div><div class="eyebrow">${esc(h.bucket||'Custom')}</div><h2>${esc(h.ticker)}</h2><div class="muted">${esc(h.name||h.ticker)}</div></div><div class="detail-score"><span class="status ${statusClass(h.status)}">${statusLabel(h.status)}</span><br><strong>${Number(h.health)||0}</strong><div class="muted">thesis health</div></div></div><div class="detail-section"><div class="eyebrow">THESIS</div><p style="font-size:16px">${esc(h.thesis||'No thesis added yet.')}</p></div><div class="detail-section"><div class="eyebrow">WHAT MUST REMAIN TRUE</div><ul class="detail-list">${(h.mustRemainTrue||['Add the conditions that keep this thesis valid.']).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div class="detail-section"><div class="eyebrow">SELL / REDUCE TRIGGERS</div>${(h.sellTriggers||['Define the fundamental reasons you would reduce or exit.']).map(x=>`<div class="trigger">${esc(x)}</div>`).join('')}</div><div class="detail-section"><div class="eyebrow">RECENT SIGNALS</div>${sig.length?sig.map(s=>`<div class="signal"><div class="signal-title">${esc(s.title)}</div><div class="signal-meta">${esc(s.date)} · ${esc(s.type)} · ${esc(s.severity)}</div><p>${esc(s.detail)}</p></div>`).join(''):'<p class="muted">No signals recorded.</p>'}</div>`;
  $('#modal').classList.remove('hidden');$('#modal').setAttribute('aria-hidden','false');
}
function closeModal(){ $('#modal').classList.add('hidden');$('#modal').setAttribute('aria-hidden','true') }
function openAdd(){ $('#addModal').classList.remove('hidden');$('#addModal').setAttribute('aria-hidden','false');$('#tickerInput').focus() }
function closeAdd(){ $('#addModal').classList.add('hidden');$('#addModal').setAttribute('aria-hidden','true');$('#addForm').reset() }
function saveCustom(h){const arr=customHoldings().filter(x=>x.ticker!==h.ticker);arr.push(h);localStorage.setItem(LS_KEY,JSON.stringify(arr))}
async function refresh(){
  const btn=$('#refreshBtn');btn.disabled=true;btn.textContent='↻ Loading…';
  try{await loadData();render()}catch(e){console.error(e);$('#systemHeadline').textContent='Could not refresh tracker data.';$('#systemSummary').textContent=e.message}finally{btn.disabled=false;btn.textContent='↻ Refresh'}
}
async function refreshNews(){await refresh()}
document.addEventListener('DOMContentLoaded',async()=>{
  $('#refreshBtn').addEventListener('click',refresh);$('#newsRefreshBtn').addEventListener('click',refreshNews);$('#addBtn').addEventListener('click',openAdd);$('#statusFilter').addEventListener('change',()=>renderHoldings(mergedHoldings()));
  document.querySelectorAll('[data-close-modal]').forEach(x=>x.addEventListener('click',closeModal));document.querySelectorAll('[data-close-add]').forEach(x=>x.addEventListener('click',closeAdd));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeAdd()}});
  $('#addForm').addEventListener('submit',e=>{e.preventDefault();const ticker=$('#tickerInput').value.trim().toUpperCase();if(!ticker)return;saveCustom({ticker,name:$('#nameInput').value.trim()||ticker,bucket:$('#bucketInput').value,thesis:$('#thesisInput').value.trim()||'Custom holding — add your thesis and conditions.',health:50,status:'MONITOR',tags:['Custom'],mustRemainTrue:[],sellTriggers:[]});closeAdd();state.selectedTicker=ticker;render();openHolding(ticker)});
  await refresh();
});
