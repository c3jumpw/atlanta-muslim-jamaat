/* ================= Router ================= */
const route = () => (location.hash || '').replace(/^#/, '') || 'home';
let lastRoute = null;
function view(r) {
  const exact = { home: vHome, 'prayer-times': vPrayer, jumuah: vJumuah, visit: vVisit, news: vNews, khutbahs: vKhutbahs, learn: vLearn, library: vLibrary, events: vEvents, programs: vPrograms, volunteer: vVolunteer, ramadan: vRamadan, community: vForum, gallery: vGallery, donate: vDonate, zakat: vDonate, membership: vMembership, account: vAccount, 'ask-imam': vAskImam, booking: vBooking, about: vAbout, 'save-to-phone': vInstall, admin: () => vAdmin('') };
  if (exact[r]) return exact[r]();
  const pre = [['news-', vNews], ['khutbah-', vKhutbahs], ['learn-', vLearnGuide], ['article-', vArticle], ['topic-', vForum], ['admin-', vAdmin]];
  for (const [p, fn] of pre) if (r.startsWith(p)) return fn(r.slice(p.length));
  return notFound();
}
function render(scroll = true) {
  const r = route();
  const ae = document.activeElement;
  const focusKey = ae?.dataset?.input; const caret = ae?.selectionStart;
  renderShell(r);
  $('#main').innerHTML = view(r);
  document.title = (r === 'home' ? '' : ((document.querySelector('#main h1')?.textContent || '').trim() + ' · ')) + S.settings.name;
  if (r !== lastRoute) { document.body.classList.remove('drawer-open'); if (scroll) { if (r === 'zakat') setTimeout(() => $('#zakat')?.scrollIntoView({ block: 'start' }), 0); else scrollTo(0, 0); } }
  lastRoute = r;
  drawPattern($('#main canvas.pattern'));
  if (focusKey) { const el = $(`[data-input="${focusKey}"]`); if (el) { el.focus(); try { el.setSelectionRange(caret, caret); } catch (e) {} } }
}

/* ================= Events ================= */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = A[el.dataset.action];
  if (!fn) return;
  if (el.tagName === 'BUTTON' && el.type !== 'submit') e.preventDefault();
  fn(el, e);
});
document.addEventListener('change', e => { const el = e.target.closest('[data-action-change]'); if (el && CHANGE[el.dataset.actionChange]) CHANGE[el.dataset.actionChange](el); });
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.zk) { UI.z = { ...(UI.z || {}), [el.dataset.zk]: el.value }; const z = zakatCalc(); $('#zakat-due').textContent = money(z.due); $('#zakat-note').textContent = z.total >= z.nisab ? `Your zakatable wealth of ${money(z.total)} is above the nisab of ${money(Math.round(z.nisab))}.` : `Below the nisab of ${money(Math.round(z.nisab))}. No zakat is due on these amounts.`; return; }
  const k = el.dataset.input; if (!k) return;
  if (k === 'amt') { UI.amt = el.value; const b = $('[data-form="donate"] button[type=submit]'); if (b) b.textContent = `Give ${money(+el.value || 0)} ${(UI.freq || 'once') === 'once' ? '' : UI.freq} to ${FUNDS.find(f => f.id === (UI.fund || 'sadaqah')).name}`; $$('.amounts button').forEach(x => x.classList.toggle('on', x.dataset.v === el.value)); return; }
  if (k === 'fitrN') { UI.fitrN = Math.max(1, +el.value || 1); const tot = S.settings.fitrPerPerson * UI.fitrN; $('#fitr-total').textContent = money(tot); const a = $('[data-v="fitr"][data-amt]'); if (a) a.dataset.amt = tot; return; }
  if (k === 'maud') { UI.maud = el.value; $('#aud-count').textContent = audCount(el.value) + ' recipients'; return; }
  UI[k] = el.value; render(false);
});
document.addEventListener('submit', async e => {
  const form = e.target.closest('[data-form]'); if (!form) return;
  e.preventDefault();
  const fn = F[form.dataset.form]; if (!fn) return;
  const btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;
  try { await fn(new FormData(form), form); } catch (err) { toast('Something went wrong. Please try again.'); console.error(err); }
  if (btn && document.contains(btn)) btn.disabled = false;
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); document.body.classList.remove('drawer-open'); } });
function tipMove(e) {
  const r = e.target.closest?.('.chart [data-tip]');
  $$('.chart .tip.show').forEach(t => { if (!r || !t.parentElement.contains(r)) t.classList.remove('show'); });
  if (!r) return;
  const chart = r.closest('.chart'), tip = chart.querySelector('.tip'), b = chart.getBoundingClientRect();
  tip.textContent = r.dataset.tip; tip.classList.add('show');
  tip.style.left = Math.min(Math.max(e.clientX - b.left, 70), b.width - 70) + 'px'; tip.style.top = (e.clientY - b.top) + 'px';
}
document.addEventListener('pointermove', tipMove);
document.addEventListener('pointerdown', tipMove);
window.addEventListener('hashchange', () => { closeModal(); render(); });
window.addEventListener('resize', () => drawPattern($('#main canvas.pattern')));

/* ================= Boot ================= */
S = load();
$('#menu-btn').addEventListener('click', A['open-drawer']);
$('#acct-btn').addEventListener('click', () => { location.hash = 'account'; });
$('#scrim').addEventListener('click', A['close-drawer']);
$('#role-select').addEventListener('change', e => { const v = e.target.value; S.currentUserId = v === 'visitor' ? null : v; UI.sel = {}; save(); render(false); toast('Now previewing as ' + e.target.selectedOptions[0].textContent + '.'); });
render();
if ('serviceWorker' in navigator && location.protocol === 'https:') { try { navigator.serviceWorker.register('/sw.js').catch(() => {}); } catch (e) {} }
setInterval(() => { if (route() === 'home' && $('#hero')) { $('#hero').innerHTML = heroHTML(); drawPattern($('#hero canvas.pattern')); } }, 30000);
