export async function renderCollege() {
    return `
        <div class="college-container">
            <!-- Header Section -->
            <div style="display: flex; gap: 24px; align-items: stretch; margin-bottom: 32px; flex-wrap: wrap;">
                <div class="card" style="flex: 2; min-width: 300px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white;">
                    <h2 style="font-size: 2rem; margin-bottom: 8px;">ALUM-IL College</h2>
                    <p style="opacity: 0.8; margin-bottom: 24px; max-width: 600px;">
                        Master the art of modern aluminum craftsmanship. Gain vendor-certified credentials to win larger projects and build trust with clients.
                    </p>
                    <div style="display: flex; gap: 16px;">
                        <button class="btn btn-primary">My Certifications</button>
                        <button class="btn btn-outline" style="border-color: rgba(255,255,255,0.3); color: white;">Learning Path</button>
                    </div>
                </div>
                
                <div class="card" style="flex: 1; min-width: 250px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                    <div style="font-size: 3rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px;">12</div>
                    <div class="text-muted" style="font-size: 1rem; font-weight: 500;">CEU Credits Earned</div>
                    <div style="margin-top: 16px; width: 100%; height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; width: 40%; background: var(--color-primary); border-radius: 3px;"></div>
                    </div>
                    <div class="text-muted" style="font-size: 0.8rem; margin-top: 8px;">18 credits to Master level</div>
                </div>
            </div>

            <h3 style="font-size: 1.25rem; margin-bottom: 16px;">Professional Course Tracks</h3>

            <!-- Courses Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
                
                <!-- Course 1 -->
                <div class="card" style="display: flex; flex-direction: column; padding: 0; overflow: hidden;">
                    <div style="height: 140px; background: url('https://images.unsplash.com/photo-1541888081665-22441c2c3669?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80') center/cover; position: relative;">
                        <div style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                            Certified Track
                        </div>
                    </div>
                    <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
                        <h4 style="font-size: 1.1rem; margin-bottom: 8px; font-weight: 600;">Advanced Thermal Break Systems</h4>
                        <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 16px; flex: 1;">
                            Learn precision installation techniques for top-tier thermal insulation profiles.
                        </p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 0.85rem; color: var(--color-text-muted);">
                            <span style="display: flex; align-items: center; gap: 4px;"><i class="ph ph-clock"></i> 4.5 Hours</span>
                            <span style="display: flex; align-items: center; gap: 4px;"><i class="ph ph-star-fill text-warning"></i> 4.9</span>
                        </div>
                        <button class="btn btn-outline" style="width: 100%;">Enroll Now</button>
                    </div>
                </div>

                <!-- Course 2 -->
                <div class="card" style="display: flex; flex-direction: column; padding: 0; overflow: hidden;">
                    <div style="height: 140px; background: url('https://images.unsplash.com/photo-1582200586938-16e78ba71e19?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80') center/cover; position: relative;">
                        <div style="position: absolute; top: 12px; left: 12px; background: var(--color-primary); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                            Live Webinar
                        </div>
                    </div>
                    <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
                        <h4 style="font-size: 1.1rem; margin-bottom: 8px; font-weight: 600;">Minimalist Sliding Doors Setup</h4>
                        <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 16px; flex: 1;">
                            Master the hidden tracks and floor integration of modern minimal systems.
                        </p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 0.85rem; color: var(--color-text-muted);">
                            <span style="display: flex; align-items: center; gap: 4px;"><i class="ph ph-calendar-blank"></i> Oct 12, 10:00 AM</span>
                            <span style="display: flex; align-items: center; gap: 4px;">Free</span>
                        </div>
                        <button class="btn btn-primary" style="width: 100%;">Register</button>
                    </div>
                </div>

                <!-- Course 3 -->
                <div class="card" style="display: flex; flex-direction: column; padding: 0; overflow: hidden;">
                    <div style="height: 140px; background: url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80') center/cover; position: relative;">
                         <div style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                            Business Skills
                        </div>
                    </div>
                    <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
                        <h4 style="font-size: 1.1rem; margin-bottom: 8px; font-weight: 600;">Estimating & Bidding Tenders</h4>
                        <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 16px; flex: 1;">
                            Optimize your pricing strategies to win more large-scale architectural projects.
                        </p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 0.85rem; color: var(--color-text-muted);">
                            <span style="display: flex; align-items: center; gap: 4px;"><i class="ph ph-video-camera"></i> 8 Modules</span>
                            <span style="display: flex; align-items: center; gap: 4px;">₪250</span>
                        </div>
                        <button class="btn btn-outline" style="width: 100%;">View Curriculum</button>
                    </div>
                </div>

            </div>
        </div>
    `;
}
