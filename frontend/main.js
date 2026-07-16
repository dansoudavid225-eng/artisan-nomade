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
  const fallbackSrc = 'placeholder.svg';
  let fallbackWorks = true;
  // Test si placeholder.svg existe (évite boucle infinie si lui-même est cassé)
  const fbTest = new Image();
  fbTest.onerror = () => { fallbackWorks = false; };
  fbTest.src = fallbackSrc;

  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      if (img.dataset.fallback || !fallbackWorks) {
        if (!img.dataset.fallback) {
          img.style.visibility = 'hidden';
          img.style.display = 'none';
        }
        return;
      }
      img.dataset.fallback = '1';
      img.src = fallbackSrc;
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
      document.querySelectorAll('.product-photo, .gallery-slide img').forEach(img => {
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

  // ============================================
  // ANIMATIONS AVANCÉES
  // ============================================

  // ── 1. Smooth scroll pour tous les ancres ──
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── 2. Ripple effect sur les boutons ──
  document.querySelectorAll('.btn, .btn-primary, .btn-ghost, .link-btn, .btn-primary-ghost').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // ── 3. Magnetic hover sur les boutons ──
  document.querySelectorAll('.btn, .btn-primary, .btn-ghost').forEach(btn => {
    btn.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      this.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    btn.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });

  // ── 4. 3D Tilt sur les cartes ──
  document.querySelectorAll('.service-card, .product-card, .team-card, .culture-card').forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      this.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
      this.style.transition = 'transform 0.5s ease';
    });
  });

  // ── 5. Particules flottantes (perles) dans le hero ──
  (function() {
    const hero = document.querySelector('.hero, .page-hero');
    if (!hero || hero.querySelector('.particles-canvas')) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'particles-canvas';
    canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;';
    hero.style.position = 'relative';
    hero.prepend(canvas);
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];

    function resize() {
      w = canvas.width = hero.offsetWidth;
      h = canvas.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#C9A84C', '#E2C47A', '#F5EDD8', '#8A7A6A'];
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        r: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.3,
        alpha: 0.2 + Math.random() * 0.3,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y + p.r < 0) { p.y = h + p.r; p.x = Math.random() * w; }
        if (p.x < -p.r) p.x = w + p.r;
        if (p.x > w + p.r) p.x = -p.r;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha + Math.sin(Date.now() * 0.002 + p.x) * 0.1;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    }
    animate();
  })();

  // ── 6. Parallax doux sur les sections hero ──
  window.addEventListener('scroll', () => {
    document.querySelectorAll('.page-hero, .hero').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const y = rect.top * 0.3;
        const content = el.querySelector('.page-hero-content, .hero-content');
        if (content) content.style.transform = `translateY(${y}px)`;
      }
    });
  }, { passive: true });

  // ── 7. Compteur amélioré avec easing ──
  const countObservers = new Map();
  document.querySelectorAll('.stat-number').forEach(el => {
    const target = parseInt(el.getAttribute('data-target'));
    el.textContent = '0';
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !countObservers.get(el)) {
          countObservers.set(el, true);
          let start = 0;
          const duration = 2000;
          const startTime = performance.now();
          function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            start = Math.floor(ease * target);
            el.textContent = start;
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = target;
          }
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(el);
  });

  // ── 8. Reveal amélioré avec différentes classes ──
  function revealEnhanced() {
    document.querySelectorAll('.reveal-up, .reveal-scale, .reveal-left, .reveal-right, .reveal').forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 60) {
        setTimeout(() => el.classList.add('visible'), i * 60);
      }
    });
  }
  window.addEventListener('scroll', revealEnhanced);
  revealEnhanced();

  // ── 9. Glow au survol des liens ──
  document.querySelectorAll('a[href], .nav-link').forEach(el => {
    el.addEventListener('mouseenter', function() {
      this.style.textShadow = '0 0 12px rgba(201,168,76,0.4)';
    });
    el.addEventListener('mouseleave', function() {
      this.style.textShadow = '';
    });
  });

});