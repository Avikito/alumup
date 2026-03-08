export async function renderHub() {
    return `
        <div class="hub-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="font-size: 1.5rem;">Central Purchasing Hub</h2>
                <div style="display: flex; gap: 12px;">
                    <div style="position: relative;">
                        <i class="ph ph-magnifying-glass" style="position: absolute; left: 12px; top: 10px; color: var(--color-text-muted);"></i>
                        <input type="text" placeholder="Search bulk materials..." style="padding: 8px 12px 8px 36px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-family: inherit; width: 250px;">
                    </div>
                    <button class="btn btn-primary">
                        <i class="ph ph-funnel"></i> Filter
                    </button>
                </div>
            </div>

            <!-- Ongoing Group Buys Section -->
            <section style="margin-bottom: 32px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="font-size: 1.25rem;">Active Group Buys</h3>
                    <a href="#" class="text-primary font-medium" style="text-decoration: none; font-size: 0.9rem;">View All</a>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                    <!-- Group Buy Card 1 -->
                    <div class="card" style="position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 12px; right: 12px; background: rgba(245, 158, 11, 0.1); color: var(--color-warning); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">
                            Closes in 2d 14h
                        </div>
                        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                            <div style="width: 48px; height: 48px; border-radius: 8px; background: #E2E8F0; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #64748B;">
                                <i class="ph ph-screencast"></i>
                            </div>
                            <div>
                                <h4 style="font-size: 1.1rem; margin-bottom: 4px;">Premium Silicone Sealant</h4>
                                <span class="text-muted" style="font-size: 0.85rem;">Supplier: AlumTech Supplies</span>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
                                <span>Target: 500 units</span>
                                <span class="font-medium text-primary">320 units committed</span>
                            </div>
                            <!-- Progress Bar -->
                            <div style="width: 100%; height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: 64%; background: var(--color-primary); border-radius: 4px;"></div>
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-size: 0.8rem; color: var(--color-text-muted); text-decoration: line-through;">Retail: ₪45.00</div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-success);">Tier 2: ₪28.00</div>
                            </div>
                            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.9rem;">Join Buy</button>
                        </div>
                    </div>

                    <!-- Group Buy Card 2 -->
                    <div class="card" style="position: relative; overflow: hidden;">
                        <div style="position: absolute; top: 12px; right: 12px; background: rgba(16, 185, 129, 0.1); color: var(--color-success); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">
                            Target Reached
                        </div>
                         <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                            <div style="width: 48px; height: 48px; border-radius: 8px; background: #E2E8F0; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #64748B;">
                                <i class="ph ph-nut"></i>
                            </div>
                            <div>
                                <h4 style="font-size: 1.1rem; margin-bottom: 4px;">Stainless Steel Screws Box</h4>
                                <span class="text-muted" style="font-size: 0.85rem;">Supplier: BuildCo Hardware</span>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
                                <span>Target: 1000 boxes</span>
                                <span class="font-medium text-success">1150 boxes committed</span>
                            </div>
                            <!-- Progress Bar -->
                            <div style="width: 100%; height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: 100%; background: var(--color-success); border-radius: 4px;"></div>
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-size: 0.8rem; color: var(--color-text-muted); text-decoration: line-through;">Retail: ₪120.00</div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-success);">Tier 3: ₪75.00</div>
                            </div>
                            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.9rem;">Buy Now</button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Bulk Marketplace -->
            <section>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="font-size: 1.25rem;">Marketplace Directory</h3>
                </div>
                
                <div class="card" style="padding: 0; overflow: hidden;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background-color: var(--color-surface-hover); border-bottom: 1px solid var(--color-border);">
                                <th style="padding: 16px; font-weight: 600; font-size: 0.95rem;">Material / Product</th>
                                <th style="padding: 16px; font-weight: 600; font-size: 0.95rem;">Supplier Info</th>
                                <th style="padding: 16px; font-weight: 600; font-size: 0.95rem;">Availability</th>
                                <th style="padding: 16px; font-weight: 600; font-size: 0.95rem;">Bulk Price (est)</th>
                                <th style="padding: 16px; font-weight: 600; font-size: 0.95rem;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid var(--color-border);">
                                <td style="padding: 16px; display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 32px; height: 32px; border-radius: 4px; background: rgba(15, 82, 186, 0.1); display: flex; align-items: center; justify-content: center;"><i class="ph ph-cube text-primary"></i></div>
                                    <div>
                                        <div class="font-medium">EPDM Gasket Rolls</div>
                                        <div class="text-muted" style="font-size: 0.8rem;">SKU: GL-401</div>
                                    </div>
                                </td>
                                <td style="padding: 16px;">
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <i class="ph ph-shield-check text-success"></i>
                                        <span class="font-medium" style="font-size: 0.95rem;">RubberTech Israel</span>
                                    </div>
                                    <div style="font-size: 0.8rem; color: #F59E0B;">
                                        <i class="ph ph-star-fill"></i> 4.8 / 5
                                    </div>
                                </td>
                                <td style="padding: 16px;">
                                    <span style="background: rgba(16, 185, 129, 0.1); color: var(--color-success); padding: 4px 8px; border-radius: 99px; font-size: 0.8rem; font-weight: 500;">In Stock</div>
                                </td>
                                <td style="padding: 16px; font-weight: 600;">₪5.20 / meter</td>
                                <td style="padding: 16px;">
                                    <button class="btn btn-outline" style="padding: 4px 12px; font-size: 0.85rem;">Request Quote</button>
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--color-border); background: var(--color-surface-hover);">
                                <td style="padding: 16px; display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 32px; height: 32px; border-radius: 4px; background: rgba(15, 82, 186, 0.1); display: flex; align-items: center; justify-content: center;"><i class="ph ph-sliders-horizontal text-primary"></i></div>
                                    <div>
                                        <div class="font-medium">Heavy Duty Rollers</div>
                                        <div class="text-muted" style="font-size: 0.8rem;">Max 120kg</div>
                                    </div>
                                </td>
                                <td style="padding: 16px;">
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <i class="ph ph-shield-check text-success"></i>
                                        <span class="font-medium" style="font-size: 0.95rem;">MechParts Co.</span>
                                    </div>
                                    <div style="font-size: 0.8rem; color: #F59E0B;">
                                        <i class="ph ph-star-fill"></i> 4.5 / 5
                                    </div>
                                </td>
                                <td style="padding: 16px;">
                                    <span style="background: rgba(245, 158, 11, 0.1); color: var(--color-warning); padding: 4px 8px; border-radius: 99px; font-size: 0.8rem; font-weight: 500;">Low Stock</div>
                                </td>
                                <td style="padding: 16px; font-weight: 600;">₪45.00 / pair</td>
                                <td style="padding: 16px;">
                                    <button class="btn btn-outline" style="padding: 4px 12px; font-size: 0.85rem;">Request Quote</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    `;
}
