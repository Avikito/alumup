// import stripped

const supabase = {};
window._supabase = supabase;

async function requireCollegeAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return null; }
  const { data: adminRow } = await supabase
    .from('admin_users').select('user_id, role').eq('user_id', user.id).maybeSingle();
  if (!adminRow) { window.location.href = 'login.html'; return null; }
  if (adminRow.role !== 'college') { window.location.href = 'login.html'; return null; }
  return user;
}

const STATUS_TRACK_OPTIONS = [
  { key: 'experienced_pending_cert', label: 'בעל נסיון — ממתין להסמכה' },
  { key: 'in_professional_training', label: 'בתהליך הכשרה מקצועית' },
  { key: 'completing_docs',          label: 'השלמת מסמכים' },
];
const STATUS_TRACK_KEYS = STATUS_TRACK_OPTIONS.map(o => o.key);

const STATUS_LABELS = {
  new_application:          'בקשה חדשה',
  under_review:             'בתהליך בדיקה',
  experienced_pending_cert: 'בעל נסיון — ממתין להסמכה',
  in_professional_training: 'בתהליך הכשרה מקצועית',
  completing_docs:          'השלמת מסמכים',
  approved:                 'מאושר כחבר',
  rejected:                 'נדחה',
};
const STATUS_CLASS = {
  new_application:          'sb-new',
  under_review:             'sb-review',
  experienced_pending_cert: 'sb-experienced',
  in_professional_training: 'sb-training',
  completing_docs:          'sb-docs',
  approved:                 'sb-approved',
  rejected:                 'sb-rejected',
};

const REGION_LABELS = {
  north: 'צפון', haifa: 'חיפה והסביבה', sharon: 'שרון',
  center: 'מרכז', jerusalem: 'ירושלים', south: 'דרום', eilat: 'אילת והערבה'
};
const SPEC_LABELS = {
  pergolas:'פרגולות', 'electric-pergolas':'פרגולות חשמליות', electric_pergolas:'פרגולות חשמליות',
  fixed_pergolas:'פרגולות קבועות', 'zip-screens':'מסכי זיפ', 'windows-shutters':'חלונות ותריסים',
  windows:'חלונות וויטרינות', 'gates-fences':'שערים וגדרות', gates_fences:'גדרות ושערים',
  'curtain-walls':'קירות מסך', curtain_walls:'קירות מסך',
  'doors-cladding':'דלתות וחיפויים', doors_cladding:'דלתות וחיפויים',
  bioclimatic:'ביקולימטיק וגליוטינה', 'service-repairs':'שירות ותיקונים',
};

let allUsers = [];
let currentTab = 'all';
let currentUserEmail = '';

function formatDate(iso) {
  return new Date(iso).toLocaleString('he-IL', {
    day:'2-digit', month:'2-digit', year:'2-digit',
    hour:'2-digit', minute:'2-digit'
  });
}

async function logActivity(userId, action, oldStatus, newStatus, label) {
  const { data: profile } = await supabase
    .from('profiles').select('member_activity_log').eq('id', userId).single();
  const log = [...(profile?.member_activity_log || []), {
    action, old_status: oldStatus, new_status: newStatus,
    by_email: currentUserEmail, by_role: 'college',
    at: new Date().toISOString(), label
  }];
  await supabase.from('profiles').update({ member_activity_log: log }).eq('id', userId);
  const u = allUsers.find(x => x.id === userId);
  if (u) u.member_activity_log = log;
}

async function init() {
  const user = await requireCollegeAdmin();
  if (!user) return;
  currentUserEmail = user.email || 'college';
  await loadUsers();
}

async function loadUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, business_name, phone, email, specialties, regions, member_requested_at, application_data, member_status, member_notes, member_activity_log')
    .not('member_requested_at', 'is', null)
    .in('member_status', ['new_application','under_review','experienced_pending_cert','in_professional_training','completing_docs'])
    .order('member_requested_at', { ascending: false });

  if (error) {
    console.error('[COLLEGE] Supabase error:', error.message);
    document.getElementById('usersBody').innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#dc2626;">שגיאה בטעינה: ${error.message}</td></tr>`;
    return;
  }

  allUsers = data || [];
  renderTable(getFiltered());
}

function getFiltered() {
  if (currentTab === 'all') return allUsers;
  return allUsers.filter(u => (u.member_status || '') === currentTab);
}

