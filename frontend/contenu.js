/**
 * contenu.js – CMS Frontend Artisan Nomade
 * Charge tout le contenu depuis l'API et l'injecte dans chaque page.
 * Si l'API ne répond pas, le contenu HTML statique reste intact.
 */
(function () {
  const BASE_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? 'http://localhost:3001/api'
    : 'https://artisan-nomade-api.onrender.com/api'; // ONRENDER_URL

  function injecter(el, val) {
    if (val === undefined || val === null || val === '') return;
    const type = el.dataset.cmsType || 'text';
    if (type === 'html') el.innerHTML = val;
    else if (type === 'src') el.src = val;
    else if (type === 'href') el.href = val;
    else el.textContent = val;
  }

  function appliquer(contenu) {
    // Aplatir toutes les sections pour les data-cms simples
    const flat = {};
    Object.entries(contenu).forEach(([sec, val]) => {
      if (typeof val === 'object' && !Array.isArray(val)) {
        Object.entries(val).forEach(([k, v]) => {
          flat[`${sec}.${k}`] = v;
          flat[k] = v;
        });
      }
    });

    // Injecter data-cms="clé"
    document.querySelectorAll('[data-cms]').forEach(el => injecter(el, flat[el.dataset.cms]));

    // ── LOGO ──
    if (contenu.global?.logo_url) {
      document.querySelectorAll('.logo-img').forEach(img => { img.src = contenu.global.logo_url; });
    }

    // ── TITRE ONGLET ──
    if (contenu.global?.nom_boutique && document.title.includes('Artisan Nomade')) {
      document.title = document.title.replace('Artisan Nomade', contenu.global.nom_boutique);
    }

    // ── WHATSAPP (tous les liens wa.me) ──
    if (contenu.global?.whatsapp) {
      document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
        a.href = a.href.replace(/wa\.me\/[\d+]+/, 'wa.me/' + contenu.global.whatsapp);
      });
    }

    // ── RÉSEAUX SOCIAUX ──
    if (contenu.global?.facebook) document.querySelectorAll('a[data-social="facebook"]').forEach(a => a.href = contenu.global.facebook);
    if (contenu.global?.instagram) document.querySelectorAll('a[data-social="instagram"]').forEach(a => a.href = contenu.global.instagram);
    if (contenu.global?.tiktok) document.querySelectorAll('a[data-social="tiktok"]').forEach(a => {
      a.href = contenu.global.tiktok;
      a.style.display = contenu.global.tiktok ? '' : 'none';
    });

    // ── SLIDES HERO (index.html) ──
    if (contenu.slides?.length) {
      const track = document.getElementById('hs-track');
      if (track) {
        // Ne reconstruire que si les slides existent déjà (évite de casser le JS du slider)
        const existingSlides = track.querySelectorAll('.hs-slide');
        contenu.slides.forEach((s, i) => {
          const slide = existingSlides[i];
          if (!slide) return;
          const img = slide.querySelector('.hs-img');
          if (img && s.image) img.src = s.image;
          slide.dataset.tag = s.tag || slide.dataset.tag;
          slide.dataset.title = s.titre || slide.dataset.title;
          slide.dataset.sub = s.sous_titre || slide.dataset.sub;
        });
      }
    }

    // ── GALERIE PHOTOS (index.html) ──
    if (contenu.galerie?.length) {
      const slider = document.getElementById('gallery-slider');
      if (slider) {
        slider.innerHTML = contenu.galerie.map(g => `
          <div class="gallery-slide">
            <img src="${g.image}" alt="${g.caption || ''}"/>
            <div class="gallery-slide-caption">${g.caption || ''}</div>
          </div>`).join('');
      }
    }

    // ── SERVICES (index.html – "Commander chez nous") ──
    if (contenu.services?.length) {
      const grid = document.querySelector('.services-grid');
      if (grid && document.querySelector('[data-cms="accueil.services_titre"]')) {
        grid.innerHTML = contenu.services.map(s => `
          <div class="service-card reveal">
            <div class="service-icon"><i class="${s.icone}"></i></div>
            <h3>${s.titre}</h3>
            <p>${s.texte}</p>
          </div>`).join('');
      }
    }

    // ── STATS ──
    if (contenu.accueil) {
      const stats = [
        { val: contenu.accueil.stat_1_val, unite: contenu.accueil.stat_1_unite, label: contenu.accueil.stat_1_label },
        { val: contenu.accueil.stat_2_val, unite: contenu.accueil.stat_2_unite, label: contenu.accueil.stat_2_label },
        { val: contenu.accueil.stat_3_val, unite: contenu.accueil.stat_3_unite, label: contenu.accueil.stat_3_label },
      ];
      document.querySelectorAll('.stat-item').forEach((item, i) => {
        if (!stats[i]) return;
        const num = item.querySelector('.stat-number');
        const unit = item.querySelector('.stat-unit');
        const lbl = item.querySelector('p');
        if (num && stats[i].val) num.dataset.target = stats[i].val;
        if (unit && stats[i].unite) unit.textContent = stats[i].unite;
        if (lbl && stats[i].label) lbl.textContent = stats[i].label;
      });
    }

    // ── AVIS CLIENTS ──
    if (contenu.avis?.length) {
      const track = document.getElementById('avis-track');
      if (track) {
        track.innerHTML = contenu.avis.map(a => `
          <div class="avis-card">
            <div class="stars">${'★'.repeat(a.note || 5)}</div>
            <p>"${a.texte}"</p>
            <div class="avis-author">
              <div class="author-avatar">${(a.auteur || '?')[0]}</div>
              <div><strong>${a.auteur}</strong><span>${a.origine}</span></div>
            </div>
          </div>`).join('');
      }
    }

    // ── FAQ (contact.html) ──
    if (contenu.faq?.length) {
      const container = document.getElementById('faq-container');
      if (container) {
        container.innerHTML = contenu.faq.map(f => `
          <div class="service-card reveal" style="text-align:left;">
            <h3 style="margin-bottom:10px;">${f.question}</h3>
            <p>${f.reponse}</p>
          </div>`).join('');
      }
    }

    // ── VALEURS (apropos.html) ──
    if (contenu.valeurs?.length) {
      const grid = document.getElementById('valeurs-grid');
      if (grid) {
        grid.innerHTML = contenu.valeurs.map(v => `
          <div class="value-item">
            <h4>${v.titre}</h4>
            <p>${v.texte}</p>
          </div>`).join('');
      }
    }

    // ── ÉQUIPE (apropos.html) ──
    if (contenu.equipe?.length) {
      const grid = document.getElementById('team-grid');
      if (grid) {
        grid.innerHTML = contenu.equipe.map(m => `
          <div class="team-card reveal">
            ${m.photo ? `<img src="${m.photo}" alt="${m.nom}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:12px;"/>` : `<div class="team-avatar"><i class="fas fa-user"></i></div>`}
            <h4>${m.nom}</h4>
            <p>${m.role}</p>
            ${m.description ? `<p style="font-size:0.8rem;color:var(--gris);margin-top:6px;">${m.description}</p>` : ''}
          </div>`).join('');
      }
    }

    // ── HISTOIRE IMAGE (apropos.html) ──
    if (contenu.apropos?.histoire_image) {
      const img = document.querySelector('.apropos-image img, .apropos-visual img');
      if (img) img.src = contenu.apropos.histoire_image;
    }

    // ── TEXTES HISTOIRE (apropos.html) ──
    if (contenu.apropos) {
      ['histoire_texte_1','histoire_texte_2','histoire_texte_3'].forEach((k, i) => {
        const els = document.querySelectorAll('.apropos-text > p');
        if (els[i] && contenu.apropos[k]) els[i].textContent = contenu.apropos[k];
      });
    }

    // ── TABS CULTURE (culture.html) ──
    if (contenu.culture) {
      const tabIds = { histoire: 'tab_histoire', perles: 'tab_perles', fabrication: 'tab_fabrication' };
      Object.entries(tabIds).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el && contenu.culture[key]) el.querySelector('p').textContent = contenu.culture[key];
      });
    }

    // ── PARTENAIRES (partenaires.html) ──
    if (contenu.partenaires_liste?.length) {
      const grid = document.getElementById('partenaires-grid');
      if (grid) {
        grid.innerHTML = contenu.partenaires_liste.map(p => `
          <div class="partenaire-card reveal">
            ${p.logo ? `<img src="${p.logo}" alt="${p.nom}" style="width:64px;height:64px;object-fit:contain;margin-bottom:12px;border-radius:8px;"/>` : `<div class="partenaire-logo"><i class="fas fa-store"></i></div>`}
            <h3>${p.nom}</h3>
            <p>${p.description}</p>
            <span class="product-badge" style="position:static;display:inline-block;margin-bottom:16px;">${p.badge}</span><br/>
            <a href="${p.lien || 'contact.html'}" class="partenaire-link">Nous contacter <i class="fas fa-arrow-right"></i></a>
          </div>`).join('');
      }
    }
  }

  fetch(BASE_URL + '/contenu')
    .then(r => r.ok ? r.json() : null)
    .then(data => { if (data?.success && data.contenu) appliquer(data.contenu); })
    .catch(() => {});

})();
