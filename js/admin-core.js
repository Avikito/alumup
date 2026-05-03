import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(
  'https://exfdjelwyrspfspcevvm.supabase.co',
  'sb_publishable_6Yb2QjjK9jkDpvAeIZuOxA_g1KEA4ED'
);

async function getLocationData() {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve({}); return; }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let city = '', country = '', address = '';
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'he' } }
          );
          const d = await r.json();
          city    = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
          country = d.address?.country || '';
          address = d.display_name || '';
        } catch {}
        resolve({ lat, lng, city, country, address });
      },
      async () => {
        // GPS denied — fallback to IP geolocation (no permission needed)
        try {
          const r = await fetch('https://ipapi.co/json/');
          const d = await r.json();
          resolve({ city: d.city||'', country: d.country_name||'', address: '' });
        } catch { resolve({}); }
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  });
}

export async function requireAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return null; }

  const { data: adminRow } = await supabase
    .from('admin_users').select('user_id, role').eq('user_id', user.id).maybeSingle();

  if (!adminRow) { window.location.href = 'dashboard.html'; return null; }
  if (adminRow.role === 'procurement') { window.location.href = 'admin-procurement.html'; return null; }
  if (adminRow.role === 'college') { window.location.href = 'admin-college.html'; return null; }

  // update last_seen + log session with location
  const now = new Date().toISOString();
  supabase.rpc('update_admin_last_seen', { p_user_id: user.id });
  getLocationData().then(loc => {
    supabase.from('admin_session_logs').insert({
      user_id: user.id, role: adminRow.role, page: location.pathname, logged_in_at: now,
      lat: loc.lat || null, lng: loc.lng || null,
      city: loc.city || null, country: loc.country || null, address: loc.address || null
    }).then(({ error }) => { if (error) console.error('[monitor] session_log insert failed:', error); });
  });

  return user;
}

export async function requireProcurementAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return null; }

  const { data: adminRow } = await supabase
    .from('admin_users').select('user_id, role').eq('user_id', user.id).maybeSingle();

  if (!adminRow) { window.location.href = 'login.html'; return null; }
  if (adminRow.role !== 'procurement') { window.location.href = 'login.html'; return null; }

  const now = new Date().toISOString();
  supabase.rpc('update_admin_last_seen', { p_user_id: user.id });
  getLocationData().then(loc => {
    supabase.from('admin_session_logs').insert({
      user_id: user.id, role: 'procurement', page: location.pathname, logged_in_at: now,
      lat: loc.lat || null, lng: loc.lng || null,
      city: loc.city || null, country: loc.country || null, address: loc.address || null
    });
  });

  return user;
}

// ── DATA MASKING PLACEHOLDER ──────────────────────────────
// כדי להפעיל masking בעתיד — שנה MASK_FIELDS לאמת עבור שדות רגישים
export const MASK_CONFIG = {
  enabled: false,
  fields: { phone: false, email: false, id_number: false, bank_account: false }
};
export function maskField(value, fieldName) {
  if (!MASK_CONFIG.enabled || !MASK_CONFIG.fields[fieldName]) return value;
  if (!value) return value;
  const s = String(value);
  return s.slice(0, 2) + '*'.repeat(Math.max(0, s.length - 4)) + s.slice(-2);
}

export function renderSidebar(activePage) {
  const ACTIVE = activePage;
  const groups = [
    { single:true, id:'overview', icon:'ph-squares-four', label:'מבט על', href:'admin-overview.html' },
    { id:'users-g', icon:'ph-users-three', label:'משתמשים', items:[
      { id:'users',   icon:'ph-users',       label:'אישור משתמשים', href:'admin-users.html' },
      { id:'members', icon:'ph-medal',        label:'חבר אלום',      href:'admin-members.html' },
      { id:'crm',     icon:'ph-address-book', label:'קהילה ו-CRM',  href:'approved-users.html' },
    ]},
    { id:'sales-g', icon:'ph-chart-line-up', label:'מכירות וכספים', items:[
      { id:'orders',    icon:'ph-list-bullets',           label:'הזמנות',        href:'admin.html' },
      { id:'quotes',    icon:'ph-file-text',              label:'הצעות מחיר',    href:'admin-quotes.html' },
      { id:'financial', icon:'ph-currency-circle-dollar', label:'ניהול פיננסי',  href:'admin-financial.html' },
      { id:'settings',  icon:'ph-gear-six',               label:'תמחור גלובלי', href:'admin-settings.html' },
    ]},
    { id:'ops-g', icon:'ph-wrench', label:'תפעול ולו"ז', items:[
      { id:'calendar', icon:'ph-calendar-dots', label:'לוח זמנים',       href:'admin-calendar.html' },
      { id:'tasks',    icon:'ph-check-square',  label:'ניהול משימות',    href:'admin-tasks.html' },
      { id:'monitor',  icon:'ph-monitor',       label:'מוניטור אדמינים', href:'admin-monitor.html' },
    ]},
  ];
  const activeGroup = groups.find(g => !g.single && g.items && g.items.some(i => i.id === ACTIVE));
  let html = '<div class="sidebar-label">ניהול</div><ul class="admin-nav">';
  for (const g of groups) {
    if (g.single) {
      html += `<li><a href="${g.href}" class="${g.id===ACTIVE?'active':''}"><i class="ph ${g.icon}"></i> ${g.label}</a></li>`;
    } else {
      const open = !!(activeGroup && activeGroup.id === g.id);
      html += `<li><div class="nav-group-hdr${open?' open':''}" onclick="(function(h){var s=h.nextElementSibling,o=h.classList.contains('open');document.querySelectorAll('.nav-group-hdr.open').forEach(function(x){x.classList.remove('open');x.nextElementSibling.style.display='none';});if(!o){h.classList.add('open');s.style.display='flex';}})(this)"><span class="nav-grp-left"><i class="ph ${g.icon}"></i> ${g.label}</span><i class="ph ph-caret-down nav-caret"></i></div><ul class="nav-sub" style="display:${open?'flex':'none'}">${g.items.map(i=>`<li><a href="${i.href}" class="${i.id===ACTIVE?'active':''}"><i class="ph ${i.icon}"></i> ${i.label}</a></li>`).join('')}</ul></li>`;
    }
  }
  html += '</ul>';
  html += `<div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border,#2a3a4a);"><a href="dashboard.html" style="display:flex;align-items:center;gap:0.65rem;padding:0.6rem 0.75rem;border-radius:8px;font-size:0.88rem;font-weight:600;color:var(--silver-dark);text-decoration:none;transition:all 0.18s;" onmouseover="this.style.background='var(--blue-dim)';this.style.color='var(--electric-blue)'" onmouseout="this.style.background='';this.style.color='var(--silver-dark)'"><i class="ph ph-arrow-right"></i> חזרה לדשבורד</a></div>`;
  const placeholder = document.getElementById('admin-sidebar-placeholder');
  if (placeholder) placeholder.innerHTML = html;
}
