/* ================= UI plumbing ================= */
const UI = {};
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 3400); }
function modal(title, html) {
  $('#modal-root').innerHTML = `<div class="modal-scrim" data-action="scrim"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="mh"><h3>${esc(title)}</h3><button class="icon-btn" data-action="close-modal" aria-label="Close">${icon('x')}</button></div>${html}</div></div>`;
  setTimeout(() => $('#modal-root input:not([type=hidden]):not([type=checkbox]), #modal-root textarea, #modal-root button.btn')?.focus(), 30);
}
function closeModal() { $('#modal-root').innerHTML = ''; }
function commit(msg) { const ok = save(); render(false); if (msg) toast(ok ? msg : msg + ' (not saved in this browser)'); }
function readImage(file, max = 1100) {
  return new Promise((res, rej) => {
    if (!file || !file.size) return res(null);
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height); const isPng = /png/.test(file.type); res(c.toDataURL(isPng ? 'image/png' : 'image/jpeg', .8)); }; img.onerror = rej; img.src = r.result; };
    r.onerror = rej; r.readAsDataURL(file);
  });
}
function requireMember() {
  if (!isMember()) { toast('Sign in or join for free first.'); location.hash = 'account'; return false; }
  if (!canPost()) { toast('Your account is suspended. Contact the masjid office.'); return false; }
  return true;
}
function zakatCalc() {
  const z = UI.z || {}; const n = S.settings.nisab; const basis = z.basis || 'silver';
  const nisab = basis === 'gold' ? 87.48 * n.goldPerGram : 612.36 * n.silverPerGram;
  const total = ['cash', 'gold', 'invest', 'business', 'owed'].reduce((s, k) => s + (+z[k] || 0), 0) - (+z.debts || 0);
  return { nisab, total, due: total >= nisab ? Math.round(total * 2.5) / 100 : 0 };
}