function toArr(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : [p]; } catch { return [v]; }
}

function renderTable(users) {
  document.getElementById('countLabel').textContent = `${users.length} מועמדים`;

  const tbody = document.getElementById('usersBody');
  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="all-clear">
        <i class="ph ph-graduation-cap"></i>
        <p>אין מועמדים בסטטוס זה</p>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    try {
      const date     = u.member_requested_at ? new Date(u.member_requested_at).toLocaleDateString('he-IL') : '—';
      const specArr  = toArr(u.specialties);
      const regionArr= toArr(u.regions);
      const specs    = specArr.map(s  => `<span class="spec-tag">${SPEC_LABELS[s]   || s}</span>`).join('');
      const regions  = regionArr.map(r => `<span class="spec-tag">${REGION_LABELS[r] || r}</span>`).join('');

      const app = u.application_data || {};
      const appSpecs    = toArr(app.specialties).map(s => SPEC_LABELS[s] || s).join(', ') || '—';
      const expYears    = app.experience_years != null ? app.experience_years + ' שנים' : '—';
      const priorExp    = app.has_prior_experience === 'yes' ? 'כן — מנוסה' : app.has_prior_experience === 'no' ? 'לא — מתחיל' : '—';
      const heightCert  = app.height_cert === 'yes' ? '✓ כן' : app.height_cert === 'no' ? '✗ לא' : '—';
      const prevTraining= app.prev_training || '—';
      const socialLink  = app.social_link ? `<a href="${app.social_link}" target="_blank" style="color:#6d28d9;text-decoration:underline;font-size:0.76rem;">פתח קישור</a>` : '—';
      const tosDate     = app.tos_accepted_at ? new Date(app.tos_accepted_at).toLocaleDateString('he-IL') : '—';

      const st      = u.member_status || 'under_review';
      const stClass = STATUS_CLASS[st] || 'sb-review';
      const stLabel = STATUS_LABELS[st] || st;

      let actionBtns = '';
      if (st === 'new_application') {
        actionBtns = `<button class="btn-advance" id="advance-${u.id}" onclick="handleAdvance('${u.id}')">
          <i class="ph ph-arrow-left"></i> בתהליך בדיקה
        </button>`;
      } else if (st === 'under_review') {
        actionBtns = STATUS_TRACK_OPTIONS.map(opt =>
          `<button class="btn-track" onclick="setTrack('${u.id}','${opt.key}')">${opt.label}</button>`
        ).join('');
      } else if (STATUS_TRACK_KEYS.includes(st)) {
        actionBtns = `
          <button class="btn-approve" onclick="handleApprove('${u.id}')">
            <i class="ph ph-check"></i> אשר כחבר
          </button>
          <button class="btn-reject" onclick="handleReject('${u.id}')">
            <i class="ph ph-x"></i> דחה
          </button>`;
      }

      return `<tr id="row-${u.id}" data-name="${(u.business_name||'').toLowerCase()} ${(u.full_name||'').toLowerCase()}">
        <td class="date-cell">${date}</td>
        <td>
          <div class="biz-name">${u.business_name || '—'}</div>
          <div style="font-size:0.78rem;color:var(--silver-dark)">${u.full_name || ''}</div>
        </td>
        <td class="phone-cell">${u.phone || '—'}</td>
        <td style="font-size:0.82rem;color:var(--silver-dark);">${u.email || '—'}</td>
        <td>
          <span class="status-badge ${stClass}">${stLabel}</span>
          <div style="margin-top:0.3rem;">${specs}${regions ? (specs ? '<br>' : '') + regions : ''}</div>
        </td>
        <td>
          <div class="actions-cell" style="flex-wrap:wrap;gap:0.3rem;">
            <button class="btn-details" onclick="toggleDetails('${u.id}')">
              <i class="ph ph-list-bullets"></i> פרטים
            </button>
            ${actionBtns}
          </div>
        </td>
      </tr>
      <tr id="details-${u.id}" class="details-row">
        <td colspan="6">
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">תחומי התמחות</div>
              <div class="detail-value">${appSpecs}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">ניסיון קודם</div>
              <div class="detail-value">${priorExp}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">שנות ניסיון</div>
              <div class="detail-value">${expYears}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">אישור עבודה בגובה</div>
              <div class="detail-value">${heightCert}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">קישור חברתי</div>
              <div class="detail-value">${socialLink}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">הכשרות קודמות</div>
              <div class="detail-value">${prevTraining}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">אישור תקנון</div>
              <div class="detail-value">${tosDate}</div>
            </div>
          </div>

          <div class="notes-area">
            <div class="notes-title"><i class="ph ph-note-pencil"></i> הערות</div>
            <div class="notes-list" id="notes-list-${u.id}">
              ${(u.member_notes||[]).length === 0
                ? `<div style="font-size:0.78rem;color:var(--silver-dark);padding:0.3rem 0;">אין הערות עדיין</div>`
                : (u.member_notes||[]).map(n => `
                  <div class="note-item">
                    <span class="note-date">${new Date(n.created_at).toLocaleDateString('he-IL')}</span>
                    ${n.text}
                  </div>`).join('')
              }
            </div>
            <div class="note-input-row">
              <input type="text" class="note-input" id="note-input-${u.id}" placeholder="הוסף הערה…" onkeydown="if(event.key==='Enter')saveNote('${u.id}')">
              <button class="note-save-btn" onclick="saveNote('${u.id}')"><i class="ph ph-paper-plane-right"></i></button>
            </div>
          </div>

          <div class="log-section">
            <div class="notes-title"><i class="ph ph-clock-countdown"></i> יומן פעולות</div>
            <div class="log-entries">
              ${(u.member_activity_log||[]).length === 0
                ? '<div class="log-empty">אין פעולות מתועדות עדיין</div>'
                : [...(u.member_activity_log||[])].reverse().map(e => `
                  <div class="log-entry">
                    <span class="log-label">${e.label || e.action}</span>
                    <span class="log-meta">${e.by_email || ''} · ${formatDate(e.at)}</span>
                  </div>`).join('')
              }
            </div>
          </div>
        </td>
      </tr>`;
    } catch (rowErr) {
      console.error('[COLLEGE] row error for id:', u?.id, rowErr);
      return `<tr><td colspan="6" style="color:#dc2626;padding:0.5rem 1rem;">שגיאה בשורה</td></tr>`;
    }
  }).join('');
}

