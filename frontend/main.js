// main.js – commun à toutes les pages

document.addEventListener('DOMContentLoaded', () => {

  // BARRE DE PROGRESSION SCROLL
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.prepend(progressBar);
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (window.scrollY / total * 100) + '%';
  }, { passive: true });

  // CURSEUR PERLE PERSONNALISÉ (desktop uniquement)
  if (window.matchMedia('(pointer: fine)').matches) {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    let rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      // Ring follows with slight delay
      rx += (e.clientX - rx) * 0.18;
      ry += (e.clientY - ry) * 0.18;
      ring.style.left = e.clientX + 'px';
      ring.style.top = e.clientY + 'px';
    });
    document.querySelectorAll('a, button, [role="button"]').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
    });
  }

  // SKELETON LOADER POUR IMAGES
  document.querySelectorAll('img').forEach(img => {
    if (!img.complete) {
      img.classList.add('img-loading');
      img.addEventListener('load', () => img.classList.remove('img-loading'), { once: true });
    }
  });


  // FALLBACK IMAGES CASSÉES (ex: dossier photos/ manquant)
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      if (img.dataset.fallback) return; // évite boucle si placeholder.svg manque aussi
      img.dataset.fallback = '1';
      img.src = 'placeholder.svg';
      img.classList.add('img-placeholder');
    });
  });

  // LOADER
  const loader = document.getElementById('loader');
  if (loader) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.style.overflow = 'auto';
        revealVisible();
      }, 1400);
    });
    document.body.style.overflow = 'hidden';
  }

  // REVEAL ON SCROLL
  function revealVisible() {
    document.querySelectorAll('.reveal').forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 60) {
        setTimeout(() => el.classList.add('visible'), i * 80);
      }
    });
  }
  window.addEventListener('scroll', revealVisible);
  revealVisible();

  // COMPTEUR STATS
  const statNumbers = document.querySelectorAll('.stat-number');
  let counted = false;
  function countUp() {
    if (counted || !statNumbers.length) return;
    const statsEl = document.querySelector('.stats');
    if (!statsEl) return;
    if (statsEl.getBoundingClientRect().top < window.innerHeight) {
      counted = true;
      statNumbers.forEach(el => {
        const target = parseInt(el.getAttribute('data-target'));
        let current = 0;
        const step = target / 120;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = Math.floor(current);
        }, 16);
      });
    }
  }
  window.addEventListener('scroll', countUp);
  countUp();

  // TABS
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const t = document.getElementById(btn.getAttribute('data-tab'));
      if (t) t.classList.add('active');
    });
  });

  // FILTRES BOUTIQUE
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      document.querySelectorAll('.product-card').forEach(card => {
        const show = filter === 'all' || card.getAttribute('data-category') === filter;
        card.style.opacity = show ? '1' : '0';
        card.style.transform = show ? 'translateY(0)' : 'translateY(20px)';
        setTimeout(() => card.style.display = show ? 'block' : 'none', show ? 0 : 300);
        if (show) card.style.display = 'block';
      });
    });
  });

  // SLIDER AVIS
  const track = document.getElementById('avis-track');
  const dotsContainer = document.getElementById('slider-dots');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  if (track) {
    const cards = track.querySelectorAll('.avis-card');
    let current = 0;
    const getVisible = () => window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
    let visibleCount = getVisible();
    const maxIndex = () => Math.max(0, cards.length - visibleCount);

    function createDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      for (let i = 0; i <= maxIndex(); i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === current) dot.classList.add('active');
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      }
    }
    function goTo(i) {
      current = Math.max(0, Math.min(i, maxIndex()));
      const w = cards[0].offsetWidth + 28;
      track.style.transform = `translateX(-${current * w}px)`;
      document.querySelectorAll('.dot').forEach((d, idx) => d.classList.toggle('active', idx === current));
    }
    prevBtn && prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn && nextBtn.addEventListener('click', () => goTo(current + 1));
    createDots();
    let auto = setInterval(() => goTo(current >= maxIndex() ? 0 : current + 1), 4000);
    track.addEventListener('mouseenter', () => clearInterval(auto));
    track.addEventListener('mouseleave', () => { auto = setInterval(() => goTo(current >= maxIndex() ? 0 : current + 1), 4000); });
    let sx = 0;
    track.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    track.addEventListener('touchend', e => { const d = sx - e.changedTouches[0].clientX; if (Math.abs(d) > 50) goTo(d > 0 ? current + 1 : current - 1); });
    window.addEventListener('resize', () => { visibleCount = getVisible(); createDots(); goTo(0); });
  }

  // FORMULAIRE CONTACT – Formspree AJAX
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = document.getElementById('cf-submit');
      const successEl = document.getElementById('form-success');
      const errorEl = document.getElementById('form-error');
      if (successEl) successEl.classList.remove('show');
      if (errorEl) errorEl.classList.remove('show');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
      btn.disabled = true;
      try {
        const data = new FormData(form);
        const res = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          if (successEl) successEl.classList.add('show');
          form.reset();
          setTimeout(() => successEl && successEl.classList.remove('show'), 6000);
        } else {
          throw new Error('Erreur serveur');
        }
      } catch {
        if (errorEl) errorEl.classList.add('show');
        setTimeout(() => errorEl && errorEl.classList.remove('show'), 6000);
      } finally {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer le message';
        btn.disabled = false;
      }
    });
  }

  // BOUTONS WHATSAPP PRODUITS
  document.querySelectorAll('.btn-whatsapp, .btn-add').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.product-card');
      const name = card ? card.querySelector('h3')?.textContent : 'un produit';
      const msg = encodeURIComponent(`Bonjour ! Je suis intéressé(e) par "${name}". Pouvez-vous me donner plus d'informations ?`);
      window.open(`https://wa.me/2290197998546?text=${msg}`, '_blank');
    });
  });

  // ============================================
  // LIGHTBOX – agrandissement image au clic
  // ============================================
  (function() {
    // Créer le DOM de la lightbox
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.innerHTML = `
      <div class="lb-backdrop"></div>
      <div class="lb-box">
        <button class="lb-close" aria-label="Fermer"><i class="fas fa-times"></i></button>
        <button class="lb-prev" aria-label="Précédent"><i class="fas fa-chevron-left"></i></button>
        <button class="lb-next" aria-label="Suivant"><i class="fas fa-chevron-right"></i></button>
        <div class="lb-img-wrap">
          <img class="lb-img" src="" alt=""/>
          <div class="lb-loader"><div class="loader-bead"></div><div class="loader-bead"></div><div class="loader-bead"></div></div>
        </div>
        <div class="lb-caption"></div>
        <div class="lb-counter"></div>
      </div>`;
    document.body.appendChild(lb);

    const lbImg    = lb.querySelector('.lb-img');
    const lbCap    = lb.querySelector('.lb-caption');
    const lbCount  = lb.querySelector('.lb-counter');
    const lbLoader = lb.querySelector('.lb-loader');
    let images = [], cur = 0;

    function getImages() {
      // Collecte toutes les images cliquables : produits + galerie
      const imgs = [];
      document.querySelectorAll('.product-photo, .gallery-slide img, .apropos-img-block img').forEach(img => {
        if (img.src && !img.src.includes('placeholder')) {
          imgs.push({ src: img.src, alt: img.alt || '' });
        }
      });
      return imgs;
    }

    function open(idx) {
      images = getImages();
      cur = Math.max(0, Math.min(idx, images.length - 1));
      lb.classList.add('active');
      document.body.style.overflow = 'hidden';
      show(cur);
    }

    function close() {
      lb.classList.remove('active');
      document.body.style.overflow = '';
    }

    function show(i) {
      cur = (i + images.length) % images.length;
      lbLoader.style.display = 'flex';
      lbImg.style.opacity = '0';
      lbImg.src = '';
      const tempImg = new Image();
      tempImg.onload = () => {
        lbImg.src = images[cur].src;
        lbImg.alt = images[cur].alt;
        lbLoader.style.display = 'none';
        lbImg.style.opacity = '1';
      };
      tempImg.src = images[cur].src;
      lbCap.textContent = images[cur].alt;
      lbCount.textContent = (cur + 1) + ' / ' + images.length;
    }

    // Attacher les clics
    document.addEventListener('click', e => {
      const img = e.target.closest('.product-photo, .gallery-slide img');
      if (!img) return;
      images = getImages();
      const idx = images.findIndex(it => it.src === img.src);
      open(idx >= 0 ? idx : 0);
    });

    lb.querySelector('.lb-backdrop').addEventListener('click', close);
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', () => show(cur - 1));
    lb.querySelector('.lb-next').addEventListener('click', () => show(cur + 1));

    // Clavier
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });

    // Swipe tactile
    let sx = 0;
    lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
    lb.addEventListener('touchend', e => {
      const dx = sx - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 50) show(dx > 0 ? cur + 1 : cur - 1);
    });

    // Curseur pointer sur images cliquables
    document.querySelectorAll('.product-photo, .gallery-slide img').forEach(img => {
      img.style.cursor = 'zoom-in';
    });
  })();

  // NEWSLETTER – soumission AJAX
  const nlForm = document.getElementById('newsletter-form');
  if (nlForm) {
    nlForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = document.getElementById('nl-btn');
      const successEl = document.getElementById('nl-success');
      btn.textContent = '...';
      btn.disabled = true;
      try {
        const res = await fetch(nlForm.action, {
          method: 'POST',
          body: new FormData(nlForm),
          headers: { Accept: 'application/json' }
        });
        if (res.ok) {
          nlForm.style.display = 'none';
          if (successEl) successEl.classList.add('show');
        } else throw new Error();
      } catch {
        btn.textContent = 'Réessayer';
        btn.disabled = false;
      }
    });
  }

});