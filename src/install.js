/* ================= Save to your phone (install guide) ================= */
let installPrompt = null;
const isInstalled = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
function detectDevice() {
  const ua = navigator.userAgent || '';
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ipad';
  if (/iPhone|iPod/.test(ua)) return 'iphone';
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  if (/Android/.test(ua)) return 'android';
  return 'computer';
}
const DEVICES = {
  iphone: { label: 'iPhone', sub: 'Safari', glyph: 'phone', steps: [
    ['dots', 'Open the menu', 'In Safari, tap the ••• button next to the address bar at the bottom of the screen.', 'On iOS 18 or earlier, the Share button is already in the bottom bar. Tap it and skip to step 3.'],
    ['menu-share', 'Tap Share', 'Choose Share from the menu that pops up.'],
    ['sheet-add', 'Tap “Add to Home Screen”', 'Scroll down the list. If it isn’t there, tap Edit Actions at the very bottom and add it.'],
    ['confirm-ios', 'Tap Add', 'Leave “Open as Web App” turned on so it opens like an app, then tap Add in the top corner.'],
    ['home', 'Open it from your home screen', 'Look for the AMJ icon. Tap it any time for prayer times and updates.']],
    tip: 'Using Chrome on your iPhone? Tap the Share icon in the address bar, then Add to Home Screen.' },
  ipad: { label: 'iPad', sub: 'Safari', glyph: 'tablet', steps: [
    ['share-top', 'Tap Share', 'In Safari, tap the Share button (a square with an arrow) at the top right. On newer iPadOS it may be inside the ••• menu.'],
    ['sheet-add', 'Tap “Add to Home Screen”', 'Scroll down the list of options to find it.'],
    ['confirm-ios', 'Tap Add', 'Keep “Open as Web App” turned on and tap Add.'],
    ['home', 'Find the AMJ icon', 'It appears on your home screen like any other app.']] },
  android: { label: 'Android phone', sub: 'Chrome', glyph: 'phone', steps: [
    ['kebab', 'Open the menu', 'In Chrome, tap the three dots (⋮) at the top right.'],
    ['menu-android', 'Tap “Add to home screen”', 'Some phones say “Install app” instead. Either one works.'],
    ['install', 'Tap Install', 'Confirm, and your phone adds the app. Some phones ask a second time; tap Add.'],
    ['home', 'Open it from your home screen', 'The AMJ icon appears with your other apps.']],
    tip: 'Chrome may also show an “Install” pop-up at the bottom of the screen. Tapping it does the same thing.' },
  samsung: { label: 'Samsung Galaxy', sub: 'Samsung Internet', glyph: 'phone', steps: [
    ['burger', 'Open the menu', 'Tap the three lines (≡) at the bottom right.'],
    ['grid-addto', 'Tap “Add page to”', 'It’s in the grid of options.'],
    ['addto-home', 'Tap “Home screen”', 'Choose where to put the shortcut.'],
    ['confirm-dialog', 'Tap Add', 'You can change the name first if you like.'],
    ['home', 'Find the AMJ icon', 'It’s on your home screen, ready to open.']],
    tip: 'Using Chrome on your Samsung instead? Choose “Android phone” above.' },
  computer: { label: 'Computer', sub: 'Chrome or Edge', glyph: 'laptop', steps: [
    ['desk-browse', 'Click the install icon', 'Click the install icon at the right end of the address bar. In Edge you can also open the … menu, choose Apps, then Install this site as an app.'],
    ['desk-install', 'Click Install', 'Confirm in the small window that appears.'],
    ['desk-app', 'Open it like a program', 'AMJ opens in its own window and shows up in your Start menu, dock or app list.']],
    tip: 'On a Mac with Safari, choose File, then Add to Dock.' }
};
const DEV_GLYPH = {
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  tablet: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M11 18h2"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 19h18"/>'
};

