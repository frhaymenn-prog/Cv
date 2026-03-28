/* ════════════════════════════════════════
   CV MAKER v3 — app.js
════════════════════════════════════════ */
'use strict';

// ── STATE ────────────────────────────────
const state = {
  step: 1,
  total: 5,
  color: '#1a1a2e',
  template: 'classic',
  photo: null,
  experience: [],
  education: [],
};

// ── HELPERS ──────────────────────────────
const $   = id  => document.getElementById(id);
const $$  = sel => document.querySelectorAll(sel);
const val = id  => $(id) ? $(id).value.trim() : '';
const esc = s   => s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';

// Phone validation: starts with 05, 06, 07, 037
const PHONE_RE = /^(05|06|07|037)\d{6,9}$/;

// ── SCREENS ──────────────────────────────
function goScreen(id) {
  const current = document.querySelector('.screen.active');
  const next = $(id);
  if (!next || current === next) return;

  current.classList.add('slide-out');
  setTimeout(() => current.classList.remove('active','slide-out'), 350);

  next.classList.add('active');

  // Refresh list when going to it
  if (id === 'screenList') renderSavedList();
  if (id === 'screenPreview') renderCV();
}
window.goScreen = goScreen; // expose for inline onclick

// ── INIT ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initHome();
  initPhoto();
  initSteps();
  initExperience();
  initEducation();
  initSwatches();
  initTemplates();
  initSaveBtn();
  initPreviewBtn();
  initInputListeners();
  updateBadge();
});

// ── HOME ─────────────────────────────────
function initHome() {
  $('btnNewCV').addEventListener('click', () => {
    goScreen('screenForm');
  });
  $('btnMyCVs').addEventListener('click', () => {
    goScreen('screenList');
  });
}

function updateBadge() {
  try {
    const list = JSON.parse(localStorage.getItem('cv-list') || '[]');
    const badge = $('cvCount');
    if (list.length > 0) {
      badge.textContent = list.length;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } catch {}
}

// ── STEPS ────────────────────────────────
const STEP_TITLES = {
  1: 'المعلومات الشخصية',
  2: 'الخبرة العملية',
  3: 'التعليم',
  4: 'المهارات واللغات',
  5: 'التصميم والحفظ',
};

function initSteps() {
  $('nextBtn').addEventListener('click', nextStep);
  $('prevBtn').addEventListener('click', prevStep);
  updateNavUI();
}

function nextStep() {
  if (state.step === 1) {
    if (!validateStep1()) return;
  }
  if (state.step < state.total) {
    setStep(state.step + 1);
  }
}

function prevStep() {
  if (state.step > 1) setStep(state.step - 1);
}

function setStep(n) {
  const prev = $(`.step[data-step="${state.step}"]`);
  const next = $(`.step[data-step="${n}"]`);
  if (prev) prev.classList.remove('active');
  if (next) next.classList.add('active');
  state.step = n;
  $('stepNum').textContent = n;
  $('formStepTitle').textContent = STEP_TITLES[n] || '';
  $('progressFill').style.width = (n / state.total * 100) + '%';
  updateNavUI();
  // Scroll form body to top
  document.querySelector('.form-body').scrollTop = 0;
}

function updateNavUI() {
  const prev = $('prevBtn');
  const next = $('nextBtn');
  // Prev button
  if (state.step > 1) prev.classList.add('visible');
  else prev.classList.remove('visible');
  // Next button: hide on last step (save box handles it)
  if (state.step === state.total) next.style.display = 'none';
  else next.style.display = 'block';
}

// ── VALIDATION ───────────────────────────
function validateStep1() {
  const name = val('name');
  if (!name) {
    showToast('⚠️ الاسم الكامل مطلوب');
    $('name').focus();
    return false;
  }
  const phone = val('phone');
  if (phone && !PHONE_RE.test(phone.replace(/\s/g,''))) {
    $('phoneError').textContent = '❌ رقم غير صحيح — يجب أن يبدأ بـ 05 أو 06 أو 07 أو 037';
    $('phone').classList.add('invalid');
    $('phone').focus();
    return false;
  }
  return true;
}

function initInputListeners() {
  // Live phone validation
  $('phone').addEventListener('input', () => {
    const v = $('phone').value.trim().replace(/\s/g,'');
    const err = $('phoneError');
    if (!v) {
      err.textContent = '';
      $('phone').classList.remove('valid','invalid');
      return;
    }
    if (PHONE_RE.test(v)) {
      err.textContent = '✅ رقم صحيح';
      err.style.color = '#3cb371';
      $('phone').classList.add('valid');
      $('phone').classList.remove('invalid');
    } else {
      err.textContent = '❌ يجب أن يبدأ بـ 05 أو 06 أو 07 أو 037';
      err.style.color = '';
      $('phone').classList.add('invalid');
      $('phone').classList.remove('valid');
    }
    saveState();
  });

  // All text inputs auto-save
  const ids = ['name','jobTitle','email','location','linkedin','website','summary',
                'techSkills','softSkills','languages','certs'];
  ids.forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('input', saveState);
  });
}

