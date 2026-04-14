import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://exfdjelwyrspfspcevvm.supabase.co',
  'sb_publishable_6Yb2QjjK9jkDpvAeIZuOxA_g1KEA4ED'
);

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
const regState = {
  step: 1,
  candidateType: null,      // 'new' | 'veteran' | 'employer'
  employeeCount: 1,
  location: null,           // 'beer_sheva' | 'tel_aviv'
  schedule: null,           // 'morning' | 'evening'
  timeWindow: null,         // 'may_jun' | 'jun_jul' | 'aug_sep'
  fullName: '',
  phone: '',
  email: '',
  healthSigned: false,
  regulationsSigned: false,
  healthSigData: null,
  regulationsSigData: null,
  paymentRef: null
};

/* ══════════════════════════════════════════
   URGENCY LOGIC
══════════════════════════════════════════ */
const urgencyMap = {
  beer_sheva: {
    may_jun:  { spots: 3, text: 'נותרו 3 מקומות אחרונים לסבב הקרוב בדרום!', color: '#dc2626', pulse: true },
    jun_jul:  { spots: 7, text: '7 מקומות פנויים — המחזור נפתח ב-85% תפוסה', color: '#ea580c', pulse: false },
    aug_sep:  { spots: 12, text: 'מחזור חדש בתכנון — הירשמו להבטחת מקום', color: '#1a5faa', pulse: false }
  },
  tel_aviv:  {
    may_jun:  { spots: 5, text: 'נותרו 5 מקומות — קורס נפתח ב-85% תפוסה', color: '#dc2626', pulse: true },
    jun_jul:  { spots: 9, text: '9 מקומות פנויים בסבב הצפוני הקרוב', color: '#ea580c', pulse: false },
    aug_sep:  { spots: 14, text: 'מחזור אוגוסט פתוח לרישום', color: '#1a5faa', pulse: false }
  }
};

function getUrgency() {
  const loc = regState.location || 'beer_sheva';
  const win = regState.timeWindow || 'may_jun';
  return urgencyMap[loc]?.[win] || urgencyMap.beer_sheva.may_jun;
}