/* ---------- Mock-up drawing ---------- */
const T = (x, y, s, txt, o = {}) => `<text x="${x}" y="${y}" font-size="${s}" ${o.w ? `font-weight="${o.w}"` : ''} ${o.a ? `text-anchor="${o.a}"` : ''} fill="${o.c || 'var(--ink)'}" font-family="var(--font-body)">${txt}</text>`;
const tap = (cx, cy, r = 13) => `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--gold)" fill-opacity=".22"/><circle class="tap-ring" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--gold)" stroke-width="2.5"/></g>`;
const appIcon = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 40})"><rect width="40" height="40" rx="9" fill="#0E4D3A"/><g transform="translate(20 20) scale(0.8) translate(-20 -19.4)"><path d="M9 31h22v-3.5c0-6.2-4.7-10.4-11-12.6-6.3 2.2-11 6.4-11 12.6z" fill="#C9A24A"/><rect x="8" y="31" width="24" height="2.2" rx="1.1" fill="#C9A24A"/><circle cx="20" cy="9" r="3.4" fill="#C9A24A"/><circle cx="21.5" cy="8.2" r="2.9" fill="#0E4D3A"/></g></g>`;
function site(x, y, w, h) {
  let o = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="var(--bg)"/>
    <rect x="${x}" y="${y}" width="${w}" height="22" fill="var(--surface)"/>${appIcon(x + 6, y + 4, 14)}${T(x + 25, y + 14.5, 7, 'Atlanta Muslim Jamaat', { w: 600 })}
    <rect x="${x + 6}" y="${y + 28}" width="${w - 12}" height="62" rx="8" fill="#0E4D3A"/>${T(x + 13, y + 41, 5.5, 'NEXT PRAYER', { c: '#C9A24A', w: 700 })}${T(x + 13, y + 58, 13, 'Maghrib', { c: '#fff' })}${T(x + w - 13, y + 58, 13, '5:40', { c: '#C9A24A', a: 'end' })}`;
  for (let i = 0; i < 3; i++) o += `<rect x="${x + 13 + i * ((w - 26) / 3)}" y="${y + 68}" width="${(w - 26) / 3 - 4}" height="15" rx="3" fill="#fff" fill-opacity=".1"/>`;
  for (let r = 0; y + 98 + r * 40 + 34 < y + h; r++) for (let c = 0; c < 2; c++) o += `<rect x="${x + 6 + c * ((w - 12) / 2 + 2)}" y="${y + 98 + r * 40}" width="${(w - 12) / 2 - 2}" height="34" rx="6" fill="var(--surface)" stroke="var(--line)"/>`;
  return o;
}
const dim = (x, y, w, h, rx = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="#000" fill-opacity=".28"/>`;
function rows(x, y, w, items, hi, rowH = 20) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${items.length * rowH}" rx="9" fill="var(--surface)" stroke="var(--line)"/>` + items.map((t, i) => `${i ? `<line x1="${x + 8}" x2="${x + w - 8}" y1="${y + i * rowH}" y2="${y + i * rowH}" stroke="var(--line)"/>` : ''}${i === hi ? `<rect x="${x + 2}" y="${y + i * rowH + 2}" width="${w - 4}" height="${rowH - 4}" rx="6" fill="var(--gold)" fill-opacity=".18"/>` : ''}${T(x + 9, y + i * rowH + rowH / 2 + 3, 7, t, { w: i === hi ? 700 : 400 })}`).join('') + (hi >= 0 ? tap(x + w - 16, y + hi * rowH + rowH / 2, 9) : '');
}
function homeScreen(x, y, w, h, cols = 4, rx = 0) {
  let o = `<defs><linearGradient id="wp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E6F5A"/><stop offset="1" stop-color="#16392F"/></linearGradient></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#wp)"/>`;
  const s = Math.min(26, (w - 20) / cols - 10), gap = (w - cols * s) / (cols + 1), shades = ['#7FA89A', '#A9C4B9', '#D6C38C', '#8DB3C4', '#C9B7A0', '#9FB98F'];
  let n = 0, target = null;
  for (let r = 0; r < 4; r++) for (let c = 0; c < cols; c++) {
    const ix = x + gap + c * (s + gap), iy = y + 26 + r * (s + 20);
    if (r === 2 && c === 1) { o += appIcon(ix, iy, s) + T(ix + s / 2, iy + s + 9, 6.5, 'AMJ', { a: 'middle', c: '#fff', w: 600 }); target = [ix + s / 2, iy + s / 2]; }
    else o += `<rect x="${ix}" y="${iy}" width="${s}" height="${s}" rx="${s * .23}" fill="${shades[n++ % shades.length]}" fill-opacity=".85"/>`;
  }
  return o + tap(target[0], target[1], s * .75);
}
function confirmIOS(x, y, w) {
  return `<rect x="${x}" y="${y}" width="${w}" height="150" rx="14" fill="var(--surface)"/>
    ${T(x + 10, y + 18, 7.5, 'Cancel', { c: 'var(--green-ink)' })}${T(x + w / 2, y + 18, 7.5, 'Add to Home Screen', { a: 'middle', w: 700 })}${T(x + w - 12, y + 18, 8, 'Add', { a: 'end', w: 700, c: 'var(--green-ink)' })}${tap(x + w - 20, y + 15, 11)}
    <line x1="${x}" x2="${x + w}" y1="${y + 28}" y2="${y + 28}" stroke="var(--line)"/>
    ${appIcon(x + 10, y + 38, 30)}<rect x="${x + 48}" y="${y + 40}" width="${w - 58}" height="14" rx="4" fill="var(--surface-2)"/>${T(x + 52, y + 50, 7.5, 'AMJ', { w: 600 })}${T(x + 50, y + 66, 6, 'atlanta-muslim-jamaat…', { c: 'var(--muted)' })}
    <line x1="${x + 10}" x2="${x + w - 10}" y1="${y + 82}" y2="${y + 82}" stroke="var(--line)"/>${T(x + 10, y + 98, 7.5, 'Open as Web App')}<rect x="${x + w - 36}" y="${y + 90}" width="24" height="13" rx="6.5" fill="#34A853"/><circle cx="${x + w - 18.5}" cy="${y + 96.5}" r="5" fill="#fff"/>`;
}
function phone(scene, kind) {
  const X = 11, Y = 12, W = 158, H = 306;
  let o = `<rect x="4" y="4" width="172" height="322" rx="28" fill="var(--surface)" stroke="var(--muted)" stroke-opacity=".45" stroke-width="2"/><rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="21" fill="var(--bg)"/>`;
  const ios = kind === 'iphone';
  const status = `${T(X + 18, Y + 15, 7, '9:41', { w: 700 })}${ios ? `<rect x="68" y="17" width="44" height="11" rx="5.5" fill="var(--ink)"/>` : `<circle cx="90" cy="21" r="4" fill="var(--ink)"/>`}`;
  const bottomBarIOS = (hl) => `<rect x="${X}" y="${Y + H - 44}" width="${W}" height="44" fill="var(--surface)" fill-opacity=".96"/><circle cx="${X + 18}" cy="${Y + H - 25}" r="10" fill="var(--surface-2)"/><path d="M${X + 20} ${Y + H - 29}l-4 4 4 4" stroke="var(--ink)" fill="none" stroke-width="1.6"/><rect x="${X + 32}" y="${Y + H - 36}" width="${W - 66}" height="22" rx="11" fill="var(--surface-2)"/>${T(X + W / 2 - 2, Y + H - 22, 6.5, 'atlanta-muslim-jamaat…', { a: 'middle', c: 'var(--muted)' })}<circle cx="${X + W - 17}" cy="${Y + H - 25}" r="10" fill="var(--surface-2)"/>${T(X + W - 17, Y + H - 22.5, 9, '•••', { a: 'middle', w: 700 })}${hl ? tap(X + W - 17, Y + H - 25, 12) : ''}`;
  if (kind === 'iphone') {
    o += site(X, Y + 30, W, H - 74) + status;
    if (scene === 'dots') o += bottomBarIOS(true);
    if (scene === 'menu-share') o += bottomBarIOS(false) + dim(X, Y, W, H, 21) + rows(X + 52, Y + H - 150, 98, ['Share', 'Add to Bookmarks', 'Add to Favorites', 'Find on Page', 'New Tab'], 0);
    if (scene === 'sheet-add') o += bottomBarIOS(false) + dim(X, Y, W, H, 21) + `<rect x="${X}" y="${Y + 120}" width="${W}" height="${H - 120}" rx="16" fill="var(--surface-2)"/>${T(X + W / 2, Y + 138, 7, 'Atlanta Muslim Jamaat', { a: 'middle', w: 700 })}` + rows(X + 8, Y + 152, W - 16, ['Copy', 'Add to Reading List', 'Add Bookmark', 'Add to Home Screen', 'Find on Page', 'Edit Actions…'], 3, 21);
    if (scene === 'confirm-ios') o += dim(X, Y, W, H, 21) + confirmIOS(X + 6, Y + 36, W - 12);
    if (scene === 'home') o = o.replace(/<rect x="11" y="12"[^>]*\/>/, '') + `<g>${homeScreen(X, Y, W, H, 4, 21)}</g>` + status.replace(/var\(--ink\)/g, '#fff');
  }
  if (kind === 'android' || kind === 'samsung') {
    const top = kind === 'android' ? 50 : 30, bottom = kind === 'samsung' ? 40 : 14;
    o += site(X, Y + top, W, H - top - bottom) + status;
    if (kind === 'android' && scene !== 'home') o += `<rect x="${X}" y="${Y + 24}" width="${W}" height="26" fill="var(--surface)"/><rect x="${X + 8}" y="${Y + 28}" width="${W - 42}" height="18" rx="9" fill="var(--surface-2)"/>${T(X + 16, Y + 40, 6.5, 'atlanta-muslim-jamaat.vercel.app', { c: 'var(--muted)' })}${T(X + W - 16, Y + 41, 11, '⋮', { a: 'middle', w: 700 })}${scene === 'kebab' ? tap(X + W - 16, Y + 37, 11) : ''}`;
    if (kind === 'samsung' && scene !== 'home') { const by = Y + H - 40; o += `<rect x="${X}" y="${by}" width="${W}" height="40" fill="var(--surface)"/>` + ['‹', '›', '⌂', '▢', '≡'].map((g, i) => T(X + 16 + i * ((W - 32) / 4), by + 24, 12, g, { a: 'middle', c: i === 4 ? 'var(--ink)' : 'var(--muted)', w: 700 })).join('') + (scene === 'burger' ? tap(X + W - 16, by + 20, 12) : ''); }
    if (scene === 'menu-android') o += dim(X, Y, W, H, 21) + rows(X + W - 112, Y + 28, 106, ['New tab', 'History', 'Bookmarks', 'Downloads', 'Add to home screen', 'Settings'], 4);
    if (scene === 'install' || scene === 'confirm-dialog') { const add = scene === 'install' ? 'Install' : 'Add'; o += dim(X, Y, W, H, 21) + `<rect x="${X + 14}" y="${Y + 110}" width="${W - 28}" height="96" rx="14" fill="var(--surface)"/>${T(X + 24, Y + 130, 8.5, scene === 'install' ? 'Install app' : 'Add to Home screen', { w: 700 })}${appIcon(X + 24, Y + 140, 24)}${T(X + 56, Y + 153, 7.5, 'AMJ', { w: 600 })}${T(X + 56, Y + 163, 6, 'atlanta-muslim-jamaat…', { c: 'var(--muted)' })}${T(X + W - 70, Y + 194, 7.5, 'Cancel', { a: 'end', c: 'var(--green-ink)' })}${T(X + W - 26, Y + 194, 7.5, add, { a: 'end', c: 'var(--green-ink)', w: 700 })}${tap(X + W - 36, Y + 191, 13)}`; }
    if (scene === 'grid-addto') { o += dim(X, Y, W, H, 21) + `<rect x="${X}" y="${Y + 150}" width="${W}" height="${H - 150}" rx="16" fill="var(--surface)"/>`; const labs = ['Bookmarks', 'Saved', 'History', 'Downloads', 'Add page to', 'Share', 'Dark mode', 'Settings']; labs.forEach((l, i) => { const cx = X + 20 + (i % 4) * ((W - 40) / 3), cy = Y + 180 + Math.floor(i / 4) * 46; o += `<circle cx="${cx}" cy="${cy}" r="11" fill="${i === 4 ? 'var(--gold)' : 'var(--surface-2)'}" fill-opacity="${i === 4 ? '.35' : '1'}"/>${T(cx, cy + 22, 5.8, l, { a: 'middle', w: i === 4 ? 700 : 400 })}`; }); o += tap(X + 20, Y + 226, 14); }
    if (scene === 'addto-home') o += dim(X, Y, W, H, 21) + rows(X + 24, Y + 120, W - 48, ['Bookmarks', 'Quick access', 'Home screen'], 2, 24);
    if (scene === 'home') o = o.replace(/<rect x="11" y="12"[^>]*\/>/, '') + `<g>${homeScreen(X, Y, W, H, 4, 21)}</g>` + status.replace(/var\(--ink\)/g, '#fff');
  }
  return `<svg viewBox="0 0 180 330" role="img" aria-hidden="true">${o}</svg>`;
}
function tablet(scene) {
  const X = 14, Y = 14, W = 272, H = 196;
  let o = `<rect x="4" y="4" width="292" height="216" rx="18" fill="var(--surface)" stroke="var(--muted)" stroke-opacity=".45" stroke-width="2"/>`;
  if (scene === 'home') return `<svg viewBox="0 0 300 224" aria-hidden="true">${o}<g>${homeScreen(X, Y, W, H, 6, 8)}</g></svg>`;
  o += site(X, Y + 26, W, H - 26) + `<rect x="${X}" y="${Y}" width="${W}" height="26" fill="var(--surface)"/><rect x="${X + 60}" y="${Y + 5}" width="${W - 120}" height="16" rx="8" fill="var(--surface-2)"/>${T(X + W / 2, Y + 16, 6.5, 'atlanta-muslim-jamaat.vercel.app', { a: 'middle', c: 'var(--muted)' })}
    <path d="M${X + W - 24} ${Y + 9}v8M${X + W - 27} ${Y + 12}l3-3 3 3M${X + W - 29} ${Y + 14}v5h10v-5" stroke="var(--ink)" fill="none" stroke-width="1.3"/>${T(X + W - 44, Y + 17, 8, '•••', { a: 'middle', c: 'var(--muted)' })}`;
  if (scene === 'share-top') o += tap(X + W - 24, Y + 14, 11);
  if (scene === 'sheet-add') o += dim(X, Y, W, H) + rows(X + W - 132, Y + 30, 124, ['Copy', 'Add to Reading List', 'Add Bookmark', 'Add to Home Screen', 'Find on Page'], 3, 22);
  if (scene === 'confirm-ios') o += dim(X, Y, W, H) + confirmIOS(X + 56, Y + 22, W - 112);
  return `<svg viewBox="0 0 300 224" aria-hidden="true">${o}</svg>`;
}
function desktop(scene) {
  const X = 6, Y = 6, W = 308, H = 198;
  let o = `<rect x="${X}" y="${Y}" width="${W}" height="${H}" rx="10" fill="var(--surface)" stroke="var(--muted)" stroke-opacity=".45" stroke-width="2"/>`;
  if (scene === 'desk-app') {
    o += `<rect x="${X + 30}" y="${Y + 14}" width="${W - 60}" height="${H - 50}" rx="8" fill="var(--bg)" stroke="var(--line)"/><rect x="${X + 30}" y="${Y + 14}" width="${W - 60}" height="18" rx="8" fill="#0E4D3A"/>${appIcon(X + 36, Y + 17, 12)}${T(X + 52, Y + 26, 6.5, 'AMJ', { c: '#fff', w: 600 })}` + site(X + 31, Y + 32, W - 62, H - 69) +
      `<rect x="${X + W / 2 - 70}" y="${Y + H - 28}" width="140" height="22" rx="8" fill="var(--surface-2)" stroke="var(--line)"/>` + [0, 1, 2, 3, 4].map(i => i === 2 ? appIcon(X + W / 2 - 62 + i * 26, Y + H - 25, 16) : `<rect x="${X + W / 2 - 62 + i * 26}" y="${Y + H - 25}" width="16" height="16" rx="4" fill="${['#7FA89A', '#D6C38C', '', '#8DB3C4', '#C9B7A0'][i]}"/>`).join('') + tap(X + W / 2 - 62 + 52 + 8, Y + H - 17, 12);
    return `<svg viewBox="0 0 320 210" aria-hidden="true">${o}</svg>`;
  }
  o += `<rect x="${X}" y="${Y}" width="${W}" height="20" rx="10" fill="var(--surface-2)"/><circle cx="${X + 12}" cy="${Y + 10}" r="3" fill="#E36B5D"/><circle cx="${X + 22}" cy="${Y + 10}" r="3" fill="#E9B949"/><circle cx="${X + 32}" cy="${Y + 10}" r="3" fill="#5EB56E"/><rect x="${X + 44}" y="${Y + 4}" width="90" height="16" rx="5" fill="var(--surface)"/>${T(X + 52, Y + 15, 6.5, 'Atlanta Muslim Jamaat')}
    <rect x="${X}" y="${Y + 20}" width="${W}" height="22" fill="var(--surface)"/><rect x="${X + 40}" y="${Y + 24}" width="${W - 80}" height="14" rx="7" fill="var(--surface-2)"/>${T(X + 50, Y + 34, 6.5, 'atlanta-muslim-jamaat.vercel.app', { c: 'var(--muted)' })}
    <rect x="${X + W - 58}" y="${Y + 27}" width="10" height="7" rx="1.2" fill="none" stroke="var(--ink)" stroke-width="1.1"/><path d="M${X + W - 53} ${Y + 28.5}v3.5M${X + W - 55} ${Y + 30.5}l2 2 2-2M${X + W - 56} ${Y + 36}h6" stroke="var(--ink)" stroke-width="1.1" fill="none"/>${T(X + W - 26, Y + 35, 9, '⋮', { a: 'middle', w: 700 })}` + site(X + 1, Y + 42, W - 2, H - 43);
  if (scene === 'desk-browse') o += tap(X + W - 53, Y + 31, 10);
  if (scene === 'desk-install') o += `<rect x="${X + W - 150}" y="${Y + 42}" width="140" height="78" rx="10" fill="var(--surface)" stroke="var(--line)"/>${T(X + W - 140, Y + 58, 8, 'Install app?', { w: 700 })}${appIcon(X + W - 140, Y + 66, 20)}${T(X + W - 114, Y + 76, 7, 'AMJ', { w: 600 })}${T(X + W - 114, Y + 85, 5.5, 'atlanta-muslim-jamaat…', { c: 'var(--muted)' })}<rect x="${X + W - 58}" y="${Y + 97}" width="40" height="15" rx="7.5" fill="var(--btn)"/>${T(X + W - 38, Y + 107.5, 7, 'Install', { a: 'middle', c: '#fff', w: 700 })}${T(X + W - 68, Y + 107.5, 7, 'Cancel', { a: 'end', c: 'var(--green-ink)' })}${tap(X + W - 38, Y + 104.5, 13)}`;
  return `<svg viewBox="0 0 320 210" aria-hidden="true">${o}</svg>`;
}
const mock = (dev, scene) => dev === 'ipad' ? tablet(scene) : dev === 'computer' ? desktop(scene) : phone(scene, dev);

