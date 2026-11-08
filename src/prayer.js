/* ---------- Prayer time calculation (PrayTimes-style astronomy) ---------- */
const PT = (() => {
  const dtr = d => d * Math.PI / 180, rtd = r => r * 180 / Math.PI;
  const sin = d => Math.sin(dtr(d)), cos = d => Math.cos(dtr(d)), tan = d => Math.tan(dtr(d));
  const asin = x => rtd(Math.asin(x)), acos = x => rtd(Math.acos(x)), atan2 = (y, x) => rtd(Math.atan2(y, x));
  const acot = x => rtd(Math.atan(1 / x));
  const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };
  const fixAngle = a => fix(a, 360), fixHour = h => fix(h, 24);

  const METHODS = {
    ISNA:    { name: 'ISNA (North America)', fajr: 15, isha: 15 },
    MWL:     { name: 'Muslim World League', fajr: 18, isha: 17 },
    Egypt:   { name: 'Egyptian General Authority', fajr: 19.5, isha: 17.5 },
    Makkah:  { name: 'Umm al-Qura (Makkah)', fajr: 18.5, ishaMin: 90 },
    Karachi: { name: 'University of Karachi', fajr: 18, isha: 18 }
  };

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function sunPos(jd) {
    const D = jd - 2451545.0;
    const g = fixAngle(357.529 + 0.98560028 * D);
    const q = fixAngle(280.459 + 0.98564736 * D);
    const L = fixAngle(q + 1.915 * sin(g) + 0.020 * sin(2 * g));
    const e = 23.439 - 0.00000036 * D;
    const RA = atan2(cos(e) * sin(L), cos(L)) / 15;
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - fixHour(RA) };
  }

  /* Returns UTC Date objects for one calendar date at lat/lng. */
  function compute(y, m, d, lat, lng, methodKey = 'ISNA', asrMethod = 'standard') {
    const method = METHODS[methodKey] || METHODS.ISNA;
    const jDate = julian(y, m, d) - lng / (15 * 24);
    const midDay = t => fixHour(12 - sunPos(jDate + t).eqt);
    const angleTime = (angle, t, ccw) => {
      const decl = sunPos(jDate + t).decl, noon = midDay(t);
      const v = acos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
      return noon + (ccw ? -v : v);
    };
    const asrTime = (factor, t) => {
      const decl = sunPos(jDate + t).decl;
      return angleTime(-acot(factor + tan(Math.abs(lat - decl))), t);
    };
    let t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 };
    for (let i = 0; i < 2; i++) {
      const p = {}; for (const k in t) p[k] = t[k] / 24;
      t = {
        fajr: angleTime(method.fajr, p.fajr, true),
        sunrise: angleTime(0.833, p.sunrise, true),
        dhuhr: midDay(p.dhuhr),
        asr: asrTime(asrMethod === 'hanafi' ? 2 : 1, p.asr),
        sunset: angleTime(0.833, p.sunset),
        isha: method.isha ? angleTime(method.isha, p.isha) : 0
      };
      if (method.ishaMin) t.isha = t.sunset + method.ishaMin / 60;
    }
    const base = Date.UTC(y, m - 1, d);
    const out = {};
    for (const k in t) out[k] = new Date(base + (t[k] - lng / 15) * 3600000);
    out.maghrib = out.sunset;
    return out;
  }

  function qibla(lat, lng) {
    const kLat = 21.4225, kLng = 39.8262;
    const b = atan2(sin(kLng - lng), cos(lat) * tan(kLat) - sin(lat) * cos(kLng - lng));
    return fixAngle(b);
  }
  return { compute, qibla, METHODS };
})();

if (typeof module !== 'undefined') module.exports = PT;
