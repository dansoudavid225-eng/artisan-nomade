/**
 * api.js – Client API pour Artisan Nomade
 * Connecte le frontend HTML/JS au backend Express
 *
 * Usage dans n'importe quelle page :
 *   <script src="api.js"></script>
 *   const cmd = await API.commander({ client, produits, message });
 */

const API = (function () {
  // En développement : localhost. En production : votre domaine
  const BASE_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://artisan-nomade-api.onrender.com/api'; // ← remplacer par votre URL Render

  /** Helper fetch générique */
  async function request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(BASE_URL + path, opts);
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      return { ok: false, status: 0, data: { success: false, message: 'Erreur réseau. Vérifiez votre connexion.' } };
    }
  }

  return {
    /** Vérifier que l'API est en ligne */
    health: () => request('GET', '/health'),

    /** Récupérer les produits */
    getProduits: (categorie = '') =>
      request('GET', '/produits' + (categorie ? `?categorie=${categorie}` : '')),

    /** Créer une commande */
    commander: (payload) => request('POST', '/commandes', payload),

    /** Suivre une commande */
    suivreCommande: (reference) =>
      request('GET', `/commandes/${reference.toUpperCase()}`),

    /** S'abonner à la newsletter */
    newsletter: (email, nom = '') =>
      request('POST', '/newsletter', { email, nom }),

    /** Envoyer un message de contact */
    contact: (payload) => request('POST', '/contact', payload),
  };
})();

