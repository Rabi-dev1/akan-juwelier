/* ═══════════════════════════════════════════════════════════════════
   JUWELIER AKAN – main.js  (PART 1 + PART 2 kombiniert)
   ═══════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────
   §1  KONSTANTEN & STORAGE-KEYS
───────────────────────────────────────────────────────────────── */
const LS_THEME = 'ja-theme';
const LS_LANG  = 'ja-lang';

const CATEGORIES = {
  goldankauf:  'Goldankauf',
  trauringe:   'Trauringe',
  goldkette:   'Goldkette',
  goldarmband: 'Goldarmband',
};
const CATEGORIES_TR = {
  goldankauf:  'Altın Alımı',
  trauringe:   'Alyanslar',
  goldkette:   'Altın Zincir',
  goldarmband: 'Altın Bilezik',
};

/* ─────────────────────────────────────────────────────────────────
   §2  STATE
───────────────────────────────────────────────────────────────── */
const state = {
  filter:          'alle',
  searchQuery:     '',
  sortBy:          'default',
  isModalOpen:     false,
  activeProductId: null,
  lastFocusedEl:   null,
};

/* ─────────────────────────────────────────────────────────────────
   §3  PRODUKTE (aus PRODUCTS_DATA im HTML)
───────────────────────────────────────────────────────────────── */
const products = (typeof PRODUCTS_DATA !== 'undefined') ? PRODUCTS_DATA : [];

/* ─────────────────────────────────────────────────────────────────
   §4  DOM-ELEMENT-REFERENZEN
───────────────────────────────────────────────────────────────── */
let el = {};

function initElements() {
  el = {
    themeIco:        document.getElementById('theme-ico'),
    themeBtn:        document.getElementById('theme-btn'),
    modal:           document.querySelector('.modal'),
    modalBackdrop:   document.querySelector('.mb'),
    modalImg:        document.getElementById('mi'),
    modalThumbs:     document.getElementById('m-thumbs'),
    modalCat:        document.getElementById('mc'),
    modalName:       document.getElementById('mn'),
    modalRatingVal:  document.getElementById('m-rating-val'),
    modalRatingCnt:  document.getElementById('m-rating-cnt'),
    modalPrice:      document.getElementById('mp'),
    modalDesc:       document.getElementById('md'),
    modalReviewTxt:  document.getElementById('m-review-txt'),
    modalReviewAuth: document.getElementById('m-review-auth'),
    modalSpecs:      document.getElementById('ms'),
    modalRelGrid:    document.getElementById('m-rel-g'),
    modalClose:      document.getElementById('mx'),
    nav:             document.getElementById('nav'),
    burger:          document.getElementById('brg'),
    drawer:          document.querySelector('.drawer'),
    heroBg:          document.querySelector('.h-bg'),
    toast:           document.getElementById('toast'),
    statsSection:    document.querySelector('#stats'),
    siteMain:        document.getElementById('site-main'),
    contactForm:     document.querySelector('form'),
    formName:        document.getElementById('fn'),
    formTel:         document.getElementById('ftel'),
    formBetreff:     document.getElementById('fbetreff'),
    formSuccess:     document.getElementById('fok'),
  };
}

/* ─────────────────────────────────────────────────────────────────
   §5  PREIS-FORMATIERUNG
───────────────────────────────────────────────────────────────── */
function formatPrice(price) {
  if (!price) return 'Preis auf Anfrage';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
}

