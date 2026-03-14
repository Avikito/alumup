import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://exfdjelwyrspfspcevvm.supabase.co',
  'sb_publishable_6Yb2QjjK9jkDpvAeIZuOxA_g1KEA4ED'
);

/* ── STEP NAVIGATION ── */
window.nextStep = function(step) {
  document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
  document.getElementById('step-' + step).classList.add('active');
  updateIndicators(step);
};

window.prevStep = function(step) {
  document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
  document.getElementById('step-' + step).classList.add('active');
  updateIndicators(step);
};

function updateIndicators(step) {
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById('indicator-' + i);
    if (el) el.classList.toggle('active', i <= step);
  }
}

/* ── REGISTRATION ── */
window.handleRegistration = async function() {
  const errEl = document.getElementById('regError');
  errEl.style.display = 'none';

  const email      = document.getElementById('email').value.trim();
  const password   = document.getElementById('password').value;
  const fullName   = document.getElementById('fullName').value.trim();
  const businessName = document.getElementById('businessName').value.trim();
  const businessId = document.getElementById('businessId').value.trim();
  const phone      = document.getElementById('phone').value.trim();

  const regions    = Array.from(document.querySelectorAll('input[name="regions"]:checked')).map(el => el.value);
  const userTypes  = Array.from(document.querySelectorAll('input[name="userType"]:checked')).map(el => el.value);
  const specialties = Array.from(document.querySelectorAll('input[name="specialty"]:checked')).map(el => el.value);

  if (!email || !password || !fullName || !businessName || !phone) {
    showError('יש למלא את כל השדות החובה.');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'רושם...';

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

    // 2. Save profile data
    const { error: profileError } = await supabase.from('profiles').insert([{
      id: authData.user.id,
      full_name: fullName,
      business_name: businessName,
      business_id: businessId || null,
      phone,
      regions,
      user_type: userTypes,
      specialties,
      status: 'pending'
    }]);
    if (profileError) throw profileError;

    // 3. Success
    window.location.href = 'pending-approval.html';

  } catch (error) {
    showError('שגיאה ברישום: ' + error.message);
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'אישור ופתיחת חשבון <i class="ph ph-check"></i>';
  }
};

function showError(msg) {
  const el = document.getElementById('regError');
  el.textContent = msg;
  el.style.display = 'block';
}
