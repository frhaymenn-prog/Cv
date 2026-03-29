/* ═══════════════════════════════════════
   CV MAKER — app.js  (clean rewrite)
═══════════════════════════════════════ */
'use strict';

// ── HELPERS ──────────────────────────────────
const ID  = id  => document.getElementById(id);
const QS  = sel => document.querySelector(sel);
const val = id  => { const e = ID(id); return e ? e.value.trim() : ''; };
const esc = s   => s ? String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';

// ── STATE ─────────────────────────────────────
let CUR_STEP  = 1;
const TOTAL   = 5;
let ACCENT    = '#1a1a2e';
let TEMPLATE  = 'classic';
let PHOTO     = null;
let EXP       = [];   // [{role,company,from,to,desc}]
let EDU       = [];   // [{degree,institution,from,to,notes}]

const STEP_TITLES = ['المعلومات الشخصية','الخبرة العملية','التعليم','المهارات واللغات','التصميم والحفظ'];
const PANEL_IDS   = ['sp1','sp2','sp3','sp4','sp5'];
const PHONE_RE    = /^(05|06|07|037)\d{6,9}$/;

// ── BOOT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  wireHome();
  wirePhoto();
  wireExperience();
  wireEducation();
  wireSwatches();
  wireTemplates();
  wireSaveButtons();
  wireInputAutoSave();
  wireBottomNav();
  setStep(CUR_STEP, false);
  updateBadge();
});

// ── SCREEN TRANSITIONS ────────────────────────
const SCREENS = ['s-home','s-list','s-form','s-preview'];

function showScreen(id) {
  SCREENS.forEach(sid => {
    const el = ID(sid);
    if (!el) return;
    if (sid === id) {
      el.classList.add('active');
      el.classList.remove('left');
    } else if (el.classList.contains('active')) {
      el.classList.remove('active');
      el.classList.add('left');
      setTimeout(() => el.classList.remove('left'), 400);
    }
  });
}

// ── HOME ──────────────────────────────────────
function wireHome() {
  ID('btn-new').addEventListener('click', () => {
    resetFormToStep1();
    showScreen('s-form');
  });
  ID('btn-list').addEventListener('click', () => {
    renderSavedList();
    showScreen('s-list');
  });
  ID('list-back').addEventListener('click', () => showScreen('s-home'));
  ID('form-back').addEventListener('click', () => showScreen('s-home'));
  ID('preview-back').addEventListener('click', () => showScreen('s-form'));
}

function resetFormToStep1() {
  CUR_STEP = 1;
  setStep(1, false);
}

function updateBadge() {
  const list = getSavedList();
  const b = ID('badge');
  if (list.length) { b.textContent = list.length; b.style.display = 'flex'; }
  else b.style.display = 'none';
}

// ── STEP NAVIGATION ───────────────────────────
function wireBottomNav() {
  ID('nav-next').addEventListener('click', () => {
    if (CUR_STEP === 1 && !validateStep1()) return;
    if (CUR_STEP < TOTAL) setStep(CUR_STEP + 1);
  });
  ID('nav-prev').addEventListener('click', () => {
    if (CUR_STEP > 1) setStep(CUR_STEP - 1);
  });
}

function setStep(n, animate = true) {
  // hide all panels
  PANEL_IDS.forEach(pid => {
    const p = ID(pid);
    if (p) p.classList.add('hidden');
  });
  // show target
  const target = ID('sp' + n);
  if (target) {
    target.classList.remove('hidden');
    if (animate) {
      target.style.animation = 'none';
      requestAnimationFrame(() => { target.style.animation = ''; });
    }
    // scroll to top
    const sa = target.querySelector('.scroll-area');
    if (sa) sa.scrollTop = 0;
  }

  CUR_STEP = n;

  // update topbar
  ID('step-num').textContent = n;
  ID('step-title').textContent = STEP_TITLES[n - 1];

  // progress bar
  ID('prog-fill').style.width = (n / TOTAL * 100) + '%';

  // bottom nav
  const prev = ID('nav-prev');
  const next = ID('nav-next');
  if (n === 1) prev.classList.add('hide');
  else prev.classList.remove('hide');
  // Hide "التالي" on last step (save box handles it)
  next.style.display = (n === TOTAL) ? 'none' : 'block';

  saveState();
}

