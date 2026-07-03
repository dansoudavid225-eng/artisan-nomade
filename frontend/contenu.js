/**
 * contenu.js – Artisan Nomade CMS
 * Charge le contenu depuis l'API et l'injecte dans la page via data-cms="clé"
 * Si l'API ne répond pas, le contenu HTML statique reste intact (fallback).
 */
(function () {
  const BASE_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? 'http://localhost:3001/api'
    : 'https://artisan-nomade-api.onrender.com/api'; // ONRENDER_URL

  // Détecte la page courante
  const page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

  /**
   * Injecte une valeur dans un élément selon son type
   */
  function injecter(el, valeur) {
    if (valeur === undefined || valeur === null || valeur === '') return;
    const type = el.dataset.cmsType || 'text';
    switch (type) {
      case 'html':
        el.innerHTML = valeur;
        break;
      case 'src':
        el.src = valeur;
        break;
      case 'href':
        el.href = valeur;
        break;
      case 'placeholder':
        el.placeholder = valeur;
        break;
      case 'data-target':
        el.dataset.target = valeur;
        break;
      default:
        el.textContent = valeur;
    }
  }

  /**
   * Applique le contenu à tous les éléments [data-cms]
   */
  function appliquerContenu(contenu) {
    // Aplatir le contenu : { "global.nom_boutique": "...", "accueil.hero_titre_1": "..." }
    const flat = {};
    Object.entries(contenu).forEach(([section, valeurs]) => {
      if (section === 'avis') return; // géré séparément
      if (typeof valeurs === 'object' && !Array.isArray(valeurs)) {
        Object.entries(valeurs).forEach(([clé, val]) => {
          flat[`${section}.${clé}`] = val;
          flat[clé] = val; // accès sans préfixe aussi
        });
      }
    });

    // Injecter dans les éléments data-cms
    document.querySelectorAll('[data-cms]').forEach(el => {
      const clé = el.dataset.cms;
      const valeur = flat[clé];
      injecter(el, valeur);
    });

    // Logo (src spécial)
    if (contenu.global?.logo_url) {
      document.querySelectorAll('.logo-img').forEach(img => {
        img.src = contenu.global.logo_url;
      });
    }

    // Nom de la boutique dans le titre de l'onglet (sauf si le titre est déjà personnalisé)
    if (contenu.global?.nom_boutique) {
      const titre = document.title;
      if (titre.includes('Artisan Nomade')) {
        document.title = titre.replace('Artisan Nomade', contenu.global.nom_boutique);
      }
    }

    // Liens sociaux dans le footer
    const fbLinks = document.querySelectorAll('a[data-social="facebook"]');
    const igLinks = document.querySelectorAll('a[data-social="instagram"]');
    const tkLinks = document.querySelectorAll('a[data-social="tiktok"]');
    if (contenu.global?.facebook) fbLinks.forEach(a => a.href = contenu.global.facebook);
    if (contenu.global?.instagram) igLinks.forEach(a => a.href = contenu.global.instagram);
    if (contenu.global?.tiktok) tkLinks.forEach(a => { a.href = contenu.global.tiktok; a.style.display = contenu.global.tiktok ? '' : 'none'; });

    // Liens WhatsApp
    if (contenu.global?.whatsapp) {
      document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
        a.href = a.href.replace(/wa\.me\/\d+/, `wa.me/${contenu.global.whatsapp}`);
      });
    }

    // Avis clients (page d'accueil uniquement)
    if (contenu.avis && Array.isArray(contenu.avis)) {
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

    // Stats (data-target pour l'animation du compteur)
    if (contenu.accueil) {
      const stats = [
        { target: contenu.accueil.stat_1_val, unite: contenu.accueil.stat_1_unite, label: contenu.accueil.stat_1_label },
        { target: contenu.accueil.stat_2_val, unite: contenu.accueil.stat_2_unite, label: contenu.accueil.stat_2_label },
        { target: contenu.accueil.stat_3_val, unite: contenu.accueil.stat_3_unite, label: contenu.accueil.stat_3_label },
      ];
      const statItems = document.querySelectorAll('.stat-item');
      statItems.forEach((item, i) => {
        if (!stats[i]) return;
        const num = item.querySelector('.stat-number');
        const unit = item.querySelector('.stat-unit');
        const lbl = item.querySelector('p');
        if (num && stats[i].target) num.dataset.target = stats[i].target;
        if (unit && stats[i].unite) unit.textContent = stats[i].unite;
        if (lbl && stats[i].label) lbl.textContent = stats[i].label;
      });
    }
  }

  // Charge le contenu depuis l'API
  fetch(`${BASE_URL}/contenu`)
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data?.success && data.contenu) {
        appliquerContenu(data.contenu);
      }
    })
    .catch(() => { /* silencieux : le contenu statique reste intact */ });

})();