window.toggleDetails = function(id) {
  const row = document.getElementById('details-' + id);
  if (row) row.classList.toggle('open');
};

window.handleAdvance = async function(id) {
  const u = allUsers.find(x => x.id === id);
  const oldStatus = u?.member_status || 'new_application';
  const btn = document.getElementById(`advance-${id}`);
  if (btn) btn.disabled = true;
  const { error } = await supabase.from('profiles')
    .update({ member_status: 'under_review' }).eq('id', id);
  if (error) { if (btn) btn.disabled = false; alert('שגיאה בעדכון שלב'); return; }
  await logActivity(id, 'status_changed', oldStatus, 'under_review', 'קידום שלב: בקשה חדשה → בתהליך בדיקה');
  if (u) u.member_status = 'under_review';
  renderTable(getFiltered());
};

window.setTrack = async function(id, trackStatus) {
  const u = allUsers.find(x => x.id === id);
  const oldStatus = u?.member_status || '';
  const trackLabel = STATUS_LABELS[trackStatus] || trackStatus;
  const { error } = await supabase.from('profiles')
    .update({ member_status: trackStatus }).eq('id', id);
  if (error) { alert('שגיאה בעדכון מסלול'); return; }
  await logActivity(id, 'track_assigned', oldStatus, trackStatus, `הוקצה מסלול: ${trackLabel}`);
  if (u) u.member_status = trackStatus;
  renderTable(getFiltered());
};