// ── VALIDATION ────────────────────────────────
function validateStep1() {
  const name = val('f-name');
  if (!name) {
    toast('⚠️ الرجاء إدخال الاسم الكامل');
    ID('f-name').focus();
    return false;
  }
  const phone = val('f-phone').replace(/\s+/g, '');
  if (phone && !PHONE_RE.test(phone)) {
    toast('❌ رقم الهاتف غير صحيح');
    ID('f-phone').focus();
    return false;
  }
  return true;
}

// live phone check
function wireInputAutoSave() {
  ID('f-phone').addEventListener('input', () => {
    const v = ID('f-phone').value.trim().replace(/\s+/g, '');
    const errEl = ID('phone-err');
    if (!v) { errEl.textContent = ''; ID('f-phone').className = ''; return; }
    if (PHONE_RE.test(v)) {
      errEl.textContent = '✅ رقم صحيح';
      errEl.style.color = '#3cb371';
      ID('f-phone').classList.add('v-ok');
      ID('f-phone').classList.remove('v-err');
    } else {
      errEl.textContent = '❌ يجب أن يبدأ بـ 05 أو 06 أو 07 أو 037';
      errEl.style.color = '#e05555';
      ID('f-phone').classList.add('v-err');
      ID('f-phone').classList.remove('v-ok');
    }
    saveState();
  });

  // all other fields auto-save
  ['f-name','f-job','f-email','f-loc','f-linkedin','f-web','f-summary',
   'f-tech','f-soft','f-langs','f-certs'].forEach(id => {
    const el = ID(id);
    if (el) el.addEventListener('input', saveState);
  });
}

// ── PHOTO ─────────────────────────────────────
function wirePhoto() {
  ID('photo-zone').addEventListener('click', () => ID('photo-file').click());
  ID('photo-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      PHOTO = ev.target.result;
      const img = ID('photo-img');
      img.src = PHOTO;
      img.classList.add('show');
      ID('photo-hint').style.display = 'none';
      saveState();
      toast('✅ تم رفع الصورة');
    };
    reader.readAsDataURL(file);
  });
}

// ── EXPERIENCE ────────────────────────────────
function wireExperience() {
  ID('add-exp').addEventListener('click', () => {
    EXP.push({ role:'', company:'', from:'', to:'', desc:'' });
    renderExpCards();
    saveState();
  });
}

function renderExpCards() {
  const wrap = ID('exp-list');
  wrap.innerHTML = '';
  if (EXP.length === 0) return;

  EXP.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'ecard';
    card.innerHTML = `
      <div class="ecard-hdr">
        <span class="ecard-num">💼 خبرة #${i + 1}</span>
        <button type="button" class="btn-rm" data-i="${i}">✕</button>
      </div>
      <div class="field">
        <label>المسمى الوظيفي</label>
        <input type="text" placeholder="مطور ويب / محاسب / مهندس..."
          value="${esc(item.role)}" data-f="role" data-i="${i}"/>
      </div>
      <div class="field">
        <label>اسم الشركة / الجهة</label>
        <input type="text" placeholder="شركة الاتصالات السعودية..."
          value="${esc(item.company)}" data-f="company" data-i="${i}"/>
      </div>
      <div class="two-col">
        <div class="field">
          <label>من</label>
          <input type="text" placeholder="يناير 2020" value="${esc(item.from)}" data-f="from" data-i="${i}"/>
        </div>
        <div class="field">
          <label>إلى</label>
          <input type="text" placeholder="حتى الآن" value="${esc(item.to)}" data-f="to" data-i="${i}"/>
        </div>
      </div>
      <div class="field">
        <label>وصف المهام والإنجازات</label>
        <textarea rows="2" placeholder="صف أبرز مهامك ومنجزاتك في هذه الوظيفة..."
          data-f="desc" data-i="${i}">${esc(item.desc)}</textarea>
      </div>`;

    // input events
    card.querySelectorAll('[data-f]').forEach(el => {
      el.addEventListener('input', e => {
        const idx = parseInt(e.target.getAttribute('data-i'));
        const field = e.target.getAttribute('data-f');
        EXP[idx][field] = e.target.value;
        saveState();
      });
    });

    // remove button
    card.querySelector('.btn-rm').addEventListener('click', e => {
      const idx = parseInt(e.target.getAttribute('data-i'));
      EXP.splice(idx, 1);
      renderExpCards();
      saveState();
    });

    wrap.appendChild(card);
  });
}

