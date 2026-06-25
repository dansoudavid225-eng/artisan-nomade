/**
 * server.js – API REST Artisan Nomade
 * Stack : Node.js + Express + JSON DB + Nodemailer
 *
 * Routes disponibles :
 *   POST /api/commandes         – Créer une commande
 *   GET  /api/commandes/:ref    – Suivre une commande par référence (route conservée côté API,
 *                                 mais la page frontend suivi-commande.html a été retirée du site)
 *   POST /api/newsletter        – S'abonner à la newsletter
 *   POST /api/contact           – Envoyer un message de contact
 *   GET  /api/produits          – Liste des produits (catalogue, avec prix)
 *   GET  /api/health            – Health check
 *
 * Admin (protégé par token simple) :
 *   GET  /api/admin/commandes   – Toutes les commandes
 *   PATCH /api/admin/commandes/:id/statut – Changer le statut
 *   GET  /api/admin/newsletter  – Tous les abonnés
 *   GET  /api/admin/contacts    – Tous les messages
 *   PATCH /api/admin/contacts/:id/lu – Marquer un message lu/non lu
 *   GET  /api/admin/produits    – Catalogue produits (vue admin)
 *   PATCH /api/admin/produits/:id – Modifier le prix / badge d'un produit
 */

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const { v4: uuidv4 } = require('uuid');
const { body, param, validationResult } = require('express-validator');

const db     = require('./db');
const mailer = require('./mailer');

const app  = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// MIDDLEWARES GLOBAUX
// ============================================================

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));

// CORS – autorise uniquement le frontend
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5501',
  // Ajoute ton domaine ici en production :
  // 'https://artisannomade.com',
];

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (Postman, mobile, etc.) en dev
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origine non autorisée: ${origin}`));
    }
  },
  credentials: true,
}));

// ============================================================
// UTILITAIRES
// ============================================================

/** Générer une référence de commande unique */
function generateReference() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AN-${year}-${rand}`;
}

/** Middleware de validation Express-validator */
function validate(validations) {
  return async (req, res, next) => {
    for (const v of validations) await v.run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    next();
  };
}

/** Auth admin simple (token dans header Authorization) */
function adminAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  const adminToken = process.env.ADMIN_TOKEN || 'artisan-nomade-admin-2025';
  if (token !== adminToken) {
    return res.status(401).json({ success: false, message: 'Non autorisé' });
  }
  next();
}

// ============================================================
// ROUTE : HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Artisan Nomade opérationnelle',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// ROUTE : CATALOGUE PRODUITS
// ============================================================
// Le catalogue vit maintenant dans backend/data/produits.json
// (modifiable depuis la page admin). SEED_PRODUITS ne sert que si
// ce fichier est absent ou vide au démarrage (premier lancement).

