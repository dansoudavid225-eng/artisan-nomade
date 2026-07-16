# 🪩 Artisan Nomade – Site Fullstack

Bijoux artisanaux en perles africaines · Porto-Novo, Bénin  
**Frontend** : HTML5 + CSS3 + JS vanilla  
**Backend** : Node.js + Express + JSON DB + Nodemailer

---

## 📁 Structure du projet

```
artisan-nomade-fullstack/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml  ← déploie frontend/ sur GitHub Pages automatiquement
├── frontend/           ← Site HTML (ouvrir avec Live Server)
│   ├── index.html
│   ├── boutique.html
│   ├── contact.html
│   ├── admin.html             ← tableau de bord admin (commandes/messages/newsletter/produits)
│   ├── style.css
│   ├── style-overrides.css   ← NOUVEAU design v5 + carrousel galerie corrigé
│   ├── api.js                ← NOUVEAU client API + modale commande + prix dynamiques
│   ├── main.js
│   ├── navbar.js
│   ├── footer.js
│   └── photos/
└── backend/            ← API REST Node.js
    ├── server.js       ← Point d'entrée
    ├── db.js           ← Base de données JSON
    ├── mailer.js       ← Emails Nodemailer
    ├── .env.example    ← Variables d'environnement (copier en .env)
    ├── data/
    │   ├── produits.json    ← Catalogue (40 produits, prix éditables en admin)
    │   ├── commandes.json   ← Créé automatiquement
    │   ├── newsletter.json  ← Créé automatiquement
    │   └── contacts.json    ← Créé automatiquement
    └── package.json
```

---

## 🖥️ Voir le site en local (sur ton ordi)

### Étape 1 – Lancer le backend

```bash
# Ouvrir un terminal, aller dans le dossier backend
cd artisan-nomade-fullstack/backend

# Copier le fichier d'environnement
cp .env.example .env
# (optionnel) ouvrir .env avec ton éditeur et configurer l'email

# Lancer le serveur
npm start
```

Tu verras ce message si tout va bien :
```
╔══════════════════════════════════════════╗
║   🪩  ARTISAN NOMADE – API Backend       ║
╠══════════════════════════════════════════╣
║  URL   : http://localhost:3001           ║
╚══════════════════════════════════════════╝
```

Tester l'API dans le navigateur : http://localhost:3001/api/health

### Étape 2 – Lancer le frontend

**Option A – VS Code Live Server (recommandé)**
1. Installer l'extension "Live Server" dans VS Code
2. Ouvrir le dossier `frontend/` dans VS Code
3. Clic droit sur `index.html` → "Open with Live Server"
4. Le site s'ouvre sur http://127.0.0.1:5500

**Option B – Python (si pas VS Code)**
```bash
cd artisan-nomade-fullstack/frontend
python3 -m http.server 5500
# Ouvrir : http://localhost:5500
```