// ── EDUCATION ─────────────────────────────────
function wireEducation() {
  ID('add-edu').addEventListener('click', () => {
    EDU.push({ degree:'', institution:'', from:'', to:'', notes:'' });
    renderEduCards();
    saveState();
  });
}

function renderEduCards() {
  const wrap = ID('edu-list');
  wrap.innerHTML = '';
  if (EDU.length === 0) return;

  EDU.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'ecard';
    card.innerHTML = `
      <div class="ecard-hdr">
        <span class="ecard-num">🎓 مؤهل #${i + 1}</span>
        <button type="button" class="btn-rm" data-i="${i}">✕</button>
      </div>
      <div class="field">
        <label>الدرجة العلمية / التخصص</label>
        <input type="text" placeholder="بكالوريوس علوم الحاسب..."
          value="${esc(item.degree)}" data-f="degree" data-i="${i}"/>
      </div>
      <div class="field">
        <label>المؤسسة التعليمية</label>
        <input type="text" placeholder="جامعة الملك سعود..."
          value="${esc(item.institution)}" data-f="institution" data-i="${i}"/>
      </div>
      <div class="two-col">
        <div class="field">
          <label>من</label>
          <input type="text" placeholder="2018" value="${esc(item.from)}" data-f="from" data-i="${i}"/>
        </div>
        <div class="field">
          <label>إلى</label>
          <input type="text" placeholder="2022" value="${esc(item.to)}" data-f="to" data-i="${i}"/>
        </div>
      </div>
      <div class="field">
        <label>ملاحظات (المعدل، تميز...)</label>
        <textarea rows="2" placeholder="المعدل التراكمي 4.5 / شرف..."
          data-f="notes" data-i="${i}">${esc(item.notes)}</textarea>
      </div>`;

    card.querySelectorAll('[data-f]').forEach(el => {
      el.addEventListener('input', e => {
        const idx = parseInt(e.target.getAttribute('data-i'));
        EDU[idx][e.target.getAttribute('data-f')] = e.target.value;
        saveState();
      });
    });

    card.querySelector('.btn-rm').addEventListener('click', e => {
      EDU.splice(parseInt(e.target.getAttribute('data-i')), 1);
      renderEduCards();
      saveState();
    });

    wrap.appendChild(card);
  });
}

// ── SWATCHES ──────────────────────────────────
function wireSwatches() {
  document.querySelectorAll('.sw').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.sw').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      ACCENT = sw.getAttribute('data-c');
      saveState();
    });
  });
}

// ── TEMPLATES ─────────────────────────────────
function wireTemplates() {
  document.querySelectorAll('.tmpl').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tmpl').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      TEMPLATE = t.getAttribute('data-t');
      saveState();
    });
  });
}

// ── SAVE / PDF BUTTONS ────────────────────────
function wireSaveButtons() {
  // Step 5 save button
  ID('btn-save').addEventListener('click', async () => {
    if (!validateStep1()) { setStep(1); return; }
    buildCV();
    showScreen('s-preview');
    await makePDF(ID('btn-save'));
    persistToList();
    updateBadge();
  });

  // Step 5 peek (preview only)
  ID('btn-peek').addEventListener('click', () => {
    buildCV();
    showScreen('s-preview');
  });

  // Preview screen download
  ID('preview-dl').addEventListener('click', async () => {
    await makePDF(ID('preview-dl'));
    persistToList();
    updateBadge();
  });
}

// ── BUILD CV HTML ─────────────────────────────
function buildCV() {
  const d = getData();
  let html = '';
  if (TEMPLATE === 'classic') html = tmplClassic(d);
  else if (TEMPLATE === 'modern')  html = tmplModern(d);
  else                              html = tmplSidebar(d);
  ID('cv-paper').innerHTML = html;
}