/* ══════════════════════════════════════════
   HTML RENDER
══════════════════════════════════════════ */
export function renderCollegeRegistration() {
  return `
<div id="creg-overlay" style="
  position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);
  z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;
  animation:cregFadeIn 0.25s ease;
" onclick="if(event.target===this) collegeReg.closeModal()">

  <div style="
    background:#fff;border-radius:20px;width:100%;max-width:640px;
    max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(15,23,42,0.22);
    position:relative;
  ">

    <!-- Header -->
    <div style="
      padding:1.5rem 1.75rem 1.25rem;border-bottom:1px solid #e8eef8;
      display:flex;align-items:center;justify-content:space-between;
      background:linear-gradient(135deg,#f0f4fa 0%,#fff 100%);
      border-radius:20px 20px 0 0;
    ">
      <div>
        <div style="font-size:0.72rem;font-weight:700;color:#6b7a99;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">
          <i class="ph ph-graduation-cap" style="color:#1a5faa;margin-left:4px;"></i>ALUM-IL College
        </div>
        <h2 style="font-size:1.3rem;font-weight:800;color:#1a2640;margin:0;">הרשמה לקורס מקצועי</h2>
      </div>
      <button onclick="collegeReg.closeModal()" style="
        background:none;border:none;cursor:pointer;padding:8px;border-radius:8px;
        color:#6b7a99;font-size:1.3rem;transition:all 0.15s;
      " onmouseover="this.style.background='#f0f4fa'" onmouseout="this.style.background='none'">
        <i class="ph ph-x"></i>
      </button>
    </div>

    <!-- Progress Bar -->
    <div style="padding:1rem 1.75rem 0;">
      <div style="display:flex;align-items:center;gap:0;margin-bottom:0.25rem;">
        ${[1,2,3,4,5].map(i => `
          <div id="creg-step-dot-${i}" style="
            width:32px;height:32px;border-radius:50%;border:2px solid #dde4f0;
            display:flex;align-items:center;justify-content:center;
            font-size:0.78rem;font-weight:700;color:#6b7a99;
            background:#fff;transition:all 0.25s;flex-shrink:0;
            ${i === 1 ? 'border-color:#1a5faa;background:#1a5faa;color:#fff;box-shadow:0 0 0 3px rgba(26,95,170,0.15);' : ''}
          ">${i}</div>
          ${i < 5 ? `<div id="creg-line-${i}" style="flex:1;height:2px;background:${i < 1 ? '#1a5faa' : '#dde4f0'};transition:background 0.3s;"></div>` : ''}
        `).join('')}
      </div>
      <div id="creg-step-label" style="font-size:0.78rem;color:#6b7a99;margin-top:6px;margin-bottom:4px;">
        שלב 1 מתוך 5 — זיהוי מועמד
      </div>
    </div>

    <!-- Steps Container -->
    <div style="padding:1.5rem 1.75rem 1.75rem;">

      <!-- STEP 1: Candidate Type -->
      <div id="creg-step-1" class="creg-step" style="">
        <h3 style="font-size:1.05rem;font-weight:700;color:#1a2640;margin-bottom:6px;">מי מגיע אלינו?</h3>
        <p style="font-size:0.88rem;color:#6b7a99;margin-bottom:1.25rem;">בחרו את הפרופיל המתאים לכם — הקורס מותאם בהתאם</p>

        <div style="display:flex;flex-direction:column;gap:12px;">

          <!-- New candidate -->
          <div id="creg-card-new" onclick="collegeReg.selectType('new')" style="
            border:2px solid #dde4f0;border-radius:14px;padding:1rem 1.25rem;
            cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:1rem;
          " onmouseover="if(regState.candidateType!=='new')this.style.borderColor='#1a5faa'"
             onmouseout="if(regState.candidateType!=='new')this.style.borderColor='#dde4f0'">
            <div style="
              width:48px;height:48px;border-radius:12px;background:#eaf0f9;
              display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;
            "><i class="ph ph-user-plus" style="color:#1a5faa;"></i></div>
            <div style="flex:1;">
              <div style="font-weight:700;color:#1a2640;margin-bottom:3px;">חדש ללא ניסיון</div>
              <div style="font-size:0.82rem;color:#6b7a99;">התחלה מאפס — הכשרה מקצועית מלאה, כולל בדיקת כושר פיזי</div>
            </div>
            <div id="creg-check-new" style="display:none;color:#1a5faa;font-size:1.3rem;"><i class="ph ph-check-circle-fill"></i></div>
          </div>

          <!-- Veteran installer -->
          <div id="creg-card-veteran" onclick="collegeReg.selectType('veteran')" style="
            border:2px solid #dde4f0;border-radius:14px;padding:1rem 1.25rem;
            cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:1rem;
          " onmouseover="if(regState.candidateType!=='veteran')this.style.borderColor='#1a5faa'"
             onmouseout="if(regState.candidateType!=='veteran')this.style.borderColor='#dde4f0'">
            <div style="
              width:48px;height:48px;border-radius:12px;background:#fdf4e7;
              display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;
            "><i class="ph ph-certificate" style="color:#c47c00;"></i></div>
            <div style="flex:1;">
              <div style="font-weight:700;color:#1a2640;margin-bottom:3px;">מתקין ותיק — הכנה להסמכת 'חבר אלום'</div>
              <div style="font-size:0.82rem;color:#6b7a99;">ניסיון קודם? מסלול מזורז להסמכה רשמית ושדרוג מקצועי</div>
            </div>
            <div id="creg-check-veteran" style="display:none;color:#1a5faa;font-size:1.3rem;"><i class="ph ph-check-circle-fill"></i></div>
          </div>

          <!-- Employer -->
          <div id="creg-card-employer" onclick="collegeReg.selectType('employer')" style="
            border:2px solid #dde4f0;border-radius:14px;padding:1rem 1.25rem;
            cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:1rem;
          " onmouseover="if(regState.candidateType!=='employer')this.style.borderColor='#1a5faa'"
             onmouseout="if(regState.candidateType!=='employer')this.style.borderColor='#dde4f0'">
            <div style="
              width:48px;height:48px;border-radius:12px;background:#f0fdf4;
              display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;
            "><i class="ph ph-buildings" style="color:#16a34a;"></i></div>
            <div style="flex:1;">
              <div style="font-weight:700;color:#1a2640;margin-bottom:3px;">מעסיק — רישום עובדים</div>
              <div style="font-size:0.82rem;color:#6b7a99;">רשמו מספר עובדים במקביל, קבלו הנחה קבוצתית</div>
            </div>
            <div id="creg-check-employer" style="display:none;color:#1a5faa;font-size:1.3rem;"><i class="ph ph-check-circle-fill"></i></div>
          </div>
        </div>

        <!-- Employee counter (employer only) -->
        <div id="creg-employee-counter" style="display:none;margin-top:1rem;padding:1rem;background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;">
          <div style="font-size:0.88rem;font-weight:600;color:#1a2640;margin-bottom:8px;">מספר עובדים לרישום:</div>
          <div style="display:flex;align-items:center;gap:12px;">
            <button onclick="collegeReg.changeCount(-1)" style="
              width:36px;height:36px;border-radius:50%;border:2px solid #16a34a;
              background:#fff;cursor:pointer;font-size:1.1rem;font-weight:700;color:#16a34a;
              display:flex;align-items:center;justify-content:center;
            ">−</button>
            <span id="creg-count-display" style="font-size:1.4rem;font-weight:800;color:#1a2640;min-width:32px;text-align:center;">1</span>
            <button onclick="collegeReg.changeCount(1)" style="
              width:36px;height:36px;border-radius:50%;border:2px solid #16a34a;
              background:#16a34a;cursor:pointer;font-size:1.1rem;font-weight:700;color:#fff;
              display:flex;align-items:center;justify-content:center;
            ">+</button>
            <span style="font-size:0.82rem;color:#6b7a99;margin-right:8px;">עובדים × 750 ש"ח = <strong id="creg-total-price" style="color:#1a2640;">750 ש"ח</strong></span>
          </div>
        </div>

        <div id="creg-err-1" style="display:none;color:#dc2626;font-size:0.82rem;margin-top:8px;"></div>
        <div style="margin-top:1.5rem;display:flex;justify-content:flex-start;">
          <button onclick="collegeReg.nextStep()" class="btn btn-primary" style="min-width:140px;">
            המשך <i class="ph ph-arrow-left"></i>
          </button>
        </div>
      </div>

      <!-- STEP 2: Logistics -->
      <div id="creg-step-2" class="creg-step" style="display:none;">
        <h3 style="font-size:1.05rem;font-weight:700;color:#1a2640;margin-bottom:6px;">העדפות לוגיסטיות</h3>
        <p style="font-size:0.88rem;color:#6b7a99;margin-bottom:1.5rem;">בחרו מיקום ולוח זמנים מועדפים</p>

        <!-- Location -->
        <div style="margin-bottom:1.5rem;">
          <div style="font-size:0.88rem;font-weight:700;color:#1a2640;margin-bottom:10px;">
            <i class="ph ph-map-pin" style="color:#1a5faa;margin-left:4px;"></i>מיקום הקורס
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div id="creg-loc-beer_sheva" onclick="collegeReg.selectLocation('beer_sheva')" style="
              border:2px solid #dde4f0;border-radius:12px;padding:1rem;text-align:center;
              cursor:pointer;transition:all 0.2s;
            ">
              <div style="font-size:1.4rem;margin-bottom:6px;">🏜️</div>
              <div style="font-weight:700;color:#1a2640;font-size:0.95rem;">באר שבע</div>
              <div style="font-size:0.75rem;color:#6b7a99;margin-top:2px;">מרכז ההכשרה הדרומי</div>
            </div>
            <div id="creg-loc-tel_aviv" onclick="collegeReg.selectLocation('tel_aviv')" style="
              border:2px solid #dde4f0;border-radius:12px;padding:1rem;text-align:center;
              cursor:pointer;transition:all 0.2s;
            ">
              <div style="font-size:1.4rem;margin-bottom:6px;">🏙️</div>
              <div style="font-weight:700;color:#1a2640;font-size:0.95rem;">תל אביב</div>
              <div style="font-size:0.75rem;color:#6b7a99;margin-top:2px;">מרכז ההכשרה הצפוני</div>
            </div>
          </div>
        </div>

        <!-- Schedule -->
        <div style="margin-bottom:1.5rem;">
          <div style="font-size:0.88rem;font-weight:700;color:#1a2640;margin-bottom:10px;">
            <i class="ph ph-clock" style="color:#1a5faa;margin-left:4px;"></i>לוח זמנים
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div id="creg-sch-morning" onclick="collegeReg.selectSchedule('morning')" style="
              border:2px solid #dde4f0;border-radius:12px;padding:1rem;text-align:center;
              cursor:pointer;transition:all 0.2s;
            ">
              <div style="font-size:1.4rem;margin-bottom:6px;">🌅</div>
              <div style="font-weight:700;color:#1a2640;font-size:0.95rem;">מסלול בוקר</div>
              <div style="font-size:0.75rem;color:#6b7a99;margin-top:2px;">08:00 – 12:00</div>
            </div>
            <div id="creg-sch-evening" onclick="collegeReg.selectSchedule('evening')" style="
              border:2px solid #dde4f0;border-radius:12px;padding:1rem;text-align:center;
              cursor:pointer;transition:all 0.2s;
            ">
              <div style="font-size:1.4rem;margin-bottom:6px;">🌆</div>
              <div style="font-weight:700;color:#1a2640;font-size:0.95rem;">מסלול ערב</div>
              <div style="font-size:0.75rem;color:#6b7a99;margin-top:2px;">17:00 – 21:00</div>
            </div>
          </div>
        </div>

        <!-- Contact details -->
        <div style="margin-bottom:1rem;">
          <div style="font-size:0.88rem;font-weight:700;color:#1a2640;margin-bottom:10px;">
            <i class="ph ph-user" style="color:#1a5faa;margin-left:4px;"></i>פרטי התקשרות
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <input id="creg-name" type="text" placeholder="שם מלא *" value="" oninput="regState.fullName=this.value" style="
              padding:0.7rem 1rem;border:1.5px solid #dde4f0;border-radius:10px;
              font-family:'Heebo',sans-serif;font-size:0.9rem;color:#1a2640;
              background:#fff;outline:none;transition:border 0.15s;width:100%;
            " onfocus="this.style.borderColor='#1a5faa'" onblur="this.style.borderColor='#dde4f0'">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <input id="creg-phone" type="tel" placeholder="טלפון *" dir="ltr" oninput="regState.phone=this.value" style="
                padding:0.7rem 1rem;border:1.5px solid #dde4f0;border-radius:10px;
                font-family:'Heebo',sans-serif;font-size:0.9rem;color:#1a2640;
                background:#fff;outline:none;transition:border 0.15s;width:100%;
              " onfocus="this.style.borderColor='#1a5faa'" onblur="this.style.borderColor='#dde4f0'">
              <input id="creg-email" type="email" placeholder="אימייל *" dir="ltr" oninput="regState.email=this.value" style="
                padding:0.7rem 1rem;border:1.5px solid #dde4f0;border-radius:10px;
                font-family:'Heebo',sans-serif;font-size:0.9rem;color:#1a2640;
                background:#fff;outline:none;transition:border 0.15s;width:100%;
              " onfocus="this.style.borderColor='#1a5faa'" onblur="this.style.borderColor='#dde4f0'">
            </div>
          </div>
        </div>

        <div id="creg-err-2" style="display:none;color:#dc2626;font-size:0.82rem;margin-top:4px;"></div>
        <div style="margin-top:1.25rem;display:flex;justify-content:space-between;gap:10px;">
          <button onclick="collegeReg.prevStep()" style="
            background:none;border:1.5px solid #dde4f0;border-radius:10px;
            padding:0.7rem 1.2rem;cursor:pointer;font-family:'Heebo',sans-serif;
            font-size:0.9rem;color:#6b7a99;transition:all 0.15s;
          ">← חזרה</button>
          <button onclick="collegeReg.nextStep()" class="btn btn-primary" style="min-width:140px;">
            המשך <i class="ph ph-arrow-left"></i>
          </button>
        </div>
      </div>

      <!-- STEP 3: Time Window + Urgency -->
      <div id="creg-step-3" class="creg-step" style="display:none;">
        <h3 style="font-size:1.05rem;font-weight:700;color:#1a2640;margin-bottom:6px;">תיאום ציפיות ומועדים</h3>
        <p style="font-size:0.88rem;color:#6b7a99;margin-bottom:1.25rem;">בחרו את חלון הזמן המועדף לתחילת הקורס</p>

        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:1.25rem;">
          <div id="creg-win-may_jun" onclick="collegeReg.selectWindow('may_jun')" style="
            border:2px solid #dde4f0;border-radius:12px;padding:0.9rem 1.1rem;
            cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:12px;
          ">
            <div style="width:40px;height:40px;border-radius:10px;background:#eaf0f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <i class="ph ph-calendar" style="color:#1a5faa;font-size:1.2rem;"></i>
            </div>
            <div>
              <div style="font-weight:700;color:#1a2640;">מאי – יוני 2025</div>
              <div style="font-size:0.78rem;color:#6b7a99;">הסבב הקרוב ביותר</div>
            </div>
            <div id="creg-win-check-may_jun" style="display:none;color:#1a5faa;font-size:1.2rem;margin-right:auto;"><i class="ph ph-check-circle-fill"></i></div>
          </div>

          <div id="creg-win-jun_jul" onclick="collegeReg.selectWindow('jun_jul')" style="
            border:2px solid #dde4f0;border-radius:12px;padding:0.9rem 1.1rem;
            cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:12px;
          ">
            <div style="width:40px;height:40px;border-radius:10px;background:#fdf4e7;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <i class="ph ph-calendar" style="color:#c47c00;font-size:1.2rem;"></i>
            </div>
            <div>
              <div style="font-weight:700;color:#1a2640;">יוני – יולי 2025</div>
              <div style="font-size:0.78rem;color:#6b7a99;">הסבב השני</div>
            </div>
            <div id="creg-win-check-jun_jul" style="display:none;color:#1a5faa;font-size:1.2rem;margin-right:auto;"><i class="ph ph-check-circle-fill"></i></div>
          </div>

          <div id="creg-win-aug_sep" onclick="collegeReg.selectWindow('aug_sep')" style="
            border:2px solid #dde4f0;border-radius:12px;padding:0.9rem 1.1rem;
            cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:12px;
          ">
            <div style="width:40px;height:40px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <i class="ph ph-calendar" style="color:#16a34a;font-size:1.2rem;"></i>
            </div>
            <div>
              <div style="font-weight:700;color:#1a2640;">אוגוסט – ספטמבר 2025</div>
              <div style="font-size:0.78rem;color:#6b7a99;">הסבב השלישי</div>
            </div>
            <div id="creg-win-check-aug_sep" style="display:none;color:#1a5faa;font-size:1.2rem;margin-right:auto;"><i class="ph ph-check-circle-fill"></i></div>
          </div>
        </div>

        <!-- Urgency badge -->
        <div id="creg-urgency-badge" style="
          display:none;padding:0.85rem 1.1rem;border-radius:12px;
          border:1.5px solid #fca5a5;background:#fff5f5;
          display:flex;align-items:center;gap:10px;margin-bottom:1rem;
        ">
          <i class="ph ph-warning-circle" style="color:#dc2626;font-size:1.3rem;flex-shrink:0;"></i>
          <span id="creg-urgency-text" style="font-size:0.88rem;font-weight:600;color:#dc2626;"></span>
        </div>

        <div id="creg-err-3" style="display:none;color:#dc2626;font-size:0.82rem;margin-top:4px;"></div>
        <div style="margin-top:1.25rem;display:flex;justify-content:space-between;gap:10px;">
          <button onclick="collegeReg.prevStep()" style="
            background:none;border:1.5px solid #dde4f0;border-radius:10px;
            padding:0.7rem 1.2rem;cursor:pointer;font-family:'Heebo',sans-serif;
            font-size:0.9rem;color:#6b7a99;transition:all 0.15s;
          ">← חזרה</button>
          <button onclick="collegeReg.nextStep()" class="btn btn-primary" style="min-width:140px;">
            המשך <i class="ph ph-arrow-left"></i>
          </button>
        </div>
      </div>

      <!-- STEP 4: Documents + Signature -->
      <div id="creg-step-4" class="creg-step" style="display:none;">
        <h3 style="font-size:1.05rem;font-weight:700;color:#1a2640;margin-bottom:6px;">מסמכים וחתימה דיגיטלית</h3>
        <p style="font-size:0.88rem;color:#6b7a99;margin-bottom:1.25rem;">יש לקרוא ולחתום על שני המסמכים להמשך</p>

        <!-- Doc 1: Health Declaration -->
        <div style="border:1.5px solid #dde4f0;border-radius:14px;overflow:hidden;margin-bottom:1rem;">
          <div onclick="collegeReg.toggleDoc('health')" style="
            padding:0.9rem 1.1rem;background:#f7f9fd;cursor:pointer;
            display:flex;align-items:center;justify-content:space-between;
          ">
            <div style="display:flex;align-items:center;gap:10px;">
              <i class="ph ph-heart-pulse" style="color:#1a5faa;font-size:1.2rem;"></i>
              <span style="font-weight:700;color:#1a2640;font-size:0.92rem;">הצהרת בריאות ואחריות</span>
              <span id="creg-health-badge" style="
                display:none;background:#dcfce7;color:#16a34a;border:1px solid #86efac;
                border-radius:20px;padding:1px 8px;font-size:0.7rem;font-weight:700;
              ">חתום ✓</span>
            </div>
            <i id="creg-health-arrow" class="ph ph-caret-down" style="color:#6b7a99;transition:transform 0.2s;"></i>
          </div>
          <div id="creg-doc-health" style="display:none;padding:1.1rem;border-top:1px solid #e8eef8;">
            <div style="
              background:#f7f9fd;border-radius:10px;padding:1rem;margin-bottom:1rem;
              font-size:0.83rem;color:#1a2640;line-height:1.8;max-height:150px;overflow-y:auto;
            ">
              <strong>חלק א׳ — שאלון רפואי</strong><br><br>
              1. האם הרופא שלך אמר לך שאתה סובל ממחלת לב?<br>
              2. האם אתה חש כאבים בחזה בזמן מנוחה?<br>
              3. האם אתה חש כאבים בחזה במהלך פעילויות שגרה ביום-יום?<br>
              4. האם אתה חש כאבים בחזה בזמן פעילות גופנית?<br>
              5. האם במהלך השנה החולפת איבדת שיווי משקל עקב סחרחורת?<br>
              6. האם במהלך השנה החולפת איבדת את הכרתך?<br>
              7. האם הרופא אבחן אסתמה — נזקקת לטיפול תרופתי בשלושת החודשים האחרונים?<br>
              8. האם הרופא אבחן אסתמה — סבלת מקוצר נשימה או צפצופים?<br>
              9. האם בן/בת משפחה מדרגה ראשונה נפטר ממחלת לב?<br>
              10. האם בן/בת משפחה מדרגה ראשונה נפטר ממוות פתאומי בגיל מוקדם?<br>
              11. האם הרופא שלך אמר לך לבצע פעילות גופנית רק תחת השגחה רפואית?<br>
              12. האם אתה סובל ממחלה כרונית שעשויה להגביל אותך בביצוע פעילות גופנית?<br>
              13. לנשים בהריון: האם ההיריון הוגדר כהיריון בסיכון?<br><br>
              <strong>חלק ב׳ — הצהרה</strong><br><br>
              אני החתום מטה מצהיר כי קראתי והבנתי את כל השאלון הרפואי שבחלק א׳ וכל התשובות לשאלות הן שליליות. אני מצהיר כי מסרתי ידיעות מלאות ונכונות על מצבי הרפואי בעבר ובהווה. ידוע לי כי לאחר שנתיים מיום חתימתי אדרש להמציא הצהרת בריאות חדשה.
            </div>
            <div style="font-size:0.82rem;font-weight:600;color:#1a2640;margin-bottom:8px;">חתמו כאן:</div>
            <canvas id="creg-canvas-health" width="500" height="120" style="
              border:1.5px solid #dde4f0;border-radius:10px;cursor:crosshair;
              width:100%;max-width:500px;touch-action:none;display:block;background:#fff;
            "></canvas>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
              <button onclick="collegeReg.clearSignature('health')" style="
                background:none;border:1px solid #dde4f0;border-radius:7px;
                padding:4px 12px;font-family:'Heebo',sans-serif;font-size:0.78rem;
                color:#6b7a99;cursor:pointer;
              ">נקה</button>
              <span id="creg-health-status" style="font-size:0.78rem;color:#6b7a99;">חתמו בתיבה למעלה</span>
            </div>
          </div>
        </div>

        <!-- Doc 2: Study Regulations -->
        <div style="border:1.5px solid #dde4f0;border-radius:14px;overflow:hidden;margin-bottom:1rem;">
          <div onclick="collegeReg.toggleDoc('regulations')" style="
            padding:0.9rem 1.1rem;background:#f7f9fd;cursor:pointer;
            display:flex;align-items:center;justify-content:space-between;
          ">
            <div style="display:flex;align-items:center;gap:10px;">
              <i class="ph ph-scroll" style="color:#1a5faa;font-size:1.2rem;"></i>
              <span style="font-weight:700;color:#1a2640;font-size:0.92rem;">תקנון לימודים ותנאי ביטול</span>
              <span id="creg-regs-badge" style="
                display:none;background:#dcfce7;color:#16a34a;border:1px solid #86efac;
                border-radius:20px;padding:1px 8px;font-size:0.7rem;font-weight:700;
              ">חתום ✓</span>
            </div>
            <i id="creg-regs-arrow" class="ph ph-caret-down" style="color:#6b7a99;transition:transform 0.2s;"></i>
          </div>
          <div id="creg-doc-regulations" style="display:none;padding:1.1rem;border-top:1px solid #e8eef8;">
            <div style="
              background:#f7f9fd;border-radius:10px;padding:1rem;margin-bottom:1rem;
              font-size:0.83rem;color:#1a2640;line-height:1.8;max-height:150px;overflow-y:auto;
            ">
              <strong>תקנון לימודים והתנהגות – מכללת ALUM-IL</strong><br><br>
              <strong>1. חובות נוכחות ועמידה במטלות</strong><br>
              הסטודנט מתחייב לנוכחות של 85% לפחות משעות הקורס (תיאוריה, סדנה ושטח). מובהר כי אי-הגעה למפגשי סדנה או ימי שטח, המהווים ליבת ההכשרה המעשית, תיחשב כאי-עמידה בתנאי הקורס ועשויה להוביל לאי-זכאות לתעודה, ללא החזר כספי.<br>
              עמידה במבחן המעשי ובמבחן העיוני בסיום הקורס היא תנאי הכרחי לקבלת תעודת "מתקין מוסמך".<br>
              אי-הגעה לימי שטח או סדנאות מעשיות עלולה להוביל לפסילה מהמשך הקורס, בשל חשיבות ההתנסות המעשית המהווה את עיקר שעות הלימוד.<br><br>
              <strong>2. מדיניות ביטולים והחזרים כספיים</strong><br>
              כל סטודנט חייב בדמי הרשמה וביטוח של 399 ש"ח.<br>
              הסטודנט רשאי לבטל בתוך 14 ימים מיום עשיית ההסכם, בתנאי שהביטול נעשה לפחות 14 ימי עסקים לפני תחילת הקורס. ביטול הרשמה עד 14 ימי עסקים לפני מועד פתיחת הקורס יזכה בהחזר מלא, למעט דמי רישום בסך 399 ש"ח.<br>
              ביטול בטווח של פחות מ-7 ימי עסקים לפני פתיחת הקורס יגרור דמי ביטול בסך 25% מעלות הקורס.<br>
              לאחר המפגש השני של הקורס, לא יינתן כל החזר כספי בגין הפסקת לימודים מכל סיבה שהיא.<br><br>
              <strong>3. בטיחות וציוד מגן</strong><br>
              חלה חובה להגיע לכל המפגשים (ובפרט לסדנאות ולימי השטח) עם נעלי עבודה סגורות וציוד מגן אישי כפי שיוגדר על ידי המדריך.<br>
              המכללה שומרת לעצמה את הזכות להרחיק סטודנט מהשיעור במידה ואינו פועל בהתאם להוראות הבטיחות בנוגע לטיפול בזכוכית, חשמל או עבודה בגובה.<br><br>
              <strong>4. קניין רוחני וסודיות</strong><br>
              כל חומרי הלימוד, הסילבוסים, שיטות העבודה הייחודיות והתוכניות המקצועיות של ALUM-IL הם רכוש החברה בלבד.<br>
              חל איסור מוחלט על הקלטה, צילום או הפצה של תכני הקורס לצד ג' ללא אישור מראש ובכתב מטעם הנהלת המכללה.<br><br>
              <strong>5. אחריות מקצועית</strong><br>
              תעודת הגמר מעידה על סיום הכשרה ומעבר בחינה בלבד. המכללה ומי מטעמה אינם אחראים לטיב העבודה שיבצע הסטודנט באופן עצמאי מחוץ למסגרת הלימודים או לנזקים שייגרמו לצד ג'.<br>
              ההכשרה הניתנת במכללה היא לימודית בלבד. המכללה אינה נושאת באחריות מקצועית או משפטית לכל פעולה, התקנה או עבודה שיבצע הסטודנט באופן עצמאי או עבור צד ג', ואין בתעודת הגמר משום הסמכה לביצוע עבודות הדורשות.<br><br>
              <strong>6. זכות המכללה לשינויים וביטולים</strong><br>
              <strong>פתיחת הקורס:</strong> פתיחת כל קורס מותנית במספר מינימלי של נרשמים. המכללה שומרת לעצמה את הזכות לדחות את מועד פתיחת הקורס או לבטלו במידה ולא נרשמו מספיק סטודנטים. במקרה של ביטול קורס על ידי המכללה, יושבו לסטודנט כל הכספים ששולמו על ידו, כולל דמי הרישום.<br>
              <strong>שינויים במהלך הקורס:</strong> המכללה רשאית לבצע שינויים בלוח הזמנים, במיקום השיעורים (בטווח סביר) ובזהות המרצים, וזאת משיקולים מקצועיים, פדגוגיים או במקרים של כוח עליון. הודעה על שינויים תימסר לסטודנטים זמן סביר מראש.<br>
              <strong>הפסקת לימודים יזומה:</strong> המכללה שומרת לעצמה את הזכות להפסיק את לימודיו של סטודנט בגין התנהגות שאינה הולמת, הפרת משמעת חמורה, אי-תשלום שכר לימוד או אי-עמידה בדרישות הבטיחות, וזאת לאחר שניתנה לסטודנט הזדמנות להשמיע את טענותיו.<br><br>
              אני מאשר כי קראתי את התקנון ואני מסכים לכל תנאיו.
            </div>
            <div style="font-size:0.82rem;font-weight:600;color:#1a2640;margin-bottom:8px;">חתמו כאן:</div>
            <canvas id="creg-canvas-regulations" width="500" height="120" style="
              border:1.5px solid #dde4f0;border-radius:10px;cursor:crosshair;
              width:100%;max-width:500px;touch-action:none;display:block;background:#fff;
            "></canvas>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
              <button onclick="collegeReg.clearSignature('regulations')" style="
                background:none;border:1px solid #dde4f0;border-radius:7px;
                padding:4px 12px;font-family:'Heebo',sans-serif;font-size:0.78rem;
                color:#6b7a99;cursor:pointer;
              ">נקה</button>
              <span id="creg-regs-status" style="font-size:0.78rem;color:#6b7a99;">חתמו בתיבה למעלה</span>
            </div>
          </div>
        </div>

        <div id="creg-err-4" style="display:none;color:#dc2626;font-size:0.82rem;margin-bottom:8px;padding:8px 12px;background:#fff5f5;border-radius:8px;border:1px solid #fca5a5;"></div>
        <div style="margin-top:0.5rem;display:flex;justify-content:space-between;gap:10px;">
          <button onclick="collegeReg.prevStep()" style="
            background:none;border:1.5px solid #dde4f0;border-radius:10px;
            padding:0.7rem 1.2rem;cursor:pointer;font-family:'Heebo',sans-serif;
            font-size:0.9rem;color:#6b7a99;transition:all 0.15s;
          ">← חזרה</button>
          <button onclick="collegeReg.nextStep()" class="btn btn-primary" style="min-width:160px;">
            המשך לתשלום <i class="ph ph-arrow-left"></i>
          </button>
        </div>
      </div>

      <!-- STEP 5: Payment -->
      <div id="creg-step-5" class="creg-step" style="display:none;">
        <h3 style="font-size:1.05rem;font-weight:700;color:#1a2640;margin-bottom:6px;">תשלום וסגירת רישום</h3>
        <p style="font-size:0.88rem;color:#6b7a99;margin-bottom:1.25rem;">סיכום פרטי הרישום שלכם</p>

        <!-- Summary -->
        <div style="
          background:#f7f9fd;border-radius:14px;padding:1.1rem 1.25rem;
          margin-bottom:1.25rem;border:1.5px solid #e8eef8;
        ">
          <div style="font-size:0.82rem;font-weight:700;color:#6b7a99;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">סיכום רישום</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.88rem;color:#6b7a99;">שם</span>
              <span id="creg-sum-name" style="font-size:0.9rem;font-weight:600;color:#1a2640;">—</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.88rem;color:#6b7a99;">סוג מסלול</span>
              <span id="creg-sum-type" style="font-size:0.9rem;font-weight:600;color:#1a2640;">—</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.88rem;color:#6b7a99;">מיקום</span>
              <span id="creg-sum-location" style="font-size:0.9rem;font-weight:600;color:#1a2640;">—</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.88rem;color:#6b7a99;">לוח זמנים</span>
              <span id="creg-sum-schedule" style="font-size:0.9rem;font-weight:600;color:#1a2640;">—</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.88rem;color:#6b7a99;">חלון זמן</span>
              <span id="creg-sum-window" style="font-size:0.9rem;font-weight:600;color:#1a2640;">—</span>
            </div>
            <div style="border-top:1px solid #dde4f0;margin-top:4px;padding-top:10px;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:0.92rem;font-weight:700;color:#1a2640;">סך לתשלום</span>
              <span id="creg-sum-total" style="font-size:1.1rem;font-weight:800;color:#1a5faa;">₪750</span>
            </div>
          </div>
        </div>

        <!-- Security note -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:1.25rem;padding:10px 12px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
          <i class="ph ph-lock" style="color:#16a34a;font-size:1.1rem;flex-shrink:0;"></i>
          <span style="font-size:0.8rem;color:#166534;">תשלום מאובטח SSL. כולל ביטוח תאונות אישיות לכל משך ההכשרה.</span>
        </div>

        <div id="creg-err-5" style="display:none;color:#dc2626;font-size:0.82rem;margin-bottom:8px;"></div>

        <button id="creg-pay-btn" onclick="collegeReg.submitPayment()" class="btn btn-primary" style="width:100%;font-size:1rem;padding:0.9rem;">
          <i class="ph ph-credit-card"></i> שלם ₪<span id="creg-pay-amount">750</span> — דמי רישום וביטוח
        </button>

        <div style="margin-top:0.75rem;">
          <button onclick="collegeReg.prevStep()" style="
            background:none;border:none;cursor:pointer;font-family:'Heebo',sans-serif;
            font-size:0.85rem;color:#6b7a99;text-decoration:underline;
          ">← חזרה לחתימות</button>
        </div>
      </div>

      <!-- SUCCESS SCREEN -->
      <div id="creg-step-success" class="creg-step" style="display:none;text-align:center;padding:1rem 0;">
        <div style="
          width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#15803d);
          display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;
          box-shadow:0 8px 24px rgba(22,163,74,0.3);animation:cregSuccessPop 0.4s ease;
        ">
          <i class="ph ph-check-bold" style="color:#fff;font-size:2rem;"></i>
        </div>
        <h3 style="font-size:1.25rem;font-weight:800;color:#1a2640;margin-bottom:8px;">הרישום הושלם בהצלחה!</h3>
        <p style="font-size:0.9rem;color:#6b7a99;margin-bottom:1.5rem;">
          ברוכים הבאים למכללת ALUM-IL.<br>תוך מספר דקות תקבלו הודעת WhatsApp עם דף ההכנה לסטודנט.
        </p>

        <!-- Prep checklist -->
        <div style="
          background:#f7f9fd;border-radius:14px;padding:1.1rem 1.25rem;
          text-align:right;margin-bottom:1.5rem;border:1.5px solid #e8eef8;
        ">
          <div style="font-size:0.82rem;font-weight:700;color:#6b7a99;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
            <i class="ph ph-clipboard-text" style="color:#1a5faa;margin-left:4px;"></i>מה להביא לקורס
          </div>
          ${['נעלי עבודה בטיחותיות (S1P לפחות) — חובה', 'מטר אישי', 'תעודת זהות', 'בגדי עבודה נוחים', 'בקבוק מים אישי'].map(item => `
            <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #e8eef8;">
              <i class="ph ph-check-circle" style="color:#16a34a;font-size:1rem;flex-shrink:0;"></i>
              <span style="font-size:0.85rem;color:#1a2640;">${item}</span>
            </div>
          `).join('')}
        </div>

        <button onclick="collegeReg.closeModal()" class="btn btn-primary" style="min-width:160px;">
          <i class="ph ph-house"></i> חזרה לדשבורד
        </button>
      </div>

    </div><!-- /steps container -->
  </div><!-- /modal -->
</div><!-- /overlay -->

<style>
@keyframes cregFadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes cregSuccessPop { from { transform:scale(0.5);opacity:0; } to { transform:scale(1);opacity:1; } }
@keyframes cregPulse {
  0%,100% { box-shadow:0 0 0 0 rgba(220,38,38,0.4); }
  50% { box-shadow:0 0 0 6px rgba(220,38,38,0); }
}
.creg-urgency-pulse { animation: cregPulse 1.8s infinite; }
.creg-selected-card {
  border-color: #1a5faa !important;
  background: #f0f6ff !important;
  box-shadow: 0 0 0 3px rgba(26,95,170,0.12);
}
.creg-selected-toggle {
  border-color: #1a5faa !important;
  background: #1a5faa !important;
  color: #fff !important;
}
.creg-selected-toggle * { color: #fff !important; }
</style>
`;
}

