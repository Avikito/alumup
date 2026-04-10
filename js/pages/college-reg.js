import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(
  'https://exfdjelwyrspfspcevvm.supabase.co',
  'sb_publishable_6Yb2QjjK9jkDpvAeIZuOxA_g1KEA4ED',
  { auth: { persistSession: false } }
);

const courseData = {
  pergola_al: {
    title: 'מתקין מוסמך – פרגולה אלומיניום',
    syllabus: ['קריאת שרטוטים ותוכניות הרכבה', 'עבודה עם פרופילי אלומיניום ואביזרים', 'הרכבת עמודים, קורות וגגוני פרגולה', 'עבודה בגובה ונהלי בטיחות', 'גימור, איטום ובדיקות איכות'],
    suitable: ['מי שמעוניין להתמחות בהרכבת פרגולות אלומיניום', 'בעלי רקע בנגרות, מסגרות או בנייה', 'יזמים המעוניינים לפתוח עסק עצמאי בתחום'],
    hours: 60, price: '₪8,500 + מע"מ'
  },
  pergola_electric: {
    title: 'מתקין מוסמך – פרגולה חשמלית ומסכי ZIP',
    syllabus: ['יסודות חשמל ובקרים אוטומטיים', 'התקנת מנועים וחיישנים', 'הרכבת מסכי ZIP וגלגלת אלומיניום', 'חיבור לממשקי שליטה חכמה', 'תחזוקה ואבחון תקלות'],
    suitable: ['חשמלאים ואנשי טכנולוגיה שרוצים להרחיב לתחום הסגירות', 'מתקינים קיימים שרוצים לשדרג לפרגולות חכמות', 'קבלנים הרוצים להציע ערך מוסף ללקוחות'],
    hours: 60, price: '₪8,500 + מע"מ'
  },
  glass_systems: {
    title: 'מתקין מוסמך – מערכות זכוכית, ויטרינה ואקורדיון',
    syllabus: ['סוגי זכוכית ותקנות בטיחות', 'הרכבת מסגרות ויטרינה ואקורדיון', 'עבודה עם סיליקון, פינים ומנעולים', 'התקנת מחיצות זכוכית וסגירות חצר', 'טיפול ומניעת נזקים'],
    suitable: ['מי שמעוניין בעבודה עם מערכות זכוכית ועיצוב מסחרי', 'אנשי בנייה ושיפוצים המחפשים התמחות ייחודית', 'קבלנים הפועלים עם בתי עסק ומסחר'],
    hours: 60, price: '₪8,500 + מע"מ'
  },
  bioclimatic: {
    title: 'מתקין מוסמך – מערכות BIOCLIMATIC',
    syllabus: ['הכרת מערכות ביוקלימטיות ויצרנים מובילים', 'הרכבת לוחות ציר מתכווננים ואוטומטיים', 'אינטגרציה עם גשמים וחיישני רוח', 'התקנת תאורה ומסכי צד', 'עבודה עם מערכות ניקוז'],
    suitable: ['מתקינים מנוסים המבקשים להתמחות בפרמיום', 'קבלנים העובדים עם לקוחות יוקרה ווילות', 'מי שרוצה ליצב את עצמו בשוק הביוקלימטי הצומח'],
    hours: 60, price: '₪8,500 + מע"מ'
  },
  weld_al: {
    title: 'מסגרות וריתוך אלומיניום',
    syllabus: ['טכניקות ריתוך MIG לאלומיניום', 'כלי מדידה, חיתוך ועיצוב פרופילים', 'הרכבת מסגרות ומבנים', 'בדיקות איכות ועמידות', 'גימור ואנודיזציה בסיסית'],
    suitable: ['חסרי ניסיון המעוניינים להיכנס לתחום המסגרות', 'נגרים ומתכתנים המחפשים הכשרה מוסמכת', 'עצמאים הרוצים להרחיב שירותים לעבודות אלומיניום'],
    hours: 60, price: '₪8,500 + מע"מ'
  },
  weld_steel: {
    title: 'מסגרות וריתוך קונסטרוקציה',
    syllabus: ['ריתוך MIG/MAG פלדה ונירוסטה', 'קריאת שרטוטי קונסטרוקציה', 'בניית מסגרות, שערים ומעקות', 'עיבוד חום, ישור וגימור', 'תקנות בנייה ובטיחות מבנה'],
    suitable: ['מי שמעוניין בריתוך תעשייתי ועבודות מבנה', 'קבלני בנייה הרוצים לשלב שירותי מסגרות', 'אנשי מקצוע המחפשים הסמכה מוכרת בענף'],
    hours: 60, price: '₪8,500 + מע"מ'
  }
};