const SEED_PRODUITS = [
  { id: 'pr-001', nom: 'Parure Royale Bleue & Or',    categorie: 'parure',     image: 'photos/p17.jpg',    badge: 'Bestseller',   prix: 21500 },
  { id: 'pr-002', nom: 'Parure Saphir Royal',          categorie: 'parure',     image: 'photos/p28.jpg',    prix: 18500 },
  { id: 'pr-003', nom: 'Parure Nuit & Cristal',        categorie: 'parure',     image: 'photos/p06.jpg',    prix: 26500 },
  { id: 'pr-004', nom: 'Parure Ivoire Tissée',         categorie: 'parure',     image: 'photos/p16.jpg',    badge: 'Nouveau',       prix: 25500 },
  { id: 'pr-005', nom: 'Parure Perles & Rubis',        categorie: 'parure',     image: 'photos/p04.jpg',    prix: 25000 },
  { id: 'pr-006', nom: 'Parure Or & Nacre',            categorie: 'parure',     image: 'photos/p14.jpg',    prix: 22000 },
  { id: 'pr-007', nom: 'Grand Collier Corail Doré',    categorie: 'collier',    image: 'slide1.jpg',        badge: 'Traditionnel', prix: 8500 },
  { id: 'pr-008', nom: 'Collier Corail Royal',         categorie: 'collier',    image: 'C1.jpg',            prix: 15500 },
  { id: 'pr-009', nom: 'Collier Corail Royal',         categorie: 'collier',    image: 'C2.jpg',            prix: 8000 },
  { id: 'pr-010', nom: 'Collier Corail Royal',         categorie: 'collier',    image: 'C3.jpg',            prix: 16000 },
  { id: 'pr-011', nom: 'Collier Corail Royal',         categorie: 'collier',    image: 'C4.jpg',            prix: 13500 },
  { id: 'pr-012', nom: 'Collier Corail Royal',         categorie: 'collier',    image: 'C5.jpg',            prix: 7500 },
  { id: 'pr-013', nom: 'Collier Corail Royal',         categorie: 'collier',    image: 'photos/p08.jpg',    prix: 7000 },
  { id: 'pr-014', nom: 'Collier Corail Royal',         categorie: 'collier',    image: 'photos/p08.jpg',    prix: 8000 },
  { id: 'pr-015', nom: 'Collection Éclats de Couleurs', categorie: 'bracelet',  image: 'bracelet1.jpg',     badge: 'Collection',   prix: 4000 },
  { id: 'pr-016', nom: 'Bracelets Azur & Nacre',        categorie: 'bracelet',  image: 'bracelet2.jpg',     prix: 4000 },
  { id: 'pr-017', nom: 'Bracelets "Made with Love"',    categorie: 'bracelet',  image: 'bracelet3.jpg',     prix: 6500 },
  { id: 'pr-018', nom: 'Bracelet Amour Rouge & Or',     categorie: 'bracelet',  image: 'bracelet4-alt.jpg', prix: 2500 },
  { id: 'pr-019', nom: 'Parure Émeraude & Or',          categorie: 'bracelet',  image: 'bracelet4.jpg',     prix: 6500 },
  { id: 'pr-020', nom: 'Bracelet Bois Arc-en-Ciel',     categorie: 'bracelet',  image: 'bracelet5.jpg',     badge: 'Naturel',       prix: 4000 },
  { id: 'pr-021', nom: 'Bracelet Damier Tissé',         categorie: 'bracelet',  image: 'photos/p20.jpg',    prix: 6500 },
  { id: 'pr-022', nom: 'Parure Émeraude Florale',       categorie: 'bracelet',  image: 'photos/p25.jpg',    prix: 5500 },
  { id: 'pr-023', nom: 'Bracelet Bois Multicolore',     categorie: 'bracelet',  image: 'photos/p26.jpg',    badge: 'Naturel',       prix: 4000 },
  { id: 'pr-024', nom: 'Parure Pêche & Cristal',        categorie: 'bracelet',  image: 'photos/p27.jpg',    prix: 6000 },
  { id: 'pr-025', nom: 'Boucles Cascade Nacre',         categorie: 'boucle',    image: 'b2.jpg',            prix: 7500 },
  { id: 'pr-026', nom: 'Boucles Grappes de Nacre',      categorie: 'boucle',    image: 'b5.jpg',            badge: 'Coup de cœur', prix: 5000 },
  { id: 'pr-027', nom: 'Boucles Nacre & Onyx',          categorie: 'boucle',    image: 'b4.jpg',            prix: 3000 },
  { id: 'pr-028', nom: 'Boucles Fleurs Noir & Blanc',   categorie: 'boucle',    image: 'B3.jpg',            prix: 4000 },
  { id: 'pr-029', nom: 'Boucle Créole Nacre',           categorie: 'boucle',    image: 'photos/p01.jpg',    prix: 6000 },
  { id: 'pr-030', nom: 'Boucles Anneaux Bicolores',     categorie: 'boucle',    image: 'photos/p15.jpg',    prix: 5500 },
  { id: 'pr-031', nom: 'Collection Boucles Cristal',    categorie: 'boucle',    image: 'photos/p21.jpg',    badge: 'Collection',   prix: 5000 },
  { id: 'pr-032', nom: 'Boucles Cascade Florale',       categorie: 'boucle',    image: 'photos/p22.jpg',    prix: 4000 },
  { id: 'pr-033', nom: 'Boucles Fleur Corail',          categorie: 'boucle',    image: 'photos/p23.jpg',    prix: 4500 },
  { id: 'pr-034', nom: 'Boucles Chaîne Turquoise & Or', categorie: 'boucle',    image: 'photos/p24.jpg',    prix: 5500 },
  { id: 'pr-035', nom: 'Boucles Velours & Cauris',      categorie: 'boucle',    image: 'photos/p30.jpg',    badge: 'Traditionnel', prix: 3500 },
  { id: 'pr-036', nom: 'Créoles Arc-en-Ciel',           categorie: 'boucle',    image: 'photos/p32.jpg',    prix: 3500 },
  { id: 'pr-037', nom: 'Créoles Rondes Festives',       categorie: 'boucle',    image: 'photos/p33.jpg',    prix: 6000 },
  { id: 'pr-038', nom: 'Ensemble Kente',                categorie: 'accessoire',image: 'photos/p29.jpg',    badge: 'Unique',       prix: 5500 },
  { id: 'pr-039', nom: 'Porte-Clés Perles Nacre',       categorie: 'accessoire',image: 'photos/p34.jpg',    prix: 9500 },
  { id: 'pr-040', nom: 'Créoles Tressées Bleu & Or',    categorie: 'accessoire',image: 'photos/p31.jpg',    prix: 9500 },
];