/* ══════════════════════════════════════════
   INIT — bind canvas + events
══════════════════════════════════════════ */
export function initCollegeRegistration() {
  // Will be called after modal is injected into DOM
  setTimeout(() => {
    bindCanvas('health');
    bindCanvas('regulations');
  }, 100);
}

function bindCanvas(docType) {
  const canvas = document.getElementById(`creg-canvas-${docType}`);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let drawing = false;
  let lastX = 0, lastY = 0;

  // Resize canvas to actual CSS size
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { scaleX, scaleY };
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const { scaleX, scaleY } = resizeCanvas();
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    const { x, y } = getPos(e);
    lastX = x; lastY = y;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#1a2640';
    ctx.fill();
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1a2640';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastX = x; lastY = y;
  }

  function stopDraw(e) {
    if (!drawing) return;
    drawing = false;
    // Save signature
    const data = canvas.toDataURL('image/png');
    if (docType === 'health') {
      regState.healthSigData = data;
      regState.healthSigned = true;
      const badge = document.getElementById('creg-health-badge');
      const status = document.getElementById('creg-health-status');
      if (badge) badge.style.display = 'inline';
      if (status) { status.textContent = 'חתימה נשמרה ✓'; status.style.color = '#16a34a'; }
    } else {
      regState.regulationsSigData = data;
      regState.regulationsSigned = true;
      const badge = document.getElementById('creg-regs-badge');
      const status = document.getElementById('creg-regs-status');
      if (badge) badge.style.display = 'inline';
      if (status) { status.textContent = 'חתימה נשמרה ✓'; status.style.color = '#16a34a'; }
    }
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDraw);
}

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const typeLabels = { new: 'חדש ללא ניסיון', veteran: "מתקין ותיק — הסמכת 'חבר אלום'", employer: 'מעסיק' };
const locationLabels = { beer_sheva: 'באר שבע', tel_aviv: 'תל אביב' };
const scheduleLabels = { morning: 'בוקר (08:00–12:00)', evening: 'ערב (17:00–21:00)' };
const windowLabels = { may_jun: 'מאי–יוני 2025', jun_jul: 'יוני–יולי 2025', aug_sep: 'אוגוסט–ספטמבר 2025' };