> ⚠️ **Important** : Ne pas ouvrir `index.html` directement par double-clic  
> (file:// ne fonctionne pas avec les requêtes API CORS)

---

## 🌐 Déploiement – Frontend Vercel + Backend Render + Base Supabase

### 1. Créer le projet Supabase (base de données)

1. Va sur [supabase.com](https://supabase.com) → **New project**
2. Choisis un nom (ex: `artisan-nomade`), note le mot de passe de la DB
3. Une fois créé, va dans **Settings** → **API** et note :
   - `Project URL` (ex: `https://xxx.supabase.co`)
   - `Service Role Key` (secret, ne pas partager)
4. Va dans **SQL Editor**, colle le contenu de `backend/supabase-schema.sql` et exécute

### 2. Déployer le frontend sur Vercel

1. Va sur [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Importe le repo `dansoudavid225-eng/artisan-nomade`
3. **Root Directory** : `frontend`
4. **Framework Preset** : `Other`
5. Clique **Deploy**

### 3. Déployer le backend sur Render

1. Va sur [render.com](https://render.com) → **New** → **Web Service**
2. Connecte ton repo GitHub `dansoudavid225-eng/artisan-nomade`
3. Configure :
   - **Name** : `artisan-nomade-api`
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
4. Dans **Environment Variables**, ajoute :
   ```
   NODE_ENV=production
   SUPABASE_URL=https://TON_PROJECT.supabase.co
   SUPABASE_SERVICE_KEY=TON_SERVICE_ROLE_KEY
   FRONTEND_URL=https://artisan-nomade.vercel.app
   EMAIL_USER=artisannomade1@gmail.com
   EMAIL_PASS=TON_MOT_DE_PASSE_APP_GMAIL
   ADMIN_EMAIL=artisannomade1@gmail.com
   WHATSAPP_NUMBER=2290197998546
   ADMIN_TOKEN=CHOISIS_UN_TOKEN_SOLIDE_ET_SECRET
   ```
5. Clique **Create Web Service**
6. Ton API sera sur : `https://artisan-nomade-api.onrender.com`

### Étape 4 – Mettre à jour config.js

Le fichier `frontend/config.js` pointe déjà vers `https://artisan-nomade-api.onrender.com/api`.  
Si Render te donne une autre URL, change-la dans ce fichier.

### Étape 5 – Pousser sur GitHub

```bash
git add .
git commit -m "Migration Supabase + Vercel"
git push
```

Vercel détecte automatiquement le push et redéploie le frontend.

---

## 🔑 Routes API disponibles

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/health` | Statut du serveur |
| GET | `/api/produits` | Catalogue (40 produits, avec prix) |
| GET | `/api/produits/:id` | Détail d'un produit |
| POST | `/api/commandes` | Créer une commande |
| GET | `/api/commandes/:ref` | Suivre une commande par référence (route API conservée, plus de page dédiée) |
| POST | `/api/newsletter` | S'abonner newsletter |
| POST | `/api/contact` | Envoyer un message |
| GET | `/api/admin/commandes` | Toutes les commandes (auth) |
| PATCH | `/api/admin/commandes/:id/statut` | Changer statut (auth) |
| GET | `/api/admin/newsletter` | Tous les abonnés (auth) |
| GET | `/api/admin/contacts` | Tous les messages (auth) |
| PATCH | `/api/admin/contacts/:id/lu` | Marquer un message lu/non lu (auth) |
| GET | `/api/admin/produits` | Catalogue (vue admin, auth) |
| PATCH | `/api/admin/produits/:id` | Modifier le prix / badge d'un produit (auth) |

**Admin** : ajouter header `Authorization: Bearer <ADMIN_TOKEN>` — ou plus simplement,
se connecter sur **`frontend/admin.html`** qui gère ça automatiquement.

---

## 🛠️ Page d'administration

`frontend/admin.html` est le tableau de bord pour gérer le site au quotidien :
- **Commandes** : recherche, filtre par statut, changement de statut en un clic, lien WhatsApp direct vers le client.
- **Messages de contact** : marquer comme lu/non lu, répondre par email.
- **Newsletter** : liste des abonnés + export CSV.
- **Produits** : modifier le prix (et le badge) de chaque produit du catalogue — le prix
  se met à jour automatiquement sur `boutique.html` et la sélection de `index.html`
  (ils interrogent l'API à chaque chargement, voir plus bas).

Connexion avec le `ADMIN_TOKEN` défini dans `.env` (backend). En local, ouvre simplement
`frontend/admin.html` avec Live Server comme les autres pages. **Ne mets jamais ce token
dans un message public ou un commit Git.**

⚠️ **Important sur Render (plan gratuit)** : `backend/data/*.json` vit sur le disque du
serveur. Sur le plan gratuit de Render, ce disque est **éphémère** : toute modification
(commande, message, prix changé en admin...) peut être perdue au redémarrage / redéploiement
du service. Pour une persistance garantie, ajoute un disque persistant Render (payant) ou
migre vers une vraie base (ex. MongoDB Atlas gratuit, PostgreSQL Render). Tant que le site
tourne en continu sans redéploiement, tes changements restent en place.

---

## 💰 Catalogue & prix

Les 40 produits de `boutique.html` (+ les 3 mis en avant sur `index.html`) sont maintenant
reliés à un vrai catalogue (`backend/data/produits.json`), avec un `id` unique par produit
(`data-product-id` sur chaque carte) et un **prix en FCFA généré aléatoirement par catégorie**
(parures 18 500–35 000, colliers 7 000–16 000, bracelets 2 500–6 500, boucles 3 000–8 000,
accessoires 4 000–12 000). Le prix s'affiche sur chaque carte produit ("Sur commande" reste
affiché tant que l'API n'a pas répondu — utile si le backend Render gratuit est en veille).

Pour changer un prix : onglet **Produits** de `admin.html` → modifie le champ → *Enregistrer*.

À savoir (pas corrigé ce tour, à voir avec toi) :
- Les 6 colliers `C1.jpg`–`C5.jpg` + `p08.jpg` (x2) portent tous le même nom "Collier
  Corail Royal" sur boutique.html — pas de quoi bloquer une commande, mais difficile à
  distinguer pour un client. À renommer si tu veux.
- `photos/p08.jpg` est utilisée deux fois (deux cartes différentes, même image).

---

## 🖼️ Galerie "Nos créations en images" (page d'accueil)

Cette section n'avait **aucune règle CSS de mise en page** : les 10 images s'empilaient à
pleine résolution les unes sous les autres, ce qui explique l'espace énorme qu'elle prenait.
Corrigé : c'est maintenant un vrai carrousel horizontal (1 image visible sur mobile, 2 sur
tablette, 3 sur desktop), hauteur fixe, image recadrée proprement (`object-fit: cover`).
J'ai aussi redimensionné/recompressé les 9 photos concernées (max 1000px de côté, qualité 80) :
~1 Mo → ~750 Ko sur ce lot, sans perte visible à la taille où elles s'affichent.

---

## 📱 Ce qui fonctionne maintenant

- ✅ Modale de commande sur chaque produit (bouton "Personnaliser"), maintenant bien reliée
  à l'`id` réel du produit (les cartes n'avaient aucun `data-product-id` avant)
- ✅ Commande sauvegardée dans `backend/data/commandes.json`
- ✅ Notification email à l'admin à chaque commande
- ✅ Email de confirmation au client (si email fourni)
- ✅ Newsletter branchée sur l'API (plus Formspree)
- ✅ Formulaire de contact branché sur l'API
- ✅ Nouveau design corail/or bruni v5
- ✅ Page d'administration complète (`admin.html`) avec gestion des prix produits
- ✅ Catalogue de 40 produits avec prix (`produits.json`), affiché dynamiquement sur le site
- ✅ Galerie d'accueil corrigée (carrousel fonctionnel + images optimisées)
- ✅ Page "Suivi de commande" retirée (lien mort) ; la référence de commande se suit
  directement par WhatsApp
- ✅ Bug critique corrigé : `main.js` avait une erreur de syntaxe qui empêchait tout le
  JS du site (loader, animations, filtres boutique, lightbox, slider d'avis) de s'exécuter

---

## 📞 Support

WhatsApp : +229 01 97 99 85 46  
Email : artisannomade1@gmail.com
