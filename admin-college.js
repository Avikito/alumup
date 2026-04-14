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
    id:               b.id,
    name:             b.name,
    track:            b.track,
    loc:              b.location,
    sch:              b.schedule,
    date:             b.open_date,
    cap:              b.capacity,
    sessions:         b.sessions,
    instructor:       b.instructor || '',
    officiallyOpened: !!b.officially_opened,
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
const B_MIN_TO_OPEN = 5;
function bRenderGrid() {
  const tagMap = {pergola_al:'b-tag-blue',pergola_electric:'b-tag-blue',glass_systems:'b-tag-blue',bioclimatic:'b-tag-green',weld_al:'b-tag-orange',weld_steel:'b-tag-orange'};
  let html = bBatches.map(b => {
    const pct    = bFillPct(b);
    const count  = b.students.length;
    const remaining = b.cap - count;
    const dateStr = b.date ? new Date(b.date).toLocaleDateString('he-IL') : '—';
    const instructor = (b.instructor || '').replace(/"/g,'&quot;');

    let statusHtml;
    if (b.officiallyOpened) {
      statusHtml = `<div class="b-status-badge b-status-full" style="background:rgba(22,163,74,0.12);color:#15803d;border-color:rgba(22,163,74,0.3);"><i class="ph ph-seal-check"></i> מחזור פתוח רשמית — חומרי לימוד זמינים לסטודנטים</div>`;
    } else if (count >= b.cap) {
      statusHtml = `<div class="b-status-badge b-status-full"><i class="ph ph-seal-check"></i> המחזור מלא</div>`;
    } else if (count >= B_MIN_TO_OPEN) {
      statusHtml = `<div class="b-status-badge b-status-can-open"><i class="ph ph-check-circle"></i> ניתן לפתיחת מחזור · נותרו ${remaining} מקומות פנויים</div>`;
    } else {
      const needed = B_MIN_TO_OPEN - count;
      statusHtml = `<div class="b-status-badge b-status-cannot-open"><i class="ph ph-warning-circle"></i> לא ניתן לפתיחה — נדרשים עוד ${needed} נרשמים</div>`;
    }
    const openBtnHtml = !b.officiallyOpened && count >= B_MIN_TO_OPEN
      ? `<button class="b-btn" onclick="event.stopPropagation();bOfficiallyOpenBatch('${b.id}')" style="width:100%;justify-content:center;background:#15803d;color:#fff;border-color:#15803d;margin-bottom:0.5rem;font-weight:800;"><i class="ph ph-flag-banner"></i> פתיחת מחזור רשמית</button>`
      : '';

    return `<div class="b-card" onclick="bOpenDetail('${b.id}')">
      <div class="b-card-header">
        <span class="b-tag ${tagMap[b.track]||'b-tag-blue'}" style="font-size:0.72rem;">${B_TRACK_LABELS[b.track]||b.track}</span>
        <button onclick="event.stopPropagation();bEditBatch('${b.id}')" style="background:none;border:none;cursor:pointer;color:#cbd5e1;padding:2px;font-size:1.05rem;flex-shrink:0;" title="ערוך מחזור"><i class="ph ph-pencil"></i></button>
        <button onclick="event.stopPropagation();bDeleteBatch('${b.id}')" style="background:none;border:none;cursor:pointer;color:#cbd5e1;padding:2px;font-size:1.05rem;flex-shrink:0;margin-right:auto;" title="מחק מחזור"><i class="ph ph-trash"></i></button>
      </div>
      <div class="b-card-name">${b.name}</div>
      <div class="b-card-location" onclick="event.stopPropagation()">
        <i class="ph ph-map-pin"></i>
        <span>${B_LOC[b.loc]||b.loc} - <i class="ph ph-${b.sch==='morning'?'sun':'moon'}" style="font-size:0.85em;"></i> ${B_SCH[b.sch]||b.sch}</span>
      </div>
      <div class="b-card-instructor" onclick="event.stopPropagation()">
        <span class="b-card-instructor-label"><i class="ph ph-chalkboard-teacher"></i> מדריך:</span>
        <input class="b-card-instructor-input" type="text" placeholder="הזן שם מדריך..." value="${instructor}"
          onchange="bSaveInstructor('${b.id}',this.value)" onclick="event.stopPropagation()">
      </div>
      <div class="b-meta">
        <span class="b-meta-item"><i class="ph ph-calendar"></i> ${dateStr}</span>
        <span class="b-meta-item"><i class="ph ph-clock"></i> ${b.sessions} מפגשים</span>
      </div>
      <div class="b-prog-row"><span class="b-prog-lbl">תפוסה</span><span class="b-prog-val">${count}/${b.cap} תלמידים</span></div>
      <div class="b-prog-bar"><div class="b-prog-fill" style="width:${pct}%;background:${bProgColor(pct)};"></div></div>
      ${statusHtml}
      <div class="b-card-footer" onclick="event.stopPropagation()">
        ${openBtnHtml}
        <button class="b-btn b-btn-primary" onclick="bOpenDetail('${b.id}')"><i class="ph ph-clipboard-text"></i> ניהול נוכחות</button>
        <button class="b-btn b-btn-export" onclick="bExportBatch('${b.id}')"><i class="ph ph-export"></i> ייצוא</button>
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
    +'<div class="bsc-section"><div class="bsc-section-title"><i class="ph ph-identification-card"></i> תעודת זהות / דרכון</div>'
    +(st.id_photo_data
      ? '<div style="border-radius:10px;overflow:hidden;border:1.5px solid #e2e8f0;max-width:340px;margin-bottom:6px;">'
        +'<img src="'+st.id_photo_data+'" style="width:100%;display:block;max-height:220px;object-fit:contain;background:#f1f5f9;">'
        +'</div>'
      : '<div style="font-size:0.78rem;color:#94a3b8;padding:4px 0;margin-bottom:6px;">לא הועלתה תמונה</div>')
    +'<input type="file" id="admin-id-input-'+st.id+'" accept="image/*" style="display:none" onchange="adminUploadIdPhoto(\''+st.id+'\',this)">'
    +'<button onclick="document.getElementById(\'admin-id-input-'+st.id+'\').click()" style="display:inline-flex;align-items:center;gap:5px;background:#fff;border:1.5px solid #cbd5e1;border-radius:7px;padding:5px 12px;font-size:0.75rem;font-weight:700;color:#334155;cursor:pointer;font-family:\'Heebo\',sans-serif;">'
    +'<i class="ph ph-upload-simple"></i> '+(st.id_photo_data?'החלף תעודה':'העלה תעודה')+'</button></div>'
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
    ? '<strong>חלק א׳ — שאלון רפואי</strong><br>1. האם הרופא שלך אמר לך שאתה סובל ממחלת לב?<br>2. האם אתה חש כאבים בחזה בזמן מנוחה?<br>3. האם אתה חש כאבים בחזה במהלך פעילויות שגרה ביום-יום?<br>4. האם אתה חש כאבים בחזה בזמן פעילות גופנית?<br>5. האם במהלך השנה החולפת איבדת שיווי משקל עקב סחרחורת?<br>6. האם במהלך השנה החולפת איבדת את הכרתך?<br>7. האם הרופא אבחן אסתמה — נזקקת לטיפול תרופתי בשלושת החודשים האחרונים?<br>8. האם הרופא אבחן אסתמה — סבלת מקוצר נשימה או צפצופים?<br>9. האם בן/בת משפחה מדרגה ראשונה נפטר ממחלת לב?<br>10. האם בן/בת משפחה מדרגה ראשונה נפטר ממוות פתאומי בגיל מוקדם?<br>11. האם הרופא שלך אמר לך לבצע פעילות גופנית רק תחת השגחה רפואית?<br>12. האם אתה סובל ממחלה כרונית שעשויה להגביל אותך בביצוע פעילות גופנית?<br>13. לנשים בהריון: האם ההיריון הוגדר כהיריון בסיכון?<br><br><strong>חלק ב׳ — הצהרה</strong><br>אני החתום מטה מצהיר כי קראתי והבנתי את כל השאלון הרפואי שבחלק א׳ וכל התשובות לשאלות הן שליליות. אני מצהיר כי מסרתי ידיעות מלאות ונכונות על מצבי הרפואי בעבר ובהווה. ידוע לי כי לאחר שנתיים מיום חתימתי אדרש להמציא הצהרת בריאות חדשה.'
    : '<strong>1. חובות נוכחות ועמידה במטלות</strong><br>הסטודנט מתחייב לנוכחות של 85% לפחות משעות הקורס (תיאוריה, סדנה ושטח). אי-הגעה למפגשי סדנה או ימי שטח תיחשב כאי-עמידה בתנאי הקורס ועשויה להוביל לאי-זכאות לתעודה, ללא החזר כספי.<br>עמידה במבחן המעשי ובמבחן העיוני בסיום הקורס היא תנאי הכרחי לקבלת תעודת "מתקין מוסמך".<br><br><strong>2. מדיניות ביטולים והחזרים כספיים</strong><br>כל סטודנט חייב בדמי הרשמה וביטוח של 399 ש"ח.<br>ביטול עד 14 ימי עסקים לפני פתיחת הקורס — החזר מלא למעט דמי רישום.<br>ביטול פחות מ-7 ימי עסקים לפני פתיחת הקורס — דמי ביטול 25% מעלות הקורס.<br>לאחר המפגש השני — לא יינתן החזר כספי.<br><br><strong>3. בטיחות וציוד מגן</strong><br>חובה להגיע עם נעלי עבודה סגורות וציוד מגן אישי. המכללה רשאית להרחיק סטודנט שאינו עומד בהוראות הבטיחות.<br><br><strong>4. קניין רוחני וסודיות</strong><br>חל איסור על הקלטה, צילום או הפצה של תכני הקורס ללא אישור מראש ובכתב.<br><br><strong>5. אחריות מקצועית</strong><br>תעודת הגמר מעידה על סיום הכשרה ומעבר בחינה בלבד. המכללה אינה נושאת באחריות לפעולות עצמאיות של הסטודנט.<br><br><strong>6. זכות המכללה לשינויים וביטולים</strong><br>המכללה רשאית לדחות או לבטל קורס שלא הגיע למינימום נרשמים, לבצע שינויים בלוח הזמנים ובמרצים, ולהפסיק לימודי סטודנט בגין הפרת משמעת או אי-עמידה בדרישות.';
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

async function adminUploadIdPhoto(studentId, input) {
  const file = input.files[0];
  if (!file) return;
  if (!['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(file.type)) {
    alert('יש להעלות קובץ תמונה בלבד (JPG, PNG, HEIC)');
    input.value = ''; return;
  }
  if (file.size > 15 * 1024 * 1024) {
    alert('גודל הקובץ חייב להיות עד 15MB');
    input.value = ''; return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = async () => {
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      const data = cv.toDataURL('image/jpeg', 0.82);
      const { error } = await window._supabase.from('students').update({ id_photo_data: data }).eq('id', studentId);
      if (error) { alert('שגיאה בשמירת התמונה: ' + error.message); return; }
      // Refresh whichever view is showing this student
      const poolBody  = document.getElementById('bpdb-' + studentId);
      const ovFlyout  = document.getElementById('ov-flyout');
      const regDetails = document.getElementById('sdetails-' + studentId);
      if (poolBody) {
        delete poolBody.dataset.loaded; poolBody.innerHTML = ''; bTogglePoolRow(studentId, null);
      } else if (ovFlyout && ovFlyout.classList.contains('open')) {
        window.ovOpenFlyout(studentId);
      } else if (regDetails) {
        loadStudents().then(() => {
          const r = document.getElementById('sdetails-' + studentId);
          if (r) r.classList.add('open');
        });
      } else {
        bOpenStudentProfile(studentId);
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  input.value = '';
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
      <td><div class="b-s-cell" style="cursor:pointer;" onclick="bOpenStudentProfile('${st.id}')"><div class="b-s-avatar" style="background:${bAvatarColor(st.id)};">${bInitials(st.name)}</div><div><div class="b-s-name" style="color:#2563eb;text-decoration:underline;text-underline-offset:2px;">${st.name}</div><div class="b-s-phone">${st.phone}</div></div></div></td>
      <td><span class="b-pill ${st.paid?'b-pill-paid':'b-pill-pending'}">${st.paid?'<i class="ph ph-check"></i> שולמה':'<i class="ph ph-warning"></i> חסרה'}</span></td>
      <td><div class="b-attend-cell">${boxes}</div></td>
      <td style="font-weight:700;color:${pct>=85?'#16a34a':pct>=60?'#2563eb':'#dc2626'};">${pct}%</td>
      <td style="display:flex;gap:6px;align-items:center;">
        <button onclick="bToggleBalance('${b.id}','${st.id}')" style="background:none;border:none;cursor:pointer;font-size:0.75rem;color:#64748b;font-family:'Heebo',sans-serif;"><i class="ph ph-pencil"></i> עדכן</button>
        <button onclick="bRemoveStudent('${b.id}','${st.id}')" style="background:#fef2f2;border:none;border-radius:6px;padding:3px 9px;font-size:0.72rem;font-weight:700;cursor:pointer;color:#dc2626;font-family:'Heebo',sans-serif;display:flex;align-items:center;gap:3px;"><i class="ph ph-user-minus"></i> הסר</button>
      </td>
    </tr>`;
  }).join('');
  const hdrs = sessions.map(i=>`<th style="min-width:26px;text-align:center;">${i+1}</th>`).join('');
  document.getElementById('b-tab-students').innerHTML = `
    <div class="b-table-wrap"><table>
      <thead><tr><th>תלמיד</th><th>יתרה</th><th colspan="${b.sessions}">נוכחות — מפגשים ${hdrs}</th><th>%</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

// ── Student Profile (Client File) ──
async function bOpenStudentProfile(studentId) {
  const modal = document.getElementById('bm-student-profile');
  const body  = document.getElementById('bm-student-profile-body');
  body.innerHTML = '<div style="text-align:center;padding:2.5rem;color:#94a3b8;"><i class="ph ph-spinner" style="font-size:2rem;display:inline-block;animation:spin 0.8s linear infinite;"></i></div>';
  modal.classList.add('open');

  const { data: s, error } = await window._supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (error || !s) {
    body.innerHTML = `<div style="padding:2rem;color:#dc2626;text-align:center;"><i class="ph ph-warning"></i> שגיאה בטעינת הנתונים</div>`;
    return;
  }

  const B_TRACK = { pergola_al:'פרגולה אלומיניום', pergola_electric:'פרגולה חשמלית + ZIP', glass_systems:'זכוכית ואקורדיון', bioclimatic:'BIOCLIMATIC', weld_al:'ריתוך אלומיניום', weld_steel:'ריתוך קונסטרוקציה' };
  const B_L = { beer_sheva:'באר שבע', tel_aviv:'תל אביב' };
  const B_S = { morning:'בוקר (08:30–16:30)', evening:'ערב (16:00–20:30)' };
  const B_WIN = { may_jun:'מאי–יוני', jun_jul:'יוני–יולי', aug_sep:'אוגוסט–ספטמבר' };

  const sc = (v) => v === 'yes' ? '<span style="color:#16a34a;font-weight:700;"><i class="ph ph-check-circle"></i> כן</span>' : v === 'no' ? '<span style="color:#dc2626;font-weight:700;"><i class="ph ph-x-circle"></i> לא</span>' : '—';
  const yn = (v) => v ? '<span style="color:#16a34a;font-weight:700;"><i class="ph ph-check-circle"></i> חתום</span>' : '<span style="color:#dc2626;font-weight:700;"><i class="ph ph-x-circle"></i> לא חתום</span>';

  const regDate = s.created_at ? new Date(s.created_at).toLocaleDateString('he-IL', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';

  const initials = (s.full_name||'').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
  const avatarColor = bAvatarColor(s.id);

  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:1.25rem;">
      <div style="width:52px;height:52px;border-radius:50%;background:${avatarColor};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.15rem;color:#fff;flex-shrink:0;">${initials}</div>
      <div>
        <div style="font-size:1.1rem;font-weight:800;color:#0f172a;">${s.full_name||'—'}</div>
        <div style="font-size:0.82rem;color:#64748b;">${s.phone||''} ${s.email ? '· '+s.email : ''}</div>
        <div style="font-size:0.72rem;color:#94a3b8;margin-top:2px;"><i class="ph ph-calendar"></i> נרשם: ${regDate}</div>
      </div>
      <div style="margin-right:auto;text-align:left;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:5px 12px;font-size:0.75rem;font-weight:700;color:#16a34a;">
          <i class="ph ph-receipt"></i> ₪${s.payment_amount||399}
        </div>
        <div style="font-size:0.65rem;color:#94a3b8;margin-top:3px;text-align:center;">${s.payment_ref||'—'}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1rem;">
      <div style="background:#f8fafc;border-radius:10px;padding:10px 14px;">
        <div style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#7c3aed;margin-bottom:6px;">מסלול</div>
        <div style="font-size:0.88rem;font-weight:700;color:#0f172a;">${B_TRACK[s.course_track]||s.course_track||'—'}</div>
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:10px 14px;">
        <div style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#7c3aed;margin-bottom:6px;">מיקום ולוח זמנים</div>
        <div style="font-size:0.88rem;font-weight:700;color:#0f172a;">${B_L[s.location]||s.location||'—'} · ${B_S[s.schedule]||s.schedule||'—'}</div>
      </div>
    </div>

    <div style="background:#f8fafc;border-radius:10px;padding:10px 14px;margin-bottom:1rem;">
      <div style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#2563eb;margin-bottom:8px;">שאלות סינון</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.8rem;color:#334155;">
        <div><i class="ph ph-person-simple-run" style="color:#64748b;"></i> כושר פיזי: ${sc(s.screening_physical)}</div>
        <div><i class="ph ph-certificate" style="color:#64748b;"></i> רישיון: ${sc(s.screening_permit)}</div>
        <div><i class="ph ph-wrench" style="color:#64748b;"></i> כלי עבודה: ${sc(s.screening_tools)}</div>
        <div><i class="ph ph-user" style="color:#64748b;"></i> גיל 18+: ${sc(s.screening_age)}</div>
      </div>
    </div>

    <div style="background:#f8fafc;border-radius:10px;padding:10px 14px;margin-bottom:${(s.health_signature_data||s.regulations_signature_data)?'1rem':'0'};">
      <div style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#0891b2;margin-bottom:8px;">הצהרות חתומות</div>
      <div style="display:flex;gap:1.5rem;font-size:0.82rem;color:#334155;">
        <div><i class="ph ph-heart" style="color:#64748b;"></i> הצהרת בריאות: ${yn(s.health_declaration_signed)}</div>
        <div><i class="ph ph-scroll" style="color:#64748b;"></i> תקנון לימודים: ${yn(s.regulations_signed)}</div>
      </div>
    </div>

    ${(s.health_signature_data || s.regulations_signature_data) ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1rem;">
      ${s.health_signature_data ? `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center;"><div style="font-size:0.65rem;color:#94a3b8;margin-bottom:4px;">חתימה — הצהרת בריאות</div><img src="${s.health_signature_data}" style="max-height:60px;max-width:100%;"></div>` : ''}
      ${s.regulations_signature_data ? `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px;text-align:center;"><div style="font-size:0.65rem;color:#94a3b8;margin-bottom:4px;">חתימה — תקנון</div><img src="${s.regulations_signature_data}" style="max-height:60px;max-width:100%;"></div>` : ''}
    </div>` : ''}

    <div style="background:#f8fafc;border-radius:10px;padding:10px 14px;">
      <div style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#0f766e;margin-bottom:8px;"><i class="ph ph-identification-card"></i> תעודת זהות / דרכון</div>
      ${s.id_photo_data
        ? `<div style="position:relative;border-radius:8px;overflow:hidden;border:1.5px solid #e2e8f0;max-width:320px;margin-bottom:6px;">
             <img src="${s.id_photo_data}" style="width:100%;display:block;max-height:200px;object-fit:contain;background:#f1f5f9;">
           </div>`
        : `<div style="font-size:0.78rem;color:#94a3b8;margin-bottom:6px;">לא הועלתה תמונה</div>`}
      <input type="file" id="admin-id-input-${s.id}" accept="image/*" style="display:none" onchange="adminUploadIdPhoto('${s.id}',this)">
      <button onclick="document.getElementById('admin-id-input-${s.id}').click()" style="display:inline-flex;align-items:center;gap:5px;background:#fff;border:1.5px solid #cbd5e1;border-radius:7px;padding:5px 12px;font-size:0.75rem;font-weight:700;color:#334155;cursor:pointer;font-family:inherit;">
        <i class="ph ph-upload-simple"></i> ${s.id_photo_data ? 'החלף תעודה' : 'העלה תעודה'}
      </button>
    </div>
  `;
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
  if(b.track!==w.track) {
    const studentTrack=B_TRACK_LABELS[w.track]||w.track||'לא ידוע';
    const batchTrack=B_TRACK_LABELS[b.track]||b.track||'לא ידוע';
    const ok=confirm(`⚠️ שים לב: אי-התאמת קורס\n\nהסטודנט ${w.name} נרשם לקורס:\n"${studentTrack}"\n\nאך המחזור שנבחר הוא:\n"${batchTrack}"\n\nהאם להמשיך ולשבץ לקורס שונה מהרישום המקורי?`);
    if(!ok) return;
  }
  const newAttend = Array(b.sessions).fill(0);
  const { data: bsData, error: e1 } = await window._supabase.from('batch_students').insert({
    batch_id:   bSelectedBatch,
    student_id: w.id,
    paid:       false,
    attendance: newAttend,
  }).select().single();
  if(e1){alert('שגיאה בשיבוץ: '+e1.message);return;}
  // אם המחזור פתוח רשמית — הסטודנט מקבל גישה לחומרי לימוד מיד
  const newStatus = b.officiallyOpened ? 'enrolled' : 'assigned_pending_payment';
  await window._supabase.from('students')
    .update({ status: newStatus })
    .eq('id', w.id);
  // Log assignment
  if (typeof window.appendActivityLog === 'function') {
    window.appendActivityLog(w.id, {
      type: 'batch_assigned',
      label: `שובץ למחזור: "${b.name}" · סטטוס: ${newStatus === 'enrolled' ? 'בהכשרה' : 'משובץ – ממתין לתשלום'}`,
    });
  }
  b.students.push({id:w.id,_bsId:bsData?.id,name:w.name,phone:w.phone,paid:false,attend:newAttend});
  bPool=bPool.filter(x=>x.id!==bAssigningId);
  // עדכון מסך נרשמים חדשים אם פתוח
  if (typeof window.onStudentAssigned === 'function') window.onStudentAssigned(w.id);
  bCloseModal('bm-assign');
  bRenderDashboard();
  if(bCurrentBatchId===bSelectedBatch) bRenderDetail();
}

async function bOfficiallyOpenBatch(batchId) {
  const b = bBatches.find(x => x.id === batchId);
  if (!b) return;
  const ok = confirm(`פתיחת מחזור רשמית: "${b.name}"\n\nפעולה זו תפתח גישה לחומרי לימוד עצמי לכל ${b.students.length} הסטודנטים הרשומים.\n\nכל סטודנט שיצורף בעתיד יקבל גישה אוטומטית.\n\nלהמשיך?`);
  if (!ok) return;
  const sb = window._supabase;
  const { error: e1 } = await sb.from('batches').update({ officially_opened: true }).eq('id', batchId);
  if (e1) { alert('שגיאה: ' + e1.message); return; }
  const studentIds = b.students.map(s => s.id);
  if (studentIds.length > 0) {
    const { error: e2 } = await sb.from('students').update({ status: 'enrolled' }).in('id', studentIds);
    if (e2) { alert('שגיאה בעדכון סטודנטים: ' + e2.message); return; }
    // Log for each student
    if (typeof window.appendActivityLog === 'function') {
      studentIds.forEach(sid => window.appendActivityLog(sid, {
        type: 'batch_opened',
        label: `מחזור "${b.name}" נפתח רשמית — חומרי לימוד עצמי נפתחו`,
      }));
    }
  }
  b.officiallyOpened = true;
  bRenderGrid();
  bRenderStats();
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

// ── Instructor ──
async function bSaveInstructor(bId, value) {
  const b = bBatches.find(x => x.id === bId);
  if (b) b.instructor = value;
  await window._supabase.from('batches').update({ instructor: value }).eq('id', bId);
}

// ── Export CSV ──
async function bExportBatch(bId) {
  const b = bBatches.find(x => x.id === bId);
  if (!b || !b.students.length) { alert('אין תלמידים לייצוא'); return; }
  const ids = b.students.map(s => s.id);
  const { data: students } = await window._supabase
    .from('students')
    .select('full_name, phone, email, course_track, location, schedule, payment_ref, payment_amount, created_at')
    .in('id', ids);
  if (!students) return;
  const rows = [
    ['שם מלא','טלפון','אימייל','מסלול','מיקום','לוח זמנים','אסמכתא','דמי רישום','תאריך רישום'],
    ...students.map(s => [
      s.full_name||'', s.phone||'', s.email||'',
      B_TRACK_LABELS[s.course_track]||s.course_track||'',
      B_LOC[s.location]||s.location||'',
      B_SCH[s.schedule]||s.schedule||'',
      s.payment_ref||'',
      s.payment_amount ? `₪${s.payment_amount}` : '',
      s.created_at ? new Date(s.created_at).toLocaleDateString('he-IL') : '',
    ])
  ];
  const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${b.name}_נרשמים.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ── Remove Student from Batch ──
let bPendingRemoveBatchId   = null;
let bPendingRemoveStudentId = null;

function bRemoveStudent(bId, sId) {
  bPendingRemoveBatchId   = bId;
  bPendingRemoveStudentId = sId;
  const b  = bBatches.find(x => x.id === bId);
  const st = b?.students.find(x => x.id === sId);
  document.getElementById('b-remove-student-name').textContent = st ? `תלמיד: ${st.name}` : '';
  document.getElementById('b-remove-student-pass').value = '';
  document.getElementById('b-remove-student-err').style.display = 'none';
  document.getElementById('bm-remove-student').classList.add('open');
  setTimeout(() => document.getElementById('b-remove-student-pass').focus(), 100);
}

async function bConfirmRemoveStudent() {
  const val = document.getElementById('b-remove-student-pass').value;
  if (val !== B_DELETE_PASSWORD) {
    const errEl = document.getElementById('b-remove-student-err');
    errEl.textContent = 'סיסמה שגויה'; errEl.style.display = 'block'; return;
  }
  const b  = bBatches.find(x => x.id === bPendingRemoveBatchId);
  const st = b?.students.find(x => x.id === bPendingRemoveStudentId);
  if (!b || !st) return;
  const { error: e1 } = await window._supabase
    .from('batch_students').delete()
    .eq('batch_id', bPendingRemoveBatchId).eq('student_id', bPendingRemoveStudentId);
  if (e1) { alert('שגיאה בהסרה: ' + e1.message); return; }
  await window._supabase.from('students')
    .update({ status: 'awaiting_assignment' }).eq('id', bPendingRemoveStudentId);
  // Log removal
  if (typeof window.appendActivityLog === 'function') {
    window.appendActivityLog(bPendingRemoveStudentId, {
      type: 'batch_removed',
      label: `הוסר ממחזור: "${b.name}" — הועבר חזרה למאגר ממתינים לשיבוץ`,
    });
  }
  b.students = b.students.filter(x => x.id !== bPendingRemoveStudentId);
  bPool.push({ id: st.id, name: st.name, phone: st.phone,
    track: b.track, loc: b.loc, sch: b.sch, payRef: '' });
  bCloseModal('bm-remove-student');
  bRenderDashboard();
  if (bCurrentBatchId === bPendingRemoveBatchId) bRenderDetail();
}

// ── Edit Batch ──
let bEditingBatchId = null;

function bEditBatch(id) {
  bEditingBatchId = id;
  const b = bBatches.find(x => x.id === id);
  if (!b) return;
  document.getElementById('beb-name').value  = b.name  || '';
  document.getElementById('beb-track').value = b.track || '';
  document.getElementById('beb-loc').value   = b.loc   || 'beer_sheva';
  document.getElementById('beb-sch').value   = b.sch   || 'morning';
  document.getElementById('beb-date').value  = b.date  || '';
  document.getElementById('beb-cap').value   = b.cap   || 15;
  document.getElementById('beb-pass').value  = '';
  document.getElementById('beb-err').style.display = 'none';
  document.getElementById('bm-edit-batch').classList.add('open');
  setTimeout(() => document.getElementById('beb-name').focus(), 100);
}

async function bConfirmEditBatch() {
  const errEl = document.getElementById('beb-err');
  const pass  = document.getElementById('beb-pass').value;
  if (pass !== B_DELETE_PASSWORD) {
    errEl.textContent = 'סיסמה שגויה'; errEl.style.display = 'block'; return;
  }
  const name = document.getElementById('beb-name').value.trim();
  if (!name) { errEl.textContent = 'יש להזין שם מחזור'; errEl.style.display = 'block'; return; }
  const track    = document.getElementById('beb-track').value;
  const loc      = document.getElementById('beb-loc').value;
  const sch      = document.getElementById('beb-sch').value;
  const date     = document.getElementById('beb-date').value;
  const cap      = parseInt(document.getElementById('beb-cap').value) || 15;
  const sessions = sch === 'morning' ? 5 : 10;

  const { error } = await window._supabase.from('batches').update({
    name, track, location: loc, schedule: sch,
    open_date: date || null, capacity: cap, sessions,
  }).eq('id', bEditingBatchId);
  if (error) { errEl.textContent = 'שגיאה בשמירה: ' + error.message; errEl.style.display = 'block'; return; }

  const b = bBatches.find(x => x.id === bEditingBatchId);
  if (b) { b.name = name; b.track = track; b.loc = loc; b.sch = sch; b.date = date; b.cap = cap; b.sessions = sessions; }
  bCloseModal('bm-edit-batch');
  bRenderDashboard();
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
  const batch = bBatches.find(x => x.id === bPendingDeleteId);
  const studentIds = (batch?.students || []).map(s => s.id);

  // Return all students to awaiting_assignment
  if (studentIds.length > 0) {
    await window._supabase.from('students')
      .update({ status: 'awaiting_assignment' })
      .in('id', studentIds);
    await window._supabase.from('batch_students')
      .delete()
      .eq('batch_id', bPendingDeleteId);
  }

  const { error } = await window._supabase.from('batches').delete().eq('id', bPendingDeleteId);
  if (error) { alert('שגיאה במחיקה: ' + error.message); return; }

  // Add released students back to local pool
  if (batch) {
    (batch.students || []).forEach(s => {
      bPool.push({ id: s.id, name: s.name, phone: s.phone,
        track: batch.track, loc: batch.loc, sch: batch.sch, payRef: '' });
    });
  }

  bBatches = bBatches.filter(x => x.id !== bPendingDeleteId);
  bCloseModal('bm-delete');
  bRenderDashboard();
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE MODULE — ניהול תהליך חבר (ימי ראיון ומבחן)
// ═══════════════════════════════════════════════════════════════

let pDays        = [];   // pipeline_days rows
let pAssignments = [];   // pipeline_day_assignments with profiles join
let pApplicants  = [];   // profiles with member_requested_at
let pAssigningId   = null;
let pAssigningType = null;
let pSelectedDayId = null;
let pOpenDetailId  = null;

const P_STATUS_LABELS = {
  new_application:    'בקשה חדשה',
  interview_scheduled:'ממתין לראיון',
  interview_passed:   'עבר ראיון',
  interview_failed:   'נכשל בראיון',
  exam_scheduled:     'ממתין למבחן',
  exam_passed:        'עבר מבחן',
  approved:           'מאושר',
  rejected:           'נדחה'
};

// ── helpers ──
function pAvatarColor(id) {
  const colors = ['#7c3aed','#2563eb','#16a34a','#d97706','#dc2626','#0891b2'];
  var n = 0; for (var i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return colors[n % colors.length];
}
function pInitials(name) {
  if (!name) return '?';
  var parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
function pCloseModal(id, event) {
  if (event && event.target !== document.getElementById(id)) return;
  document.getElementById(id).classList.remove('open');
}

// ── data load ──
async function pInit() {
  const sb = window._supabase;
  if (!sb) { console.warn('pInit: supabase not ready'); return; }
  const [daysRes, assignRes, profRes] = await Promise.all([
    sb.from('pipeline_days').select('*').order('date'),
    sb.from('pipeline_day_assignments').select('*, profiles(id, full_name, phone, pipeline_status)'),
    sb.from('profiles')
      .select('id, full_name, phone, email, member_requested_at, pipeline_status, member_notes')
      .not('member_requested_at', 'is', null)
      .order('member_requested_at', { ascending: false })
  ]);
  if (daysRes.error) console.error('pInit days error', daysRes.error);
  if (assignRes.error) console.error('pInit assign error', assignRes.error);
  if (profRes.error) console.error('pInit profiles error', profRes.error);
  pDays        = daysRes.data   || [];
  pAssignments = assignRes.data || [];
  pApplicants  = (profRes.data  || []).map(function(r) {
    return Object.assign({}, r, { admin_notes: r.member_notes || [] });
  });
  pRender();
}

// ── render ──
function pRender() {
  pRenderStats();
  pRenderDayGrid('interview');
  pRenderDayGrid('exam');
  pRenderPool('interview');
  pRenderPool('exam');
}

// ── stats ──
function pRenderStats() {
  const newCount      = pApplicants.filter(function(a) { return a.pipeline_status === 'new_application'; }).length;
  const interviewCount= pApplicants.filter(function(a) { return a.pipeline_status === 'interview_scheduled'; }).length;
  const examCount     = pApplicants.filter(function(a) { return a.pipeline_status === 'exam_scheduled'; }).length;
  const approvedCount = pApplicants.filter(function(a) { return a.pipeline_status === 'approved'; }).length;
  const row = document.getElementById('p-stats-row');
  if (!row) return;
  row.innerHTML =
    '<div class="p-stat-card"><div class="p-stat-icon new"><i class="ph ph-user-plus"></i></div><div><div class="p-stat-val">' + newCount + '</div><div class="p-stat-lbl">בקשות חדשות</div></div></div>' +
    '<div class="p-stat-card"><div class="p-stat-icon process"><i class="ph ph-microphone"></i></div><div><div class="p-stat-val">' + interviewCount + '</div><div class="p-stat-lbl">בשלב ראיון</div></div></div>' +
    '<div class="p-stat-card"><div class="p-stat-icon exam"><i class="ph ph-clipboard-text"></i></div><div><div class="p-stat-val">' + examCount + '</div><div class="p-stat-lbl">בשלב מבחן</div></div></div>' +
    '<div class="p-stat-card"><div class="p-stat-icon approved"><i class="ph ph-check-circle"></i></div><div><div class="p-stat-val">' + approvedCount + '</div><div class="p-stat-lbl">מאושרים</div></div></div>';
}

// ── day grid ──
function pDayAssignedCount(dayId) {
  return pAssignments.filter(function(x) { return x.day_id === dayId; }).length;
}

function pProgColor(pct) {
  if (pct >= 90) return '#dc2626';
  if (pct >= 60) return '#d97706';
  return '#16a34a';
}

function pRenderDayGrid(type) {
  var gridId = type === 'interview' ? 'p-interview-grid' : 'p-exam-grid';
  var grid = document.getElementById(gridId);
  if (!grid) return;
  var days = pDays.filter(function(d) { return d.type === type; });
  var typeLabel = type === 'interview' ? 'ראיון' : 'מבחן מעשי';
  var badgeClass = type === 'interview' ? 'interview' : 'exam';
  var html = days.map(function(d) {
    var assigned = pDayAssignedCount(d.id);
    var pct = d.capacity > 0 ? Math.round(assigned / d.capacity * 100) : 0;
    var dateStr = d.date ? new Date(d.date).toLocaleDateString('he-IL') : '—';
    var timeStr = d.time ? d.time.slice(0,5) : '';
    var spots = d.capacity - assigned;
    return '<div class="p-day-card">' +
      '<div class="b-card-header">' +
        '<div><div class="b-card-name">' + dateStr + (timeStr ? '  ' + timeStr : '') + '</div>' +
          '<div class="b-card-sub">' + (d.location || '') + (d.notes ? ' · ' + d.notes : '') + '</div>' +
        '</div>' +
        '<span class="p-day-type-badge ' + badgeClass + '">' + typeLabel + '</span>' +
      '</div>' +
      '<div class="b-prog-row"><span class="b-prog-lbl">משובצים</span><span class="b-prog-val">' + assigned + '/' + d.capacity + ' · ' + (spots > 0 ? spots + ' פנויים' : 'מלא') + '</span></div>' +
      '<div class="b-prog-bar"><div class="b-prog-fill" style="width:' + pct + '%;background:' + pProgColor(pct) + ';"></div></div>' +
      '<div class="b-card-footer" onclick="event.stopPropagation()">' +
        '<button class="b-btn b-btn-primary" onclick="pOpenDayDetail(\'' + d.id + '\')"><i class="ph ph-users"></i> ניהול</button>' +
        '<button class="b-btn b-btn-ghost" onclick="pDeleteDay(\'' + d.id + '\',\'' + type + '\')" style="flex:0;padding:0.45rem 0.6rem;color:#dc2626;" title="מחק יום"><i class="ph ph-trash"></i></button>' +
      '</div>' +
      '</div>';
  }).join('');
  // "new day" card
  html += '<div class="b-card-new" onclick="pOpenNewDay(\'' + type + '\')">' +
    '<i class="ph ph-plus-circle"></i><span>יום ' + typeLabel + ' חדש</span>' +
    '</div>';
  grid.innerHTML = html;
}

// ── pool panels ──
function pTogglePool(type) {
  var bodyId = type === 'interview' ? 'p-interview-pool-body' : 'p-exam-pool-body';
  var body = document.getElementById(bodyId);
  if (body) body.style.display = body.style.display === 'none' ? 'block' : 'none';
}

function pRenderPool(type) {
  var countId = type === 'interview' ? 'p-interview-pool-count' : 'p-exam-pool-count';
  var bodyId  = type === 'interview' ? 'p-interview-pool-body'  : 'p-exam-pool-body';
  var statusNeeded = type === 'interview' ? 'new_application' : 'interview_passed';
  var pool = pApplicants.filter(function(a) { return a.pipeline_status === statusNeeded; });
  var countEl = document.getElementById(countId);
  if (countEl) countEl.textContent = pool.length;
  var body = document.getElementById(bodyId);
  if (!body) return;
  if (pool.length === 0) {
    body.innerHTML = '<div class="p-open-empty"><i class="ph ph-check-circle"></i> ' + (type === 'interview' ? 'כל המועמדים שובצו לראיון' : 'כל המועמדים שובצו למבחן') + '</div>';
    return;
  }
  var rows = pool.map(function(a) {
    return '<tr>' +
      '<td><div style="display:flex;align-items:center;gap:8px;">' +
        '<div class="p-pool-avatar" style="background:' + pAvatarColor(a.id) + ';">' + pInitials(a.full_name) + '</div>' +
        '<div style="font-size:0.83rem;font-weight:700;">' + (a.full_name||'—') + '</div>' +
      '</div></td>' +
      '<td style="font-size:0.78rem;color:#64748b;">' + (a.phone||'—') + '</td>' +
      '<td><button class="b-pool-btn" onclick="pOpenAssign(\'' + a.id + '\',\'' + type + '\')"><i class="ph ph-arrow-square-left"></i> שבץ</button></td>' +
    '</tr>';
  }).join('');
  body.innerHTML = '<table class="p-pool-table"><thead><tr><th>מועמד</th><th>טלפון</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
}

// ── new day modal ──
function pOpenNewDay(type) {
  document.getElementById('pm-day-type').value = type;
  document.getElementById('pm-new-day-title').innerHTML = '<i class="ph ph-calendar-plus" style="color:#7c3aed;"></i> יום ' + (type === 'interview' ? 'ראיון' : 'מבחן מעשי') + ' חדש';
  document.getElementById('pm-day-date').value = '';
  document.getElementById('pm-day-time').value = '';
  document.getElementById('pm-day-location').value = '';
  document.getElementById('pm-day-capacity').value = '10';
  document.getElementById('pm-day-notes').value = '';
  document.getElementById('pm-new-day').classList.add('open');
}

async function pCreateDay() {
  var type     = document.getElementById('pm-day-type').value;
  var date     = document.getElementById('pm-day-date').value;
  var time     = document.getElementById('pm-day-time').value || null;
  var location = document.getElementById('pm-day-location').value.trim() || null;
  var capacity = parseInt(document.getElementById('pm-day-capacity').value) || 10;
  var notes    = document.getElementById('pm-day-notes').value.trim() || null;
  if (!date) { alert('יש לבחור תאריך'); return; }
  var sb = window._supabase;
  var res = await sb.from('pipeline_days').insert({ type: type, date: date, time: time, location: location, capacity: capacity, notes: notes }).select().single();
  if (res.error) { alert('שגיאה: ' + res.error.message); return; }
  pDays.push(res.data);
  document.getElementById('pm-new-day').classList.remove('open');
  pRenderDayGrid(type);
}

// ── assign modal ──
function pOpenAssign(profileId, type) {
  pAssigningId   = profileId;
  pAssigningType = type;
  pSelectedDayId = null;
  var a = pApplicants.find(function(x) { return x.id === profileId; });
  document.getElementById('pm-assign-title').textContent = 'שיבוץ: ' + (a ? a.full_name : '');
  var days = pDays.filter(function(d) { return d.type === type && pDayAssignedCount(d.id) < d.capacity; });
  if (days.length === 0) {
    document.getElementById('pm-assign-list').innerHTML = '<div style="text-align:center;color:#94a3b8;padding:1.5rem;font-size:0.85rem;">אין ימים פנויים — צרו יום חדש תחילה</div>';
  } else {
    document.getElementById('pm-assign-list').innerHTML = days.map(function(d) {
      var assigned = pDayAssignedCount(d.id);
      var dateStr = new Date(d.date).toLocaleDateString('he-IL');
      var timeStr = d.time ? '  ' + d.time.slice(0,5) : '';
      return '<div class="p-assign-item" id="pai-' + d.id + '" onclick="pSelectDay(\'' + d.id + '\')">' +
        '<div style="flex:1;"><div class="p-assign-name">' + dateStr + timeStr + '</div>' +
        '<div class="p-assign-meta">' + (d.location||'') + (d.notes ? ' · ' + d.notes : '') + '</div></div>' +
        '<div class="p-assign-spots" style="color:#16a34a;">' + (d.capacity - assigned) + ' מקומות</div>' +
        '</div>';
    }).join('');
  }
  document.getElementById('pm-assign').classList.add('open');
}

function pSelectDay(id) {
  pSelectedDayId = id;
  document.querySelectorAll('.p-assign-item').forEach(function(el) { el.classList.remove('sel'); });
  var el = document.getElementById('pai-' + id);
  if (el) el.classList.add('sel');
}

async function pConfirmAssign() {
  if (!pSelectedDayId) { alert('יש לבחור יום'); return; }
  var newStatus = pAssigningType === 'interview' ? 'interview_scheduled' : 'exam_scheduled';
  var sb = window._supabase;
  var res = await sb.from('pipeline_day_assignments')
    .insert({ day_id: pSelectedDayId, profile_id: pAssigningId, result: null })
    .select().single();
  if (res.error) { alert('שגיאה בשיבוץ: ' + res.error.message); return; }
  await sb.from('profiles').update({ pipeline_status: newStatus }).eq('id', pAssigningId);
  var applicant = pApplicants.find(function(a) { return a.id === pAssigningId; });
  if (applicant) applicant.pipeline_status = newStatus;
  pAssignments.push(Object.assign({}, res.data, { profiles: { id: pAssigningId, full_name: applicant && applicant.full_name, phone: applicant && applicant.phone } }));
  document.getElementById('pm-assign').classList.remove('open');
  pRender();
}

// ── day detail modal ──
function pOpenDayDetail(dayId) {
  pOpenDetailId = dayId;
  var day = pDays.find(function(d) { return d.id === dayId; });
  if (!day) return;
  var dateStr = new Date(day.date).toLocaleDateString('he-IL');
  var typeLabel = day.type === 'interview' ? 'ראיון' : 'מבחן מעשי';
  document.getElementById('pm-detail-title').textContent = typeLabel + ' — ' + dateStr + (day.time ? '  ' + day.time.slice(0,5) : '') + (day.location ? ' · ' + day.location : '');
  var assigned = pAssignments.filter(function(x) { return x.day_id === dayId; });
  var html = '';
  if (assigned.length === 0) {
    html = '<div style="text-align:center;color:#94a3b8;padding:1.5rem;font-size:0.85rem;">אין משובצים עדיין</div>';
  } else {
    html = assigned.map(function(x) {
      var prof = x.profiles || {};
      var result = x.result || 'pending';
      var resultLabel = result === 'passed' ? 'עבר' : result === 'failed' ? 'נכשל' : 'ממתין';
      var passBtn = result !== 'passed' ? '<button class="p-card-btn green" style="flex:none;padding:0.3rem 0.65rem;font-size:0.73rem;" onclick="pMarkResult(\'' + x.id + '\',\'' + (prof.id||'') + '\',\'passed\',\'' + day.type + '\')"><i class="ph ph-check"></i> עבר</button>' : '';
      var failBtn = result !== 'failed' ? '<button class="p-card-btn red" style="flex:none;padding:0.3rem 0.65rem;font-size:0.73rem;" onclick="pMarkResult(\'' + x.id + '\',\'' + (prof.id||'') + '\',\'failed\',\'' + day.type + '\')"><i class="ph ph-x"></i> נכשל</button>' : '';
      return '<div class="p-detail-row">' +
        '<div style="display:flex;align-items:center;gap:8px;flex:1;">' +
          '<div class="p-pool-avatar" style="background:' + pAvatarColor(prof.id||'') + ';">' + pInitials(prof.full_name||'') + '</div>' +
          '<div><div style="font-size:0.85rem;font-weight:700;">' + (prof.full_name||'—') + '</div>' +
          '<div style="font-size:0.75rem;color:#64748b;">' + (prof.phone||'') + '</div></div>' +
        '</div>' +
        '<span class="p-day-result ' + result + '">' + resultLabel + '</span>' +
        '<div style="display:flex;gap:5px;margin-right:0.5rem;">' + passBtn + failBtn + '</div>' +
        '</div>';
    }).join('');
  }
  document.getElementById('pm-detail-body').innerHTML = html;
  document.getElementById('pm-day-detail').classList.add('open');
}

async function pMarkResult(assignmentId, profileId, result, dayType) {
  var newStatus = result === 'passed'
    ? (dayType === 'interview' ? 'interview_passed' : 'exam_passed')
    : (dayType === 'interview' ? 'interview_failed' : 'rejected');
  var sb = window._supabase;
  await sb.from('pipeline_day_assignments').update({ result: result }).eq('id', assignmentId);
  await sb.from('profiles').update({ pipeline_status: newStatus }).eq('id', profileId);
  var a = pAssignments.find(function(x) { return x.id === assignmentId; });
  if (a) a.result = result;
  var p = pApplicants.find(function(x) { return x.id === profileId; });
  if (p) p.pipeline_status = newStatus;
  pRender();
  if (pOpenDetailId) pOpenDayDetail(pOpenDetailId);
}

async function pDeleteDay(dayId, type) {
  if (!confirm('למחוק יום זה? המשובצים יחזרו למאגר.')) return;
  var sb = window._supabase;
  // revert assigned applicants' status
  var prevStatus = type === 'interview' ? 'new_application' : 'interview_passed';
  var toRevert = pAssignments.filter(function(x) { return x.day_id === dayId && !x.result; });
  for (var i = 0; i < toRevert.length; i++) {
    var profId = toRevert[i].profile_id || (toRevert[i].profiles && toRevert[i].profiles.id);
    if (profId) {
      await sb.from('profiles').update({ pipeline_status: prevStatus }).eq('id', profId);
      var p = pApplicants.find(function(x) { return x.id === profId; });
      if (p) p.pipeline_status = prevStatus;
    }
  }
  var res = await sb.from('pipeline_days').delete().eq('id', dayId);
  if (res.error) { alert('שגיאה: ' + res.error.message); return; }
  pDays = pDays.filter(function(d) { return d.id !== dayId; });
  pAssignments = pAssignments.filter(function(x) { return x.day_id !== dayId; });
  pRender();
}