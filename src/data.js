/* ---------- Seed data (sample content until admins replace it) ---------- */
const TODAY_ISO = (() => {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return p; // YYYY-MM-DD in Eastern time
})();
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const lastFriday = (() => { const d = new Date(TODAY_ISO + 'T12:00:00Z'); const back = (d.getUTCDay() - 5 + 7) % 7 || 7; return addDays(TODAY_ISO, -back); })();
let _id = 1000; const uid = p => p + (++_id).toString(36);

const INSTALL_RESOURCE = { id: 'r-install', title: 'Save this site to your phone', type: 'guide', topic: 'Using this site', url: '#save-to-phone', desc: 'Step-by-step pictures for iPhone, iPad, Android, Samsung and computers. Open AMJ like an app.', featured: true };
const FUNDS = [
  { id: 'sadaqah', name: 'Sadaqah', desc: 'General charity for those in need' },
  { id: 'zakat', name: 'Zakat', desc: 'Distributed to eligible recipients' },
  { id: 'general', name: 'Masjid operations', desc: 'Utilities, upkeep and programs' },
  { id: 'building', name: 'Building fund', desc: 'Expansion and repairs' },
  { id: 'iftar', name: 'Iftar sponsorship', desc: 'Feed the community in Ramadan' },
  { id: 'fitr', name: 'Zakat al-Fitr', desc: 'Paid per person before Eid' }
];

const FIRST = ['Aisha', 'Yusuf', 'Fatima', 'Ibrahim', 'Maryam', 'Bilal', 'Khadijah', 'Omar', 'Zainab', 'Hamza', 'Amina', 'Idris', 'Safiya', 'Musa', 'Hafsa', 'Tariq', 'Layla', 'Jamal', 'Nadia', 'Kareem', 'Sumayyah', 'Malik', 'Ruqayyah', 'Dawud', 'Asma', 'Salim', 'Halima', 'Rashid', 'Iman', 'Anwar', 'Sakina', 'Faisal', 'Nusaybah', 'Harun', 'Jamila', 'Usman'];
const LAST = ['Rahman', 'Ali', 'Abdullah', 'Johnson', 'Hassan', 'Muhammad', 'Diallo', 'Shakir', 'Williams', 'Ahmed', 'Bah', 'Karim', 'Jackson', 'Siddiqui', 'Barry', 'Noor', 'Mitchell', 'Sow'];

