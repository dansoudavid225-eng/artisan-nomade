// navbar.js – injecté sur toutes les pages
(function () {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // THEME JOUR/NUIT — appliqué tôt (masqué par le loader, pas de flash)
  const savedTheme = localStorage.getItem('artisan-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', initialTheme);

  const navHTML = `
  <nav class="navbar" id="navbar">
    <a href="index.html" class="nav-logo">
      <img src="logo.png" alt="Artisan Nomade" class="logo-img"/>
      <span class="logo-text">Artisan Nomade</span>
    </a>
    <ul class="nav-links" id="nav-links">
      <li><a href="index.html" class="nav-link ${currentPage === 'index.html' ? 'active-page' : ''}">Accueil</a></li>
      <li><a href="boutique.html" class="nav-link ${currentPage === 'boutique.html' ? 'active-page' : ''}">Boutique</a></li>
      <li><a href="apropos.html" class="nav-link ${currentPage === 'apropos.html' ? 'active-page' : ''}">À propos</a></li>
      <li><a href="culture.html" class="nav-link ${currentPage === 'culture.html' ? 'active-page' : ''}">Histoire & Culture</a></li>
      <li><a href="partenaires.html" class="nav-link ${currentPage === 'partenaires.html' ? 'active-page' : ''}">Partenaires</a></li>
      <li><a href="contact.html" class="nav-link ${currentPage === 'contact.html' ? 'active-page' : ''}">Contact</a></li>
    </ul>
    <div class="nav-actions">
      <button class="theme-toggle-btn" id="theme-toggle" aria-label="Changer de thème"><i class="fas fa-moon"></i></button>
      <a href="https://wa.me/2290197998546" class="whatsapp-btn" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp"></i></a>
      <button class="menu-toggle" id="menu-toggle"><span></span><span></span><span></span></button>
    </div>
  </nav>`;

  document.body.insertAdjacentHTML('afterbegin', navHTML);

  // Icône du bouton selon le thème actif
  const themeToggle = document.getElementById('theme-toggle');
  function paintIcon(t) {
    themeToggle.innerHTML = t === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }
  paintIcon(initialTheme);
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('artisan-theme', next);
    paintIcon(next);
  });

  // Scroll effect
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60);
  });

  // Menu mobile
  const toggle = document.getElementById('menu-toggle');
  const links = document.getElementById('nav-links');
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    const spans = toggle.querySelectorAll('span');
    if (links.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(4px, -4px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  // Fermer le menu mobile quand on clique sur un lien
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      const spans = toggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });

  // Fermer le menu si on clique en dehors
  document.addEventListener('click', e => {
    if (links.classList.contains('open') &&
        !links.contains(e.target) &&
        !toggle.contains(e.target)) {
      links.classList.remove('open');
      const spans = toggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });
})();