/* ─────────────────────────────────────────────────────────────────
   §6  PRODUKTE RENDERN
───────────────────────────────────────────────────────────────── */
function renderProducts() {
  const container = document.getElementById('pg');
  if (!container) return;

  const lang = localStorage.getItem(LS_LANG) || 'de';

  let filtered = products.filter(p => {
    const matchCat    = state.filter === 'alle' || p.cat === state.filter;
    const q           = state.searchQuery.toLowerCase();
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.name_tr && p.name_tr.toLowerCase().includes(q)) ||
      (p.desc  && p.desc.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  if (state.sortBy === 'name-az') {
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  } else if (state.sortBy === 'bestseller') {
    filtered.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
  }

  if (!filtered.length) {
    container.innerHTML = '<p style="color:var(--m);text-align:center;padding:48px 0">Keine Produkte gefunden.</p>';
    return;
  }

  container.innerHTML = filtered.map(p => {
    const name = lang === 'tr' && p.name_tr ? p.name_tr : p.name;
    const desc = lang === 'tr' && p.desc_tr ? p.desc_tr : p.desc;
    const cat  = lang === 'tr' ? (CATEGORIES_TR[p.cat] || p.cat) : (CATEGORIES[p.cat] || p.cat);
    const shortDesc = desc ? desc.substring(0, 90) + '…' : '';
    return `
<article class="card rv" data-id="${p.id}" tabindex="0" role="button"
         aria-label="${name} – Details ansehen">
  <div class="card-img">
    <img src="${p.img}" alt="${name}" loading="lazy"
         onerror="this.style.background='linear-gradient(135deg,var(--bg3),var(--bg2))';this.style.display='block'">
    ${p.isBestseller ? '<span class="badge-bs" aria-label="Bestseller">Bestseller</span>' : ''}
    ${p.isNew        ? '<span class="badge-new" aria-label="Neu">Neu</span>' : ''}
  </div>
  <div class="card-body">
    <div class="card-cat">${cat}</div>
    <h3 class="card-name">${name}</h3>
    <div class="card-rating" aria-label="Bewertung ${p.rating} von 5">
      <span class="stars" aria-hidden="true">★★★★★</span>
      <span class="rating-val">${p.rating.toFixed(1)}</span>
      <span class="rating-cnt">(${p.reviewCount})</span>
    </div>
    <p class="card-desc">${shortDesc}</p>
    <div class="card-price">${formatPrice(p.price)}</div>
    <button class="btn btn-g card-btn" data-id="${p.id}">Details ansehen</button>
  </div>
</article>`;
  }).join('');
}

/* ─────────────────────────────────────────────────────────────────
   §7  UI MIT STATE SYNCHRONISIEREN
───────────────────────────────────────────────────────────────── */
function syncUIToState() {
  document.querySelectorAll('.ft').forEach(btn => {
    const active = btn.dataset.c === state.filter;
    btn.classList.toggle('on', active);
    btn.setAttribute('aria-selected', String(active));
  });
  const searchInput = document.getElementById('disc-q');
  if (searchInput) searchInput.value = state.searchQuery;
  const sortSelect = document.getElementById('disc-sort');
  if (sortSelect) sortSelect.value = state.sortBy;
}

/* ─────────────────────────────────────────────────────────────────
   §8  FILTER
───────────────────────────────────────────────────────────────── */
function initFilters() {
  document.querySelectorAll('.ft').forEach(btn => {
    btn.addEventListener('click', () => {
      state.filter = btn.dataset.c;
      syncUIToState();
      renderProducts();
    });
  });
}

/* ─────────────────────────────────────────────────────────────────
   §9  SUCHE
───────────────────────────────────────────────────────────────── */
function initSearch() {
  const input = document.getElementById('disc-q');
  if (!input) return;
  input.addEventListener('input', () => {
    state.searchQuery = input.value.toLowerCase().trim();
    renderProducts();
  });
}

/* ─────────────────────────────────────────────────────────────────
   §10  SORTIERUNG
───────────────────────────────────────────────────────────────── */
function initSort() {
  const select = document.getElementById('disc-sort');
  if (!select) return;
  select.addEventListener('change', () => {
    state.sortBy = select.value;
    renderProducts();
  });
}

/* ─────────────────────────────────────────────────────────────────
   §11  PRODUKT-GRID EVENTS (Klick & Tastatur)
───────────────────────────────────────────────────────────────── */
function initGridEvents() {
  const grid = document.getElementById('pg');
  if (!grid) return;
  grid.addEventListener('click', e => {
    const card = e.target.closest('[data-id]');
    if (card) openModal(parseInt(card.dataset.id, 10));
  });
  grid.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('[data-id]');
    if (card) { e.preventDefault(); openModal(parseInt(card.dataset.id, 10)); }
  });
}

