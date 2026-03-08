export async function renderKits() {
    return `
        <div class="kits-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="font-size: 1.5rem;">Configure Your Kit</h2>
                <button class="btn btn-outline">
                    <i class="ph ph-shopping-cart"></i> Cart (0)
                </button>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 300px; gap: 24px;">
                <!-- Product Configuration Area -->
                <div class="card" style="display: flex; flex-direction: column; gap: 24px;">
                    <div>
                        <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: var(--color-primary);">1. Select Profile System</h3>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                            <div class="kit-option active" style="border: 2px solid var(--color-primary); border-radius: 8px; padding: 16px; cursor: pointer; text-align: center; background: rgba(15, 82, 186, 0.05);">
                                <i class="ph ph-frame-corners text-primary" style="font-size: 2rem;"></i>
                                <h4 style="margin-top: 8px; font-size: 1rem;">M9400 Minimal</h4>
                                <p class="text-muted" style="font-size: 0.8rem;">Clean lines, hidden sash.</p>
                            </div>
                            <div class="kit-option" style="border: 1px solid var(--color-border); border-radius: 8px; padding: 16px; cursor: pointer; text-align: center;">
                                <i class="ph ph-door text-muted" style="font-size: 2rem;"></i>
                                <h4 style="margin-top: 8px; font-size: 1rem;">S560 Thermal</h4>
                                <p class="text-muted" style="font-size: 0.8rem;">High insulation core.</p>
                            </div>
                            <div class="kit-option" style="border: 1px solid var(--color-border); border-radius: 8px; padding: 16px; cursor: pointer; text-align: center;">
                                <i class="ph ph-windows-logo text-muted" style="font-size: 2rem;"></i>
                                <h4 style="margin-top: 8px; font-size: 1rem;">W75 Heavy</h4>
                                <p class="text-muted" style="font-size: 0.8rem;">Maximum security.</p>
                            </div>
                        </div>
                    </div>

                    <hr style="border: 0; border-top: 1px solid var(--color-border);" />

                    <div>
                        <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: var(--color-primary);">2. Dimensions (mm)</h3>
                        <div style="display: flex; gap: 16px;">
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 0.9rem; font-weight: 500; margin-bottom: 8px; color: var(--color-text-muted);">Width (W)</label>
                                <input type="number" class="config-input" value="1200" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-family: inherit; font-size: 1rem;">
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 0.9rem; font-weight: 500; margin-bottom: 8px; color: var(--color-text-muted);">Height (H)</label>
                                <input type="number" class="config-input" value="1500" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-family: inherit; font-size: 1rem;">
                            </div>
                        </div>
                    </div>

                    <hr style="border: 0; border-top: 1px solid var(--color-border);" />

                    <div>
                        <h3 style="font-size: 1.1rem; margin-bottom: 16px; color: var(--color-primary);">3. Finish Options</h3>
                        <select style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-family: inherit; font-size: 1rem; background: var(--color-surface);">
                            <option>Matte Black (RAL 9005)</option>
                            <option>Anthracite Grey (RAL 7016)</option>
                            <option>Traffic White (RAL 9016)</option>
                            <option>Anodized Silver</option>
                        </select>
                    </div>
                </div>

                <!-- Preview Area -->
                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <div class="card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: #E2E8F0; min-height: 250px; position: relative;">
                        <!-- Mock Visual Preview of a Window -->
                        <div style="width: 120px; height: 150px; border: 8px solid #333; background: #a2d2ff; position: relative;">
                            <div style="position: absolute; width: 4px; height: 100%; background: #333; left: calc(50% - 2px);"></div>
                            <div style="position: absolute; width: 100%; height: 4px; background: #333; top: calc(50% - 2px);"></div>
                        </div>
                        <span style="position: absolute; bottom: 16px; font-size: 0.8rem; color: #64748B; background: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 4px;">Live Dimension Preview</span>
                    </div>

                    <div class="card">
                        <h3 style="font-size: 1.1rem; margin-bottom: 16px;">Summary</h3>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.95rem;">
                            <span class="text-muted">System:</span>
                            <span class="font-medium">M9400 Minimal</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.95rem;">
                            <span class="text-muted">Dimensions:</span>
                            <span class="font-medium">1200x1500 mm</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 0.95rem;">
                            <span class="text-muted">Finish:</span>
                            <span class="font-medium">Matte Black</span>
                        </div>
                        <hr style="border: 0; border-top: 1px solid var(--color-border); margin-bottom: 16px;" />
                        <div style="display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 1.1rem; font-weight: 700;">
                            <span>Total (Est.):</span>
                            <span class="text-primary">₪1,450.00</span>
                        </div>
                        <button class="btn btn-primary" style="width: 100%;">
                            <i class="ph ph-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>

            </div>
        </div>
    `;
}
