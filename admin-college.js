// ══════════════════════════════════════════════
//  BATCH MODULE — Mock Data
// ══════════════════════════════════════════════
const B_TRACK_LABELS = {
  pergola_al:'פרגולה אלומיניום', pergola_electric:'פרגולה חשמלית + ZIP',
  glass_systems:'זכוכית ואקורדיון', bioclimatic:'BIOCLIMATIC',
  weld_al:'ריתוך אלומיניום', weld_steel:'ריתוך קונסטרוקציה',
};
const B_LOC = { beer_sheva:'באר שבע', tel_aviv:'תל אביב' };
const B_SCH = { morning:'בוקר', evening:'ערב' };
const B_COLORS = ['#2563eb','#7c3aed','#0891b2','#16a34a','#d97706','#dc2626'];

let bBatches = [];
let bPool    = [];

// ── Supabase loader ──
async function bInit() {
  // Module scripts are deferred — wait for _supabase to be available
  let sb = window._supabase;
  if (!sb) {
    await new Promise(r => setTimeout(r, 600));
    sb = window._supabase;
    if (!sb) { console.warn('[bInit] supabase not ready'); return; }
  }

  // 1. Fetch batches
  const { data: batches, error: e1 } = await sb
    .from('batches')
    .select('*')
    .order('created_at', { ascending: true });
  if (e1) { console.error('[bInit] batches:', e1.message); }

  // 2. Fetch batch_students (no join — separate student lookup below)
  const { data: bsRows, error: e2 } = await sb
    .from('batch_students')
    .select('*');
  if (e2) { console.warn('[bInit] batch_students:', e2.message); }

  // 3. Fetch student details for those already in a batch
  const assignedStudentIds = new Set((bsRows || []).map(r => r.student_id));
  let studentMap = {};
  if (assignedStudentIds.size > 0) {
    const { data: studs } = await sb
      .from('students')
      .select('id, full_name, phone')
      .in('id', [...assignedStudentIds]);
    (studs || []).forEach(s => { studentMap[s.id] = s; });
  }

  // 4. Fetch waiting pool — all students with awaiting_assignment status
  const { data: poolStudents, error: e3 } = await sb
    .from('students')
    .select('id, full_name, phone, course_track, location, schedule, payment_ref')
    .eq('status', 'awaiting_assignment');
  if (e3) { console.error('[bInit] pool:', e3.message); }

  // 5. Build in-memory shape
  bBatches = (batches || []).map(b => ({
    id:       b.id,
    name:     b.name,
    track:    b.track,
    loc:      b.location,
    sch:      b.schedule,
    date:     b.open_date,
    cap:      b.capacity,
    sessions: b.sessions,
    students: (bsRows || [])
      .filter(bs => bs.batch_id === b.id)
      .map(bs => ({
        id:     bs.student_id,
        _bsId:  bs.id,
        name:   studentMap[bs.student_id]?.full_name || '—',
        phone:  studentMap[bs.student_id]?.phone     || '',
        paid:   bs.paid,
        attend: Array.isArray(bs.attendance) ? bs.attendance : Array(b.sessions || 5).fill(0),
      }))
  }));

  // Pool = awaiting_assignment students not yet assigned to any batch
  bPool = (poolStudents || [])
    .filter(s => !assignedStudentIds.has(s.id))
    .map(s => ({
      id:     s.id,
      name:   s.full_name    || '—',
      phone:  s.phone        || '',
      track:  s.course_track || '',
      loc:    s.location     || 'beer_sheva',
      sch:    s.schedule     || 'morning',
      payRef: s.payment_ref  || '',
    }));

  bRenderDashboard();
}

bInit().catch(console.error); // load on startup

let bCurrentBatchId = null;
let bAssigningId    = null;
let bSelectedBatch  = null;
let bCurrentTab     = 'students';

// ── Helpers ──
function bInitials(name) { return name.trim().split(' ').map(w=>w[0]).slice(0,2).join(''); }
function bAvatarColor(id) { let h=0; for(let c of id) h=(h*31+c.charCodeAt(0))%B_COLORS.length; return B_COLORS[h]; }
function bProgColor(pct) { return pct>=80?'#16a34a':pct>=50?'#2563eb':'#f59e0b'; }
function bAttPct(st) { if(!st.attend.length) return 0; return Math.round(st.attend.filter(v=>v===1).length/st.attend.length*100); }
function bFillPct(b) { return Math.round(b.students.length/b.cap*100); }