function seed() {
  const users = [];
  FIRST.forEach((f, i) => {
    const tier = i % 3 === 1 ? 'paid' : 'free';
    const joined = addDays(TODAY_ISO, -Math.round((i * 173) % 182) - 1);
    users.push({ id: 'u' + i, name: f + ' ' + LAST[i % LAST.length], email: f.toLowerCase() + '.' + LAST[i % LAST.length].toLowerCase() + '@example.com', phone: i % 2 ? '' : '(404) 555-' + String(1000 + i * 37).slice(-4), tier, role: 'member', status: 'active', joined, provider: ['Google', 'Facebook', 'Email'][i % 3], dues: tier === 'paid' ? (i % 4 === 0 ? 'overdue' : 'active') : null, renews: tier === 'paid' ? addDays(TODAY_ISO, 12 + i) : null, volunteer: i % 4 === 2, notes: '',
      prefs: { announcements: true, news: i % 3 !== 0, articles: i % 2 === 0, events: true, khutbah: i % 4 !== 3, alerts: true } });
  });
  users[0].name = 'Aisha Rahman'; users[1].name = 'Yusuf Ali'; users[1].tier = 'paid'; users[1].dues = 'active';
  users[2].role = 'editor'; users[3].role = 'moderator'; users[23].status = 'suspended';
  users.push({ id: 'admin', name: 'Br. Kareem (Admin)', email: 'admin@example.com', phone: '', tier: 'paid', role: 'superadmin', status: 'active', joined: addDays(TODAY_ISO, -200), provider: 'Google', dues: 'active', renews: addDays(TODAY_ISO, 40), notes: '', prefs: { announcements: true, news: true, articles: true, events: true, khutbah: true, alerts: true } });

  const donations = [];
  const fundsCycle = ['sadaqah', 'general', 'zakat', 'sadaqah', 'building', 'general', 'sadaqah', 'zakat'];
  for (let i = 0; i < 46; i++) {
    const amt = [20, 50, 25, 100, 250, 10, 75, 40, 500, 30][i % 10];
    donations.push({ id: uid('d'), userId: i % 5 === 0 ? null : 'u' + (i % 30), name: i % 5 === 0 ? 'Anonymous' : null, fund: fundsCycle[i % fundsCycle.length], amount: amt, freq: i % 6 === 0 ? 'monthly' : 'once', date: addDays(TODAY_ISO, -Math.round(i * 1.3)) });
  }

  return {
    v: 2,
    emailSettings: { fromName: 'Atlanta Muslim Jamaat', fromAddress: 'updates@your-domain.org', auto: { announcement: true, news: false, article: true, resource: false, khutbah: true, event: true, alert: true } },
    emails: [],
    integrations: { domain: '', supabase: false, resend: false, stripe: false },
    role: 'visitor',
    currentUserId: null,
    settings: {
      name: 'Atlanta Muslim Jamaat',
      address: '5365 Flat Shoals Pkwy, Decatur, GA 30034',
      lat: 33.69, lng: -84.25,
      phone: '(404) 555-0123', email: 'info@example.org',
      parking: [
        'Park in the main lot in front of the building. Enter from Flat Shoals Pkwy.',
        'On Fridays, volunteers in vests direct traffic. Please follow their directions and leave the fire lane clear.',
        'Overflow parking: to be confirmed by the board.',
        'Please do not park on the grass, block neighbors’ driveways or stop on Flat Shoals Pkwy.',
        'Accessible spaces are next to the main entrance.'
      ],
      method: 'ISNA', asr: 'standard',
      iqamah: { fajr: { mode: 'offset', value: 20 }, dhuhr: { mode: 'fixed', value: '13:30' }, asr: { mode: 'offset', value: 15 }, maghrib: { mode: 'offset', value: 5 }, isha: { mode: 'offset', value: 15 } },
      jumuah: [{ khutbah: '13:30', salah: '14:00', place: 'Main prayer hall' }],
      jumuahTopic: 'Keeping family ties strong',
      jumuahKhateeb: 'Imam (name to be added)',
      tiers: { monthly: 20, yearly: 200 },
      nisab: { goldPerGram: 150, silverPerGram: 2.5, updated: TODAY_ISO },
      fitrPerPerson: 15,
      ramadanStart: '2027-02-08', eidFitr: '2027-03-09',
      taraweeh: 'Nightly after Isha, 8 rak’ahs and witr',
      logo: null,
      alert: null
    },
    users,
    posts: [
      { id: uid('p'), type: 'news', audience: 'public', title: 'Welcome to our new website', body: 'Assalamu alaikum. This site is our new home online: daily prayer times, Jumu’ah details, events, the khutbah archive and a place to give. Create a free account to join the community forum and receive member announcements.', date: TODAY_ISO, author: 'admin', pinned: true },
      { id: uid('p'), type: 'news', audience: 'public', title: 'Masjid clean-up day on Saturday, November 21', body: 'Join us at 9:00 AM to clean the prayer hall, wudu areas and parking lot. Gloves and supplies provided. Sign up on the Volunteer page so we know how many to expect.', date: addDays(TODAY_ISO, -2), author: 'admin' },
      { id: uid('p'), type: 'news', audience: 'public', title: 'Iqamah times updated after the time change', body: 'With clocks back on standard time, Dhuhr iqamah is now 1:30 PM. Other iqamah times follow the adhan as shown on the home page.', date: addDays(TODAY_ISO, -5), author: 'admin' },
      { id: uid('p'), type: 'announcement', audience: 'members', title: 'General body meeting after Dhuhr on Sunday, November 15', body: 'All members are invited. Agenda: the year’s finances, the parking plan and volunteer coordinators. Light lunch served.', date: addDays(TODAY_ISO, -1), author: 'admin' },
      { id: uid('p'), type: 'news', audience: 'public', title: 'Ramadan preparation series starts in January', body: 'A four-week series on getting ready for Ramadan: fiqh of fasting, Quran goals and planning your zakat. Every Sunday after Dhuhr.', date: '2026-12-01', pubDate: '2026-12-01', pubTime: '09:00', status: 'scheduled', author: 'admin' },
      { id: uid('p'), type: 'news', audience: 'public', title: 'Winter coat drive (draft)', body: 'Draft: collecting new and gently used coats for families in south DeKalb. Dates to be confirmed.', date: TODAY_ISO, status: 'draft', author: 'u2' },
      { id: uid('p'), type: 'announcement', audience: 'paid', title: 'Supporting members: giving statements in January', body: 'Your 2026 giving statement will be available in your account and emailed in January. Check that your email address is correct.', date: addDays(TODAY_ISO, -6), author: 'admin' }
    ],
    khutbahs: [
      { id: 'k3', date: lastFriday, title: 'The rights of neighbors', khateeb: 'Imam (name to be added)', summary: 'The khutbah reminded us that being good to neighbors is part of faith, not an optional courtesy. Allah lists the near neighbor and the distant neighbor among those we must treat well, alongside parents and relatives.\n\nThe khateeb gave practical examples for our area: checking on elderly neighbors during cold snaps, keeping noise and parking considerate on Fridays, and sharing food during Ramadan and Eid with neighbors of every faith.', takeaways: ['Introduce yourself to the neighbors on both sides of your home this week.', 'Be mindful of parking and noise around the masjid, especially on Fridays.', 'Share food with a neighbor at the next Eid, Muslim or not.'], refs: ['Quran 4:36', 'Hadith: Jibril kept advising me about the neighbor until I thought he would make him an heir (Bukhari and Muslim)'], media: { audio: '', video: '' } },
      { id: 'k2', date: addDays(lastFriday, -7), title: 'Honesty in work and business', khateeb: 'Guest khateeb (sample)', summary: 'Earning a halal living includes how we earn it. The khutbah covered honest weights and measures, keeping promises to customers and employers, and being truthful about what we sell.\n\nThe khateeb noted that cutting corners at work, even in small ways, is a form of the cheating the Quran warns against.', takeaways: ['Give full value for what you are paid.', 'Describe products and services truthfully, including their faults.', 'Keep your commitments and deadlines as a trust (amanah).'], refs: ['Quran 83:1–3', 'Hadith: The truthful, trustworthy merchant is with the prophets, the truthful and the martyrs (Tirmidhi)'], media: { audio: '', video: '' } },
      { id: 'k1', date: addDays(lastFriday, -14), title: 'Gratitude in hard times', khateeb: 'Imam (name to be added)', summary: 'The khutbah explored shukr, gratitude, as a way of seeing the world. Allah promises more to those who are grateful, and the Prophet ﷺ described the believer as someone who is grateful in ease and patient in hardship, and is rewarded in both.', takeaways: ['Name three blessings each day, especially on difficult days.', 'Thank the people who help you; it is part of thanking Allah.', 'Use blessings in ways that please Allah.'], refs: ['Quran 14:7', 'Hadith: How wonderful is the affair of the believer… (Muslim)'], media: { audio: '', video: '' } }
    ],
    resources: [
      INSTALL_RESOURCE,
      { id: uid('r'), title: 'Quran.com', type: 'app', topic: 'Quran', url: 'https://quran.com', desc: 'Read and listen to the Quran with translations and tafsir, on web or phone.', featured: true },
      { id: uid('r'), title: 'Muslim Pro', type: 'app', topic: 'Prayer', url: 'https://www.muslimpro.com', desc: 'Prayer times, adhan alerts, qibla compass and Quran.', featured: true },
      { id: uid('r'), title: 'Tarteel', type: 'app', topic: 'Quran', url: 'https://www.tarteel.ai', desc: 'Memorize the Quran with recitation feedback.' },
      { id: uid('r'), title: 'Sunnah.com', type: 'app', topic: 'Faith & belief', url: 'https://sunnah.com', desc: 'Search the major hadith collections in Arabic and English.' },
      { id: uid('r'), title: 'IslamicFinder', type: 'app', topic: 'Prayer', url: 'https://www.islamicfinder.org', desc: 'Prayer times, qibla direction and the Hijri calendar.' },
      { id: uid('r'), title: 'Yaqeen Institute', type: 'lecture', topic: 'Faith & belief', url: 'https://yaqeeninstitute.org', desc: 'Research papers and videos on faith, doubts and contemporary questions.', featured: true },
      { id: uid('r'), title: 'Bayyinah TV', type: 'lecture', topic: 'Quran', url: 'https://bayyinah.tv', desc: 'Quran study and Arabic courses.' },
      { id: uid('r'), title: 'SeekersGuidance', type: 'lecture', topic: 'Prayer', url: 'https://seekersguidance.org', desc: 'Free online courses in fiqh, belief and spirituality.' },
      { id: uid('r'), title: 'Muslim Central', type: 'audio', topic: 'Character', url: 'https://muslimcentral.com', desc: 'Lecture podcasts from many speakers, sorted by topic.' },
      { id: uid('r'), title: 'WhyIslam', type: 'link', topic: 'New Muslims', url: 'https://www.whyislam.org', desc: 'Introductions to Islam and support for new Muslims.' },
      { id: uid('r'), title: 'Zakat Foundation of America', type: 'link', topic: 'Zakat & charity', url: 'https://www.zakat.org', desc: 'Guides to zakat rules and calculations.' },
      { id: uid('r'), title: 'Fiqh Council of North America', type: 'link', topic: 'Ramadan', url: 'https://fiqhcouncil.org', desc: 'Announcements on Ramadan, Eid and the Islamic calendar.' },
      { id: uid('r'), title: 'Bringing kids to the masjid', type: 'article', topic: 'Family', url: '', desc: 'A short guide for parents from our youth committee (sample).', body: 'Children who grow up feeling welcome at the masjid keep coming back as adults. Bring a small bag with quiet toys or a book for the khutbah. Sit near the back with very young children so you can step out if needed. Teach older children the dua for entering the masjid and let them help set out chairs or hand out water after Jumu’ah.\n\nIf your child is upset during the prayer, it is fine to finish your prayer and comfort them. The Prophet ﷺ shortened his prayer when he heard a child crying.' },
      { id: uid('r'), title: 'Preparing for Ramadan early', type: 'article', topic: 'Ramadan', url: '', desc: 'Small habits to start now (sample).', body: 'Start with one voluntary fast a week, such as Mondays or Thursdays. Add a page of Quran a day. Move your bedtime earlier so suhoor is easier. Plan your zakat now so you can give it in Ramadan without rushing.' }
    ],
    events: [
      { id: 'e1', title: 'Youth basketball night', date: '2026-11-13', time: '19:30', place: 'Community gym (sample)', category: 'Youth', desc: 'Ages 12–18. Pickup games, pizza and a short reminder after Isha.', rsvps: ['u2', 'u5', 'u8'] },
      { id: 'e2', title: 'Community potluck dinner', date: '2026-11-14', time: '18:00', place: 'Fellowship hall', category: 'Community', desc: 'Bring a dish to share after Maghrib. Families welcome.', rsvps: ['u1', 'u3', 'u4', 'u6', 'u9', 'u11'] },
      { id: 'e3', title: 'Masjid clean-up day', date: '2026-11-21', time: '09:00', place: 'Masjid', category: 'Volunteer', desc: 'Help us get the masjid ready for winter.', rsvps: ['u2'] },
      { id: 'e4', title: 'Food drive for our neighbors', date: '2026-11-22', time: '10:00', place: 'Masjid parking lot', category: 'Service', desc: 'Drop off canned goods and dry food. Distributed with a local pantry.', rsvps: [] },
      { id: 'e5', title: 'Family fun day', date: '2026-12-26', time: '12:00', place: 'Masjid grounds', category: 'Community', desc: 'Games, food trucks and a bouncy castle for the kids.', rsvps: ['u7'] }
    ],
    programs: [
      { id: 'pr1', title: 'Weekend Quran school', schedule: 'Saturdays and Sundays, 10:00 AM – 1:00 PM', audience: 'Ages 6–15', desc: 'Reading, tajweed and memorization in small groups.', regs: ['u3', 'u6'] },
      { id: 'pr2', title: 'Sisters’ halaqa', schedule: 'Sundays, 11:00 AM', audience: 'Sisters', desc: 'Weekly circle on tafsir and everyday fiqh.', regs: ['u0', 'u4'] },
      { id: 'pr3', title: 'New Muslim class', schedule: 'Saturdays, 2:00 PM', audience: 'New Muslims and those curious about Islam', desc: 'Basics of belief and worship, with a mentor for each student.', regs: [] },
      { id: 'pr4', title: 'Youth night', schedule: 'Fridays after Isha', audience: 'Ages 12–18', desc: 'Talks, games and food.', regs: ['u8'] },
      { id: 'pr5', title: 'Arabic for adults', schedule: 'Wednesdays, 7:30 PM', audience: 'Adults, beginners', desc: 'Read the Quran with understanding in 12 weeks.', regs: ['u10', 'u13'] }
    ],
    shifts: [
      { id: 's1', title: 'Jumu’ah parking crew', when: 'Every Friday, 1:00 – 2:30 PM', slots: 6, signups: ['u2', 'u14'] },
      { id: 's2', title: 'Clean-up day', when: 'Saturday, November 21, 9:00 AM', slots: 15, signups: ['u6', 'u10', 'u18'] },
      { id: 's3', title: 'Potluck setup and cleanup', when: 'Potluck evening, 5:00 – 9:00 PM', slots: 8, signups: ['u4'] },
      { id: 's4', title: 'Weekend Quran school helper', when: 'Saturdays, 10:00 AM – 1:00 PM', slots: 4, signups: [] }
    ],
    forumCats: ['General', 'Islamic knowledge', 'Events & volunteering', 'Youth', 'Help & opportunities'],
    topics: [
      { id: 't1', cat: 'General', title: 'Ideas for the new website?', body: 'Salaam everyone. The board wants feedback on the new site. What would you like to see added?', authorId: 'admin', date: TODAY_ISO, pinned: true, locked: false, likes: ['u1', 'u3'], replies: [
        { id: uid('c'), authorId: 'u1', body: 'Jazakallah khair for this. A way to get reminders for janazah would be very helpful.', date: TODAY_ISO, likes: ['admin'] },
        { id: uid('c'), authorId: 'u4', body: 'Please keep the prayer times on the front page. That’s what I check most.', date: TODAY_ISO, likes: [] }
      ] },
      { id: 't2', cat: 'Islamic knowledge', title: 'Recommended tafsir for beginners in English?', body: 'I want to start reading tafsir with my family. Any recommendations that are easy to follow?', authorId: 'u4', date: addDays(TODAY_ISO, -2), pinned: false, locked: false, likes: ['u7'], replies: [
        { id: uid('c'), authorId: 'u9', body: 'The sisters’ halaqa is going through Juz Amma right now. You’re welcome to join on Sundays.', date: addDays(TODAY_ISO, -1), likes: ['u4'] }
      ] },
      { id: 't3', cat: 'Help & opportunities', title: 'Carpool to Jumu’ah from Stonecrest', body: 'Anyone driving from the Stonecrest area on Fridays? Happy to share gas.', authorId: 'u7', date: addDays(TODAY_ISO, -4), pinned: false, locked: false, likes: [], replies: [] },
      { id: 't4', cat: 'Events & volunteering', title: 'Who’s bringing what to the potluck?', body: 'Let’s avoid five pans of biryani 😄 Reply with your dish.', authorId: 'u3', date: addDays(TODAY_ISO, -1), pinned: false, locked: false, likes: ['u1', 'u2', 'u6'], replies: [
        { id: uid('c'), authorId: 'u6', body: 'Salad and fruit from our family.', date: TODAY_ISO, likes: [] }
      ] }
    ],
    gallery: [
      { id: 'g1', art: 0, caption: 'Eid al-Adha prayer', by: 'admin', date: addDays(TODAY_ISO, -170), status: 'approved' },
      { id: 'g2', art: 1, caption: 'Ramadan community iftar', by: 'u3', date: addDays(TODAY_ISO, -250), status: 'approved' },
      { id: 'g3', art: 2, caption: 'Weekend Quran school graduation', by: 'u6', date: addDays(TODAY_ISO, -120), status: 'approved' },
      { id: 'g4', art: 3, caption: 'Youth night', by: 'u8', date: addDays(TODAY_ISO, -40), status: 'approved' },
      { id: 'g5', art: 4, caption: 'Food drive volunteers', by: 'u2', date: addDays(TODAY_ISO, -60), status: 'approved' },
      { id: 'g6', art: 5, caption: 'Sunset over the masjid', by: 'u1', date: addDays(TODAY_ISO, -20), status: 'approved' },
      { id: 'g7', art: 6, caption: 'Potluck last spring', by: 'u4', date: addDays(TODAY_ISO, -1), status: 'pending' }
    ],
    donations,
    messages: [
      { id: uid('m'), date: addDays(TODAY_ISO, -3), audience: 'all', type: 'request', subject: 'Can you help with Friday parking?', body: 'We need two more volunteers for the Jumu’ah parking crew this month. Tap below if you can help.', action: 'I can help', responses: [{ userId: 'u2', answer: 'I can help' }, { userId: 'u14', answer: 'I can help' }], channels: ['site'] },
      { id: uid('m'), date: addDays(TODAY_ISO, -8), audience: 'overdue', type: 'reminder', subject: 'Your membership dues', body: 'Your supporting membership dues are past due. You can renew from your account page.', action: 'Renew now', responses: [], channels: ['site'] }
    ],
    inbox: [
      { id: uid('i'), kind: 'imam', date: addDays(TODAY_ISO, -1), from: 'Anonymous', email: '', subject: 'Combining prayers at work', body: 'I work 12-hour shifts at a hospital. Is it allowed to combine Dhuhr and Asr when I can’t step away?', status: 'new', reply: '' },
      { id: uid('i'), kind: 'booking', date: addDays(TODAY_ISO, -2), from: 'Hamza Ahmed', email: 'hamza.ahmed@example.com', subject: 'Nikah ceremony — Saturday, December 19', body: 'About 80 guests. We would like the fellowship hall from 2 to 6 PM.', status: 'new', reply: '' },
      { id: uid('i'), kind: 'contact', date: addDays(TODAY_ISO, -4), from: 'Ms. Carter (Decatur High School)', email: 'carter@example.com', subject: 'Class visit request', body: 'Our world religions class would like to visit the masjid in January.', status: 'new', reply: '' }
    ]
  };
}
