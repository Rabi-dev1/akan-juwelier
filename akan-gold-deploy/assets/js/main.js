/* ═══════════════════════════════════════════════════════════════════
   PART 2 – Modal · Theme · Nav · Hero · Misc · init()
   ═══════════════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────────────────────
   §14  FOCUS-TRAP  (WCAG 2.1 · Kriterium 2.1.2)
   Hält den Tastaturfokus innerhalb des Modals – verhindert, dass
   Tab/Shift+Tab in den Seitenhintergrund entweicht.
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

let focusTrap = null; // Instanz wird beim ersten openModal() erzeugt


/* ─────────────────────────────────────────────────────────────────
   §15  MODAL  (Phase 3 Enhanced)
   – Star-Rating + Kundenzitat
   – "Das könnte Ihnen auch gefallen" (3 verwandte Produkte)
   – Modal-Aktionen
   – Focus-Trap + aria-hidden-Management
───────────────────────────────────────────────────────────────── */

/**
 * Gibt bis zu 3 verwandte Produkte zurück.
 * Priorität: gleiche Kategorie → dann andere Kategorien auffüllen.
 */
function getRelatedProducts(currentProduct) {
  const sameCat = products.filter(p => p.id !== currentProduct.id && p.cat === currentProduct.cat);
  if (sameCat.length >= 3) return sameCat.slice(0, 3);
  const others  = products.filter(p => p.id !== currentProduct.id && p.cat !== currentProduct.cat);
  return [...sameCat, ...others].slice(0, 3);
}

function openModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  /* State aktualisieren */
  state.isModalOpen     = true;
  state.activeProductId = id;
  state.lastFocusedEl   = document.activeElement; // für Fokus-Restore

  /* ── Galerie-Modus (has-gallery) ── */
  const imgs = (p.imgs && p.imgs.length) ? p.imgs : [p.img];
  const isGallery = imgs.length > 1;
  el.modal.classList.toggle('has-gallery', isGallery);

  el.modalImg.src = imgs[0];
  el.modalImg.alt = p.name;

  /* ── Thumbnails ── */
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
  const _lang = localStorage.getItem(LS_LANG) || 'de';
  const _name  = _lang === 'tr' && p.name_tr  ? p.name_tr  : p.name;
  const _desc  = _lang === 'tr' && p.desc_tr  ? p.desc_tr  : p.desc;
  const _rev   = _lang === 'tr' && p.review_tr ? p.review_tr : p.review;
  const _auth  = _lang === 'tr' && p.reviewAuthor_tr ? p.reviewAuthor_tr : p.reviewAuthor;
  const _specs = _lang === 'tr' && p.specs_tr ? p.specs_tr : p.specs;
  const _cats  = _lang === 'tr' ? CATEGORIES_TR : CATEGORIES;
  const _bewLabel = _lang === 'tr' ? 'Değerlendirme' : 'Bewertungen';

  el.modalCat.textContent      = _cats[p.cat];
  el.modalName.textContent     = _name;
  el.modalRatingVal.textContent = `${p.rating.toFixed(1)} / 5`;
  el.modalRatingCnt.textContent = `(${p.reviewCount} ${_bewLabel})`;
  el.modalPrice.textContent    = formatPrice(p.price);
  el.modalDesc.textContent     = _desc;
  el.modalReviewTxt.textContent  = _rev;
  el.modalReviewAuth.textContent = `– ${_auth}`;

  /* ── Technische Spezifikationen ── */
  el.modalSpecs.innerHTML = Object.entries(_specs)
    .map(([k, v]) => `<div class="m-s"><div class="m-sk">${k}</div><div class="m-sv">${v}</div></div>`)
    .join('');

  /* ── Verwandte Produkte ── */
  const related = getRelatedProducts(p);
  el.modalRelGrid.innerHTML = related.map(r => `
    <div class="m-rel-c" data-id="${r.id}" role="listitem" tabindex="0"
         aria-label="${r.name}, ${formatPrice(r.price)}">
      <div class="m-rel-img">
        <img src="${r.img}" alt="${r.name}" loading="lazy"
             onerror="this.style.display='none'">
      </div>
      <div class="m-rel-name">${r.name}</div>
      <div class="m-rel-price">${formatPrice(r.price)}</div>
    </div>`).join('');

  /* ── Modal sichtbar machen ── */
  el.modalBackdrop.classList.add('on');
  el.modalBackdrop.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';

  /* Hintergrund für Screenreader verstecken (WCAG 2.1) */
  el.siteMain?.setAttribute('aria-hidden', 'true');

  /* ── Focus-Trap aktivieren ── */
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

  /* Focus zurückführen (WCAG 2.1 · Kriterium 2.4.3) */
  focusTrap?.deactivate();
  state.lastFocusedEl?.focus();
}

