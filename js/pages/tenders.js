export async function renderTenders() {
    return `
        <div class="tenders-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
                <div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 8px;">Tenders & Opportunities</h2>
                    <p class="text-muted" style="font-size: 0.95rem;">Find the right projects for your expanding business.</p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-outline">
                        <i class="ph ph-map-pin"></i> Region: Center
                    </button>
                    <button class="btn btn-outline">
                        <i class="ph ph-sliders-horizontal"></i> Filter Scope
                    </button>
                </div>
            </div>

            <!-- Tenders List -->
            <div style="display: flex; flex-direction: column; gap: 16px;">

                <!-- Tender Item 1 -->
                <div class="card" style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="background: rgba(15, 82, 186, 0.1); color: var(--color-primary); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Commercial</span>
                                <span class="text-muted" style="font-size: 0.8rem;"><i class="ph ph-clock"></i> Closes in 5 Days</span>
                            </div>
                            <h3 style="font-size: 1.2rem; font-weight: 600; margin-bottom: 4px;">Office Building Facade Retromit - Tel Aviv</h3>
                            <div class="text-muted" style="font-size: 0.9rem; display: flex; align-items: center; gap: 16px;">
                                <span><i class="ph ph-buildings"></i> Initiator: Skyline Development Corp</span>
                                <span><i class="ph ph-ruler"></i> Est. 2500 sqm</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-success); margin-bottom: 8px;">₪1.2M - ₪1.5M</div>
                            <button class="btn btn-primary" style="padding: 6px 16px;">View Tender</button>
                        </div>
                    </div>
                </div>

                <!-- Tender Item 2 -->
                <div class="card" style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="background: rgba(16, 185, 129, 0.1); color: var(--color-success); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Residential</span>
                                <span class="text-muted" style="font-size: 0.8rem;"><i class="ph ph-clock"></i> Closes in 12 Days</span>
                            </div>
                            <h3 style="font-size: 1.2rem; font-weight: 600; margin-bottom: 4px;">Luxury Villa Complex Windows Setup - Herzliya</h3>
                            <div class="text-muted" style="font-size: 0.9rem; display: flex; align-items: center; gap: 16px;">
                                <span><i class="ph ph-house"></i> Initiator: Private Group</span>
                                <span><i class="ph ph-ruler"></i> Est. 450 sqm</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-success); margin-bottom: 8px;">₪350K - ₪450K</div>
                            <button class="btn btn-outline" style="padding: 6px 16px;">View Tender</button>
                        </div>
                    </div>
                </div>

                <!-- Tender Item 3 -->
                <div class="card" style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="background: rgba(245, 158, 11, 0.1); color: var(--color-warning); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Public</span>
                                <span class="text-muted" style="font-size: 0.8rem;"><i class="ph ph-clock"></i> Closes in 2 Weeks</span>
                            </div>
                            <h3 style="font-size: 1.2rem; font-weight: 600; margin-bottom: 4px;">School Expansion Project Doors & Windows - Modiin</h3>
                            <div class="text-muted" style="font-size: 0.9rem; display: flex; align-items: center; gap: 16px;">
                                <span><i class="ph ph-bank"></i> Initiator: Local Municipality</span>
                                <span><i class="ph ph-ruler"></i> Est. 850 sqm</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-success); margin-bottom: 8px;">₪650K - ₪800K</div>
                            <button class="btn btn-outline" style="padding: 6px 16px;">View Tender</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;
}
