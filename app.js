const state = { portfolio: null, signals: null };

const $ = (selector) => document.querySelector(selector);

async function loadData() {
  const [portfolioRes, signalsRes] = await Promise.all([
    fetch('data/portfolio.json', { cache: 'no-store' }),
    fetch('data/signals.json', { cache: 'no-store' })
  ]);
  if (!portfolioRes.ok || !signalsRes.ok) throw new Error('Could not load tracker data.');
  state.portfolio = await portfolioRes.json();
  state.signals = await signalsRes.json();
}

function statusLabel(status) {
  return ({ HOLD: 'HOLD', MONITOR: 'MONITOR', REVIEW: 'REVIEW', THESIS_AT_RISK: 'THESIS AT RISK' })[status] || status;
}

function statusClass(status) { return `status-${status}`; }
function statusIcon(status) { return ({HOLD:'●', MONITOR:'●', REVIEW:'●', THESIS_AT_RISK:'●'})[status] || '●'; }
function esc(value) {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function render() {
  const { holdings, overlap, lastUpdated } = state.portfolio;
  const signals = state.signals.signals;
  const counts = holdings.reduce((a,h) => { a[h.status] = (a[h.status]||0)+1; return a; }, {});
  const avgHealth = Math.round(holdings.reduce((sum,h)=>sum+h.health,0)/holdings.length);
  const alertCount = signals.filter(s => s.severity === 'warning').length;

  $('#lastUpdated').textContent = `Data: ${lastUpdated}`;
  $('#systemHeadline').textContent = avgHealth >= 85 ? 'Core thesis is healthy; monitor the satellites.' : 'Portfolio needs a closer thesis review.';
  $('#systemSummary').textContent = `${counts.HOLD||0} HOLD · ${counts.MONITOR||0} MONITOR · ${counts.REVIEW||0} REVIEW · ${counts.THESIS_AT_RISK||0} AT RISK · ${alertCount} watch signals.`;
  $('#portfolioScore').textContent = avgHealth;

  $('#statsGrid').innerHTML = [
    ['Average thesis health', `${avgHealth}/100`, 'Across tracked holdings'],
    ['HOLD', counts.HOLD||0, 'Thesis intact'],
    ['MONITOR', counts.MONITOR||0, 'Warning signals, not sell signals'],
    ['Watch signals', alertCount, 'Needs context, not automatic action']
  ].map(([label,value,sub]) => `<div class="stat"><div class="eyebrow">${label}</div><div class="stat-value">${value}</div><div class="muted">${sub}</div></div>`).join('');

  renderHoldings(holdings);
  renderSignals(signals);
  renderOverlap(overlap);
}

function renderHoldings(holdings) {
  const filter = $('#statusFilter').value;
  const visible = filter === 'ALL' ? holdings : holdings.filter(h => h.status === filter);
  $('#holdingsGrid').innerHTML = visible.map(h => `
    <article class="card holding" data-ticker="${esc(h.ticker)}">
      <div class="holding-top">
        <div><div class="ticker">${esc(h.ticker)}</div><div class="name">${esc(h.name)}</div></div>
        <span class="status ${statusClass(h.status)}"><span class="status-dot">${statusIcon(h.status)}</span>${statusLabel(h.status)}</span>
      </div>
      <div class="health-row"><span class="muted">Thesis health</span><strong>${h.health}/100</strong></div>
      <div class="progress"><div style="width:${h.health}%"></div></div>
      <p class="thesis">${esc(h.thesis)}</p>
      <div class="tags">${h.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
    </article>
  `).join('') || `<div class="card" style="padding:20px">No holdings match this filter.</div>`;
  document.querySelectorAll('.holding').forEach(card => card.addEventListener('click', () => openHolding(card.dataset.ticker)));
}

function renderSignals(signals) {
  const recent = [...signals].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
  $('#signalsList').innerHTML = recent.map(s => `
    <div class="signal">
      <div class="signal-head"><div class="signal-title">${esc(s.ticker)} · ${esc(s.title)}</div><div class="signal-meta">${esc(s.date)}</div></div>
      <div class="signal-meta">${esc(s.type)} · <span class="${s.severity==='warning'?'warning':''}">${esc(s.severity)}</span></div>
      <p>${esc(s.detail)}</p>
    </div>
  `).join('');
}

function renderOverlap(overlap) {
  $('#overlapGrid').innerHTML = overlap.map(o => {
    const width = o.level === 'HIGH' ? 100 : 65;
    return `<div class="overlap-item"><strong>${esc(o.theme)}</strong><div class="overlap-bar"><span style="width:${width}%; background:${o.level==='HIGH'?'#ff9b5c':'#f5c451'}"></span></div><div class="overlap-meta">${esc(o.level)} · ${esc(o.assets.join(' · '))}</div><p class="muted" style="font-size:11px;margin:7px 0 0">${esc(o.note)}</p></div>`;
  }).join('');
}

function openHolding(ticker) {
  const h = state.portfolio.holdings.find(x => x.ticker === ticker);
  const signals = state.signals.signals.filter(s => s.ticker === ticker);
  $('#modalContent').innerHTML = `
    <div class="detail-header">
      <div><div class="eyebrow">${esc(h.bucket)}</div><h2 style="font-size:30px;margin-bottom:2px">${esc(h.ticker)}</h2><div class="muted">${esc(h.name)}</div></div>
      <div class="detail-score"><span class="status ${statusClass(h.status)}">${statusLabel(h.status)}</span><br><strong>${h.health}</strong><div class="muted">thesis health</div></div>
    </div>
    <div class="detail-section"><div class="eyebrow">THESIS</div><p style="font-size:16px">${esc(h.thesis)}</p></div>
    <div class="detail-section"><div class="eyebrow">WHAT MUST REMAIN TRUE</div><ul class="detail-list">${h.mustRemainTrue.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="detail-section"><div class="eyebrow">SELL / REDUCE TRIGGERS</div>${h.sellTriggers.map(x=>`<div class="trigger">${esc(x)}</div>`).join('')}</div>
    <div class="detail-section"><div class="eyebrow">RECENT SIGNALS</div>${signals.length ? signals.map(s=>`<div class="signal"><div class="signal-title">${esc(s.title)}</div><div class="signal-meta">${esc(s.date)} · ${esc(s.type)} · ${esc(s.severity)}</div><p>${esc(s.detail)}</p></div>`).join('') : '<p class="muted">No signals recorded.</p>'}</div>
  `;
  $('#modal').classList.remove('hidden');
  $('#modal').setAttribute('aria-hidden','false');
}

function closeModal() {
  $('#modal').classList.add('hidden');
  $('#modal').setAttribute('aria-hidden','true');
}

async function refresh() {
  $('#refreshBtn').disabled = true;
  try { await loadData(); render(); }
  catch (err) { console.error(err); $('#systemHeadline').textContent = 'Could not load tracker data.'; $('#systemSummary').textContent = err.message; }
  finally { $('#refreshBtn').disabled = false; }
}

document.addEventListener('DOMContentLoaded', async () => {
  $('#refreshBtn').addEventListener('click', refresh);
  $('#statusFilter').addEventListener('change', () => renderHoldings(state.portfolio.holdings));
  document.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  await refresh();
});