function initModal() {
  /* Backdrop-Klick schließt Modal */
  el.modalBackdrop.addEventListener('click', (e) => {
    if (e.target === el.modalBackdrop) closeModal();
  });

  /* Event Delegation für alle Modal-Aktionen */
  el.modal.addEventListener('click', (e) => {
    /* Schließen-Buttons */
    if (e.target.closest('[data-action="close"]'))    { closeModal(); return; }


    /* Verwandtes Produkt anklicken → Modal wechseln */
    const relCard = e.target.closest('.m-rel-c');
    if (relCard) {
      closeModal();
      setTimeout(() => openModal(parseInt(relCard.dataset.id, 10)), 300);
    }
  });

  /* Verwandte Produkte – Tastatur-Navigation */
  el.modalRelGrid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const relCard = e.target.closest('.m-rel-c');
    if (!relCard) return;
    e.preventDefault();
    closeModal();
    setTimeout(() => openModal(parseInt(relCard.dataset.id, 10)), 300);
  });

  /* X-Button */
  el.modalClose.addEventListener('click', closeModal);

  /* Escape-Taste */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isModalOpen) closeModal();
  });
}



/* ─────────────────────────────────────────────────────────────────
   §18  DARK / LIGHT MODE  (localStorage · Phase 3)
───────────────────────────────────────────────────────────────── */

/** Liest gespeichertes Theme und wendet es sofort an. */
function initTheme() {
  const saved = localStorage.getItem(LS_THEME) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  if (el.themeIco) el.themeIco.textContent = saved === 'dark' ? '☾' : '✦';
}

/** Wechselt zwischen Dark und Light Mode. */
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
  /* Transparente → dunkle/helle Nav beim Scrollen */
  window.addEventListener('scroll', () => {
    el.nav.classList.toggle('sc', window.scrollY > 60);
  }, { passive: true });

  /* Mobile Drawer */
  el.burger?.addEventListener('click', () => {
    const isOpen = el.drawer.classList.toggle('o');
    el.burger.classList.toggle('o', isOpen);
    el.burger.setAttribute('aria-expanded', String(isOpen));
    el.drawer.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  /* Drawer schließen bei Link-Klick */
  el.drawer?.querySelectorAll('.drw-l').forEach(link => {
    link.addEventListener('click', () => {
      el.drawer.classList.remove('o');
      el.burger.classList.remove('o');
      el.burger.setAttribute('aria-expanded', 'false');
      el.drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    });
  });

  /* Theme-Toggle */
  el.themeBtn?.addEventListener('click', toggleTheme);

}


/* ─────────────────────────────────────────────────────────────────
   §20  HERO HINTERGRUNDBILD
   Versucht Bilder der Reihe nach zu laden, fällt auf
   CSS-Gradienten zurück wenn keines verfügbar ist.
───────────────────────────────────────────────────────────────── */
function initHero() {
  const urls = [
    '/assets/images/Lokal.jpg',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=88',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1920&q=88',
  ];

  (function tryLoad(i) {
    if (i >= urls.length) {
      /* Alle Bilder fehlgeschlagen → eleganter Gold-Gradient */
      el.heroBg.style.background =
        'radial-gradient(ellipse at 40% 50%,rgba(160,120,40,.15) 0%,transparent 65%),' +
        'radial-gradient(ellipse at 80% 20%,rgba(140,100,30,.10) 0%,transparent 55%),#080600';
      el.heroBg.classList.add('rdy');
      return;
    }
    const img   = new Image();
    img.onload  = () => {
      el.heroBg.style.backgroundImage = `url('${urls[i]}')`;
      el.heroBg.classList.add('rdy');
    };
    img.onerror = () => tryLoad(i + 1);
    img.src = urls[i];
  }(0));
}


/* ─────────────────────────────────────────────────────────────────
   §21  SCROLL-REVEAL  (IntersectionObserver)
───────────────────────────────────────────────────────────────── */
function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
    { threshold: 0.1 }
  );
  document.querySelectorAll('.rv').forEach(node => observer.observe(node));
}


