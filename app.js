(() => {
  'use strict';
  const slides = window.TAO_SLIDES;
  if (!Array.isArray(slides) || slides.length !== 15) {
    document.getElementById('slidesHost').textContent = 'Hindi ma-load ang 15 slide. Tiyaking kasama ang slides.js.';
    return;
  }

  const $ = id => document.getElementById(id);
  const host = $('slidesHost');
  const track = $('progressTrack');
  const overviewGrid = $('overviewGrid');
  const overviewDialog = $('overviewDialog');
  const deck = $('deck');
  let current = 0;
  let startX = null;
  let startY = null;

  const pageTitle = 'Ang Kautusan ng Langit at ang Kasaysayan sa Pagpapalaganap ng TAO';
  const padded = n => String(n + 1).padStart(2, '0');
  const isOverviewOpen = () => overviewDialog.open;

  function render() {
    host.innerHTML = slides.map((slide, index) => {
      const common = `<div class="slide-corner-index">${padded(index)}<span> / 15</span></div>`;
      const inside = slide.layout === 'cover'
        ? `${slide.body}<div class="cover-vertical" aria-hidden="true">道 · 天 · 心</div>`
        : `<div class="slide-inner">
           <div class="slide-heading">
             <div class="slide-kicker"><span class="kicker-line"></span>${slide.tag}<span class="kicker-separator">/</span>${slide.phase}</div>
             <h2>${slide.title}</h2>
             <p class="slide-lead"><strong class="summary-label">BUOD</strong> ${slide.summary}</p>
           </div>
           <div class="slide-body slide-body--${slide.layout}">${slide.body}</div>
           <div class="slide-bottomline"><div class="slide-guide-inline"><b>GABAY SA PAGSASALITA</b><span>${slide.notes}</span></div></div>
          </div>`;
      return `<article class="slide slide--${slide.theme} slide--${slide.layout}" data-slide="${index}" aria-label="Slide ${index + 1} ng 15: ${slide.title.replaceAll('“', '').replaceAll('”', '')}" aria-hidden="true" inert>${inside}${common}</article>`;
    }).join('');

    track.innerHTML = slides.map((s,i) => `<button type="button" data-jump="${i}" aria-label="Slide ${i + 1}: ${s.title.replaceAll('“', '').replaceAll('”', '')}" title="${i+1}: ${s.section}"><span></span></button>`).join('');
    overviewGrid.innerHTML = slides.map((s, i) => `<button type="button" class="overview-item" data-jump="${i}"><span class="overview-no">${padded(i)}</span><span class="overview-item-main"><small>${s.tag}</small><strong>${s.title}</strong><em>KEYWORDS: ${s.keywords.join(' · ')}</em></span><span class="overview-item-arrow">↗</span></button>`).join('');
  }

  function displaySlide(index, {updateHash = true, announce = true} = {}) {
    const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
    const previous = host.querySelector('.slide.is-active');
    if (previous) {
      previous.classList.remove('is-active');
      previous.setAttribute('aria-hidden', 'true');
      previous.inert = true;
    }
    current = nextIndex;
    const active = host.querySelector(`[data-slide="${current}"]`);
    active.classList.add('is-active');
    active.setAttribute('aria-hidden', 'false');
    active.inert = false;
    active.scrollTop = 0;
    deck.dataset.theme = slides[current].theme;
    $('slideCounter').innerHTML = `${padded(current)} <span>/ 15</span>`;
    $('sectionName').textContent = slides[current].section.toLocaleUpperCase('fil');
    $('pageSource').textContent = slides[current].title;
    $('prevBtn').disabled = current === 0;
    $('nextBtn').disabled = current === slides.length - 1;
    $('nextBtn').querySelector('span').textContent = current === slides.length - 1 ? 'Wakas' : 'Susunod';
    track.querySelectorAll('[data-jump]').forEach((btn,i) => {
      btn.classList.toggle('progress-current', i === current);
      btn.classList.toggle('progress-done', i < current);
      if (i === current) btn.setAttribute('aria-current','step');
      else btn.removeAttribute('aria-current');
    });
    overviewGrid.querySelectorAll('[data-jump]').forEach((btn, i) => {
      btn.classList.toggle('overview-current',i===current);
      if (i === current) btn.setAttribute('aria-current','true');
      else btn.removeAttribute('aria-current');
    });
    if (updateHash) history.replaceState(null, '', `#slide-${padded(current)}`);
    document.title = `${padded(current)} / 15 — ${pageTitle}`;
    if (announce) $('screen-reader-announcement').textContent = `Slide ${current + 1} sa 15. ${slides[current].title}.`;
  }

  function openOverview() {
    if (!isOverviewOpen()) overviewDialog.showModal();
    const selected = overviewGrid.querySelector('.overview-current');
    selected?.scrollIntoView({block:'nearest'});
  }
  function closeOverview() { if (isOverviewOpen()) overviewDialog.close(); }
  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  }

  render();
  const hashMatch = location.hash.match(/^#slide-(\d{1,2})$/i);
  displaySlide(hashMatch ? Number(hashMatch[1]) - 1 : 0, { updateHash: false, announce:false });
  $('prevBtn').addEventListener('click', () => displaySlide(current - 1));
  $('nextBtn').addEventListener('click', () => displaySlide(current + 1));
  $('overviewBtn').addEventListener('click', openOverview);
  $('overviewClose').addEventListener('click', closeOverview);
  $('fullscreenBtn').addEventListener('click', toggleFullscreen);
  $('printBtn').addEventListener('click', () => { closeOverview(); window.print(); });
  document.addEventListener('fullscreenchange', () => {
    $('fullscreenBtn').setAttribute('aria-label', document.fullscreenElement ? 'Lumabas sa full screen' : 'Full screen');
  });

  for (const list of [track, overviewGrid]) {
    list.addEventListener('click', e => {
      const target = e.target.closest('[data-jump]');
      if (!target) return;
      displaySlide(Number(target.dataset.jump));
      if (list === overviewGrid) closeOverview();
    });
  }
  overviewDialog.addEventListener('click', (e) => { if (e.target === overviewDialog) closeOverview(); });
  window.addEventListener('hashchange', () => {
    const match = location.hash.match(/^#slide-(\d{1,2})$/i);
    if (match) displaySlide(Number(match[1]) - 1, { updateHash:false });
  });

  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.matches('input, textarea, select, [contenteditable]')) return;
    const key = e.key.toLowerCase();
    if (isOverviewOpen()) {
      if (key === 'o') { e.preventDefault(); closeOverview(); }
      return;
    }
    if (key === 'arrowright' || key === ' ' || key === 'pagedown') { e.preventDefault(); displaySlide(current + 1); }
    else if (key === 'arrowleft' || key === 'pageup' || key === 'backspace') { e.preventDefault(); displaySlide(current - 1); }
    else if (key === 'home') { e.preventDefault(); displaySlide(0); }
    else if (key === 'end') { e.preventDefault(); displaySlide(slides.length-1); }
    else if (key === 'o') { e.preventDefault(); openOverview(); }
    else if (key === 'f') { e.preventDefault(); toggleFullscreen(); }
    else if (key === 'p') { e.preventDefault(); window.print(); }
  });

  // Swipe only when the gesture is predominantly horizontal; allow vertical mobile scrolling.
  deck.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, {passive:true});
  deck.addEventListener('touchend', e => {
    if (startX == null || startY == null || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    startX = null; startY = null;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.65) displaySlide(current + (dx < 0 ? 1 : -1));
  }, {passive:true});
})();