/* ─────────────────────────────────────────────────────────────────
   §12  URL-STATE (Stub – keine URL-Persistenz nötig)
───────────────────────────────────────────────────────────────── */
function restoreStateFromURL() {
  /* Placeholder – URL-basierter State nicht benötigt */
}

/* ═══════════════════════════════════════════════════════════════════
   PART 2 – Modal · Theme · Nav · Hero · Misc · init()
   ═══════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────
   §14  FOCUS-TRAP  (WCAG 2.1 · Kriterium 2.1.2)
───────────────────────────────────────────────────────────────── */
function createFocusTrap(container) {
  const SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  function onKeydown(e) {
    if (e.key !== 'Tab') return;
    const items = [...container.querySelectorAll(SELECTORS)];
    if (!items.length) return;
    const first = items[0];
    const last  = items[items.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }

  return {
    activate()   { container.addEventListener('keydown', onKeydown); },
    deactivate() { container.removeEventListener('keydown', onKeydown); },
    focusFirst() { container.querySelector(SELECTORS)?.focus(); },
  };
}

let focusTrap = null;

/* ─────────────────────────────────────────────────────────────────
   §15  MODAL
───────────────────────────────────────────────────────────────── */
function getRelatedProducts(currentProduct) {
  const sameCat = products.filter(p => p.id !== currentProduct.id && p.cat === currentProduct.cat);
  if (sameCat.length >= 3) return sameCat.slice(0, 3);
  const others  = products.filter(p => p.id !== currentProduct.id && p.cat !== currentProduct.cat);
  return [...sameCat, ...others].slice(0, 3);
}

function openModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  state.isModalOpen     = true;
  state.activeProductId = id;
  state.lastFocusedEl   = document.activeElement;

  const imgs      = (p.imgs && p.imgs.length) ? p.imgs : [p.img];
  const isGallery = imgs.length > 1;
  el.modal.classList.toggle('has-gallery', isGallery);

  el.modalImg.src = imgs[0];
  el.modalImg.alt = p.name;

  if (isGallery) {
    el.modalThumbs.innerHTML = imgs.map((src, i) => `
      <img class="m-thumb${i === 0 ? ' on' : ''}" src="${src}" alt="${p.name} Bild ${i+1}"
           loading="lazy" onerror="this.style.display='none'">`).join('');
    el.modalThumbs.querySelectorAll('.m-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        el.modalImg.src = thumb.src;
        el.modalThumbs.querySelectorAll('.m-thumb').forEach(t => t.classList.remove('on'));
        thumb.classList.add('on');
      });
    });
    el.modalThumbs.style.display = 'flex';
  } else {
    el.modalThumbs.innerHTML = '';
    el.modalThumbs.style.display = 'none';
  }

  const _lang     = localStorage.getItem(LS_LANG) || 'de';
  const _name     = _lang === 'tr' && p.name_tr       ? p.name_tr       : p.name;
  const _desc     = _lang === 'tr' && p.desc_tr       ? p.desc_tr       : p.desc;
  const _rev      = _lang === 'tr' && p.review_tr     ? p.review_tr     : p.review;
  const _auth     = _lang === 'tr' && p.reviewAuthor_tr ? p.reviewAuthor_tr : p.reviewAuthor;
  const _specs    = _lang === 'tr' && p.specs_tr      ? p.specs_tr      : p.specs;
  const _cats     = _lang === 'tr' ? CATEGORIES_TR : CATEGORIES;
  const _bewLabel = _lang === 'tr' ? 'Değerlendirme' : 'Bewertungen';

  el.modalCat.textContent       = _cats[p.cat] || p.cat;
  el.modalName.textContent      = _name;
  el.modalRatingVal.textContent = `${p.rating.toFixed(1)} / 5`;
  el.modalRatingCnt.textContent = `(${p.reviewCount} ${_bewLabel})`;
  el.modalPrice.textContent     = formatPrice(p.price);
  el.modalDesc.textContent      = _desc;
  el.modalReviewTxt.textContent  = _rev;
  el.modalReviewAuth.textContent = `– ${_auth}`;

  el.modalSpecs.innerHTML = Object.entries(_specs || {})
    .map(([k, v]) => `<div class="m-s"><div class="m-sk">${k}</div><div class="m-sv">${v}</div></div>`)
    .join('');

  const related = getRelatedProducts(p);
  el.modalRelGrid.innerHTML = related.map(r => `
    <div class="m-rel-c" data-id="${r.id}" role="listitem" tabindex="0"
         aria-label="${r.name}">
      <div class="m-rel-img">
        <img src="${r.img}" alt="${r.name}" loading="lazy"
             onerror="this.style.display='none'">
      </div>
      <div class="m-rel-name">${r.name}</div>
      <div class="m-rel-price">${formatPrice(r.price)}</div>
    </div>`).join('');

  el.modalBackdrop.classList.add('on');
  el.modalBackdrop.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
  el.siteMain?.setAttribute('aria-hidden', 'true');

  if (!focusTrap) focusTrap = createFocusTrap(el.modal);
  focusTrap.activate();
  focusTrap.focusFirst();
}