/** Charge le catalogue, et le crée à partir du seed s'il est vide (1er démarrage) */
function getProduits() {
  let produits = db.findAll('produits');
  if (!produits.length) {
    produits = SEED_PRODUITS;
    db.writeCollection('produits', produits);
  }
  return produits;
}

app.get('/api/produits', (req, res) => {
  const { categorie } = req.query;
  const all = getProduits();
  const results = categorie && categorie !== 'all'
    ? all.filter(p => p.categorie === categorie)
    : all;
  res.json({ success: true, count: results.length, produits: results });
});

app.get('/api/produits/:id', (req, res) => {
  const produit = getProduits().find(p => p.id === req.params.id);
  if (!produit) return res.status(404).json({ success: false, message: 'Produit introuvable' });
  res.json({ success: true, produit });
});

// ============================================================
// ROUTE : COMMANDES
// ============================================================

const commandeValidation = [
  body('client.nom')
    .trim().notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 }),
  body('client.telephone')
    .trim().notEmpty().withMessage('Le téléphone est requis')
    .isLength({ min: 8, max: 20 }),
  body('client.email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Email invalide'),
  body('client.ville')
    .trim().notEmpty().withMessage('La ville est requise'),
  body('client.pays')
    .trim().notEmpty().withMessage('Le pays est requis'),
  body('produits')
    .isArray({ min: 1 }).withMessage('Au moins un produit est requis'),
  body('produits.*.nom')
    .trim().notEmpty().withMessage('Nom du produit requis'),
];