function getData() {
  return {
    name:    val('f-name'),
    job:     val('f-job'),
    email:   val('f-email'),
    phone:   val('f-phone'),
    loc:     val('f-loc'),
    linkedin:val('f-linkedin'),
    web:     val('f-web'),
    summary: val('f-summary'),
    tech:    val('f-tech'),
    soft:    val('f-soft'),
    langs:   val('f-langs'),
    certs:   val('f-certs'),
    photo:   PHOTO,
    exp:     EXP,
    edu:     EDU,
  };
}

// ── TEMPLATE: CLASSIC ─────────────────────────
function tmplClassic(d) {
  const cc = ACCENT;
  const contacts = [d.email, d.phone, d.loc, d.linkedin, d.web]
    .filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('');
  const tags = str => (str || '').split(',').filter(Boolean)
    .map(s => `<span class="cv-tag">${esc(s.trim())}</span>`).join('');

  return `<div class="cv-classic" style="--cc:${cc}">
    <div class="cv-hd">
      ${d.photo ? `<img src="${d.photo}" alt=""/>` : ''}
      <div class="cv-name">${esc(d.name) || 'الاسم الكامل'}</div>
      ${d.job ? `<div class="cv-role">${esc(d.job)}</div>` : ''}
      ${contacts ? `<div class="cv-cont">${contacts}</div>` : ''}
    </div>
    <div class="cv-body">
      ${d.summary ? `<div class="cv-sec"><div class="cv-st">نبذة مهنية</div><div class="cv-ep">${esc(d.summary)}</div></div>` : ''}
      ${d.exp.length ? `<div class="cv-sec"><div class="cv-st">الخبرة العملية</div>
        ${d.exp.map(e => `<div class="cv-ent">
          <div class="cv-et">${esc(e.role)}</div>
          <div class="cv-es">${esc(e.company)}</div>
          <div class="cv-ed">${[e.from, e.to].filter(Boolean).join(' — ')}</div>
          ${e.desc ? `<div class="cv-ep">${esc(e.desc)}</div>` : ''}
        </div>`).join('')}</div>` : ''}
      ${d.edu.length ? `<div class="cv-sec"><div class="cv-st">التعليم</div>
        ${d.edu.map(e => `<div class="cv-ent">
          <div class="cv-et">${esc(e.degree)}</div>
          <div class="cv-es">${esc(e.institution)}</div>
          <div class="cv-ed">${[e.from, e.to].filter(Boolean).join(' — ')}</div>
          ${e.notes ? `<div class="cv-ep">${esc(e.notes)}</div>` : ''}
        </div>`).join('')}</div>` : ''}
      ${d.tech ? `<div class="cv-sec"><div class="cv-st">المهارات التقنية</div><div class="cv-tags">${tags(d.tech)}</div></div>` : ''}
      ${d.soft ? `<div class="cv-sec"><div class="cv-st">المهارات الشخصية</div><div class="cv-tags">${tags(d.soft)}</div></div>` : ''}
      ${d.langs ? `<div class="cv-sec"><div class="cv-st">اللغات</div><div class="cv-tags">${tags(d.langs)}</div></div>` : ''}
      ${d.certs ? `<div class="cv-sec"><div class="cv-st">الشهادات والجوائز</div><div class="cv-ep">${esc(d.certs)}</div></div>` : ''}
    </div>
  </div>`;
}