/* ---------- Page ---------- */
function vInstall() {
  const guess = detectDevice(), dev = UI.dev || guess, d = DEVICES[dev];
  return `${head('Get the app', 'Save this site to your phone', 'Add AMJ to your home screen and open it like an app. No app store, nothing to download, and it takes about 30 seconds.')}
  ${isInstalled() ? `<div class="notice green" style="margin-bottom:16px">${icon('check')}<span>You’re already using AMJ from your home screen. Share this page with family so they can add it too.</span></div>` : ''}
  ${installPrompt && !isInstalled() ? `<div class="card row between" style="margin-bottom:16px;border-color:var(--gold);background:var(--gold-soft)"><div><h3 style="margin:0">Install in one tap</h3><p class="small muted" style="margin:2px 0 0">Your browser can add AMJ for you.</p></div><button class="btn gold" data-action="install-now">${icon('upload')} Install AMJ</button></div>` : ''}
  <h2 style="font-size:22px">1. What are you using?</h2>
  <div class="dev-pick" role="radiogroup" aria-label="Choose your device">${Object.entries(DEVICES).map(([k, v]) => `<button role="radio" aria-checked="${k === dev}" class="${k === dev ? 'on' : ''}" data-action="dev" data-v="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">${DEV_GLYPH[v.glyph]}</svg><b>${v.label}</b><span>${v.sub}</span>${k === guess ? '<em>This device</em>' : ''}</button>`).join('')}</div>
  <h2 style="font-size:22px;margin-top:26px">2. Follow these steps on your ${d.label}</h2>
  <ol class="install-steps">${d.steps.map(([scene, t, desc, note], i) => `<li><div class="mock ${dev === 'computer' || dev === 'ipad' ? 'wide' : ''}">${mock(dev, scene)}</div><div class="txt"><span class="n">Step ${i + 1}</span><h3>${t}</h3><p>${desc}</p>${note ? `<p class="small muted">${note}</p>` : ''}</div></li>`).join('')}</ol>
  ${d.tip ? `<div class="notice" style="margin-top:16px">${icon('help')}<span>${d.tip}</span></div>` : ''}
  <div class="card" style="margin-top:20px"><h3>Why save it?</h3><ul class="small prose" style="margin:0"><li>One tap to today’s prayer times and Jumu’ah details.</li><li>Opens full screen, like an app, with the AMJ icon.</li><li>Always up to date. There’s nothing to update.</li><li>Takes almost no space on your phone.</li></ul></div>`;
}
Object.assign(A, {
  dev: el => { UI.dev = el.dataset.v; render(false); },
  'install-now': async () => { if (!installPrompt) return; installPrompt.prompt(); try { const r = await installPrompt.userChoice; if (r.outcome === 'accepted') toast('AMJ is being added to your device.'); } catch (e) {} installPrompt = null; render(false); },
  'hide-install-banner': () => { try { localStorage.setItem('amj-hide-install', '1'); } catch (e) {} UI.hideInstall = true; render(false); }
});
const showInstallBanner = () => { if (isInstalled() || UI.hideInstall) return false; try { return !localStorage.getItem('amj-hide-install'); } catch (e) { return true; } };
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; if (route && route() === 'save-to-phone') render(false); });
window.addEventListener('appinstalled', () => { installPrompt = null; toast('AMJ was added to your device.'); });