app.post('/api/commandes', validate(commandeValidation), async (req, res) => {
  try {
    const { client, produits, message, livraison } = req.body;

    // Générer référence unique (éviter doublons)
    let reference;
    let attempts = 0;
    do {
      reference = generateReference();
      attempts++;
    } while (db.findOne('commandes', 'reference', reference) && attempts < 10);

    const commande = {
      id: uuidv4(),
      reference,
      client: {
        nom: client.nom.trim(),
        email: client.email?.trim() || '',
        telephone: client.telephone.trim(),
        ville: client.ville.trim(),
        pays: client.pays.trim(),
        adresse: client.adresse?.trim() || '',
      },
      produits: produits.map(p => ({
        nom: p.nom,
        id: p.id || '',
        quantite: p.quantite || 1,
        personnalisation: p.personnalisation?.trim() || '',
      })),
      message: message?.trim() || '',
      livraison: livraison || 'local', // 'local' | 'national' | 'international'
      statut: 'recu',      // recu → en_fabrication → expedie → livre
      statutLabel: 'Commande reçue',
      historiqueStatut: [
        {
          statut: 'recu',
          label: 'Commande reçue',
          date: new Date().toISOString(),
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.insertOne('commandes', commande);

    // Notifications email (non-bloquantes)
    mailer.sendOrderNotification(commande).catch(console.error);
    if (commande.client.email) {
      mailer.sendOrderConfirmation(commande).catch(console.error);
    }

    res.status(201).json({
      success: true,
      message: 'Commande enregistrée avec succès !',
      reference: commande.reference,
      commande: {
        reference: commande.reference,
        statut: commande.statut,
        statutLabel: commande.statutLabel,
        client: { nom: commande.client.nom },
        createdAt: commande.createdAt,
      },
    });

  } catch (err) {
    console.error('Erreur commande:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur. Réessayez.' });
  }
});

/** Suivi de commande par référence (public) */
app.get('/api/commandes/:reference',
  validate([
    param('reference')
      .matches(/^AN-\d{4}-\d{4}$/).withMessage('Format de référence invalide (ex: AN-2025-1234)'),
  ]),
  (req, res) => {
    const commande = db.findOne('commandes', 'reference', req.params.reference.toUpperCase());
    if (!commande) {
      return res.status(404).json({ success: false, message: 'Commande introuvable. Vérifiez la référence.' });
    }

    // Ne retourner que les infos publiques (pas l'email complet)
    res.json({
      success: true,
      commande: {
        reference: commande.reference,
        statut: commande.statut,
        statutLabel: commande.statutLabel,
        historiqueStatut: commande.historiqueStatut,
        produits: commande.produits.map(p => ({ nom: p.nom, quantite: p.quantite })),
        livraison: commande.livraison,
        createdAt: commande.createdAt,
        updatedAt: commande.updatedAt,
      },
    });
  }
);

// ============================================================
// ROUTE : NEWSLETTER
// ============================================================

app.post('/api/newsletter',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('nom').optional().trim().isLength({ max: 100 }),
  ]),
  async (req, res) => {
    const { email, nom } = req.body;

    // Anti-doublon
    if (db.emailExists('newsletter', email)) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà inscrit à la newsletter.',
      });
    }

    const abonne = {
      id: uuidv4(),
      email,
      nom: nom?.trim() || '',
      source: req.headers.referer || 'direct',
      createdAt: new Date().toISOString(),
    };

    db.insertOne('newsletter', abonne);
    mailer.sendNewsletterWelcome(email).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie ! Merci de rejoindre la famille Artisan Nomade.',
    });
  }
);

// ============================================================
// ROUTE : CONTACT
// ============================================================