window.handleApprove = async function(id) {
  if (!confirm('לאשר את המועמד כחבר אלום?')) return;
  const u = allUsers.find(x => x.id === id);
  const oldStatus = u?.member_status || '';
  const { error } = await supabase.from('profiles')
    .update({ member_status: 'approved', user_tier: 'member', member_approved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) { alert('שגיאה באישור'); return; }
  await logActivity(id, 'approved', oldStatus, 'approved', '✅ אושר כחבר אלום');
  allUsers = allUsers.filter(x => x.id !== id);
  renderTable(getFiltered());
};

window.handleReject = async function(id) {
  if (!confirm('לדחות את המועמד?')) return;
  const u = allUsers.find(x => x.id === id);
  const oldStatus = u?.member_status || '';
  const { error } = await supabase.from('profiles')
    .update({ member_status: 'rejected' }).eq('id', id);
  if (error) { alert('שגיאה בדחייה'); return; }
  await logActivity(id, 'rejected', oldStatus, 'rejected', '❌ בקשה נדחתה');
  allUsers = allUsers.filter(x => x.id !== id);
  renderTable(getFiltered());
};

window.saveNote = async function(id) {
  const input = document.getElementById(`note-input-${id}`);
  const text  = (input?.value || '').trim();
  if (!text) return;

  const u     = allUsers.find(x => x.id === id);
  const notes = [...(u?.member_notes || []), { text, created_at: new Date().toISOString() }];

  const { error } = await supabase.from('profiles')
    .update({ member_notes: notes })
    .eq('id', id);

  if (error) { alert('שגיאה בשמירת הערה'); return; }
  await logActivity(id, 'note_added', null, null, '📝 נוספה הערה');
  if (u) u.member_notes = notes;
  input.value = '';

  const list = document.getElementById(`notes-list-${id}`);
  if (list) {
    list.innerHTML = notes.map(n => `
      <div class="note-item">
        <span class="note-date">${new Date(n.created_at).toLocaleDateString('he-IL')}</span>
        ${n.text}
      </div>`).join('');
  }
};

window.setTab = function(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab)?.classList.add('active');
  renderTable(getFiltered());
};

window.filterRows = function() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
  if (!q) { renderTable(getFiltered()); return; }
  const base = getFiltered();
  const filtered = base.filter(u =>
    (u.business_name || '').toLowerCase().includes(q) ||
    (u.full_name || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q)
  );
  renderTable(filtered);
};

// ═══════════════════════════════════════════════
// VIEW SWITCHING
// ═══════════════════════════════════════════════
window.switchView = function(view) {
  document.getElementById('view-members').style.display       = view === 'members'       ? '' : 'none';
  document.getElementById('view-registrations').style.display = view === 'registrations' ? '' : 'none';
  document.getElementById('view-batches').style.display       = view === 'batches'       ? '' : 'none';
  document.getElementById('nav-members').classList.toggle('active',       view === 'members');
  document.getElementById('nav-registrations').classList.toggle('active', view === 'registrations');
  document.getElementById('nav-batches').classList.toggle('active',       view === 'batches');
  if (view === 'registrations' && allStudents.length === 0) loadStudents();
  if (view === 'batches') bInit().catch(console.error);
};

// ═══════════════════════════════════════════════
// COURSE REGISTRATIONS — DATA & LABELS
// ═══════════════════════════════════════════════
const COURSE_LABELS = {
  pergola_al:       'פרגולה אלומיניום',
  pergola_electric: 'פרגולה חשמלית ומסכי ZIP',
  glass_systems:    'זכוכית, ויטרינה ואקורדיון',
  bioclimatic:      'מערכות BIOCLIMATIC',
  weld_al:          'ריתוך אלומיניום',
  weld_steel:       'ריתוך קונסטרוקציה',
};
const LOC_LABELS  = { beer_sheva: 'באר שבע', tel_aviv: 'תל אביב' };
const SCH_LABELS  = { morning: 'בוקר', evening: 'ערב' };

const STUDENT_STATUS_LABELS = {
  awaiting_coordination:   'ממתין לתיאום',
  interview_scheduled:     'ראיון נקבע',
  rejected_interview:      'נפסל בראיון',
  awaiting_assignment:     'ממתין לשיבוץ',
  assigned_pending_payment:'משובץ – ממתין לתשלום',
};
const STUDENT_STATUS_CLASS = {
  awaiting_coordination:   'sb-await',
  interview_scheduled:     'sb-interview',
  rejected_interview:      'sb-rejected',
  awaiting_assignment:     'sb-assignment',
  assigned_pending_payment:'sb-assignment',
};

let allStudents    = [];
let currentStudTab = 'all';

function getFilteredStudents() {
  if (currentStudTab === 'all') return allStudents;
  return allStudents.filter(s => (s.status || '') === currentStudTab);
}

