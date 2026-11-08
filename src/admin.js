/* ================= Admin: shared ================= */
const PREF_KEYS = [['announcements', 'Member announcements'], ['news', 'News posts'], ['articles', 'New articles and resources'], ['events', 'New events'], ['khutbah', 'Khutbah summaries'], ['alerts', 'Urgent alerts such as janazah and closures']];
const KIND_PREF = { announcement: 'announcements', news: 'news', article: 'articles', resource: 'articles', khutbah: 'khutbah', event: 'events', alert: 'alerts', message: 'announcements' };
const approvable = () => S.donations.filter(d => d.status === 'pending' && d.loggedBy !== me()?.id);
const pendingCount = () => (can('approve') ? approvable().length : 0) + (can('gallery') ? S.gallery.filter(g => g.status === 'pending').length : 0) + (can('inbox') ? S.inbox.filter(i => i.status === 'new').length : 0) + (can('forum') ? S.topics.filter(t => t.reports > 0).length : 0);
const ADMIN_NAV = [
  ['', 'Overview', 'overview'], ['analytics', 'Analytics & reports', 'analytics'], ['finance', 'Donations ledger', 'finance'], ['content', 'Posts & content', 'content'], ['members', 'Members & team', 'members'], ['messages', 'Message members', 'messages'],
  ['inbox', 'Inbox', 'inbox'], ['events', 'RSVPs & volunteers', 'events'], ['gallery', 'Gallery approvals', 'gallery'], ['forum', 'Forum moderation', 'forum'],
  ['email', 'Email notifications', 'email'], ['prayer', 'Prayer & Jumu’ah', 'prayer'], ['site', 'Site settings', 'site'], ['integrations', 'Connections', 'integrations']
];
const CK = {
  news: { label: 'News post', desc: 'A public update on the site', coll: 'posts', ic: 'mail' },
  announcement: { label: 'Announcement', desc: 'For members or supporting members', coll: 'posts', ic: 'bell' },
  article: { label: 'Article', desc: 'Long-form writing for the library', coll: 'resources', ic: 'book' },
  resource: { label: 'Resource link', desc: 'An app, lecture, video or website', coll: 'resources', ic: 'arrow' },
  khutbah: { label: 'Khutbah summary', desc: 'Friday topic, takeaways and media', coll: 'khutbahs', ic: 'mic' },
  event: { label: 'Event', desc: 'A calendar entry with RSVPs', coll: 'events', ic: 'cal' }
};
const kindOf = (it, coll) => coll === 'posts' ? (it.type === 'announcement' ? 'announcement' : 'news') : coll === 'resources' ? (it.type === 'article' ? 'article' : 'resource') : coll === 'khutbahs' ? 'khutbah' : 'event';
const allContent = () => ['posts', 'resources', 'khutbahs', 'events'].flatMap(c => S[c].map(it => ({ kind: kindOf(it, c), it })));
const findContent = (kind, id) => S[CK[kind].coll].find(x => x.id === id);
const statusOf = it => { const s = it.status || 'published'; return s === 'scheduled' && isLive(it) ? 'published' : s; };
const viewHref = (kind, it) => ({ news: '#news-' + it.id, announcement: '#news-' + it.id, article: '#article-' + it.id, resource: '#library', khutbah: '#khutbah-' + it.id, event: '#events' })[kind];
const statusChip = it => { const s = statusOf(it); return s === 'draft' ? '<span class="chip warn">Draft</span>' : s === 'scheduled' ? `<span class="chip gold">Scheduled · ${fmtDate(it.pubDate, { month: 'short', day: 'numeric' })}</span>` : '<span class="chip ok">Published</span>'; };
const subscribers = (pref, audience) => S.users.filter(u => u.status === 'active' && (u.prefs || {})[pref] !== false && (audience !== 'paid' || u.tier === 'paid'));
function queueEmail(kind, it, audience) {
  const n = subscribers(KIND_PREF[kind], audience).length;
  S.emails.unshift({ id: uid('em'), date: nowIso(), kind, subject: it.title, excerpt: excerpt(it.html || it.body ? it : { body: it.desc || it.summary || '' }, 220), link: viewHref(kind, it) || '#home', count: n, status: S.integrations.resend ? 'sent' : 'waiting', sendAt: it.status === 'scheduled' ? it.pubDate : null });
  return n;
}
const noAccess = () => `<div class="card gate"><div class="lock-ico">${icon('lock')}</div><h2>You don’t have access to this section</h2><p class="muted">Ask a super admin to change your role.</p></div>`;

function vAdmin(sec = '') {
  if (!isStaff()) return `<div class="card gate"><div class="lock-ico">${icon('shield')}</div><h2>Staff only</h2><p class="muted">Sign in with a staff account to manage the site. In this preview, set “View as” at the top of the page to Super admin.</p></div>`;
  if (['posts', 'khutbahs', 'library'].includes(sec)) sec = 'content';
  let title, body;
  if (sec.startsWith('edit-')) { const [, kind, id] = sec.match(/^edit-([a-z]+)-(.+)$/) || []; if (!CK[kind]) return notFound(); if (!can('content')) return noAccess(); title = (id === 'new' ? 'New ' : 'Edit ') + CK[kind].label.toLowerCase(); body = aEditor(kind, id); sec = 'content'; }
  else if (sec.startsWith('member-')) { if (!can('members')) return noAccess(); const u = userById(sec.slice(7)); if (!u) return notFound(); title = u.name; body = aMember(u); sec = 'members'; }
  else { const nav = ADMIN_NAV.find(n => n[0] === sec); if (!nav) return notFound(); if (!can(nav[2])) return noAccess(); title = nav[1]; body = ({ '': aOverview, analytics: aAnalytics, finance: aFinance, content: aContent, members: aMembers, messages: aMessages, inbox: aInbox, events: aEvents, gallery: aGallery, forum: aForum, email: aEmail, prayer: aPrayer, site: aSite, integrations: aIntegrations })[sec](); }
  const badges = { finance: can('approve') && approvable().length, inbox: can('inbox') && S.inbox.filter(i => i.status === 'new').length, gallery: S.gallery.filter(g => g.status === 'pending').length, forum: S.topics.filter(t => t.reports > 0).length, email: S.emails.filter(e => e.status === 'waiting').length };
  return `<div class="page-head"><div class="eyebrow">Admin dashboard · ${esc(roleTitle(me()))}</div><h1>${esc(title)}</h1></div>
  <div class="admin-shell"><nav class="admin-nav" aria-label="Admin sections">${ADMIN_NAV.filter(n => can(n[2])).map(([k, l]) => `<a href="#admin${k ? '-' + k : ''}" class="${sec === k ? 'on' : ''}">${l}${badges[k] ? `<span class="badge">${badges[k]}</span>` : ''}</a>`).join('')}</nav><div class="stack">${body}</div></div>`;
}

/* ================= Overview ================= */
const createTiles = () => `<div class="create-tiles">${Object.entries(CK).map(([k, c]) => `<a class="create-tile" href="#admin-edit-${k}-new"><span class="qi">${icon(c.ic)}</span><span class="t">${c.label}</span><span class="d">${c.desc}</span></a>`).join('')}</div>`;
function aOverview() {
  const today = nowIso(), m0 = today.slice(0, 7), d30 = addDays(today, -30);
  const members = S.users.filter(u => u.status !== 'invited');
  const paid = members.filter(u => u.tier === 'paid');
  const newM = members.filter(u => u.joined.slice(0, 7) === m0).length;
  const gifts30 = S.donations.filter(d => counted(d) && d.date > d30);
  const sum30 = gifts30.reduce((s, d) => s + d.amount, 0);
  const overdue = members.filter(u => u.dues === 'overdue').length;
  const pend = pendingCount();
  const byFund = FUNDS.map(f => ({ label: f.name, value: gifts30.filter(d => d.fund === f.id).reduce((s, d) => s + d.amount, 0) })).filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  const months = []; for (let i = 5; i >= 0; i--) { const d = new Date(today + 'T12:00:00Z'); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i); months.push(d.toISOString().slice(0, 7)); }
  const signups = months.map(k => ({ label: new Date(k + '-15T12:00:00Z').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }), value: members.filter(u => u.joined.slice(0, 7) === k).length }));
  const showMoney = can('finance') || can('analytics');
  const appr = can('approve') ? approvable() : [];
  return `
  ${appr.length ? `<a class="card row between" href="#admin-finance" style="text-decoration:none;color:inherit;border-color:var(--gold);background:var(--gold-soft)"><span><strong>${appr.length} donation${appr.length === 1 ? '' : 's'} waiting for your approval</strong><br><span class="small muted">${money(appr.reduce((s, d) => s + d.amount, 0))} logged from outside the site. They count once approved.</span></span>${icon('arrow')}</a>` : ''}
  ${can('content') ? `<div class="card pad-lg stack-sm"><h3 style="margin:0">Create</h3><p class="small muted" style="margin:0">Pick what you want to add. You can save a draft and publish later.</p>${createTiles()}</div>
  <form class="card form-grid" data-form="quick"><h3 style="margin:0">Quick update</h3>
    <label class="f"><span class="sr">Title</span><input name="title" required placeholder="Title, e.g. Fajr moves to 6:30 AM on Sunday"></label>
    <label class="f"><span class="sr">Message</span><textarea name="body" required placeholder="Write a short update for the community" style="min-height:80px"></textarea></label>
    <div class="row between"><div class="row"><select name="audience" style="width:auto" aria-label="Who can see it"><option value="public">Everyone</option><option value="members">Members</option><option value="paid">Supporting members</option></select>
      <label class="check small"><input type="checkbox" name="email"> Email subscribers</label></div><button class="btn" type="submit">${icon('send')} Post now</button></div></form>` : ''}
  <div class="kpis">
    <a class="kpi" href="${can('members') ? '#admin-members' : can('analytics') ? '#admin-analytics' : '#admin'}" style="text-decoration:none;color:inherit"><div class="k">Members</div><div class="v">${members.length}</div><div class="d">${paid.length} supporting · ${members.length - paid.length} free</div></a>
    <div class="kpi"><div class="k">New this month</div><div class="v">${newM}</div><div class="d">Sign-ups since ${fmtDate(m0 + '-01', { month: 'short', day: 'numeric' })}</div></div>
    ${showMoney ? `<div class="kpi"><div class="k">Given, last 30 days</div><div class="v">${money(sum30)}</div><div class="d">${gifts30.length} gifts</div></div>` : `<div class="kpi"><div class="k">Drafts</div><div class="v">${allContent().filter(c => statusOf(c.it) === 'draft').length}</div><div class="d">Waiting to publish</div></div>`}
    <div class="kpi ${pend ? 'attn' : ''}"><div class="k">Needs attention</div><div class="v">${pend}</div><div class="d">${[can('inbox') && `${S.inbox.filter(i => i.status === 'new').length} messages`, can('gallery') && `${S.gallery.filter(g => g.status === 'pending').length} photos`, can('forum') && `${S.topics.filter(t => t.reports > 0).length} reports`, can('approve') && `${approvable().length} to approve`, can('members') && `${overdue} dues overdue`].filter(Boolean).join(' · ')}</div></div>
  </div>
  ${showMoney ? `<div class="grid g2">
    <div class="card"><h3>Donations by fund</h3><p class="small muted">Last 30 days</p>${barsH(byFund, money)}</div>
    <div class="card"><h3>New members by month</h3><p class="small muted">Last 6 months</p>${columns(signups)}</div>
  </div>
  <div class="grid g2">
    <div class="card"><h3>Recent gifts</h3><div class="table-wrap" style="border:0"><table><thead><tr><th>Date</th><th>Donor</th><th>Fund</th><th>Amount</th></tr></thead><tbody>${S.donations.filter(counted).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map(d => `<tr><td>${fmtDate(d.date)}</td><td>${esc(d.userId ? nameOf(d.userId) : (d.name || 'Anonymous'))}</td><td>${esc(FUNDS.find(f => f.id === d.fund)?.name)}</td><td class="num">${money(d.amount)}</td></tr>`).join('')}</tbody></table></div></div>
    ${can('members') ? `<div class="card"><h3>Recently joined</h3>${[...members].sort((a, b) => b.joined.localeCompare(a.joined)).slice(0, 6).map(u => memberRow(u)).join('')}</div>` : `<div class="card"><h3>Reports</h3><p class="small muted">Build a board report with the sections you choose and download it as a PDF.</p><a class="btn sm" href="#admin-analytics">Open analytics</a></div>`}
  </div>` : ''}`;
}
function barsH(rows, fmt = v => v) {
  if (!rows.length) return '<div class="empty">No data yet.</div>';
  const W = 520, rowH = 34, labelW = 150, valW = 70, H = rows.length * rowH + 6;
  const max = Math.max(...rows.map(r => r.value)) || 1, bw = W - labelW - valW;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart">${rows.map((r, i) => {
    const y = i * rowH + 8, h = 18, w = Math.max(3, bw * r.value / max), x = labelW, rr = Math.min(4, w / 2);
    return `<text x="${labelW - 10}" y="${y + 13}" text-anchor="end" font-size="13" fill="var(--ink)">${esc(r.label)}</text>
      <path d="M${x} ${y}h${w - rr}a${rr} ${rr} 0 0 1 ${rr} ${rr}v${h - 2 * rr}a${rr} ${rr} 0 0 1 -${rr} ${rr}h-${w - rr}z" fill="var(--green)"/>
      <text x="${x + w + 8}" y="${y + 13}" font-size="13" fill="var(--muted)">${fmt(r.value)}</text>
      <rect x="0" y="${i * rowH}" width="${W}" height="${rowH}" fill="transparent" data-tip="${esc(r.label)}: ${esc(fmt(r.value))}"/>`; }).join('')}</svg><div class="tip"></div></div>`;
}
const niceStep = v => { const p = Math.pow(10, Math.floor(Math.log10(Math.max(1, v)))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
function columns(rows, o = {}) {
  const fmt = o.fmt || (v => String(v)), unit = o.unit ?? ' new members';
  const W = 520, H = 200, padB = 26, padT = 18, padL = o.fmt ? 52 : 30;
  const max = Math.max(4, ...rows.map(r => r.value)), step = niceStep(max / 4), top = step * Math.ceil(max / step);
  const ticks = Math.round(top / step);
  const cw = (W - padL) / rows.length, bw = Math.min(46, cw * 0.55), Y = v => H - padB - (H - padB - padT) * v / top;
  let grid = ''; for (let i = 0; i <= ticks; i++) { const y = Y(step * i); grid += `<line x1="${padL}" x2="${W}" y1="${y}" y2="${y}" stroke="var(--line)" ${i ? 'stroke-dasharray="2 4"' : ''}/><text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="11.5" fill="var(--muted)">${fmt(step * i)}</text>`; }
  const labelEvery = rows.length > 14 ? Math.ceil(rows.length / 8) : 1;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Column chart">${grid}${rows.map((r, i) => {
    const x = padL + cw * i + (cw - bw) / 2, y = Y(r.value), h = H - padB - y, rr = Math.min(4, h / 2, bw / 2), last = i === rows.length - 1;
    return `${h > 0 ? `<path d="M${x} ${H - padB}v-${h - rr}a${rr} ${rr} 0 0 1 ${rr} -${rr}h${bw - 2 * rr}a${rr} ${rr} 0 0 1 ${rr} ${rr}v${h - rr}z" fill="var(--green)" ${last ? '' : 'fill-opacity=".55"'}/>` : ''}
      ${i % labelEvery === 0 || last ? `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="12" fill="var(--muted)">${esc(r.label)}</text>` : ''}
      ${last ? `<text x="${x + bw / 2}" y="${y - 6}" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--ink)">${fmt(r.value)}</text>` : ''}
      <rect x="${padL + cw * i}" y="${padT}" width="${cw}" height="${H - padB - padT}" fill="transparent" data-tip="${esc(r.label)}: ${esc(fmt(r.value))}${o.fmt ? '' : unit.replace(/s$/, r.value === 1 ? '' : 's')}"/>`; }).join('')}</svg><div class="tip"></div></div>`;
}