// ── PHOTO ────────────────────────────────
function initPhoto() {
  const area  = $('photoArea');
  const input = $('photoInput');
  area.addEventListener('click', () => input.click());
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      state.photo = ev.target.result;
      const img = $('photoPreviewSmall');
      img.src = state.photo;
      img.classList.add('visible');
      $('photoPlaceholder').style.display = 'none';
      saveState();
      showToast('✅ تم رفع الصورة');
    };
    reader.readAsDataURL(file);
  });
}

// ── EXPERIENCE ───────────────────────────
function initExperience() {
  $('addExpBtn').addEventListener('click', () => {
    state.experience.push({ id: Date.now(), role:'', company:'', from:'', to:'', desc:'' });
    renderExpCards();
    saveState();
  });
}

function renderExpCards() {
  const list = $('experienceList');
  list.innerHTML = '';
  state.experience.forEach((exp, i) => {
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
      <div class="card-header">
        <span class="card-num">خبرة #${i+1}</span>
        <button type="button" class="btn-rm" data-i="${i}">✕</button>
      </div>
      <div class="field">
        <label>المسمى الوظيفي</label>
        <input type="text" value="${esc(exp.role)}" placeholder="مطور ويب" data-f="role" data-i="${i}" />
      </div>
      <div class="field">
        <label>الشركة</label>
        <input type="text" value="${esc(exp.company)}" placeholder="شركة ABC" data-f="company" data-i="${i}" />
      </div>
      <div class="two-col">
        <div class="field"><label>من</label>
          <input type="text" value="${esc(exp.from)}" placeholder="2021" data-f="from" data-i="${i}" /></div>
        <div class="field"><label>إلى</label>
          <input type="text" value="${esc(exp.to)}" placeholder="حتى الآن" data-f="to" data-i="${i}" /></div>
      </div>
      <div class="field">
        <label>الوصف</label>
        <textarea rows="2" placeholder="مهامك ومنجزاتك..." data-f="desc" data-i="${i}">${esc(exp.desc)}</textarea>
      </div>`;

    card.querySelectorAll('[data-f]').forEach(el => {
      el.addEventListener('input', e => {
        state.experience[+e.target.dataset.i][e.target.dataset.f] = e.target.value;
        saveState();
      });
    });
    card.querySelector('.btn-rm').addEventListener('click', e => {
      state.experience.splice(+e.target.dataset.i, 1);
      renderExpCards(); saveState();
    });
    list.appendChild(card);
  });
}

// ── EDUCATION ────────────────────────────
function initEducation() {
  $('addEduBtn').addEventListener('click', () => {
    state.education.push({ id: Date.now(), institution:'', degree:'', from:'', to:'', notes:'' });
    renderEduCards();
    saveState();
  });
}

function renderEduCards() {
  const list = $('educationList');
  list.innerHTML = '';
  state.education.forEach((edu, i) => {
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
      <div class="card-header">
        <span class="card-num">مؤهل #${i+1}</span>
        <button type="button" class="btn-rm" data-i="${i}">✕</button>
      </div>
      <div class="field">
        <label>المؤسسة التعليمية</label>
        <input type="text" value="${esc(edu.institution)}" placeholder="جامعة الملك سعود" data-f="institution" data-i="${i}" />
      </div>
      <div class="field">
        <label>الدرجة / التخصص</label>
        <input type="text" value="${esc(edu.degree)}" placeholder="بكالوريوس علوم الحاسب" data-f="degree" data-i="${i}" />
      </div>
      <div class="two-col">
        <div class="field"><label>من</label>
          <input type="text" value="${esc(edu.from)}" placeholder="2018" data-f="from" data-i="${i}" /></div>
        <div class="field"><label>إلى</label>
          <input type="text" value="${esc(edu.to)}" placeholder="2022" data-f="to" data-i="${i}" /></div>
      </div>
      <div class="field">
        <label>ملاحظات (المعدل، جوائز...)</label>
        <textarea rows="2" placeholder="المعدل 4.5 / 5" data-f="notes" data-i="${i}">${esc(edu.notes)}</textarea>
      </div>`;

    card.querySelectorAll('[data-f]').forEach(el => {
      el.addEventListener('input', e => {
        state.education[+e.target.dataset.i][e.target.dataset.f] = e.target.value;
        saveState();
      });
    });
    card.querySelector('.btn-rm').addEventListener('click', e => {
      state.education.splice(+e.target.dataset.i, 1);
      renderEduCards(); saveState();
    });
    list.appendChild(card);
  });
}