/* ================= Public actions ================= */
const A = {
  'open-drawer': () => document.body.classList.add('drawer-open'),
  'close-drawer': () => document.body.classList.remove('drawer-open'),
  'dismiss-alert': () => { sessionDismissed = true; renderShell(route()); },
  month: el => { const cur = UI.month || nowIso().slice(0, 7); const d = +el.dataset.d; if (!d) UI.month = null; else { const [y, m] = cur.split('-').map(Number); const nd = new Date(Date.UTC(y, m - 1 + d, 1)); UI.month = nd.toISOString().slice(0, 7); } render(false); },
  topic: el => { UI.topic = el.dataset.v; render(false); },
  ecat: el => { UI.ecat = el.dataset.v; render(false); },
  fcat: el => { UI.fcat = el.dataset.v; render(false); },
  rsvp: el => { if (!requireMember()) return; const e = S.events.find(x => x.id === el.dataset.id); const i = e.rsvps.indexOf(me().id); if (i < 0 && e.capacity && e.rsvps.length >= e.capacity) return toast('This event is full.'); i >= 0 ? e.rsvps.splice(i, 1) : e.rsvps.push(me().id); commit(i >= 0 ? 'RSVP removed.' : 'You’re going. See you there!'); },
  register: el => { if (!requireMember()) return; const p = S.programs.find(x => x.id === el.dataset.id); const i = p.regs.indexOf(me().id); i >= 0 ? p.regs.splice(i, 1) : p.regs.push(me().id); commit(i >= 0 ? 'Registration cancelled.' : 'Registered. The teacher will be in touch.'); },
  shift: el => { if (!requireMember()) return; const s = S.shifts.find(x => x.id === el.dataset.id); const i = s.signups.indexOf(me().id); i >= 0 ? s.signups.splice(i, 1) : s.signups.push(me().id); commit(i >= 0 ? 'Removed from the shift.' : 'Thank you for volunteering!'); },
  fund: el => { UI.fund = el.dataset.v; if (el.dataset.amt) UI.amt = +el.dataset.amt; if (route().startsWith('donate')) render(false); },
  amt: el => { UI.amt = +el.dataset.v; render(false); },
  freq: el => { UI.freq = el.dataset.v; render(false); },
  zbasis: el => { UI.z = { ...(UI.z || {}), basis: el.dataset.v }; const y = scrollY; render(false); scrollTo(0, y); },
  'pay-zakat': () => { const z = zakatCalc(); UI.fund = 'zakat'; UI.amt = z.due || 50; UI.freq = 'once'; setTimeout(() => scrollTo({ top: 0, behavior: 'smooth' }), 0); render(false); },
  'checkout-ok': () => { const f = UI.onCheckout; closeModal(); f && f(); },
  'close-modal': closeModal,
  scrim: (el, e) => { if (e.target === el) closeModal(); },
  upgrade: el => {
    if (!requireMember()) return;
    const plan = el.dataset.v, t = S.settings.tiers, amt = plan === 'yearly' ? t.yearly : t.monthly;
    checkoutModal({ title: 'Supporting membership', amount: amt, freq: plan, fund: 'Supporting member dues', onDone: () => { const u = me(); u.tier = 'paid'; u.dues = 'active'; u.renews = addDays(nowIso(), plan === 'yearly' ? 365 : 30); S.donations.push({ id: uid('d'), userId: u.id, fund: 'general', amount: amt, freq: plan, date: nowIso(), dues: true }); commit('Welcome, supporting member. Jazakallahu khairan!'); } });
  },
  'cancel-membership': () => modal('Cancel supporting membership?', `<p>You’ll keep your free community membership. Your dues stop at the next renewal.</p><div class="row"><button class="btn danger" data-action="cancel-yes">Cancel membership</button><button class="btn ghost" data-action="close-modal">Keep it</button></div>`),
  'cancel-yes': () => { const u = me(); u.tier = 'free'; u.dues = null; u.renews = null; closeModal(); commit('Supporting membership cancelled.'); },
  oauth: el => modal('Continue with ' + el.dataset.v, `<form class="form-grid" data-form="oauth" data-v="${el.dataset.v}"><div class="notice">${icon('shield')}<span>On the live site, ${el.dataset.v} asks you to approve sign-in. For this preview, enter a name to create a demo account.</span></div><label class="f">Name<input name="name" required></label><label class="f">Email<input name="email" type="email" required></label><button class="btn block" type="submit">Create account</button></form>`),
  signout: () => { S.currentUserId = null; commit('Signed out.'); location.hash = 'home'; },
  respond: el => { const m = S.messages.find(x => x.id === el.dataset.id); m.responses.push({ userId: me().id, answer: el.dataset.v || m.action }); commit('Thanks, your response was sent to the admins.'); },
  receipt: el => { const d = S.donations.find(x => x.id === el.dataset.id); const txt = `${S.settings.name}\nReceipt ${d.id.toUpperCase()}\nDate: ${fmtLong(d.date)}\nFund: ${FUNDS.find(f => f.id === d.fund)?.name}\nAmount: ${money(d.amount)}${d.freq !== 'once' ? ' (' + d.freq + ')' : ''}${d.method ? '\nPaid by: ' + d.method : ''}\nDonor: ${nameOf(d.userId) || d.name}`; UI.copyText = txt; modal('Donation receipt', `<pre style="white-space:pre-wrap;font:15px/1.6 var(--font-body);background:var(--surface-2);padding:14px;border-radius:12px;margin:0 0 12px">${esc(txt)}</pre><p class="tiny muted">Tax-deductibility wording will be added once the board confirms the masjid’s nonprofit status.</p><button class="btn" data-action="copy">Copy receipt</button>`); },
  copy: async () => { try { await navigator.clipboard.writeText(UI.copyText || ''); toast('Copied.'); } catch (e) { toast('Copy isn’t allowed here. Select the text and copy it instead.'); } },
  'new-topic': () => { if (!requireMember()) return; modal('New topic', `<form class="form-grid" data-form="topic"><label class="f">Category<select name="cat">${S.forumCats.map(c => `<option>${esc(c)}</option>`).join('')}</select></label><label class="f">Title<input name="title" required maxlength="120"></label><label class="f">Message<textarea name="body" required></textarea></label><button class="btn block" type="submit">Post topic</button></form>`); },
  like: el => { const t = S.topics.find(x => x.id === el.dataset.id); const i = t.likes.indexOf(me().id); i >= 0 ? t.likes.splice(i, 1) : t.likes.push(me().id); commit(); },
  'like-reply': el => { const t = S.topics.find(x => x.id === el.dataset.id); const r = t.replies.find(x => x.id === el.dataset.r); const i = r.likes.indexOf(me().id); i >= 0 ? r.likes.splice(i, 1) : r.likes.push(me().id); commit(); },
  'del-reply': el => { const t = S.topics.find(x => x.id === el.dataset.id); t.replies = t.replies.filter(r => r.id !== el.dataset.r); commit('Reply removed.'); },
  report: el => { const t = S.topics.find(x => x.id === el.dataset.id); t.reports = (t.reports || 0) + 1; commit('Reported. A moderator will review it.'); },
  'upload-photo': () => { if (!requireMember()) return; modal('Submit a photo', `<form class="form-grid" data-form="photo"><label class="f">Photo<input type="file" name="file" accept="image/*" required></label><label class="f">Caption<input name="caption" required placeholder="e.g. Potluck dinner, November"></label><label class="check"><input type="checkbox" required> I took this photo or have permission to share it, and everyone shown is happy to be in the gallery.</label><button class="btn block" type="submit">Send for approval</button></form>`); },
  'need-login': () => requireMember(),
  lightbox: el => { const g = S.gallery.find(x => x.id === el.dataset.id); modal(g.caption, `<img src="${photoSrc(g)}" alt="${esc(g.caption)}" style="border-radius:12px;width:100%"><p class="small muted" style="margin-top:10px">Shared by ${esc(nameOf(g.by))} · ${fmtDate(g.date, { month: 'long', day: 'numeric', year: 'numeric' })}</p>`); },
  'discuss-khutbah': el => { if (!requireMember()) return; const k = S.khutbahs.find(x => x.id === el.dataset.id); const t = { id: uid('t'), cat: 'Islamic knowledge', title: 'Khutbah discussion: ' + k.title, body: excerpt({ html: k.html, body: k.summary }, 400), authorId: 'admin', date: nowIso(), pinned: false, locked: false, likes: [], replies: [], khutbahId: k.id }; S.topics.unshift(t); save(); location.hash = 'topic-' + t.id; },
  mentor: () => modal('Request a mentor', `<form class="form-grid" data-form="mentor"><label class="f">Name<input name="from" required value="${esc(me()?.name || '')}"></label><label class="f">Email or phone<input name="email" required value="${esc(me()?.email || '')}"></label><label class="f">Anything you’d like us to know<textarea name="body"></textarea></label><button class="btn block" type="submit">Send request</button></form>`)
};
const CHANGE = {};