function closeModal() {
  if (!state.isModalOpen) return;
  state.isModalOpen     = false;
  state.activeProductId = null;

  el.modalBackdrop.classList.remove('on');
  el.modalBackdrop.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  el.siteMain?.removeAttribute('aria-hidden');

  focusTrap?.deactivate();
  state.lastFocusedEl?.focus();
}

function initModal() {
  el.modalBackdrop.addEventListener('click', e => {
    if (e.target === el.modalBackdrop) closeModal();
  });
  el.modal.addEventListener('click', e => {
    if (e.target.closest('[data-action="close"]')) { closeModal(); return; }
    const relCard = e.target.closest('.m-rel-c');
    if (relCard) {
      closeModal();
      setTimeout(() => openModal(parseInt(relCard.dataset.id, 10)), 300);
    }
  });
  el.modalRelGrid.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const relCard = e.target.closest('.m-rel-c');
    if (!relCard) return;
    e.preventDefault();
    closeModal();
    setTimeout(() => openModal(parseInt(relCard.dataset.id, 10)), 300);
  });
  el.modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.isModalOpen) closeModal();
  });
}

/* ─────────────────────────────────────────────────────────────────
   §18  DARK / LIGHT MODE
───────────────────────────────────────────────────────────────── */
function initTheme() {
  const saved = localStorage.getItem(LS_THEME) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  if (el.themeIco) el.themeIco.textContent = saved === 'dark' ? '☾' : '✦';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(LS_THEME, next);
  if (el.themeIco) el.themeIco.textContent = next === 'dark' ? '☾' : '✦';
  showToast(next === 'dark' ? '☾ Dark Mode aktiviert' : '✦ Light Mode aktiviert');
}