// =====================================================================
// MODALE DE COMMANDE – injectée automatiquement sur toutes les pages
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {

  // Injecter la modale dans le DOM
  const modalHTML = `
  <div class="modal-overlay" id="order-modal" role="dialog" aria-modal="true" aria-label="Formulaire de commande">
    <div class="modal-box">
      <div class="modal-header">
        <h3>Commander <span class="modal-product-name" id="modal-product-name"></span></h3>
        <button class="modal-close" id="modal-close" aria-label="Fermer">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div id="modal-form-wrap">
        <div class="modal-body">
          <div id="modal-error" style="display:none;color:#C85A3A;font-size:0.85rem;margin-bottom:16px;padding:12px;border-left:3px solid #C85A3A;background:rgba(200,90,58,0.06);">
            <i class="fas fa-exclamation-circle"></i> <span id="modal-error-text"></span>
          </div>

          <div class="modal-form-row">
            <div class="modal-form-group">
              <label for="mf-nom">Nom complet *</label>
              <input id="mf-nom" type="text" placeholder="Votre nom" autocomplete="name" required/>
            </div>
            <div class="modal-form-group">
              <label for="mf-tel">Téléphone *</label>
              <input id="mf-tel" type="tel" placeholder="+229 ..." autocomplete="tel" required/>
            </div>
          </div>

          <div class="modal-form-group">
            <label for="mf-email">Email (pour confirmation)</label>
            <input id="mf-email" type="email" placeholder="votre@email.com" autocomplete="email"/>
          </div>

          <div class="modal-form-row">
            <div class="modal-form-group">
              <label for="mf-ville">Ville *</label>
              <input id="mf-ville" type="text" placeholder="Porto-Novo" required/>
            </div>
            <div class="modal-form-group">
              <label for="mf-pays">Pays *</label>
              <select id="mf-pays" required>
                <option value="Bénin" selected>🇧🇯 Bénin</option>
                <option value="Togo">🇹🇬 Togo</option>
                <option value="Nigeria">🇳🇬 Nigeria</option>
                <option value="Ghana">🇬🇭 Ghana</option>
                <option value="Côte d'Ivoire">🇨🇮 Côte d'Ivoire</option>
                <option value="Sénégal">🇸🇳 Sénégal</option>
                <option value="Cameroun">🇨🇲 Cameroun</option>
                <option value="France">🇫🇷 France</option>
                <option value="Canada">🇨🇦 Canada</option>
                <option value="Belgique">🇧🇪 Belgique</option>
                <option value="Autre">🌍 Autre</option>
              </select>
            </div>
          </div>

          <div class="modal-form-group">
            <label for="mf-livraison">Mode de livraison *</label>
            <select id="mf-livraison">
              <option value="local">Retrait / Livraison Porto-Novo</option>
              <option value="national">Livraison nationale – Bénin</option>
              <option value="international">Livraison internationale</option>
            </select>
          </div>

          <div class="modal-form-group">
            <label for="mf-message">Personnalisation / message (optionnel)</label>
            <textarea id="mf-message" rows="3" placeholder="Couleur souhaitée, taille, occasion spéciale..."></textarea>
          </div>

          <button class="modal-submit" id="modal-submit">
            <i class="fas fa-check"></i> Confirmer la commande
          </button>

          <p style="text-align:center;font-size:0.75rem;color:#9A8878;margin-top:12px;">
            <i class="fas fa-lock" style="font-size:0.65rem;"></i>
            Nous vous contacterons par WhatsApp pour finaliser
          </p>
        </div>
      </div>

      <div class="modal-success" id="modal-success" style="display:none;">
        <div class="success-icon"><i class="fas fa-check-circle"></i></div>
        <h4>Commande envoyée !</h4>
        <div class="reference-code" id="modal-ref-code">—</div>
        <p>
          Notez cette référence pour suivre votre commande.<br>
          Nous vous contacterons très prochainement via WhatsApp.
        </p>
        <a href="https://wa.me/2290197998546" class="btn-order-api" target="_blank" rel="noopener" style="margin-top:24px;">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </a>
        <br>
        <button onclick="document.getElementById('order-modal').classList.remove('open')"
          style="margin-top:16px;background:none;border:none;cursor:pointer;color:#9A8878;font-size:0.85rem;text-decoration:underline;">
          Fermer
        </button>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // ─── État de la modale ───
  let currentProduct = null;

  function openModal(productName, productId) {
    currentProduct = { nom: productName, id: productId || '' };
    document.getElementById('modal-product-name').textContent = productName ? `– ${productName}` : '';
    document.getElementById('modal-form-wrap').style.display = '';
    document.getElementById('modal-success').style.display = 'none';
    document.getElementById('modal-error').style.display = 'none';
    document.getElementById('order-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('mf-nom').focus(), 400);
  }

  function closeModal() {
    document.getElementById('order-modal').classList.remove('open');
    document.body.style.overflow = '';
  }

  // ─── Fermeture ───
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('order-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('order-modal')) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // ─── Intercepter clics sur .btn-add et .btn-whatsapp pour ouvrir la modale ───
  document.addEventListener('click', e => {
    const trigger = e.target.closest('.btn-add, .btn-order-modal');
    if (!trigger) return;
    e.preventDefault();
    e.stopPropagation();
    const card = trigger.closest('.product-card');
    const name = card?.querySelector('h3')?.textContent?.trim() || 'ce produit';
    const id = card?.dataset?.productId || '';
    openModal(name, id);
  });

  // ─── Soumission de commande ───
  document.getElementById('modal-submit').addEventListener('click', async () => {
    const nom     = document.getElementById('mf-nom').value.trim();
    const tel     = document.getElementById('mf-tel').value.trim();
    const email   = document.getElementById('mf-email').value.trim();
    const ville   = document.getElementById('mf-ville').value.trim();
    const pays    = document.getElementById('mf-pays').value;
    const livraison = document.getElementById('mf-livraison').value;
    const message = document.getElementById('mf-message').value.trim();
    const errEl   = document.getElementById('modal-error');
    const errTxt  = document.getElementById('modal-error-text');

    // Validation côté client
    if (!nom || !tel || !ville) {
      errTxt.textContent = 'Merci de remplir tous les champs obligatoires (*)';
      errEl.style.display = '';
      return;
    }
    errEl.style.display = 'none';

    const btn = document.getElementById('modal-submit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

    const result = await API.commander({
      client: { nom, telephone: tel, email, ville, pays },
      produits: [{ nom: currentProduct.nom, id: currentProduct.id, quantite: 1 }],
      message,
      livraison,
    });

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check"></i> Confirmer la commande';

    if (result.ok && result.data.success) {
      document.getElementById('modal-form-wrap').style.display = 'none';
      document.getElementById('modal-ref-code').textContent = result.data.reference;
      document.getElementById('modal-success').style.display = '';
    } else {
      const msg = result.data?.errors?.[0]?.msg || result.data?.message || 'Erreur. Réessayez ou contactez via WhatsApp.';
      errTxt.textContent = msg;
      errEl.style.display = '';
    }
  });

  // ─── Newsletter via API (surcharger le comportement Formspree) ───
  const nlForms = document.querySelectorAll('.newsletter-form');
  nlForms.forEach(form => {
    // Désactiver la soumission native Formspree
    form.removeAttribute('action');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      const btn = form.querySelector('.newsletter-btn');
      const successEl = document.getElementById('nl-success');
      if (!emailInput?.value) return;

      btn.textContent = '...';
      btn.disabled = true;

      const result = await API.newsletter(emailInput.value);

      if (result.ok && result.data.success) {
        form.style.display = 'none';
        if (successEl) successEl.classList.add('show');
      } else {
        btn.textContent = result.data.message || 'Réessayer';
        btn.disabled = false;
      }
    });
  });

  // ─── Formulaire de contact via API ───
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.removeAttribute('action');
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn    = document.getElementById('cf-submit');
      const succEl = document.getElementById('form-success');
      const errEl2 = document.getElementById('form-error');

      if (succEl) succEl.classList.remove('show');
      if (errEl2) errEl2.classList.remove('show');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
      btn.disabled = true;

      const result = await API.contact({
        nom:       contactForm.querySelector('[name="name"]')?.value?.trim(),
        email:     contactForm.querySelector('[name="email"]')?.value?.trim(),
        telephone: contactForm.querySelector('[name="telephone"]')?.value?.trim(),
        sujet:     contactForm.querySelector('[name="sujet"]')?.value,
        message:   contactForm.querySelector('[name="message"]')?.value?.trim(),
      });

      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer le message';

      if (result.ok && result.data.success) {
        if (succEl) succEl.classList.add('show');
        contactForm.reset();
      } else {
        if (errEl2) errEl2.classList.add('show');
      }
    });
  }

  // ─── Prix des produits : injecte le prix réel (catalogue API) sur les cartes ───
  // qui ont un data-product-id. Si l'API ne répond pas (backend endormi sur
  // Render, ou hors ligne), la carte garde son texte par défaut ("Sur commande").
  const priceCards = document.querySelectorAll('.product-card[data-product-id]');
  if (priceCards.length) {
    API.getProduits().then(result => {
      if (!result.ok || !result.data.success) return;
      const parPrixId = {};
      result.data.produits.forEach(p => { parPrixId[p.id] = p.prix; });
      const fmt = new Intl.NumberFormat('fr-FR');
      priceCards.forEach(card => {
        const prix = parPrixId[card.dataset.productId];
        if (prix === undefined || prix === null) return;
        const priceEl = card.querySelector('.product-price');
        if (priceEl) priceEl.textContent = `${fmt.format(prix)} FCFA`;
      });
    }).catch(() => { /* silencieux : on garde "Sur commande" */ });
  }

});
