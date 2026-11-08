/* ---------- Learn Islam: built-in guides (draft, pending imam review) ---------- */
const R = { // recitations: [arabic, transliteration, english]
  takbir: ['اللَّهُ أَكْبَرُ', 'Allāhu Akbar', 'Allah is the Greatest.'],
  thana: ['سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَٰهَ غَيْرُكَ', 'Subḥānaka llāhumma wa biḥamdika, wa tabāraka smuka, wa taʿālā jadduka, wa lā ilāha ghayruk.', 'Glory and praise be to You, O Allah. Blessed is Your name and exalted is Your majesty. There is no god but You.'],
  taawwudh: ['أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', 'Aʿūdhu billāhi mina sh-shayṭāni r-rajīm.', 'I seek refuge in Allah from Satan, the rejected one.'],
  fatiha: [
    ['بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'Bismillāhi r-raḥmāni r-raḥīm', 'In the name of Allah, the Most Compassionate, the Most Merciful.'],
    ['الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'Al-ḥamdu lillāhi rabbi l-ʿālamīn', 'All praise is for Allah, Lord of all the worlds,'],
    ['الرَّحْمَٰنِ الرَّحِيمِ', 'Ar-raḥmāni r-raḥīm', 'the Most Compassionate, the Most Merciful,'],
    ['مَالِكِ يَوْمِ الدِّينِ', 'Māliki yawmi d-dīn', 'Master of the Day of Judgment.'],
    ['إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'Iyyāka naʿbudu wa iyyāka nastaʿīn', 'You alone we worship, and You alone we ask for help.'],
    ['اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'Ihdina ṣ-ṣirāṭa l-mustaqīm', 'Guide us to the straight path,'],
    ['صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', 'Ṣirāṭa lladhīna anʿamta ʿalayhim, ghayri l-maghḍūbi ʿalayhim wa la ḍ-ḍāllīn', 'the path of those You have blessed, not of those who earned Your anger, nor of those who went astray.']
  ],
  ikhlas: [
    ['قُلْ هُوَ اللَّهُ أَحَدٌ', 'Qul huwa llāhu aḥad', 'Say: He is Allah, the One.'],
    ['اللَّهُ الصَّمَدُ', 'Allāhu ṣ-ṣamad', 'Allah, the Eternal Refuge.'],
    ['لَمْ يَلِدْ وَلَمْ يُولَدْ', 'Lam yalid wa lam yūlad', 'He neither begets nor was begotten,'],
    ['وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', 'Wa lam yakun lahū kufuwan aḥad', 'and there is none comparable to Him.']
  ],
  ruku: ['سُبْحَانَ رَبِّيَ الْعَظِيمِ', 'Subḥāna Rabbiya l-ʿAẓīm (3 times)', 'Glory be to my Lord, the Magnificent.'],
  rise: ['سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ ۝ رَبَّنَا وَلَكَ الْحَمْدُ', 'Samiʿa llāhu liman ḥamidah … Rabbanā wa laka l-ḥamd', 'Allah hears the one who praises Him … Our Lord, to You belongs all praise.'],
  sujud: ['سُبْحَانَ رَبِّيَ الْأَعْلَى', 'Subḥāna Rabbiya l-Aʿlā (3 times)', 'Glory be to my Lord, the Most High.'],
  between: ['رَبِّ اغْفِرْ لِي', 'Rabbi ghfir lī', 'My Lord, forgive me.'],
  tashahhud: ['التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ', 'At-taḥiyyātu lillāhi wa ṣ-ṣalawātu wa ṭ-ṭayyibāt. As-salāmu ʿalayka ayyuha n-nabiyyu wa raḥmatullāhi wa barakātuh. As-salāmu ʿalaynā wa ʿalā ʿibādi llāhi ṣ-ṣāliḥīn. Ashhadu an lā ilāha illa llāh, wa ashhadu anna Muḥammadan ʿabduhū wa rasūluh.', 'All greetings, prayers and good things belong to Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god but Allah, and I bear witness that Muhammad is His servant and messenger.'],
  salawat: ['اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ', 'Allāhumma ṣalli ʿalā Muḥammadin wa ʿalā āli Muḥammad, kamā ṣallayta ʿalā Ibrāhīma wa ʿalā āli Ibrāhīm, innaka Ḥamīdun Majīd. Allāhumma bārik ʿalā Muḥammadin wa ʿalā āli Muḥammad, kamā bārakta ʿalā Ibrāhīma wa ʿalā āli Ibrāhīm, innaka Ḥamīdun Majīd.', 'O Allah, send Your prayers upon Muhammad and the family of Muhammad, as You sent them upon Ibrahim and the family of Ibrahim; You are Praiseworthy and Glorious. O Allah, bless Muhammad and the family of Muhammad, as You blessed Ibrahim and the family of Ibrahim; You are Praiseworthy and Glorious.'],
  taslim: ['السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', 'As-salāmu ʿalaykum wa raḥmatullāh (right, then left)', 'Peace and the mercy of Allah be upon you.'],
  wuduDua: ['أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ', 'Ashhadu an lā ilāha illa llāhu waḥdahū lā sharīka lah, wa ashhadu anna Muḥammadan ʿabduhū wa rasūluh.', 'I bear witness that there is no god but Allah alone, without partner, and I bear witness that Muhammad is His servant and messenger.'],
  shahada: ['أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ', 'Ashhadu an lā ilāha illa llāh, wa ashhadu anna Muḥammadan rasūlu llāh.', 'I bear witness that there is no god but Allah, and I bear witness that Muhammad is the Messenger of Allah.'],
  iftar: ['ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ', 'Dhahaba ẓ-ẓamaʾu wabtallati l-ʿurūqu wa thabata l-ajru in shāʾa llāh.', 'The thirst is gone, the veins are moistened, and the reward is certain, if Allah wills.']
};

const DUAS = [
  ['Waking up', 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', 'Al-ḥamdu lillāhi lladhī aḥyānā baʿda mā amātanā wa ilayhi n-nushūr.', 'Praise be to Allah who gave us life after causing us to die, and to Him is the return.'],
  ['Before sleeping', 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', 'Bismika llāhumma amūtu wa aḥyā.', 'In Your name, O Allah, I die and I live.'],
  ['Before eating', 'بِسْمِ اللَّهِ', 'Bismillāh. (If you forget: Bismillāhi awwalahū wa ākhirah.)', 'In the name of Allah. (In the name of Allah, at its beginning and its end.)'],
  ['After eating', 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ', 'Al-ḥamdu lillāhi lladhī aṭʿamanī hādhā wa razaqanīhi min ghayri ḥawlin minnī wa lā quwwah.', 'Praise be to Allah who fed me this and provided it for me, without any power or strength from me.'],
  ['Leaving home', 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', 'Bismillāh, tawakkaltu ʿala llāh, wa lā ḥawla wa lā quwwata illā billāh.', 'In the name of Allah. I rely on Allah. There is no power and no strength except with Allah.'],
  ['Entering the masjid', 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', 'Allāhumma ftaḥ lī abwāba raḥmatik.', 'O Allah, open for me the doors of Your mercy.'],
  ['Leaving the masjid', 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', 'Allāhumma innī asʾaluka min faḍlik.', 'O Allah, I ask You of Your bounty.'],
  ['Breaking the fast', R.iftar[0], R.iftar[1], R.iftar[2]],
  ['For your parents (Quran 17:24)', 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', 'Rabbi rḥamhumā kamā rabbayānī ṣaghīrā.', 'My Lord, have mercy on them as they raised me when I was small.'],
  ['Good in this life and the next (Quran 2:201)', 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', 'Rabbanā ātinā fi d-dunyā ḥasanatan wa fi l-ākhirati ḥasanatan wa qinā ʿadhāba n-nār.', 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.']
];

/* Posture pictograms (stroke figures, 120x120) */
const POSE = {
  stand: '<circle cx="60" cy="16" r="9"/><path d="M60 27v43M50 35h20M50 35l-2 15 15-2M70 35l2 15-13 1M60 70l-6 38M60 70l6 38"/>',
  takbir: '<circle cx="60" cy="16" r="9"/><path d="M60 27v43M50 35h20M50 35l-6-5 1-16M70 35l6-5-1-16M60 70l-6 38M60 70l6 38"/>',
  ruku: '<circle cx="100" cy="60" r="8"/><path d="M52 108V66h38M86 66l-30 20"/>',
  sujud: '<circle cx="92" cy="99" r="8"/><path d="M24 106h26l-4-28 34 18M78 96l6 12"/>',
  sit: '<circle cx="48" cy="40" r="9"/><path d="M48 51v45l32 10H46M48 62l24 34"/>',
  salam: '<circle cx="48" cy="40" r="9"/><path d="M48 51v45l32 10H46M48 62l24 34M64 30c6 4 8 10 6 17m0 0l-5-3m5 3l3-5"/>'
};
const pose = k => `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${POSE[k]}</svg>`;

const GUIDES = [
  { id: 'wudu', icon: 'و', title: 'How to make wudu', sub: 'The washing before prayer, step by step.' },
  { id: 'salah', icon: 'ص', title: 'How to pray, step by step', sub: 'Every position and what to say, in Arabic, transliteration and English.' },
  { id: 'rakah', icon: '٥', title: "Rak'ahs in each prayer", sub: 'How many units to pray, required and sunnah.' },
  { id: 'jumuah', icon: 'ج', title: "Friday (Jumu'ah) etiquette", sub: 'How to prepare for and attend Friday prayer.' },
  { id: 'missed', icon: 'س', title: 'Missed prayers and mistakes', sub: 'Making up prayers, sujud as-sahw, travel and illness.' },
  { id: 'special', icon: 'ع', title: 'Eid, janazah and taraweeh', sub: 'How the special prayers are performed.' },
  { id: 'new-muslims', icon: 'ش', title: 'New to Islam? Start here', sub: 'The shahada, first steps and who to talk to.' },
  { id: 'ramadan-basics', icon: 'ر', title: 'Ramadan basics', sub: 'Fasting rules, exemptions and zakat al-fitr.' },
  { id: 'duas', icon: 'د', title: 'Everyday duas', sub: 'Short supplications for daily life.' }
];
