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

## 🌐 Déployer sur GitHub + voir en ligne GRATUITEMENT

### Étape 1 – Créer le dépôt GitHub

```bash
cd artisan-nomade-fullstack

# Initialiser Git
git init
git add .
git commit -m "🎉 Artisan Nomade – version fullstack v5"

# Créer le repo sur github.com (bouton "New repository")
# Puis lier et pousser :
git remote add origin https://github.com/TON_UTILISATEUR/artisan-nomade.git
git branch -M main
git push -u origin main
```

### Étape 2 – Frontend sur GitHub Pages (GRATUIT)

⚠️ **Important** : GitHub Pages ne permet PAS de choisir un dossier personnalisé comme
`/frontend` dans son interface (seulement `/ (root)` ou `/docs`). Comme ce projet est un
monorepo (`frontend/` + `backend/`), on utilise un **workflow GitHub Actions** fourni dans
`.github/workflows/deploy-pages.yml` : il publie automatiquement le contenu de `frontend/`
à chaque push sur `main`.

1. Aller sur ton repo GitHub → **Settings** → **Pages**
2. Sous **Source**, choisir **GitHub Actions** (pas "Deploy from a branch")
3. Pousse ton code (`git push`) → l'onglet **Actions** du repo lance le déploiement automatiquement
4. Ton site sera en ligne sur :
   `https://TON_UTILISATEUR.github.io/artisan-nomade`

> Délai : 1-3 minutes après le push. Tu peux suivre la progression dans l'onglet **Actions**.

### Étape 3 – Backend sur Render.com (GRATUIT)

1. Créer un compte sur [render.com](https://render.com)
2. **New** → **Web Service**
3. Connecter ton repo GitHub → sélectionner `artisan-nomade`
4. Configurer :
   - **Name** : `artisan-nomade-api`
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
5. Dans **Environment Variables**, ajouter :
   ```
   NODE_ENV=production
   FRONTEND_URL=https://TON_UTILISATEUR.github.io
   EMAIL_USER=artisannomade1@gmail.com
   EMAIL_PASS=TON_MOT_DE_PASSE_APP
   ADMIN_EMAIL=artisannomade1@gmail.com
   WHATSAPP_NUMBER=2290197998546
   ADMIN_TOKEN=CHOISIS_UN_TOKEN_SOLIDE_ET_SECRET
   ```
   ⚠️ Ne laisse jamais `ADMIN_TOKEN` vide en production : sans cette variable, le serveur
   retombe sur une valeur par défaut connue (visible dans le code), ce qui rend la page
   `/admin.html` accessible à n'importe qui.
6. Cliquer **Create Web Service**
7. Ton API sera sur : `https://artisan-nomade-api.onrender.com`

### Étape 4 – Connecter frontend → backend en prod

Deux fichiers pointent vers l'URL de l'API et doivent être mis à jour avec ton URL Render :
- `frontend/api.js` (repère le commentaire `← remplacer par votre URL Render`)
- `frontend/admin.html` (repère le commentaire `ONRENDER_URL`)

Commit + push → GitHub Pages se met à jour automatiquement.

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
