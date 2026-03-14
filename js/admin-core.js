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
  const items = [
    { id: 'overview',  icon: 'ph-chart-bar',        label: 'סקירה כללית',    href: 'admin-overview.html' },
    { id: 'users',     icon: 'ph-users',             label: 'אישור משתמשים', href: 'admin-users.html' },
    { id: 'orders',    icon: 'ph-list-bullets',      label: 'הזמנות',         href: 'admin.html' },
    { id: 'settings',  icon: 'ph-gear-six',          label: 'תמחור גלובלי',  href: 'admin-settings.html' },
  ];

  const html = `
    <div class="sidebar-label">ניהול</div>
    <ul class="admin-nav">
      ${items.map(item => `
        <li>
          <a href="${item.href}" class="${item.id === activePage ? 'active' : ''}">
            <i class="ph ${item.icon}"></i> ${item.label}
          </a>
        </li>
      `).join('')}
    </ul>
  `;

  const placeholder = document.getElementById('admin-sidebar-placeholder');
  if (placeholder) placeholder.innerHTML = html;
}
