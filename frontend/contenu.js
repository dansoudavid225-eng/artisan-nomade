/**
 * contenu.js – CMS Frontend Artisan Nomade
 * Charge tout le contenu depuis l'API et l'injecte dans chaque page.
 * Si l'API ne répond pas, le contenu HTML statique reste intact.
 */
(function () {
  const BASE_URL = CONFIG.API_BASE_URL;

  const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
  function escapeHtml(v) {
    if (v == null) return '';
    return String(v).replace(/[&<>"']/g, ch => HTML_ENTITIES[ch]);
  }

  function sanitizeHtml(str) {
    if (!str) return '';
    const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
    const safeTags = /<\/?(b|i|em|strong|a|p|br|ul|ol|li|span|div|img|h[1-6]|u|s|sub|sup|blockquote|pre|code)(\s[^>]*)?\/?>/gi;
    const allowedAttrs = /(href|src|alt|title|class|style|target|rel)=("([^"]*)"|'([^']*)')/gi;
    return str
      .replace(/[&<>"']/g, ch => escapeMap[ch])
      .replace(/(&lt;)(\/?(?:b|i|em|strong|a|p|br|ul|ol|li|span|div|img|h[1-6]|u|s|sub|sup|blockquote|pre|code)(\s[^>]*)?)(\/?&gt;)/gi,
        (_, open, tag, attrs, close) => {
          if (tag.startsWith('/')) return '<' + tag + '>';
          const safe = attrs ? attrs.replace(/(href|src|alt|title|class|style|target|rel|loading|width|height)=("(?:[^"]*)"|'(?:[^']*)')/gi, '$1=$2') : '';
          return '<' + (tag.startsWith('/') ? '' : tag.split(/\s/)[0]) + safe + '>';
        })
      .replace(/(&lt;)(\/?[a-z-]+)((?:[^>]*)?)(\/?&gt;)/gi, (_, o, t, a, c) => safeTags.test('<' + t + a + c) ? '<' + t + a + c : (o + t + a + c));
  }

  function injecter(el, val) {
    if (val === undefined || val === null || val === '') return;
    const type = el.dataset.cmsType || 'text';
    if (type === 'html') el.innerHTML = sanitizeHtml(val);
    else if (type === 'src') el.src = val;
    else if (type === 'href') el.href = val;
    else el.textContent = val;
  }

  function appliquer(contenu) {
    const flat = {};
    Object.entries(contenu).forEach(([sec, val]) => {
      if (typeof val === 'object' && !Array.isArray(val)) {
        Object.entries(val).forEach(([k, v]) => {
          flat[`${sec}.${k}`] = v;
          flat[k] = v;
        });
      }
    });

    document.querySelectorAll('[data-cms]').forEach(el => injecter(el, flat[el.dataset.cms]));

    // ── LOGO ──
    if (contenu.global?.logo_url) {
      document.querySelectorAll('.logo-img').forEach(img => { img.src = contenu.global.logo_url; });
    }

    // ── TITRE ONGLET ──
    if (contenu.global?.nom_boutique && document.title.includes('Artisan Nomade')) {
      document.title = document.title.replace('Artisan Nomade', contenu.global.nom_boutique);
    }

    // ── WHATSAPP ──
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

    // ── SLIDES HERO ──
    if (contenu.slides?.length) {
      const track = document.getElementById('hs-track');
      if (track) {
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

    // ── GALERIE PHOTOS ──
    if (contenu.galerie?.length) {
      const slider = document.getElementById('gallery-slider');
      if (slider) {
        slider.innerHTML = contenu.galerie.map(g =>
          '<div class="gallery-slide">' +
            '<img src="' + escapeHtml(g.image) + '" alt="' + escapeHtml(g.caption || '') + '"/>' +
            '<div class="gallery-slide-caption">' + escapeHtml(g.caption || '') + '</div>' +
          '</div>').join('');
      }
    }

    // ── SERVICES ──
    if (contenu.services?.length) {
      const grid = document.querySelector('.services-grid');
      if (grid && document.querySelector('[data-cms="accueil.services_titre"]')) {
        grid.innerHTML = contenu.services.map(s =>
          '<div class="service-card reveal">' +
            '<div class="service-icon"><i class="' + escapeHtml(s.icone) + '"></i></div>' +
            '<h3>' + escapeHtml(s.titre) + '</h3>' +
            '<p>' + escapeHtml(s.texte) + '</p>' +
          '</div>').join('');
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
        track.innerHTML = contenu.avis.map(a =>
          '<div class="avis-card">' +
            '<div class="stars">' + '★'.repeat(a.note || 5) + '</div>' +
            '<p>"' + escapeHtml(a.texte) + '"</p>' +
            '<div class="avis-author">' +
              '<div class="author-avatar">' + escapeHtml((a.auteur || '?')[0]) + '</div>' +
              '<div><strong>' + escapeHtml(a.auteur) + '</strong><span>' + escapeHtml(a.origine) + '</span></div>' +
            '</div>' +
          '</div>').join('');
      }
    }

    // ── FAQ ──
    if (contenu.faq?.length) {
      const container = document.getElementById('faq-container');
      if (container) {
        container.innerHTML = contenu.faq.map(f =>
          '<div class="service-card reveal" style="text-align:left;">' +
            '<h3 style="margin-bottom:10px;">' + escapeHtml(f.question) + '</h3>' +
            '<p>' + escapeHtml(f.reponse) + '</p>' +
          '</div>').join('');
      }
    }

    // ── VALEURS ──
    if (contenu.valeurs?.length) {
      const grid = document.getElementById('valeurs-grid');
      if (grid) {
        grid.innerHTML = contenu.valeurs.map(v =>
          '<div class="value-item">' +
            '<h4>' + escapeHtml(v.titre) + '</h4>' +
            '<p>' + escapeHtml(v.texte) + '</p>' +
          '</div>').join('');
      }
    }

    // ── ÉQUIPE ──
    if (contenu.equipe?.length) {
      const grid = document.getElementById('team-grid');
      if (grid) {
        grid.innerHTML = contenu.equipe.map(m =>
          '<div class="team-card reveal">' +
            (m.photo
              ? '<img src="' + escapeHtml(m.photo) + '" alt="' + escapeHtml(m.nom) + '" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:12px;"/>'
              : '<div class="team-avatar"><i class="fas fa-user"></i></div>') +
            '<h4>' + escapeHtml(m.nom) + '</h4>' +
            '<p>' + escapeHtml(m.role) + '</p>' +
            (m.description ? '<p style="font-size:0.8rem;color:var(--gris);margin-top:6px;">' + escapeHtml(m.description) + '</p>' : '') +
          '</div>').join('');
      }
    }

    // ── HISTOIRE IMAGE ──
    if (contenu.apropos?.histoire_image) {
      const img = document.querySelector('.apropos-image img, .apropos-visual img');
      if (img) img.src = contenu.apropos.histoire_image;
    }

    // ── TEXTES HISTOIRE ──
    if (contenu.apropos) {
      ['histoire_texte_1','histoire_texte_2','histoire_texte_3'].forEach((k, i) => {
        const els = document.querySelectorAll('.apropos-text > p');
        if (els[i] && contenu.apropos[k]) els[i].textContent = contenu.apropos[k];
      });
    }

    // ── TABS CULTURE ──
    if (contenu.culture) {
      const tabIds = { histoire: 'tab_histoire', perles: 'tab_perles', fabrication: 'tab_fabrication' };
      Object.entries(tabIds).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el && contenu.culture[key]) el.querySelector('p').textContent = contenu.culture[key];
      });
    }

  }

  fetch(BASE_URL + '/contenu')
    .then(r => r.ok ? r.json() : null)
    .then(data => { if (data?.success && data.contenu) appliquer(data.contenu); })
    .catch(() => {});

})();