/* ================= Public forms ================= */
const F = {
  async imam(fd, form) { const anon = fd.get('anon'); S.inbox.push({ id: uid('i'), kind: 'imam', date: nowIso(), from: anon ? 'Anonymous' : (fd.get('from') || 'Anonymous'), email: anon ? '' : fd.get('email'), subject: fd.get('topic') + ' question', body: fd.get('body'), status: 'new', reply: '', userId: anon ? null : me()?.id }); form.reset(); commit('Your question was sent privately to the imam.'); },
  async booking(fd, form) { S.inbox.push({ id: uid('i'), kind: 'booking', date: nowIso(), from: fd.get('from'), email: fd.get('email'), subject: `${fd.get('type')} — ${fmtDate(fd.get('date'), { weekday: 'long', month: 'long', day: 'numeric' })}`, body: `${fd.get('space')}, about ${fd.get('guests')} guests. ${fd.get('body')}`, status: 'new', reply: '', userId: me()?.id }); form.reset(); commit('Request sent. An admin will confirm by email.'); },
  async contact(fd, form) { S.inbox.push({ id: uid('i'), kind: 'contact', date: nowIso(), from: fd.get('from'), email: fd.get('email'), subject: fd.get('subject'), body: fd.get('body'), status: 'new', reply: '', userId: me()?.id }); form.reset(); commit('Message sent. Jazakallahu khairan.'); },
  async mentor(fd) { S.inbox.push({ id: uid('i'), kind: 'mentor', date: nowIso(), from: fd.get('from'), email: fd.get('email'), subject: 'New Muslim mentor request', body: fd.get('body') || '—', status: 'new', reply: '', userId: me()?.id }); closeModal(); commit('Request sent. Someone will reach out soon.'); },
  async donate(fd) {
    const amount = +fd.get('amount'); if (!(amount > 0)) return toast('Enter an amount of at least $1.');
    const fund = UI.fund || 'sadaqah', freq = UI.freq || 'once';
    checkoutModal({ title: 'Confirm your gift', amount, freq, fund: FUNDS.find(f => f.id === fund).name, onDone: () => { S.donations.push({ id: uid('d'), userId: fd.get('anon') ? null : me()?.id || null, name: fd.get('anon') ? 'Anonymous' : fd.get('name') || 'Guest', fund, amount, freq, date: nowIso(), method: 'Card' }); commit(`Thank you. ${money(amount)} to ${FUNDS.find(f => f.id === fund).name} received${me() ? '; your receipt is in your account' : ''}.`); } });
  },
  async signup(fd) { createUser(fd.get('name'), fd.get('email'), 'Email', !!fd.get('news')); },
  async oauth(fd, form) { createUser(fd.get('name'), fd.get('email'), form.dataset.v, true); closeModal(); },
  async profile(fd) { const u = me(); u.name = fd.get('name') || u.name; u.email = fd.get('email') || u.email; u.volunteer = !!fd.get('volunteer'); commit('Profile saved.'); },
  async prefs(fd) { const u = me(); u.prefs = Object.fromEntries(PREF_KEYS.map(([k]) => [k, !!fd.get(k)])); commit('Email preferences saved.'); },
  async reply(fd, form) { if (!requireMember()) return; const t = S.topics.find(x => x.id === form.dataset.id); t.replies.push({ id: uid('c'), authorId: me().id, body: fd.get('body'), date: nowIso(), likes: [] }); commit('Reply posted.'); },
  async topic(fd) { const t = { id: uid('t'), cat: fd.get('cat'), title: fd.get('title'), body: fd.get('body'), authorId: me().id, date: nowIso(), pinned: false, locked: false, likes: [], replies: [] }; S.topics.unshift(t); closeModal(); save(); location.hash = 'topic-' + t.id; toast('Topic posted.'); },
  async photo(fd) { const src = await readImage(fd.get('file')); S.gallery.push({ id: uid('g'), src, caption: fd.get('caption'), by: me().id, date: nowIso(), status: 'pending' }); closeModal(); commit('Photo sent. It will appear once an admin approves it.'); }
};
function createUser(name, email, provider, emails) {
  const all = emails !== false;
  const u = { id: uid('u'), name: name.trim(), email: email.trim(), phone: '', tier: 'free', role: 'member', status: 'active', joined: nowIso(), provider, dues: null, renews: null, custom: true, notes: '', prefs: { announcements: all, news: all, articles: all, events: all, khutbah: all, alerts: true } };
  S.users.push(u); S.currentUserId = u.id; save();
  toast(`Welcome, ${u.name.split(' ')[0]}! You’re now a community member.`);
  location.hash = 'account'; render(false);
}