/* ================= Content studio ================= */
function aContent() {
  const t = UI.ctype || 'all', s = UI.cstat || 'all', q = (UI.cq || '').toLowerCase();
  const items = allContent().filter(c => (t === 'all' || c.kind === t) && (s === 'all' || statusOf(c.it) === s) && (!q || (c.it.title + ' ' + plainOf(c.it)).toLowerCase().includes(q)))
    .sort((a, b) => (b.it.date || '').localeCompare(a.it.date || ''));
  const counts = { draft: allContent().filter(c => statusOf(c.it) === 'draft').length, scheduled: allContent().filter(c => statusOf(c.it) === 'scheduled').length };
  return `<div class="card pad-lg stack-sm"><h3 style="margin:0">Create something new</h3>${createTiles()}</div>
  <div class="card">
    <div class="row between" style="margin-bottom:10px"><h3 style="margin:0">All content</h3><label class="f" style="flex:1;max-width:320px"><span class="sr">Search content</span><input type="search" placeholder="Search titles and text" value="${esc(UI.cq || '')}" data-input="cq"></label></div>
    <div class="filter-row">${[['all', 'All'], ...Object.entries(CK).map(([k, c]) => [k, c.label])].map(([k, l]) => `<button data-action="ctype" data-v="${k}" class="${t === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div class="seg" style="margin-bottom:8px">${[['all', 'Any status'], ['published', 'Published'], ['draft', `Drafts (${counts.draft})`], ['scheduled', `Scheduled (${counts.scheduled})`]].map(([k, l]) => `<button data-action="cstat" data-v="${k}" class="${s === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    ${items.map(({ kind, it }) => `<div class="content-row"><div style="min-width:0"><a href="#admin-edit-${kind}-${it.id}" style="text-decoration:none;color:inherit"><strong>${esc(it.title)}</strong></a>
      <div class="chip-row" style="margin-top:4px"><span class="chip green">${CK[kind].label}</span>${statusChip(it)}${it.audience && it.audience !== 'public' ? audienceChip(it.audience) : ''}${it.pinned ? '<span class="chip">Pinned</span>' : ''}${it.featured ? '<span class="chip">Featured</span>' : ''}</div>
      <div class="tiny muted" style="margin-top:4px">${it.date ? fmtDate(it.date, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Library item'}${it.author ? ' · ' + esc(nameOf(it.author)) : ''}</div></div>
      <div class="row" style="justify-content:flex-end"><a class="btn sm" href="#admin-edit-${kind}-${it.id}">Edit</a>${statusOf(it) === 'published' ? `<a class="btn ghost sm" href="${viewHref(kind, it)}">View</a>` : ''}<button class="btn ghost sm" data-action="del-content" data-kind="${kind}" data-id="${it.id}" aria-label="Delete ${esc(it.title)}">Delete</button></div></div>`).join('') || '<div class="empty">Nothing matches. Try another filter.</div>'}
  </div>`;
}
function aEditor(kind, id) {
  const isNew = id === 'new';
  const it = isNew ? {} : findContent(kind, id);
  if (!it) return notFound();
  const key = kind + '-' + id;
  if (UI.ed?.key !== key) UI.ed = { key, cover: it.image || null };
  const html = it.html ? sanitize(it.html) : kind === 'khutbah' ? para(it.summary || '') : kind === 'event' ? para(it.desc || '') : para(it.body || '');
  const st = isNew ? 'publish' : (it.status === 'draft' ? 'draft' : it.status === 'scheduled' && !isLive(it) ? 'schedule' : 'publish');
  const audience = it.audience || (kind === 'announcement' ? 'members' : 'public');
  const topics = [...new Set(S.resources.map(r => r.topic))];
  const live = !isNew && isLive(it);
  const pref = KIND_PREF[kind];
  const subs = subscribers(pref, audience).length;
  const rte = (ph) => `<div class="rte-wrap"><div class="rte-bar" role="toolbar" aria-label="Formatting">
      <button type="button" data-cmd="bold" title="Bold" aria-label="Bold"><b>B</b></button><button type="button" data-cmd="italic" title="Italic" aria-label="Italic"><i>I</i></button>
      <button type="button" data-cmd="h2" title="Heading" aria-label="Heading">H1</button><button type="button" data-cmd="h3" title="Subheading" aria-label="Subheading">H2</button>
      <button type="button" data-cmd="ul" title="Bulleted list" aria-label="Bulleted list">• List</button><button type="button" data-cmd="ol" title="Numbered list" aria-label="Numbered list">1. List</button>
      <button type="button" data-cmd="quote" title="Quote" aria-label="Quote">“ ”</button><button type="button" data-cmd="link" title="Link" aria-label="Add a link">Link</button><button type="button" data-cmd="clear" title="Clear formatting" aria-label="Clear formatting">Clear</button></div>
    <div class="rte-link" hidden><input type="url" placeholder="Paste a link, e.g. https://quran.com" aria-label="Link address"><button type="button" class="btn sm" data-cmd="link-apply">Add link</button><button type="button" class="btn ghost sm" data-cmd="link-cancel">Cancel</button></div>
    <div class="rte ${html.trim() ? '' : 'is-empty'}" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Body" data-placeholder="${ph}">${html.trim() ? html : '<p><br></p>'}</div></div>`;
  const cover = (label = 'Cover image') => `<div class="f"><span>${label} <span class="hint">Optional</span></span><label class="cover-drop" id="cover-drop">${UI.ed.cover ? `<img src="${UI.ed.cover}" alt="">` : `${icon('image')}<span class="small muted">Tap to add a photo</span>`}<input type="file" accept="image/*" class="sr" data-action-change="ed-cover"></label>${UI.ed.cover ? `<button type="button" class="link-btn small" data-action="ed-cover-clear">Remove image</button>` : ''}</div>`;
  let fields = '';
  if (kind === 'news' || kind === 'announcement') fields = `${rte(kind === 'news' ? 'Write your news post…' : 'Write your announcement…')}${cover()}`;
  if (kind === 'article') fields = `<label class="f">Short summary <span class="hint">Shown on library cards</span><input name="desc" value="${esc(it.desc || '')}" required maxlength="180"></label><label class="f">Topic<input name="topic" list="topics" value="${esc(it.topic || '')}" required placeholder="e.g. Family"><datalist id="topics">${topics.map(t => `<option value="${esc(t)}">`).join('')}</datalist></label>${rte('Write your article…')}${cover()}`;
  if (kind === 'resource') fields = `<div class="form-grid two"><label class="f">Kind of resource<select name="rtype">${Object.entries(TYPE_LABEL).filter(([k]) => k !== 'article' && k !== 'guide').map(([k, l]) => `<option value="${k}" ${it.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="f">Topic<input name="topic" list="topics" value="${esc(it.topic || '')}" required placeholder="e.g. Quran"><datalist id="topics">${topics.map(t => `<option value="${esc(t)}">`).join('')}</datalist></label>
    <label class="f full">Link<input name="url" type="url" required value="${esc(it.url || '')}" placeholder="https://"></label>
    <label class="f full">Description<textarea name="desc" required style="min-height:80px" placeholder="What it is and who it helps">${esc(it.desc || '')}</textarea></label></div>${cover('Image')}`;
  if (kind === 'khutbah') fields = `<div class="form-grid two"><label class="f">Khutbah date<input type="date" name="kdate" required value="${it.date || (dIso(nowIso()).getUTCDay() === 5 ? nowIso() : lastFriday)}"></label><label class="f">Khateeb<input name="khateeb" required value="${esc(it.khateeb || S.settings.jumuahKhateeb)}"></label></div>
    <span class="f" style="display:block"><span class="small" style="font-weight:600">Summary</span></span>${rte('What was discussed, in a few short paragraphs…')}
    <div class="form-grid two"><label class="f">Key takeaways <span class="hint">One per line</span><textarea name="takeaways">${esc((it.takeaways || []).join('\n'))}</textarea></label><label class="f">References <span class="hint">Quran verses and hadith, one per line</span><textarea name="refs">${esc((it.refs || []).join('\n'))}</textarea></label>
    <label class="f">Audio link<input type="url" name="audio" value="${esc(it.media?.audio || '')}" placeholder="https://"></label><label class="f">Video link<input type="url" name="video" value="${esc(it.media?.video || '')}" placeholder="https://"></label></div>
    ${isNew ? '<label class="check"><input type="checkbox" name="forum" checked> Open a forum discussion for members</label>' : ''}`;
  if (kind === 'event') fields = `<div class="form-grid two"><label class="f">Date<input type="date" name="edate" required value="${it.date || ''}"></label><label class="f">Time<input type="time" name="etime" required value="${it.time || '18:00'}"></label>
    <label class="f">Place<input name="place" value="${esc(it.place || 'Masjid')}"></label><label class="f">Category<input name="category" list="ecats" value="${esc(it.category || 'Community')}"><datalist id="ecats">${[...new Set(S.events.map(e => e.category))].map(c => `<option value="${esc(c)}">`).join('')}</datalist></label>
    <label class="f">Spots available <span class="hint">Leave blank for no limit</span><input type="number" min="1" name="capacity" value="${it.capacity || ''}"></label></div>
    <span class="f" style="display:block"><span class="small" style="font-weight:600">Description</span></span>${rte('What will happen, who it’s for, what to bring…')}${cover()}`;
  const radio = (v, l, d) => `<label class="radio-card"><input type="radio" name="status" value="${v}" ${st === v ? 'checked' : ''} data-action-change="ed-status"><span><strong>${l}</strong><br><span class="small muted">${d}</span></span></label>`;
  const btnLabel = st === 'draft' ? 'Save draft' : st === 'schedule' ? 'Schedule' : (live ? 'Update' : 'Publish');
  return `<div class="crumbs"><a href="#admin-content">← All content</a></div>
  <form class="editor-layout" data-form="editor" data-kind="${kind}" data-id="${esc(id)}" data-live="${live ? 1 : 0}" novalidate>
    <div class="stack">
      <div class="card pad-lg stack">
        <label class="f"><span class="sr">Title</span><input class="title-input" name="title" required value="${esc(it.title || (kind === 'khutbah' && isNew ? S.settings.jumuahTopic : ''))}" placeholder="${CK[kind].label} title"></label>
        ${fields}
      </div>
    </div>
    <aside class="stack editor-side">
      <div class="card stack-sm"><h3 style="margin:0">Publishing</h3>
        <div class="radio-cards">${radio('publish', live ? 'Published' : 'Publish now', live ? 'Live on the site' : 'Goes live as soon as you save')}${radio('draft', 'Save as draft', 'Only staff can see it')}${radio('schedule', 'Schedule', 'Goes live on a date you pick')}</div>
        <div class="form-grid two" id="sched" ${st === 'schedule' ? '' : 'hidden'}><label class="f">Date<input type="date" name="sdate" value="${it.pubDate || addDays(nowIso(), 1)}" min="${nowIso()}"></label><label class="f">Time<input type="time" name="stime" value="${it.pubTime || '09:00'}"></label></div>
        ${kind === 'news' || kind === 'announcement' ? `<label class="f">Who can see it<select name="audience" data-action-change="ed-aud"><option value="public" ${audience === 'public' ? 'selected' : ''}>Everyone</option><option value="members" ${audience === 'members' ? 'selected' : ''}>All members</option><option value="paid" ${audience === 'paid' ? 'selected' : ''}>Supporting members only</option></select></label>
          <label class="check"><input type="checkbox" name="pinned" ${it.pinned ? 'checked' : ''}> Pin to the top of the news</label>` : ''}
        ${kind === 'article' || kind === 'resource' ? `<label class="check"><input type="checkbox" name="featured" ${it.featured ? 'checked' : ''}> Feature on the Learn page</label>` : ''}
      </div>
      ${live ? '' : `<div class="card stack-sm"><h3 style="margin:0">Notify people</h3>
        <label class="check"><input type="checkbox" name="notify_inbox" ${kind === 'announcement' ? 'checked' : ''}> Post to members’ inbox on the site</label>
        <label class="check"><input type="checkbox" name="notify_email" ${S.emailSettings.auto[kind] ? 'checked' : ''}> Email subscribers</label>
        <p class="tiny muted" style="margin:0" id="sub-count">${subs} people have “${PREF_KEYS.find(p => p[0] === pref)[1]}” emails turned on. Emails wait in the outbox until Resend is connected.</p></div>`}
      <div class="card stack-sm" style="position:sticky;top:76px">
        <button class="btn block" type="submit" id="ed-submit">${btnLabel}</button>
        <button class="btn ghost block" type="button" data-action="ed-preview">Preview</button>
        ${isNew ? '' : `<button class="btn ghost block" type="button" data-action="del-content" data-kind="${kind}" data-id="${it.id}">Delete</button>`}
      </div>
    </aside>
  </form>`;
}
function normalizeBlocks(html) {
  const t = document.createElement('template'); t.innerHTML = sanitize(html);
  const BLOCK = /^(P|H2|H3|UL|OL|BLOCKQUOTE|DIV)$/;
  const unwrapDivs = node => [...node.children].forEach(ch => { unwrapDivs(ch); if (ch.tagName === 'DIV') { const hasBlock = [...ch.children].some(c => BLOCK.test(c.tagName)); if (hasBlock) ch.replaceWith(...ch.childNodes); else { const p = document.createElement('p'); p.append(...ch.childNodes); ch.replaceWith(p); } } });
  unwrapDivs(t.content);
  const out = document.createDocumentFragment(); let p = null;
  [...t.content.childNodes].forEach(n => {
    if (n.nodeType === 1 && BLOCK.test(n.tagName)) { p = null; out.append(n); }
    else { if (n.nodeType === 3 && !n.textContent.trim() && !p) return; if (!p) { p = document.createElement('p'); out.append(p); } p.append(n); }
  });
  out.querySelectorAll('p, h2, h3, li, blockquote').forEach(el => { if (!el.textContent.trim() && !el.querySelector('a')) el.remove(); });
  const wrap = document.createElement('div'); wrap.append(out); return wrap.innerHTML;
}
function readEditor(form) {
  const fd = new FormData(form), kind = form.dataset.kind;
  const rteEl = form.querySelector('.rte');
  return { fd, kind, html: rteEl ? normalizeBlocks(rteEl.innerHTML) : '' };
}

/* ================= Members & team ================= */
function memberRow(u, selectable) {
  const sel = UI.sel || {};
  return `<div class="member-row">${selectable ? `<input type="checkbox" aria-label="Select ${esc(u.name)}" data-action-change="sel" data-id="${u.id}" ${sel[u.id] ? 'checked' : ''}>` : ''}<span class="avatar">${initials(u.name)}</span>
    <a class="who" href="${can('members') ? '#admin-member-' + u.id : '#admin'}"><strong>${esc(u.name)}</strong><span>${esc(u.email)}</span></a>
    <div class="chips">${u.tier === 'paid' ? '<span class="chip gold">Supporting</span>' : '<span class="chip">Free</span>'}${u.dues === 'overdue' ? '<span class="chip bad">Dues overdue</span>' : ''}${roleOf(u) !== 'member' ? `<span class="chip green">${ROLE_LABEL[roleOf(u)]}</span>` : ''}${u.status === 'suspended' ? '<span class="chip bad">Suspended</span>' : u.status === 'invited' ? '<span class="chip warn">Invited</span>' : ''}</div></div>`;
}
function aMembers() {
  const tab = UI.mtab || 'members';
  const tabs = `<div class="tabs-line"><a href="#admin-members" data-action="mtab" data-v="members" class="${tab === 'members' ? 'on' : ''}">Members</a><a href="#admin-members" data-action="mtab" data-v="team" class="${tab === 'team' ? 'on' : ''}">Team & roles</a></div>`;
  if (tab === 'team') return tabs + aTeam();
  const q = (UI.mq || '').toLowerCase(), f = UI.mf || 'all', m0 = nowIso().slice(0, 7);
  const list = S.users.filter(u => u.status !== 'invited' && (!q || (u.name + u.email + (u.phone || '')).toLowerCase().includes(q)) && (f === 'all' || (f === 'paid' && u.tier === 'paid') || (f === 'free' && u.tier === 'free') || (f === 'overdue' && u.dues === 'overdue') || (f === 'suspended' && u.status === 'suspended') || (f === 'new' && u.joined.slice(0, 7) === m0))).sort((a, b) => a.name.localeCompare(b.name));
  const sel = Object.keys(UI.sel || {}).filter(k => UI.sel[k]);
  return `${tabs}
  <div class="row"><label class="f" style="flex:1;min-width:200px"><span class="sr">Search members</span><input type="search" placeholder="Search by name, email or phone" value="${esc(UI.mq || '')}" data-input="mq"></label>
    <button class="btn sm" data-action="add-member">${icon('user')} Add member</button><button class="btn ghost sm" data-action="copy-csv">Copy as CSV</button></div>
  <div class="filter-row">${[['all', 'All'], ['paid', 'Supporting'], ['free', 'Free'], ['overdue', 'Dues overdue'], ['new', 'New this month'], ['suspended', 'Suspended']].map(([k, l]) => `<button data-action="mf" data-v="${k}" class="${f === k ? 'on' : ''}">${l}</button>`).join('')}</div>
  ${sel.length ? `<div class="bulk-bar"><strong>${sel.length} selected</strong><span style="flex:1"></span><button class="btn ghost sm" data-action="bulk" data-v="message">Message</button><button class="btn ghost sm" data-action="bulk" data-v="paid">Mark dues paid</button><button class="btn ghost sm" data-action="bulk" data-v="supporting">Make supporting</button><button class="btn ghost sm" data-action="bulk" data-v="free">Make free</button><button class="btn ghost sm" data-action="bulk" data-v="clear">Clear</button></div>` : ''}
  <div class="card"><label class="check small" style="padding:4px"><input type="checkbox" data-action-change="sel-all" ${list.length && list.every(u => UI.sel?.[u.id]) ? 'checked' : ''}> Select all ${list.length}</label>
    ${list.map(u => memberRow(u, true)).join('') || '<div class="empty">No members match.</div>'}</div>`;
}
const PERM_ROWS = [['analytics', 'Analytics and PDF reports'], ['finance', 'Donations ledger: view gifts and log cash, checks and Zelle'], ['approve', 'Approve donations someone else logged'], ['members', 'Manage members, plans and dues'], ['messages', 'Message and send requests to members'], ['inbox', 'Inbox: Ask the Imam, bookings, contact'], ['content', 'Write and publish posts, articles, resources, khutbahs, events'], ['events', 'RSVPs, class registrations and volunteer shifts'], ['gallery', 'Approve gallery photos'], ['forum', 'Moderate the forum'], ['email', 'Email notifications and outbox'], ['prayer', 'Prayer times and Jumu’ah settings'], ['site', 'Site settings and urgent alerts'], ['roles', 'Assign roles and change permissions'], ['integrations', 'Connections: domain, Supabase, Resend, Stripe']];
const ROLE_WHO = {
  superadmin: 'Webmaster or IT lead. One or two trusted people.',
  executive: 'Board or executive committee: president, vice president, secretary, treasurer. Oversight, money and members, without editing the site.',
  office: 'Masjid office or administrator. Day-to-day running: members, bookings, alerts, prayer times, logging cash and checks.',
  imam: 'Imam or religious director. Khutbah summaries, Learn Islam guides, Ask the Imam, prayer times.',
  editor: 'Communications or media volunteer. News, articles, resources, events and emails.',
  coordinator: 'Education, youth or sisters’ program lead. Their events, classes and volunteers.',
  moderator: 'Trusted members who keep the forum and gallery clean.'
};
function aTeam() {
  const order = r => ROLES.findIndex(x => x[0] === r);
  const staff = S.users.filter(u => roleOf(u) !== 'member').sort((a, b) => order(roleOf(b)) - order(roleOf(a)));
  const editRoles = can('roles');
  const roleSel = u => !editRoles || u.id === me().id ? `<span class="chip green">${ROLE_LABEL[roleOf(u)]}</span>` : `<select data-action-change="set-role" data-id="${u.id}" style="width:auto;padding:6px 8px;font-size:14px" aria-label="Role for ${esc(u.name)}">${ROLES.map(([k, l]) => `<option value="${k}" ${roleOf(u) === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const staffRoles = ROLES.slice(1).reverse();
  return `<div class="card"><h3>Team</h3>${staff.map(u => `<div class="member-row"><span class="avatar">${initials(u.name)}</span><a class="who" href="#admin-member-${u.id}"><strong>${esc(u.name)}</strong><span>${esc(u.title || ROLE_LABEL[roleOf(u)])}${u.status === 'invited' ? ' · invitation sent' : ''}</span></a><div class="chips">${roleSel(u)}</div></div>`).join('')}</div>
  ${editRoles ? `<form class="card pad-lg form-grid two" data-form="invite"><h3 class="full" style="margin:0">Add a team member</h3><p class="full small muted" style="margin:0">If they already have an account, their role changes right away. Otherwise they get an invitation by email once email is connected.</p>
    <label class="f">Name<input name="name" required></label><label class="f">Email<input name="email" type="email" required></label>
    <label class="f">Role<select name="role">${staffRoles.map(([k, l]) => `<option value="${k}" ${k === 'executive' ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="f">Position title <span class="hint">Shown to other staff, e.g. Treasurer</span><input name="title" placeholder="e.g. Treasurer"></label>
    <div class="full"><button class="btn" type="submit">Add to team</button></div></form>` : '<div class="notice">Only a super admin can add team members or change roles.</div>'}
  <div class="card"><div class="row between"><h3 style="margin:0">What each role can do</h3>${editRoles ? '<button class="btn ghost sm" data-action="perms-reset">Reset to recommended</button>' : ''}</div>
    <p class="small muted">${editRoles ? 'Tick or untick to change a role’s access. Changes apply right away. Super admins always have full access.' : 'Set by your super admin.'}</p>
    <div class="table-wrap" style="border:0"><table class="perm-table"><thead><tr><th>Permission</th>${staffRoles.map(r => `<th>${r[1]}</th>`).join('')}</tr></thead><tbody>
    ${PERM_ROWS.map(([p, l]) => `<tr><td class="wrap">${l}</td>${staffRoles.map(([r]) => { const on = permsFor(r).includes(p); return `<td>${editRoles && r !== 'superadmin' ? `<input type="checkbox" aria-label="${esc(ROLE_LABEL[r])}: ${esc(l)}" data-action-change="perm" data-role="${r}" data-perm="${p}" ${on ? 'checked' : ''}>` : on ? `<span style="color:var(--ok)">${icon('check')}</span>` : '<span class="muted">–</span>'}</td>`; }).join('')}</tr>`).join('')}
  </tbody></table></div></div>
  <div class="card"><h3>Who each role is for</h3>${staffRoles.map(([r, l]) => `<div class="row between small" style="padding:8px 0;border-top:1px solid var(--line);align-items:flex-start;flex-wrap:nowrap"><strong style="min-width:140px">${l}</strong><span class="muted" style="flex:1">${ROLE_WHO[r]}</span></div>`).join('')}</div>`;
}
function aMember(u) {
  const gifts = S.donations.filter(d => d.userId === u.id).sort((a, b) => b.date.localeCompare(a.date));
  const topics = S.topics.filter(t => t.authorId === u.id).length, replies = S.topics.reduce((s, t) => s + t.replies.filter(r => r.authorId === u.id).length, 0);
  const evs = S.events.filter(e => e.rsvps.includes(u.id)), progs = S.programs.filter(p => p.regs.includes(u.id)), shifts = S.shifts.filter(s => s.signups.includes(u.id));
  const self = u.id === me().id;
  const roleLocked = !can('roles');
  return `<div class="crumbs"><a href="#admin-members">← Members</a></div>
  <div class="card row" style="gap:14px;flex-wrap:nowrap;align-items:center"><span class="avatar" style="width:56px;height:56px;font-size:20px">${initials(u.name)}</span><div style="min-width:0"><div class="chip-row">${u.tier === 'paid' ? '<span class="chip gold">Supporting member</span>' : '<span class="chip">Community member</span>'}${roleOf(u) !== 'member' ? `<span class="chip green">${ROLE_LABEL[roleOf(u)]}</span>` : ''}${u.status === 'suspended' ? '<span class="chip bad">Suspended</span>' : u.status === 'invited' ? '<span class="chip warn">Invited</span>' : '<span class="chip ok">Active</span>'}</div>
    <div class="small muted" style="margin-top:6px">Joined ${fmtDate(u.joined, { month: 'long', day: 'numeric', year: 'numeric' })} · signs in with ${esc(u.provider)}</div></div></div>
  <div class="split">
    <form class="card pad-lg form-grid two" data-form="member-save" data-id="${u.id}"><h3 class="full" style="margin:0">Profile & membership</h3>
      <label class="f">Name<input name="name" required value="${esc(u.name)}"></label><label class="f">Email<input name="email" type="email" required value="${esc(u.email)}"></label>
      <label class="f">Phone<input name="phone" value="${esc(u.phone || '')}"></label>
      <label class="f">Plan<select name="tier"><option value="free" ${u.tier === 'free' ? 'selected' : ''}>Free community member</option><option value="paid" ${u.tier === 'paid' ? 'selected' : ''}>Supporting member</option></select></label>
      <label class="f">Dues<select name="dues"><option value="" ${!u.dues ? 'selected' : ''}>Not applicable</option><option value="active" ${u.dues === 'active' ? 'selected' : ''}>Paid</option><option value="overdue" ${u.dues === 'overdue' ? 'selected' : ''}>Overdue</option></select></label>
      <label class="f">Renews on<input type="date" name="renews" value="${u.renews || ''}"></label>
      <label class="f">Role${roleLocked ? `<input value="${ROLE_LABEL[roleOf(u)]}" disabled><span class="hint">Only a super admin can change roles.</span>` : `<select name="role" ${self ? 'disabled' : ''}>${ROLES.map(([k, l]) => `<option value="${k}" ${roleOf(u) === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`}${self && !roleLocked ? '<span class="hint">You can’t change your own role.</span>' : ''}</label>
      <label class="f">Position title<input name="title" value="${esc(u.title || '')}" placeholder="e.g. Treasurer" ${roleLocked ? 'disabled' : ''}></label>
      <label class="f">Account<select name="status" ${self ? 'disabled' : ''}><option value="active" ${u.status !== 'suspended' ? 'selected' : ''}>Active</option><option value="suspended" ${u.status === 'suspended' ? 'selected' : ''}>Suspended (can read, can’t post)</option></select></label>
      <label class="check full"><input type="checkbox" name="volunteer" ${u.volunteer ? 'checked' : ''}> On the volunteer list</label>
      <label class="f full">Private notes <span class="hint">Only staff with member access see these</span><textarea name="notes" style="min-height:80px">${esc(u.notes || '')}</textarea></label>
      <div class="full"><button class="btn" type="submit">Save changes</button></div></form>
    <div class="stack">
      <div class="card stack-sm"><h3 style="margin:0">Actions</h3>
        <button class="btn ghost block" data-action="msg-member" data-id="${u.id}">${icon('send')} Send a message</button>
        ${can('finance') ? `<button class="btn ghost block" data-action="log-donation" data-id="${u.id}">${icon('heart')} Log a cash, check or Zelle gift</button>` : ''}
        ${self ? '' : `<button class="btn ghost block" data-action="remove-member" data-id="${u.id}">Remove member</button>`}</div>
      <div class="card"><h3>Giving</h3><p class="small" style="margin:0 0 8px">Total: <strong class="num">${money(gifts.filter(counted).reduce((s, d) => s + d.amount, 0))}</strong> in ${gifts.filter(counted).length} gift${gifts.filter(counted).length === 1 ? '' : 's'}${gifts.some(d => d.status === 'pending') ? ' · some awaiting approval' : ''}</p>
        ${gifts.slice(0, 5).map(d => `<div class="row between small" style="padding:6px 0;border-top:1px solid var(--line)"><span>${fmtDate(d.date)} · ${esc(FUNDS.find(f => f.id === d.fund)?.name)}${d.method && d.method !== 'Card' ? ` · ${esc(d.method)}` : ''}</span><strong class="num">${money(d.amount)}${counted(d) ? '' : ` <span class="chip ${d.status === 'pending' ? 'warn' : ''}">${d.status}</span>`}</strong></div>`).join('')}</div>
      <div class="card"><h3>Activity</h3><ul class="small prose" style="margin:0"><li>${topics} forum topics, ${replies} replies</li><li>Events: ${evs.map(e => esc(e.title)).join(', ') || 'none'}</li><li>Classes: ${progs.map(p => esc(p.title)).join(', ') || 'none'}</li><li>Volunteering: ${shifts.map(s => esc(s.title)).join(', ') || 'none'}</li><li>Photos shared: ${S.gallery.filter(g => g.by === u.id).length}</li></ul></div>
      <div class="card"><h3>Email preferences</h3><p class="tiny muted">Set by the member.</p><div class="chip-row">${PREF_KEYS.map(([k, l]) => `<span class="chip ${(u.prefs || {})[k] !== false ? 'ok' : ''}">${(u.prefs || {})[k] !== false ? '✓' : '✕'} ${l}</span>`).join('')}</div></div>
    </div>
  </div>`;
}

/* ================= Messages, inbox, events, gallery, forum ================= */
const AUD = { all: 'All members', free: 'Free members', paid: 'Supporting members', overdue: 'Members with overdue dues', volunteers: 'Volunteer list' };
const audUsers = a => S.users.filter(u => u.status === 'active' && (a === 'all' || (a === 'free' && u.tier === 'free') || (a === 'paid' && u.tier === 'paid') || (a === 'overdue' && u.dues === 'overdue') || (a === 'volunteers' && u.volunteer)));
const audCount = a => audUsers(a).length;
const msgAudLabel = m => m.audience === 'list' ? `${m.to.length} selected member${m.to.length === 1 ? '' : 's'}` : m.audience.startsWith('user:') ? nameOf(m.audience.slice(5)) : AUD[m.audience];
function aMessages() {
  const a = UI.maud || 'all';
  return `<form class="card pad-lg form-grid two" data-form="message"><h3 class="full" style="margin:0">New message</h3>
    <label class="f">Send to<select name="audience" data-input="maud">${Object.entries(AUD).map(([k, l]) => `<option value="${k}" ${k === a ? 'selected' : ''}>${l}</option>`).join('')}</select><span class="hint" id="aud-count">${audCount(a)} recipients</span></label>
    <label class="f">Kind<select name="type"><option value="announcement">Announcement</option><option value="request">Request (collect responses)</option><option value="reminder">Reminder</option></select></label>
    <label class="f full">Subject<input name="subject" required></label>
    <label class="f full">Message<textarea name="body" required></textarea></label>
    <label class="f full">Response button <span class="hint">Optional, for requests: “I can help”, “Count me in”, “Renew now”</span><input name="action"></label>
    <fieldset class="full" style="border:0;padding:0;margin:0;display:grid;gap:8px"><legend class="small" style="font-weight:600;margin-bottom:6px">Channels</legend>
      <label class="check"><input type="checkbox" checked disabled> Member inbox on the website</label>
      <label class="check"><input type="checkbox" name="email"> Email <span class="muted small">(queued until Resend is connected)</span></label>
      <label class="check"><input type="checkbox" name="sms"> Text message <span class="muted small">(needs an SMS service later)</span></label></fieldset>
    <div class="full"><button class="btn" type="submit">${icon('send')} Send</button></div></form>
  <div class="card"><h3>Sent</h3>${[...S.messages].sort((a, b) => b.date.localeCompare(a.date)).map(m => `<div class="queue-item"><div class="row between"><div><strong>${esc(m.subject)}</strong><div class="small muted">${fmtDate(m.date)} · ${esc(msgAudLabel(m))} · ${m.type}${m.channels?.includes('email') ? ' · email queued' : ''}</div></div>${m.action ? `<span class="chip green">${m.responses.filter(r => r.answer === m.action).length} said “${esc(m.action)}”</span>` : ''}</div>
    ${m.responses.length ? `<div class="small muted">${m.responses.map(r => `${esc(nameOf(r.userId))}: ${esc(r.answer)}`).join(' · ')}</div>` : ''}<div><button class="btn ghost sm" data-action="del-msg" data-id="${m.id}">Delete</button></div></div>`).join('') || '<div class="empty">Nothing sent yet.</div>'}</div>`;
}
const KIND = { imam: 'Ask the Imam', booking: 'Facility booking', contact: 'Contact form', mentor: 'Mentor request' };
function aInbox() {
  const list = [...S.inbox].sort((a, b) => ((a.status === 'new' ? 0 : 1) - (b.status === 'new' ? 0 : 1)) || b.date.localeCompare(a.date));
  return `<div class="card">${list.map(i => `<div class="queue-item"><div class="row between"><div class="chip-row"><span class="chip ${i.kind === 'imam' ? 'gold' : 'green'}">${KIND[i.kind]}</span><span class="chip ${i.status === 'new' ? 'warn' : 'ok'}">${i.status === 'new' ? 'New' : i.status[0].toUpperCase() + i.status.slice(1)}</span></div><span class="small muted">${fmtDate(i.date)}</span></div>
    <div><strong>${esc(i.subject)}</strong><div class="small muted">${esc(i.from)}${i.email ? ' · ' + esc(i.email) : ''}</div></div><p class="small" style="margin:0">${esc(i.body)}</p>
    ${i.reply ? `<div class="notice green small"><span><strong>Reply:</strong> ${esc(i.reply)}</span></div>` : ''}
    ${i.status === 'new' ? `<div class="row">${i.kind === 'imam' ? `<button class="btn sm" data-action="inbox-reply" data-id="${i.id}">Reply</button>` : ''}${i.kind === 'booking' ? `<button class="btn sm" data-action="inbox-set" data-v="approved" data-id="${i.id}">Approve</button><button class="btn ghost sm" data-action="inbox-set" data-v="declined" data-id="${i.id}">Decline</button>` : ''}<button class="btn ghost sm" data-action="inbox-set" data-v="done" data-id="${i.id}">Mark done</button></div>` : ''}</div>`).join('') || '<div class="empty">Inbox is empty.</div>'}</div>`;
}
function aEvents() {
  return `<div class="row"><a class="btn" href="#admin-edit-event-new">${icon('cal')} New event</a></div>
  <div class="card"><h3>Events and RSVPs</h3>${[...S.events].sort((a, b) => a.date.localeCompare(b.date)).map(e => `<div class="queue-item"><div class="row between"><div><strong>${esc(e.title)}</strong><div class="small muted">${fmtDate(e.date)} · ${hm12(e.time)} · ${e.rsvps.length}${e.capacity ? '/' + e.capacity : ''} going</div></div><div class="row">${statusChip(e)}<a class="btn ghost sm" href="#admin-edit-event-${e.id}">Edit</a></div></div>${e.rsvps.length ? `<div class="tiny muted">${e.rsvps.map(nameOf).map(esc).join(', ')}</div>` : ''}</div>`).join('')}</div>
  <div class="card"><h3>Class registrations</h3>${S.programs.map(p => `<div class="queue-item"><div class="row between"><strong>${esc(p.title)}</strong><span class="chip green">${p.regs.length} registered</span></div>${p.regs.length ? `<div class="tiny muted">${p.regs.map(nameOf).map(esc).join(', ')}</div>` : ''}</div>`).join('')}</div>
  <form class="card pad-lg form-grid two" data-form="shift"><h3 class="full" style="margin:0">Add a volunteer shift</h3>
    <label class="f full">Shift<input name="title" required placeholder="e.g. Eid prayer parking"></label>
    <label class="f">When<input name="when" required placeholder="Saturday, Dec 5, 9 AM – noon"></label>
    <label class="f">Spots<input name="slots" type="number" min="1" value="5"></label>
    <div class="full"><button class="btn" type="submit">Add shift</button></div></form>
  <div class="card"><h3>Volunteer sign-ups</h3>${S.shifts.map(s => `<div class="queue-item"><div class="row between"><div><strong>${esc(s.title)}</strong><div class="small muted">${esc(s.when)} · ${s.signups.length}/${s.slots}</div></div><button class="btn ghost sm" data-action="del-shift" data-id="${s.id}">Delete</button></div>${s.signups.length ? `<div class="tiny muted">${s.signups.map(nameOf).map(esc).join(', ')}</div>` : ''}</div>`).join('')}</div>`;
}
function aGallery() {
  const pend = S.gallery.filter(g => g.status === 'pending'), pub = S.gallery.filter(g => g.status === 'approved');
  return `<div class="card"><h3>Waiting for approval</h3>${pend.length ? `<div class="grid g3">${pend.map(g => `<div class="stack-sm"><div class="photo" style="cursor:default"><img src="${photoSrc(g)}" alt=""></div><div class="small"><strong>${esc(g.caption)}</strong><br><span class="muted">From ${esc(nameOf(g.by))} · ${fmtDate(g.date)}</span></div><div class="row"><button class="btn sm" data-action="photo" data-v="approved" data-id="${g.id}">Approve</button><button class="btn ghost sm" data-action="photo" data-v="rejected" data-id="${g.id}">Reject</button></div></div>`).join('')}</div>` : '<div class="empty">No photos waiting.</div>'}</div>
  <div class="card"><h3>Published</h3><div class="gallery">${pub.map(g => `<div class="stack-sm"><div class="photo" style="cursor:default"><img src="${photoSrc(g)}" alt=""><span class="cap">${esc(g.caption)}</span></div><button class="btn ghost sm" data-action="photo" data-v="removed" data-id="${g.id}">Remove</button></div>`).join('')}</div></div>`;
}
function aForum() {
  const rep = S.topics.filter(t => t.reports > 0);
  return `${rep.length ? `<div class="card"><h3>Reported</h3>${rep.map(t => `<div class="queue-item"><div class="row between"><a href="#topic-${t.id}"><strong>${esc(t.title)}</strong></a><span class="chip bad">${t.reports} report${t.reports > 1 ? 's' : ''}</span></div><div class="row"><button class="btn ghost sm" data-action="mod" data-v="clear" data-id="${t.id}">Keep and clear reports</button><button class="btn danger sm" data-action="mod" data-v="delete" data-id="${t.id}">Delete topic</button></div></div>`).join('')}</div>` : ''}
  <div class="card"><h3>All topics</h3>${S.topics.map(t => `<div class="queue-item"><div class="row between"><div><a href="#topic-${t.id}"><strong>${esc(t.title)}</strong></a><div class="small muted">${esc(t.cat)} · ${esc(nameOf(t.authorId))} · ${t.replies.length} replies</div></div><div class="row"><button class="btn ghost sm" data-action="mod" data-v="pin" data-id="${t.id}">${t.pinned ? 'Unpin' : 'Pin'}</button><button class="btn ghost sm" data-action="mod" data-v="lock" data-id="${t.id}">${t.locked ? 'Unlock' : 'Lock'}</button><button class="btn ghost sm" data-action="mod" data-v="delete" data-id="${t.id}">Delete</button></div></div></div>`).join('')}</div>
  <form class="card form-grid" data-form="category"><h3 style="margin:0">Categories</h3><div class="chip-row">${S.forumCats.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div><div class="row"><input name="cat" placeholder="New category" required style="flex:1;min-width:180px" aria-label="New category"><button class="btn sm" type="submit">Add</button></div></form>`;
}

/* ================= Email notifications & connections ================= */
function emailPreview(e) {
  const st = S.settings;
  return `<div class="email-preview"><div class="eh">${esc(st.name)}</div><div class="eb"><div style="font-size:12px;color:#777;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">${esc(CK[e.kind]?.label || (e.kind === 'alert' ? 'Urgent alert' : 'Message'))}</div><div style="font-size:20px;font-weight:700;margin-bottom:8px">${esc(e.subject)}</div><div style="font-size:15px;line-height:1.55;color:#333">${esc(e.excerpt || '')}</div><div style="margin-top:16px"><span style="display:inline-block;background:#0E4D3A;color:#fff;padding:10px 16px;border-radius:999px;font-weight:600;font-size:14px">Read on the website</span></div></div><div class="ef">${esc(st.address)}<br>You’re getting this because you turned on these emails. <u>Manage email preferences</u> · <u>Unsubscribe</u></div></div>`;
}
function aEmail() {
  const es = S.emailSettings, waiting = S.emails.filter(e => e.status === 'waiting');
  const active = S.users.filter(u => u.status === 'active');
  const sample = S.emails[0] || { kind: 'announcement', subject: 'General body meeting after Dhuhr on Sunday', excerpt: 'All members are invited. Agenda: the year’s finances, the parking plan and volunteer coordinators.' };
  return `<div class="card row between" style="align-items:center"><div><h3 style="margin:0">Resend</h3><p class="small muted" style="margin:4px 0 0">${waiting.length} email${waiting.length === 1 ? '' : 's'} queued. They send automatically once Resend is connected and your domain is verified.</p></div><div class="row"><span class="chip ${S.integrations.resend ? 'ok' : 'warn'}">${S.integrations.resend ? 'Connected' : 'Not connected yet'}</span>${can('integrations') ? '<a class="btn ghost sm" href="#admin-integrations">Set up</a>' : ''}</div></div>
  <div class="split">
    <div class="stack">
      <div class="card"><h3>Outbox</h3>${S.emails.length ? S.emails.map(e => `<div class="queue-item"><div class="row between"><div style="min-width:0"><strong>${esc(e.subject)}</strong><div class="small muted">${fmtDate(e.date)} · ${esc(CK[e.kind]?.label || (e.kind === 'alert' ? 'Urgent alert' : 'Message'))} · ${e.count} recipients${e.sendAt ? ' · sends ' + fmtDate(e.sendAt) : ''}</div></div><span class="chip ${e.status === 'sent' ? 'ok' : 'warn'}">${e.status === 'sent' ? 'Sent' : 'Waiting for Resend'}</span></div><div class="row"><button class="btn ghost sm" data-action="email-preview" data-id="${e.id}">Preview</button><button class="btn ghost sm" data-action="email-remove" data-id="${e.id}">Remove</button></div></div>`).join('') : '<div class="empty">Nothing queued. When you publish with “Email subscribers” ticked, the email shows up here.</div>'}</div>
      <form class="card form-grid" data-form="email-auto"><h3 style="margin:0">Email subscribers by default when publishing</h3><p class="small muted" style="margin:0">This ticks “Email subscribers” for you in the editor. You can still untick it on any post.</p>
        ${[['announcement', 'Announcements'], ['news', 'News posts'], ['article', 'Articles'], ['resource', 'Resource links'], ['khutbah', 'Khutbah summaries'], ['event', 'Events'], ['alert', 'Urgent alerts']].map(([k, l]) => `<label class="check"><input type="checkbox" name="${k}" ${es.auto[k] ? 'checked' : ''}> ${l}</label>`).join('')}
        <div><button class="btn ghost sm" type="submit">Save defaults</button></div></form>
    </div>
    <div class="stack">
      <div class="card"><h3>What members receive</h3>${emailPreview(sample)}</div>
      <form class="card form-grid" data-form="email-sender"><h3 style="margin:0">Sender</h3><label class="f">From name<input name="fromName" value="${esc(es.fromName)}"></label><label class="f">From address <span class="hint">Must use your verified domain</span><input name="fromAddress" type="email" value="${esc(es.fromAddress)}"></label><div><button class="btn ghost sm" type="submit">Save sender</button></div></form>
      <div class="card"><h3>Who has emails turned on</h3>${PREF_KEYS.map(([k, l]) => `<div class="row between small" style="padding:6px 0;border-top:1px solid var(--line)"><span>${l}</span><strong class="num">${active.filter(u => (u.prefs || {})[k] !== false).length} of ${active.length}</strong></div>`).join('')}</div>
    </div>
  </div>`;
}
function aIntegrations() {
  const ig = S.integrations;
  const card = (name, ok, what, steps, note = '') => `<div class="card stack-sm"><div class="row between"><h3 style="margin:0">${name}</h3><span class="chip ${ok ? 'ok' : 'warn'}">${ok ? 'Connected' : 'Not connected yet'}</span></div><p class="small" style="margin:0"><strong>Powers:</strong> ${what}</p><ol class="small prose" style="margin:0;padding-left:1.2em">${steps.map(s => `<li>${s}</li>`).join('')}</ol>${note ? `<p class="tiny muted" style="margin:0">${note}</p>` : ''}</div>`;
  return `<div class="notice green">${icon('help')}<span>These connect when the site moves from this preview to GitHub and Vercel. Nothing here is live yet; the checklist shows what each step needs.</span></div>
  <form class="card form-grid" data-form="domain"><h3 style="margin:0">Your domain</h3><p class="small muted" style="margin:0">Enter it once you’ve chosen it. It’s used for the website address and the email sender.</p><div class="row"><input name="domain" value="${esc(ig.domain)}" placeholder="e.g. atlantamuslimjamaat.org" style="flex:1;min-width:200px" aria-label="Domain"><button class="btn sm" type="submit">Save</button></div></form>
  <div class="grid g2">
    ${card('Domain on Vercel', !!ig.domain && false, 'the public web address of the site, with HTTPS.', ['Buy or choose the domain at any registrar.', 'Add it to the Vercel project under Settings → Domains.', 'Copy the DNS records Vercel shows into your registrar.', 'Vercel issues the HTTPS certificate automatically.'], ig.domain ? `Planned domain: ${esc(ig.domain)}` : '')}
    ${card('Supabase', ig.supabase, 'the database for members, posts, donations, forum and gallery; sign-in with Google, Facebook and email; photo and image storage.', ['Create a Supabase project for the masjid.', 'Run the database setup we’ll prepare (tables and access rules).', 'Turn on Google and Facebook under Authentication → Providers. Each needs an app created in Google Cloud and Meta for Developers.', 'Add the project URL and keys to Vercel.'])}
    ${card('Resend (email)', ig.resend, 'announcement and post notifications, invitations, receipts and Ask the Imam replies.', ['Create a Resend account.', 'Add your domain in Resend and copy its DNS records (SPF and DKIM) into your registrar to verify it.', 'Create an API key and store it as a secret on the server, never in the website code.', 'Queued emails in the outbox start sending.'], 'Needs the domain first, because email is sent from an address on it.')}
    ${card('Stripe (payments)', ig.stripe, 'donations, supporting-member dues, recurring gifts and receipts.', ['Create a Stripe account in the masjid’s name and add its bank account.', 'Create the monthly and yearly supporting-member prices.', 'Add the API keys and a webhook so dues status and receipts update on their own.'])}
  </div>`;
}

/* ================= Prayer & site settings ================= */
function aPrayer() {
  const st = S.settings;
  const rule = k => `<div class="form-grid two" style="align-items:end"><label class="f">${pName(k)} iqamah<select name="${k}-mode"><option value="offset" ${st.iqamah[k].mode === 'offset' ? 'selected' : ''}>Minutes after adhan</option><option value="fixed" ${st.iqamah[k].mode === 'fixed' ? 'selected' : ''}>Fixed time</option></select></label>
    <label class="f"><span class="sr">${pName(k)} value</span>${st.iqamah[k].mode === 'fixed' ? `<input type="time" name="${k}-value" value="${st.iqamah[k].value}">` : `<input type="number" min="0" max="90" name="${k}-value" value="${st.iqamah[k].value}">`}</label></div>`;
  return `<form class="card pad-lg form-grid" data-form="prayer"><h3 style="margin:0">Calculation</h3>
    <div class="form-grid two"><label class="f">Method<select name="method">${Object.entries(PT.METHODS).map(([k, m]) => `<option value="${k}" ${st.method === k ? 'selected' : ''}>${m.name}</option>`).join('')}</select></label>
    <label class="f">Asr<select name="asr"><option value="standard" ${st.asr === 'standard' ? 'selected' : ''}>Standard (Shafi’i, Maliki, Hanbali)</option><option value="hanafi" ${st.asr === 'hanafi' ? 'selected' : ''}>Hanafi</option></select></label></div>
    <h3 style="margin:8px 0 0">Iqamah</h3><p class="small muted" style="margin:0">Offsets round up to the next 5 minutes, except Maghrib.</p>
    ${['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(rule).join('')}
    <h3 style="margin:8px 0 0">Jumu’ah</h3>
    ${[0, 1].map(i => { const j = st.jumuah[i] || { khutbah: '', salah: '', place: '' }; return `<div class="form-grid two"><label class="f">${i ? 'Second' : 'First'} khutbah${i ? ' <span class="hint">Leave blank if none</span>' : ''}<input type="time" name="j${i}-khutbah" value="${j.khutbah}" ${i ? '' : 'required'}></label><label class="f">Salah<input type="time" name="j${i}-salah" value="${j.salah}"></label><label class="f full">Place<input name="j${i}-place" value="${esc(j.place)}"></label></div>`; }).join('')}
    <div class="form-grid two"><label class="f">This week’s topic<input name="topic" value="${esc(st.jumuahTopic)}"></label><label class="f">Khateeb<input name="khateeb" value="${esc(st.jumuahKhateeb)}"></label></div>
    <div><button class="btn" type="submit">Save prayer settings</button></div></form>`;
}
function aSite() {
  const st = S.settings;
  return `<form class="card pad-lg form-grid" data-form="alert"><h3 style="margin:0">Urgent alert</h3><p class="small muted" style="margin:0">Shows as a banner at the top of every page, for janazah announcements, closures or weather.</p>
    ${st.alert ? `<div class="alert-bar ${esc(st.alert.kind)}" style="border-radius:10px">${esc(st.alert.text)}</div><div><button type="button" class="btn ghost sm" data-action="clear-alert">Remove alert</button></div>` : ''}
    <div class="form-grid two"><label class="f">Kind<select name="kind"><option value="janazah">Janazah</option><option value="closure">Closure</option><option value="weather">Weather</option><option value="info">General notice</option></select></label><label class="f">Message<input name="text" required placeholder="e.g. Janazah after Dhuhr today for…"></label></div>
    <label class="check"><input type="checkbox" name="inbox" checked> Also send to all members’ inboxes</label>
    <label class="check"><input type="checkbox" name="email" ${S.emailSettings.auto.alert ? 'checked' : ''}> Email subscribers who turned on urgent alerts</label>
    <div><button class="btn" type="submit">${icon('bell')} Post alert</button></div></form>
  <form class="card pad-lg form-grid" data-form="logo"><h3 style="margin:0">Logo</h3><div class="row"><span class="brand"><span class="mark" style="width:56px;height:56px">${logoHTML()}</span></span><span class="small muted">Upload the Canva logo as a PNG. It replaces the placeholder in the header and menu.</span></div>
    <label class="f"><span class="sr">Logo file</span><input type="file" name="logo" accept="image/*" required></label><div class="row"><button class="btn sm" type="submit">Upload logo</button>${st.logo ? '<button type="button" class="btn ghost sm" data-action="clear-logo">Use placeholder</button>' : ''}</div></form>
  <form class="card pad-lg form-grid two" data-form="site"><h3 class="full" style="margin:0">Masjid details</h3>
    <label class="f full">Name<input name="name" value="${esc(st.name)}"></label>
    <label class="f full">Address<input name="address" value="${esc(st.address)}"></label>
    <label class="f">Phone<input name="phone" value="${esc(st.phone)}"></label>
    <label class="f">Email<input name="email" value="${esc(st.email)}"></label>
    <label class="f full">Parking instructions <span class="hint">One per line</span><textarea name="parking" style="min-height:150px">${esc(st.parking.join('\n'))}</textarea></label>
    <h3 class="full" style="margin:8px 0 0">Giving</h3>
    <label class="f">Supporting member, monthly ($)<input type="number" min="1" name="monthly" value="${st.tiers.monthly}"></label>
    <label class="f">Supporting member, yearly ($)<input type="number" min="1" name="yearly" value="${st.tiers.yearly}"></label>
    <label class="f">Gold price per gram ($)<input type="number" step="0.01" min="0" name="gold" value="${st.nisab.goldPerGram}"></label>
    <label class="f">Silver price per gram ($)<input type="number" step="0.01" min="0" name="silver" value="${st.nisab.silverPerGram}"></label>
    <label class="f">Zakat al-fitr per person ($)<input type="number" min="1" name="fitr" value="${st.fitrPerPerson}"></label>
    <h3 class="full" style="margin:8px 0 0">Ramadan</h3>
    <label class="f">First day of Ramadan<input type="date" name="ramadanStart" value="${st.ramadanStart}"></label>
    <label class="f">Eid al-Fitr<input type="date" name="eidFitr" value="${st.eidFitr}"></label>
    <label class="f full">Taraweeh schedule<input name="taraweeh" value="${esc(st.taraweeh)}"></label>
    <div class="full"><button class="btn" type="submit">Save settings</button></div></form>
  <div class="card"><h3>Preview data</h3><p class="small muted">Everything you change in this preview is saved in this browser only. Reset to start over with the sample content.</p><button class="btn ghost sm" data-action="reset-demo">Reset sample data</button></div>`;
}

/* ================= Admin actions ================= */
const selIds = () => Object.keys(UI.sel || {}).filter(k => UI.sel[k]);
Object.assign(A, {
  ctype: el => { UI.ctype = el.dataset.v; render(false); },
  cstat: el => { UI.cstat = el.dataset.v; render(false); },
  mf: el => { UI.mf = el.dataset.v; UI.sel = {}; render(false); },
  mtab: (el, e) => { e.preventDefault(); UI.mtab = el.dataset.v; render(false); },
  'del-content': el => { const it = findContent(el.dataset.kind, el.dataset.id); modal('Delete this ' + CK[el.dataset.kind].label.toLowerCase() + '?', `<p><strong>${esc(it.title)}</strong> will be removed from the site. This can’t be undone.</p><div class="row"><button class="btn danger" data-action="del-content-yes" data-kind="${el.dataset.kind}" data-id="${el.dataset.id}">Delete</button><button class="btn ghost" data-action="close-modal">Cancel</button></div>`); },
  'del-content-yes': el => { const c = CK[el.dataset.kind].coll; S[c] = S[c].filter(x => x.id !== el.dataset.id); closeModal(); if (route().startsWith('admin-edit')) location.hash = 'admin-content'; commit('Deleted.'); },
  'ed-cover-clear': () => { UI.ed.cover = null; refreshCover(); },
  'ed-preview': () => {
    const form = $('[data-form="editor"]'); const { fd, kind, html } = readEditor(form);
    const title = fd.get('title') || 'Untitled';
    const meta = kind === 'event' ? `${fd.get('edate') ? fmtDate(fd.get('edate'), { weekday: 'long', month: 'long', day: 'numeric' }) : 'Date not set'} · ${hm12(fd.get('etime'))} · ${esc(fd.get('place') || '')}` : kind === 'khutbah' ? `${fd.get('kdate') ? fmtLong(fd.get('kdate')) : ''} · ${esc(fd.get('khateeb') || '')}` : kind === 'resource' ? `${esc(fd.get('topic') || '')} · ${esc(fd.get('url') || '')}` : fmtLong(nowIso());
    const lines = k => (fd.get(k) || '').split('\n').map(s => s.trim()).filter(Boolean);
    modal('Preview', `<article class="prose"><div class="small muted">${meta}</div><h1 style="font-size:28px;margin-top:6px">${esc(title)}</h1>${UI.ed.cover ? `<img src="${UI.ed.cover}" alt="" style="border-radius:12px;margin:10px 0">` : ''}${kind === 'resource' ? `<p>${esc(fd.get('desc') || '')}</p>` : html || '<p class="muted">No text yet.</p>'}
      ${kind === 'khutbah' && lines('takeaways').length ? `<h3>Key takeaways</h3><ul>${lines('takeaways').map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${kind === 'khutbah' && lines('refs').length ? `<h3>References</h3><ul>${lines('refs').map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</article>`);
  },
  bulk: el => {
    const ids = selIds(), v = el.dataset.v, us = ids.map(userById).filter(Boolean);
    if (v === 'clear') { UI.sel = {}; return render(false); }
    if (v === 'message') return modal(`Message ${ids.length} member${ids.length === 1 ? '' : 's'}`, msgForm('list', ids.join(',')));
    us.forEach(u => { if (v === 'paid') { if (u.tier === 'paid') { u.dues = 'active'; u.renews = addDays(nowIso(), 30); } } if (v === 'supporting') { u.tier = 'paid'; u.dues = u.dues || 'active'; u.renews = u.renews || addDays(nowIso(), 30); } if (v === 'free') { u.tier = 'free'; u.dues = null; u.renews = null; } });
    UI.sel = {}; commit(`Updated ${us.length} member${us.length === 1 ? '' : 's'}.`);
  },
  'add-member': () => modal('Add a member', `<form class="form-grid" data-form="add-member"><label class="f">Full name<input name="name" required></label><label class="f">Email<input name="email" type="email" required></label><label class="f">Phone<input name="phone"></label><label class="f">Plan<select name="tier"><option value="free">Free community member</option><option value="paid">Supporting member</option></select></label><label class="check"><input type="checkbox" name="welcome" checked> Send a welcome email with a sign-in link (queued until Resend is connected)</label><button class="btn block" type="submit">Add member</button></form>`),
  'msg-member': el => modal('Message ' + nameOf(el.dataset.id), msgForm('user', el.dataset.id)),
  'remove-member': el => modal('Remove ' + nameOf(el.dataset.id) + '?', `<p>Their account is deleted and they’re removed from events, classes and shifts. Past donations stay in your records under their name.</p><div class="row"><button class="btn danger" data-action="remove-yes" data-id="${el.dataset.id}">Remove member</button><button class="btn ghost" data-action="close-modal">Cancel</button></div>`),
  'remove-yes': el => { const u = userById(el.dataset.id); S.donations.forEach(d => { if (d.userId === u.id) { d.userId = null; d.name = u.name; } }); S.events.forEach(e => e.rsvps = e.rsvps.filter(x => x !== u.id)); S.programs.forEach(p => p.regs = p.regs.filter(x => x !== u.id)); S.shifts.forEach(s => s.signups = s.signups.filter(x => x !== u.id)); S.users = S.users.filter(x => x !== u); closeModal(); location.hash = 'admin-members'; commit(u.name + ' was removed.'); },
  mod: el => { const t = S.topics.find(x => x.id === el.dataset.id); const v = el.dataset.v; if (v === 'pin') t.pinned = !t.pinned; if (v === 'lock') t.locked = !t.locked; if (v === 'clear') t.reports = 0; if (v === 'delete') { S.topics = S.topics.filter(x => x !== t); if (route().startsWith('topic')) location.hash = 'community'; } commit(v === 'delete' ? 'Topic deleted.' : 'Updated.'); },
  'del-msg': el => { S.messages = S.messages.filter(x => x.id !== el.dataset.id); commit('Message deleted.'); },
  'del-shift': el => { S.shifts = S.shifts.filter(x => x.id !== el.dataset.id); commit('Shift deleted.'); },
  photo: el => { const g = S.gallery.find(x => x.id === el.dataset.id); const v = el.dataset.v; if (v === 'removed') S.gallery = S.gallery.filter(x => x !== g); else g.status = v; commit(v === 'approved' ? 'Photo published to the gallery.' : v === 'rejected' ? 'Photo rejected.' : 'Photo removed.'); },
  'inbox-set': el => { const i = S.inbox.find(x => x.id === el.dataset.id); i.status = el.dataset.v; commit(el.dataset.v === 'approved' ? 'Booking approved.' : el.dataset.v === 'declined' ? 'Booking declined.' : 'Marked done.'); },
  'inbox-reply': el => { const i = S.inbox.find(x => x.id === el.dataset.id); modal('Reply to question', `<p class="small"><strong>${esc(i.subject)}</strong><br>${esc(i.body)}</p><form class="form-grid" data-form="imam-reply" data-id="${i.id}"><label class="f">Answer<textarea name="reply" required></textarea></label><p class="tiny muted" style="margin:0">${i.userId ? 'The answer goes to the member’s inbox.' : i.email ? 'The answer will be emailed once email is connected.' : 'Sent anonymously, so there is no one to reply to directly. You can share the answer in a post.'}</p><button class="btn block" type="submit">Send answer</button></form>`); },
  'copy-csv': async () => { const rows = [['Name', 'Email', 'Phone', 'Plan', 'Dues', 'Role', 'Status', 'Joined', 'Sign-in'], ...S.users.map(u => [u.name, u.email, u.phone || '', u.tier, u.dues || '', ROLE_LABEL[roleOf(u)], u.status, u.joined, u.provider])]; UI.copyText = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'); try { await navigator.clipboard.writeText(UI.copyText); toast('Member list copied as CSV. Paste it into a spreadsheet.'); } catch (e) { toast('Copy isn’t allowed in this preview.'); } },
  'email-preview': el => modal('Email preview', emailPreview(S.emails.find(x => x.id === el.dataset.id))),
  'email-remove': el => { S.emails = S.emails.filter(x => x.id !== el.dataset.id); commit('Removed from the outbox.'); },
  'clear-alert': () => { S.settings.alert = null; commit('Alert removed.'); },
  'clear-logo': () => { S.settings.logo = null; commit('Placeholder logo restored.'); },
  'reset-demo': () => modal('Reset sample data?', `<p>This clears everything you changed in this browser and restores the sample content.</p><div class="row"><button class="btn danger" data-action="reset-yes">Reset</button><button class="btn ghost" data-action="close-modal">Cancel</button></div>`),
  'reset-yes': () => { const cur = S.currentUserId; S = seed(); S.currentUserId = userById(cur) ? cur : null; UI.sel = {}; closeModal(); commit('Sample data restored.'); }
});
function msgForm(kind, to) {
  return `<form class="form-grid" data-form="direct-msg" data-kind="${kind}" data-to="${esc(to)}"><label class="f">Subject<input name="subject" required></label><label class="f">Message<textarea name="body" required></textarea></label><label class="check"><input type="checkbox" name="email"> Also email (queued until Resend is connected)</label><button class="btn block" type="submit">${icon('send')} Send</button></form>`;
}
function refreshCover() {
  const d = $('#cover-drop'); if (!d) return;
  d.innerHTML = (UI.ed.cover ? `<img src="${UI.ed.cover}" alt="">` : `${icon('image')}<span class="small muted">Tap to add a photo</span>`) + `<input type="file" accept="image/*" class="sr" data-action-change="ed-cover">`;
  const next = d.nextElementSibling;
  if (UI.ed.cover && !(next && next.dataset.action === 'ed-cover-clear')) d.insertAdjacentHTML('afterend', `<button type="button" class="link-btn small" data-action="ed-cover-clear">Remove image</button>`);
  if (!UI.ed.cover && next && next.dataset.action === 'ed-cover-clear') next.remove();
}
Object.assign(CHANGE, {
  'set-role': el => { const u = userById(el.dataset.id); if (!can('roles')) return toast('Only a super admin can change roles.'); if (u.id === me().id) { toast('You can’t change your own role.'); return render(false); } u.role = el.value; commit(`${u.name} is now ${el.value === 'member' ? 'a member' : (/^[aeiou]/i.test(ROLE_LABEL[el.value]) ? 'an ' : 'a ') + ROLE_LABEL[el.value].toLowerCase()}.`); },
  sel: el => { UI.sel = { ...(UI.sel || {}), [el.dataset.id]: el.checked }; render(false); },
  'sel-all': el => { UI.sel = {}; if (el.checked) $$('[data-action-change="sel"]').forEach(c => UI.sel[c.dataset.id] = true); render(false); },
  'ed-cover': async el => { const src = await readImage(el.files[0]); if (src) { UI.ed.cover = src; refreshCover(); } },
  'ed-status': el => { const v = el.value; $('#sched').hidden = v !== 'schedule'; $('#ed-submit').textContent = v === 'draft' ? 'Save draft' : v === 'schedule' ? 'Schedule' : (el.form.dataset.live === '1' ? 'Update' : 'Publish'); },
  'ed-aud': el => { const form = el.form; const kind = form.dataset.kind; const n = subscribers(KIND_PREF[kind], el.value).length; const p = $('#sub-count'); if (p) p.textContent = `${n} people have “${PREF_KEYS.find(x => x[0] === KIND_PREF[kind])[1]}” emails turned on. Emails wait in the outbox until Resend is connected.`; }
});

/* ================= Admin forms ================= */
Object.assign(F, {
  async editor(fd0, form) {
    const { fd, kind, html } = readEditor(form);
    const id = form.dataset.id, isNew = id === 'new';
    const title = (fd.get('title') || '').trim();
    if (!title) { form.querySelector('[name=title]').focus(); return toast('Add a title first.'); }
    const req = { article: ['desc', 'topic'], resource: ['url', 'topic', 'desc'], khutbah: ['kdate', 'khateeb'], event: ['edate', 'etime'] }[kind] || [];
    for (const k of req) if (!(fd.get(k) || '').trim()) { form.querySelector(`[name=${k}]`)?.focus(); return toast('Please fill in the highlighted field.'); }
    if (kind === 'resource' && !/^https?:\/\//i.test(fd.get('url'))) { form.querySelector('[name=url]').focus(); return toast('Links need to start with https://'); }
    const status = fd.get('status');
    if (status === 'schedule') { const when = etDate(fd.get('sdate'), fd.get('stime') || '09:00'); if (!fd.get('sdate') || when.getTime() <= Date.now()) return toast('Pick a date and time in the future to schedule.'); }
    const it = isNew ? { id: uid({ news: 'p', announcement: 'p', article: 'r', resource: 'r', khutbah: 'k', event: 'e' }[kind]) } : findContent(kind, id);
    const wasLive = !isNew && isLive(it);
    it.title = title;
    it.status = status === 'draft' ? 'draft' : status === 'schedule' ? 'scheduled' : 'published';
    if (status === 'schedule') { it.pubDate = fd.get('sdate'); it.pubTime = fd.get('stime') || '09:00'; } else { delete it.pubDate; delete it.pubTime; }
    const pubDay = status === 'schedule' ? it.pubDate : nowIso();
    if (kind === 'news' || kind === 'announcement') { it.type = kind; it.audience = fd.get('audience'); it.pinned = !!fd.get('pinned'); it.html = html; it.body = plainOf({ html }); it.image = UI.ed.cover; it.author = it.author || me().id; if (!wasLive) it.date = pubDay; }
    if (kind === 'article') { it.type = 'article'; it.topic = fd.get('topic').trim(); it.desc = fd.get('desc').trim(); it.html = html; it.body = plainOf({ html }); it.url = ''; it.image = UI.ed.cover; it.featured = !!fd.get('featured'); it.author = it.author || me().id; if (!wasLive) it.date = pubDay; }
    if (kind === 'resource') { it.type = fd.get('rtype'); it.topic = fd.get('topic').trim(); it.url = fd.get('url').trim(); it.desc = fd.get('desc').trim(); it.image = UI.ed.cover; it.featured = !!fd.get('featured'); it.author = it.author || me().id; if (!wasLive) it.date = pubDay; }
    if (kind === 'khutbah') { const lines = k => (fd.get(k) || '').split('\n').map(s => s.trim()).filter(Boolean); it.date = fd.get('kdate'); it.khateeb = fd.get('khateeb'); it.html = html; it.summary = plainOf({ html }); it.takeaways = lines('takeaways'); it.refs = lines('refs'); it.media = { audio: fd.get('audio'), video: fd.get('video') }; }
    if (kind === 'event') { it.date = fd.get('edate'); it.time = fd.get('etime'); it.place = fd.get('place'); it.category = fd.get('category') || 'Community'; it.capacity = +fd.get('capacity') || null; it.html = html; it.desc = plainOf({ html }); it.image = UI.ed.cover; it.rsvps = it.rsvps || []; }
    if (isNew) { const c = CK[kind].coll; c === 'posts' || c === 'resources' ? S[c].unshift(it) : S[c].push(it); }
    if (isNew && kind === 'khutbah' && fd.get('forum') && status !== 'draft') S.topics.unshift({ id: uid('t'), cat: 'Islamic knowledge', title: 'Khutbah discussion: ' + it.title, body: excerpt({ html }, 400), authorId: 'admin', date: nowIso(), pinned: false, locked: false, likes: [], replies: [], khutbahId: it.id });
    let note = '';
    if (status !== 'draft' && !wasLive) {
      const aud = it.audience === 'paid' ? 'paid' : 'all';
      if (fd.get('notify_inbox')) S.messages.push({ id: uid('m'), date: pubDay, audience: aud, type: 'announcement', subject: it.title, body: excerpt(it.html || it.body ? it : { body: it.desc || '' }, 300), action: '', responses: [], channels: ['site'] });
      if (fd.get('notify_email')) { const n = queueEmail(kind, it, it.audience || 'public'); note = ` Email to ${n} subscribers is in the outbox.`; }
    }
    UI.ed = null;
    save();
    location.hash = 'admin-content';
    toast((status === 'draft' ? 'Draft saved.' : status === 'schedule' ? `Scheduled for ${fmtDate(it.pubDate, { month: 'long', day: 'numeric' })} at ${hm12(it.pubTime)}.` : wasLive ? 'Changes published.' : 'Published.') + note);
  },
  async quick(fd, form) {
    const aud = fd.get('audience'); const kind = aud === 'public' ? 'news' : 'announcement';
    const p = { id: uid('p'), type: kind, audience: aud, title: fd.get('title').trim(), body: fd.get('body').trim(), date: nowIso(), author: me().id, status: 'published' };
    S.posts.unshift(p);
    let note = ''; if (fd.get('email')) note = ` Email to ${queueEmail(kind, p, aud)} subscribers is in the outbox.`;
    form.reset(); commit('Posted.' + note);
  },
  async message(fd, form) { const m = { id: uid('m'), date: nowIso(), audience: fd.get('audience'), type: fd.get('type'), subject: fd.get('subject'), body: fd.get('body'), action: fd.get('action') || '', responses: [], channels: ['site', fd.get('email') && 'email', fd.get('sms') && 'sms'].filter(Boolean) }; S.messages.push(m);
    if (fd.get('email')) S.emails.unshift({ id: uid('em'), date: nowIso(), kind: 'message', subject: m.subject, excerpt: m.body.slice(0, 220), link: '#account', count: audCount(m.audience), status: 'waiting' });
    form.reset(); UI.maud = 'all'; commit(`Sent to ${audCount(m.audience)} members’ inboxes.${fd.get('email') ? ' Email is queued in the outbox.' : ''}${fd.get('sms') ? ' Text messages need an SMS service later.' : ''}`); },
  async 'direct-msg'(fd, form) {
    const ids = form.dataset.to.split(',').filter(Boolean);
    const m = { id: uid('m'), date: nowIso(), audience: form.dataset.kind === 'user' ? 'user:' + ids[0] : 'list', to: ids, type: 'announcement', subject: fd.get('subject'), body: fd.get('body'), action: '', responses: [], channels: ['site', fd.get('email') && 'email'].filter(Boolean) };
    S.messages.push(m);
    if (fd.get('email')) S.emails.unshift({ id: uid('em'), date: nowIso(), kind: 'message', subject: m.subject, excerpt: m.body.slice(0, 220), link: '#account', count: ids.length, status: 'waiting' });
    UI.sel = {}; closeModal(); commit(`Message sent to ${ids.length === 1 ? nameOf(ids[0]) : ids.length + ' members'}.`);
  },
  async 'add-member'(fd) {
    const email = fd.get('email').trim().toLowerCase();
    if (S.users.some(u => u.email.toLowerCase() === email)) return toast('Someone with that email is already a member.');
    const paid = fd.get('tier') === 'paid';
    const u = { id: uid('u'), name: fd.get('name').trim(), email, phone: fd.get('phone') || '', tier: paid ? 'paid' : 'free', role: 'member', status: 'active', joined: nowIso(), provider: 'Added by staff', dues: paid ? 'active' : null, renews: paid ? addDays(nowIso(), 30) : null, notes: 'Added by ' + me().name, prefs: { announcements: true, news: true, articles: true, events: true, khutbah: true, alerts: true } };
    S.users.push(u);
    if (fd.get('welcome')) S.emails.unshift({ id: uid('em'), date: nowIso(), kind: 'message', subject: 'Welcome to ' + S.settings.name, excerpt: `Assalamu alaikum ${u.name.split(' ')[0]}, you’ve been added as a member. Use the link to sign in with Google, Facebook or your email.`, link: '#account', count: 1, status: 'waiting' });
    closeModal(); commit(u.name + ' was added.');
  },
  async 'member-save'(fd, form) {
    const u = userById(form.dataset.id);
    u.name = fd.get('name').trim(); u.email = fd.get('email').trim(); u.phone = fd.get('phone'); u.tier = fd.get('tier'); u.dues = u.tier === 'paid' ? (fd.get('dues') || 'active') : null; u.renews = u.tier === 'paid' ? (fd.get('renews') || addDays(nowIso(), 30)) : null;
    if (can('roles') && fd.get('role') && u.id !== me().id) u.role = fd.get('role');
    if (can('roles')) u.title = (fd.get('title') || '').trim();
    if (fd.get('status') && u.id !== me().id) u.status = fd.get('status');
    u.volunteer = !!fd.get('volunteer'); u.notes = fd.get('notes');
    commit('Saved.');
  },

  async invite(fd, form) {
    const email = fd.get('email').trim().toLowerCase(), role = fd.get('role');
    let u = S.users.find(x => x.email.toLowerCase() === email);
    const title = (fd.get('title') || '').trim();
    if (u) { u.role = role; if (title) u.title = title; } else { u = { id: uid('u'), name: fd.get('name').trim(), email, phone: '', tier: 'free', role, title, status: 'invited', joined: nowIso(), provider: 'Invite', dues: null, renews: null, notes: '', prefs: { announcements: true, news: true, articles: true, events: true, khutbah: true, alerts: true } }; S.users.push(u); S.emails.unshift({ id: uid('em'), date: nowIso(), kind: 'message', subject: `You’re invited to help run the ${S.settings.name} website`, excerpt: `${me().name} added you as ${ROLE_LABEL[role].toLowerCase()}. Sign in with this email address to get started.`, link: '#account', count: 1, status: 'waiting' }); }
    form.reset(); commit(`${u.name} added as ${ROLE_LABEL[role].toLowerCase()}.${u.status === 'invited' ? ' Invitation email is queued.' : ''}`);
  },
  async 'imam-reply'(fd, form) { const i = S.inbox.find(x => x.id === form.dataset.id); i.reply = fd.get('reply'); i.status = 'answered'; closeModal(); commit('Answer sent.'); },
  async shift(fd, form) { S.shifts.push({ id: uid('s'), title: fd.get('title'), when: fd.get('when'), slots: +fd.get('slots') || 1, signups: [] }); form.reset(); commit('Shift added.'); },
  async category(fd) { const c = fd.get('cat').trim(); if (c && !S.forumCats.includes(c)) S.forumCats.push(c); commit('Category added.'); },
  async prayer(fd) { const st = S.settings; st.method = fd.get('method'); st.asr = fd.get('asr');
    for (const k of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) { const mode = fd.get(k + '-mode'); let v = fd.get(k + '-value'); if (mode !== st.iqamah[k].mode) v = mode === 'fixed' ? '13:30' : 10; st.iqamah[k] = { mode, value: mode === 'fixed' ? v : +v }; }
    st.jumuah = [0, 1].map(i => ({ khutbah: fd.get(`j${i}-khutbah`), salah: fd.get(`j${i}-salah`), place: fd.get(`j${i}-place`) })).filter(j => j.khutbah);
    st.jumuahTopic = fd.get('topic'); st.jumuahKhateeb = fd.get('khateeb'); commit('Prayer settings saved.'); },
  async alert(fd) { const kind = fd.get('kind'), text = fd.get('text'); S.settings.alert = { kind, text, date: nowIso() }; sessionDismissed = false;
    const subj = { janazah: 'Janazah announcement', closure: 'Masjid closure', weather: 'Weather update', info: 'Notice' }[kind];
    if (fd.get('inbox')) S.messages.push({ id: uid('m'), date: nowIso(), audience: 'all', type: 'announcement', subject: subj, body: text, action: '', responses: [], channels: ['site'] });
    let note = ''; if (fd.get('email')) note = ` Email to ${queueEmail('alert', { title: subj, body: text }, 'public')} subscribers is in the outbox.`;
    commit('Alert posted across the site.' + note); },
  async logo(fd) { const src = await readImage(fd.get('logo'), 400); S.settings.logo = src; commit('Logo updated.'); },
  async site(fd) { const st = S.settings; st.name = fd.get('name'); st.address = fd.get('address'); st.phone = fd.get('phone'); st.email = fd.get('email'); st.parking = fd.get('parking').split('\n').map(s => s.trim()).filter(Boolean); st.tiers = { monthly: +fd.get('monthly'), yearly: +fd.get('yearly') }; st.nisab = { goldPerGram: +fd.get('gold'), silverPerGram: +fd.get('silver'), updated: nowIso() }; st.fitrPerPerson = +fd.get('fitr'); st.ramadanStart = fd.get('ramadanStart'); st.eidFitr = fd.get('eidFitr'); st.taraweeh = fd.get('taraweeh'); commit('Settings saved.'); },
  async 'email-auto'(fd) { Object.keys(S.emailSettings.auto).forEach(k => S.emailSettings.auto[k] = !!fd.get(k)); commit('Defaults saved.'); },
  async 'email-sender'(fd) { S.emailSettings.fromName = fd.get('fromName'); S.emailSettings.fromAddress = fd.get('fromAddress'); commit('Sender saved.'); },
  async domain(fd) { const d = fd.get('domain').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase(); S.integrations.domain = d; if (d && /your-domain/.test(S.emailSettings.fromAddress)) S.emailSettings.fromAddress = 'updates@' + d; commit(d ? 'Domain saved. The email sender now uses it.' : 'Domain cleared.'); }
});

/* ================= Rich-text toolbar ================= */
let rteRange = null;
document.addEventListener('selectionchange', () => { const s = getSelection(); if (s.rangeCount && s.anchorNode && s.anchorNode.parentElement?.closest('.rte')) rteRange = s.getRangeAt(0).cloneRange(); });
document.addEventListener('mousedown', e => { if (e.target.closest('.rte-bar [data-cmd]')) e.preventDefault(); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cmd]'); if (!b) return;
  const wrap = b.closest('.rte-wrap'), ed = wrap.querySelector('.rte'), linkRow = wrap.querySelector('.rte-link');
  const restore = () => { ed.focus(); if (rteRange) { const s = getSelection(); s.removeAllRanges(); s.addRange(rteRange); } };
  const block = () => (document.queryCommandValue('formatBlock') || '').toLowerCase();
  const cmd = b.dataset.cmd;
  if (cmd === 'link') { linkRow.hidden = false; linkRow.querySelector('input').value = ''; linkRow.querySelector('input').focus(); return; }
  if (cmd === 'link-cancel') { linkRow.hidden = true; restore(); return; }
  restore();
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (err) {}
  if (cmd === 'bold' || cmd === 'italic') document.execCommand(cmd);
  if (cmd === 'h2' || cmd === 'h3') document.execCommand('formatBlock', false, block() === cmd ? '<p>' : `<${cmd}>`);
  if (cmd === 'quote') document.execCommand('formatBlock', false, block() === 'blockquote' ? '<p>' : '<blockquote>');
  if (cmd === 'ul') document.execCommand('insertUnorderedList');
  if (cmd === 'ol') document.execCommand('insertOrderedList');
  if (cmd === 'clear') { document.execCommand('removeFormat'); document.execCommand('formatBlock', false, '<p>'); }
  if (cmd === 'link-apply') {
    let url = linkRow.querySelector('input').value.trim(); linkRow.hidden = true;
    if (!url) return; if (!/^(https?:|mailto:)/i.test(url)) url = 'https://' + url;
    const s = getSelection();
    if (s.isCollapsed) document.execCommand('insertHTML', false, `<a href="${esc(url)}">${esc(url)}</a>`); else document.execCommand('createLink', false, url);
  }
});
document.addEventListener('input', e => { const ed = e.target.closest?.('.rte'); if (ed) ed.classList.toggle('is-empty', !ed.textContent.trim() && !ed.querySelector('li')); });
document.addEventListener('focusin', e => { if (e.target.closest?.('.rte')) { try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (err) {} } });
document.addEventListener('paste', e => { const ed = e.target.closest?.('.rte'); if (!ed) return; e.preventDefault(); const text = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, text); });