// ── SWATCHES ─────────────────────────────
function initSwatches() {
  $$('.swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      $$('.swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      state.color = sw.dataset.color;
      saveState();
    });
  });
}

// ── TEMPLATES ────────────────────────────
function initTemplates() {
  $$('.tmpl-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      $$('.tmpl-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      state.template = opt.dataset.template;
      saveState();
    });
  });
}

// ── SAVE / PDF ───────────────────────────
function initSaveBtn() {
  $('saveBtn').addEventListener('click', async () => {
    if (!validateStep1()) { setStep(1); return; }
    renderCV();
    await downloadPDF($('saveBtn'));
    saveToCVList();
    updateBadge();
  });

  // Preview screen download button
  $('previewDownloadBtn').addEventListener('click', async () => {
    await downloadPDF($('previewDownloadBtn'));
    saveToCVList();
    updateBadge();
  });
}

function initPreviewBtn() {
  $('previewOnlyBtn').addEventListener('click', () => {
    renderCV();
    goScreen('screenPreview');
  });
}

async function downloadPDF(btn) {
  const paper = $('cvPreview');
  const name = val('name') || 'cv';

  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    showToast('⏳ جاري تحميل مكتبة PDF...');
    await loadLibs();
  }

  const origText = btn.innerHTML;
  btn.innerHTML = '⏳ جاري الإنشاء...';
  btn.disabled = true;
  showToast('📄 جاري إنشاء PDF...');

  try {
    const canvas = await html2canvas(paper, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const A4W = 210, A4H = 297;
    const pxW = canvas.width, pxH = canvas.height;
    const mmH = (pxH / pxW) * A4W;

    const img = canvas.toDataURL('image/jpeg', 0.95);
    if (mmH <= A4H) {
      pdf.addImage(img, 'JPEG', 0, 0, A4W, mmH);
    } else {
      let yMM = 0;
      while (yMM < mmH) {
        if (yMM > 0) pdf.addPage();
        pdf.addImage(img, 'JPEG', 0, -yMM, A4W, mmH);
        yMM += A4H;
      }
    }

    const fname = `${name.replace(/\s+/g,'_')}_CV.pdf`;
    pdf.save(fname);
    showToast(`✅ تم تحميل ${fname}`);
  } catch(err) {
    console.error(err);
    showToast('⚠️ فتح نافذة الطباعة...');
    window.print();
  } finally {
    btn.innerHTML = origText;
    btn.disabled = false;
  }
}

