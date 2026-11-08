/* ================= Public views ================= */
const head = (eyebrow, title, lead = '') => `<div class="page-head">${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h1>${title}</h1>${lead ? `<p>${lead}</p>` : ''}</div>`;
const dateTile = iso => { const d = dIso(iso); return `<div class="date-tile"><span>${d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</span><b>${d.getUTCDate()}</b></div>`; };
const audienceChip = a => a === 'public' ? '' : a === 'paid' ? '<span class="chip gold">Supporting members</span>' : '<span class="chip green">Members</span>';

function vHome() {
  const posts = S.posts.filter(canSeePost).sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date)).slice(0, 4);
  const evs = S.events.filter(e => isLive(e) && e.date >= nowIso()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const k = S.khutbahs.filter(isLive).sort((a, b) => b.date.localeCompare(a.date))[0];
  const jum = S.settings.jumuah;
  const nextFri = (() => { const iso = nowIso(); const d = dIso(iso).getUTCDay(); return addDays(iso, (5 - d + 7) % 7); })();
  return `
  <section class="hero home" id="hero">${heroHTML()}</section>
  <div class="quick" style="margin-top:16px">
    ${[['learn-salah', 'Learn to pray', 'book'], ['donate', 'Give', 'heart'], ['membership', 'Become a member', 'users'], ['events', 'Events', 'cal'], ['ask-imam', 'Ask the Imam', 'help'], ['library', 'Library', 'mic']]
      .map(([r, l, i]) => `<a href="#${r}"><span class="qi">${icon(i)}</span>${l}</a>`).join('')}
  </div>

  ${showInstallBanner() ? `<div class="install-banner"><span class="brand"><span class="mark">${EMBLEM}</span></span><div style="flex:1;min-width:0"><strong>Save AMJ to your phone</strong><div class="small muted">Open prayer times in one tap, like an app.</div></div><a class="btn sm" href="#save-to-phone">Show me how</a><button class="icon-btn" style="width:34px;height:34px" data-action="hide-install-banner" aria-label="Hide this tip">${icon('x')}</button></div>` : ''}
  <div class="section-title"><h2>Jumu’ah</h2><a href="#jumuah">Details</a></div>
  <div class="jumuah-card">
    <div class="row between"><strong>${nextFri === nowIso() ? 'Today' : fmtDate(nextFri, { weekday: 'long', month: 'long', day: 'numeric' })}</strong><span class="chip gold">Every Friday</span></div>
    <div class="slots">${jum.map(j => `<div class="slot"><div class="k">Khutbah</div><div class="v">${hm12(j.khutbah)}</div></div><div class="slot"><div class="k">Salah</div><div class="v">${hm12(j.salah)}</div></div>`).join('')}</div>
    <div class="small">Topic: <strong>${esc(S.settings.jumuahTopic)}</strong> · ${esc(S.settings.jumuahKhateeb)}</div>
  </div>

  <div class="split" style="margin-top:8px">
    <div>
      <div class="section-title"><h2>News & announcements</h2><a href="#news">All news</a></div>
      <div class="card">${posts.length ? posts.map(p => `
        <a class="list-item" href="#news-${p.id}">${dateTile(p.date)}<div><div class="chip-row" style="margin-bottom:4px">${p.pinned ? '<span class="chip">Pinned</span>' : ''}${audienceChip(p.audience)}</div><h4 style="margin:0 0 2px">${esc(p.title)}</h4><div class="small muted">${esc(excerpt(p, 110))}</div></div></a>`).join('') : '<div class="empty">No news yet.</div>'}
        ${!isMember() ? `<div class="notice green" style="margin-top:10px">${icon('lock')}<span>Members also get private announcements. <a href="#account">Join for free</a>.</span></div>` : ''}
      </div>
      ${k ? `<div class="section-title"><h2>Last khutbah</h2><a href="#khutbahs">Archive</a></div>
      <a class="card" href="#khutbah-${k.id}" style="display:block;text-decoration:none;color:inherit">
        <div class="small muted">${fmtLong(k.date)} · ${esc(k.khateeb)}</div>
        <h3 style="margin:6px 0">${esc(k.title)}</h3>
        <p class="muted small" style="margin:0">${esc(excerpt({ html: k.html, body: k.summary }, 180))}</p>
      </a>` : ''}
    </div>
    <div>
      <div class="section-title"><h2>Coming up</h2><a href="#events">Calendar</a></div>
      <div class="card">${evs.map(e => `<a class="list-item" href="#events">${dateTile(e.date)}<div><h4 style="margin:0 0 2px">${esc(e.title)}</h4><div class="small muted">${fmtDate(e.date, { weekday: 'long' })} · ${hm12(e.time)} · ${esc(e.place)}</div></div></a>`).join('') || '<div class="empty">No upcoming events.</div>'}</div>
      <div class="section-title"><h2>Visit us</h2><a href="#visit">Parking</a></div>
      <div class="card stack-sm">
        <div class="row" style="align-items:flex-start">${icon('map')}<div><strong>${esc(S.settings.address)}</strong><div class="small muted">${esc(S.settings.parking[0])}</div></div></div>
        <div class="row"><a class="btn sm" href="${mapsUrl()}" target="_blank" rel="noopener">Directions in Google Maps</a><a class="btn ghost sm" href="#visit">Parking instructions</a></div>
      </div>
    </div>
  </div>`;
}

