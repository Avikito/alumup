import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(
  'https://exfdjelwyrspfspcevvm.supabase.co',
  'sb_publishable_6Yb2QjjK9jkDpvAeIZuOxA_g1KEA4ED'
);

export async function requireAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return null; }

  const { data: adminRow } = await supabase
    .from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();

  if (!adminRow) { window.location.href = 'dashboard.html'; return null; }
  return user;
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
      { id:'calendar', icon:'ph-calendar-dots', label:'לוח זמנים',    href:'admin-calendar.html' },
      { id:'tasks',    icon:'ph-check-square',  label:'ניהול משימות', href:'admin-tasks.html' },
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
  const placeholder = document.getElementById('admin-sidebar-placeholder');
  if (placeholder) placeholder.innerHTML = html;
}