/* ─────────────────────────────────────────────────────────────────
   §22  STATISTIK-ZÄHLER  (requestAnimationFrame · Ease-Out-Quart)
   rAF statt setInterval:
     – Synchron mit Bildschirm-Refresh (60 fps)
     – Pausiert automatisch in versteckten Browser-Tabs
     – Keine Timing-Fehler durch Timer-Akkumulation
───────────────────────────────────────────────────────────────── */

/**
 * Animiert einen Zähler von 0 → target.
 * @param {HTMLElement} element
 * @param {number}      target
 * @param {number}      duration – Millisekunden
 */
function animateCounter(element, target, duration = 1800) {
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 4); // Ease-Out Quart
    element.textContent = Math.floor(eased * target).toLocaleString('de-DE');
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function initCounters() {
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

  el.contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!el.formName.value.trim() || !el.formTel.value.trim() || !el.formBetreff.value) {
      showToast('Bitte Name, Telefon und Betreff ausfüllen.');
      return;
    }

    const btn = el.contactForm.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Sende …'; }

    try {
      const data = new FormData(el.contactForm);
      await fetch('/', { method: 'POST', body: data });
      el.contactForm.style.display = 'none';
      el.formSuccess.style.display = 'block';
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

/**
 * Zeigt eine kurze Benachrichtigung am unteren Bildschirmrand.
 * @param {string} message
 * @param {'default'|'gold'|'heart'} type
 */
function showToast(message, type = 'default') {
  el.toast.textContent = message;

  /* CSS-Klassen zurücksetzen und neue Variante setzen */
  el.toast.className = '';
  if (type === 'gold')  el.toast.classList.add('t-gold');
  if (type === 'heart') el.toast.classList.add('t-heart');
  el.toast.classList.add('on');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('on'), 3400);
}


/* ─────────────────────────────────────────────────────────────────
   §26  MEHRSPRACHIGKEIT  (DE / TR)
───────────────────────────────────────────────────────────────── */
const LS_LANG = 'ja-lang';

