/* ================= Core ================= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const para = s => esc(s).split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
const money = n => '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: Number(n) % 1 ? 2 : 0 });
const STORE_KEY = 'amj-preview-v2';
let S;
function load() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const s = JSON.parse(raw); if (s && s.v === 2) { if (!s.resources.some(r => r.id === 'r-install')) s.resources.unshift(INSTALL_RESOURCE); return s; } } } catch (e) {}
  return seed();
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); return true; }
  catch (e) { return false; }
}

/* Icons */
const IC = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5c2.3.3 4 1.9 4.5 4.5"/>',
  heart: '<path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  map: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.4-7 8-7s7 2.5 8 7"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
  building: '<path d="M3 21h18M5 21V10l7-5 7 5v11M10 21v-5h4v5"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
  bars: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5L12 13l8.5-6.5"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V11m0-3a1.5 1.5 0 0 1 3 0v5.5c0 4-2.5 7.5-6.5 7.5-2.5 0-4-1.2-5.5-3.5L3.2 14a1.5 1.5 0 0 1 2.5-1.6L8 15"/>',
  gift: '<path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1-2-2.3-3.5-4-3.5a1.8 1.8 0 0 0 0 3.5zm0 0c1-2 2.3-3.5 4-3.5a1.8 1.8 0 0 1 0 3.5z"/>',
  pin: '<path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/>'
};
const icon = (k, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k] || ''}</svg>`;
const EMBLEM = `<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="10" fill="#0E4D3A"/><path d="M9 31h22v-3.5c0-6.2-4.7-10.4-11-12.6-6.3 2.2-11 6.4-11 12.6z" fill="#C29A3D"/><rect x="8" y="31" width="24" height="2.2" rx="1.1" fill="#C29A3D"/><circle cx="20" cy="9" r="3.4" fill="#C29A3D"/><circle cx="21.5" cy="8.2" r="2.9" fill="#0E4D3A"/></svg>`;

/* ================= Time helpers (Eastern time) ================= */
const TZ = 'America/New_York';
const dIso = iso => new Date(iso + 'T12:00:00Z');
const fmtDate = (iso, o = { weekday: 'short', month: 'short', day: 'numeric' }) => dIso(iso).toLocaleDateString('en-US', { ...o, timeZone: 'UTC' });
const fmtLong = iso => fmtDate(iso, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const fmtTime = d => d.toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const hm12 = hhmm => { if (!hhmm) return ''; let [h, m] = hhmm.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; };
function tzOff(date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(date).map(x => [x.type, x.value]));
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
  return Math.round((date.getTime() - wall) / 60000);
}
function etDate(iso, hhmm) { const [y, m, d] = iso.split('-').map(Number); const [h, mi] = hhmm.split(':').map(Number); const t = Date.UTC(y, m - 1, d, h, mi); return new Date(t + tzOff(new Date(t)) * 60000); }
const nowIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
function hijri(iso) {
  for (const cal of ['islamic-umalqura', 'islamic']) {
    try { return new Intl.DateTimeFormat('en-US-u-ca-' + cal, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dIso(iso)); } catch (e) {}
  }
  return '';
}
const PRAYERS = [['fajr', 'Fajr'], ['sunrise', 'Sunrise'], ['dhuhr', 'Dhuhr'], ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha']];
function dayTimes(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const st = S.settings;
  const t = PT.compute(y, m, d, st.lat, st.lng, st.method, st.asr);
  const iq = {};
  for (const k of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const rule = st.iqamah[k];
    if (rule.mode === 'fixed') iq[k] = etDate(iso, rule.value);
    else {
      let ms = t[k].getTime() + rule.value * 60000;
      if (k !== 'maghrib') { const step = 5 * 60000; ms = Math.ceil(ms / step) * step; }
      iq[k] = new Date(ms);
    }
  }
  const friday = dIso(iso).getUTCDay() === 5;
  return { t, iq, friday };
}
function nextPrayer() {
  const now = Date.now(), iso = nowIso();
  const { t, iq, friday } = dayTimes(iso);
  for (const k of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    if (t[k].getTime() > now) return { key: k, at: t[k], iq: iq[k], friday: friday && k === 'dhuhr', iso };
  }
  const tm = addDays(iso, 1); const n = dayTimes(tm);
  return { key: 'fajr', at: n.t.fajr, iq: n.iq.fajr, friday: false, iso: tm, tomorrow: true };
}
const pName = (k, friday) => friday && k === 'dhuhr' ? 'Jumu’ah' : (PRAYERS.find(p => p[0] === k) || [, k])[1];
function untilText(ms) { const m = Math.max(0, Math.round(ms / 60000)); const h = Math.floor(m / 60), r = m % 60; return h ? `${h} hr ${r} min` : `${r} min`; }

/* ================= Users & roles ================= */
const me = () => S.users.find(u => u.id === S.currentUserId) || null;
const userById = id => S.users.find(u => u.id === id);
const level = () => { const u = me(); if (!u) return 'visitor'; return u.tier === 'paid' ? 'paid' : 'free'; };
const isMember = () => level() !== 'visitor';
/* Staff roles and what each can manage */
const ROLES = [['member', 'Member'], ['moderator', 'Moderator'], ['editor', 'Editor'], ['admin', 'Admin'], ['superadmin', 'Super admin']];
const ROLE_LABEL = Object.fromEntries(ROLES);
const PERMS = {
  superadmin: ['overview', 'content', 'messages', 'inbox', 'members', 'roles', 'events', 'gallery', 'forum', 'email', 'prayer', 'site', 'integrations'],
  admin: ['overview', 'content', 'messages', 'inbox', 'members', 'events', 'gallery', 'forum', 'email', 'prayer', 'site'],
  editor: ['overview', 'content', 'events', 'gallery'],
  moderator: ['overview', 'forum', 'gallery'],
  member: []
};
const roleOf = u => (u && PERMS[u.role]) ? u.role : 'member';
const can = p => PERMS[roleOf(me())].includes(p);
const isStaff = () => roleOf(me()) !== 'member';
const isAdmin = () => can('members');
const canPost = () => isMember() && me().status !== 'suspended';
const initials = n => (n || '?').replace(/\(.*?\)/g, '').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
const nameOf = id => id === 'admin' ? 'Masjid admin' : (userById(id)?.name || 'Former member');
/* Content helpers: drafts, scheduling, rich text */
const isLive = it => { const st = it.status || 'published'; if (st === 'published') return true; if (st === 'scheduled') return etDate(it.pubDate || it.date, it.pubTime || '08:00').getTime() <= Date.now(); return false; };
function sanitize(html) {
  const tpl = document.createElement('template'); tpl.innerHTML = String(html || '');
  const OK = { P: 1, BR: 1, STRONG: 1, B: 1, EM: 1, I: 1, U: 1, H2: 1, H3: 1, UL: 1, OL: 1, LI: 1, A: 1, BLOCKQUOTE: 1, DIV: 1 };
  const clean = node => {
    [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 8) return ch.remove();
      if (ch.nodeType !== 1) return;
      if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|svg|SVG|TEMPLATE)$/.test(ch.tagName)) return ch.remove();
      clean(ch);
      if (!OK[ch.tagName]) { ch.replaceWith(...ch.childNodes); return; }
      const href = ch.getAttribute('href');
      [...ch.attributes].forEach(at => ch.removeAttribute(at.name));
      if (ch.tagName === 'A') { if (href && /^(https?:|mailto:|#)/i.test(href.trim())) { ch.setAttribute('href', href.trim()); if (!href.startsWith('#')) { ch.setAttribute('target', '_blank'); ch.setAttribute('rel', 'noopener'); } } }
    });
  };
  clean(tpl.content);
  return tpl.innerHTML;
}
const richHTML = it => it.html ? sanitize(it.html) : para(it.body || '');
const plainOf = it => { if (!it.html) return it.body || ''; const t = document.createElement('template'); t.innerHTML = sanitize(it.html).replace(/<\/(p|h2|h3|li|blockquote|div)>/g, ' </$1>'); return t.content.textContent.replace(/\s+/g, ' ').trim(); };
const excerpt = (it, n = 140) => { const s = plainOf(it); return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s; };
const canSeePost = p => isLive(p) && (p.audience === 'public' || !p.audience || (p.audience === 'members' && isMember()) || (p.audience === 'paid' && (level() === 'paid' || isStaff())));

/* ================= Shell ================= */
const NAV = [
  ['Visit & pray', [['prayer-times', 'Prayer times'], ['jumuah', 'Jumu’ah'], ['visit', 'Location & parking'], ['ramadan', 'Ramadan & Eid']]],
  ['Learn', [['learn', 'Learn Islam guides'], ['khutbahs', 'Khutbah summaries'], ['library', 'Resource library']]],
  ['Community', [['news', 'News & announcements'], ['events', 'Events calendar'], ['programs', 'Classes & programs'], ['volunteer', 'Volunteer'], ['community', 'Community forum', 'Members'], ['gallery', 'Photo gallery']]],
  ['Give', [['donate', 'Donate'], ['zakat', 'Zakat calculator'], ['membership', 'Membership']]],
  ['Get in touch', [['ask-imam', 'Ask the Imam'], ['booking', 'Book the facility'], ['about', 'About & contact']]]
];
const TOP = [['prayer-times', 'Prayer times'], ['jumuah', 'Jumu’ah'], ['learn', 'Learn'], ['events', 'Events'], ['community', 'Community'], ['donate', 'Give']];
const TABS = [['home', 'Home', 'home'], ['prayer-times', 'Prayer', 'moon'], ['learn', 'Learn', 'book'], ['community', 'Community', 'users'], ['donate', 'Give', 'heart']];
const section = r => r.split('-')[0];
function routeGroup(r) {
  if (r.startsWith('learn')) return 'learn';
  if (r.startsWith('topic')) return 'community';
  if (r === 'zakat') return 'donate';
  if (r.startsWith('khutbah')) return 'khutbahs';
  if (r.startsWith('news')) return 'news';
  if (r.startsWith('article')) return 'library';
  if (r.startsWith('admin')) return 'admin';
  return r;
}
function logoHTML() { return S.settings.logo ? `<img src="${S.settings.logo}" alt="">` : EMBLEM; }

function renderShell(route) {
  const g = routeGroup(route);
  const u = me();
  const a = S.settings.alert;
  $('#alert').innerHTML = a && !sessionDismissed ? `<div class="alert-bar ${esc(a.kind)}" role="status"><span>${a.kind === 'janazah' ? '<strong>Janazah</strong> · ' : a.kind === 'closure' ? '<strong>Closure</strong> · ' : a.kind === 'weather' ? '<strong>Weather</strong> · ' : '<strong>Notice</strong> · '}${esc(a.text)}</span><button class="x" data-action="dismiss-alert" aria-label="Dismiss">×</button></div>` : '';
  $('#brand-mark').innerHTML = logoHTML();
  $('#nav-main').innerHTML = TOP.map(([r, l]) => `<a href="#${r}" class="${g === r ? 'on' : ''}">${l}</a>`).join('');
  $('#acct-btn').innerHTML = u ? `<span class="avatar" title="${esc(u.name)}">${initials(u.name)}</span>` : icon('user');
  $('#acct-btn').setAttribute('aria-label', u ? 'Your account' : 'Sign in');
  $('#tabs').innerHTML = TABS.map(([r, l, i]) => `<a href="#${r}" class="${g === r ? 'on' : ''}">${icon(i)}<span>${l}</span></a>`).join('');
  $('#drawer-body').innerHTML = `
    <div class="row between"><a href="#home" class="brand" style="padding:0"><span class="mark">${logoHTML()}</span><span class="name">${esc(S.settings.name)}</span></a>
    <button class="icon-btn" data-action="close-drawer" aria-label="Close menu">${icon('x')}</button></div>
    ${NAV.map(([h, items]) => `<h4>${h}</h4>${items.map(([r, l, lock]) => `<a href="#${r}" class="${g === r ? 'on' : ''}">${l}${lock && !isMember() ? `<span class="lock">${lock}</span>` : ''}</a>`).join('')}`).join('')}
    <h4>Account</h4>
    <a href="#account">${u ? 'My account' : 'Sign in or join'}</a>
    <a href="#save-to-phone" class="${g === 'save-to-phone' ? 'on' : ''}">Save this site to your phone</a>
    ${isStaff() ? `<a href="#admin" class="${g === 'admin' ? 'on' : ''}">Admin dashboard ${pendingCount() ? `<span class="badge">${pendingCount()}</span>` : ''}</a>` : ''}`;
  const others = S.users.filter(x => x.custom);
  $('#role-select').innerHTML = [['visitor', 'Visitor'], ['u0', 'Free member'], ['u1', 'Supporting member'], ['u3', 'Moderator'], ['u2', 'Editor'], ['admin', 'Super admin'], ...others.map(o => [o.id, 'You: ' + o.name])]
    .map(([v, l]) => `<option value="${v}" ${(S.currentUserId || 'visitor') === v ? 'selected' : ''}>${esc(l)}</option>`).join('');
}
let sessionDismissed = false;

/* ================= Prayer clock hero ================= */
function heroHTML() {
  const iso = nowIso();
  const { t, iq, friday } = dayTimes(iso);
  const np = nextPrayer();
  const now = Date.now();
  const jum = S.settings.jumuah[0];
  const sub = np.friday
    ? `Khutbah ${hm12(jum.khutbah)} · Salah ${hm12(jum.salah)}`
    : `Iqamah ${fmtTime(np.iq)}${np.tomorrow ? ' · tomorrow' : ''}`;
  const tiles = PRAYERS.map(([k, n]) => {
    const isNext = !np.tomorrow && k === np.key;
    const past = t[k].getTime() < now && !isNext;
    const lab = pName(k, friday);
    let iqTxt = k === 'sunrise' ? 'Fajr ends' : (friday && k === 'dhuhr') ? 'Khutbah ' + hm12(jum.khutbah).replace(' PM', '') : 'Iqamah ' + fmtTime(iq[k]).replace(/ [AP]M/, '');
    return `<div class="time ${isNext ? 'next-on' : ''} ${past ? 'past' : ''}"><div class="n">${lab}</div><div class="a">${fmtTime(t[k])}</div><div class="i">${iqTxt}</div></div>`;
  }).join('');
  return `
    <canvas class="pattern" aria-hidden="true"></canvas>
    <div class="date-line"><span>${fmtLong(iso)}</span><span class="hijri">${hijri(iso)}</span></div>
    <div class="next" aria-live="polite">
      <div class="label">Next prayer</div>
      <div class="big">${pName(np.key, np.friday)} <span class="t num">${fmtTime(np.at).replace(/ ([AP]M)/, '<small style="font-size:.42em"> $1</small>')}</span></div>
      <div class="sub">in ${untilText(np.at - now)} · ${sub}</div>
    </div>
    <div class="arc-wrap">${arcSVG(t, friday)}</div>
    <div class="times">${tiles}</div>
    <div class="actions">
      <a class="btn gold sm" href="#prayer-times">${icon('cal')} Monthly timetable</a>
      <a class="btn light sm" href="${mapsUrl()}" target="_blank" rel="noopener">${icon('map')} Directions</a>
    </div>`;
}
function arcSVG(t, friday) {
  const W = 360, base = 92, top = 14, L = 8, Rr = W - 8;
  const start = t.fajr.getTime() - 30 * 60000, end = t.isha.getTime() + 50 * 60000;
  const X = ms => L + (Rr - L) * (ms - start) / (end - start);
  const sr = t.sunrise.getTime(), ss = t.sunset.getTime();
  const Y = ms => (ms <= sr || ms >= ss) ? base : base - (base - top) * Math.sin(Math.PI * (ms - sr) / (ss - sr));
  const pts = []; for (let i = 0; i <= 48; i++) { const ms = sr + (ss - sr) * i / 48; pts.push([X(ms), Y(ms)]); }
  const sunPath = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  const now = Math.min(Math.max(Date.now(), start), end);
  const donePts = pts.filter(p => p[0] <= X(now));
  const done = donePts.length > 1 ? 'M' + donePts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') : '';
  const marks = [['fajr', 'below', 'start'], ['dhuhr', 'above', 'middle'], ['asr', 'above', 'start'], ['maghrib', 'below', 'end'], ['isha', 'below', 'start']];
  const mk = marks.map(([k, pos, anchor]) => {
    const ms = t[k].getTime(), x = X(ms), y = Y(ms);
    const dx = anchor === 'start' ? -4 : anchor === 'end' ? 6 : 0;
    const ty = pos === 'below' ? base + 18 : y - 11;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${ms < Date.now() ? 'var(--gold)' : 'var(--hero)'}" stroke="var(--gold)" stroke-width="2"/>
      <text x="${(x + dx).toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}" font-size="11.5" font-weight="600" fill="currentColor" opacity=".85">${pName(k, friday)}</text>`;
  }).join('');
  const nx = X(now), ny = Y(now);
  return `<svg viewBox="0 0 ${W} 116" role="img" aria-label="Today’s prayers along the sun’s path">
    <line x1="${L}" y1="${base}" x2="${Rr}" y2="${base}" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="2 4"/>
    <path d="${sunPath}" fill="none" stroke="currentColor" stroke-opacity=".28" stroke-width="2"/>
    ${done ? `<path d="${done}" fill="none" stroke="var(--gold)" stroke-width="2.5"/>` : ''}
    ${Date.now() > t.fajr.getTime() ? `<line x1="${X(t.fajr.getTime()).toFixed(1)}" y1="${base}" x2="${Math.min(X(now), X(sr)).toFixed(1)}" y2="${base}" stroke="var(--gold)" stroke-width="2.5"/>` : ''}
    ${Date.now() > ss ? `<line x1="${X(ss).toFixed(1)}" y1="${base}" x2="${X(now).toFixed(1)}" y2="${base}" stroke="var(--gold)" stroke-width="2.5"/>` : ''}
    ${mk}
    <circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="9" fill="var(--gold)" opacity=".25"/>
    <circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="5" fill="var(--gold)"/>
  </svg>`;
}
function drawPattern(canvas) {
  if (!canvas) return;
  const r = canvas.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = r.width * dpr; canvas.height = r.height * dpr;
  const c = canvas.getContext('2d'); c.scale(dpr, dpr);
  c.strokeStyle = '#D6B25C'; c.lineWidth = 1;
  const s = 46;
  for (let y = -s; y < r.height + s; y += s) for (let x = -s; x < r.width + s; x += s) {
    const cx = x + s / 2, cy = y + s / 2, R = s * 0.42;
    for (let k = 0; k < 2; k++) {
      c.beginPath();
      for (let i = 0; i < 4; i++) { const a = Math.PI / 4 * k + Math.PI / 2 * i; const px = cx + R * Math.cos(a), py = cy + R * Math.sin(a); i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.closePath(); c.stroke();
    }
    c.beginPath(); c.arc(cx, cy, R * 0.32, 0, Math.PI * 2); c.stroke();
  }
}
const mapsUrl = () => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(S.settings.address);
const mapsSearch = () => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(S.settings.address);
const appleMaps = () => 'https://maps.apple.com/?daddr=' + encodeURIComponent(S.settings.address);

/* Generated sample photos (placeholders until real photos are uploaded) */
const ART_CACHE = {};
function artSrc(n) {
  if (ART_CACHE[n]) return ART_CACHE[n];
  const pal = [['#0E4D3A', '#2E8B67', '#E7C873'], ['#3B2A5A', '#C0794C', '#F2C46D'], ['#123A52', '#3C8DA8', '#F0E2B6'], ['#1F2B24', '#5E7D4E', '#D9B65C'], ['#5B3A1E', '#C9A24A', '#F6EED9'], ['#2B1B3D', '#E07A4F', '#F9D58B'], ['#0F3D3E', '#7CB8A4', '#F3E3C3']][n % 7];
  const cv = document.createElement('canvas'); cv.width = 640; cv.height = 480;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 480); g.addColorStop(0, pal[1]); g.addColorStop(1, pal[0]); c.fillStyle = g; c.fillRect(0, 0, 640, 480);
  c.fillStyle = pal[2]; c.globalAlpha = .9; c.beginPath(); c.arc(470, 150, 46, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1; c.fillStyle = pal[0];
  c.beginPath(); c.moveTo(150, 360); c.bezierCurveTo(150, 250, 230, 210, 320, 180); c.bezierCurveTo(410, 210, 490, 250, 490, 360); c.fill();
  c.fillRect(110, 360, 420, 120); c.fillRect(70, 200, 26, 280); c.beginPath(); c.moveTo(70, 200); c.lineTo(83, 160); c.lineTo(96, 200); c.fill();
  c.fillRect(544, 200, 26, 280); c.beginPath(); c.moveTo(544, 200); c.lineTo(557, 160); c.lineTo(570, 200); c.fill();
  c.fillStyle = pal[2]; c.globalAlpha = .55;
  for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(190 + i * 64, 480); c.lineTo(190 + i * 64, 420); c.arc(206 + i * 64, 420, 16, Math.PI, 0); c.lineTo(222 + i * 64, 480); c.fill(); }
  return ART_CACHE[n] = cv.toDataURL('image/jpeg', .8);
}
const photoSrc = g => g.src || artSrc(g.art || 0);
