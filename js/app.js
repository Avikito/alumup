import { renderHome } from './pages/home.js';
import { renderKits } from './pages/kits.js';
import { renderHub } from './pages/hub.js';
import { renderCollege } from './pages/college.js';
import { renderTenders } from './pages/tenders.js';

const routes = {
    '/': { title: 'Dashboard - ALUM-IL', render: renderHome, icon: 'ph-squares-four', label: 'Dashboard' },
    '/kits': { title: 'Installer Kits', render: renderKits, icon: 'ph-package', label: 'Installer Kits' },
    '/hub': { title: 'Purchasing Hub', render: renderHub, icon: 'ph-shopping-cart', label: 'Purchasing Hub' },
    '/college': { title: 'ALUM-IL College', render: renderCollege, icon: 'ph-graduation-cap', label: 'College' },
    '/tenders': { title: 'Tenders & Ops', render: renderTenders, icon: 'ph-briefcase', label: 'Tenders & Ops' }
};

class App {
    constructor() {
        this.appEl = document.getElementById('app');
        this.contentEl = document.getElementById('page-content');
        this.titleEl = document.getElementById('page-title');
        this.sidebarNavEl = document.getElementById('sidebar-nav');
        this.menuToggleBtn = document.getElementById('menu-toggle');
        this.sidebarEl = document.getElementById('sidebar');

        this.init();
    }

    init() {
        this.renderSidebar();
        this.bindEvents();
        this.handleRoute();
    }

    bindEvents() {
        // Router clicks
        document.body.addEventListener('click', (e) => {
            const link = e.target.closest('[data-link]');
            if (link) {
                e.preventDefault();
                const path = link.getAttribute('href');
                this.navigate(path);
            }
        });

        // Browser back/forward
        window.addEventListener('popstate', () => this.handleRoute());

        // Mobile menu toggle
        this.menuToggleBtn.addEventListener('click', () => {
            this.sidebarEl.classList.toggle('open');
        });

        // Close mobile menu on click outside relative to main wrapper
        document.querySelector('.main-wrapper').addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && this.sidebarEl.classList.contains('open') && !e.target.closest('.menu-toggle')) {
                this.sidebarEl.classList.remove('open');
            }
        });
    }

    renderSidebar() {
        const currentPath = window.location.hash.replace('#', '') || '/';
        
        let navHtml = '';
        for (const [path, route] of Object.entries(routes)) {
            const isActive = currentPath === path ? 'active' : '';
            navHtml += `
                <a href="${path}" class="nav-item ${isActive}" data-link>
                    <i class="ph ${route.icon}"></i>
                    <span>${route.label}</span>
                </a>
            `;
        }
        this.sidebarNavEl.innerHTML = navHtml;
    }

    updateSidebarActive(path) {
        const items = this.sidebarNavEl.querySelectorAll('.nav-item');
        items.forEach(item => {
            if (item.getAttribute('href') === path) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    navigate(path) {
        window.history.pushState({}, '', '#' + path);
        this.handleRoute();
        
        if (window.innerWidth <= 768) {
             this.sidebarEl.classList.remove('open');
        }
    }

    async handleRoute() {
        const path = window.location.hash.replace('#', '') || '/';
        const route = routes[path] || routes['/'];

        // Update Title & Active state
        document.title = route.title;
        this.titleEl.textContent = route.label;
        this.updateSidebarActive(path);

        // Add a small fade effect
        this.contentEl.classList.remove('fade-in');
        // Force reflow
        void this.contentEl.offsetWidth;
        
        try {
            this.contentEl.innerHTML = await route.render();
            this.contentEl.classList.add('fade-in');
        } catch (err) {
            console.error(err);
            this.contentEl.innerHTML = `<div class="card"><h2 class="text-danger">Error Loading Page</h2><p>${err.message}</p></div>`;
        }
    }
}

// Boot application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