/* ─────────────────────────────────────────────────────────────────
   §19  NAVIGATION
───────────────────────────────────────────────────────────────── */
function initNav() {
  window.addEventListener('scroll', () => {
    el.nav.classList.toggle('sc', window.scrollY > 60);
  }, { passive: true });

  el.burger?.addEventListener('click', () => {
    const isOpen = el.drawer.classList.toggle('o');
    el.burger.classList.toggle('o', isOpen);
    el.burger.setAttribute('aria-expanded', String(isOpen));
    el.drawer.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  el.drawer?.querySelectorAll('.drw-l').forEach(link => {
    link.addEventListener('click', () => {
      el.drawer.classList.remove('o');
      el.burger.classList.remove('o');
      el.burger.setAttribute('aria-expanded', 'false');
      el.drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });

  el.themeBtn?.addEventListener('click', toggleTheme);
}

/* ─────────────────────────────────────────────────────────────────
   §20  HERO HINTERGRUNDBILD
───────────────────────────────────────────────────────────────── */
function initHero() {
  const urls = [
    '/assets/images/Lokal.jpg',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=88',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1920&q=88',
  ];
  (function tryLoad(i) {
    if (i >= urls.length) {
      el.heroBg.style.background =
        'radial-gradient(ellipse at 40% 50%,rgba(160,120,40,.15) 0%,transparent 65%),' +
        'radial-gradient(ellipse at 80% 20%,rgba(140,100,30,.10) 0%,transparent 55%),#080600';
      el.heroBg.classList.add('rdy');
      return;
    }
    const img   = new Image();
    img.onload  = () => { el.heroBg.style.backgroundImage = `url('${urls[i]}')`; el.heroBg.classList.add('rdy'); };
    img.onerror = () => tryLoad(i + 1);
    img.src = urls[i];
  }(0));
}

/* ─────────────────────────────────────────────────────────────────
   §21  SCROLL-REVEAL
───────────────────────────────────────────────────────────────── */
function initReveal() {
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.rv').forEach(node => observer.observe(node));
}

/* ─────────────────────────────────────────────────────────────────
   §22  STATISTIK-ZÄHLER
───────────────────────────────────────────────────────────────── */
function animateCounter(element, target, duration = 1800) {
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 4);
    element.textContent = Math.floor(eased * target).toLocaleString('de-DE');
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initCounters() {
  if (!el.statsSection) return;
  let hasRun = false;
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting || hasRun) return;
    hasRun = true;
    document.querySelectorAll('[data-t]').forEach(node => {
      animateCounter(node, parseInt(node.dataset.t, 10));
    });
  }, { threshold: 0.3 }).observe(el.statsSection);
}

/* ─────────────────────────────────────────────────────────────────
   §23  KONTAKTFORMULAR
───────────────────────────────────────────────────────────────── */
function initForm() {
  if (!el.contactForm) return;
  el.contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!el.formName?.value.trim() || !el.formTel?.value.trim() || !el.formBetreff?.value) {
      showToast('Bitte Name, Telefon und Betreff ausfüllen.');
      return;
    }
    const btn = el.contactForm.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Sende …'; }
    try {
      const data = new FormData(el.contactForm);
      await fetch('/', { method: 'POST', body: data });
      el.contactForm.style.display = 'none';
      if (el.formSuccess) el.formSuccess.style.display = 'block';
      showToast('✓ Anfrage gesendet – wir rufen Sie zurück!', 'gold');
    } catch {
      showToast('Fehler beim Senden – bitte rufen Sie uns an.');
      if (btn) { btn.disabled = false; btn.textContent = 'Rückruf anfragen →'; }
    }
  });
}

/* ─────────────────────────────────────────────────────────────────
   §24  TOAST-SYSTEM
───────────────────────────────────────────────────────────────── */
let toastTimer = null;

function showToast(message, type = 'default') {
  if (!el.toast) return;
  el.toast.textContent = message;
  el.toast.className   = '';
  if (type === 'gold')  el.toast.classList.add('t-gold');
  if (type === 'heart') el.toast.classList.add('t-heart');
  el.toast.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('on'), 3400);
}