function loadLibs() {
  return new Promise((res, rej) => {
    let n = 0;
    const done = () => { if (++n === 2) res(); };
    const add = (src) => {
      const s = document.createElement('script');
      s.src = src; s.onload = done; s.onerror = rej;
      document.head.appendChild(s);
    };
    add('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    add('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  });
}

// ── SAVE TO LIST ─────────────────────────
function saveToCVList() {
  try {
    const list = JSON.parse(localStorage.getItem('cv-list') || '[]');
    const entry = {
      id: Date.now(),
      name: val('name'),
      date: new Date().toLocaleDateString('ar-SA'),
      snapshot: collectData(),
    };
    list.unshift(entry);
    // Keep max 10
    if (list.length > 10) list.length = 10;
    localStorage.setItem('cv-list', JSON.stringify(list));
  } catch {}
}

// ── RENDER SAVED LIST ─────────────────────
function renderSavedList() {
  const wrap = $('cvList');
  try {
    const list = JSON.parse(localStorage.getItem('cv-list') || '[]');
    if (!list.length) {
      wrap.innerHTML = `<div class="empty-list"><p>📋</p><p>لا توجد سير ذاتية محفوظة بعد</p></div>`;
      return;
    }
    wrap.innerHTML = list.map(item => `
      <div class="cv-list-item">
        <div class="cv-list-info">
          <div class="cv-list-name">${esc(item.name)}</div>
          <div class="cv-list-date">${item.date}</div>
        </div>
        <div class="cv-list-actions">
          <button class="btn-list-dl" onclick="loadCV(${item.id})">فتح</button>
          <button class="btn-list-del" onclick="deleteCV(${item.id})">🗑</button>
        </div>
      </div>`).join('');
  } catch {
    wrap.innerHTML = `<div class="empty-list"><p>⚠️</p><p>خطأ في التحميل</p></div>`;
  }
}

window.loadCV = function(id) {
  try {
    const list = JSON.parse(localStorage.getItem('cv-list') || '[]');
    const item = list.find(i => i.id === id);
    if (!item) return;
    restoreData(item.snapshot);
    goScreen('screenForm');
    renderExpCards();
    renderEduCards();
  } catch {}
};

window.deleteCV = function(id) {
  try {
    let list = JSON.parse(localStorage.getItem('cv-list') || '[]');
    list = list.filter(i => i.id !== id);
    localStorage.setItem('cv-list', JSON.stringify(list));
    renderSavedList();
    updateBadge();
    showToast('🗑 تم الحذف');
  } catch {}
};

// ── CV RENDER ─────────────────────────────
function renderCV() {
  const d = collectData();
  const c = state.color;
  let html = '';
  if (state.template === 'classic')  html = tplClassic(d, c);
  else if (state.template === 'modern') html = tplModern(d, c);
  else html = tplSidebar(d, c);
  $('cvPreview').innerHTML = html;
}

function collectData() {
  return {
    name:      val('name'),
    jobTitle:  val('jobTitle'),
    email:     val('email'),
    phone:     val('phone'),
    location:  val('location'),
    linkedin:  val('linkedin'),
    website:   val('website'),
    summary:   val('summary'),
    techSkills:val('techSkills'),
    softSkills:val('softSkills'),
    languages: val('languages'),
    certs:     val('certs'),
    photo:     state.photo,
    experience:state.experience,
    education: state.education,
    color:     state.color,
    template:  state.template,
  };
}

// ── TEMPLATE: CLASSIC ──────────────────
function tplClassic(d, c) {
  const contacts = [d.email,d.phone,d.location,d.linkedin,d.website]
    .filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('');
  const tags = str => (str||'').split(',').filter(Boolean)
    .map(s=>`<span class="cv-tag">${esc(s.trim())}</span>`).join('');

  return `<div class="cv-classic" style="--cv-color:${c}">
    <div class="cv-hd">
      ${d.photo?`<img src="${d.photo}" alt="" />`:''}
      <div class="cv-hd-name">${esc(d.name)||'الاسم'}</div>
      ${d.jobTitle?`<div class="cv-hd-job">${esc(d.jobTitle)}</div>`:''}
      ${contacts?`<div class="cv-hd-contacts">${contacts}</div>`:''}
    </div>
    <div class="cv-bd">
      ${d.summary?`<div class="cv-sec"><div class="cv-sec-t">نبذة مهنية</div><div class="cv-ep">${esc(d.summary)}</div></div>`:''}
      ${d.experience.length?`<div class="cv-sec"><div class="cv-sec-t">الخبرة العملية</div>${d.experience.map(e=>`
        <div class="cv-entry">
          <div class="cv-et">${esc(e.role)}</div>
          <div class="cv-es">${esc(e.company)}</div>
          <div class="cv-ed">${[e.from,e.to].filter(Boolean).join(' — ')}</div>
          ${e.desc?`<div class="cv-ep">${esc(e.desc)}</div>`:''}
        </div>`).join('')}</div>`:''}
      ${d.education.length?`<div class="cv-sec"><div class="cv-sec-t">التعليم</div>${d.education.map(e=>`
        <div class="cv-entry">
          <div class="cv-et">${esc(e.degree)}</div>
          <div class="cv-es">${esc(e.institution)}</div>
          <div class="cv-ed">${[e.from,e.to].filter(Boolean).join(' — ')}</div>
          ${e.notes?`<div class="cv-ep">${esc(e.notes)}</div>`:''}
        </div>`).join('')}</div>`:''}
      ${d.techSkills?`<div class="cv-sec"><div class="cv-sec-t">المهارات التقنية</div><div class="cv-tags">${tags(d.techSkills)}</div></div>`:''}
      ${d.softSkills?`<div class="cv-sec"><div class="cv-sec-t">المهارات الشخصية</div><div class="cv-tags">${tags(d.softSkills)}</div></div>`:''}
      ${d.languages?`<div class="cv-sec"><div class="cv-sec-t">اللغات</div><div class="cv-tags">${tags(d.languages)}</div></div>`:''}
      ${d.certs?`<div class="cv-sec"><div class="cv-sec-t">الشهادات والجوائز</div><div class="cv-ep">${esc(d.certs)}</div></div>`:''}
    </div>
  </div>`;
}

// ── TEMPLATE: MODERN ───────────────────
function tplModern(d, c) {
  const items = str => (str||'').split(',').filter(Boolean)
    .map(s=>`<div class="cv-sb-item">◆ ${esc(s.trim())}</div>`).join('');

  return `<div class="cv-modern" style="--cv-color:${c}">
    <div class="cv-sb">
      ${d.photo?`<img src="${d.photo}" alt="" />`:''}
      <div class="cv-sb-name">${esc(d.name)||'الاسم'}</div>
      ${d.jobTitle?`<div class="cv-sb-job">${esc(d.jobTitle)}</div>`:''}
      <div class="cv-sb-sec">
        <div class="cv-sb-lbl">التواصل</div>
        ${d.email?`<div class="cv-sb-item">✉ ${esc(d.email)}</div>`:''}
        ${d.phone?`<div class="cv-sb-item">📞 ${esc(d.phone)}</div>`:''}
        ${d.location?`<div class="cv-sb-item">📍 ${esc(d.location)}</div>`:''}
        ${d.linkedin?`<div class="cv-sb-item">🔗 ${esc(d.linkedin)}</div>`:''}
        ${d.website?`<div class="cv-sb-item">🌐 ${esc(d.website)}</div>`:''}
      </div>
      ${d.techSkills?`<div class="cv-sb-sec"><div class="cv-sb-lbl">المهارات</div>${items(d.techSkills)}</div>`:''}
      ${d.softSkills?`<div class="cv-sb-sec"><div class="cv-sb-lbl">الشخصية</div>${items(d.softSkills)}</div>`:''}
      ${d.languages?`<div class="cv-sb-sec"><div class="cv-sb-lbl">اللغات</div>${items(d.languages)}</div>`:''}
    </div>
    <div class="cv-mn">
      <div class="cv-mn-name">${esc(d.name)||''}</div>
      ${d.summary?`<div class="cv-sec"><div class="cv-sec-t">النبذة المهنية</div><div class="cv-ep">${esc(d.summary)}</div></div>`:''}
      ${d.experience.length?`<div class="cv-sec"><div class="cv-sec-t">الخبرة العملية</div>${d.experience.map(e=>`
        <div class="cv-entry">
          <div class="cv-et">${esc(e.role)}</div>
          <div class="cv-es">${esc(e.company)} · ${[e.from,e.to].filter(Boolean).join('–')}</div>
          ${e.desc?`<div class="cv-ep">${esc(e.desc)}</div>`:''}
        </div>`).join('')}</div>`:''}
      ${d.education.length?`<div class="cv-sec"><div class="cv-sec-t">التعليم</div>${d.education.map(e=>`
        <div class="cv-entry">
          <div class="cv-et">${esc(e.degree)}</div>
          <div class="cv-es">${esc(e.institution)} · ${[e.from,e.to].filter(Boolean).join('–')}</div>
          ${e.notes?`<div class="cv-ep">${esc(e.notes)}</div>`:''}
        </div>`).join('')}</div>`:''}
      ${d.certs?`<div class="cv-sec"><div class="cv-sec-t">الشهادات</div><div class="cv-ep">${esc(d.certs)}</div></div>`:''}
    </div>
  </div>`;
}

// ── TEMPLATE: SIDEBAR RIGHT ─────────────
function tplSidebar(d, c) {
  const items = str => (str||'').split(',').filter(Boolean)
    .map(s=>`<div class="cv-s-item">• ${esc(s.trim())}</div>`).join('');

  return `<div class="cv-sidebar-r" style="--cv-color:${c}">
    <div class="cv-mn-col">
      <div class="cv-hd-area">
        ${d.photo?`<img src="${d.photo}" alt="" />`:''}
        <div>
          <div class="cv-hd-name">${esc(d.name)||'الاسم'}</div>
          ${d.jobTitle?`<div class="cv-hd-job">${esc(d.jobTitle)}</div>`:''}
        </div>
      </div>
      <div class="cv-bd-area">
        ${d.summary?`<div class="cv-sec"><div class="cv-sec-t">نبذة مهنية</div><div class="cv-ep">${esc(d.summary)}</div></div>`:''}
        ${d.experience.length?`<div class="cv-sec"><div class="cv-sec-t">الخبرة العملية</div>${d.experience.map(e=>`
          <div class="cv-entry">
            <div class="cv-et">${esc(e.role)}</div>
            <div class="cv-es">${esc(e.company)}</div>
            <div class="cv-ed">${[e.from,e.to].filter(Boolean).join(' — ')}</div>
            ${e.desc?`<div class="cv-ep">${esc(e.desc)}</div>`:''}
          </div>`).join('')}</div>`:''}
        ${d.education.length?`<div class="cv-sec"><div class="cv-sec-t">التعليم</div>${d.education.map(e=>`
          <div class="cv-entry">
            <div class="cv-et">${esc(e.degree)}</div>
            <div class="cv-es">${esc(e.institution)}</div>
            <div class="cv-ed">${[e.from,e.to].filter(Boolean).join(' — ')}</div>
            ${e.notes?`<div class="cv-ep">${esc(e.notes)}</div>`:''}
          </div>`).join('')}</div>`:''}
      </div>
    </div>
    <div class="cv-side-col">
      <div class="cv-s-lbl" style="margin-top:0">التواصل</div>
      ${d.email?`<div class="cv-s-item">${esc(d.email)}</div>`:''}
      ${d.phone?`<div class="cv-s-item">${esc(d.phone)}</div>`:''}
      ${d.location?`<div class="cv-s-item">${esc(d.location)}</div>`:''}
      ${d.linkedin?`<div class="cv-s-item">${esc(d.linkedin)}</div>`:''}
      ${d.techSkills?`<div class="cv-s-lbl">المهارات</div>${items(d.techSkills)}`:''}
      ${d.softSkills?`<div class="cv-s-lbl">الشخصية</div>${items(d.softSkills)}`:''}
      ${d.languages?`<div class="cv-s-lbl">اللغات</div>${items(d.languages)}`:''}
      ${d.certs?`<div class="cv-s-lbl">الشهادات</div><div class="cv-s-item" style="font-size:0.74rem">${esc(d.certs)}</div>`:''}
    </div>
  </div>`;
}

// ── STORAGE ──────────────────────────────
function saveState() {
  try {
    const data = {
      fields: {
        name:val('name'), jobTitle:val('jobTitle'), email:val('email'),
        phone:val('phone'), location:val('location'), linkedin:val('linkedin'),
        website:val('website'), summary:val('summary'), techSkills:val('techSkills'),
        softSkills:val('softSkills'), languages:val('languages'), certs:val('certs'),
      },
      experience: state.experience,
      education:  state.education,
      color:      state.color,
      template:   state.template,
      photo:      state.photo,
      step:       state.step,
    };
    localStorage.setItem('cv-state', JSON.stringify(data));
  } catch {}
}

function loadState() {
  try {
    const raw = localStorage.getItem('cv-state');
    if (!raw) return;
    const data = JSON.parse(raw);
    // Restore fields
    Object.entries(data.fields||{}).forEach(([k,v]) => {
      const el = $(k); if (el) el.value = v;
    });
    state.experience = data.experience || [];
    state.education  = data.education  || [];
    state.color      = data.color || '#1a1a2e';
    state.template   = data.template || 'classic';
    state.photo      = data.photo || null;
    // Restore photo preview
    if (state.photo) {
      const img = $('photoPreviewSmall');
      img.src = state.photo;
      img.classList.add('visible');
      $('photoPlaceholder').style.display = 'none';
    }
    // Restore swatches + templates
    $$('.swatch').forEach(s => s.classList.toggle('active', s.dataset.color === state.color));
    $$('.tmpl-opt').forEach(o => o.classList.toggle('active', o.dataset.template === state.template));
    // Restore step (go to 1 on fresh load)
    const savedStep = data.step || 1;
    if (savedStep > 1) {
      setStep(savedStep);
    }
    renderExpCards();
    renderEduCards();
  } catch {}
}

function restoreData(d) {
  if (!d) return;
  const fields = ['name','jobTitle','email','phone','location','linkedin','website',
                  'summary','techSkills','softSkills','languages','certs'];
  fields.forEach(k => { const el=$(k); if(el) el.value = d[k]||''; });
  state.experience = d.experience||[];
  state.education  = d.education||[];
  state.color      = d.color||'#1a1a2e';
  state.template   = d.template||'classic';
  state.photo      = d.photo||null;
  if (state.photo) {
    const img = $('photoPreviewSmall');
    img.src = state.photo;
    img.classList.add('visible');
    $('photoPlaceholder').style.display = 'none';
  }
  $$('.swatch').forEach(s => s.classList.toggle('active', s.dataset.color === state.color));
  $$('.tmpl-opt').forEach(o => o.classList.toggle('active', o.dataset.template === state.template));
  setStep(1);
  saveState();
}

// ── TOAST ────────────────────────────────
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
window.showToast = showToast;
