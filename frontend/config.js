/**
 * config.js – Configuration centralisée Artisan Nomade
 * Tous les scripts partagent la même URL backend.
 * En production, change UNIQUEMENT l'URL ci-dessous.
 */
const CONFIG = (function () {
  const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
  return {
    API_BASE_URL: isLocal
      ? 'http://localhost:3001/api'
      : 'https://artisan-nomade-api.onrender.com/api',
    WHATSAPP_NUMBER: '2290197998546',
  };
})();