// ── Stats ──
function bRenderStats() {
  const total = bBatches.reduce((a,b)=>a+b.students.length,0);
  document.getElementById('b-stats-row').innerHTML = `
    <div class="b-stat-card"><div class="b-stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="ph ph-books"></i></div><div><div class="b-stat-val">${bBatches.length}</div><div class="b-stat-lbl">מחזורים פעילים</div></div></div>
    <div class="b-stat-card"><div class="b-stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="ph ph-user-check"></i></div><div><div class="b-stat-val">${total}</div><div class="b-stat-lbl">תלמידים משובצים</div></div></div>
    <div class="b-stat-card"><div class="b-stat-icon" style="background:#fffbeb;color:#d97706;"><i class="ph ph-hourglass"></i></div><div><div class="b-stat-val">${bPool.length}</div><div class="b-stat-lbl">ממתינים לשיבוץ</div></div></div>
    <div class="b-stat-card"><div class="b-stat-icon" style="background:#f5f3ff;color:#7c3aed;"><i class="ph ph-currency-circle-dollar"></i></div><div><div class="b-stat-val">₪${(bBatches.reduce((a,b)=>a+b.students.filter(s=>s.paid).length,0)*8500+bPool.length*399).toLocaleString()}</div><div class="b-stat-lbl">סה"כ גבוי</div></div></div>
  `;
}

// ── Batches Grid ──
function bRenderGrid() {
  const tagMap = {pergola_al:'b-tag-blue',pergola_electric:'b-tag-blue',glass_systems:'b-tag-blue',bioclimatic:'b-tag-green',weld_al:'b-tag-orange',weld_steel:'b-tag-orange'};
  let html = bBatches.map(b => {
    const pct = bFillPct(b);
    const spots = b.cap - b.students.length;
    const dateStr = b.date ? new Date(b.date).toLocaleDateString('he-IL') : '—';
    return `<div class="b-card" onclick="bOpenDetail('${b.id}')">
      <div class="b-card-header">
        <div><div class="b-card-name">${b.name}</div><div class="b-card-sub">${B_TRACK_LABELS[b.track]||b.track}</div></div>
        <span class="b-tag ${tagMap[b.track]||'b-tag-blue'}">${B_SCH[b.sch]}</span>
      </div>
      <div class="b-meta">
        <span class="b-meta-item"><i class="ph ph-map-pin"></i> ${B_LOC[b.loc]}</span>
        <span class="b-meta-item"><i class="ph ph-calendar"></i> ${dateStr}</span>
        <span class="b-meta-item"><i class="ph ph-clock"></i> ${b.sessions} מפגשים</span>
      </div>
      <div class="b-prog-row"><span class="b-prog-lbl">תפוסה</span><span class="b-prog-val">${b.students.length}/${b.cap} · ${spots>0?spots+' פנויים':'מלא'}</span></div>
      <div class="b-prog-bar"><div class="b-prog-fill" style="width:${pct}%;background:${bProgColor(pct)};"></div></div>
      <div class="b-card-footer" onclick="event.stopPropagation()">
        <button class="b-btn b-btn-primary" onclick="bOpenDetail('${b.id}')"><i class="ph ph-clipboard-text"></i> ניהול נוכחות</button>
        <button class="b-btn b-btn-ghost" onclick="bOpenDetail('${b.id}')"><i class="ph ph-currency-circle-dollar"></i> כספים</button>
        <button class="b-btn b-btn-ghost" onclick="bDeleteBatch('${b.id}')" style="flex:0;padding:0.45rem 0.6rem;color:#dc2626;" title="מחק מחזור"><i class="ph ph-trash"></i></button>
      </div>
    </div>`;
  }).join('');
  html += `<div class="b-card-new" onclick="bOpenNewBatch()"><i class="ph ph-plus-circle"></i><span>הקמת מחזור חדש</span></div>`;
  document.getElementById('b-grid').innerHTML = html;
}

// ── Pool ──
function bRenderPool() {
  document.getElementById('b-pool-count').textContent = bPool.length;
  const body = document.getElementById('b-pool-body');
  if (!bPool.length) {
    body.innerHTML = `<div class="b-pool-empty"><i class="ph ph-check-circle" style="font-size:1.5rem;color:#16a34a;display:block;margin-bottom:6px;"></i>כל הממתינים שובצו!</div>`;
    return;
  }
  body.innerHTML = `<table class="b-pool-table">
    <thead><tr>
      <th>תלמיד</th>
      <th>קורס מבוקש</th>
      <th>מיקום</th>
      <th>זמן</th>
      <th>טלפון</th>
      <th>אסמכתא</th>
      <th></th>
    </tr></thead>
    <tbody>${bPool.map(w => `
      <tr class="pool-row-clickable" id="bpr-${w.id}" onclick="bTogglePoolRow('${w.id}',event)">
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="b-pool-avatar" style="background:${bAvatarColor(w.id)};"> ${bInitials(w.name)}</div>
            <div class="b-pool-name">${w.name}</div>
          </div>
        </td>
        <td><div class="b-pool-name" style="font-size:0.78rem;">${B_TRACK_LABELS[w.track]||w.track||'—'}</div></td>
        <td><div class="b-pool-sub">${B_LOC[w.loc]||'—'}</div></td>
        <td><div class="b-pool-sub">${B_SCH[w.sch]||'—'}</div></td>
        <td><div class="b-pool-sub">${w.phone||'—'}</div></td>
        <td><div class="b-pool-sub" style="font-family:monospace;font-size:0.68rem;">${w.payRef||'—'}</div></td>
        <td><button class="b-pool-btn" onclick="bOpenAssign('${w.id}',event)"><i class="ph ph-arrow-square-left"></i> שבץ</button></td>
      </tr>
      <tr class="b-pool-detail-row" id="bpd-${w.id}">
        <td colspan="7"><div id="bpdb-${w.id}"><div style="text-align:center;color:#94a3b8;padding:0.75rem;font-size:0.82rem;">טוען…</div></div></td>
      </tr>
    `).join('')}
    </tbody>
  </table>`;
}

