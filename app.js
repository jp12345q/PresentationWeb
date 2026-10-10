(() => {
  'use strict';
  const slides = window.TAO_SLIDES;
  if (!Array.isArray(slides) || slides.length !== 15) {
    document.querySelector('#deck').textContent = 'Hindi ma-load ang 15 slides.';
    return;
  }
  const $ = (selector) => document.querySelector(selector);
  const deck = $('#deck');
  const slideCount = $('#slideCount');
  const sectionName = $('#sectionName');
  const progressTrack = $('#progressTrack');
  const progressFill = $('#progressFill');
  const previousBtn = $('#previousBtn');
  const nextBtn = $('#nextBtn');
  const overviewOverlay = $('#overviewOverlay');
  const notesOverlay = $('#notesOverlay');
  const overviewGrid = $('#overviewGrid');
  const notesContent = $('#notesContent');
  let activeIndex = 0;
  let lastTouchX = null;

  function build() {
    slides.forEach((slide, index) => {
      const art = document.createElement('article');
      art.className = `slide tone-${slide.tone} ${slide.type === 'hero' ? 'slide-hero' : ''} ${slide.type === 'ending' ? 'slide-ending' : ''}`;
      art.setAttribute('aria-label', `Slide ${index + 1}: ${slide.title}`);
      art.dataset.index = String(index);
      art.innerHTML = `
        <div class="slide-texture" aria-hidden="true"></div>
        <div class="slide-watermark" aria-hidden="true">道</div>
        <div class="slide-inner">${slide.body}</div>
        <div class="slide-foot"><span>KABANATA 7 <span class="foot-divider">/</span> ${slide.section.toUpperCase()}</span><span>PINAGBATAYAN: PP. ${slide.pages} <span class="foot-divider">/</span> ${String(index + 1).padStart(2, '0')}</span></div>`;
      deck.appendChild(art);

      const preview = document.createElement('button');
      preview.className = 'overview-item';
      preview.type = 'button';
      preview.innerHTML = `<span class="overview-num">${String(index + 1).padStart(2, '0')}</span><span class="overview-line"></span><strong></strong><small></small>`;
      preview.querySelector('strong').textContent = slide.title;
      preview.querySelector('small').textContent = slide.section;
      preview.addEventListener('click', () => { goTo(index); closeOverlay(overviewOverlay); });
      overviewGrid.appendChild(preview);
    });
    const fragment = location.hash.match(/^#slide-(\d+)$/);
    if (fragment) activeIndex = Math.min(slides.length - 1, Math.max(0, Number(fragment[1]) - 1));
    update();
  }

  function update() {
    deck.querySelectorAll('.slide').forEach((slide, index) => {
      const active = index === activeIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    slideCount.textContent = `${String(activeIndex + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    sectionName.textContent = slides[activeIndex].section;
    progressFill.style.width = `${((activeIndex + 1) / slides.length) * 100}%`;
    progressTrack.setAttribute('aria-valuenow', String(activeIndex + 1));
    previousBtn.disabled = activeIndex === 0;
    nextBtn.disabled = activeIndex === slides.length - 1;
    const slide = slides[activeIndex];
    notesContent.replaceChildren();
    const info = document.createElement('p');
    info.className = 'notes-info';
    info.textContent = `Slide ${activeIndex + 1} / ${slides.length} · Pahina ${slide.pages}`;
    const title = document.createElement('h3');
    title.textContent = slide.title;
    const text = document.createElement('p');
    text.textContent = slide.notes;
    notesContent.append(info, title, text);
    overviewGrid.querySelectorAll('.overview-item').forEach((button,i) => button.classList.toggle('current',i === activeIndex));
    try { history.replaceState(null, '', `#slide-${activeIndex + 1}`); } catch (_) { /* local file URL may restrict history */ }
  }
  function goTo(index) { activeIndex = Math.min(slides.length - 1, Math.max(0, index)); update(); }
  function openOverlay(overlay) { closeOverlay(overlay === overviewOverlay ? notesOverlay : overviewOverlay); overlay.hidden = false; overlay.querySelector('.close-btn')?.focus(); }
  function closeOverlay(overlay) { overlay.hidden = true; }
  function toggleOverlay(overlay) { overlay.hidden ? openOverlay(overlay) : closeOverlay(overlay); }
  function anyOverlayOpen() { return !overviewOverlay.hidden || !notesOverlay.hidden; }
  function handleKey(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target && /input|textarea|select/i.test(target.tagName)) return;
    const key = event.key.toLowerCase();
    if (key === 'escape') { closeOverlay(overviewOverlay); closeOverlay(notesOverlay); return; }
    if (anyOverlayOpen()) return;
    if (key === 'arrowright' || key === 'arrowdown' || key === ' ' || key === 'pagedown') { event.preventDefault(); goTo(activeIndex + 1); }
    else if (key === 'arrowleft' || key === 'arrowup' || key === 'pageup' || key === 'backspace') { event.preventDefault(); goTo(activeIndex - 1); }
    else if (key === 'home') { event.preventDefault(); goTo(0); }
    else if (key === 'end') { event.preventDefault(); goTo(slides.length - 1); }
    else if (key === 'n') toggleOverlay(notesOverlay);
    else if (key === 'o') toggleOverlay(overviewOverlay);
    else if (key === 'f') toggleFullscreen();
    else if (key === 'p') window.print();
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (_) { /* Some mobile/local browsers block fullscreen. */ }
  }
  previousBtn.addEventListener('click', () => goTo(activeIndex - 1));
  nextBtn.addEventListener('click', () => goTo(activeIndex + 1));
  $('#overviewBtn').addEventListener('click', () => toggleOverlay(overviewOverlay));
  $('#notesBtn').addEventListener('click', () => toggleOverlay(notesOverlay));
  $('#printBtn').addEventListener('click', () => window.print());
  $('#fullscreenBtn').addEventListener('click', toggleFullscreen);
  $('#closeOverview').addEventListener('click', () => closeOverlay(overviewOverlay));
  $('#closeNotes').addEventListener('click', () => closeOverlay(notesOverlay));
  [overviewOverlay,notesOverlay].forEach(el => el.addEventListener('click', (e) => { if (e.target === el) closeOverlay(el); }));
  document.addEventListener('keydown', handleKey);
  deck.addEventListener('touchstart', (event) => { if (event.touches.length === 1) lastTouchX = event.touches[0].clientX; }, { passive: true });
  deck.addEventListener('touchend', (event) => { if (lastTouchX == null) return; const dx = event.changedTouches[0].clientX - lastTouchX; if (Math.abs(dx) > 65) goTo(activeIndex + (dx < 0 ? 1 : -1)); lastTouchX = null; }, { passive: true });
  window.addEventListener('hashchange', () => { const match = location.hash.match(/^#slide-(\d+)$/); if (match) goTo(Number(match[1]) - 1); });
  build();
})();
