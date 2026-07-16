-- ============================================================
-- ARTISAN NOMADE – Schéma Supabase PostgreSQL
-- Exécuter ce script dans l'éditeur SQL de Supabase
-- (Supabase Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. PRODUITS
CREATE TABLE IF NOT EXISTS produits (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL,
  image TEXT DEFAULT '',
  prix NUMERIC NOT NULL DEFAULT 0,
  badge TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COMMANDES
CREATE TABLE IF NOT EXISTS commandes (
  id TEXT PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  client JSONB NOT NULL,
  produits JSONB NOT NULL,
  message TEXT DEFAULT '',
  livraison TEXT DEFAULT 'local',
  statut TEXT DEFAULT 'recu',
  statut_label TEXT DEFAULT 'Commande reçue',
  historique_statut JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. NEWSLETTER
CREATE TABLE IF NOT EXISTS newsletter (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nom TEXT DEFAULT '',
  source TEXT DEFAULT 'direct',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CONTACTS
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT DEFAULT '',
  sujet TEXT DEFAULT 'Autre',
  message TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONTENU (site content – single row with JSONB)
CREATE TABLE IF NOT EXISTS contenu (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EVENEMENTS
CREATE TABLE IF NOT EXISTS evenements (
  id TEXT PRIMARY KEY,
  titre TEXT NOT NULL,
  date_debut TEXT NOT NULL,
  date_fin TEXT DEFAULT '',
  date TEXT NOT NULL,
  heure TEXT DEFAULT '',
  lieu TEXT DEFAULT '',
  ville TEXT DEFAULT 'Porto-Novo, Bénin',
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  photo TEXT DEFAULT '',
  statut TEXT DEFAULT 'a_venir',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_commandes_reference ON commandes(reference);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter(email);
CREATE INDEX IF NOT EXISTS idx_contacts_lu ON contacts(lu);
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie);
CREATE INDEX IF NOT EXISTS idx_evenements_date ON evenements(date);