/* ─────────────────────────────────────────────────────────────────
   §26  MEHRSPRACHIGKEIT  (DE / TR)
───────────────────────────────────────────────────────────────── */
const T = {
  de: {
    'nav-kollektion':'Kollektion','nav-ueber':'Über uns','nav-reviews':'Bewertungen',
    'nav-kontakt':'Kontakt','nav-cta':'Beratung anfragen',
    'hero-eye':'Herzlich Willkommen in Bielefeld',
    'hero-h1':'Juwelier Akan –<br><em>Goldankauf &amp; Eheringe</em>',
    'hero-sub':'Ihr Spezialist in Bielefeld seit 2013 – diskreter Goldankauf mit Sofort-Barzahlung, edle Trauringe & exklusive Goldketten. Persönliche Beratung auf Deutsch und Türkisch.',
    'hero-cta1':'Jetzt Termin vereinbaren','hero-cta2':'Leistungen ansehen',
    'trust-1':'Seit 2013<br>in Bielefeld','trust-2':'Diskreter<br>Goldankauf',
    'trust-3':'Meister-<br>werkstatt','trust-4':'5-Sterne<br>Beratung',
    'stat-1':'Jahre in Bielefeld','stat-2':'Zufriedene Kunden',
    'stat-3':'Einzigartige Designs','stat-4':'% Qualitätsgarantie',
    'fil-alle':'Alle','fil-goldankauf':'Goldankauf','fil-trauringe':'Trauringe',
    'fil-goldkette':'Goldkette','fil-goldarmband':'Goldarmband',
    'prod-cap':'✦ Goldankauf · Trauringe · Goldketten ✦',
    'prod-h2':'Unsere drei Kernleistungen',
    'prod-p':'Diskreter Goldankauf zu Tageskursen, edle Trauringe & Eheringe für Ihren schönsten Tag und exklusive Goldketten – alles aus einer Hand, persönlich beraten in Bielefeld.',
    'mid-p':'Ihr Traumstück wartet —<br><em>persönliche Beratung, kein Onlineshop.</em>',
    'mid-btn':'Jetzt Termin buchen',
    'ab-founded':'Gegründet','ab-cap':'Über uns',
    'ab-h2':'Akan Gold &amp; Schmuck – <em>Ihr Vertrauen, unser Handwerk</em>',
    'ab-p1':'Seit 2013 steht Akan Gold & Schmuck in der Bielefelder Bahnhofstraße für fairen Goldankauf, hochwertige Trauringe und exklusive Goldketten – alles zu kompromisslosen Qualitätsstandards.',
    'ab-p2':'Inhaber Hüseyin Akan empfängt Sie herzlich – auf Deutsch und Türkisch. Ob Goldankauf, Trauring oder individuelle Goldkette: Wir nehmen uns Zeit für Sie und Ihren besonderen Moment.',
    'ab-f1':'Goldankauf zu Tageskursen','ab-f2':'Trauringe & Eheringe',
    'ab-f3':'Exklusive Goldketten','ab-f4':'Deutsch & Türkisch',
    'ab-btn':'Termin vereinbaren','ab-role':'Inhaber · Akan Gold & Schmuck Bielefeld',
    'rv-cap':'✦ Kundenstimmen ✦','rv-h2':'Was unsere Kunden sagen',
    'rv-p':'Über 10 Jahre Vertrauen – echte Bewertungen, echte Menschen, echte Freude.',
    'rv-agg':'Google Bewertungen',
    'rv-t1':'„Echt korrekt und nett, tolle Auswahl."',
    'rv-t2':'„Freundliche Verkäufer und viele schönen Schmuck."',
    'rv-t3':'„Ein sehr guter Juwelier, ich war sehr zufrieden."',
    'rv-badge':'Google Bewertung ✓',
    'cta-p':'Überzeugt? <em>Wir freuen uns auf Sie.</em><br>Goldankauf, Trauringe, Goldketten – alles persönlich in Bielefeld.',
    'cta-btn':'Jetzt Termin buchen',
    'co-cap':'✦ Kontakt & Beratung ✦','co-h2':'Wir freuen uns auf Sie',
    'co-p':'Besuchen Sie uns in der Bielefelder Innenstadt oder schreiben Sie uns – wir antworten binnen 24 Stunden.',
    'co-find':'Finden Sie uns','co-loc':'Akan Gold &amp; Schmuck<br>Bielefeld',
    'co-desc':'Diskreter Goldankauf, edle Trauringe und exklusive Goldketten – persönliche Beratung auf Deutsch und Türkisch. Kommen Sie vorbei, wir nehmen uns Zeit für Sie.',
    'co-dl-adr':'Adresse','co-dl-tel':'Telefon','co-dl-mail':'E-Mail',
    'co-dl-lang':'Sprachen','co-dv-lang':'Deutsch & Türkisch',
    'form-h3':'Rückruf oder Termin anfragen',
    'form-name':'Name *','form-tel':'Telefon *','form-betreff':'Betreff *',
    'form-opt0':'Bitte wählen …','form-opt1':'Goldankauf',
    'form-opt2':'Trauringe & Eheringe','form-opt3':'Goldketten',
    'form-opt4':'Reparatur','form-opt5':'Sonstiges',
    'form-hint':'* Pflichtfelder · Wir rufen Sie zurück',
    'form-submit':'Rückruf anfragen →',
    'form-ok-h':'✦ Vielen Dank!',
    'form-ok-p':'Wir rufen Sie so schnell wie möglich zurück. Oder direkt: <a href="tel:+4952198761267" style="color:var(--g)">0521 98761267</a>',
    'mob-call':'Anrufen',
    'ft-desc':'Ihr Spezialist für Goldankauf, Trauringe & Goldketten in Bielefeld. Diskreter Ankauf, faire Preise, persönliche Beratung auf Deutsch und Türkisch.',
    'ft-h1':'Kollektion','ft-h2':'Service','ft-h3':'Kontakt',
    'ft-l1':'Ringe','ft-l2':'Ketten','ft-l3':'Armbänder','ft-l4':'Ohrringe','ft-l5':'Sonderanfertigungen',
    'ft-s1':'Über uns','ft-s2':'Beratung','ft-s3':'Gravur-Service','ft-s4':'Reparaturen','ft-s5':'Echtheitszertifikate',
    'ft-dsgvo':'Datenschutz',
  },
  tr: {
    'nav-kollektion':'Koleksiyon','nav-ueber':'Hakkımızda','nav-reviews':'Değerlendirmeler',
    'nav-kontakt':'İletişim','nav-cta':'Randevu Al',
    'hero-eye':'Bielefeld\'e Hoş Geldiniz',
    'hero-h1':'Juwelier Akan –<br><em>Altın Alımı &amp; Alyanslar</em>',
    'hero-sub':'2013\'ten beri Bielefeld\'de uzmanınız – gizli altın alımı, zarif alyanslar & özel altın zincirler. Almanca ve Türkçe kişisel danışmanlık.',
    'hero-cta1':'Randevu Al','hero-cta2':'Hizmetleri Gör',
    'trust-1':'2013\'ten beri<br>Bielefeld\'de','trust-2':'Gizli<br>Altın Alımı',
    'trust-3':'Usta<br>Atölyesi','trust-4':'5 Yıldız<br>Danışmanlık',
    'stat-1':'Yıl Bielefeld\'de','stat-2':'Mutlu Müşteri',
    'stat-3':'Özgün Tasarım','stat-4':'% Kalite Garantisi',
    'fil-alle':'Tümü','fil-goldankauf':'Altın Alımı','fil-trauringe':'Alyanslar',
    'fil-goldkette':'Altın Zincir','fil-goldarmband':'Altın Bilezik',
    'prod-cap':'✦ Altın Alımı · Alyanslar · Altın Zincirler ✦',
    'prod-h2':'Üç Temel Hizmetimiz',
    'prod-p':'Günlük kurdan gizli altın alımı, en güzel gününüz için zarif alyanslar ve özel altın zincirler – her şey tek elden, Bielefeld\'de kişisel danışmanlık.',
    'mid-p':'Hayalinizdeki parça sizi bekliyor —<br><em>kişisel danışmanlık, online mağaza değil.</em>',
    'mid-btn':'Hemen Randevu Al',
    'ab-founded':'Kuruluş','ab-cap':'Hakkımızda',
    'ab-h2':'Akan Gold &amp; Schmuck – <em>Güveniniz, Zanaatımız</em>',
    'ab-p1':'2013\'ten beri Bielefeld Bahnhofstraße\'de Akan Gold & Schmuck; adil altın alımı, kaliteli alyanslar ve özel altın zincirler – en yüksek kalite standartlarıyla.',
    'ab-p2':'Sahibi Hüseyin Akan sizi içtenlikle karşılar – Almanca ve Türkçe. İster altın satın, ister alyans veya özel altın zincir: Sizin için zaman ayırıyoruz.',
    'ab-f1':'Günlük kura göre altın alımı','ab-f2':'Alyanslar & Nikah Yüzükleri',
    'ab-f3':'Özel Altın Zincirler','ab-f4':'Almanca & Türkçe',
    'ab-btn':'Randevu Al','ab-role':'Sahibi · Akan Gold & Schmuck Bielefeld',
    'rv-cap':'✦ Müşteri Yorumları ✦','rv-h2':'Müşterilerimiz ne diyor',
    'rv-p':'10 yılı aşkın güven – gerçek değerlendirmeler, gerçek insanlar, gerçek mutluluk.',
    'rv-agg':'Google Değerlendirmeleri',
    'rv-t1':'„Gerçekten dürüst ve nazik, harika seçenekler."',
    'rv-t2':'„Samimi satıcılar ve çok güzel mücevherler."',
    'rv-t3':'„Çok iyi bir kuyumcu, çok memnun kaldım."',
    'rv-badge':'Google Değerlendirmesi ✓',
    'cta-p':'Beğendiniz mi? <em>Sizi bekliyoruz.</em><br>Altın alımı, alyanslar, altın zincirler – Bielefeld\'de kişisel danışmanlık.',
    'cta-btn':'Hemen Randevu Al',
    'co-cap':'✦ İletişim & Danışmanlık ✦','co-h2':'Sizi bekliyoruz',
    'co-p':'Bielefeld şehir merkezinde bizi ziyaret edin ya da yazın – 24 saat içinde yanıt veriyoruz.',
    'co-find':'Bizi Bulun','co-loc':'Akan Gold &amp; Schmuck<br>Bielefeld',
    'co-desc':'Gizli altın alımı, zarif alyanslar ve özel altın zincirler – Almanca ve Türkçe kişisel danışmanlık. Gelin, sizin için vakit ayırıyoruz.',
    'co-dl-adr':'Adres','co-dl-tel':'Telefon','co-dl-mail':'E-Posta',
    'co-dl-lang':'Diller','co-dv-lang':'Almanca & Türkçe',
    'form-h3':'Geri Arama veya Randevu Talep Et',
    'form-name':'Ad Soyad *','form-tel':'Telefon *','form-betreff':'Konu *',
    'form-opt0':'Seçiniz …','form-opt1':'Altın Alımı',
    'form-opt2':'Alyanslar & Nikah Yüzükleri','form-opt3':'Altın Zincirler',
    'form-opt4':'Tamir','form-opt5':'Diğer',
    'form-hint':'* Zorunlu alanlar · Sizi geri ararız',
    'form-submit':'Geri Arama Talep Et →',
    'form-ok-h':'✦ Teşekkürler!',
    'form-ok-p':'En kısa sürede sizi geri arayacağız. Veya doğrudan: <a href="tel:+4952198761267" style="color:var(--g)">0521 98761267</a>',
    'mob-call':'Ara',
    'ft-desc':'Bielefeld\'de altın alımı, alyans & altın zincir uzmanınız. Gizli alım, adil fiyat, Almanca ve Türkçe kişisel danışmanlık.',
    'ft-h1':'Koleksiyon','ft-h2':'Hizmet','ft-h3':'İletişim',
    'ft-l1':'Yüzükler','ft-l2':'Zincirler','ft-l3':'Bilezikler','ft-l4':'Küpeler','ft-l5':'Özel Siparişler',
    'ft-s1':'Hakkımızda','ft-s2':'Danışmanlık','ft-s3':'Gravür Hizmeti','ft-s4':'Tamir','ft-s5':'Orijinallik Sertifikaları',
    'ft-dsgvo':'Gizlilik Politikası',
  },
};