const locL  = { beer_sheva:'באר שבע', tel_aviv:'תל אביב' };
const schL  = { morning:'בוקר (08:30–16:30 · 6 מפגשים)', evening:'ערב (16:00–20:30 · 10 מפגשים)' };
const winL  = { may_jun:'מאי–יוני 2025', jun_jul:'יוני–יולי 2025', aug_sep:'אוגוסט–ספטמבר 2025' };
const trackL = {
  pergola_al:      'מתקין מוסמך – פרגולה אלומיניום',
  pergola_electric:'מתקין מוסמך – פרגולה חשמלית ומסכי ZIP',
  glass_systems:   'מתקין מוסמך – מערכות זכוכית, ויטרינה ואקורדיון',
  bioclimatic:     'מתקין מוסמך – מערכות BIOCLIMATIC',
  weld_al:         'מסגרות וריתוך אלומיניום',
  weld_steel:      'מסגרות וריתוך קונסטרוקציה'
};

const s = {
  step: 1,
  screen: { physical: null, permit: null, tools: null, age: null },
  track: null,
  loc: null, sch: null, win: null,
  name: '', birthYear: null, address: '', phone: '', email: '', password: '',
  profession: '', workplace: '', goal: null,
  hSigned: false, rSigned: false,
  hData: null, rData: null
};

// Canvas binding
function bindCv(id, key) {
  const cv = document.getElementById(`cv-${id}`);
  if (!cv || cv._b) return; cv._b = true;
  const ctx = cv.getContext('2d');
  let drawing = false;

  function p(e) {
    const r = cv.getBoundingClientRect();
    const sx = cv.width / r.width, sy = cv.height / r.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * sx, y: (src.clientY - r.top) * sy };
  }

  function start(e) { e.preventDefault(); drawing = true; const pt = p(e); ctx.beginPath(); ctx.moveTo(pt.x, pt.y); }
  function move(e) {
    if (!drawing) return; e.preventDefault();
    const pt = p(e); ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle = '#0f1f35'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.stroke();
  }
  function stop() {
    if (!drawing) return; drawing = false;
    s[key + 'Data'] = cv.toDataURL();
    s[key + 'Signed'] = true;
    document.getElementById(`badge-${id}`).classList.add('show');
  }

  cv.addEventListener('mousedown', start); cv.addEventListener('mousemove', move);
  cv.addEventListener('mouseup', stop); cv.addEventListener('mouseleave', stop);
  cv.addEventListener('touchstart', start, {passive:false}); cv.addEventListener('touchmove', move, {passive:false});
  cv.addEventListener('touchend', stop);
}

function goStep(n) {
  document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
  const id = n === 'success' ? 'p-success' : `p${n}`;
  document.getElementById(id).classList.add('active');
  document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (n !== 'success') {
    s.step = n;
    document.getElementById('prog').style.width = `${n * 20}%`;
    for (let i = 1; i <= 5; i++) {
      const ni = document.getElementById(`fsn-${i}`);
      const si = document.getElementById(`fsi-${i}`);
      if (!ni) continue;
      si.classList.remove('active', 'done');
      ni.classList.remove('active', 'done');
      if (i < n) { si.classList.add('done'); ni.classList.add('done'); ni.innerHTML = '<i class="ph ph-check" style="font-size:0.75rem;"></i>'; }
      else if (i === n) { si.classList.add('active'); ni.classList.add('active'); ni.textContent = i; }
      else { ni.textContent = i; }
    }
    if (n === 4) { setTimeout(() => { bindCv('h', 'h'); bindCv('r', 'r'); }, 50); }
  } else {
    document.getElementById('prog').style.width = '100%';
  }
}