function updateProgress(step) {
  const labels = ['', 'זיהוי מועמד', 'העדפות', 'תיאום מועדים', 'מסמכים', 'תשלום'];
  const labelEl = document.getElementById('creg-step-label');
  if (labelEl) labelEl.textContent = `שלב ${step} מתוך 5 — ${labels[step] || ''}`;

  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById(`creg-step-dot-${i}`);
    if (!dot) continue;
    if (i < step) {
      dot.style.borderColor = '#1a5faa';
      dot.style.background = '#1a5faa';
      dot.style.color = '#fff';
      dot.innerHTML = '<i class="ph ph-check-bold" style="font-size:0.75rem;"></i>';
      dot.style.boxShadow = 'none';
    } else if (i === step) {
      dot.style.borderColor = '#1a5faa';
      dot.style.background = '#1a5faa';
      dot.style.color = '#fff';
      dot.innerHTML = String(i);
      dot.style.boxShadow = '0 0 0 3px rgba(26,95,170,0.15)';
    } else {
      dot.style.borderColor = '#dde4f0';
      dot.style.background = '#fff';
      dot.style.color = '#6b7a99';
      dot.innerHTML = String(i);
      dot.style.boxShadow = 'none';
    }
  }
  for (let i = 1; i <= 4; i++) {
    const line = document.getElementById(`creg-line-${i}`);
    if (line) line.style.background = i < step ? '#1a5faa' : '#dde4f0';
  }
}