function vPrayer() {
  const iso = nowIso();
  const st = S.settings;
  const [cy, cm] = (UI.month || iso.slice(0, 7)).split('-').map(Number);
  const days = new Date(Date.UTC(cy, cm, 0)).getUTCDate();
  const { t, iq, friday } = dayTimes(iso);
  const monthName = new Date(Date.UTC(cy, cm - 1, 15)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  let rows = '';
  for (let d = 1; d <= days; d++) {
    const di = `${cy}-${String(cm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const x = dayTimes(di).t;
    rows += `<tr class="${di === iso ? 'today' : ''}"><td>${fmtDate(di, { weekday: 'short', day: 'numeric' })}</td>${PRAYERS.map(([k]) => `<td class="num">${fmtTime(x[k])}</td>`).join('')}</tr>`;
  }
  const q = PT.qibla(st.lat, st.lng);
  return `${head('Decatur, Georgia', 'Prayer times', `Calculated for the masjid’s location using the ${PT.METHODS[st.method].name} method, Asr ${st.asr === 'hanafi' ? 'Hanafi' : 'standard (Shafi’i, Maliki, Hanbali)'}. Iqamah times are set by the masjid.`)}
  <div class="split">
    <div class="stack">
      <div class="card">
        <div class="row between"><h3 style="margin:0">Today</h3><span class="small muted">${fmtDate(iso, { weekday: 'long', month: 'long', day: 'numeric' })} · ${hijri(iso)}</span></div>
        <div class="table-wrap" style="margin-top:12px;border:0"><table><thead><tr><th>Prayer</th><th>Adhan</th><th>Iqamah</th></tr></thead><tbody>
          ${PRAYERS.map(([k]) => `<tr><td><strong>${pName(k, friday)}</strong></td><td class="num">${fmtTime(t[k])}</td><td class="num">${k === 'sunrise' ? '<span class="muted">Fajr ends</span>' : (friday && k === 'dhuhr') ? `Khutbah ${hm12(st.jumuah[0].khutbah)}` : fmtTime(iq[k])}</td></tr>`).join('')}
        </tbody></table></div>
      </div>
      <div>
        <div class="row between" style="margin-bottom:10px"><h2 style="margin:0">${monthName}</h2>
          <div class="row"><button class="btn ghost sm" data-action="month" data-d="-1" aria-label="Previous month">←</button><button class="btn ghost sm" data-action="month" data-d="0">This month</button><button class="btn ghost sm" data-action="month" data-d="1" aria-label="Next month">→</button></div></div>
        <div class="table-wrap"><table><thead><tr><th>Date</th>${PRAYERS.map(p => `<th>${p[1]}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
        <p class="tiny muted" style="margin-top:8px">Adhan times. Hijri dates follow the Umm al-Qura calendar and may differ by a day from local moon sighting.</p>
      </div>
    </div>
    <div class="stack">
      <div class="card">
        <h3>Qibla from the masjid</h3>
        <div class="row" style="gap:16px;flex-wrap:nowrap">
          <svg viewBox="0 0 100 100" width="104" height="104" aria-hidden="true" style="flex:none">
            <circle cx="50" cy="50" r="44" fill="var(--green-soft)" stroke="var(--line)"/>
            <text x="50" y="16" text-anchor="middle" font-size="10" font-weight="700" fill="var(--muted)">N</text>
            <g transform="rotate(${q.toFixed(1)} 50 50)"><path d="M50 14 L57 52 L50 46 L43 52 Z" fill="var(--gold)"/><circle cx="50" cy="50" r="4" fill="var(--green)"/></g>
          </svg>
          <p class="small" style="margin:0"><strong class="num">${q.toFixed(0)}°</strong> from true north, roughly east-northeast. Inside the masjid the prayer hall already faces the qibla.</p>
        </div>
      </div>
      <div class="card"><h3>Jumu’ah</h3><p class="small muted">${S.settings.jumuah.map(j => `Khutbah ${hm12(j.khutbah)}, salah ${hm12(j.salah)}`).join(' · ')}</p><a href="#jumuah" class="btn ghost sm">Friday details</a></div>
      <div class="card"><h3>Want alerts on your phone?</h3><p class="small muted">Prayer apps like Muslim Pro can send adhan notifications. Set them to the ${PT.METHODS[st.method].name} method to match these times.</p><a class="btn ghost sm" href="#library">See recommended apps</a></div>
    </div>
  </div>`;
}

function vJumuah() {
  const st = S.settings;
  const ks = S.khutbahs.filter(isLive).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  return `${head('Every Friday', 'Jumu’ah prayer', 'The Friday congregational prayer replaces Dhuhr. Please arrive early, park where volunteers direct you and silence your phone.')}
  <div class="split">
    <div class="stack">
      <div class="jumuah-card">
        <div class="slots">${st.jumuah.map((j, i) => `<div class="slot"><div class="k">${st.jumuah.length > 1 ? (i ? 'Second' : 'First') + ' · ' : ''}Khutbah</div><div class="v">${hm12(j.khutbah)}</div></div><div class="slot"><div class="k">Salah</div><div class="v">${hm12(j.salah)}</div></div>`).join('')}</div>
        <div>This week: <strong>${esc(st.jumuahTopic)}</strong><br><span class="small muted">${esc(st.jumuahKhateeb)} · ${esc(st.jumuah[0].place)}</span></div>
      </div>
      <div class="card"><h3>Before you come</h3><ul class="prose" style="margin:0">
        <li>Take a bath (ghusl), wear clean clothes and, for men, a little perfume.</li>
        <li>Come early. The doors open 30 minutes before the khutbah.</li>
        <li>Read Surah Al-Kahf and send blessings on the Prophet ﷺ during the day.</li>
        <li>Listen quietly to the khutbah. Silence your phone before you enter.</li>
      </ul><a href="#learn-jumuah" class="btn ghost sm" style="margin-top:12px">Full Jumu’ah guide</a></div>
    </div>
    <div class="stack">
      <div class="card"><h3>Parking on Fridays</h3><ul class="small prose" style="margin:0 0 10px">${st.parking.slice(0, 3).map(p => `<li>${esc(p)}</li>`).join('')}</ul><a href="#visit" class="btn ghost sm">All parking details</a></div>
      <div class="card"><h3>Recent khutbahs</h3>${ks.map(k => `<a class="list-item" href="#khutbah-${k.id}">${dateTile(k.date)}<div><h4 style="margin:0">${esc(k.title)}</h4><div class="small muted">${esc(k.khateeb)}</div></div></a>`).join('')}</div>
    </div>
  </div>`;
}

function vVisit() {
  const st = S.settings;
  return `${head('Location & parking', 'Visit the masjid', 'Everyone is welcome, including guests of other faiths.')}
  <div class="split">
    <div class="stack">
      <div class="card pad-lg stack-sm">
        <div class="row" style="align-items:flex-start;flex-wrap:nowrap">${icon('map')}<div><h3 style="margin:0">${esc(st.name)}</h3><div>${esc(st.address)}</div></div></div>
        <div class="row"><a class="btn" href="${mapsUrl()}" target="_blank" rel="noopener">Directions in Google Maps</a><a class="btn ghost" href="${mapsSearch()}" target="_blank" rel="noopener">View on map</a><a class="btn ghost" href="${appleMaps()}" target="_blank" rel="noopener">Apple Maps</a></div>
      </div>
      <div class="card"><h3>Parking instructions</h3><ol class="steps" style="margin-top:12px">${st.parking.map(p => `<li>${esc(p)}</li>`).join('')}</ol></div>
    </div>
    <div class="stack">
      <div class="card"><h3>Visiting for the first time?</h3><ul class="small prose" style="margin:0">
        <li>Dress modestly. Sisters are asked to cover their hair in the prayer hall; scarves are available at the entrance.</li>
        <li>Shoes come off before the carpet. Use the shoe racks by the door.</li>
        <li>If a prayer is in progress, wait quietly at the back. You are welcome to watch.</li>
        <li>School and group visits can be arranged through the <a href="#about">contact form</a>.</li>
      </ul></div>
      <div class="card"><h3>Contact</h3><p class="small" style="margin:0">Phone: ${esc(st.phone)}<br>Email: ${esc(st.email)}</p><p class="tiny muted" style="margin-top:8px">Sample contact details until the board confirms them.</p></div>
    </div>
  </div>`;
}

function vNews(id) {
  if (id) {
    const p = S.posts.find(x => x.id === id);
    if (!p) return notFound();
    if (!canSeePost(p) && !(can('content') && !isLive(p))) return gate('This announcement is for ' + (p.audience === 'paid' ? 'supporting members.' : 'members.'));
    return `<div class="crumbs"><a href="#news">← News & announcements</a></div><article class="prose"><div class="chip-row">${audienceChip(p.audience)}</div><h1 style="margin-top:8px">${esc(p.title)}</h1><p class="muted small">${fmtLong(p.date)} · ${esc(nameOf(p.author))}</p>${p.image ? `<img src="${p.image}" alt="" style="border-radius:14px;margin:12px 0">` : ''}${richHTML(p)}</article>`;
  }
  const list = S.posts.filter(canSeePost).sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date));
  return `${head('Updates', 'News & announcements', 'Public news for everyone. Members also see private announcements here and in their account.')}
  ${!isMember() ? `<div class="notice green" style="margin-bottom:14px">${icon('lock')}<span>Some announcements are for members only. <a href="#account">Join for free</a> to see them.</span></div>` : ''}
  <div class="card">${list.map(p => `<a class="list-item" href="#news-${p.id}">${dateTile(p.date)}<div><div class="chip-row" style="margin-bottom:4px">${p.pinned ? '<span class="chip">Pinned</span>' : ''}${audienceChip(p.audience)}</div><h3 style="margin:0 0 2px;font-size:19px">${esc(p.title)}</h3><div class="small muted">${esc(excerpt(p, 160))}</div></div></a>`).join('')}</div>`;
}

function vKhutbahs(id) {
  if (id) {
    const k = S.khutbahs.find(x => x.id === id);
    if (!k || (!isLive(k) && !can('content'))) return notFound();
    const topic = S.topics.find(t => t.khutbahId === k.id);
    return `<div class="crumbs"><a href="#khutbahs">← Khutbah summaries</a></div>
    <article class="prose">
      <div class="small muted">${fmtLong(k.date)} · ${esc(k.khateeb)}</div>
      <h1 style="margin-top:6px">${esc(k.title)}</h1>
      ${richHTML({ html: k.html, body: k.summary })}
      <h3 style="margin-top:20px">Key takeaways</h3><ul>${k.takeaways.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3 style="margin-top:20px">References</h3><ul>${k.refs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3 style="margin-top:20px">Media</h3>
      ${k.media.audio || k.media.video ? `<div class="row">${k.media.audio ? `<a class="btn ghost sm" href="${esc(k.media.audio)}" target="_blank" rel="noopener">${icon('mic')} Listen</a>` : ''}${k.media.video ? `<a class="btn ghost sm" href="${esc(k.media.video)}" target="_blank" rel="noopener">${icon('image')} Watch</a>` : ''}</div>` : '<p class="muted small">No recording attached yet. Admins can add an audio or video link.</p>'}
      <div class="card" style="margin-top:22px"><h3>Discuss this khutbah</h3><p class="small muted">Share reflections and questions with the community.</p>
      ${topic ? `<a class="btn sm" href="#topic-${topic.id}">Open the discussion (${topic.replies.length})</a>` : `<button class="btn sm" data-action="discuss-khutbah" data-id="${k.id}">${isMember() ? 'Start the discussion' : 'Sign in to discuss'}</button>`}</div>
    </article>`;
  }
  const q = (UI.kq || '').toLowerCase();
  const list = S.khutbahs.filter(isLive).sort((a, b) => b.date.localeCompare(a.date)).filter(k => !q || (k.title + plainOf({ html: k.html, body: k.summary }) + k.khateeb).toLowerCase().includes(q));
  return `${head('Every Friday', 'Khutbah summaries', 'A written summary of each Friday khutbah, with takeaways, references and recordings when available.')}
  <label class="f" style="max-width:420px;margin-bottom:14px"><span class="sr">Search khutbahs</span><input id="kq" type="search" placeholder="Search by topic or khateeb" value="${esc(UI.kq || '')}" data-input="kq"></label>
  <div class="grid g3">${list.map(k => `<a class="card" href="#khutbah-${k.id}" style="text-decoration:none;color:inherit;display:grid;gap:6px">
    <div class="small muted">${fmtDate(k.date, { month: 'long', day: 'numeric', year: 'numeric' })}</div><h3 style="margin:0">${esc(k.title)}</h3>
    <div class="small muted">${esc(k.khateeb)}</div><p class="small" style="margin:4px 0 0">${esc(excerpt({ html: k.html, body: k.summary }, 140))}</p></a>`).join('') || '<div class="empty">No khutbahs match your search.</div>'}</div>`;
}

/* Learn */
function vLearn() {
  return `${head('Built-in guides', 'Learn Islam', 'Clear, step-by-step guides to the basics of worship, written for this community. Start with wudu and prayer.')}
  <div class="notice" style="margin-bottom:16px">${icon('shield')}<span>These guides are drafts awaiting review by the imam. Where schools of thought differ, the guide says so. Questions? <a href="#ask-imam">Ask the Imam</a>.</span></div>
  <div class="grid g3">${GUIDES.map(g => `<a class="card guide-card" href="#learn-${g.id}"><span class="gi ar" style="font-size:22px;line-height:1">${g.icon}</span><h3 style="margin:0">${g.title}</h3><p class="small muted" style="margin:0">${g.sub}</p></a>`).join('')}</div>
  <div class="section-title"><h2>Go further</h2><a href="#library">Resource library</a></div>
  <div class="grid g3">${S.resources.filter(r => r.featured && isLive(r)).map(resCard).join('')}</div>`;
}
const rec = r => `<div class="recite"><div class="ar" lang="ar">${r[0]}</div><div class="tr">${r[1]}</div><div class="en">${r[2]}</div></div>`;
const recVerses = vs => `<div class="recite">${vs.map(v => `<div class="verse"><div class="ar" lang="ar">${v[0]}</div><div class="tr">${v[1]}</div><div class="en">${v[2]}</div></div>`).join('')}</div>`;
function guideWrap(id, body) {
  const g = GUIDES.find(x => x.id === id); const i = GUIDES.indexOf(g); const nx = GUIDES[i + 1];
  return `<div class="crumbs"><a href="#learn">← Learn Islam</a></div>
  <div class="page-head"><div class="eyebrow">Guide ${i + 1} of ${GUIDES.length}</div><h1>${g.title}</h1><p>${g.sub}</p><span class="chip warn review-chip">Draft · pending imam review</span></div>
  <div class="prose">${body}</div>
  ${nx ? `<a class="card row between" href="#learn-${nx.id}" style="margin-top:28px;text-decoration:none;color:inherit;max-width:68ch"><span><span class="small muted">Next guide</span><br><strong>${nx.title}</strong></span>${icon('arrow')}</a>` : ''}`;
}
function vLearnGuide(id) {
  const q = PT.qibla(S.settings.lat, S.settings.lng).toFixed(0);
  const G = {
    wudu: `<p>Wudu is the washing a Muslim does before prayer. Its required parts are named in the Quran (5:6): washing the face, the arms to the elbows, wiping the head and washing the feet to the ankles. The other steps below follow the practice of the Prophet ﷺ. Use clean water and don’t waste it.</p>
      <ol class="steps">
        <li><h4>Intend and begin with Bismillah</h4>Make the intention in your heart to purify yourself for prayer, and say <em>Bismillāh</em> (in the name of Allah).</li>
        <li><h4>Wash your hands three times</h4>Wash both hands up to the wrists, right first, passing water between the fingers.</li>
        <li><h4>Rinse your mouth three times</h4>Take water in your right hand, swirl it around your mouth and spit it out.</li>
        <li><h4>Rinse your nose three times</h4>Gently draw water into your nose with your right hand and blow it out, using your left hand.</li>
        <li><h4>Wash your face three times</h4>From the hairline to the chin and from ear to ear. If you have a beard, run wet fingers through it.</li>
        <li><h4>Wash your arms three times</h4>From the fingertips up to and including the elbows. Right arm first, then left.</li>
        <li><h4>Wipe your head once</h4>With wet hands, wipe from the front of the head to the back and return to the front.</li>
        <li><h4>Wipe your ears once</h4>Index fingers wipe the inside of the ears and thumbs wipe behind them.</li>
        <li><h4>Wash your feet three times</h4>Up to and including the ankles, right foot first, passing water between the toes.</li>
        <li><h4>Say the testimony</h4>After finishing, it is sunnah to say:${rec(R.wuduDua)}</li>
      </ol>
      <h3 style="margin-top:24px">What breaks wudu</h3>
      <ul><li>Using the toilet: urine, stool or passing wind</li><li>Deep sleep, lying down or leaning so you lose awareness</li><li>Losing consciousness</li></ul>
      <p>Schools of thought differ on others, such as bleeding, vomiting or touching the private parts. Follow what you have been taught, or ask the imam.</p>
      <h3>No water available?</h3><p>If water can’t be found or would harm you, the Quran (5:6) allows <em>tayammum</em>: strike clean earth or dust lightly with your palms, wipe your face, then wipe your hands.</p>`,
    salah: `<h3>Before you pray</h3>
      <ul><li>Be in a state of wudu.</li><li>Your body, clothes and prayer place should be clean.</li><li>Cover yourself properly. Men cover at least from the navel to the knees, with the shoulders covered. Women cover everything except the face and hands.</li><li>Face the qibla. From the masjid it is <strong>${q}°</strong> from true north, roughly east-northeast.</li><li>Pray within the prayer’s time. See <a href="#prayer-times">today’s times</a>.</li></ul>
      <p>These steps describe a two-rak’ah prayer such as Fajr. Three- and four-rak’ah prayers are explained after the steps.</p>
      <ol class="steps" style="margin-top:18px">
        <li><div class="posture">${pose('stand')}<div><h4>Make your intention</h4>Stand facing the qibla and intend in your heart which prayer you are about to pray, for example two rak’ahs of Fajr. It does not need to be said aloud.</div></div></li>
        <li><div class="posture">${pose('takbir')}<div><h4>Opening takbir</h4>Raise your hands to your ears or shoulders and say:${rec(R.takbir)}</div></div></li>
        <li><div class="posture">${pose('stand')}<div><h4>Stand and recite</h4>Place your right hand over your left, on the chest or below the navel depending on your school, and look at the place where you will prostrate. You may begin with the opening supplication:${rec(R.thana)}Then seek refuge and recite Al-Fatiha, ending with <em>Āmīn</em>:${rec(R.taawwudh)}${recVerses(R.fatiha)}<p style="margin-top:10px">In the first two rak’ahs, follow Al-Fatiha with another surah or a few verses. Surah Al-Ikhlas is a good one to learn first:</p>${recVerses(R.ikhlas)}</div></div></li>
        <li><div class="posture">${pose('ruku')}<div><h4>Bow (ruku’)</h4>Say <em>Allāhu Akbar</em> and bow with your hands on your knees and your back straight. Say:${rec(R.ruku)}</div></div></li>
        <li><div class="posture">${pose('stand')}<div><h4>Rise from bowing</h4>Stand up straight while saying the first phrase, then say the second once you are upright:${rec(R.rise)}</div></div></li>
        <li><div class="posture">${pose('sujud')}<div><h4>Prostrate (sujud)</h4>Say <em>Allāhu Akbar</em> and go down so that your forehead and nose, both palms, both knees and the toes of both feet touch the ground. Say:${rec(R.sujud)}</div></div></li>
        <li><div class="posture">${pose('sit')}<div><h4>Sit between the prostrations</h4>Say <em>Allāhu Akbar</em> and sit up briefly. Say:${rec(R.between)}</div></div></li>
        <li><div class="posture">${pose('sujud')}<div><h4>Prostrate again</h4>Say <em>Allāhu Akbar</em> and make a second prostration exactly like the first. This completes one rak’ah.</div></div></li>
        <li><div class="posture">${pose('stand')}<div><h4>Stand for the second rak’ah</h4>Say <em>Allāhu Akbar</em> and stand. Repeat steps 3 to 8, without the opening supplication.</div></div></li>
        <li><div class="posture">${pose('sit')}<div><h4>Sit for the tashahhud</h4>After the second prostration of the second rak’ah, remain sitting and recite the tashahhud. Many raise the right index finger at the testimony.${rec(R.tashahhud)}</div></div></li>
        <li><div class="posture">${pose('sit')}<div><h4>Send blessings on the Prophet ﷺ</h4>In the final sitting, continue with the blessings on the Prophet ﷺ. You may then add a personal dua.${rec(R.salawat)}</div></div></li>
        <li><div class="posture">${pose('salam')}<div><h4>End with salam</h4>Turn your head to the right and say the salam, then turn to the left and say it again. Your prayer is complete.${rec(R.taslim)}</div></div></li>
      </ol>
      <h3 style="margin-top:26px">Three- and four-rak’ah prayers</h3>
      <p>Maghrib has three rak’ahs; Dhuhr, Asr and Isha have four. After the second rak’ah, sit and recite only the tashahhud (up to the testimony), then say <em>Allāhu Akbar</em> and stand. In the third and fourth rak’ahs, recite only Al-Fatiha, silently. Make the full final sitting after the last rak’ah.</p>
      <h3>Aloud or silent</h3>
      <p>The imam recites aloud in Fajr, Jumu’ah and the first two rak’ahs of Maghrib and Isha. Dhuhr and Asr are recited silently.</p>
      <h3>Praying in congregation</h3>
      <p>Stand shoulder to shoulder in straight rows and follow the imam. Never move ahead of him. If you join late, say the opening takbir, join the imam in whatever position he is in, and complete the rak’ahs you missed after he finishes.</p>
      <div class="notice green">${icon('help')}<span>Small differences in hand position, raising the hands or the wording of some phrases come from the established schools of thought, and all are valid. Follow what you have been taught, or ask the imam.</span></div>`,
    rakah: `<p>Each daily prayer has a required (fard) number of rak’ahs. The Prophet ﷺ also regularly prayed extra sunnah rak’ahs before or after some prayers.</p>
      <div class="table-wrap"><table><thead><tr><th>Prayer</th><th>Sunnah before</th><th>Fard</th><th>Sunnah after</th></tr></thead><tbody>
        <tr><td><strong>Fajr</strong></td><td>2</td><td><strong>2</strong></td><td>–</td></tr>
        <tr><td><strong>Dhuhr</strong></td><td>4 (some pray 2)</td><td><strong>4</strong></td><td>2</td></tr>
        <tr><td><strong>Asr</strong></td><td>4 (optional)</td><td><strong>4</strong></td><td>–</td></tr>
        <tr><td><strong>Maghrib</strong></td><td>–</td><td><strong>3</strong></td><td>2</td></tr>
        <tr><td><strong>Isha</strong></td><td>4 (optional)</td><td><strong>4</strong></td><td>2, then witr</td></tr>
        <tr><td><strong>Jumu’ah</strong></td><td>2 on entering</td><td><strong>2</strong></td><td>4 or 2</td></tr>
      </tbody></table></div>
      <p style="margin-top:14px"><strong>Witr</strong> is prayed after Isha and before Fajr, as one or three rak’ahs (three in the Hanafi school, where it is wajib). It is the last prayer of the night.</p>
      <p>The two sunnah rak’ahs before Fajr are the most emphasized of all; the Prophet ﷺ never left them, even when traveling.</p>`,
    jumuah: `<p>Jumu’ah is the Friday congregational prayer. It is obligatory for adult men who are able to attend, and women are welcome; for anyone who attends, it takes the place of Dhuhr. It has two parts: a khutbah (sermon) followed by two rak’ahs prayed aloud.</p>
      <ol class="steps">
        <li><h4>Prepare</h4>Take a bath (ghusl), brush your teeth, wear your best clean clothes and, for men, a little perfume.</li>
        <li><h4>Come early</h4>The Prophet ﷺ described greater reward for those who arrive earlier. At our masjid the doors open 30 minutes before the khutbah.</li>
        <li><h4>Pray two rak’ahs on entering</h4>Greet the masjid with two rak’ahs (tahiyyat al-masjid). If the khutbah has already begun, scholars differ on whether to pray them; follow the masjid’s guidance.</li>
        <li><h4>Listen in silence</h4>Do not talk, even to tell someone to be quiet, and keep your phone silent and away.</li>
        <li><h4>Pray behind the imam</h4>After the khutbah, the iqamah is called and the imam leads two rak’ahs.</li>
        <li><h4>Remember Friday’s other virtues</h4>Read Surah Al-Kahf, send abundant blessings on the Prophet ﷺ and make dua, especially in the last hour before Maghrib.</li>
      </ol>
      <p style="margin-top:18px">Missed Jumu’ah? Pray four rak’ahs of Dhuhr instead.</p>`,
    missed: `<h3>A missed prayer</h3>
      <p>If you slept through a prayer or forgot it, pray it as soon as you remember. The Prophet ﷺ said that whoever forgets a prayer or sleeps through it should pray it when they remember (Muslim). Pray it the same way, with the same number of rak’ahs.</p>
      <p>If you have many prayers to make up, for example from years before you started praying regularly, make a steady plan, such as one make-up prayer with each daily prayer. The imam can help you work out a plan.</p>
      <h3>Sujud as-sahw: the prostration of forgetfulness</h3>
      <p>If you add or leave out part of the prayer by mistake, such as forgetting the first tashahhud, make two extra prostrations at the end of the prayer. If you are unsure how many rak’ahs you have prayed, go with the lower number, complete the prayer and make these prostrations. Both before and after the salam are reported from the Prophet ﷺ; schools differ on which is preferred.</p>
      <h3>Traveling</h3>
      <p>On a journey, four-rak’ah prayers may be shortened to two, and many scholars allow combining Dhuhr with Asr and Maghrib with Isha. Scholars differ on the minimum distance; a common view is about 48 miles (80 km).</p>
      <h3>Illness</h3>
      <p>Pray standing if you can. If you can’t stand, pray sitting; if you can’t sit, pray lying down, making the movements with your head. Allah does not burden anyone beyond what they can bear.</p>`,
    special: `<h3>Eid prayer</h3>
      <p>Two rak’ahs prayed in congregation on the mornings of Eid al-Fitr and Eid al-Adha, after sunrise, with no adhan or iqamah. Extra takbirs are said at the start of each rak’ah (seven and five in most schools; three and three in the Hanafi school), and the khutbah comes after the prayer.</p>
      <ul><li>Take a bath and wear your best clothes.</li><li>On Eid al-Fitr, eat an odd number of dates before the prayer and pay zakat al-fitr before it begins.</li><li>On Eid al-Adha, wait to eat until after the prayer.</li><li>Say the takbirs of Eid on the way, and take a different route home.</li></ul>
      <h3>Janazah (funeral) prayer</h3>
      <p>The janazah prayer is prayed standing, with no bowing or prostration, in four takbirs:</p>
      <ol class="steps"><li>First takbir, then recite Al-Fatiha (in the Hanafi school, the opening praise).</li><li>Second takbir, then the blessings on the Prophet ﷺ as in the final sitting.</li><li>Third takbir, then a dua for the person who has died.</li><li>Fourth takbir, a short pause or dua, then the salam.</li></ol>
      <p style="margin-top:12px">Attending is a communal obligation and carries great reward. Janazah announcements are posted as alerts on this site and sent to members.</p>
      <h3>Taraweeh</h3>
      <p>The night prayer of Ramadan, prayed after Isha in sets of two rak’ahs and followed by witr. Masjids commonly pray 8 or 20 rak’ahs. See the <a href="#ramadan">Ramadan page</a> for our schedule.</p>`,
    'new-muslims': `<p><strong>Welcome.</strong> Whether you have just taken your shahada or are still exploring, this community is here for you. Go at your own pace.</p>
      <h3>The shahada</h3><p>A person becomes Muslim by sincerely declaring:</p>${rec(R.shahada)}
      <p>You can say it on your own. Many people choose to say it at the masjid with witnesses so the community can welcome and support them. <a href="#about">Contact us</a> and we’ll arrange it with you.</p>
      <h3>First steps</h3>
      <ol class="steps"><li>Take a full bath (ghusl).</li><li>Learn <a href="#learn-wudu">wudu</a> and start with the prayers you can. Build up to all five.</li><li>Learn Al-Fatiha. The <a href="#learn-salah">prayer guide</a> has the Arabic, transliteration and meaning.</li><li>Read the Quran in a translation you understand, a little each day.</li><li>Join our New Muslim class on Saturdays and ask for a mentor.</li></ol>
      <h3>The six articles of faith</h3><p>Belief in Allah, His angels, His books, His messengers, the Last Day, and divine decree.</p>
      <h3>The five pillars</h3><p>The shahada, the five daily prayers, zakat, fasting in Ramadan and Hajj for those who are able.</p>
      <div class="card" style="margin-top:16px"><h3>Would you like a mentor?</h3><p class="small muted">A member of the community will reach out, answer questions and sit with you at Jumu’ah.</p><button class="btn sm" data-action="mentor">Request a mentor</button></div>`,
    'ramadan-basics': `<p>Ramadan is the ninth month of the Islamic calendar. Fasting it is one of the five pillars of Islam.</p>
      <h3>The fast</h3><p>From the start of Fajr until Maghrib, do not eat, drink, smoke or have marital relations. Fasting is also a time to guard the tongue and eyes and to do more good.</p>
      <h3>Who fasts</h3><p>Every adult Muslim who is sane, healthy and not traveling. These people may skip fasting and make up the days later:</p>
      <ul><li>The sick and travelers</li><li>Women who are menstruating or bleeding after childbirth (they must not fast, and make up the days later)</li><li>Pregnant or nursing women who fear harm for themselves or the baby</li></ul>
      <p>Those who can never fast, such as the elderly or chronically ill, pay <em>fidya</em>: feeding a person in need for each day missed.</p>
      <h3>Suhoor and iftar</h3><p>Eat suhoor before Fajr; there is blessing in it. Break the fast at Maghrib, traditionally with dates and water, and say:</p>${rec(R.iftar)}
      <p>If you eat or drink by mistake, your fast is still valid. Stop and continue fasting.</p>
      <h3>Nights of Ramadan</h3><p>Pray taraweeh, read the Quran and seek Laylat al-Qadr in the odd nights of the last ten.</p>
      <h3>Zakat al-fitr</h3><p>A small charity paid for every member of the household before the Eid prayer. The masjid sets the amount each year; you can <a href="#donate">pay it online</a>.</p>`,
    duas: `<p>Short supplications from the Quran and the Sunnah for everyday moments. Admins can attach audio so you can hear the pronunciation.</p>
      ${DUAS.map(d => `<h3 style="margin-top:18px">${d[0]}</h3>${rec([d[1], d[2], d[3]])}`).join('')}`
  };
  if (!G[id]) return notFound();
  return guideWrap(id, G[id]);
}

/* Library */
const TYPE_LABEL = { guide: 'Guide', app: 'App', lecture: 'Lectures', article: 'Article', video: 'Video', audio: 'Audio', pdf: 'PDF', link: 'Website' };
function resCard(r) {
  const local = (r.url || '').startsWith('#');
  const internal = local || (r.type === 'article' && (r.body || r.html));
  const href = local ? esc(r.url) : internal ? `#article-${r.id}` : esc(r.url);
  return `<a class="card" href="${href}" ${internal ? '' : 'target="_blank" rel="noopener"'} style="text-decoration:none;color:inherit;display:grid;gap:6px;align-content:start">
    ${r.image ? `<img src="${r.image}" alt="" style="border-radius:10px;aspect-ratio:16/9;object-fit:cover">` : ''}
    <div class="chip-row"><span class="chip green">${TYPE_LABEL[r.type] || 'Link'}</span><span class="chip">${esc(r.topic)}</span></div>
    <h3 style="margin:2px 0 0">${esc(r.title)}</h3><p class="small muted" style="margin:0">${esc(r.desc)}</p>
    <span class="small" style="color:var(--green-ink);font-weight:600">${local ? 'Open the guide' : internal ? 'Read' : 'Open ' + esc((r.url || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))} →</span></a>`;
}
function vLibrary() {
  const topics = ['All', ...new Set(S.resources.filter(isLive).map(r => r.topic))];
  const t = UI.topic || 'All', q = (UI.lq || '').toLowerCase();
  const list = S.resources.filter(r => isLive(r) && (t === 'All' || r.topic === t) && (!q || (r.title + r.desc + r.topic).toLowerCase().includes(q)));
  return `${head('Digital library', 'Resource library', 'Trusted apps, lectures, articles and media, organized by subject. Admins can add new items at any time.')}
  <label class="f" style="max-width:420px;margin-bottom:12px"><span class="sr">Search the library</span><input type="search" placeholder="Search resources" value="${esc(UI.lq || '')}" data-input="lq"></label>
  <div class="filter-row">${topics.map(x => `<button data-action="topic" data-v="${esc(x)}" class="${x === t ? 'on' : ''}">${esc(x)}</button>`).join('')}</div>
  <div class="grid g3">${list.map(resCard).join('') || '<div class="empty">Nothing here yet.</div>'}</div>
  <div class="section-title"><h2>On this site</h2></div>
  <div class="grid g3"><a class="card" href="#learn" style="text-decoration:none;color:inherit"><h3>Learn Islam guides</h3><p class="small muted" style="margin:0">Wudu, prayer, duas and more.</p></a><a class="card" href="#khutbahs" style="text-decoration:none;color:inherit"><h3>Khutbah summaries</h3><p class="small muted" style="margin:0">Every Friday’s topic and takeaways.</p></a></div>`;
}
function vArticle(id) {
  const r = S.resources.find(x => x.id === id); if (!r || (!isLive(r) && !can('content'))) return notFound();
  return `<div class="crumbs"><a href="#library">← Resource library</a></div><article class="prose"><div class="chip-row"><span class="chip green">Article</span><span class="chip">${esc(r.topic)}</span></div><h1 style="margin-top:8px">${esc(r.title)}</h1>${r.image ? `<img src="${r.image}" alt="" style="border-radius:14px;margin:10px 0">` : ''}${richHTML(r)}</article>`;
}

/* Events, programs, volunteer, Ramadan */
function vEvents() {
  const cats = ['All', ...new Set(S.events.map(e => e.category))];
  const c = UI.ecat || 'All';
  const list = S.events.filter(e => isLive(e) && e.date >= nowIso() && (c === 'All' || e.category === c)).sort((a, b) => a.date.localeCompare(b.date));
  const u = me();
  return `${head('Calendar', 'Events', 'RSVP so organizers know how many to expect.')}
  <div class="filter-row">${cats.map(x => `<button data-action="ecat" data-v="${esc(x)}" class="${x === c ? 'on' : ''}">${esc(x)}</button>`).join('')}</div>
  <div class="grid g2">${list.map(e => { const going = u && e.rsvps.includes(u.id); return `<div class="card" style="display:grid;grid-template-columns:auto 1fr;gap:14px">${dateTile(e.date)}<div class="stack-sm">
    <div><span class="chip">${esc(e.category)}</span></div><h3 style="margin:0">${esc(e.title)}</h3>
    <div class="small muted">${fmtDate(e.date, { weekday: 'long', month: 'long', day: 'numeric' })} · ${hm12(e.time)} · ${esc(e.place)}</div>
    <div class="small prose">${richHTML({ html: e.html, body: e.desc })}</div>
    <div class="row"><button class="btn sm ${going ? 'ghost' : ''}" data-action="rsvp" data-id="${e.id}">${going ? icon('check') + ' Going' : 'RSVP'}</button><span class="small muted">${e.rsvps.length} going${e.capacity ? ` of ${e.capacity}` : ''}</span></div></div></div>`; }).join('') || '<div class="empty">No events in this category.</div>'}</div>`;
}
function vPrograms() {
  const u = me();
  return `${head('Learn together', 'Classes & programs', 'Register so teachers can plan. Most programs are free.')}
  <div class="grid g2">${S.programs.map(p => { const on = u && p.regs.includes(u.id); return `<div class="card stack-sm"><h3 style="margin:0">${esc(p.title)}</h3><div class="chip-row"><span class="chip green">${esc(p.audience)}</span></div><div class="small"><strong>${esc(p.schedule)}</strong></div><p class="small muted" style="margin:0">${esc(p.desc)}</p><div class="row"><button class="btn sm ${on ? 'ghost' : ''}" data-action="register" data-id="${p.id}">${on ? icon('check') + ' Registered' : 'Register'}</button><span class="small muted">${p.regs.length} registered</span></div></div>`; }).join('')}</div>`;
}
function vVolunteer() {
  const u = me();
  return `${head('Serve the community', 'Volunteer', 'Pick a shift. You’ll get a reminder in your account inbox.')}
  <div class="grid g2">${S.shifts.map(s => { const on = u && s.signups.includes(u.id); const left = s.slots - s.signups.length; return `<div class="card stack-sm"><h3 style="margin:0">${esc(s.title)}</h3><div class="small"><strong>${esc(s.when)}</strong></div>
    <div class="row"><span class="chip ${left > 0 ? 'ok' : 'bad'}">${left > 0 ? left + ' of ' + s.slots + ' spots open' : 'Full'}</span></div>
    <div><button class="btn sm ${on ? 'ghost' : ''}" data-action="shift" data-id="${s.id}" ${!on && left <= 0 ? 'disabled' : ''}>${on ? icon('check') + ' Signed up' : 'Sign up'}</button></div></div>`; }).join('')}</div>`;
}
function vRamadan() {
  const st = S.settings, start = st.ramadanStart;
  const days = Math.ceil((dIso(start) - dIso(nowIso())) / 86400000);
  let rows = '';
  for (let i = 0; i < 30; i++) { const di = addDays(start, i); const x = dayTimes(di).t; rows += `<tr><td>${i + 1}</td><td>${fmtDate(di, { weekday: 'short', month: 'short', day: 'numeric' })}</td><td class="num">${fmtTime(x.fajr)}</td><td class="num">${fmtTime(x.maghrib)}</td></tr>`; }
  return `${head('1448 AH', 'Ramadan & Eid', 'Dates are expected and will be confirmed by the masjid after the moon is sighted.')}
  <div class="split">
    <div class="stack">
      <div class="hero" style="padding:20px"><div class="date-line">Expected start</div><div class="next"><div class="big" style="font-size:clamp(34px,8vw,52px)">${fmtDate(start, { weekday: 'long', month: 'long', day: 'numeric' })}</div><div class="sub">${days > 0 ? `in ${days} days · ` : ''}Eid al-Fitr expected ${fmtDate(st.eidFitr, { weekday: 'long', month: 'long', day: 'numeric' })}</div></div></div>
      <div><h2>Ramadan timetable</h2><p class="small muted">Stop eating at Fajr; break the fast at Maghrib.</p>
      <div class="table-wrap"><table><thead><tr><th>Day</th><th>Date</th><th>Suhoor ends (Fajr)</th><th>Iftar (Maghrib)</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    </div>
    <div class="stack">
      <div class="card"><h3>Taraweeh</h3><p class="small muted" style="margin:0">${esc(st.taraweeh)}</p></div>
      <div class="card"><h3>Sponsor an iftar</h3><p class="small muted">Feed the community for a night of Ramadan, on your own or with your family.</p><a class="btn gold sm" href="#donate" data-action="fund" data-v="iftar">Sponsor an iftar</a></div>
      <div class="card"><h3>Zakat al-fitr</h3><p class="small muted">${money(st.fitrPerPerson)} per person this year, paid before the Eid prayer.</p>
        <label class="f">People in your household<input type="number" min="1" value="${UI.fitrN || 4}" data-input="fitrN"></label>
        <p style="margin:10px 0"><strong class="num" id="fitr-total">${money(st.fitrPerPerson * (UI.fitrN || 4))}</strong> total</p>
        <a class="btn sm" href="#donate" data-action="fund" data-v="fitr" data-amt="${st.fitrPerPerson * (UI.fitrN || 4)}">Pay zakat al-fitr</a></div>
      <div class="card"><h3>Eid prayer</h3><p class="small muted" style="margin:0">Time and location will be announced here and sent to members once the date is confirmed.</p></div>
      <a class="card" href="#learn-ramadan-basics" style="text-decoration:none;color:inherit"><h3>New to fasting?</h3><p class="small muted" style="margin:0">Read the Ramadan basics guide →</p></a>
    </div>
  </div>`;
}

/* Contact forms */
function vAskImam() {
  const u = me();
  return `${head('Private question', 'Ask the Imam', 'Send a question privately. Only the imam and designated admins can read it.')}
  <form class="card form-grid" data-form="imam" style="max-width:640px">
    <label class="f">Your name<input name="from" value="${esc(u?.name || '')}" placeholder="Optional"></label>
    <label class="f">Email for the answer<input name="email" type="email" value="${esc(u?.email || '')}" placeholder="you@example.com"></label>
    <label class="f">Topic<select name="topic"><option>Prayer</option><option>Fasting</option><option>Zakat & money</option><option>Family & marriage</option><option>New to Islam</option><option>Other</option></select></label>
    <label class="f">Your question<textarea name="body" required placeholder="Write your question"></textarea></label>
    <label class="check"><input type="checkbox" name="anon"> Send anonymously (you won’t receive a direct reply, but the answer may be shared without your name)</label>
    <div><button class="btn" type="submit">${icon('send')} Send question</button></div>
  </form>`;
}
function vBooking() {
  const u = me();
  return `${head('Facility', 'Book the masjid', 'Request the prayer hall or fellowship hall for a nikah, aqiqah, meeting or community event. An admin will confirm.')}
  <form class="card form-grid two" data-form="booking" style="max-width:760px">
    <label class="f">Your name<input name="from" required value="${esc(u?.name || '')}"></label>
    <label class="f">Email<input name="email" type="email" required value="${esc(u?.email || '')}"></label>
    <label class="f">Type of event<select name="type"><option>Nikah</option><option>Aqiqah</option><option>Meeting</option><option>Community event</option><option>Other</option></select></label>
    <label class="f">Space<select name="space"><option>Fellowship hall</option><option>Prayer hall</option><option>Classroom</option></select></label>
    <label class="f">Date<input name="date" type="date" required min="${nowIso()}"></label>
    <label class="f">Expected guests<input name="guests" type="number" min="1" value="50"></label>
    <label class="f full">Details<textarea name="body" placeholder="Times, setup needs, anything else"></textarea></label>
    <div class="full"><button class="btn" type="submit">Send request</button></div>
  </form>`;
}
function vAbout() {
  const st = S.settings;
  return `${head('About', esc(st.name), 'A community masjid in Decatur serving Muslims across south DeKalb and metro Atlanta.')}
  <div class="split">
    <div class="stack">
      <div class="card prose"><h3>Our mission</h3><p>To establish the five daily prayers, nurture faith and knowledge in every generation, and serve our neighbors with excellence. <span class="muted">(Sample text for the board to edit.)</span></p>
        <h3>Leadership</h3><p class="muted">Imam, board members and committee leads will be listed here.</p></div>
      <form class="card form-grid" data-form="contact"><h3 style="margin:0">Send a message</h3>
        <label class="f">Name<input name="from" required value="${esc(me()?.name || '')}"></label>
        <label class="f">Email<input name="email" type="email" required value="${esc(me()?.email || '')}"></label>
        <label class="f">Subject<input name="subject" required></label>
        <label class="f">Message<textarea name="body" required></textarea></label>
        <div><button class="btn" type="submit">Send message</button></div></form>
    </div>
    <div class="stack"><div class="card"><h3>Find us</h3><p class="small">${esc(st.address)}</p><a class="btn sm" href="${mapsUrl()}" target="_blank" rel="noopener">Directions</a></div>
    <div class="card"><h3>Contact</h3><p class="small" style="margin:0">${esc(st.phone)}<br>${esc(st.email)}</p></div></div>
  </div>`;
}
function notFound() { return `<div class="empty" style="margin-top:30px"><h3>Page not found</h3><p>That page may have been moved or removed.</p><a class="btn sm" href="#home">Go home</a></div>`; }
function gate(msg) {
  return `<div class="card gate"><div class="lock-ico">${icon('lock')}</div><h2>${msg}</h2><p class="muted">Membership is free. Sign in with Google, Facebook or email.</p><div class="row" style="justify-content:center"><a class="btn" href="#account">Sign in or join</a><a class="btn ghost" href="#membership">About membership</a></div></div>`;
}