function err(step, msg) {
  const el = document.getElementById(`err${step}`);
  if (!el) return;
  const sp = el.querySelector('span');
  if (msg) { sp.textContent = msg; el.classList.add('show'); }
  else el.classList.remove('show');
}

async function save() {
  const ANON = 'sb_publishable_6Yb2QjjK9jkDpvAeIZuOxA_g1KEA4ED';
  const AUTH_URL = 'https://exfdjelwyrspfspcevvm.supabase.co/auth/v1';
  const REST_URL = 'https://exfdjelwyrspfspcevvm.supabase.co/rest/v1';

  // 1. יצירת חשבון Auth — קודם, כדי לקבל access_token
  let accessToken = null;
  let userId = null;

  const signupRes = await fetch(AUTH_URL + '/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON },
    body: JSON.stringify({ email: s.email, password: s.password })
  });
  const signupJson = await signupRes.json();

  if (signupJson?.access_token) {
    // משתמש חדש נרשם בהצלחה
    accessToken = signupJson.access_token;
    userId = signupJson.user?.id || null;
  } else if (signupJson?.code === 'user_already_exists' || signupJson?.msg?.includes('already registered') || signupRes.status === 422) {
    // המשתמש כבר קיים — נכנס עם הסיסמה הקיימת
    const loginRes = await fetch(AUTH_URL + '/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON },
      body: JSON.stringify({ email: s.email, password: s.password })
    });
    const loginJson = await loginRes.json();
    if (loginJson?.access_token) {
      accessToken = loginJson.access_token;
      userId = loginJson.user?.id || null;
    }
  }

  if (!accessToken) throw new Error('לא ניתן ליצור חשבון משתמש. אנא פנה לתמיכה.');

  // 2. שמירת רשומת הסטודנט עם access_token (authenticated role)
  const studentId = crypto.randomUUID();
  const hdrs = {
    'Content-Type': 'application/json',
    'apikey': ANON,
    'Authorization': 'Bearer ' + accessToken,
    'Prefer': 'return=minimal'
  };

  const ref = s.payRef || ('PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2,6).toUpperCase());
  const r1 = await fetch(REST_URL + '/students', {
    method: 'POST', headers: hdrs,
    body: JSON.stringify({
      id: studentId,
      user_id: userId,
      full_name: s.name, phone: s.phone, email: s.email,
      experience_level: 'new', course_track: s.track,
      location: s.loc, schedule: s.sch, opening_window: s.win || null,
      screening_physical: s.screen?.physical || null,
      screening_permit:   s.screen?.permit   || null,
      screening_tools:    s.screen?.tools    || null,
      screening_age:      s.screen?.age      || null,
      health_declaration_signed: s.hSigned, regulations_signed: s.rSigned,
      health_signature_data: s.hData, regulations_signature_data: s.rData,
      payment_status: 'registration_paid', payment_amount: 399, payment_ref: ref, status: 'awaiting_coordination'
    })
  });
  if (!r1.ok) { const t = await r1.text(); throw new Error('students insert ' + r1.status + ': ' + t); }

  // 3. רישום ל-registrations
  const r2 = await fetch(REST_URL + '/registrations', {
    method: 'POST', headers: hdrs,
    body: JSON.stringify({
      student_id: studentId, course_track: s.track,
      location: s.loc, schedule: s.sch, registration_fee: 399, full_price: 8500, status: 'awaiting_coordination'
    })
  });
  if (!r2.ok) { const t = await r2.text(); throw new Error('registrations insert ' + r2.status + ': ' + t); }

  // 4. יצירת רשומת profiles — is_approved: false עד לאישור האדמין
  try {
    await fetch(REST_URL + '/profiles', {
      method: 'POST',
      headers: { ...hdrs, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ id: userId, is_approved: false, is_blocked: false })
    });
  } catch (_) {}

  // 5. ניקוי session — המשתמש לא אמור להיות מחובר עד לאישור האדמין
  try {
    await fetch(AUTH_URL + '/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + accessToken }
    });
  } catch (_) {}
}