// ── Student CRM Card ──
const WIN_LABELS = { may_jun:'מאי–יוני', jun_jul:'יוני–יולי', aug_sep:'אוגוסט–ספטמבר' };
const COURSE_FULL_LABELS = {
  pergola_al:'מתקין מוסמך – פרגולה אלומיניום', pergola_electric:'מתקין מוסמך – פרגולה חשמלית ומסכי ZIP',
  glass_systems:'מתקין מוסמך – מערכות זכוכית', bioclimatic:'מתקין מוסמך – מערכות BIOCLIMATIC',
  weld_al:'מסגרות וריתוך אלומיניום', weld_steel:'מסגרות וריתוך קונסטרוקציה'
};

async function bTogglePoolRow(studentId, event) {
  if (event && event.target.closest('button')) return;
  const detailRow = document.getElementById('bpd-' + studentId);
  const mainRow   = document.getElementById('bpr-' + studentId);
  if (!detailRow) return;
  const isOpen = detailRow.classList.toggle('open');
  mainRow.classList.toggle('expanded', isOpen);
  if (!isOpen) return;
  const body = document.getElementById('bpdb-' + studentId);
  if (body.dataset.loaded) return;
  const { data: st } = await window._supabase.from('students').select('*').eq('id', studentId).single();
  if (!st) { body.innerHTML = '<div style="color:#dc2626;padding:0.75rem;">שגיאה בטעינה</div>'; return; }
  body.dataset.loaded = '1';
  const notes = Array.isArray(st.admin_notes) ? st.admin_notes : [];
  const initials = (st.full_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  function scr(v,y,n){return v==='yes'?'<span class="bsc-val-yes">✓ '+y+'</span>':v==='no'?'<span class="bsc-val-no">✗ '+n+'</span>':'<span style="color:#94a3b8">—</span>';}
  const sigHtml = (st.health_signature_data||st.regulations_signature_data)
    ? '<div style="display:flex;gap:0.6rem;margin-top:0.6rem;flex-wrap:wrap;">'
      +(st.health_signature_data?'<button onclick="bDownloadDoc(\'health\',\''+studentId+'\')" style="display:flex;align-items:center;gap:6px;background:#eff6ff;color:#2563eb;border:1.5px solid #bfdbfe;border-radius:8px;padding:6px 14px;font-family:\'Heebo\',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;"><i class="ph ph-file-pdf" style="font-size:1rem;"></i> הצהרת בריאות — הורדה</button>':'')
      +(st.regulations_signature_data?'<button onclick="bDownloadDoc(\'regs\',\''+studentId+'\')" style="display:flex;align-items:center;gap:6px;background:#eff6ff;color:#2563eb;border:1.5px solid #bfdbfe;border-radius:8px;padding:6px 14px;font-family:\'Heebo\',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;"><i class="ph ph-file-pdf" style="font-size:1rem;"></i> תקנון לימודים — הורדה</button>':'')
      +'</div>' : '';
  const notesHtml = notes.length===0
    ? '<div style="font-size:0.78rem;color:#94a3b8;">אין הערות עדיין</div>'
    : notes.map(n=>'<div class="bsc-note-item"><div class="bsc-note-date">'+new Date(n.created_at).toLocaleDateString('he-IL')+'</div>'+n.text+'</div>').join('');
  body.innerHTML =
    '<div class="bsc-header">'
    +'<div class="bsc-avatar" style="background:'+bAvatarColor(st.id)+'">'+initials+'</div>'
    +'<div><div class="bsc-name">'+(st.full_name||'—')+'</div>'
    +'<div class="bsc-meta"><span><i class="ph ph-phone"></i> '+(st.phone||'—')+'</span>'
    +'<span><i class="ph ph-envelope"></i> '+(st.email||'—')+'</span>'
    +'<span><i class="ph ph-calendar"></i> '+new Date(st.created_at).toLocaleDateString('he-IL')+'</span></div></div></div>'
    +'<div class="bsc-sections">'
    +'<div class="bsc-section"><div class="bsc-section-title"><i class="ph ph-graduation-cap"></i> בחירת קורס</div>'
    +'<div class="bsc-grid">'
    +'<div class="bsc-field"><div class="bsc-label">מסלול</div><div class="bsc-val">'+(COURSE_FULL_LABELS[st.course_track]||st.course_track||'—')+'</div></div>'
    +'<div class="bsc-field"><div class="bsc-label">מיקום</div><div class="bsc-val">'+(st.location==='beer_sheva'?'באר שבע':st.location==='tel_aviv'?'תל אביב':st.location||'—')+'</div></div>'
    +'<div class="bsc-field"><div class="bsc-label">זמן</div><div class="bsc-val">'+(st.schedule==='morning'?'בוקר':st.schedule==='evening'?'ערב':st.schedule||'—')+'</div></div>'
    +'<div class="bsc-field"><div class="bsc-label">מועד פתיחה</div><div class="bsc-val">'+(WIN_LABELS[st.opening_window]||st.opening_window||'—')+'</div></div>'
    +'</div></div>'
    +'<div class="bsc-section"><div class="bsc-section-title"><i class="ph ph-clipboard-text"></i> שאלות התאמה</div>'
    +'<div class="bsc-grid">'
    +'<div class="bsc-field"><div class="bsc-label">כשיר לגובה</div>'+scr(st.screening_physical,'כן','לא')+'</div>'
    +'<div class="bsc-field"><div class="bsc-label">אישור עבודה</div>'+scr(st.screening_permit,'יש','אין')+'</div>'
    +'<div class="bsc-field"><div class="bsc-label">ניסיון חשמל</div>'+scr(st.screening_tools,'יש','אין')+'</div>'
    +'<div class="bsc-field"><div class="bsc-label">גיל 18+</div>'+scr(st.screening_age,'כן','לא')+'</div>'
    +'</div></div>'
    +'<div class="bsc-section"><div class="bsc-section-title"><i class="ph ph-pen-nib"></i> הסכמים</div>'
    +'<div class="bsc-grid">'
    +'<div class="bsc-field"><div class="bsc-label">הצהרת בריאות</div><div class="'+(st.health_declaration_signed?'bsc-val-yes':'bsc-val-no')+'">'+(st.health_declaration_signed?'✓ חתום':'✗ לא חתום')+'</div></div>'
    +'<div class="bsc-field"><div class="bsc-label">תקנון לימודים</div><div class="'+(st.regulations_signed?'bsc-val-yes':'bsc-val-no')+'">'+(st.regulations_signed?'✓ חתום':'✗ לא חתום')+'</div></div>'
    +'</div>'+sigHtml+'</div>'
    +'<div class="bsc-section"><div class="bsc-section-title"><i class="ph ph-credit-card"></i> תשלום</div>'
    +'<div class="bsc-grid">'
    +'<div class="bsc-field"><div class="bsc-label">סטטוס</div><div class="bsc-val">'+(st.payment_status||'—')+'</div></div>'
    +'<div class="bsc-field"><div class="bsc-label">סכום</div><div class="bsc-val">'+(st.payment_amount?'₪'+st.payment_amount:'—')+'</div></div>'
    +'<div class="bsc-field"><div class="bsc-label">אסמכתא</div><div class="bsc-val" style="font-family:monospace;font-size:0.72rem;">'+(st.payment_ref||'—')+'</div></div>'
    +'</div></div>'
    +'</div>'
    +'<div class="bsc-section" style="margin-top:0.75rem;">'
    +'<div class="bsc-section-title"><i class="ph ph-note-pencil"></i> הערות מנהל</div>'
    +'<div id="bsc-notes-'+st.id+'" style="margin-bottom:0.4rem;">'+notesHtml+'</div>'
    +'<div class="bsc-note-row">'
    +'<input class="bsc-note-input" id="bsc-ni-'+st.id+'" placeholder="הוסף הערה…" onkeydown="if(event.key===\'Enter\')bSaveStudentNote(\''+st.id+'\')">'
    +'<button class="bsc-note-save" onclick="bSaveStudentNote(\''+st.id+'\')"><i class="ph ph-paper-plane-right"></i> שמור</button>'
    +'</div></div>';
}

async function bDownloadDoc(type, studentId) {
  const { data: st } = await window._supabase.from('students').select('*').eq('id', studentId).single();
  if (!st) return;
  const today = new Date().toLocaleDateString('he-IL');
  const trackName = (COURSE_FULL_LABELS[st.course_track] || st.course_track || '');
  const isHealth = type === 'health';
  const sigData  = isHealth ? st.health_signature_data : st.regulations_signature_data;
  const docTitle = isHealth ? 'הצהרת בריאות' : 'תקנון לימודים';
  const docBody  = isHealth
    ? 'אני המצהיר/ה מאשר/ת כי:<br>1. אני כשיר/ה פיזית לביצוע עבודות בגובה עד 6 מטר.<br>2. אני מסוגל/ת להרמת משקלים עד 25 ק"ג ללא הגבלה רפואית.<br>3. איני סובל/ת ממחלות לב, יל"ד בלתי מאוזן, סחרחורת כרונית.<br>4. אתחייב/ת להודיע למכללה על כל שינוי במצבי הרפואי.'
    : 'נוכחות מינימלית: 85% לקבלת תעודה.<br>דמי רישום: 399 ש"ח — מקוזזים מהמחיר הסופי של הקורס (₪8,500 + מע"מ).<br>ביטול עד 14 יום — החזר מלא. 15–30 יום — 50%. מעל 30 יום — ללא החזר.<br>קוד לבוש: נעלי בטיחות S1P + מטר אישי — חובה.';
  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${docTitle} – ${st.full_name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 2.5cm 3cm; color: #111; font-size: 13px; }
    h1 { font-size: 18px; color: #0f1f35; border-bottom: 2px solid #1a5faa; padding-bottom: 8px; margin-bottom: 20px; }
    h2 { font-size: 14px; color: #1a5faa; margin: 24px 0 8px; }
    .meta { background: #f4f6fb; border-radius: 6px; padding: 10px 14px; margin-bottom: 24px; font-size: 12px; line-height: 1.8; }
    .doc-text { background: #f9f9f9; border: 1px solid #dde4f0; border-radius: 6px; padding: 12px 16px; line-height: 1.9; margin-bottom: 16px; }
    .sig-label { font-size: 11px; color: #6b7a99; margin-bottom: 4px; }
    .sig-img { border: 1px solid #dde4f0; border-radius: 6px; max-height: 90px; display: block; background: #fff; }
    .footer { margin-top: 3cm; font-size: 10px; color: #9aa3b5; text-align: center; border-top: 1px solid #dde4f0; padding-top: 8px; }
  </style>
</head>
<body>
  <h1>מכללת ALUM-IL — ${docTitle}</h1>
  <div class="meta">
    <strong>שם:</strong> ${st.full_name} &nbsp;|&nbsp;
    <strong>טלפון:</strong> ${st.phone}<br>
    <strong>מסלול:</strong> ${trackName}<br>
    <strong>תאריך חתימה:</strong> ${today} &nbsp;|&nbsp;
    <strong>אסמכתא:</strong> ${st.payment_ref || '—'}
  </div>
  <h2>${docTitle}</h2>
  <div class="doc-text">${docBody}</div>
  <div class="sig-label">חתימה:</div>
  ${sigData ? '<img class="sig-img" src="' + sigData + '">' : '<div style="height:60px;border:1px dashed #ccc;border-radius:6px;"></div>'}
  <div class="footer">מסמך זה הופק על ידי מערכת ניהול מכללת ALUM-IL · ${today}</div>
</body>
</html>`;
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}

async function bSaveStudentNote(studentId) {
  const input = document.getElementById('bsc-ni-' + studentId);
  const text = input && input.value.trim();
  if (!text) return;
  const { data: st } = await window._supabase.from('students').select('admin_notes').eq('id', studentId).single();
  const notes = Array.isArray(st && st.admin_notes) ? st.admin_notes : [];
  notes.push({ text, created_at: new Date().toISOString() });
  await window._supabase.from('students').update({ admin_notes: notes }).eq('id', studentId);
  input.value = '';
  document.getElementById('bsc-notes-' + studentId).innerHTML = notes.map(n=>'<div class="bsc-note-item"><div class="bsc-note-date">'+new Date(n.created_at).toLocaleDateString('he-IL')+'</div>'+n.text+'</div>').join('');
}

function bRenderDashboard() {
  bRenderStats();
  bRenderGrid();
  bRenderPool();
}

// ── Batch Detail ──
function bOpenDetail(id) {
  bCurrentBatchId = id;
  bCurrentTab = 'students';
  bNavTo('detail');
  bRenderDetail();
}

function bRenderDetail() {
  const b = bBatches.find(x=>x.id===bCurrentBatchId);
  if (!b) return;
  const pct = bFillPct(b);
  document.getElementById('b-detail-header').innerHTML = `
    <div class="b-detail-header" style="background:transparent;border:none;padding:0;margin:0;display:block;">
      <h2>${b.name}</h2>
      <div class="b-detail-meta">
        <span><i class="ph ph-graduation-cap"></i> ${B_TRACK_LABELS[b.track]}</span>
        <span><i class="ph ph-map-pin"></i> ${B_LOC[b.loc]}</span>
        <span><i class="ph ph-clock"></i> ${B_SCH[b.sch]} · ${b.sessions} מפגשים</span>
        <span><i class="ph ph-calendar"></i> ${b.date?new Date(b.date).toLocaleDateString('he-IL'):'—'}</span>
        <span><i class="ph ph-users"></i> ${b.students.length}/${b.cap}</span>
        <span style="margin-right:auto;"><strong style="color:${bProgColor(pct)};font-size:1.1rem;">${pct}%</strong> תפוסה</span>
      </div>
    </div>`;
  document.querySelectorAll('.b-detail-tab').forEach((t,i)=>t.classList.toggle('active',i===0));
  document.querySelectorAll('.b-tab-pane').forEach((p,i)=>p.classList.toggle('active',i===0));
  bRenderStudentsTab(b);
  bRenderFinanceTab(b);
}

function bRenderStudentsTab(b) {
  const sessions = Array.from({length:b.sessions},(_,i)=>i);
  if (!b.students.length) {
    document.getElementById('b-tab-students').innerHTML = `<div class="b-table-wrap" style="padding:3rem;text-align:center;color:#94a3b8;"><i class="ph ph-users" style="font-size:2rem;display:block;margin-bottom:8px;"></i>אין תלמידים משובצים עדיין</div>`;
    return;
  }
  const rows = b.students.map(st => {
    const pct = bAttPct(st);
    const boxes = sessions.map(i => {
      const v = st.attend[i];
      const cls = v===1?'present':v===0?'absent':'';
      const lbl = v===1?'✓':v===0?'✗':'';
      return `<div class="b-att-box ${cls}" onclick="bToggleAttend('${b.id}','${st.id}',${i})">${lbl}</div>`;
    }).join('');
    return `<tr>
      <td><div class="b-s-cell"><div class="b-s-avatar" style="background:${bAvatarColor(st.id)};">${bInitials(st.name)}</div><div><div class="b-s-name">${st.name}</div><div class="b-s-phone">${st.phone}</div></div></div></td>
      <td><span class="b-pill ${st.paid?'b-pill-paid':'b-pill-pending'}">${st.paid?'<i class="ph ph-check"></i> שולמה':'<i class="ph ph-warning"></i> חסרה'}</span></td>
      <td><div class="b-attend-cell">${boxes}</div></td>
      <td style="font-weight:700;color:${pct>=85?'#16a34a':pct>=60?'#2563eb':'#dc2626'};">${pct}%</td>
      <td><button onclick="bToggleBalance('${b.id}','${st.id}')" style="background:none;border:none;cursor:pointer;font-size:0.75rem;color:#64748b;font-family:'Heebo',sans-serif;"><i class="ph ph-pencil"></i> עדכן</button></td>
    </tr>`;
  }).join('');
  const hdrs = sessions.map(i=>`<th style="min-width:26px;text-align:center;">${i+1}</th>`).join('');
  document.getElementById('b-tab-students').innerHTML = `
    <div class="b-table-wrap"><table>
      <thead><tr><th>תלמיד</th><th>יתרה</th><th colspan="${b.sessions}">נוכחות — מפגשים ${hdrs}</th><th>%</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function bRenderFinanceTab(b) {
  const rows = b.students.map(st => {
    const balance = 8500-399;
    return `<tr>
      <td><div class="b-s-cell"><div class="b-s-avatar" style="background:${bAvatarColor(st.id)};">${bInitials(st.name)}</div><div class="b-s-name">${st.name}</div></div></td>
      <td><span class="b-pill b-pill-paid"><i class="ph ph-check"></i> ₪399</span></td>
      <td><span class="b-pill ${st.paid?'b-pill-paid':'b-pill-pending'}">${st.paid?'<i class="ph ph-check"></i> ₪'+balance.toLocaleString():'<i class="ph ph-warning"></i> ₪'+balance.toLocaleString()+' — טרם שולם'}</span></td>
      <td style="font-weight:800;color:#0f172a;">₪${(st.paid?8500:399).toLocaleString()}</td>
      <td><button onclick="bToggleBalance('${b.id}','${st.id}')" style="background:${st.paid?'#fef2f2':'#f0fdf4'};border:none;border-radius:6px;padding:4px 10px;font-size:0.72rem;font-weight:700;cursor:pointer;color:${st.paid?'#dc2626':'#16a34a'};font-family:'Heebo',sans-serif;">${st.paid?'בטל תשלום':'סמן כשולם'}</button></td>
    </tr>`;
  }).join('');
  const paid = b.students.filter(s=>s.paid).length;
  const total = b.students.reduce((a,st)=>a+(st.paid?8500:399),0);
  document.getElementById('b-tab-finance').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.25rem;">
      <div class="b-stat-card"><div class="b-stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="ph ph-check-circle"></i></div><div><div class="b-stat-val">${paid}</div><div class="b-stat-lbl">שילמו יתרה</div></div></div>
      <div class="b-stat-card"><div class="b-stat-icon" style="background:#fef2f2;color:#dc2626;"><i class="ph ph-warning-circle"></i></div><div><div class="b-stat-val">${b.students.length-paid}</div><div class="b-stat-lbl">יתרה חסרה</div></div></div>
      <div class="b-stat-card"><div class="b-stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="ph ph-currency-circle-dollar"></i></div><div><div class="b-stat-val">₪${total.toLocaleString()}</div><div class="b-stat-lbl">סה"כ שולם</div></div></div>
    </div>
    <div class="b-table-wrap"><table>
      <thead><tr><th>תלמיד</th><th>דמי רישום</th><th>יתרת קורס</th><th>סה"כ שולם</th><th>פעולה</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

// ── Actions ──
async function bToggleAttend(bId,sId,idx) {
  const b=bBatches.find(x=>x.id===bId),st=b.students.find(x=>x.id===sId);
  st.attend[idx]=st.attend[idx]===1?0:1;
  await window._supabase.from('batch_students')
    .update({ attendance: st.attend })
    .eq('batch_id', bId).eq('student_id', sId);
  bRenderStudentsTab(b); bRenderStats();
}
async function bToggleBalance(bId,sId) {
  const b=bBatches.find(x=>x.id===bId),st=b.students.find(x=>x.id===sId);
  st.paid=!st.paid;
  await window._supabase.from('batch_students')
    .update({ paid: st.paid })
    .eq('batch_id', bId).eq('student_id', sId);
  bRenderStudentsTab(b); bRenderFinanceTab(b); bRenderStats();
}
function bOpenAssign(wId,e) {
  if(e) e.stopPropagation();
  const w=bPool.find(x=>x.id===wId);
  if(!w) return;
  bAssigningId=wId; bSelectedBatch=null;
  document.getElementById('b-assign-title').textContent=`שיבוץ: ${w.name}`;
  const avail=bBatches.filter(b=>b.students.length<b.cap);
  const perfect=avail.filter(b=>b.track===w.track&&b.loc===w.loc&&b.sch===w.sch);
  const partial=avail.filter(b=>b.track===w.track&&!(b.loc===w.loc&&b.sch===w.sch));
  const other=avail.filter(b=>b.track!==w.track);
  let html='';
  if(perfect.length) { html+=`<div style="font-size:0.72rem;font-weight:800;color:#16a34a;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">התאמה מושלמת</div>`; html+=perfect.map(b=>bAssignRow(b,'perfect',w)).join(''); }
  if(partial.length) { html+=`<div style="font-size:0.72rem;font-weight:800;color:#d97706;text-transform:uppercase;letter-spacing:1px;margin:${perfect.length?'12px':0} 0 6px;">התאמה חלקית</div>`; html+=partial.map(b=>bAssignRow(b,'partial',w)).join(''); }
  if(other.length)   { html+=`<div style="font-size:0.72rem;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin:${(perfect.length||partial.length)?'12px':0} 0 6px;">מחזורים אחרים</div>`; html+=other.map(b=>bAssignRow(b,'other',w)).join(''); }
  if(!avail.length) html=`<div style="text-align:center;color:#94a3b8;padding:1.5rem;font-size:0.85rem;">אין מחזורים פנויים כרגע</div>`;
  document.getElementById('b-assign-list').innerHTML=html;
  document.getElementById('bm-assign').classList.add('open');
}
function bAssignRow(b,matchType,w) {
  const spotColor=matchType==='perfect'?'#16a34a':matchType==='partial'?'#d97706':'#64748b';
  let diffHtml='';
  if(matchType==='partial') {
    const diffs=[];
    if(b.loc!==w.loc) diffs.push(`מיקום: ${B_LOC[b.loc]}`);
    if(b.sch!==w.sch) diffs.push(`זמן: ${B_SCH[b.sch]}`);
    if(diffs.length) diffHtml=`<div style="font-size:0.68rem;color:#d97706;margin-top:3px;">שונה: ${diffs.join(' · ')}</div>`;
  }
  return `<div class="b-assign-item" id="bai-${b.id}" onclick="bSelectBatch('${b.id}')">
    <div style="flex:1;min-width:0;">
      <div class="b-assign-name">${b.name}</div>
      <div class="b-assign-meta">${B_LOC[b.loc]} · ${B_SCH[b.sch]} · ${B_TRACK_LABELS[b.track]}</div>
      ${diffHtml}
    </div>
    <div class="b-assign-spots" style="color:${spotColor};flex-shrink:0;margin-right:10px;">${b.cap-b.students.length} מקומות</div>
  </div>`;
}
function bSelectBatch(id) {
  bSelectedBatch=id;
  document.querySelectorAll('.b-assign-item').forEach(el=>el.classList.remove('sel'));
  document.getElementById('bai-'+id)?.classList.add('sel');
}
async function bConfirmAssign() {
  if(!bSelectedBatch){alert('יש לבחור מחזור');return;}
  const w=bPool.find(x=>x.id===bAssigningId);
  const b=bBatches.find(x=>x.id===bSelectedBatch);
  if(!w||!b) return;
  const newAttend = Array(b.sessions).fill(0);
  const { data: bsData, error: e1 } = await window._supabase.from('batch_students').insert({
    batch_id:   bSelectedBatch,
    student_id: w.id,
    paid:       false,
    attendance: newAttend,
  }).select().single();
  if(e1){alert('שגיאה בשיבוץ: '+e1.message);return;}
  await window._supabase.from('students')
    .update({ status: 'assigned_pending_payment' })
    .eq('id', w.id);
  b.students.push({id:w.id,_bsId:bsData?.id,name:w.name,phone:w.phone,paid:false,attend:newAttend});
  bPool=bPool.filter(x=>x.id!==bAssigningId);
  bCloseModal('bm-assign');
  bRenderDashboard();
  if(bCurrentBatchId===bSelectedBatch) bRenderDetail();
}
function bOpenNewBatch() {
  document.getElementById('bnb-name').value='';
  document.getElementById('bnb-track').value='';
  document.getElementById('bnb-date').value='';
  document.getElementById('bnb-cap').value='15';
  document.getElementById('bm-new-batch').classList.add('open');
}
async function bCreateBatch() {
  const name=document.getElementById('bnb-name').value.trim();
  const track=document.getElementById('bnb-track').value;
  const loc=document.getElementById('bnb-loc').value;
  const sch=document.getElementById('bnb-sch').value;
  const date=document.getElementById('bnb-date').value;
  const cap=parseInt(document.getElementById('bnb-cap').value)||15;
  if(!name){alert('יש להזין שם מחזור');return;}
  if(!track){alert('יש לבחור מסלול');return;}
  const sessions=sch==='morning'?5:10;
  const { data, error } = await window._supabase.from('batches').insert({
    name, track, location:loc, schedule:sch,
    open_date: date||null, capacity:cap, sessions,
  }).select().single();
  if(error){alert('שגיאה ביצירת מחזור: '+error.message);return;}
  bBatches.push({id:data.id,name,track,loc,sch,date,cap,sessions,students:[]});
  bCloseModal('bm-new-batch');
  bRenderDashboard();
}

// ── Navigation ──
function bNavTo(v) {
  document.querySelectorAll('.b-view').forEach(el=>el.classList.remove('active'));
  document.getElementById('bv-'+v)?.classList.add('active');
}
function bSwitchTab(t) {
  bCurrentTab=t;
  document.querySelectorAll('.b-detail-tab').forEach((el,i)=>el.classList.toggle('active',(i===0&&t==='students')||(i===1&&t==='finance')));
  document.querySelectorAll('.b-tab-pane').forEach((el,i)=>el.classList.toggle('active',(i===0&&t==='students')||(i===1&&t==='finance')));
}
function bCloseModal(id,e) {
  if(e&&e.target!==document.getElementById(id)) return;
  document.getElementById(id).classList.remove('open');
}

const B_DELETE_PASSWORD = 'alum2025';
let bPendingDeleteId = null;

function bDeleteBatch(id) {
  bPendingDeleteId = id;
  document.getElementById('b-del-pass-input').value = '';
  document.getElementById('b-del-pass-err').style.display = 'none';
  document.getElementById('bm-delete').classList.add('open');
  setTimeout(() => document.getElementById('b-del-pass-input').focus(), 100);
}

async function bConfirmDelete() {
  const val = document.getElementById('b-del-pass-input').value;
  if (val !== B_DELETE_PASSWORD) {
    const err = document.getElementById('b-del-pass-err');
    err.textContent = 'סיסמה שגויה';
    err.style.display = 'block';
    return;
  }
  const { error } = await window._supabase.from('batches').delete().eq('id', bPendingDeleteId);
  if (error) { alert('שגיאה במחיקה: ' + error.message); return; }
  bBatches = bBatches.filter(x => x.id !== bPendingDeleteId);
  bCloseModal('bm-delete');
  bRenderDashboard();
}