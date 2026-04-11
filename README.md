# FairSplit

FairSplit est une application web moderne pour gerer les depenses entre amis, en famille ou en colocation. Elle permet de suivre qui doit quoi a qui, de gerer des groupes et des demandes d'achats en temps reel.

## Prerequis

Avant de commencer, assurez-vous d'avoir installe les elements suivants sur votre machine :

- Node.js (version 18 ou superieure recommandee)
- npm (generalement installe avec Node.js)
- MongoDB (une instance locale ou un compte MongoDB Atlas)

## Installation et Demarrage

Le projet est divise en deux parties : le Client (Frontend) et le Serveur (Backend).

### 1. Configuration du Serveur (Backend)

Allez dans le dossier `serv` :

```bash
cd serv
```

Installez les dependances :

```bash
npm install
```

Configurez les variables d'environnement :
Creez un fichier `.env` dans le dossier `serv` en vous basant sur `.env.example` :

```env
PORT=5000
MONGO_URI=votre_url_mongodb
JWT_SECRET=votre_secret_jwt
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=votre_cle_api_resend
RESEND_FROM_EMAIL=votre_email_expediteur
```

Demarrez le serveur (en mode developpement) :

```bash
npm run dev
```

### 2. Configuration du Client (Frontend)

Allez dans le dossier `client` :

```bash
cd client
```

Installez les dependances :

```bash
npm install
```

Demarrez l'application :

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000.

## Technologies utilisees

- Frontend : React 19, Vite, Framer Motion (animations), Custom CSS (avec variables CSS).
- Backend : Node.js, Express, MongoDB (Mongoose), Socket.io (temps reel).
- Authentification : JSON Web Token (JWT).
- Emailing : Resend.

## Structure du projet

- client/ : Contient tout le code frontend (React).
- serv/ : Contient tout le code backend (Node.js/Express).
- client/src/api/ : Logique de communication avec l'API.
- client/src/context/ : Gestion des etats globaux (Auth, Toasts, etc.).
- serv/models/ : Schemas de donnees MongoDB.

## Licence

(c) 2026 FairSplit Inc. Tous droits reserves.