// ── TEMPLATE: MODERN ──────────────────────────
function tmplModern(d) {
  const cc = ACCENT;
  const listItems = str => (str || '').split(',').filter(Boolean)
    .map(s => `<div class="cv-si">◆ ${esc(s.trim())}</div>`).join('');

  return `<div class="cv-modern" style="--cc:${cc}">
    <div class="cv-sb">
      ${d.photo ? `<img src="${d.photo}" alt=""/>` : ''}
      <div class="cv-sb-name">${esc(d.name) || 'الاسم'}</div>
      ${d.job ? `<div class="cv-sb-role">${esc(d.job)}</div>` : ''}
      <div class="cv-ss">
        <div class="cv-sl">التواصل</div>
        ${d.email ? `<div class="cv-si">✉ ${esc(d.email)}</div>` : ''}
        ${d.phone ? `<div class="cv-si">📞 ${esc(d.phone)}</div>` : ''}
        ${d.loc   ? `<div class="cv-si">📍 ${esc(d.loc)}</div>`   : ''}
        ${d.linkedin ? `<div class="cv-si">🔗 ${esc(d.linkedin)}</div>` : ''}
        ${d.web   ? `<div class="cv-si">🌐 ${esc(d.web)}</div>`   : ''}
      </div>
      ${d.tech  ? `<div class="cv-ss"><div class="cv-sl">المهارات</div>${listItems(d.tech)}</div>`  : ''}
      ${d.soft  ? `<div class="cv-ss"><div class="cv-sl">الشخصية</div>${listItems(d.soft)}</div>`  : ''}
      ${d.langs ? `<div class="cv-ss"><div class="cv-sl">اللغات</div>${listItems(d.langs)}</div>` : ''}
    </div>
    <div class="cv-mn">
      <div class="cv-mn-name">${esc(d.name) || ''}</div>
      ${d.summary ? `<div class="cv-sec"><div class="cv-st">نبذة مهنية</div><div class="cv-ep">${esc(d.summary)}</div></div>` : ''}
      ${d.exp.length ? `<div class="cv-sec"><div class="cv-st">الخبرة العملية</div>
        ${d.exp.map(e => `<div class="cv-ent">
          <div class="cv-et">${esc(e.role)}</div>
          <div class="cv-es">${esc(e.company)} ${[e.from,e.to].filter(Boolean).join(' – ')}</div>
          ${e.desc ? `<div class="cv-ep">${esc(e.desc)}</div>` : ''}
        </div>`).join('')}</div>` : ''}
      ${d.edu.length ? `<div class="cv-sec"><div class="cv-st">التعليم</div>
        ${d.edu.map(e => `<div class="cv-ent">
          <div class="cv-et">${esc(e.degree)}</div>
          <div class="cv-es">${esc(e.institution)} ${[e.from,e.to].filter(Boolean).join(' – ')}</div>
          ${e.notes ? `<div class="cv-ep">${esc(e.notes)}</div>` : ''}
        </div>`).join('')}</div>` : ''}
      ${d.certs ? `<div class="cv-sec"><div class="cv-st">الشهادات</div><div class="cv-ep">${esc(d.certs)}</div></div>` : ''}
    </div>
  </div>`;
}

// ── TEMPLATE: SIDEBAR RIGHT ───────────────────
function tmplSidebar(d) {
  const cc = ACCENT;
  const listItems = str => (str || '').split(',').filter(Boolean)
    .map(s => `<div class="cv-si">• ${esc(s.trim())}</div>`).join('');

  return `<div class="cv-sbar" style="--cc:${cc}">
    <div class="cv-mc">
      <div class="cv-hd2">
        ${d.photo ? `<img src="${d.photo}" alt=""/>` : ''}
        <div>
          <div class="cv-name2">${esc(d.name) || 'الاسم الكامل'}</div>
          ${d.job ? `<div class="cv-role2">${esc(d.job)}</div>` : ''}
        </div>
      </div>
      <div class="cv-body2">
        ${d.summary ? `<div class="cv-sec"><div class="cv-st">نبذة مهنية</div><div class="cv-ep">${esc(d.summary)}</div></div>` : ''}
        ${d.exp.length ? `<div class="cv-sec"><div class="cv-st">الخبرة العملية</div>
          ${d.exp.map(e => `<div class="cv-ent">
            <div class="cv-et">${esc(e.role)}</div>
            <div class="cv-es">${esc(e.company)}</div>
            <div class="cv-ed">${[e.from,e.to].filter(Boolean).join(' — ')}</div>
            ${e.desc ? `<div class="cv-ep">${esc(e.desc)}</div>` : ''}
          </div>`).join('')}</div>` : ''}
        ${d.edu.length ? `<div class="cv-sec"><div class="cv-st">التعليم</div>
          ${d.edu.map(e => `<div class="cv-ent">
            <div class="cv-et">${esc(e.degree)}</div>
            <div class="cv-es">${esc(e.institution)}</div>
            <div class="cv-ed">${[e.from,e.to].filter(Boolean).join(' — ')}</div>
            ${e.notes ? `<div class="cv-ep">${esc(e.notes)}</div>` : ''}
          </div>`).join('')}</div>` : ''}
      </div>
    </div>
    <div class="cv-sc">
      <div class="cv-sl" style="margin-top:0">التواصل</div>
      ${d.email ? `<div class="cv-si">${esc(d.email)}</div>` : ''}
      ${d.phone ? `<div class="cv-si">${esc(d.phone)}</div>` : ''}
      ${d.loc   ? `<div class="cv-si">${esc(d.loc)}</div>`   : ''}
      ${d.linkedin ? `<div class="cv-si">${esc(d.linkedin)}</div>` : ''}
      ${d.tech  ? `<div class="cv-sl">المهارات</div>${listItems(d.tech)}`   : ''}
      ${d.soft  ? `<div class="cv-sl">الشخصية</div>${listItems(d.soft)}`   : ''}
      ${d.langs ? `<div class="cv-sl">اللغات</div>${listItems(d.langs)}`  : ''}
      ${d.certs ? `<div class="cv-sl">الشهادات</div><div class="cv-si" style="font-size:.7rem">${esc(d.certs)}</div>` : ''}
    </div>
  </div>`;
}