function applyLang(lang) {
  document.documentElement.lang = lang === 'tr' ? 'tr' : 'de';
  localStorage.setItem(LS_LANG, lang);
  document.querySelectorAll('[data-i18n]').forEach(node => {
    const key = node.dataset.i18n;
    if (T[lang]?.[key] !== undefined) node.textContent = T[lang][key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(node => {
    const key = node.dataset.i18nHtml;
    if (T[lang]?.[key] !== undefined) node.innerHTML = T[lang][key];
  });
  const ico = document.getElementById('lang-ico');
  if (ico) ico.textContent = lang === 'tr' ? 'DE' : 'TR';
  renderProducts();
}

function initLang() {
  const saved = localStorage.getItem(LS_LANG) || 'de';
  applyLang(saved);
  document.getElementById('lang-btn')?.addEventListener('click', () => {
    const current = localStorage.getItem(LS_LANG) || 'de';
    applyLang(current === 'de' ? 'tr' : 'de');
  });
}

/* ─────────────────────────────────────────────────────────────────
   §25  INITIALISIERUNG
───────────────────────────────────────────────────────────────── */
function init() {
  initElements();
  initTheme();
  initLang();
  restoreStateFromURL();
  renderProducts();
  syncUIToState();
  initFilters();
  initSearch();
  initSort();
  initGridEvents();
  initModal();
  initNav();
  initHero();
  initReveal();
  initCounters();
  initForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
