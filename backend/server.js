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
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { body, param, validationResult } = require('express-validator');
const fs       = require('fs');
const path     = require('path');

const db     = require('./db');
const mailer = require('./mailer');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const app  = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// MIDDLEWARES GLOBAUX
// ============================================================

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));

// Rate limiting globaux – protection anti-brute-force
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes. Réessayez dans 15 minutes.' },
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});
app.use('/api/admin/', authLimiter);

// Rate limiting spécifique email – max 5 req/15min par IP
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes. Réessayez dans 15 minutes.' },
});

// CORS – autorise uniquement le frontend
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://artisan-nomade.vercel.app',
  'https://artisan-nomade-mts2u4ej1-tropicana-pio-pio.vercel.app',
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
      callback(new Error('Origine non autorisée'));
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
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function adminAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    console.error('ADMIN_TOKEN non défini dans les variables d\'environnement');
    return res.status(500).json({ success: false, message: 'Erreur de configuration serveur' });
  }
  if (!token || !timingSafeEqual(token, adminToken)) {
    return res.status(401).json({ success: false, message: 'Non autorisé' });
  }
  next();
}

// Journalisation des actions admin (fichier de log)
const ADMIN_LOG_PATH = path.join(__dirname, 'data', 'admin-log.ndjson');
function logAdminAction(req, action, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection?.remoteAddress,
    action,
    details,
  };
  try {
    fs.appendFileSync(ADMIN_LOG_PATH, JSON.stringify(entry) + '\n');
  } catch (e) {
    console.error('Échec écriture log admin:', e.message);
  }
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
  { id: 'pr-008', nom: 'Collier Corail Royal Bleu',    categorie: 'collier',    image: 'C1.jpg',            prix: 15500 },
  { id: 'pr-009', nom: 'Collier Corail Royal Blanc',   categorie: 'collier',    image: 'C2.jpg',            prix: 8000 },
  { id: 'pr-010', nom: 'Collier Corail Royal Vert',    categorie: 'collier',    image: 'C3.jpg',            prix: 16000 },
  { id: 'pr-011', nom: 'Collier Corail Royal Or',      categorie: 'collier',    image: 'C4.jpg',            prix: 13500 },
  { id: 'pr-012', nom: 'Collier Corail Royal Rose',    categorie: 'collier',    image: 'C5.jpg',            prix: 7500 },
  { id: 'pr-013', nom: 'Collier Perles & Corail Tissé', categorie: 'collier',    image: 'photos/p08.jpg',    prix: 7000 },
  { id: 'pr-014', nom: 'Collier Rangs de Perles Rouges', categorie: 'collier',   image: 'photos/p09.jpg',    prix: 8000 },
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
async function getProduits() {
  let produits = await db.findAll('produits');
  if (!produits.length) {
    produits = SEED_PRODUITS;
    await db.writeCollection('produits', produits);
  }
  return produits;
}

