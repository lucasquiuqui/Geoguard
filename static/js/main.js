// Ano atual
document.getElementById('year').textContent = new Date().getFullYear();

// Menu mobile
const btn = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');
btn?.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
});

// Placeholder do Monitoramento (pronto para integrar tiles)
const badgeDate = document.getElementById('badgeDate');
const badgeLayer = document.getElementById('badgeLayer');
const periodo = document.getElementById('periodo');
const dataRef = document.getElementById('dataRef');
const timeline = document.getElementById('timeline');
const map = document.getElementById('map');
const toggleLayerBtn = document.getElementById('toggleLayer');
const playBtn = document.getElementById('play');
const layers = ['alertas','desmate','calor','umidade'];
let layerIdx = 0, playing = false, playTimer = null;
const today = new Date();
const pad = n => String(n).padStart(2,'0');
dataRef.value = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
function labelPeriodo(){ return periodo.value==='diario'?'Diário':(periodo.value==='semanal'?'Semanal':'Mensal'); }
function renderBadge(){ badgeDate.textContent = `${labelPeriodo()} • ${dataRef.value} • t+${timeline.value}`; badgeLayer.textContent = layers[layerIdx]; }
function renderMapPlaceholder(){ map.textContent = `Amazônia — ${labelPeriodo()} ${dataRef.value} — passo ${timeline.value} — camada ${layers[layerIdx]}`; }
function stepTimeline(){ let v = Number(timeline.value); v = (v+1) % (Number(timeline.max)+1); timeline.value = String(v); renderBadge(); renderMapPlaceholder(); }
periodo.addEventListener('change', ()=>{ renderBadge(); renderMapPlaceholder(); });
dataRef.addEventListener('change', ()=>{ renderBadge(); renderMapPlaceholder(); });
timeline.addEventListener('input', ()=>{ renderBadge(); renderMapPlaceholder(); });
toggleLayerBtn.addEventListener('click', ()=>{ layerIdx = (layerIdx+1) % layers.length; renderBadge(); renderMapPlaceholder(); });
playBtn.addEventListener('click', ()=>{ playing = !playing; playBtn.textContent = playing ? 'Pausar' : 'Animação'; if(playing){ playTimer = setInterval(stepTimeline, 700); } else { clearInterval(playTimer); } });
renderBadge(); renderMapPlaceholder();

// Modelo & Atualizações (localStorage)
const versionEl = document.getElementById('model-version');
const dateEl = document.getElementById('model-date');
const changelogEl = document.getElementById('changelog');
const saveBtn = document.getElementById('saveModel');
const fb = document.getElementById('saveFeedback');
function loadState(){
  const state = JSON.parse(localStorage.getItem('geoguard:model')||'{}');
  if(state.version){ versionEl.textContent = state.version; dateEl.textContent = new Date(state.date).toLocaleString(); }
  else { dateEl.textContent = new Date().toLocaleString(); }
  const log = state.log || [];
  changelogEl.innerHTML = log.map(item => `<li><strong>${item.version}</strong> — ${new Date(item.date).toLocaleString()}<br><small>Métricas: ${JSON.stringify(item.metrics)}</small><br>${item.notes}</li>`).join('');
}
saveBtn?.addEventListener('click', ()=>{
  const v = document.getElementById('newVersion').value.trim();
  const mTxt = document.getElementById('metrics').value.trim();
  const notes = document.getElementById('notes').value.trim();
  if(!v){ fb.style.display='block'; fb.textContent='Informe a nova versão.'; return; }
  let metrics = {}; try{ metrics = mTxt ? JSON.parse(mTxt) : {}; } catch(e){ fb.style.display='block'; fb.textContent='Métricas inválidas (JSON).'; return; }
  const now = new Date().toISOString();
  const state = JSON.parse(localStorage.getItem('geoguard:model')||'{}');
  const log = state.log || [];
  log.unshift({version:v, metrics, notes, date:now});
  localStorage.setItem('geoguard:model', JSON.stringify({version:v, date:now, log}));
  fb.style.display='block'; fb.textContent='Atualização publicada localmente.';
  loadState();
  document.getElementById('newVersion').value=''; document.getElementById('metrics').value=''; document.getElementById('notes').value='';
});
loadState();

// Contato + Liberação de relatórios
const form = document.querySelector('#contato form');
const feedback = document.getElementById('feedback');
const CONTACT_KEY = 'geoguard:contact_ok';
const reportButtons = [...document.querySelectorAll('[data-report]')];
function updateReportGating(){
  const ok = localStorage.getItem(CONTACT_KEY) === '1';
  reportButtons.forEach(btn=>{
    btn.disabled = !ok;
    const lock = btn.parentElement.querySelector('.lock');
    if(ok){ lock.textContent = '✅ Liberado neste navegador'; }
    else { lock.textContent = '🔒 Requer contato'; }
    // ação de download
    btn.onclick = ok ? (()=>{ const href = btn.getAttribute('data-report'); window.location.href = href; }) : null;
  });
}
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  // Aqui você chamaria sua API real (e-mail / CRM). Localmente, só confirmamos.
  feedback.style.display = 'block';
  feedback.textContent = `Obrigado, ${data.nome}! Em breve entraremos em contato e os relatórios foram liberados neste navegador.`;
  localStorage.setItem(CONTACT_KEY, '1');
  updateReportGating();
  form.reset();
});
updateReportGating();