/* ================= Donations ledger (two-person approval) ================= */
const METHODS = ['Cash', 'Check', 'Zelle', 'Bank transfer', 'Money order', 'Other'];
const donorName = d => d.userId ? nameOf(d.userId) : (d.name || 'Anonymous');
const fundName = id => id === 'dues' ? 'Supporting member dues' : (FUNDS.find(f => f.id === id)?.name || id);
const STATUS_CHIP = { approved: '<span class="chip ok">Approved</span>', pending: '<span class="chip warn">Waiting for approval</span>', rejected: '<span class="chip bad">Rejected</span>', voided: '<span class="chip">Voided</span>' };
const who = id => id ? `${esc(nameOf(id))}${userById(id)?.title ? `, ${esc(userById(id).title)}` : ''}` : '';
function logForm(prefillUser) {
  const members = S.users.filter(u => u.status !== 'invited').sort((a, b) => a.name.localeCompare(b.name));
  const pre = prefillUser ? userById(prefillUser) : null;
  return `<form class="form-grid two" data-form="log-donation">
    <label class="f full">Donor <span class="hint">Start typing a member’s name, or enter anyone else (for example “Jumu’ah collection box” or “Anonymous”)</span><input name="donor" list="donor-list" required value="${esc(pre?.name || '')}" placeholder="Name"><datalist id="donor-list">${members.map(u => `<option value="${esc(u.name)}">`).join('')}<option value="Jumu’ah collection box"><option value="Anonymous"></datalist></label>
    <label class="f">Amount ($)<input name="amount" type="number" min="1" step="0.01" required inputmode="decimal"></label>
    <label class="f">Fund<select name="fund">${FUNDS.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}<option value="dues">Supporting member dues</option></select></label>
    <label class="f">How it was paid<select name="method">${METHODS.map(m => `<option>${m}</option>`).join('')}</select></label>
    <label class="f">Date received<input type="date" name="date" value="${nowIso()}" max="${nowIso()}" required></label>
    <label class="f full">Reference <span class="hint">Check number, Zelle confirmation, envelope or deposit slip number</span><input name="ref" placeholder="e.g. Check #2041"></label>
    <label class="f full">Notes for the approver<textarea name="note" style="min-height:70px" placeholder="Who counted it, where it’s kept, anything unusual"></textarea></label>
    <label class="f full">Photo of the check or deposit slip <span class="hint">Optional. Only finance staff can see it.</span><input type="file" name="photo" accept="image/*"></label>
    <div class="notice full">${icon('shield')}<span>This gift won’t count in totals or the donor’s receipts until a different person with approval rights approves it.</span></div>
    <div class="full"><button class="btn" type="submit">Log for approval</button></div></form>`;
}
function ledgerRange(k) { const t = nowIso(); return k === '30' ? addDays(t, -30) : k === '90' ? addDays(t, -90) : k === '365' ? addDays(t, -365) : '0000-01-01'; }
function aFinance() {
  const f = UI.lf || {}, st = f.status || 'all', src = f.source || 'all', fund = f.fund || 'all', rng = f.range || '90', q = (UI.lq2 || '').toLowerCase();
  const from = ledgerRange(rng);
  const pending = S.donations.filter(d => d.status === 'pending').sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const y0 = nowIso().slice(0, 4) + '-01-01', m0 = nowIso().slice(0, 7);
  const ok = S.donations.filter(counted);
  const sum = arr => arr.reduce((s, d) => s + d.amount, 0);
  const list = S.donations.filter(d => d.date >= from && (st === 'all' || (d.status || 'approved') === st) && (src === 'all' || (d.source || 'online') === src) && (fund === 'all' || d.fund === fund) && (!q || (donorName(d) + ' ' + (d.ref || '') + ' ' + d.method).toLowerCase().includes(q))).sort((a, b) => b.date.localeCompare(a.date));
  const sel = (key, opts, cur) => `<select data-action-change="lf" data-k="${key}" style="width:auto;padding:7px 10px;font-size:14px" aria-label="${key}">${opts.map(([v, l]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  return `<div class="kpis">
    <div class="kpi"><div class="k">Approved this month</div><div class="v">${money(sum(ok.filter(d => d.date.slice(0, 7) === m0)))}</div><div class="d">${ok.filter(d => d.date.slice(0, 7) === m0).length} gifts</div></div>
    <div class="kpi ${pending.length ? 'attn' : ''}"><div class="k">Waiting for approval</div><div class="v">${pending.length}</div><div class="d">${money(sum(pending))} not yet counted</div></div>
    <div class="kpi"><div class="k">Online, this year</div><div class="v">${money(sum(ok.filter(d => d.date >= y0 && (d.source || 'online') === 'online')))}</div><div class="d">Card payments through the site</div></div>
    <div class="kpi"><div class="k">Logged by staff, this year</div><div class="v">${money(sum(ok.filter(d => d.date >= y0 && d.source === 'offline')))}</div><div class="d">Cash, checks, Zelle and other</div></div>
  </div>
  <div class="card"><h3>Waiting for approval</h3><p class="small muted">Two-person rule: whoever logs a gift can’t approve it. Another person with approval rights checks it against the cash, check or bank record.</p>
    ${pending.length ? pending.map(d => { const mine = d.loggedBy === me().id; return `<div class="queue-item"><div class="row between"><div><strong class="num">${money(d.amount)}</strong> · ${esc(fundName(d.fund))} · ${esc(d.method)}</div><span class="small muted">Received ${fmtDate(d.date)}</span></div>
      <div class="small">From <strong>${esc(donorName(d))}</strong>${d.ref ? ` · ${esc(d.ref)}` : ''}</div>
      <div class="small muted">Logged by ${who(d.loggedBy)} on ${fmtDate(d.loggedAt, { month: 'short', day: 'numeric' })}</div>
      ${d.note ? `<div class="small" style="background:var(--surface-2);padding:8px 10px;border-radius:8px">${esc(d.note)}</div>` : ''}${d.photo ? `<button class="link-btn small" style="justify-self:start" data-action="ledger-photo" data-id="${d.id}">View attached photo</button>` : ''}
      <div class="row">${can('approve') && !mine ? `<button class="btn sm" data-action="ledger-approve" data-id="${d.id}">${icon('check')} Approve</button><button class="btn ghost sm" data-action="ledger-reject" data-id="${d.id}">Reject</button>` : `<span class="chip">${mine ? 'You logged this, so someone else must approve it' : 'An executive will review this'}</span>`}</div></div>`; }).join('') : '<div class="empty">Nothing waiting. Everything logged has been reviewed.</div>'}
  </div>
  <div class="card"><h3>Log a gift received outside the site</h3><p class="small muted">For cash, checks, Zelle, bank transfers and the Jumu’ah collection box.</p>${logForm()}</div>
  <div class="card"><div class="row between" style="margin-bottom:10px"><h3 style="margin:0">Ledger</h3><button class="btn ghost sm" data-action="ledger-csv">Download CSV</button></div>
    <div class="row" style="margin-bottom:10px">${sel('range', [['30', 'Last 30 days'], ['90', 'Last 90 days'], ['365', 'Last 12 months'], ['all', 'All time']], rng)}${sel('status', [['all', 'Any status'], ['approved', 'Approved'], ['pending', 'Waiting'], ['rejected', 'Rejected'], ['voided', 'Voided']], st)}${sel('source', [['all', 'Online and offline'], ['online', 'Online'], ['offline', 'Logged by staff']], src)}${sel('fund', [['all', 'All funds'], ...FUNDS.map(x => [x.id, x.name])], fund)}
      <input type="search" placeholder="Search donor or reference" value="${esc(UI.lq2 || '')}" data-input="lq2" style="flex:1;min-width:180px" aria-label="Search the ledger"></div>
    <p class="small muted" style="margin:0 0 8px">${list.length} entries · ${money(sum(list.filter(counted)))} approved</p>
    <div class="table-wrap"><table><thead><tr><th>Date</th><th>Donor</th><th>Fund</th><th>Method</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>
    ${list.slice(0, UI.lmore ? 1000 : 60).map(d => `<tr><td>${fmtDate(d.date, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td>${esc(donorName(d))}</td><td>${esc(fundName(d.fund))}</td><td>${esc(d.method || 'Card')}${d.source === 'offline' ? '' : ' <span class="tiny muted">online</span>'}</td><td class="num">${money(d.amount)}</td><td>${STATUS_CHIP[d.status || 'approved']}</td><td><button class="link-btn small" data-action="ledger-detail" data-id="${d.id}">Details</button></td></tr>`).join('')}
    </tbody></table></div>
    ${list.length > 60 && !UI.lmore ? `<div style="margin-top:10px"><button class="btn ghost sm" data-action="ledger-more">Show all ${list.length}</button></div>` : ''}
  </div>`;
}
function downloadFile(name, text, type) {
  try { const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); return true; }
  catch (e) { return false; }
}
const csvRow = r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',');
Object.assign(A, {
  'log-donation': el => modal('Log a gift received outside the site', logForm(el.dataset.id)),
  'ledger-more': () => { UI.lmore = true; render(false); },
  'ledger-photo': el => modal('Attached photo', `<img src="${S.donations.find(d => d.id === el.dataset.id).photo}" alt="Check or deposit slip" style="border-radius:10px;width:100%">`),
  'ledger-approve': el => { const d = S.donations.find(x => x.id === el.dataset.id); if (d.loggedBy === me().id) return toast('Someone else must approve a gift you logged.'); d.status = 'approved'; d.approvedBy = me().id; d.approvedAt = nowIso();
    if (d.dues && d.userId) { const u = userById(d.userId); if (u) { u.tier = 'paid'; u.dues = 'active'; u.renews = addDays(d.date, 30); } }
    commit(`Approved. ${money(d.amount)} from ${donorName(d)} now counts in totals${d.userId ? ' and their receipts' : ''}.`); },
  'ledger-reject': el => modal('Reject this entry?', `<form class="form-grid" data-form="ledger-reject" data-id="${el.dataset.id}"><label class="f">Reason <span class="hint">The person who logged it will see this</span><textarea name="reason" required placeholder="e.g. Amount doesn’t match the deposit slip"></textarea></label><button class="btn danger block" type="submit">Reject entry</button></form>`),
  'ledger-void': el => modal('Void this gift?', `<form class="form-grid" data-form="ledger-void" data-id="${el.dataset.id}"><p class="small muted" style="margin:0">Voiding removes it from totals and receipts but keeps it in the ledger history.</p><label class="f">Reason<textarea name="reason" required placeholder="e.g. Check returned by the bank"></textarea></label><button class="btn danger block" type="submit">Void gift</button></form>`),
  'ledger-detail': el => { const d = S.donations.find(x => x.id === el.dataset.id); const st = d.status || 'approved';
    const trail = [d.source === 'offline' ? `Logged by ${who(d.loggedBy)} on ${fmtDate(d.loggedAt, { month: 'long', day: 'numeric', year: 'numeric' })}` : 'Paid online by card through the site', d.approvedBy && `Approved by ${who(d.approvedBy)} on ${fmtDate(d.approvedAt, { month: 'long', day: 'numeric', year: 'numeric' })}`, d.rejectedBy && `Rejected by ${who(d.rejectedBy)}: ${esc(d.reason)}`, d.voidedBy && `Voided by ${who(d.voidedBy)}: ${esc(d.voidReason)}`].filter(Boolean);
    modal('Gift details', `<div class="stack-sm"><div class="row between"><strong class="num" style="font-size:22px">${money(d.amount)}</strong>${STATUS_CHIP[st]}</div>
      <div class="small">${esc(donorName(d))} · ${esc(fundName(d.fund))} · ${esc(d.method || 'Card')}${d.freq && d.freq !== 'once' ? ' · ' + d.freq : ''}</div><div class="small muted">Received ${fmtLong(d.date)}${d.ref ? ' · ' + esc(d.ref) : ''}</div>
      ${d.note ? `<div class="small" style="background:var(--surface-2);padding:8px 10px;border-radius:8px">${esc(d.note)}</div>` : ''}${d.photo ? `<img src="${d.photo}" alt="" style="border-radius:10px">` : ''}
      <h4 style="margin:8px 0 0">History</h4><ul class="small prose" style="margin:0">${trail.map(t => `<li>${t}</li>`).join('')}</ul>
      ${st === 'pending' && can('approve') && d.loggedBy !== me().id ? `<div class="row"><button class="btn sm" data-action="ledger-approve" data-id="${d.id}">Approve</button><button class="btn ghost sm" data-action="ledger-reject" data-id="${d.id}">Reject</button></div>` : ''}
      ${st === 'approved' && can('approve') ? `<div><button class="btn ghost sm" data-action="ledger-void" data-id="${d.id}">Void this gift</button></div>` : ''}</div>`); },
  'ledger-csv': () => { const f = UI.lf || {}; const from = ledgerRange(f.range || '90'); const rows = S.donations.filter(d => d.date >= from).sort((a, b) => a.date.localeCompare(b.date));
    const csv = [csvRow(['Date', 'Donor', 'Fund', 'Method', 'Source', 'Amount', 'Frequency', 'Status', 'Reference', 'Logged by', 'Approved by']), ...rows.map(d => csvRow([d.date, donorName(d), fundName(d.fund), d.method || 'Card', d.source || 'online', d.amount, d.freq || 'once', d.status || 'approved', d.ref || '', d.loggedBy ? nameOf(d.loggedBy) : '', d.approvedBy ? nameOf(d.approvedBy) : '']))].join('\n');
    if (downloadFile(`AMJ-donations-${nowIso()}.csv`, csv, 'text/csv')) toast('Ledger downloaded.'); else toast('Downloads aren’t allowed here.'); }
});
Object.assign(CHANGE, { lf: el => { UI.lf = { ...(UI.lf || {}), [el.dataset.k]: el.value }; UI.lmore = false; render(false); } });
Object.assign(F, {
  async 'log-donation'(fd, form) {
    const amount = Math.round(+fd.get('amount') * 100) / 100; if (!(amount > 0)) return toast('Enter the amount received.');
    const name = fd.get('donor').trim(); const u = S.users.find(x => x.name.toLowerCase() === name.toLowerCase());
    const fund = fd.get('fund'); const photo = await readImage(fd.get('photo'), 1400);
    const d = { id: uid('d'), userId: u?.id || null, name: u ? null : name, fund: fund === 'dues' ? 'general' : fund, dues: fund === 'dues', amount, freq: 'once', date: fd.get('date') || nowIso(), method: fd.get('method'), source: 'offline', status: 'pending', ref: fd.get('ref').trim(), note: fd.get('note').trim(), photo, loggedBy: me().id, loggedAt: nowIso() };
    S.donations.push(d); closeModal(); form.reset();
    commit(`Logged ${money(amount)} from ${donorName(d)}. It counts once another approver signs off.`);
  },
  async 'ledger-reject'(fd, form) { const d = S.donations.find(x => x.id === form.dataset.id); d.status = 'rejected'; d.rejectedBy = me().id; d.rejectedAt = nowIso(); d.reason = fd.get('reason').trim(); closeModal(); commit('Entry rejected.'); },
  async 'ledger-void'(fd, form) { const d = S.donations.find(x => x.id === form.dataset.id); d.status = 'voided'; d.voidedBy = me().id; d.voidedAt = nowIso(); d.voidReason = fd.get('reason').trim(); closeModal(); commit('Gift voided. It no longer counts in totals.'); }
});

/* ================= Analytics ================= */
const RANGE_PRESETS = [['month', 'This month'], ['30', 'Last 30 days'], ['90', 'Last 90 days'], ['year', 'This year'], ['12m', 'Last 12 months'], ['custom', 'Custom']];
function getRange() {
  const r = UI.ar || { preset: '30' }, t = nowIso();
  let from = r.from, to = r.to || t;
  if (r.preset === 'month') from = t.slice(0, 8) + '01';
  if (r.preset === '30') from = addDays(t, -29);
  if (r.preset === '90') from = addDays(t, -89);
  if (r.preset === 'year') from = t.slice(0, 4) + '-01-01';
  if (r.preset === '12m') from = addDays(t, -364);
  if (r.preset !== 'custom') to = t;
  from = from || addDays(t, -29); if (from > to) [from, to] = [to, from];
  const days = Math.round((dIso(to) - dIso(from)) / 86400000) + 1;
  return { from, to, days, prevFrom: addDays(from, -days), prevTo: addDays(from, -1), label: `${fmtDate(from, { month: 'short', day: 'numeric', year: 'numeric' })} – ${fmtDate(to, { month: 'short', day: 'numeric', year: 'numeric' })}` };
}
const inR = (iso, a, b) => iso >= a && iso <= b;
function analyticsData(R) {
  const sum = arr => arr.reduce((s, d) => s + d.amount, 0);
  const gifts = S.donations.filter(d => counted(d) && inR(d.date, R.from, R.to));
  const prev = S.donations.filter(d => counted(d) && inR(d.date, R.prevFrom, R.prevTo));
  const donors = new Set(gifts.map(d => d.userId || ('n:' + (d.name || 'anon'))));
  const total = sum(gifts), ptotal = sum(prev);
  const recurring = sum(gifts.filter(d => d.freq && d.freq !== 'once'));
  const offline = sum(gifts.filter(d => d.source === 'offline'));
  const firstGift = S.donations.reduce((m, d) => d.date < m ? d.date : m, '9999'), firstJoin = S.users.reduce((m, u) => u.joined < m ? u.joined : m, '9999');
  const pct = (a, b, first) => (b && R.prevFrom >= first) ? Math.round((a - b) / b * 100) : null;
  // series
  const weekly = R.days <= 62, series = [];
  if (weekly) { for (let s = R.from; s <= R.to; s = addDays(s, 7)) { const e = addDays(s, 6) > R.to ? R.to : addDays(s, 6); series.push({ label: fmtDate(s, { month: 'short', day: 'numeric' }), value: sum(gifts.filter(d => inR(d.date, s, e))) }); } }
  else { let m = R.from.slice(0, 7); const end = R.to.slice(0, 7); while (m <= end) { series.push({ label: new Date(m + '-15T12:00:00Z').toLocaleDateString('en-US', { month: 'short', year: R.days > 370 ? '2-digit' : undefined, timeZone: 'UTC' }), value: sum(gifts.filter(d => d.date.slice(0, 7) === m)) }); const [y, mo] = m.split('-').map(Number); m = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 7); } }
  const byFund = [...FUNDS.map(f => ({ label: f.name, value: sum(gifts.filter(d => d.fund === f.id)) }))].filter(x => x.value).sort((a, b) => b.value - a.value);
  const methods = [...new Set(gifts.map(d => d.method || 'Card'))];
  const byMethod = methods.map(m => ({ label: m === 'Card' ? 'Card (online)' : m, value: sum(gifts.filter(d => (d.method || 'Card') === m)) })).sort((a, b) => b.value - a.value);
  const donorTotals = {}; gifts.forEach(d => { const k = d.userId || null; if (!k) return; donorTotals[k] = donorTotals[k] || { name: nameOf(k), gifts: 0, total: 0 }; donorTotals[k].gifts++; donorTotals[k].total += d.amount; });
  const topDonors = Object.values(donorTotals).sort((a, b) => b.total - a.total).slice(0, 10);
  // members
  const users = S.users.filter(u => u.status !== 'invited');
  const paid = users.filter(u => u.tier === 'paid');
  const newM = users.filter(u => inR(u.joined, R.from, R.to)), prevNew = users.filter(u => inR(u.joined, R.prevFrom, R.prevTo));
  const duesCollected = sum(gifts.filter(d => d.dues));
  const months = []; for (let i = 5; i >= 0; i--) { const d = new Date(R.to + 'T12:00:00Z'); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i); months.push(d.toISOString().slice(0, 7)); }
  const joinSeries = months.map(k => ({ label: new Date(k + '-15T12:00:00Z').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }), value: users.filter(u => u.joined.slice(0, 7) === k).length }));
  const providers = ['Google', 'Facebook', 'Email', 'Added by staff'].map(p => ({ label: p, value: users.filter(u => u.provider === p).length })).filter(x => x.value);
  // engagement
  const evs = S.events.filter(e => inR(e.date, R.from, addDays(R.to, 60))).sort((a, b) => a.date.localeCompare(b.date)).map(e => [e.title, fmtDate(e.date), e.rsvps.length + (e.capacity ? ' / ' + e.capacity : '')]);
  const progs = S.programs.map(p => [p.title, p.audience, p.regs.length]);
  const shifts = S.shifts.map(s => [s.title, `${s.signups.length} / ${s.slots}`, Math.round(s.signups.length / s.slots * 100) + '%']);
  const topics = S.topics.filter(t => inR(t.date, R.from, R.to)).length, replies = S.topics.reduce((s, t) => s + t.replies.filter(r => inR(r.date, R.from, R.to)).length, 0);
  const photos = S.gallery.filter(g => inR(g.date, R.from, R.to));
  const imamQ = S.inbox.filter(i => i.kind === 'imam' && inR(i.date, R.from, R.to));
  const bookings = S.inbox.filter(i => i.kind === 'booking' && inR(i.date, R.from, R.to));
  // communications
  const msgs = S.messages.filter(m => inR(m.date, R.from, R.to));
  const reqs = msgs.filter(m => m.action);
  const emails = S.emails.filter(e => inR(e.date, R.from, R.to));
  const active = users.filter(u => u.status === 'active');
  const subs = PREF_KEYS.map(([k, l]) => ({ label: l, value: active.filter(u => (u.prefs || {})[k] !== false).length }));
  return {
    giving: { total, ptotal, delta: pct(total, ptotal, firstGift), prevComplete: R.prevFrom >= firstGift, count: gifts.length, pcount: prev.length, donors: donors.size, avg: gifts.length ? total / gifts.length : 0, recurringPct: total ? Math.round(recurring / total * 100) : 0, offlinePct: total ? Math.round(offline / total * 100) : 0, zakat: sum(gifts.filter(d => d.fund === 'zakat' || d.fund === 'fitr')), pending: S.donations.filter(d => d.status === 'pending').length },
    series, weekly, byFund, byMethod, topDonors,
    members: { total: users.length, paid: paid.length, free: users.length - paid.length, newCount: newM.length, prevNew: prevNew.length, delta: pct(newM.length, prevNew.length, firstJoin), overdue: users.filter(u => u.dues === 'overdue').length, expectedMonthly: paid.length * S.settings.tiers.monthly, duesCollected, suspended: users.filter(u => u.status === 'suspended').length },
    joinSeries, providers,
    engagement: { evs, progs, shifts, topics, replies, photos: photos.length, photosApproved: photos.filter(g => g.status === 'approved').length, imamQ: imamQ.length, imamAnswered: imamQ.filter(i => i.status !== 'new').length, bookings: bookings.length, rsvps: S.events.reduce((s, e) => s + e.rsvps.length, 0) },
    comms: { msgs: msgs.length, reqs: reqs.length, responses: reqs.reduce((s, m) => s + m.responses.length, 0), emails: emails.length, emailRecipients: emails.reduce((s, e) => s + e.count, 0), subs }
  };
}
const SECTIONS = [['giving', 'Giving summary'], ['trend', 'Giving over time'], ['funds', 'Giving by fund'], ['methods', 'How people give'], ['donors', 'Top donors'], ['members', 'Membership'], ['engagement', 'Community engagement'], ['comms', 'Communications']];
const STATS = {
  giving: [['total', 'Total given'], ['count', 'Number of gifts'], ['donors', 'Donors'], ['avg', 'Average gift'], ['recurring', 'Recurring share'], ['offline', 'Given offline'], ['zakat', 'Zakat and zakat al-fitr']],
  members: [['total', 'Total members'], ['paid', 'Supporting members'], ['new', 'New members'], ['overdue', 'Dues overdue'], ['expected', 'Expected monthly dues'], ['collected', 'Dues collected']]
};
function repState() {
  if (!UI.rep) UI.rep = { sections: Object.fromEntries(SECTIONS.map(([k]) => [k, k !== 'donors'])), stats: { giving: Object.fromEntries(STATS.giving.map(([k]) => [k, true])), members: Object.fromEntries(STATS.members.map(([k]) => [k, true])) }, charts: true, tables: true, hideNames: true, notes: '', title: '' };
  return UI.rep;
}
const deltaChip = (d, unit = 'vs previous period') => d === null ? `<span class="tiny muted">No earlier data</span>` : `<span class="delta ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}%</span> <span class="tiny muted">${unit}</span>`;
function statTile(sec, key, label, value, sub) {
  const rep = repState(); const on = rep.stats[sec][key];
  return `<div class="kpi stat ${on ? '' : 'off'}"><label class="stat-pick" title="Include in report"><input type="checkbox" data-action-change="rep-stat" data-sec="${sec}" data-k="${key}" ${on ? 'checked' : ''} aria-label="Include ${esc(label)} in the report"></label><div class="k">${label}</div><div class="v">${value}</div><div class="d">${sub || ''}</div></div>`;
}
function secHead(key, title, sub) {
  const on = repState().sections[key];
  return `<div class="row between" style="align-items:flex-start;margin-bottom:8px"><div><h3 style="margin:0">${title}</h3>${sub ? `<p class="small muted" style="margin:2px 0 0">${sub}</p>` : ''}</div><label class="check small sec-pick"><input type="checkbox" data-action-change="rep-sec" data-k="${key}" ${on ? 'checked' : ''}> In report</label></div>`;
}
function miniTable(head, rows) { return rows.length ? `<div class="table-wrap" style="margin-top:10px"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<div class="empty small">No data in this period.</div>'; }
function aAnalytics() {
  const R = getRange(), D = analyticsData(R), rep = repState(), pr = (UI.ar || {}).preset || '30';
  const g = D.giving, m = D.members, e = D.engagement, c = D.comms;
  const totalBySeries = D.series.map(s => ({ ...s }));
  return `<div class="card"><div class="row between" style="align-items:flex-end"><div><h3 style="margin:0">Period</h3><p class="small muted" style="margin:2px 0 0">${R.label} · compared with the ${R.days} days before</p></div>
    <div class="row"><button class="btn gold sm report-jump" data-action="goto-report">${icon('download')} Build a PDF report</button>${pr === 'custom' ? `<input type="date" value="${R.from}" data-action-change="ar-from" style="width:auto" aria-label="From"><input type="date" value="${R.to}" max="${nowIso()}" data-action-change="ar-to" style="width:auto" aria-label="To">` : ''}</div></div>
    <div class="filter-row" style="margin:12px 0 0">${RANGE_PRESETS.map(([k, l]) => `<button data-action="ar" data-v="${k}" class="${pr === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
  <div class="analytics-layout"><div class="stack">
    <div class="card">${secHead('giving', 'Giving summary', g.pending ? `${g.pending} logged gift${g.pending === 1 ? '' : 's'} still waiting for approval aren’t included.` : 'Approved gifts only.')}
      <div class="kpis kpis-3">${statTile('giving', 'total', 'Total given', money(g.total), deltaChip(g.delta))}${statTile('giving', 'count', 'Number of gifts', g.count, g.prevComplete ? `${g.pcount} the period before` : 'No full earlier period to compare')}${statTile('giving', 'donors', 'Donors', g.donors, 'Named donors and anonymous groups')}${statTile('giving', 'avg', 'Average gift', money(Math.round(g.avg)), '')}${statTile('giving', 'recurring', 'Recurring share', g.recurringPct + '%', 'From monthly or yearly gifts')}${statTile('giving', 'offline', 'Given offline', g.offlinePct + '%', 'Cash, checks, Zelle logged by staff')}${statTile('giving', 'zakat', 'Zakat and zakat al-fitr', money(g.zakat), 'Kept separate for eligible recipients')}</div></div>
    <div class="card">${secHead('trend', 'Giving over time', D.weekly ? 'By week' : 'By month')}${columns(totalBySeries, { fmt: money, unit: '' })}</div>
    <div class="grid g2"><div class="card">${secHead('funds', 'Giving by fund')}${barsH(D.byFund, money)}</div><div class="card">${secHead('methods', 'How people give')}${barsH(D.byMethod, money)}</div></div>
    <div class="card">${secHead('donors', 'Top donors', 'Named donors only. Turn on “Hide donor names” for reports shared beyond the executive team.')}${miniTable(['Donor', 'Gifts', 'Total'], D.topDonors.map(d => [d.name, d.gifts, money(d.total)]))}</div>
    <div class="card">${secHead('members', 'Membership')}
      <div class="kpis kpis-3">${statTile('members', 'total', 'Total members', m.total, `${m.free} free · ${m.suspended} suspended`)}${statTile('members', 'paid', 'Supporting members', m.paid, Math.round(m.paid / Math.max(1, m.total) * 100) + '% of members')}${statTile('members', 'new', 'New members', m.newCount, deltaChip(m.delta))}${statTile('members', 'overdue', 'Dues overdue', m.overdue, 'Supporting members behind on dues')}${statTile('members', 'expected', 'Expected monthly dues', money(m.expectedMonthly), `${m.paid} × ${money(S.settings.tiers.monthly)}`)}${statTile('members', 'collected', 'Dues collected', money(m.duesCollected), 'In this period')}</div>
      <div class="grid g2" style="margin-top:12px"><div><h4>New members by month</h4>${columns(D.joinSeries, { unit: ' new members' })}</div><div><h4>How members sign in</h4>${barsH(D.providers)}</div></div></div>
    <div class="card">${secHead('engagement', 'Community engagement')}
      <div class="kpis kpis-3"><div class="kpi"><div class="k">Forum activity</div><div class="v">${e.topics + e.replies}</div><div class="d">${e.topics} topics, ${e.replies} replies</div></div><div class="kpi"><div class="k">Ask the Imam</div><div class="v">${e.imamQ}</div><div class="d">${e.imamAnswered} answered</div></div><div class="kpi"><div class="k">Photos shared</div><div class="v">${e.photos}</div><div class="d">${e.photosApproved} published</div></div></div>
      <h4 style="margin-top:14px">Events and RSVPs</h4>${miniTable(['Event', 'Date', 'Going'], e.evs)}<h4 style="margin-top:14px">Class registrations</h4>${miniTable(['Program', 'For', 'Registered'], e.progs)}<h4 style="margin-top:14px">Volunteer shifts</h4>${miniTable(['Shift', 'Filled', 'Fill rate'], e.shifts)}</div>
    <div class="card">${secHead('comms', 'Communications')}
      <div class="kpis kpis-3"><div class="kpi"><div class="k">Messages sent</div><div class="v">${c.msgs}</div><div class="d">${c.reqs} requests, ${c.responses} responses</div></div><div class="kpi"><div class="k">Emails queued</div><div class="v">${c.emails}</div><div class="d">${c.emailRecipients} recipients in total</div></div></div>
      <h4 style="margin-top:14px">Email subscribers by type</h4>${barsH(c.subs)}</div>
    <div class="card"><h3>Website visits</h3><p class="small muted" style="margin:0">Visits, top pages and devices appear here once Vercel Web Analytics is turned on for the project. Nothing is tracked yet, so no numbers are shown.</p></div>
  </div>
  <aside class="report-panel"><form class="card stack-sm" data-form="report"><h3 style="margin:0">Build a PDF report</h3><p class="small muted" style="margin:0">Tick sections here or with the “In report” boxes. Tick or untick individual figures on their tiles.</p>
    <label class="f">Report title<input name="title" value="${esc(rep.title || 'Executive report')}" data-action-change="rep-title"></label>
    <div class="stack-sm">${SECTIONS.map(([k, l]) => `<label class="check small"><input type="checkbox" data-action-change="rep-sec" data-k="${k}" ${rep.sections[k] ? 'checked' : ''}> ${l}</label>`).join('')}</div>
    <hr style="border:0;border-top:1px solid var(--line);margin:4px 0">
    <label class="check small"><input type="checkbox" data-action-change="rep-opt" data-k="charts" ${rep.charts ? 'checked' : ''}> Include charts</label>
    <label class="check small"><input type="checkbox" data-action-change="rep-opt" data-k="tables" ${rep.tables ? 'checked' : ''}> Include tables</label>
    <label class="check small"><input type="checkbox" data-action-change="rep-opt" data-k="hideNames" ${rep.hideNames ? 'checked' : ''}> Hide donor names</label>
    <label class="f">Notes for the board <span class="hint">Optional, printed at the top</span><textarea name="notes" style="min-height:70px" data-action-change="rep-notes">${esc(rep.notes)}</textarea></label>
    <button class="btn gold block" type="submit">${icon('download')} Download PDF</button>
    <button class="btn ghost block" type="button" data-action="report-csv">Download data (CSV)</button>
    <p class="tiny muted" style="margin:0">Covers ${R.label}. Reports include only approved gifts.</p></form></aside></div>`;
}
Object.assign(A, {
  ar: el => { UI.ar = { ...(UI.ar || {}), preset: el.dataset.v }; if (el.dataset.v === 'custom' && !UI.ar.from) { UI.ar.from = addDays(nowIso(), -29); UI.ar.to = nowIso(); } render(false); },
  'report-csv': () => { const R = getRange(), D = analyticsData(R), rep = repState(); const lines = [csvRow(['Atlanta Muslim Jamaat', rep.title || 'Executive report']), csvRow(['Period', R.label]), '', csvRow(['Metric', 'Value']),
      csvRow(['Total given', D.giving.total]), csvRow(['Number of gifts', D.giving.count]), csvRow(['Donors', D.giving.donors]), csvRow(['Average gift', Math.round(D.giving.avg)]), csvRow(['Zakat and zakat al-fitr', D.giving.zakat]), csvRow(['Total members', D.members.total]), csvRow(['Supporting members', D.members.paid]), csvRow(['New members', D.members.newCount]), csvRow(['Dues overdue', D.members.overdue]), '',
      csvRow([D.weekly ? 'Week of' : 'Month', 'Given']), ...D.series.map(s => csvRow([s.label, s.value])), '', csvRow(['Fund', 'Given']), ...D.byFund.map(s => csvRow([s.label, s.value])), '', csvRow(['Method', 'Given']), ...D.byMethod.map(s => csvRow([s.label, s.value]))];
    if (downloadFile(`AMJ-analytics-${R.from}-to-${R.to}.csv`, lines.join('\n'), 'text/csv')) toast('Data downloaded.'); else toast('Downloads aren’t allowed here.'); },
  'goto-report': () => $('.report-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  'perms-reset': () => { S.perms = null; commit('Permissions reset to the recommended setup.'); }
});
Object.assign(CHANGE, {
  'ar-from': el => { UI.ar = { ...(UI.ar || {}), preset: 'custom', from: el.value }; render(false); },
  'ar-to': el => { UI.ar = { ...(UI.ar || {}), preset: 'custom', to: el.value }; render(false); },
  'rep-sec': el => { repState().sections[el.dataset.k] = el.checked; const y = scrollY; render(false); scrollTo(0, y); },
  'rep-stat': el => { repState().stats[el.dataset.sec][el.dataset.k] = el.checked; el.closest('.kpi').classList.toggle('off', !el.checked); },
  'rep-opt': el => { repState()[el.dataset.k] = el.checked; },
  'rep-title': el => { repState().title = el.value; },
  'rep-notes': el => { repState().notes = el.value; },
  perm: el => { if (!can('roles')) return; const r = el.dataset.role, p = el.dataset.perm; S.perms = S.perms || JSON.parse(JSON.stringify(DEFAULT_PERMS)); const set = new Set(S.perms[r] || []); el.checked ? set.add(p) : set.delete(p); if (el.checked) set.add('overview'); S.perms[r] = PERM_KEYS.filter(k => set.has(k)); save(); toast(`${ROLE_LABEL[r]}: ${el.checked ? 'can now' : 'can no longer'} ${PERM_ROWS.find(x => x[0] === p)[1].toLowerCase()}.`); }
});

/* ================= PDF report ================= */
function loadScript(src) { return new Promise((res, rej) => { if ([...document.scripts].some(s => s.src.endsWith(src))) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(s); }); }
async function loadPdf() {
  if (!(window.jspdf && window.jspdf.jsPDF)) await loadScript('/vendor/jspdf.umd.min.js');
  if (!window.jspdf.jsPDF.API.autoTable) await loadScript('/vendor/jspdf.plugin.autotable.min.js');
  return window.jspdf.jsPDF;
}
function emblemPng() {
  return new Promise(res => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 160; c.getContext('2d').drawImage(img, 0, 0, 160, 160); res(c.toDataURL('image/png')); }; img.onerror = () => res(null); img.src = S.settings.logo || ('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(EMBLEM.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" '))); });
}
const pdfText = s => String(s ?? '').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/•/g, '-').replace(/×/g, 'x').replace(/ﷺ/g, '(pbuh)').replace(/[^\x00-\xFF]/g, '');
async function buildReport() {
  const jsPDF = await loadPdf();
  const R = getRange(), D = analyticsData(R), rep = repState(), u = me();
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 46, CW = W - M * 2;
  const GREEN = [14, 77, 58], GOLD = [194, 154, 61], INK = [24, 33, 28], MUTED = [96, 112, 104], LINE = [216, 226, 219], SOFT = [238, 243, 239];
  let y = 0;
  const logo = await emblemPng();
  const ensure = h => { if (y + h > H - 52) { doc.addPage(); y = M; } };
  const heading = (t, sub) => { ensure(46); y += 8; doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...GREEN); doc.text(pdfText(t), M, y + 12); if (sub) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED); doc.text(pdfText(sub), M, y + 26); y += 12; } doc.setDrawColor(...GOLD); doc.setLineWidth(1.2); doc.line(M, y + 20, M + 36, y + 20); y += 32; };
  const tiles = items => { const cols = 3, gap = 10, tw = (CW - gap * (cols - 1)) / cols, th = 54; items.forEach((it, i) => { if (i % cols === 0) ensure(th + gap); const x = M + (i % cols) * (tw + gap), ty = y; doc.setFillColor(...SOFT); doc.setDrawColor(...LINE); doc.roundedRect(x, ty, tw, th, 5, 5, 'FD'); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED); doc.text(pdfText(it[0]), x + 10, ty + 16); doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...INK); doc.text(pdfText(it[1]), x + 10, ty + 36); if (it[2]) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED); doc.text(pdfText(it[2]), x + 10, ty + 48, { maxWidth: tw - 16 }); } if (i % cols === cols - 1 || i === items.length - 1) y += th + gap; }); y += 4; };
  const colChart = (rows, fmt = v => String(v)) => { if (!rows.length) return; const ch = 150; ensure(ch + 26); const max = Math.max(1, ...rows.map(r => r.value)), base = y + ch, bw = Math.min(34, CW / rows.length * .6), step = CW / rows.length;
    doc.setDrawColor(...LINE); doc.setLineWidth(.6); [0, .5, 1].forEach(f => { const gy = base - (ch - 18) * f; doc.line(M, gy, M + CW, gy); doc.setFontSize(7); doc.setTextColor(...MUTED); doc.text(pdfText(fmt(Math.round(max * f))), M, gy - 3); });
    rows.forEach((r, i) => { const h = (ch - 18) * r.value / max, x = M + step * i + (step - bw) / 2; doc.setFillColor(...GREEN); if (h > 0) doc.rect(x, base - h, bw, h, 'F'); doc.setFontSize(7); doc.setTextColor(...MUTED); doc.text(pdfText(r.label), x + bw / 2, base + 11, { align: 'center' }); });
    const last = rows[rows.length - 1]; doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...INK); doc.text(pdfText(fmt(last.value)), M + step * (rows.length - 1) + step / 2, base - (ch - 18) * last.value / max - 4, { align: 'center' }); doc.setFont('helvetica', 'normal');
    y = base + 24; };
  const barChart = (rows, fmt = v => String(v)) => { if (!rows.length) return; const rh = 20, lw = 150; ensure(rows.length * rh + 10); const max = Math.max(1, ...rows.map(r => r.value)), bw = CW - lw - 70;
    rows.forEach((r, i) => { const ry = y + i * rh; doc.setFontSize(8.5); doc.setTextColor(...INK); let lab = pdfText(r.label); while (lab.length > 4 && doc.getTextWidth(lab) > lw - 12) lab = lab.slice(0, -2).trimEnd() + '…'; lab = lab.replace(/……$/, '…'); doc.text(lab.replace('…', '...'), M + lw - 8, ry + 12, { align: 'right' }); const w = Math.max(2, bw * r.value / max); doc.setFillColor(...GREEN); doc.rect(M + lw, ry + 4, w, 11, 'F'); doc.setTextColor(...MUTED); doc.text(pdfText(fmt(r.value)), M + lw + w + 6, ry + 12); });
    y += rows.length * rh + 10; };
  const table = (head, body) => { if (!body.length) return; ensure(40); doc.autoTable({ startY: y, head: [head.map(pdfText)], body: body.map(r => r.map(pdfText)), margin: { left: M, right: M }, styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 5, textColor: INK, lineColor: LINE, lineWidth: .5 }, headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [247, 250, 248] }, theme: 'grid' }); y = doc.lastAutoTable.finalY + 14; };
  const para = (t, size = 9.5, color = INK) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(...color); const lines = doc.splitTextToSize(pdfText(t), CW); ensure(lines.length * size * 1.35 + 4); doc.text(lines, M, y + size); y += lines.length * size * 1.35 + 6; };

  // Cover band
  doc.setFillColor(...GREEN); doc.rect(0, 0, W, 92, 'F');
  if (logo) doc.addImage(logo, 'PNG', M, 22, 48, 48);
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(19); doc.text(pdfText(S.settings.name), M + 62, 44);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(232, 214, 160); doc.text(pdfText(rep.title || 'Executive report'), M + 62, 62);
  y = 118; doc.setFontSize(9.5); doc.setTextColor(...MUTED);
  doc.text(pdfText(`Period: ${R.label}  (compared with the previous ${R.days} days)`), M, y); y += 14;
  doc.text(pdfText(`Prepared by ${u.name}${u.title ? ', ' + u.title : ''} on ${fmtLong(nowIso())}`), M, y); y += 14;
  doc.setTextColor(...GOLD); doc.setFont('helvetica', 'bold'); doc.text('CONFIDENTIAL - FOR EXECUTIVE COMMITTEE USE', M, y); doc.setFont('helvetica', 'normal'); y += 18;
  if (rep.notes.trim()) { heading('Notes'); para(rep.notes); }

  const g = D.giving, m = D.members, e = D.engagement, c = D.comms, st = rep.stats;
  const dtxt = (d, w = 'previous period') => d === null ? 'No earlier data' : `${d >= 0 ? '+' : '-'}${Math.abs(d)}% vs ${w}`;
  if (rep.sections.giving) { heading('Giving summary', g.pending ? `${g.pending} logged gifts awaiting approval are not included.` : 'Approved gifts only.');
    tiles([st.giving.total && ['Total given', money(g.total), dtxt(g.delta)], st.giving.count && ['Number of gifts', String(g.count), g.prevComplete ? `${g.pcount} the period before` : ''], st.giving.donors && ['Donors', String(g.donors), ''], st.giving.avg && ['Average gift', money(Math.round(g.avg)), ''], st.giving.recurring && ['Recurring share', g.recurringPct + '%', 'Monthly or yearly gifts'], st.giving.offline && ['Given offline', g.offlinePct + '%', 'Cash, checks, Zelle'], st.giving.zakat && ['Zakat and zakat al-fitr', money(g.zakat), 'Held for eligible recipients']].filter(Boolean)); }
  if (rep.sections.trend) { heading('Giving over time', D.weekly ? 'By week' : 'By month'); if (rep.charts) colChart(D.series, money); if (rep.tables) table([D.weekly ? 'Week of' : 'Month', 'Given'], D.series.map(s => [s.label, money(s.value)])); }
  if (rep.sections.funds) { heading('Giving by fund'); if (rep.charts) barChart(D.byFund, money); if (rep.tables) { const t = D.byFund.reduce((s, x) => s + x.value, 0) || 1; table(['Fund', 'Given', 'Share'], D.byFund.map(x => [x.label, money(x.value), Math.round(x.value / t * 100) + '%'])); } }
  if (rep.sections.methods) { heading('How people give'); if (rep.charts) barChart(D.byMethod, money); if (rep.tables) table(['Method', 'Given'], D.byMethod.map(x => [x.label, money(x.value)])); }
  if (rep.sections.donors) { heading('Top donors', rep.hideNames ? 'Names hidden for privacy.' : 'Named donors only.'); table(['Donor', 'Gifts', 'Total'], D.topDonors.map((d, i) => [rep.hideNames ? `Donor ${i + 1}` : d.name, String(d.gifts), money(d.total)])); }
  if (rep.sections.members) { heading('Membership');
    tiles([st.members.total && ['Total members', String(m.total), `${m.free} free, ${m.suspended} suspended`], st.members.paid && ['Supporting members', String(m.paid), Math.round(m.paid / Math.max(1, m.total) * 100) + '% of members'], st.members.new && ['New members', String(m.newCount), dtxt(m.delta)], st.members.overdue && ['Dues overdue', String(m.overdue), ''], st.members.expected && ['Expected monthly dues', money(m.expectedMonthly), `${m.paid} x ${money(S.settings.tiers.monthly)}`], st.members.collected && ['Dues collected', money(m.duesCollected), 'In this period']].filter(Boolean));
    if (rep.charts) { ensure(200); para('New members by month', 9, MUTED); colChart(D.joinSeries); } if (rep.tables) table(['Sign-in method', 'Members'], D.providers.map(p => [p.label, String(p.value)])); }
  if (rep.sections.engagement) { heading('Community engagement'); tiles([['Forum activity', String(e.topics + e.replies), `${e.topics} topics, ${e.replies} replies`], ['Ask the Imam', String(e.imamQ), `${e.imamAnswered} answered`], ['Photos shared', String(e.photos), `${e.photosApproved} published`]]);
    if (rep.tables) { table(['Event', 'Date', 'Going'], e.evs.map(r => r.map(String))); table(['Program', 'For', 'Registered'], e.progs.map(r => r.map(String))); table(['Volunteer shift', 'Filled', 'Fill rate'], e.shifts.map(r => r.map(String))); } }
  if (rep.sections.comms) { heading('Communications'); tiles([['Messages sent', String(c.msgs), `${c.reqs} requests, ${c.responses} responses`], ['Emails queued', String(c.emails), `${c.emailRecipients} recipients`]]); if (rep.charts) barChart(c.subs); }

  const n = doc.internal.getNumberOfPages();
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setDrawColor(...LINE); doc.setLineWidth(.5); doc.line(M, H - 34, W - M, H - 34); doc.setFontSize(7.5); doc.setTextColor(...MUTED); doc.text(pdfText(`${S.settings.name} - ${rep.title || 'Executive report'} - ${R.label}`), M, H - 22); doc.text(`Page ${i} of ${n}`, W - M, H - 22, { align: 'right' }); }
  return { doc, name: `AMJ-${(rep.title || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${R.from}-to-${R.to}.pdf` };
}
Object.assign(F, {
  async report(fd, form) {
    const rep = repState(); rep.title = fd.get('title'); rep.notes = fd.get('notes');
    if (!Object.values(rep.sections).some(Boolean)) return toast('Pick at least one section for the report.');
    toast('Building your report…');
    try { const { doc, name } = await buildReport(); doc.save(name); toast('Report downloaded: ' + name); }
    catch (err) { console.error(err); toast('The PDF tool didn’t load. Check your connection and try again.'); }
  }
});
