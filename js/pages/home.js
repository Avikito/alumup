export async function renderHome() {
    return `
        <div class="home-container">
            <!-- Hero Section -->
            <section class="hero-section card" style="background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-light) 100%); color: white; margin-bottom: 32px; padding: 48px; position: relative; overflow: hidden;">
                <div style="position: relative; z-index: 2; max-width: 600px;">
                    <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 16px;">The Professional Digital Ecosystem</h1>
                    <p style="font-size: 1.1rem; opacity: 0.9; margin-bottom: 32px; line-height: 1.6;">
                        Connect, source, and grow with ALUM-IL. The leading platform for aluminum professionals, suppliers, and knowledge sharing.
                    </p>
                    <div style="display: flex; gap: 16px;">
                        <button class="btn" style="background: white; color: var(--color-primary); font-weight: 600;" onclick="window.app.navigate('/kits')">
                            Explore Kits <i class="ph ph-arrow-right"></i>
                        </button>
                        <button class="btn btn-outline" style="border-color: rgba(255,255,255,0.5); color: white;" onclick="window.app.navigate('/hub')">
                            Sourcing Hub
                        </button>
                    </div>
                </div>
                <!-- Abstract Background Shapes -->
                <i class="ph ph-hexagon" style="position: absolute; right: -50px; top: -50px; font-size: 300px; opacity: 0.1; transform: rotate(15deg);"></i>
                <i class="ph ph-stack" style="position: absolute; right: 150px; bottom: -20px; font-size: 150px; opacity: 0.1;"></i>
            </section>

            <!-- 4 Pillars Grid -->
            <section style="margin-bottom: 32px;">
                <h2 style="font-size: 1.5rem; margin-bottom: 24px;">Platform Pillars</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px;">
                    
                    <div class="card pillar-card" style="display: flex; flex-direction: column; align-items: flex-start; cursor: pointer;" onclick="window.app.navigate('/kits')">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(15, 82, 186, 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;">
                            <i class="ph ph-package"></i>
                        </div>
                        <h3 style="font-size: 1.1rem; margin-bottom: 8px;">Installer Kits</h3>
                        <p class="text-muted" style="font-size: 0.9rem; flex: 1;">Customizable, ready-to-assemble aluminum kits perfectly sized for your projects.</p>
                        <span class="text-primary font-medium" style="margin-top: 16px; font-size: 0.9rem; display: flex; align-items: center; gap: 4px;">
                            Configure Now <i class="ph ph-caret-right"></i>
                        </span>
                    </div>

                    <div class="card pillar-card" style="display: flex; flex-direction: column; align-items: flex-start; cursor: pointer;" onclick="window.app.navigate('/hub')">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(15, 82, 186, 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;">
                            <i class="ph ph-shopping-cart"></i>
                        </div>
                        <h3 style="font-size: 1.1rem; margin-bottom: 8px;">Central Purchasing</h3>
                        <p class="text-muted" style="font-size: 0.9rem; flex: 1;">Access wholesale pricing, group-buy advantages, and verified supplier networks.</p>
                        <span class="text-primary font-medium" style="margin-top: 16px; font-size: 0.9rem; display: flex; align-items: center; gap: 4px;">
                            Browse Marketplace <i class="ph ph-caret-right"></i>
                        </span>
                    </div>

                    <div class="card pillar-card" style="display: flex; flex-direction: column; align-items: flex-start; cursor: pointer;" onclick="window.app.navigate('/college')">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(15, 82, 186, 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;">
                            <i class="ph ph-graduation-cap"></i>
                        </div>
                        <h3 style="font-size: 1.1rem; margin-bottom: 8px;">ALUM-IL College</h3>
                        <p class="text-muted" style="font-size: 0.9rem; flex: 1;">Elevate your team's skills with specialized training tracks and vendor certifications.</p>
                        <span class="text-primary font-medium" style="margin-top: 16px; font-size: 0.9rem; display: flex; align-items: center; gap: 4px;">
                            View Courses <i class="ph ph-caret-right"></i>
                        </span>
                    </div>

                    <div class="card pillar-card" style="display: flex; flex-direction: column; align-items: flex-start; cursor: pointer;" onclick="window.app.navigate('/tenders')">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(15, 82, 186, 0.1); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;">
                            <i class="ph ph-briefcase"></i>
                        </div>
                        <h3 style="font-size: 1.1rem; margin-bottom: 8px;">Tenders & Ops</h3>
                        <p class="text-muted" style="font-size: 0.9rem; flex: 1;">Find exclusive business opportunities, bid on active projects, and expand your radius.</p>
                        <span class="text-primary font-medium" style="margin-top: 16px; font-size: 0.9rem; display: flex; align-items: center; gap: 4px;">
                            Open Tender Board <i class="ph ph-caret-right"></i>
                        </span>
                    </div>

                </div>
            </section>

            <!-- Quick Stats Overview -->
            <section class="card" style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 24px; padding: 32px 24px;">
                <div style="text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-primary);">120+</div>
                    <div class="text-muted" style="font-size: 0.9rem; font-weight: 500;">Active Suppliers</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-primary);">4.5k</div>
                    <div class="text-muted" style="font-size: 0.9rem; font-weight: 500;">Orders Processed</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-primary);">85</div>
                    <div class="text-muted" style="font-size: 0.9rem; font-weight: 500;">Live Tenders</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-primary);">15</div>
                    <div class="text-muted" style="font-size: 0.9rem; font-weight: 500;">Professional Courses</div>
                </div>
            </section>
        </div>
    `;
}