// ── PDF DOWNLOAD ──────────────────────────────
async function makePDF(btn) {
  const paper = ID('cv-paper');
  if (!paper.innerHTML.trim()) {
    buildCV();
    await new Promise(r => setTimeout(r, 200));
  }

  // load libs if needed
  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    toast('⏳ تحميل مكتبة PDF...');
    await loadLibs();
  }

  const name = val('f-name') || 'cv';
  const origHTML = btn.innerHTML;
  btn.innerHTML = '⏳ جاري الإنشاء...';
  btn.disabled = true;
  toast('📄 جاري إنشاء ملف PDF...');

  try {
    const canvas = await html2canvas(paper, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const A4W = 210, A4H = 297;
    const imgRatio = canvas.height / canvas.width;
    const pdfH = A4W * imgRatio;
    const imgData = canvas.toDataURL('image/jpeg', 0.94);

    if (pdfH <= A4H) {
      pdf.addImage(imgData, 'JPEG', 0, 0, A4W, pdfH);
    } else {
      let yOff = 0;
      while (yOff < pdfH) {
        if (yOff > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -yOff, A4W, pdfH);
        yOff += A4H;
      }
    }

    const fname = name.replace(/\s+/g, '_') + '_CV.pdf';
    pdf.save(fname);
    toast('✅ تم تحميل ' + fname);
  } catch (err) {
    console.error(err);
    toast('⚠️ جاري الطباعة...');
    setTimeout(() => window.print(), 400);
  } finally {
    btn.innerHTML = origHTML;
    btn.disabled = false;
  }
}

function loadLibs() {
  return new Promise((resolve, reject) => {
    let loaded = 0;
    const done = () => { if (++loaded === 2) resolve(); };
    const addScript = src => {
      const s = document.createElement('script');
      s.src = src; s.onload = done; s.onerror = reject;
      document.head.appendChild(s);
    };
    addScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    addScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  });
}

// ── SAVED CV LIST ─────────────────────────────
function getSavedList() {
  try { return JSON.parse(localStorage.getItem('cv-saved-list') || '[]'); }
  catch { return []; }
}

function persistToList() {
  try {
    const list = getSavedList();
    const entry = {
      id: Date.now(),
      name: val('f-name') || 'سيرة بدون اسم',
      date: new Date().toLocaleDateString('ar-SA'),
      data: { ...snapFields(), exp: EXP, edu: EDU, photo: PHOTO, accent: ACCENT, template: TEMPLATE },
    };
    list.unshift(entry);
    if (list.length > 15) list.length = 15;
    localStorage.setItem('cv-saved-list', JSON.stringify(list));
  } catch (e) { console.warn(e); }
}

function snapFields() {
  return {
    name: val('f-name'), job: val('f-job'), email: val('f-email'),
    phone: val('f-phone'), loc: val('f-loc'), linkedin: val('f-linkedin'),
    web: val('f-web'), summary: val('f-summary'),
    tech: val('f-tech'), soft: val('f-soft'), langs: val('f-langs'), certs: val('f-certs'),
  };
}

