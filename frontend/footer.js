// footer.js – injecté sur toutes les pages
(function () {
  const footerHTML = `
  <footer class="footer">
    <div class="footer-top">
      <div class="footer-brand">
        <div class="nav-logo" style="margin-bottom:10px">
          <img src="logo.png" alt="Artisan Nomade" class="logo-img footer-logo-img"/>
          <span class="logo-text">Artisan Nomade</span>
        </div>
        <p>L'art des perles africaines, depuis 2010.<br>Porto-Novo, Bénin.</p>
      </div>
      <div class="footer-links">
        <h4>Navigation</h4>
        <ul>
          <li><a href="index.html">Accueil</a></li>
          <li><a href="boutique.html">Boutique</a></li>
          <li><a href="apropos.html">À propos</a></li>
          <li><a href="culture.html">Histoire & Culture</a></li>
          <li><a href="partenaires.html">Partenaires</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </div>
      <div class="footer-links">
        <h4>Produits</h4>
        <ul>
          <li><a href="boutique.html">Bracelets</a></li>
          <li><a href="boutique.html">Colliers</a></li>
          <li><a href="boutique.html">Sacs</a></li>
          <li><a href="boutique.html">Objets d'art</a></li>
        </ul>
      </div>
      <div class="footer-contact">
        <h4>Contact rapide</h4>
        <p><i class="fab fa-whatsapp"></i> +229 01 97 99 85 46</p>
        <p><i class="fas fa-envelope"></i> artisannomade1@gmail.com</p>
        <div style="display:flex;gap:12px;margin-top:12px;">
          <a href="https://www.facebook.com/artisannomade" target="_blank" rel="noopener" style="color:var(--or);font-size:1.1rem;"><i class="fab fa-facebook-f"></i></a>
          <a href="https://www.instagram.com/artisannomade" target="_blank" rel="noopener" style="color:var(--or);font-size:1.1rem;"><i class="fab fa-instagram"></i></a>
        </div>
        <a href="https://wa.me/2290197998546" class="btn-whatsapp-footer" target="_blank" rel="noopener noreferrer">
          <i class="fab fa-whatsapp"></i> Chat WhatsApp
        </a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© <span id="footer-year"></span> Artisan Nomade · Porto-Novo, Bénin · Tous droits réservés</p>
      <p><a href="https://artisannomade.com">artisannomade.com</a></p>
    </div>
  </footer>
  <a href="https://wa.me/2290197998546" class="whatsapp-float" target="_blank" rel="noopener noreferrer">
    <i class="fab fa-whatsapp"></i>
  </a>
  <button class="back-top" id="back-top"><i class="fas fa-chevron-up"></i></button>`;

  document.body.insertAdjacentHTML('beforeend', footerHTML);

  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Back to top
  window.addEventListener('scroll', () => {
    const btn = document.getElementById('back-top');
    if (btn) btn.classList.toggle('show', window.scrollY > 400);
  });
  document.addEventListener('click', e => {
    if (e.target.closest('#back-top')) window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