window.setStudentTab = function(tab) {
  currentStudTab = tab;
  document.querySelectorAll('#view-registrations .tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('stab-' + tab)?.classList.add('active');
  renderStudents(getFilteredStudents());
};

window.filterStudents = function() {
  const q = (document.getElementById('regSearchInput').value || '').toLowerCase().trim();
  const base = getFilteredStudents();
  if (!q) { renderStudents(base); return; }
  renderStudents(base.filter(s =>
    (s.full_name || '').toLowerCase().includes(q) ||
    (s.phone     || '').toLowerCase().includes(q) ||
    (s.email     || '').toLowerCase().includes(q) ||
    (s.payment_ref || '').toLowerCase().includes(q)
  ));
};

window.loadStudents = async function() {
  document.getElementById('studentsBody').innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--silver-dark);"><i class="ph ph-circle-notch spin"></i> טוען...</td></tr>`;
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    document.getElementById('studentsBody').innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#dc2626;">שגיאה בטעינה: ${error.message}</td></tr>`;
    return;
  }
  allStudents = data || [];
  renderStudents(getFilteredStudents());
};

function renderStudents(students) {
  document.getElementById('regCountLabel').textContent = `${students.length} רישומים`;
  const tbody = document.getElementById('studentsBody');

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="all-clear"><i class="ph ph-books"></i><p>אין רישומים בסטטוס זה</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const date      = s.created_at ? new Date(s.created_at).toLocaleDateString('he-IL') : '—';
    const course    = COURSE_LABELS[s.course_track]  || s.course_track  || '—';
    const loc       = LOC_LABELS[s.location]          || s.location      || '—';
    const sch       = SCH_LABELS[s.schedule]          || s.schedule      || '—';
    const st        = s.status || 'awaiting_coordination';
    const stLabel   = STUDENT_STATUS_LABELS[st]  || st;
    const stClass   = STUDENT_STATUS_CLASS[st]   || 'sb-await';
    const payRef    = s.payment_ref || '—';
    const payAmt    = s.payment_amount ? `₪${s.payment_amount.toLocaleString()}` : '—';
    const notes     = s.admin_notes || [];

    const statusOptions = Object.entries(STUDENT_STATUS_LABELS).map(([k, v]) =>
      `<option value="${k}" ${k === st ? 'selected' : ''}>${v}</option>`
    ).join('');

    return `<tr id="srow-${s.id}" data-search="${(s.full_name||'').toLowerCase()} ${(s.phone||'').toLowerCase()} ${(s.email||'').toLowerCase()}">
      <td class="date-cell">${date}</td>
      <td>
        <div class="biz-name">${s.full_name || '—'}</div>
      </td>
      <td>
        <div class="phone-cell">${s.phone || '—'}</div>
        <div style="font-size:0.75rem;color:var(--silver-dark);">${s.email || ''}</div>
      </td>
      <td><span class="spec-tag" style="background:rgba(14,116,144,0.07);color:#0e7490;border-color:rgba(14,116,144,0.2);">${course}</span></td>
      <td>
        <span class="spec-tag">${loc}</span>
        <span class="spec-tag">${sch}</span>
      </td>
      <td>
        <div style="font-size:0.76rem;font-weight:700;color:var(--navy);direction:ltr;text-align:right;">${payRef}</div>
        <div style="font-size:0.73rem;color:var(--silver-dark);">דמי רישום: ${payAmt}</div>
      </td>
      <td>
        <span class="status-badge ${stClass}">${stLabel}</span>
      </td>
      <td>
        <div class="actions-cell" style="flex-direction:column;align-items:flex-start;gap:0.35rem;">
          <select class="status-select" onchange="updateStudentStatus('${s.id}', this.value)">
            ${statusOptions}
          </select>
          <button class="btn-details" onclick="toggleStudentDetails('${s.id}')">
            <i class="ph ph-list-bullets"></i> פרטים
          </button>
        </div>
      </td>
    </tr>
    <tr id="sdetails-${s.id}" class="details-row">
      <td colspan="8">

        <!-- שלב 1: פרטים אישיים -->
        <div class="det-section">
          <div class="det-section-title"><i class="ph ph-user"></i> שלב 1 — פרטים אישיים</div>
          <div class="details-grid">
            <div class="detail-item"><div class="detail-label">שם מלא</div><div class="detail-value">${s.full_name||'—'}</div></div>
            <div class="detail-item"><div class="detail-label">טלפון</div><div class="detail-value">${s.phone||'—'}</div></div>
            <div class="detail-item"><div class="detail-label">אימייל</div><div class="detail-value">${s.email||'—'}</div></div>
          </div>
        </div>

        <!-- שלב 2: בחירת קורס -->
        <div class="det-section">
          <div class="det-section-title"><i class="ph ph-graduation-cap"></i> שלב 2 — בחירת קורס</div>
          <div class="details-grid">
            <div class="detail-item"><div class="detail-label">מסלול</div><div class="detail-value">${COURSE_LABELS[s.course_track]||s.course_track||'—'}</div></div>
            <div class="detail-item"><div class="detail-label">מיקום</div><div class="detail-value">${s.location==='beer_sheva'?'באר שבע':s.location==='tel_aviv'?'תל אביב':s.location||'—'}</div></div>
            <div class="detail-item"><div class="detail-label">זמן לימודים</div><div class="detail-value">${s.schedule==='morning'?'בוקר':s.schedule==='evening'?'ערב':s.schedule||'—'}</div></div>
            <div class="detail-item"><div class="detail-label">מועד פתיחה</div><div class="detail-value">${s.opening_window==='may_jun'?'מאי–יוני':s.opening_window==='jun_jul'?'יוני–יולי':s.opening_window==='aug_sep'?'אוגוסט–ספטמבר':s.opening_window||'—'}</div></div>
          </div>
        </div>

        <!-- שלב 3: שאלות סינון -->
        <div class="det-section">
          <div class="det-section-title"><i class="ph ph-clipboard-text"></i> שלב 3 — שאלות התאמה</div>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">כשיר פיזית לגובה</div>
              <div class="detail-value ${s.screening_physical==='no'?'det-val-no':s.screening_physical==='yes'?'det-val-yes':''}">${s.screening_physical==='yes'?'✓ כן':s.screening_physical==='no'?'✗ לא':'—'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">אישור עבודה בגובה</div>
              <div class="detail-value ${s.screening_permit==='no'?'det-val-no':s.screening_permit==='yes'?'det-val-yes':''}">${s.screening_permit==='yes'?'✓ יש אישור':s.screening_permit==='no'?'✗ אין אישור':'—'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">ניסיון כלי חשמל</div>
              <div class="detail-value ${s.screening_tools==='no'?'det-val-no':s.screening_tools==='yes'?'det-val-yes':''}">${s.screening_tools==='yes'?'✓ יש ניסיון':s.screening_tools==='no'?'✗ אין ניסיון':'—'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">גיל מעל 18</div>
              <div class="detail-value ${s.screening_age==='no'?'det-val-no':s.screening_age==='yes'?'det-val-yes':''}">${s.screening_age==='yes'?'✓ כן':s.screening_age==='no'?'✗ לא':'—'}</div>
            </div>
          </div>
        </div>

        <!-- שלב 4: הסכמים וחתימות -->
        <div class="det-section">
          <div class="det-section-title"><i class="ph ph-pen-nib"></i> שלב 4 — הסכמים וחתימות</div>
          <div class="details-grid" style="margin-bottom:${(s.health_signature_data||s.regulations_signature_data)?'0.8rem':'0'};">
            <div class="detail-item">
              <div class="detail-label">הצהרת בריאות</div>
              <div class="detail-value ${s.health_declaration_signed?'det-val-yes':''}">${s.health_declaration_signed?'✓ חתום':'✗ לא חתום'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">תקנון לימודים</div>
              <div class="detail-value ${s.regulations_signed?'det-val-yes':''}">${s.regulations_signed?'✓ חתום':'✗ לא חתום'}</div>
            </div>
          </div>
          ${(s.health_signature_data||s.regulations_signature_data)?`
          <div style="display:flex;gap:1.2rem;flex-wrap:wrap;">
            ${s.health_signature_data?`<div><div style="font-size:0.7rem;color:#9aa3b5;margin-bottom:3px;">חתימה — הצהרת בריאות</div><img src="${s.health_signature_data}" style="height:70px;border:1px solid var(--border);border-radius:6px;background:#fff;display:block;"></div>`:''}
            ${s.regulations_signature_data?`<div><div style="font-size:0.7rem;color:#9aa3b5;margin-bottom:3px;">חתימה — תקנון לימודים</div><img src="${s.regulations_signature_data}" style="height:70px;border:1px solid var(--border);border-radius:6px;background:#fff;display:block;"></div>`:''}
          </div>`:''}
        </div>

        <!-- שלב 5: תשלום -->
        <div class="det-section">
          <div class="det-section-title"><i class="ph ph-credit-card"></i> שלב 5 — תשלום</div>
          <div class="details-grid">
            <div class="detail-item"><div class="detail-label">סטטוס תשלום</div><div class="detail-value">${s.payment_status||'—'}</div></div>
            <div class="detail-item"><div class="detail-label">סכום ששולם</div><div class="detail-value">${s.payment_amount?'₪'+s.payment_amount:'—'}</div></div>
            <div class="detail-item"><div class="detail-label">אסמכתא</div><div class="detail-value" style="font-family:monospace;font-size:0.78rem;">${s.payment_ref||'—'}</div></div>
          </div>
        </div>

        <!-- הערות מנהל -->
        <div class="notes-area" style="margin-top:0;">
          <div class="notes-title"><i class="ph ph-note-pencil"></i> הערות מנהל</div>
          <div class="notes-list" id="snotes-list-${s.id}">
            ${notes.length===0
              ?`<div style="font-size:0.78rem;color:var(--silver-dark);padding:0.3rem 0;">אין הערות עדיין</div>`
              :notes.map(n=>`<div class="note-item"><span class="note-date">${new Date(n.created_at).toLocaleDateString('he-IL')}</span>${n.text}</div>`).join('')}
          </div>
          <div class="note-input-row">
            <input type="text" class="note-input" id="snote-input-${s.id}" placeholder="הוסף הערה…" onkeydown="if(event.key==='Enter')saveStudentNote('${s.id}')">
            <button class="note-save-btn" onclick="saveStudentNote('${s.id}')"><i class="ph ph-paper-plane-right"></i></button>
          </div>
        </div>

      </td>
    </tr>`;
  }).join('');
}