app.get('/api/produits', async (req, res) => {
  try {
    const { categorie } = req.query;
    const all = await getProduits();
    const results = categorie && categorie !== 'all'
      ? all.filter(p => p.categorie === categorie)
      : all;
    res.json({ success: true, count: results.length, produits: results });
  } catch (err) {
    console.error('Erreur produits:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/produits/:id', async (req, res) => {
  try {
    const produit = await db.findOne('produits', 'id', req.params.id);
    if (!produit) return res.status(404).json({ success: false, message: 'Produit introuvable' });
    res.json({ success: true, produit });
  } catch (err) {
    console.error('Erreur produit:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
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

    await db.insertOne('commandes', commande);

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
  async (req, res) => {
    const commande = await db.findOne('commandes', 'reference', req.params.reference.toUpperCase());
    if (!commande) {
      return res.status(404).json({ success: false, message: 'Commande introuvable. Vérifiez la référence.' });
    }

    res.json({
      success: true,
      commande: {
        reference: commande.reference,
        statut: commande.statut,
        statutLabel: commande.statut_label || commande.statutLabel,
        historiqueStatut: commande.historique_statut || commande.historiqueStatut,
        produits: commande.produits.map(p => ({ nom: p.nom, quantite: p.quantite })),
        livraison: commande.livraison,
        createdAt: commande.created_at || commande.createdAt,
        updatedAt: commande.updated_at || commande.updatedAt,
      },
    });
  }
);

// ============================================================
// ROUTE : NEWSLETTER
// ============================================================

app.post('/api/newsletter',
  emailLimiter,
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('nom').optional().trim().isLength({ max: 100 }),
  ]),
  async (req, res) => {
    const { email, nom } = req.body;

    // Anti-doublon
    const exists = await db.emailExists('newsletter', email);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà inscrit à la newsletter.',
      });
    }

    const abonne = {
      id: uuidv4(),
      email,
      nom: nom?.trim() || '',
      source: new URL(req.headers.referer || 'http://unknown').hostname || 'direct',
      created_at: new Date().toISOString(),
    };

    await db.insertOne('newsletter', abonne);
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
  emailLimiter,
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
      created_at: new Date().toISOString(),
    };

    await db.insertOne('contacts', contact);

    // Notifier l'admin (via le mailer existant)
    const contactNotification = {
      client: { nom, email, telephone },
      reference: sujet || 'Contact',
      produits: [{ nom: message }],
    };
    mailer.sendOrderNotification({
      ...contactNotification,
      reference: `MSG-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }).catch(console.error);

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
app.get('/api/admin/commandes', adminAuth, async (req, res) => {
  const commandes = await db.findAll('commandes');
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

/** Liste abonnés newsletter */
app.get('/api/admin/newsletter', adminAuth, async (req, res) => {
  const abonnes = await db.findAll('newsletter');
  res.json({ success: true, count: abonnes.length, abonnes });
});

/** Liste messages de contact */
app.get('/api/admin/contacts', adminAuth, async (req, res) => {
  const contacts = await db.findAll('contacts');
  res.json({ success: true, count: contacts.length, contacts });
});

/** Marquer un message de contact comme lu / non lu */
app.patch('/api/admin/contacts/:id/lu', adminAuth,
  validate([
    body('lu').isBoolean().withMessage('Le champ lu doit être un booléen'),
  ]),
  async (req, res) => {
    const updated = await db.updateById('contacts', req.params.id, { lu: req.body.lu });
    if (!updated) return res.status(404).json({ success: false, message: 'Message introuvable' });
    res.json({ success: true, contact: updated });
  }
);

/** Liste produits (vue admin, identique à la vue publique) */
app.get('/api/admin/produits', adminAuth, async (req, res) => {
  const produits = await getProduits();
  res.json({ success: true, count: produits.length, produits });
});

/** Modifier le prix (et éventuellement le badge) d'un produit */
app.patch('/api/admin/produits/:id', adminAuth,
  validate([
    body('prix').optional().isFloat({ min: 0, max: 999999999 }).withMessage('Le prix doit être un nombre positif'),
    body('badge').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  ]),
  async (req, res) => {
    const updates = {};
    if (req.body.prix !== undefined) updates.prix = Math.round(Number(req.body.prix));
    if (req.body.badge !== undefined) updates.badge = req.body.badge || null;

    const updated = await db.updateById('produits', req.params.id, updates);
    if (!updated) return res.status(404).json({ success: false, message: 'Produit introuvable' });

    logAdminAction(req, 'produit.modifier', { produitId: req.params.id, nouveauPrix: req.body.prix });
    res.json({ success: true, produit: updated });
  }
);

async function getContenu() {
  try {
    const { data, error } = await supabase.from('contenu').select('*').eq('id', 1).limit(1);
    if (error) { console.error('getContenu error:', error.message); return {}; }
    if (data && data.length > 0) return data[0].data;
    // 1er démarrage : charger le seed depuis backend/data/contenu.json
    const seedPath = path.join(__dirname, 'data', 'contenu.json');
    if (fs.existsSync(seedPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
        const seed = Array.isArray(raw) ? (raw[0] || {}) : raw;
        if (seed && Object.keys(seed).length) {
          await supabase.from('contenu').upsert({ id: 1, data: seed }).select().single();
          return seed;
        }
      } catch (e) { console.warn('Seed parse error:', e.message); }
    }
    return {};
  } catch (e) { console.error('getContenu error:', e); return {}; }
}
async function saveContenu(contenu) {
  await supabase.from('contenu').upsert({ id: 1, data: contenu, updated_at: new Date().toISOString() });
}

/** Route publique – le frontend lit le contenu */
app.get('/api/contenu', async (req, res) => {
  const contenu = await getContenu();
  if (!contenu || !Object.keys(contenu).length) return res.status(404).json({ success: false, message: 'Contenu non initialisé' });
  res.json({ success: true, contenu });
});

/** Admin – lire le contenu complet */
app.get('/api/admin/contenu', adminAuth, async (req, res) => {
  const contenu = await getContenu();
  res.json({ success: true, contenu: contenu || {} });
});

/** Admin – mettre à jour une section du contenu (merge partiel) */
app.patch('/api/admin/contenu', adminAuth,
  validate([
    body('section').notEmpty().withMessage('La section est requise'),
    body('data').isObject().withMessage('data doit être un objet'),
  ]),
  async (req, res) => {
    const { section, data } = req.body;
    const contenu = await getContenu() || {};
    contenu[section] = { ...(contenu[section] || {}), ...data };
    await saveContenu(contenu);
    res.json({ success: true, section, contenu: contenu[section] });
  }
);

/** Admin – mettre à jour un tableau du contenu (slides, galerie, faq, equipe, etc.) */
app.put('/api/admin/contenu/array', adminAuth,
  validate([
    body('key').notEmpty().withMessage('La clé est requise'),
    body('data').isArray().withMessage('data doit être un tableau'),
  ]),
  async (req, res) => {
    const { key, data } = req.body;
    const ALLOWED_ARRAYS = ['slides','galerie','services','faq','valeurs','equipe','partenaires_liste','avis'];
    if (!ALLOWED_ARRAYS.includes(key)) {
      return res.status(400).json({ success: false, message: 'Clé de tableau non autorisée' });
    }
    const contenu = await getContenu() || {};
    contenu[key] = data;
    await saveContenu(contenu);
    res.json({ success: true, key, count: data.length });
  }
);

// ============================================================
// ÉVÉNEMENTS & MARCHÉS
// ============================================================

async function getEvenements() {
  try {
    const data = await db.findAll('evenements');
    if (data.length) return data;
    const seedPath = path.join(__dirname, 'data', 'evenements.json');
    if (fs.existsSync(seedPath)) {
      const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      if (seed.length) {
        await db.writeCollection('evenements', seed);
        return seed;
      }
    }
    return [];
  } catch (e) { return []; }
}

/** Route publique – liste des événements (triés par date) */
app.get('/api/evenements', async (req, res) => {
  const all = await getEvenements();
  const now = new Date().toISOString().slice(0, 10);
  const updated = all.map(e => ({ ...e, statut: e.date < now ? 'passe' : 'a_venir' }));
  const avenir = updated.filter(e => e.statut === 'a_venir').sort((a,b) => a.date.localeCompare(b.date));
  const passes = updated.filter(e => e.statut === 'passe').sort((a,b) => b.date.localeCompare(a.date));
  res.json({ success: true, avenir, passes, total: all.length });
});

/** Admin – tous les événements */
app.get('/api/admin/evenements', adminAuth, async (req, res) => {
  const all = await getEvenements();
  res.json({ success: true, evenements: all });
});

/** Admin – créer un événement */
app.post('/api/admin/evenements', adminAuth,
  validate([
    body('titre').notEmpty().trim().withMessage('Le titre est requis'),
    body('date_debut').notEmpty().withMessage('La date de début est requise'),
  ]),
  async (req, res) => {
    const { titre, date_debut, date_fin, heure, lieu, ville, description, image } = req.body;
    const now = new Date().toISOString().slice(0, 10);
    const date = date_debut;
    const evt = {
      id: 'evt-' + uuidv4().slice(0, 13),
      titre, date_debut, date_fin: date_fin || date_debut,
      date, heure: heure || '',
      lieu: lieu || '', ville: ville || 'Porto-Novo, Bénin',
      description: description || '',
      image: image || '', photo: image || '',
      statut: date < now ? 'passe' : 'a_venir',
      created_at: new Date().toISOString()
    };
    await db.insertOne('evenements', evt);
    res.status(201).json({ success: true, evenement: evt });
  }
);

/** Admin – modifier un événement */
app.patch('/api/admin/evenements/:id', adminAuth, async (req, res) => {
    const allowed = ['titre','date_debut','date_fin','date','heure','lieu','ville','description','image','photo','statut'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (req.body.date_debut) updates.date = req.body.date_debut;
    const now = new Date().toISOString().slice(0, 10);
    if (!req.body.statut) updates.statut = (updates.date || '') < now ? 'passe' : 'a_venir';
    const updated = await db.updateById('evenements', req.params.id, updates);
    if (!updated) return res.status(404).json({ success: false, message: 'Événement introuvable' });
    res.json({ success: true, evenement: updated });
  }
);

/** Admin – supprimer un événement */
app.delete('/api/admin/evenements/:id', adminAuth, async (req, res) => {
  const { error } = await supabase.from('evenements').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  res.json({ success: true, message: 'Événement supprimé' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable' });
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
