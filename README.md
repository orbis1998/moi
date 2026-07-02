# Aroman EMETSHU — Portfolio Premium v2.0

Plateforme professionnelle combinant portfolio développeur logiciel et Media Buyer, avec administration complète, blog dynamique et statistiques visiteurs.

## Stack technique

- **Backend** : Node.js, Express
- **Base de données** : SQLite (better-sqlite3)
- **Vues** : EJS (server-side rendering pour le SEO)
- **Frontend** : CSS premium, JavaScript vanilla
- **Sécurité** : bcrypt, sessions sécurisées, helmet, rate limiting

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Initialiser la base de données et l'admin
npm run init-db

# Lancer le serveur
npm run dev
```

- **Site** : http://localhost:3000
- **Administration** : http://localhost:3000/gestion-interne-aroman

> L'URL d'administration est configurable via `ADMIN_PATH` dans `.env`. Aucun lien public ne pointe vers l'admin.

## Configuration (.env)

| Variable | Description |
|----------|-------------|
| `PORT` | Port du serveur |
| `SESSION_SECRET` | Secret des sessions (à changer en production) |
| `ADMIN_PATH` | URL privée de l'administration |
| `ADMIN_USERNAME` | Identifiant admin |
| `ADMIN_PASSWORD` | Mot de passe admin |
| `SITE_URL` | URL canonique du site |
| `SITE_NAME` | Nom du site |

## Fonctionnalités

### Site public
- Page d'accueil premium (Hero, Présentation, Expertises, Réalisations, Campagnes, Blog, Témoignages, Contact)
- Formulaire de demande de projet (multi-services)
- Blog avec articles SEO
- Réalisations, applications et campagnes dynamiques
- SEO : JSON-LD, sitemap.xml, robots.txt, Open Graph, Twitter Cards

### Administration
- Gestion des projets web, applications, campagnes marketing
- Blog avec champs SEO
- Témoignages
- Demandes de contact reçues
- Statistiques visiteurs (IP, appareil, navigateur, source, pages vues)

## Structure

```
├── server/           # Backend Express
│   ├── app.js        # Point d'entrée
│   ├── db.js         # Schéma SQLite
│   ├── middleware/   # Auth, analytics, upload
│   └── routes/       # Pages, API, admin
├── views/            # Templates EJS
├── public/           # Assets statiques + uploads
├── data/             # Base SQLite
└── legacy/           # Ancien site statique (archivé)
```

## Production

### Vercel (recommandé pour ce repo)

Le domaine `aromanemetshu.com` doit pointer vers un déploiement Vercel connecté à ce dépôt GitHub.

1. Importer le repo `orbis1998/moi` dans [Vercel](https://vercel.com)
2. Ajouter les variables d'environnement :
   - `NODE_ENV=production`
   - `DATABASE_URL` (Supabase pooler, voir ci-dessous)
   - `DATABASE_DRIVER=postgres`
   - `SESSION_SECRET`
   - `ADMIN_PATH`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
   - `SITE_URL=https://www.aromanemetshu.com`
3. Déployer — `vercel.json` et `api/index.js` routent toutes les pages vers Express

**`DATABASE_URL` sur Vercel** — dans Supabase → Settings → Database → Connection string :

- Option A (recommandée serverless) : **Transaction pooler**, port `6543`
- Option B (si timeout) : **Session pooler**, port `5432`

Exemple transaction pooler :
```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:MOT_DE_PASSE@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=30&sslmode=require
```

Exemple session pooler :
```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:MOT_DE_PASSE@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?connect_timeout=30&sslmode=require
```

### Serveur Node classique

1. Définir `NODE_ENV=production`
2. Changer `SESSION_SECRET`, `ADMIN_PASSWORD`
3. Configurer `SITE_URL` avec le domaine réel
4. Utiliser un reverse proxy (Nginx) avec HTTPS
5. `npm start`

## Contact

- Email : contact@aromanemetshu.com
- WhatsApp : +242 06 745 8011
- Site : https://www.aromanemetshu.com