window.toggleStudentDetails = function(id) {
  const row = document.getElementById('sdetails-' + id);
  if (row) row.classList.toggle('open');
};

window.updateStudentStatus = async function(id, newStatus) {
  const { error } = await supabase.from('students').update({ status: newStatus }).eq('id', id);
  if (error) { alert('שגיאה בעדכון סטטוס: ' + error.message); return; }
  const s = allStudents.find(x => x.id === id);
  if (s) s.status = newStatus;

  // When moving to awaiting_assignment → refresh pool from Supabase
  if (newStatus === 'awaiting_assignment' && s) {
    if (typeof bInit === 'function') bInit().catch(console.error);
    // show visual confirmation
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#16a34a;color:#fff;padding:0.6rem 1.4rem;border-radius:10px;font-size:0.85rem;font-weight:700;z-index:999;box-shadow:0 4px 16px rgba(0,0,0,0.18);';
    flash.textContent = `${s.full_name} נוסף/ה למאגר הממתינים לשיבוץ ✓`;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 3000);
  }

  // Update badge in row without full re-render
  const row = document.getElementById('srow-' + id);
  if (row) {
    const badge = row.querySelector('.status-badge');
    if (badge) {
      const cls   = STUDENT_STATUS_CLASS[newStatus]  || 'sb-await';
      const label = STUDENT_STATUS_LABELS[newStatus] || newStatus;
      badge.className = `status-badge ${cls}`;
      badge.textContent = label;
    }
  }
};

window.saveStudentNote = async function(id) {
  const input = document.getElementById(`snote-input-${id}`);
  const text  = (input?.value || '').trim();
  if (!text) return;

  const s     = allStudents.find(x => x.id === id);
  const notes = [...(s?.admin_notes || []), { text, created_at: new Date().toISOString(), by: currentUserEmail }];

  const { error } = await supabase.from('students').update({ admin_notes: notes }).eq('id', id);
  if (error) { alert('שגיאה בשמירת הערה: ' + error.message); return; }
  if (s) s.admin_notes = notes;
  input.value = '';

  const list = document.getElementById(`snotes-list-${id}`);
  if (list) {
    list.innerHTML = notes.map(n => `
      <div class="note-item">
        <span class="note-date">${new Date(n.created_at).toLocaleDateString('he-IL')}</span>
        ${n.text}
      </div>`).join('');
  }
};

init();