const T = {
  de: {
    /* Nav */
    'nav-kollektion':'Kollektion','nav-ueber':'Über uns','nav-reviews':'Bewertungen',
    'nav-kontakt':'Kontakt','nav-cta':'Beratung anfragen',
    /* Hero */
    'hero-eye':'Herzlich Willkommen in Bielefeld',
    'hero-h1':'Juwelier Akan –<br><em>Goldankauf &amp; Eheringe</em>',
    'hero-sub':'Ihr Spezialist in Bielefeld seit 2013 – diskreter Goldankauf mit Sofort-Barzahlung, edle Trauringe & exklusive Goldketten. Persönliche Beratung auf Deutsch und Türkisch.',
    'hero-cta1':'Jetzt Termin vereinbaren','hero-cta2':'Leistungen ansehen',
    /* Trust / Stats */
    'trust-1':'Seit 2013<br>in Bielefeld','trust-2':'Diskreter<br>Goldankauf',
    'trust-3':'Meister-<br>werkstatt','trust-4':'5-Sterne<br>Beratung',
    'stat-1':'Jahre in Bielefeld','stat-2':'Zufriedene Kunden',
    'stat-3':'Einzigartige Designs','stat-4':'% Qualitätsgarantie',
    /* Filter tabs */
    'fil-alle':'Alle','fil-goldankauf':'Goldankauf','fil-trauringe':'Trauringe',
    'fil-goldkette':'Goldkette','fil-goldarmband':'Goldarmband',
    /* Products section */
    'prod-cap':'✦ Goldankauf · Trauringe · Goldketten ✦',
    'prod-h2':'Unsere drei Kernleistungen',
    'prod-p':'Diskreter Goldankauf zu Tageskursen, edle Trauringe & Eheringe für Ihren schönsten Tag und exklusive Goldketten – alles aus einer Hand, persönlich beraten in Bielefeld.',
    /* Mid-CTA */
    'mid-p':'Ihr Traumstück wartet —<br><em>persönliche Beratung, kein Onlineshop.</em>',
    'mid-btn':'Jetzt Termin buchen',
    /* About */
    'ab-founded':'Gegründet','ab-cap':'Über uns',
    'ab-h2':'Akan Gold &amp; Schmuck – <em>Ihr Vertrauen, unser Handwerk</em>',
    'ab-p1':'Seit 2013 steht Akan Gold & Schmuck in der Bielefelder Bahnhofstraße für fairen Goldankauf, hochwertige Trauringe und exklusive Goldketten – alles zu kompromisslosen Qualitätsstandards.',
    'ab-p2':'Inhaber Hüseyin Akan empfängt Sie herzlich – auf Deutsch und Türkisch. Ob Goldankauf, Trauring oder individuelle Goldkette: Wir nehmen uns Zeit für Sie und Ihren besonderen Moment.',
    'ab-f1':'Goldankauf zu Tageskursen','ab-f2':'Trauringe & Eheringe',
    'ab-f3':'Exklusive Goldketten','ab-f4':'Deutsch & Türkisch',
    'ab-btn':'Termin vereinbaren',
    'ab-role':'Inhaber · Akan Gold & Schmuck Bielefeld',
    /* Reviews */
    'rv-cap':'✦ Kundenstimmen ✦','rv-h2':'Was unsere Kunden sagen',
    'rv-p':'Über 10 Jahre Vertrauen – echte Bewertungen, echte Menschen, echte Freude.',
    'rv-agg':'Google Bewertungen',
    'rv-t1':'„Echt korrekt und nett, tolle Auswahl."',
    'rv-t2':'„Freundliche Verkäufer und viele schönen Schmuck."',
    'rv-t3':'„Ein sehr guter Juwelier, ich war sehr zufrieden."',
    'rv-badge':'Google Bewertung ✓',
    /* Mid-CTA */
    'cta-p':'Überzeugt? <em>Wir freuen uns auf Sie.</em><br>Goldankauf, Trauringe, Goldketten – alles persönlich in Bielefeld.',
    'cta-btn':'Jetzt Termin buchen',
    /* Contact */
    'co-cap':'✦ Kontakt & Beratung ✦','co-h2':'Wir freuen uns auf Sie',
    'co-p':'Besuchen Sie uns in der Bielefelder Innenstadt oder schreiben Sie uns – wir antworten binnen 24 Stunden.',
    'co-find':'Finden Sie uns',
    'co-loc':'Akan Gold &amp; Schmuck<br>Bielefeld',
    'co-desc':'Diskreter Goldankauf, edle Trauringe und exklusive Goldketten – persönliche Beratung auf Deutsch und Türkisch. Kommen Sie vorbei, wir nehmen uns Zeit für Sie.',
    'co-dl-adr':'Adresse','co-dl-tel':'Telefon','co-dl-mail':'E-Mail',
    'co-dl-lang':'Sprachen','co-dv-lang':'Deutsch & Türkisch',
    /* Form */
    'form-h3':'Rückruf oder Termin anfragen',
    'form-name':'Name *','form-tel':'Telefon *','form-betreff':'Betreff *',
    'form-opt0':'Bitte wählen …','form-opt1':'Goldankauf',
    'form-opt2':'Trauringe & Eheringe','form-opt3':'Goldketten',
    'form-opt4':'Reparatur','form-opt5':'Sonstiges',
    'form-hint':'* Pflichtfelder · Wir rufen Sie zurück',
    'form-submit':'Rückruf anfragen →',
    'form-ok-h':'✦ Vielen Dank!',
    'form-ok-p':'Wir rufen Sie so schnell wie möglich zurück. Oder direkt: <a href="tel:+4952198761267" style="color:var(--g)">0521 98761267</a>',
    /* Mobile */
    'mob-call':'Anrufen',
    /* Footer */
    'ft-desc':'Ihr Spezialist für Goldankauf, Trauringe & Goldketten in Bielefeld. Diskreter Ankauf, faire Preise, persönliche Beratung auf Deutsch und Türkisch.',
    'ft-h1':'Kollektion','ft-h2':'Service','ft-h3':'Kontakt',
    'ft-l1':'Ringe','ft-l2':'Ketten','ft-l3':'Armbänder','ft-l4':'Ohrringe','ft-l5':'Sonderanfertigungen',
    'ft-s1':'Über uns','ft-s2':'Beratung','ft-s3':'Gravur-Service','ft-s4':'Reparaturen','ft-s5':'Echtheitszertifikate',
    'ft-dsgvo':'Datenschutz',
  },
  tr: {
    /* Nav */
    'nav-kollektion':'Koleksiyon','nav-ueber':'Hakkımızda','nav-reviews':'Değerlendirmeler',
    'nav-kontakt':'İletişim','nav-cta':'Randevu Al',
    /* Hero */
    'hero-eye':'Bielefeld\'e Hoş Geldiniz',
    'hero-h1':'Juwelier Akan –<br><em>Altın Alımı &amp; Alyanslar</em>',
    'hero-sub':'2013\'ten beri Bielefeld\'de uzmanınız – gizli altın alımı, zarif alyanslar & özel altın zincirler. Almanca ve Türkçe kişisel danışmanlık.',
    'hero-cta1':'Randevu Al','hero-cta2':'Hizmetleri Gör',
    /* Trust / Stats */
    'trust-1':'2013\'ten beri<br>Bielefeld\'de','trust-2':'Gizli<br>Altın Alımı',
    'trust-3':'Usta<br>Atölyesi','trust-4':'5 Yıldız<br>Danışmanlık',
    'stat-1':'Yıl Bielefeld\'de','stat-2':'Mutlu Müşteri',
    'stat-3':'Özgün Tasarım','stat-4':'% Kalite Garantisi',
    /* Filter tabs */
    'fil-alle':'Tümü','fil-goldankauf':'Altın Alımı','fil-trauringe':'Alyanslar',
    'fil-goldkette':'Altın Zincir','fil-goldarmband':'Altın Bilezik',
    /* Products section */
    'prod-cap':'✦ Altın Alımı · Alyanslar · Altın Zincirler ✦',
    'prod-h2':'Üç Temel Hizmetimiz',
    'prod-p':'Günlük kurdan gizli altın alımı, en güzel gününüz için zarif alyanslar ve özel altın zincirler – her şey tek elden, Bielefeld\'de kişisel danışmanlık.',
    /* Mid-CTA */
    'mid-p':'Hayalinizdeki parça sizi bekliyor —<br><em>kişisel danışmanlık, online mağaza değil.</em>',
    'mid-btn':'Hemen Randevu Al',
    /* About */
    'ab-founded':'Kuruluş','ab-cap':'Hakkımızda',
    'ab-h2':'Akan Gold &amp; Schmuck – <em>Güveniniz, Zanaatımız</em>',
    'ab-p1':'2013\'ten beri Bielefeld Bahnhofstraße\'de Akan Gold & Schmuck; adil altın alımı, kaliteli alyanslar ve özel altın zincirler – en yüksek kalite standartlarıyla.',
    'ab-p2':'Sahibi Hüseyin Akan sizi içtenlikle karşılar – Almanca ve Türkçe. İster altın satın, ister alyans veya özel altın zincir: Sizin için zaman ayırıyoruz.',
    'ab-f1':'Günlük kura göre altın alımı','ab-f2':'Alyanslar & Nikah Yüzükleri',
    'ab-f3':'Özel Altın Zincirler','ab-f4':'Almanca & Türkçe',
    'ab-btn':'Randevu Al',
    'ab-role':'Sahibi · Akan Gold & Schmuck Bielefeld',
    /* Reviews */
    'rv-cap':'✦ Müşteri Yorumları ✦','rv-h2':'Müşterilerimiz ne diyor',
    'rv-p':'10 yılı aşkın güven – gerçek değerlendirmeler, gerçek insanlar, gerçek mutluluk.',
    'rv-agg':'Google Değerlendirmeleri',
    'rv-t1':'„Gerçekten dürüst ve nazik, harika seçenekler."',
    'rv-t2':'„Samimi satıcılar ve çok güzel mücevherler."',
    'rv-t3':'„Çok iyi bir kuyumcu, çok memnun kaldım."',
    'rv-badge':'Google Değerlendirmesi ✓',
    /* Mid-CTA */
    'cta-p':'Beğendiniz mi? <em>Sizi bekliyoruz.</em><br>Altın alımı, alyanslar, altın zincirler – Bielefeld\'de kişisel danışmanlık.',
    'cta-btn':'Hemen Randevu Al',
    /* Contact */
    'co-cap':'✦ İletişim & Danışmanlık ✦','co-h2':'Sizi bekliyoruz',
    'co-p':'Bielefeld şehir merkezinde bizi ziyaret edin ya da yazın – 24 saat içinde yanıt veriyoruz.',
    'co-find':'Bizi Bulun',
    'co-loc':'Akan Gold &amp; Schmuck<br>Bielefeld',
    'co-desc':'Gizli altın alımı, zarif alyanslar ve özel altın zincirler – Almanca ve Türkçe kişisel danışmanlık. Gelin, sizin için vakit ayırıyoruz.',
    'co-dl-adr':'Adres','co-dl-tel':'Telefon','co-dl-mail':'E-Posta',
    'co-dl-lang':'Diller','co-dv-lang':'Almanca & Türkçe',
    /* Form */
    'form-h3':'Geri Arama veya Randevu Talep Et',
    'form-name':'Ad Soyad *','form-tel':'Telefon *','form-betreff':'Konu *',
    'form-opt0':'Seçiniz …','form-opt1':'Altın Alımı',
    'form-opt2':'Alyanslar & Nikah Yüzükleri','form-opt3':'Altın Zincirler',
    'form-opt4':'Tamir','form-opt5':'Diğer',
    'form-hint':'* Zorunlu alanlar · Sizi geri ararız',
    'form-submit':'Geri Arama Talep Et →',
    'form-ok-h':'✦ Teşekkürler!',
    'form-ok-p':'En kısa sürede sizi geri arayacağız. Veya doğrudan: <a href="tel:+4952198761267" style="color:var(--g)">0521 98761267</a>',
    /* Mobile */
    'mob-call':'Ara',
    /* Footer */
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
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (T[lang]?.[key] !== undefined) el.textContent = T[lang][key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (T[lang]?.[key] !== undefined) el.innerHTML = T[lang][key];
  });
  const ico = document.getElementById('lang-ico');
  if (ico) ico.textContent = lang === 'tr' ? 'DE' : 'TR';
  /* Re-render product cards so names/descriptions switch language */
  if (typeof renderProducts === 'function') renderProducts();
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
   §25  INITIALISIERUNG  (Einstiegspunkt)
───────────────────────────────────────────────────────────────── */
function init() {
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
  initHero();             // Hero-Bild mit Fallback-Kette
  initReveal();           // Scroll-Reveal via IntersectionObserver
  initCounters();         // Statistik-Zähler (rAF)
  initForm();             // Kontaktformular
}

/* DOMContentLoaded-Guard: startet init() sobald das DOM bereit ist */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init(); // DOM bereits bereit (z. B. Script am Ende des Body)
}