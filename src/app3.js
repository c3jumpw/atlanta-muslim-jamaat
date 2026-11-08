/* ================= Giving ================= */
function vDonate(scrollZakat) {
  const f = UI.fund || 'sadaqah', amt = UI.amt ?? 50, freq = UI.freq || 'once';
  const u = me();
  const fundName = FUNDS.find(x => x.id === f)?.name;
  return `${head('Give', 'Donate', 'Give sadaqah, zakat or support the masjid. Monthly gifts help us plan.')}
  <div class="notice" style="margin-bottom:16px">${icon('shield')}<span>Preview only: card payments will go through Stripe once the account is connected. No card is charged here.</span></div>
  <div class="split">
    <form class="card pad-lg stack" data-form="donate">
      <div><h3>1. Choose a fund</h3><div class="fund-pick">${FUNDS.map(x => `<button type="button" data-action="fund" data-v="${x.id}" class="${x.id === f ? 'on' : ''}"><b>${x.name}</b>${x.desc}</button>`).join('')}</div></div>
      <div><h3>2. Amount</h3><div class="amounts">${[10, 25, 50, 100, 250, 500].map(a => `<button type="button" data-action="amt" data-v="${a}" class="${+amt === a ? 'on' : ''}">$${a}</button>`).join('')}</div>
        <label class="f" style="margin-top:10px">Other amount (USD)<input name="amount" type="number" min="1" step="1" value="${esc(amt)}" data-input="amt" inputmode="decimal"></label></div>
      <div><h3>3. How often</h3><div class="seg" role="group" aria-label="Frequency">${[['once', 'One time'], ['monthly', 'Monthly'], ['yearly', 'Yearly']].map(([v, l]) => `<button type="button" data-action="freq" data-v="${v}" class="${freq === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="form-grid two"><label class="f">Name<input name="name" value="${esc(u?.name || '')}" placeholder="Your name"></label><label class="f">Email for receipt<input name="email" type="email" value="${esc(u?.email || '')}" placeholder="you@example.com"></label>
      <label class="check full"><input type="checkbox" name="anon"> Show as anonymous to admins</label></div>
      <button class="btn gold block" type="submit">Give ${money(amt)} ${freq === 'once' ? '' : freq} to ${esc(fundName)}</button>
    </form>
    <div class="stack">
      <div class="card"><h3>Where your gift goes</h3><ul class="small prose" style="margin:0"><li><strong>Zakat</strong> goes only to eligible recipients, kept separate from other funds.</li><li><strong>Sadaqah</strong> helps families in need and community programs.</li><li><strong>Operations</strong> keeps the lights on: utilities, cleaning, insurance and staff.</li></ul></div>
      ${u ? `<div class="card"><h3>Your giving</h3><p class="small muted">${money(S.donations.filter(d => d.userId === u.id).reduce((s, d) => s + d.amount, 0))} given this year.</p><a class="btn ghost sm" href="#account">Receipts and statements</a></div>` : `<div class="card"><h3>Track your giving</h3><p class="small muted">Sign in to keep your receipts in one place and get a year-end statement.</p><a class="btn ghost sm" href="#account">Sign in</a></div>`}
      <div class="card"><h3>Membership dues</h3><p class="small muted">Supporting members pay ${money(S.settings.tiers.monthly)} a month or ${money(S.settings.tiers.yearly)} a year.</p><a class="btn ghost sm" href="#membership">See membership</a></div>
    </div>
  </div>
  <div id="zakat">${zakatHTML()}</div>`;
}
function zakatHTML() {
  const z = UI.z || {};
  const n = S.settings.nisab;
  const basis = z.basis || 'silver';
  const nisab = basis === 'gold' ? 87.48 * n.goldPerGram : 612.36 * n.silverPerGram;
  const fields = [['cash', 'Cash at home and in bank accounts'], ['gold', 'Value of gold and silver you own'], ['invest', 'Stocks, funds and other investments'], ['business', 'Business inventory and cash'], ['owed', 'Money owed to you that you expect back']];
  const total = fields.reduce((s, [k]) => s + (+z[k] || 0), 0) - (+z.debts || 0);
  const due = total >= nisab ? total * 0.025 : 0;
  return `<div class="section-title" style="margin-top:40px"><h2>Zakat calculator</h2></div>
  <div class="split">
    <div class="card pad-lg form-grid two">
      ${fields.map(([k, l]) => `<label class="f">${l}<input type="number" min="0" inputmode="decimal" placeholder="0" value="${esc(z[k] || '')}" data-zk="${k}"></label>`).join('')}
      <label class="f">Debts due now (subtract)<input type="number" min="0" inputmode="decimal" placeholder="0" value="${esc(z.debts || '')}" data-zk="debts"></label>
      <div class="full"><span class="small" style="font-weight:600">Nisab based on</span><div class="seg" style="margin-top:6px">${[['silver', 'Silver (612.36 g)'], ['gold', 'Gold (87.48 g)']].map(([v, l]) => `<button type="button" data-action="zbasis" data-v="${v}" class="${basis === v ? 'on' : ''}">${l}</button>`).join('')}</div>
      <p class="tiny muted" style="margin-top:8px">Many scholars recommend the silver nisab because it includes more people. Metal prices used here are set by the masjid (${money(n.goldPerGram)}/g gold, ${money(n.silverPerGram)}/g silver, updated ${fmtDate(n.updated, { month: 'short', day: 'numeric', year: 'numeric' })}). Check current prices before paying.</p></div>
    </div>
    <div class="stack">
      <div class="zakat-out" aria-live="polite"><div class="small" style="opacity:.85">Zakat due (2.5%)</div><div class="big" id="zakat-due">${money(Math.round(due * 100) / 100)}</div>
        <div class="small" style="opacity:.85" id="zakat-note">${total >= nisab ? `Your zakatable wealth of ${money(total)} is above the nisab of ${money(Math.round(nisab))}.` : `Below the nisab of ${money(Math.round(nisab))}. No zakat is due on these amounts.`}</div>
        <div style="margin-top:12px"><a class="btn gold sm" href="#donate" data-action="pay-zakat">Pay this zakat</a></div></div>
      <p class="tiny muted">Zakat is due once a lunar year has passed on wealth above the nisab. This calculator is a guide; for jewelry, retirement accounts or complex situations, <a href="#ask-imam">ask the imam</a>.</p>
    </div>
  </div>`;
}

function checkoutModal({ title, amount, freq, fund, onDone }) {
  modal(title, `<div class="stack">
    <div class="card" style="background:var(--surface-2)"><div class="row between"><span>${esc(fund)}</span><strong class="num">${money(amount)}${freq && freq !== 'once' ? ' / ' + (freq === 'monthly' ? 'month' : 'year') : ''}</strong></div></div>
    <div class="notice">${icon('shield')}<span>On the live site this step opens Stripe’s secure checkout for card, Apple Pay or Google Pay. Nothing is charged in this preview.</span></div>
    <button class="btn gold block" data-action="checkout-ok">Simulate a successful payment</button>
    <button class="btn ghost block" data-action="close-modal">Cancel</button></div>`);
  UI.onCheckout = onDone;
}

/* ================= Membership & account ================= */
function vMembership() {
  const lv = level(); const t = S.settings.tiers;
  const ck = icon('check');
  return `${head('Join the community', 'Membership', 'Membership turns visitors into a connected community. Start free; become a supporting member to sustain the masjid.')}
  <div class="grid g2" style="max-width:900px">
    <div class="card pad-lg tier"><div><span class="chip">Free</span></div><h2 style="margin:0">Community member</h2><div class="price">$0</div>
      <ul><li>${ck}Join the community forum</li><li>${ck}Members-only announcements</li><li>${ck}Submit photos to the gallery</li><li>${ck}RSVP to events and register for classes</li><li>${ck}Keep your donation receipts</li></ul>
      ${lv === 'visitor' ? `<a class="btn block" href="#account">Join free with Google, Facebook or email</a>` : `<div class="chip ok" style="justify-self:start">${lv === 'free' ? 'Your current plan' : 'Included'}</div>`}</div>
    <div class="card pad-lg tier featured"><div><span class="chip gold">Supporting</span></div><h2 style="margin:0">Supporting member</h2><div class="price">${money(t.monthly)}<small> / month</small></div><div class="small muted">or ${money(t.yearly)} a year</div>
      <ul><li>${ck}Everything in the free plan</li><li>${ck}Your dues fund the masjid’s running costs</li><li>${ck}Supporting member badge on the forum</li><li>${ck}Priority registration for classes and events</li><li>${ck}Supporting-member updates and annual giving statement</li></ul>
      ${lv === 'paid' ? `<div class="chip ok" style="justify-self:start">Active · renews ${fmtDate(me().renews || addDays(nowIso(), 30), { month: 'short', day: 'numeric' })}</div>` :
        `<div class="row"><button class="btn gold" data-action="upgrade" data-v="monthly">Pay monthly</button><button class="btn ghost" data-action="upgrade" data-v="yearly">Pay yearly</button></div>`}</div>
  </div>
  <div class="card" style="max-width:900px;margin-top:16px"><h3>Questions</h3><div class="prose small"><p><strong>Can I cancel?</strong> Yes, any time from your account. You keep the free plan.</p><p><strong>Is my membership fee zakat?</strong> No. Dues support operations. Give zakat separately on the <a href="#donate">donate page</a>.</p><p><strong>Can my family share one membership?</strong> Family memberships can be added later if the board decides to offer them.</p></div></div>`;
}

function signInHTML() {
  return `${head('Welcome', 'Sign in or join', 'Create a free account to join the forum, receive member announcements and keep your receipts.')}
  <div class="card pad-lg stack" style="max-width:480px">
    <button class="btn block ghost" data-action="oauth" data-v="Google" style="justify-content:flex-start">${icon('user')} Continue with Google</button>
    <button class="btn block ghost" data-action="oauth" data-v="Facebook" style="justify-content:flex-start">${icon('users')} Continue with Facebook</button>
    <div class="row" style="gap:10px"><hr style="flex:1;border:0;border-top:1px solid var(--line)"><span class="small muted">or with email</span><hr style="flex:1;border:0;border-top:1px solid var(--line)"></div>
    <form class="form-grid" data-form="signup">
      <label class="f">Full name<input name="name" required autocomplete="name"></label>
      <label class="f">Email<input name="email" type="email" required autocomplete="email"></label>
      <label class="check"><input type="checkbox" name="news" checked> Email me announcements and event reminders</label>
      <button class="btn block" type="submit">Create free account</button>
    </form>
    <p class="tiny muted" style="margin:0">Preview: Google and Facebook sign-in connect through Supabase at launch. Here they create a demo account.</p>
  </div>`;
}
function myMessages(u) {
  const lv = level();
  const match = m => m.audience === 'all' || (m.audience === 'free' && lv === 'free') || (m.audience === 'paid' && lv === 'paid') || m.audience === 'user:' + u.id || (m.audience === 'list' && (m.to || []).includes(u.id)) || (m.audience === 'overdue' && u.dues === 'overdue') || (m.audience === 'volunteers' && u.volunteer);
  return S.messages.filter(match).sort((a, b) => b.date.localeCompare(a.date));
}
function vAccount() {
  const u = me();
  if (!u) return signInHTML();
  const lv = level();
  const msgs = myMessages(u);
  const ann = S.posts.filter(p => p.type === 'announcement' && canSeePost(p)).sort((a, b) => b.date.localeCompare(a.date));
  const gifts = S.donations.filter(d => d.userId === u.id).sort((a, b) => b.date.localeCompare(a.date));
  const myEvents = S.events.filter(e => e.rsvps.includes(u.id));
  const myProg = S.programs.filter(p => p.regs.includes(u.id));
  const myShifts = S.shifts.filter(s => s.signups.includes(u.id));
  const myPhotos = S.gallery.filter(g => g.by === u.id);
  const replies = S.inbox.filter(i => i.userId === u.id && i.reply);
  return `<div class="page-head row between" style="align-items:flex-start"><div><div class="eyebrow">My account</div><h1>Assalamu alaikum, ${esc(u.name.split(' ')[0])}</h1>
    <div class="chip-row">${isStaff() ? `<span class="chip gold">${ROLE_LABEL[roleOf(u)]}</span>` : ''}${u.status === 'suspended' ? '<span class="chip bad">Suspended</span>' : ''}<span class="chip ${lv === 'free' ? '' : 'gold'}">${u.tier === 'paid' ? 'Supporting member' : 'Community member'}</span><span class="chip">Signed in with ${esc(u.provider)}</span></div></div>
    <button class="btn ghost sm" data-action="signout">Sign out</button></div>
  <div class="split">
    <div class="stack">
      <div class="card"><h3>Inbox</h3>
        ${msgs.length || replies.length ? '' : '<div class="empty">No messages yet.</div>'}
        ${replies.map(r => `<div class="queue-item"><div class="row between"><strong>Reply: ${esc(r.subject)}</strong><span class="chip green">From the imam</span></div><p class="small" style="margin:0">${esc(r.reply)}</p></div>`).join('')}
        ${msgs.map(m => { const resp = m.responses.find(r => r.userId === u.id); return `<div class="queue-item"><div class="row between"><strong>${esc(m.subject)}</strong><span class="small muted">${fmtDate(m.date)}</span></div><p class="small" style="margin:0">${esc(m.body)}</p>
          ${m.action ? (resp ? `<span class="chip ok">${icon('check')} You responded: ${esc(resp.answer)}</span>` : `<div class="row">${m.type === 'reminder' && /renew/i.test(m.action) ? `<a class="btn sm" href="#membership">${esc(m.action)}</a>` : `<button class="btn sm" data-action="respond" data-id="${m.id}">${esc(m.action)}</button>`}${m.type === 'request' ? `<button class="btn ghost sm" data-action="respond" data-id="${m.id}" data-v="Not this time">Not this time</button>` : ''}</div>`) : ''}</div>`; }).join('')}
      </div>
      <div class="card"><h3>Member announcements</h3>${ann.map(p => `<a class="list-item" href="#news-${p.id}">${dateTile(p.date)}<div>${audienceChip(p.audience)}<h4 style="margin:4px 0 0">${esc(p.title)}</h4></div></a>`).join('') || '<div class="empty">None right now.</div>'}</div>
      <div class="card"><h3>Giving history</h3>${gifts.length ? `<div class="table-wrap" style="border:0"><table><thead><tr><th>Date</th><th>Fund</th><th>Amount</th><th></th></tr></thead><tbody>${gifts.map(d => `<tr><td>${fmtDate(d.date, { month: 'short', day: 'numeric', year: 'numeric' })}</td><td>${esc(FUNDS.find(f => f.id === d.fund)?.name || d.fund)}${d.freq !== 'once' ? ` <span class="chip">${d.freq}</span>` : ''}</td><td class="num">${money(d.amount)}</td><td><button class="link-btn small" data-action="receipt" data-id="${d.id}">Receipt</button></td></tr>`).join('')}</tbody></table></div>
        <p class="small" style="margin-top:10px">Total this year: <strong class="num">${money(gifts.reduce((s, d) => s + d.amount, 0))}</strong></p>` : '<div class="empty">No gifts yet. <a href="#donate">Make your first gift</a>.</div>'}</div>
    </div>
    <div class="stack">
      <div class="card stack-sm"><h3 style="margin:0">Membership</h3>
        ${u.tier === 'paid' ? `<div class="row between"><span>Supporting member</span><span class="chip ${u.dues === 'overdue' ? 'bad' : 'ok'}">${u.dues === 'overdue' ? 'Dues overdue' : 'Dues paid'}</span></div><div class="small muted">Renews ${fmtDate(u.renews || addDays(nowIso(), 30), { month: 'long', day: 'numeric', year: 'numeric' })}</div>${u.dues === 'overdue' ? `<button class="btn gold sm" data-action="upgrade" data-v="monthly">Pay dues now</button>` : ''}<button class="link-btn small" style="justify-self:start" data-action="cancel-membership">Cancel supporting membership</button>` :
        `<div class="small muted">You’re on the free plan.</div><a class="btn gold sm" href="#membership">Become a supporting member</a>`}</div>
      <form class="card form-grid" data-form="prefs"><h3 style="margin:0">Email notifications</h3><p class="small muted" style="margin:0">Choose what the masjid emails you. Emails begin once the masjid connects its email service.</p>
        ${PREF_KEYS.map(([k, l]) => `<label class="check"><input type="checkbox" name="${k}" ${(u.prefs || {})[k] !== false ? 'checked' : ''}> ${l}</label>`).join('')}
        <div><button class="btn ghost sm" type="submit">Save email preferences</button></div></form>
      <div class="card"><h3>Profile</h3><form class="form-grid" data-form="profile"><label class="f">Name<input name="name" value="${esc(u.name)}"></label><label class="f">Email<input name="email" type="email" value="${esc(u.email)}"></label><label class="check"><input type="checkbox" name="volunteer" ${u.volunteer ? 'checked' : ''}> Add me to the volunteer list</label><button class="btn ghost sm" type="submit">Save profile</button></form></div>
      <div class="card"><h3>My schedule</h3>${[...myEvents.map(e => `<li>${esc(e.title)} · ${fmtDate(e.date)}</li>`), ...myProg.map(p => `<li>${esc(p.title)}</li>`), ...myShifts.map(s => `<li>Volunteer: ${esc(s.title)}</li>`)].join('') ? `<ul class="small prose" style="margin:0">${[...myEvents.map(e => `<li>${esc(e.title)} · ${fmtDate(e.date)}</li>`), ...myProg.map(p => `<li>${esc(p.title)}</li>`), ...myShifts.map(s => `<li>Volunteer: ${esc(s.title)}</li>`)].join('')}</ul>` : '<p class="small muted" style="margin:0">Nothing yet. Browse <a href="#events">events</a> and <a href="#programs">classes</a>.</p>'}</div>
      <div class="card"><h3>My photo submissions</h3>${myPhotos.length ? `<div class="gallery" style="grid-template-columns:repeat(3,1fr)">${myPhotos.map(g => `<div><div class="photo" style="cursor:default"><img src="${photoSrc(g)}" alt="${esc(g.caption)}"></div><span class="chip ${g.status === 'approved' ? 'ok' : g.status === 'pending' ? 'warn' : 'bad'}" style="margin-top:4px">${g.status === 'approved' ? 'Published' : g.status === 'pending' ? 'Awaiting approval' : 'Not approved'}</span></div>`).join('')}</div>` : '<p class="small muted" style="margin:0">Share your photos on the <a href="#gallery">gallery page</a>.</p>'}</div>
    </div>
  </div>`;
}

/* ================= Forum ================= */
function vForum(id) {
  if (!isMember()) return `${head('Members only', 'Community forum', 'A private space for the Atlanta Muslim Jamaat community to discuss topics, ask questions and organize.')}${gate('Sign in to join the conversation')}`;
  if (id) return vTopic(id);
  const cat = UI.fcat || 'All';
  const list = S.topics.filter(t => cat === 'All' || t.cat === cat).sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date));
  return `<div class="page-head row between" style="align-items:flex-end"><div><div class="eyebrow">Members only</div><h1>Community forum</h1><p>Be kind, stay on topic and keep the adab of a masjid gathering.</p></div><button class="btn" data-action="new-topic">${icon('chat')} New topic</button></div>
  <div class="filter-row">${['All', ...S.forumCats].map(x => `<button data-action="fcat" data-v="${esc(x)}" class="${x === cat ? 'on' : ''}">${esc(x)}</button>`).join('')}</div>
  <div class="card">${list.map(t => `<a class="topic" href="#topic-${t.id}"><span class="avatar">${initials(nameOf(t.authorId))}</span><div><div class="chip-row" style="margin-bottom:3px">${t.pinned ? `<span class="chip gold">${icon('pin')} Pinned</span>` : ''}${t.locked ? '<span class="chip">Locked</span>' : ''}<span class="chip">${esc(t.cat)}</span></div><h4 style="margin:0;font-size:16.5px">${esc(t.title)}</h4><div class="meta"><span>${esc(nameOf(t.authorId))}</span><span>${fmtDate(t.date)}</span><span>${t.replies.length} ${t.replies.length === 1 ? 'reply' : 'replies'}</span><span>${t.likes.length} likes</span></div></div></a>`).join('') || '<div class="empty">No topics yet. Start one.</div>'}</div>
  <p class="tiny muted" style="margin-top:12px">Community guidelines: no backbiting, no selling without permission, no politics campaigning, and report anything that breaks these rules. Moderators may remove posts.</p>`;
}
function badgeFor(id) { const u = userById(id); if (u && roleOf(u) !== 'member') return `<span class="chip gold">${ROLE_LABEL[roleOf(u)]}</span>`; return u?.tier === 'paid' ? '<span class="chip gold">Supporting</span>' : ''; }
function vTopic(id) {
  const t = S.topics.find(x => x.id === id); if (!t) return notFound();
  const u = me();
  return `<div class="crumbs"><a href="#community">← Community forum</a></div>
  <article class="card pad-lg">
    <div class="chip-row" style="margin-bottom:8px"><span class="chip">${esc(t.cat)}</span>${t.pinned ? '<span class="chip gold">Pinned</span>' : ''}${t.locked ? '<span class="chip">Locked</span>' : ''}</div>
    <h1 style="font-size:clamp(26px,5vw,34px)">${esc(t.title)}</h1>
    <div class="row small muted" style="margin-bottom:10px"><span class="avatar">${initials(nameOf(t.authorId))}</span><span>${esc(nameOf(t.authorId))}</span>${badgeFor(t.authorId)}<span>· ${fmtDate(t.date)}</span></div>
    ${para(t.body)}
    <div class="row"><button class="react ${t.likes.includes(u.id) ? 'on' : ''}" data-action="like" data-id="${t.id}">♥ ${t.likes.length}</button><button class="react" data-action="report" data-id="${t.id}">Report</button>
    ${can('forum') ? `<span style="flex:1"></span><button class="btn ghost sm" data-action="mod" data-v="pin" data-id="${t.id}">${t.pinned ? 'Unpin' : 'Pin'}</button><button class="btn ghost sm" data-action="mod" data-v="lock" data-id="${t.id}">${t.locked ? 'Unlock' : 'Lock'}</button><button class="btn danger sm" data-action="mod" data-v="delete" data-id="${t.id}">Delete</button>` : ''}</div>
    <div style="margin-top:14px">${t.replies.map(r => `<div class="reply"><span class="avatar">${initials(nameOf(r.authorId))}</span><div><div class="row small"><strong>${esc(nameOf(r.authorId))}</strong>${badgeFor(r.authorId)}<span class="muted">${fmtDate(r.date)}</span></div>${para(r.body)}<div class="row"><button class="react ${r.likes.includes(u.id) ? 'on' : ''}" data-action="like-reply" data-id="${t.id}" data-r="${r.id}">♥ ${r.likes.length}</button>${can('forum') || r.authorId === u.id ? `<button class="react" data-action="del-reply" data-id="${t.id}" data-r="${r.id}">Remove</button>` : ''}</div></div></div>`).join('')}</div>
    ${t.locked ? '<div class="notice" style="margin-top:12px">This topic is locked. New replies are turned off.</div>' : !canPost() ? '<div class="notice" style="margin-top:12px">Your account is suspended, so you can read but not post. Contact the masjid office.</div>' : `<form class="form-grid" data-form="reply" data-id="${t.id}" style="margin-top:16px"><label class="f">Your reply<textarea name="body" required placeholder="Write a reply"></textarea></label><div><button class="btn" type="submit">Post reply</button></div></form>`}
  </article>`;
}

/* ================= Gallery ================= */
function vGallery() {
  const list = S.gallery.filter(g => g.status === 'approved').sort((a, b) => b.date.localeCompare(a.date));
  const mine = me() ? S.gallery.filter(g => g.by === me().id && g.status === 'pending').length : 0;
  return `<div class="page-head row between" style="align-items:flex-end"><div><div class="eyebrow">Community moments</div><h1>Photo gallery</h1><p>Photos from our events. Members can submit photos; an admin approves them before they appear.</p></div>
    <button class="btn" data-action="${isMember() ? 'upload-photo' : 'need-login'}">${icon('upload')} Submit a photo</button></div>
  ${mine ? `<div class="notice green" style="margin-bottom:14px">${icon('check')}<span>You have ${mine} photo${mine > 1 ? 's' : ''} awaiting approval.</span></div>` : ''}
  <div class="gallery">${list.map(g => `<button class="photo" data-action="lightbox" data-id="${g.id}"><img src="${photoSrc(g)}" alt="${esc(g.caption)}" loading="lazy"><span class="cap">${esc(g.caption)}</span></button>`).join('')}</div>
  <p class="tiny muted" style="margin-top:12px">Illustrated placeholders stand in for real photos in this preview.</p>`;
}