function showStep(step) {
  document.querySelectorAll('.creg-step').forEach(el => el.style.display = 'none');
  const el = document.getElementById(`creg-step-${step}`);
  if (el) {
    el.style.display = 'block';
    el.style.animation = 'cregFadeIn 0.2s ease';
  }
  updateProgress(step);
  regState.step = step;
}

function setError(step, msg) {
  const el = document.getElementById(`creg-err-${step}`);
  if (!el) return;
  if (msg) { el.textContent = msg; el.style.display = 'block'; }
  else el.style.display = 'none';
}

/* ══════════════════════════════════════════
   SUPABASE SAVE
   — WhatsApp webhook is fired automatically by
     the Supabase trigger on registrations INSERT.
══════════════════════════════════════════ */
async function saveToSupabase() {
  const { data: { user } } = await supabase.auth.getUser();

  const paymentRef = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  regState.paymentRef = paymentRef;

  const totalAmount = regState.candidateType === 'employer'
    ? regState.employeeCount * 750
    : 750;

  // Insert student — uses experience_level to match the live Supabase schema
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .insert([{
      user_id: user?.id || null,
      full_name: regState.fullName,
      phone: regState.phone,
      email: regState.email,
      experience_level: regState.candidateType,   // 'new' | 'veteran' | 'employer'
      location: regState.location,
      schedule: regState.schedule,
      time_window: regState.timeWindow,
      employee_count: regState.employeeCount,
      health_declaration_signed: regState.healthSigned,
      regulations_signed: regState.regulationsSigned,
      health_signature_data: regState.healthSigData,
      regulations_signature_data: regState.regulationsSigData,
      payment_status: 'paid',
      payment_amount: totalAmount,
      payment_ref: paymentRef,
      status: 'registered'
    }])
    .select()
    .single();

  if (studentErr) throw studentErr;

  // INSERT triggers the Supabase Edge Function → WhatsApp message sent automatically
  const { error: regErr } = await supabase.from('registrations').insert([{
    student_id: student.id,
    cycle_id: `cycle-${regState.timeWindow}-${regState.location}`,
    location: regState.location,
    schedule: regState.schedule,
    price: totalAmount,
    status: 'registered'
  }]);

  if (regErr) throw regErr;

  return student;
}