window.reg = {
  screenQ(key, val, el) {
    const parent = el.closest('.screen-q').querySelector('.screen-q-opts');
    parent.querySelectorAll('.screen-q-opt').forEach(o => o.classList.remove('sel', 'sel-no'));
    el.classList.add(val === 'yes' ? 'sel' : 'sel-no');
    s.screen[key] = val;
    if (key === 'permit') {
      const upload = document.getElementById('permit-upload');
      upload.style.display = val === 'yes' ? 'block' : 'none';
      if (val === 'no') { s.permitImage = null; document.getElementById('permit-preview').style.display = 'none'; document.getElementById('permit-file').value = ''; }
    }
    const fail = Object.values(s.screen).some(v => v === 'no');
    document.getElementById('screen-fail').style.display = fail ? 'block' : 'none';
    err(4, '');
  },

  onPermitFile(input) {
    const file = input.files[0];
    if (!file) return;
    s.permitImage = file;
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.getElementById('permit-img');
      img.src = e.target.result;
      document.getElementById('permit-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  },

  selGoal(v) {
    s.goal = v;
    ['goal-employee','goal-freelance','goal-exploring'].forEach(id => document.getElementById(id).classList.remove('sel'));
    document.getElementById(`goal-${v}`).classList.add('sel');
    err(2, '');
  },

  selTrack(v) {
    const d = courseData[v];
    if (!d) return;
    reg._pendingTrack = v;
    reg._pendingLoc = null;
    reg._pendingSch = null;
    reg._pendingWin = null;
    // reset modal selections
    ['m-loc-bs','m-loc-ta','m-sch-am','m-sch-pm','m-win-mj','m-win-jj','m-win-as'].forEach(id => document.getElementById(id).classList.remove('sel'));
    // populate content
    document.getElementById('modal-title').textContent = d.title;
    document.getElementById('modal-syllabus').innerHTML = d.syllabus.map(t => `<li>${t}</li>`).join('');
    document.getElementById('modal-suitable').innerHTML = d.suitable.map(t => `<li>${t}</li>`).join('');
    document.getElementById('modal-hours').textContent = d.hours;
    document.getElementById('modal-price').textContent = d.price;
    const me = document.getElementById('modal-err');
    me.classList.remove('show'); me.querySelector('span').textContent = '';
    document.getElementById('course-modal').classList.add('open');
  },

  selModalLoc(v) {
    reg._pendingLoc = v;
    ['m-loc-bs','m-loc-ta'].forEach(id => document.getElementById(id).classList.remove('sel'));
    document.getElementById(v === 'beer_sheva' ? 'm-loc-bs' : 'm-loc-ta').classList.add('sel');
  },

  selModalSch(v) {
    reg._pendingSch = v;
    ['m-sch-am','m-sch-pm'].forEach(id => document.getElementById(id).classList.remove('sel'));
    document.getElementById(v === 'morning' ? 'm-sch-am' : 'm-sch-pm').classList.add('sel');
  },

  selModalWin(v) {
    reg._pendingWin = v;
    ['m-win-mj','m-win-jj','m-win-as'].forEach(id => document.getElementById(id).classList.remove('sel'));
    document.getElementById({may_jun:'m-win-mj', jun_jul:'m-win-jj', aug_sep:'m-win-as'}[v]).classList.add('sel');
  },

  _modalErr(msg) {
    const el = document.getElementById('modal-err');
    el.querySelector('span').textContent = msg;
    el.classList.add('show');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  confirmTrack() {
    if (!reg._pendingLoc) { reg._modalErr('יש לבחור מיקום.'); return; }
    if (!reg._pendingSch) { reg._modalErr('יש לבחור לוח זמנים.'); return; }
    if (!reg._pendingWin) { reg._modalErr('יש לבחור מועד פתיחה.'); return; }
    const v = reg._pendingTrack;
    s.track = v;
    s.loc   = reg._pendingLoc;
    s.sch   = reg._pendingSch;
    s.win   = reg._pendingWin;
    const trackMap = {pergola_al:'track-c1',pergola_electric:'track-c2',glass_systems:'track-c3',bioclimatic:'track-c4',weld_al:'track-c5',weld_steel:'track-c6'};
    ['track-c1','track-c2','track-c3','track-c4','track-c5','track-c6'].forEach(id => document.getElementById(id).classList.remove('sel'));
    document.getElementById(trackMap[v]).classList.add('sel');
    err(3, '');
    reg.closeModal();
  },

  closeModal(e) {
    if (e && e.target !== document.getElementById('course-modal')) return;
    document.getElementById('course-modal').classList.remove('open');
  },

  clearSig(id) {
    const cv = document.getElementById(`cv-${id}`);
    cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
    if (id === 'h') { s.hSigned = false; s.hData = null; }
    else            { s.rSigned = false; s.rData = null; }
    document.getElementById(`badge-${id}`).classList.remove('show');
  },

  next() {
    const n = s.step;

    if (n === 1) {
      s.name      = document.getElementById('f-name').value.trim();
      s.birthYear = document.getElementById('f-birthyear').value;
      s.phone     = document.getElementById('f-phone').value.trim();
      s.email     = document.getElementById('f-email').value.trim();
      const pw    = document.getElementById('f-password').value;
      const pw2   = document.getElementById('f-password-confirm').value;
      if (!s.name)      { err(1, 'יש להזין שם מלא.'); return; }
      if (!s.birthYear) { err(1, 'יש לבחור שנת לידה.'); return; }
      if (!s.phone)     { err(1, 'יש להזין מספר טלפון.'); return; }
      if (!s.email)     { err(1, 'יש להזין אימייל.'); return; }
      if (!pw || pw.length < 6) { err(1, 'יש לבחור סיסמה של לפחות 6 תווים.'); return; }
      if (pw !== pw2)   { err(1, 'הסיסמאות אינן תואמות.'); return; }
      s.password = pw;
      err(1, '');
    }

    if (n === 2) {
      s.address    = document.getElementById('f-address').value.trim();
      s.profession = document.getElementById('f-profession').value.trim();
      s.workplace  = document.getElementById('f-workplace').value.trim();
      if (!s.address)    { err(2, 'יש להזין כתובת מגורים.'); return; }
      if (!s.profession) { err(2, 'יש להזין מקצוע נוכחי.'); return; }
      if (!s.goal)       { err(2, 'יש לבחור מטרה מההכשרה.'); return; }
      err(2, '');
    }

    if (n === 3) {
      if (!s.track) { err(3, 'יש לבחור קורס — לחצו על אחד הקורסים כדי לבחור.'); return; }
      document.getElementById('s-name').textContent  = s.name;
      document.getElementById('s-track').textContent = trackL[s.track];
      document.getElementById('s-loc').textContent   = locL[s.loc];
      document.getElementById('s-sch').textContent   = schL[s.sch];
      err(3, '');
    }

    if (n === 4) {
      const vals = Object.values(s.screen);
      if (vals.some(v => v === null)) { err(4, 'יש לענות על כל שאלות ההתאמה.'); return; }
      if (vals.some(v => v === 'no')) { err(4, 'נא ליצור קשר ישיר לדיון באפשרויות המתאימות.'); return; }
      const m = [];
      if (!s.hSigned) m.push('הצהרת בריאות');
      if (!s.rSigned) m.push('תקנון לימודים');
      if (m.length) { err(4, `יש לחתום על: ${m.join(', ')}`); return; }
      err(4, '');
    }

    goStep(n + 1);
  },

  back() { if (s.step > 1) goStep(s.step - 1); },

  downloadAgreements() {
    const today = new Date().toLocaleDateString('he-IL');
    const trackName = {
      pergola_al:'מתקין מוסמך – פרגולה אלומיניום',
      pergola_electric:'מתקין מוסמך – פרגולה חשמלית ומסכי ZIP',
      glass_systems:'מתקין מוסמך – מערכות זכוכית, ויטרינה ואקורדיון',
      bioclimatic:'מתקין מוסמך – מערכות BIOCLIMATIC',
      weld_al:'מסגרות וריתוך אלומיניום',
      weld_steel:'מסגרות וריתוך קונסטרוקציה'
    }[s.track] || s.track;

    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>הסכמים חתומים – ${s.name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 2.5cm 3cm; color: #111; font-size: 13px; }
    h1 { font-size: 18px; color: #0f1f35; border-bottom: 2px solid #1a5faa; padding-bottom: 8px; margin-bottom: 20px; }
    h2 { font-size: 14px; color: #1a5faa; margin: 24px 0 8px; }
    .meta { background: #f4f6fb; border-radius: 6px; padding: 10px 14px; margin-bottom: 24px; font-size: 12px; line-height: 1.8; }
    .doc-text { background: #f9f9f9; border: 1px solid #dde4f0; border-radius: 6px; padding: 12px 16px; line-height: 1.9; margin-bottom: 10px; }
    .sig-label { font-size: 11px; color: #6b7a99; margin-bottom: 4px; }
    .sig-img { border: 1px solid #dde4f0; border-radius: 6px; max-height: 90px; display: block; background: #fff; }
    .page-break { page-break-before: always; margin-top: 2cm; }
    .footer { margin-top: 3cm; font-size: 10px; color: #9aa3b5; text-align: center; border-top: 1px solid #dde4f0; padding-top: 8px; }
  </style>
</head>
<body>
  <h1>הסכמים חתומים — מכללת ALUM-IL</h1>
  <div class="meta">
    <strong>שם:</strong> ${s.name} &nbsp;|&nbsp;
    <strong>טלפון:</strong> ${s.phone}<br>
    <strong>מסלול:</strong> ${trackName}<br>
    <strong>תאריך חתימה:</strong> ${today} &nbsp;|&nbsp;
    <strong>מס׳ אישור תשלום:</strong> ${s.payRef || '—'}
  </div>

  <h2>הצהרת בריאות</h2>
  <div class="doc-text">
    אני המצהיר/ה מאשר/ת כי:<br>
    1. אני כשיר/ה פיזית לביצוע עבודות בגובה עד 6 מטר.<br>
    2. אני מסוגל/ת להרמת משקלים עד 25 ק"ג ללא הגבלה רפואית.<br>
    3. איני סובל/ת ממחלות לב, יל"ד בלתי מאוזן, סחרחורת כרונית.<br>
    4. אתחייב/ת להודיע למכללה על כל שינוי במצבי הרפואי.
  </div>
  <div class="sig-label">חתימה:</div>
  ${s.hData ? `<img class="sig-img" src="${s.hData}">` : '<div style="height:60px;border:1px dashed #ccc;border-radius:6px;"></div>'}

  <div class="page-break"></div>

  <h2>תקנון לימודים</h2>
  <div class="doc-text">
    נוכחות מינימלית: 85% לקבלת תעודה.<br>
    דמי רישום: 399 ש"ח — מקוזזים מהמחיר הסופי של הקורס (₪8,500 + מע"מ).<br>
    ביטול עד 14 יום — החזר מלא. 15–30 יום — 50%. מעל 30 יום — ללא החזר.<br>
    קוד לבוש: נעלי בטיחות S1P + מטר אישי — חובה.
  </div>
  <div class="sig-label">חתימה:</div>
  ${s.rData ? `<img class="sig-img" src="${s.rData}">` : '<div style="height:60px;border:1px dashed #ccc;border-radius:6px;"></div>'}

  <div class="footer">מסמך זה הופק אוטומטית על ידי מערכת ההרשמה של מכללת ALUM-IL · ${today}</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  },

  async pay() {
    const btn = document.getElementById('pay-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner" style="animation:spin 0.8s linear infinite;display:inline-block;"></i> מעבד תשלום...';
    s.payRef = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2,6).toUpperCase();
    await new Promise(r => setTimeout(r, 1800));
    try {
      await save();
      document.getElementById('pay-ref-num').textContent = s.payRef;
      goStep('success');
    } catch (e) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-credit-card"></i> שלם ₪399 — דמי רישום';
      err(5, 'שגיאה בשמירת הנתונים: ' + e.message + '. אנא נסו שנית.');
    }
  }
};

const st = document.createElement('style');
st.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
document.head.appendChild(st);