function renderSavedList() {
  const wrap = ID('saved-list-wrap');
  const list = getSavedList();
  if (!list.length) {
    wrap.innerHTML = `<div class="empty-box"><p>📋</p><p>لا توجد سير ذاتية محفوظة بعد</p></div>`;
    return;
  }
  wrap.innerHTML = list.map(item => `
    <div class="slist-item">
      <div>
        <div class="slist-name">${esc(item.name)}</div>
        <div class="slist-date">📅 ${item.date}</div>
      </div>
      <div class="slist-btns">
        <button class="sl-open" onclick="loadSaved(${item.id})">فتح</button>
        <button class="sl-del"  onclick="deleteSaved(${item.id})">🗑</button>
      </div>
    </div>`).join('');
}

window.loadSaved = function(id) {
  const list = getSavedList();
  const item = list.find(x => x.id === id);
  if (!item || !item.data) return;
  const d = item.data;
  // restore fields
  const fmap = { 'f-name': d.name, 'f-job': d.job, 'f-email': d.email,
    'f-phone': d.phone, 'f-loc': d.loc, 'f-linkedin': d.linkedin,
    'f-web': d.web, 'f-summary': d.summary, 'f-tech': d.tech,
    'f-soft': d.soft, 'f-langs': d.langs, 'f-certs': d.certs };
  Object.entries(fmap).forEach(([k, v]) => { const el = ID(k); if (el) el.value = v || ''; });
  EXP = d.exp || [];
  EDU = d.edu || [];
  PHOTO = d.photo || null;
  ACCENT = d.accent || '#1a1a2e';
  TEMPLATE = d.template || 'classic';

  // restore photo
  if (PHOTO) {
    const img = ID('photo-img'); img.src = PHOTO; img.classList.add('show');
    ID('photo-hint').style.display = 'none';
  }
  // restore swatches + templates
  document.querySelectorAll('.sw').forEach(s => s.classList.toggle('active', s.getAttribute('data-c') === ACCENT));
  document.querySelectorAll('.tmpl').forEach(t => t.classList.toggle('active', t.getAttribute('data-t') === TEMPLATE));

  renderExpCards();
  renderEduCards();
  setStep(1, false);
  showScreen('s-form');
  toast('✅ تم تحميل السيرة');
};

window.deleteSaved = function(id) {
  let list = getSavedList();
  list = list.filter(x => x.id !== id);
  localStorage.setItem('cv-saved-list', JSON.stringify(list));
  renderSavedList();
  updateBadge();
  toast('🗑 تم الحذف');
};

// ── STATE PERSISTENCE ─────────────────────────
function saveState() {
  try {
    localStorage.setItem('cv-draft', JSON.stringify({
      fields: snapFields(),
      exp: EXP, edu: EDU, photo: PHOTO,
      accent: ACCENT, template: TEMPLATE, step: CUR_STEP,
    }));
  } catch {}
}

function loadState() {
  try {
    const raw = localStorage.getItem('cv-draft');
    if (!raw) return;
    const d = JSON.parse(raw);
    if (d.fields) {
      const map = { 'f-name':'name','f-job':'job','f-email':'email','f-phone':'phone',
        'f-loc':'loc','f-linkedin':'linkedin','f-web':'web','f-summary':'summary',
        'f-tech':'tech','f-soft':'soft','f-langs':'langs','f-certs':'certs' };
      Object.entries(map).forEach(([elId, key]) => {
        const el = ID(elId); if (el) el.value = d.fields[key] || '';
      });
    }
    EXP      = d.exp      || [];
    EDU      = d.edu      || [];
    PHOTO    = d.photo    || null;
    ACCENT   = d.accent   || '#1a1a2e';
    TEMPLATE = d.template || 'classic';
    CUR_STEP = d.step     || 1;

    if (PHOTO) {
      const img = ID('photo-img'); img.src = PHOTO; img.classList.add('show');
      ID('photo-hint').style.display = 'none';
    }
    document.querySelectorAll('.sw').forEach(s => s.classList.toggle('active', s.getAttribute('data-c') === ACCENT));
    document.querySelectorAll('.tmpl').forEach(t => t.classList.toggle('active', t.getAttribute('data-t') === TEMPLATE));
    renderExpCards();
    renderEduCards();
  } catch {}
}

// ── TOAST ──────────────────────────────────────
let toastTimer;
function toast(msg) {
  const el = ID('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}