app.post('/api/contact',
  validate([
    body('nom').trim().notEmpty().isLength({ min: 2, max: 100 }).withMessage('Nom requis'),
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('message').trim().notEmpty().isLength({ min: 10, max: 2000 }).withMessage('Message trop court (min 10 caractères)'),
    body('sujet').optional().trim().isLength({ max: 100 }),
    body('telephone').optional().trim().isLength({ max: 20 }),
  ]),
  async (req, res) => {
    const { nom, email, telephone, sujet, message } = req.body;

    const contact = {
      id: uuidv4(),
      nom,
      email,
      telephone: telephone || '',
      sujet: sujet || 'Autre',
      message,
      lu: false,
      createdAt: new Date().toISOString(),
    };

    db.insertOne('contacts', contact);

    // Notifier l'admin
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      transporter.sendMail({
        from: `"Artisan Nomade" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: `📩 Nouveau message de ${nom} – ${sujet || 'Contact'}`,
        text: `De : ${nom} <${email}>\nTél : ${telephone || '–'}\nSujet : ${sujet || '–'}\n\n${message}`,
      }).catch(console.error);
    }

    res.status(201).json({
      success: true,
      message: 'Message envoyé ! Nous vous répondrons dans les 24h.',
    });
  }
);

// ============================================================
// ROUTES ADMIN (protégées)
// ============================================================

/** Liste toutes les commandes */
app.get('/api/admin/commandes', adminAuth, (req, res) => {
  const commandes = db.findAll('commandes');
  res.json({ success: true, count: commandes.length, commandes });
});

/** Changer le statut d'une commande */
const STATUTS_VALIDES = {
  recu:           'Commande reçue',
  en_fabrication: 'En cours de fabrication',
  pret:           "Prêt, en attente d'expédition",
  expedie:        'Expédié',
  livre:          'Livré',
  annule:         'Annulé',
};

app.patch('/api/admin/commandes/:id/statut', adminAuth,
  validate([
    body('statut').isIn(Object.keys(STATUTS_VALIDES)).withMessage('Statut invalide'),
  ]),
  (req, res) => {
    const { statut } = req.body;
    const label = STATUTS_VALIDES[statut];

    const commandes = db.findAll('commandes');
    const idx = commandes.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Commande introuvable' });

    commandes[idx].statut = statut;
    commandes[idx].statutLabel = label;
    commandes[idx].updatedAt = new Date().toISOString();
    commandes[idx].historiqueStatut = commandes[idx].historiqueStatut || [];
    commandes[idx].historiqueStatut.push({ statut, label, date: new Date().toISOString() });

    const { insertOne, ...rest } = require('./db');
    const fs = require('fs');
    const path = require('path');
    fs.writeFileSync(
      path.join(__dirname, 'data', 'commandes.json'),
      JSON.stringify(commandes, null, 2)
    );

    res.json({ success: true, message: `Statut mis à jour : ${label}`, commande: commandes[idx] });
  }
);

/** Liste abonnés newsletter */
app.get('/api/admin/newsletter', adminAuth, (req, res) => {
  const abonnes = db.findAll('newsletter');
  res.json({ success: true, count: abonnes.length, abonnes });
});

/** Liste messages de contact */
app.get('/api/admin/contacts', adminAuth, (req, res) => {
  const contacts = db.findAll('contacts');
  res.json({ success: true, count: contacts.length, contacts });
});

/** Marquer un message de contact comme lu / non lu */
app.patch('/api/admin/contacts/:id/lu', adminAuth,
  validate([
    body('lu').isBoolean().withMessage('Le champ lu doit être un booléen'),
  ]),
  (req, res) => {
    const updated = db.updateById('contacts', req.params.id, { lu: req.body.lu });
    if (!updated) return res.status(404).json({ success: false, message: 'Message introuvable' });
    res.json({ success: true, contact: updated });
  }
);

/** Liste produits (vue admin, identique à la vue publique) */
app.get('/api/admin/produits', adminAuth, (req, res) => {
  const produits = getProduits();
  res.json({ success: true, count: produits.length, produits });
});

/** Modifier le prix (et éventuellement le badge) d'un produit */
app.patch('/api/admin/produits/:id', adminAuth,
  validate([
    body('prix').optional().isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
    body('badge').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  ]),
  (req, res) => {
    const produits = getProduits();
    const idx = produits.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Produit introuvable' });

    if (req.body.prix !== undefined) produits[idx].prix = Math.round(Number(req.body.prix));
    if (req.body.badge !== undefined) produits[idx].badge = req.body.badge || undefined;

    db.writeCollection('produits', produits);
    res.json({ success: true, produit: produits[idx] });
  }
);

// ============================================================
// GESTION 404 & ERREURS
// ============================================================

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} introuvable` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
});

// ============================================================
// DÉMARRAGE
// ============================================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🪩  ARTISAN NOMADE – API Backend       ║
╠══════════════════════════════════════════╣
║  URL   : http://localhost:${PORT}           ║
║  Mode  : ${process.env.NODE_ENV || 'development'}               ║
╠══════════════════════════════════════════╣
║  Routes disponibles :                    ║
║  GET  /api/health                        ║
║  GET  /api/produits                      ║
║  POST /api/commandes                     ║
║  GET  /api/commandes/:ref                ║
║  POST /api/newsletter                    ║
║  POST /api/contact                       ║
║  GET  /api/admin/commandes  (auth)       ║
╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