/* ══════════════════════════════════════════
   GLOBAL collegeReg API
══════════════════════════════════════════ */
window.collegeReg = {

  closeModal() {
    const overlay = document.getElementById('creg-overlay');
    if (overlay) {
      overlay.style.animation = 'none';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s';
      setTimeout(() => overlay.remove(), 200);
    }
  },

  selectType(type) {
    regState.candidateType = type;
    ['new', 'veteran', 'employer'].forEach(t => {
      const card = document.getElementById(`creg-card-${t}`);
      const check = document.getElementById(`creg-check-${t}`);
      if (!card) return;
      if (t === type) {
        card.classList.add('creg-selected-card');
        if (check) check.style.display = 'block';
      } else {
        card.classList.remove('creg-selected-card');
        card.style.borderColor = '#dde4f0';
        if (check) check.style.display = 'none';
      }
    });
    const counter = document.getElementById('creg-employee-counter');
    if (counter) counter.style.display = type === 'employer' ? 'block' : 'none';
    setError(1, '');
  },

  changeCount(delta) {
    regState.employeeCount = Math.min(10, Math.max(1, regState.employeeCount + delta));
    const display = document.getElementById('creg-count-display');
    const total = document.getElementById('creg-total-price');
    const payAmount = document.getElementById('creg-pay-amount');
    if (display) display.textContent = regState.employeeCount;
    if (total) total.textContent = `${regState.employeeCount * 750} ש"ח`;
    if (payAmount) payAmount.textContent = regState.employeeCount * 750;
  },

  selectLocation(loc) {
    regState.location = loc;
    ['beer_sheva', 'tel_aviv'].forEach(l => {
      const el = document.getElementById(`creg-loc-${l}`);
      if (!el) return;
      if (l === loc) {
        el.classList.add('creg-selected-card');
      } else {
        el.classList.remove('creg-selected-card');
        el.style.borderColor = '#dde4f0';
        el.style.background = '#fff';
      }
    });
    setError(2, '');
  },

  selectSchedule(sch) {
    regState.schedule = sch;
    ['morning', 'evening'].forEach(s => {
      const el = document.getElementById(`creg-sch-${s}`);
      if (!el) return;
      if (s === sch) {
        el.classList.add('creg-selected-card');
      } else {
        el.classList.remove('creg-selected-card');
        el.style.borderColor = '#dde4f0';
        el.style.background = '#fff';
      }
    });
    setError(2, '');
  },

  selectWindow(win) {
    regState.timeWindow = win;
    ['may_jun', 'jun_jul', 'aug_sep'].forEach(w => {
      const el = document.getElementById(`creg-win-${w}`);
      const check = document.getElementById(`creg-win-check-${w}`);
      if (!el) return;
      if (w === win) {
        el.classList.add('creg-selected-card');
        if (check) check.style.display = 'block';
      } else {
        el.classList.remove('creg-selected-card');
        el.style.borderColor = '#dde4f0';
        el.style.background = '#fff';
        if (check) check.style.display = 'none';
      }
    });

    // Update urgency badge
    const urgency = getUrgency();
    const badge = document.getElementById('creg-urgency-badge');
    const text = document.getElementById('creg-urgency-text');
    if (badge && text) {
      badge.style.display = 'flex';
      badge.style.borderColor = urgency.color + '44';
      badge.style.background = urgency.color + '0d';
      text.textContent = urgency.text;
      text.style.color = urgency.color;
      const icon = badge.querySelector('i');
      if (icon) icon.style.color = urgency.color;
      if (urgency.pulse) badge.classList.add('creg-urgency-pulse');
      else badge.classList.remove('creg-urgency-pulse');
    }
    setError(3, '');
  },

  toggleDoc(docType) {
    const content = document.getElementById(`creg-doc-${docType}`);
    const arrow = document.getElementById(`creg-${docType === 'health' ? 'health' : 'regs'}-arrow`);
    if (!content) return;
    const isOpen = content.style.display !== 'none';
    content.style.display = isOpen ? 'none' : 'block';
    if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    // Init canvas when opened
    if (!isOpen) {
      setTimeout(() => bindCanvas(docType), 50);
    }
  },

  clearSignature(docType) {
    const canvas = document.getElementById(`creg-canvas-${docType}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (docType === 'health') {
      regState.healthSigned = false;
      regState.healthSigData = null;
      const badge = document.getElementById('creg-health-badge');
      const status = document.getElementById('creg-health-status');
      if (badge) badge.style.display = 'none';
      if (status) { status.textContent = 'חתמו בתיבה למעלה'; status.style.color = '#6b7a99'; }
    } else {
      regState.regulationsSigned = false;
      regState.regulationsSigData = null;
      const badge = document.getElementById('creg-regs-badge');
      const status = document.getElementById('creg-regs-status');
      if (badge) badge.style.display = 'none';
      if (status) { status.textContent = 'חתמו בתיבה למעלה'; status.style.color = '#6b7a99'; }
    }
  },

  nextStep() {
    const step = regState.step;

    if (step === 1) {
      if (!regState.candidateType) {
        setError(1, 'יש לבחור את סוג המועמד להמשך.');
        return;
      }
    }

    if (step === 2) {
      regState.fullName = document.getElementById('creg-name')?.value.trim() || '';
      regState.phone    = document.getElementById('creg-phone')?.value.trim() || '';
      regState.email    = document.getElementById('creg-email')?.value.trim() || '';

      if (!regState.location) { setError(2, 'יש לבחור מיקום.'); return; }
      if (!regState.schedule) { setError(2, 'יש לבחור לוח זמנים.'); return; }
      if (!regState.fullName) { setError(2, 'יש להזין שם מלא.'); return; }
      if (!regState.phone)    { setError(2, 'יש להזין מספר טלפון.'); return; }
      if (!regState.email)    { setError(2, 'יש להזין כתובת אימייל.'); return; }
    }

    if (step === 3) {
      if (!regState.timeWindow) {
        setError(3, 'יש לבחור חלון זמן מועדף.');
        return;
      }
    }

    if (step === 4) {
      const missing = [];
      if (!regState.healthSigned) missing.push('הצהרת בריאות');
      if (!regState.regulationsSigned) missing.push('תקנון לימודים');
      if (missing.length) {
        setError(4, `יש לחתום על: ${missing.join(', ')} כדי להמשך.`);
        return;
      }
      // Populate summary
      const totalAmount = regState.candidateType === 'employer'
        ? regState.employeeCount * 750
        : 750;
      const sumName = document.getElementById('creg-sum-name');
      const sumType = document.getElementById('creg-sum-type');
      const sumLoc  = document.getElementById('creg-sum-location');
      const sumSch  = document.getElementById('creg-sum-schedule');
      const sumWin  = document.getElementById('creg-sum-window');
      const sumTot  = document.getElementById('creg-sum-total');
      const payAmt  = document.getElementById('creg-pay-amount');
      if (sumName) sumName.textContent = regState.fullName;
      if (sumType) sumType.textContent = typeLabels[regState.candidateType];
      if (sumLoc)  sumLoc.textContent  = locationLabels[regState.location];
      if (sumSch)  sumSch.textContent  = scheduleLabels[regState.schedule];
      if (sumWin)  sumWin.textContent  = windowLabels[regState.timeWindow];
      if (sumTot)  sumTot.textContent  = `₪${totalAmount}`;
      if (payAmt)  payAmt.textContent  = totalAmount;
    }

    if (step < 5) showStep(step + 1);
  },

  prevStep() {
    if (regState.step > 1) showStep(regState.step - 1);
  },

  async submitPayment() {
    const btn = document.getElementById('creg-pay-btn');
    if (!btn) return;

    // Mock payment — show spinner
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner" style="animation:spin 0.8s linear infinite;display:inline-block;"></i> מעבד תשלום...';

    try {
      // Simulate payment gateway delay (2s)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save to Supabase — triggers Edge Function → WhatsApp automatically
      await saveToSupabase();

      // Show success screen
      document.querySelectorAll('.creg-step').forEach(el => el.style.display = 'none');
      const successEl = document.getElementById('creg-step-success');
      if (successEl) successEl.style.display = 'block';

      // Hide progress bar on success
      const label = document.getElementById('creg-step-label');
      if (label) label.textContent = 'הרישום הושלם!';
      updateProgress(5);

    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-credit-card"></i> שלם ₪<span id="creg-pay-amount">' + (regState.candidateType === 'employer' ? regState.employeeCount * 750 : 750) + '</span> — דמי רישום וביטוח';
      setError(5, 'שגיאה בשמירת הנתונים: ' + err.message + '. אנא נסו שנית.');
    }
  }
};

// CSS spin animation (if not already in stylesheet)
if (!document.getElementById('creg-spin-style')) {
  const style = document.createElement('style');
  style.id = 'creg-spin-style';
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}
