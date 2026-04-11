<div align="center">

# FairSplit

**Application web moderne pour la gestion des dépenses partagées entre amis, famille ou colocataires.**

![Version](https://img.shields.io/badge/version-1.0.0-orange?style=flat-square)
![Stack](https://img.shields.io/badge/stack-MERN-blue?style=flat-square)
![Realtime](https://img.shields.io/badge/realtime-Socket.io-purple?style=flat-square)
![License](https://img.shields.io/badge/license-proprietary-lightgrey?style=flat-square)
![Status](https://img.shields.io/badge/status-active-success?style=flat-square)

</div>

---

## Présentation

**FairSplit** est une application web full-stack permettant de gérer les dépenses partagées au sein d'un groupe. Elle offre un suivi en temps réel des dettes, une répartition automatique des soldes, et une expérience utilisateur fluide grâce à des animations soignées et un système d'onboarding interactif.

---

## Fonctionnalités

- **Gestion de groupes** — Créez des groupes, invitez des membres, suivez les dépenses collectives
- **Calcul automatique des soldes** — Répartition intelligente des dettes sans calcul manuel
- **Temps réel** — Notifications et mises à jour instantanées via Socket.io
- **Authentification sécurisée** — Inscription, connexion et récupération de mot de passe par email (JWT + bcrypt)
- **Export PDF** — Génération de rapports financiers détaillés avec jsPDF
- **Onboarding interactif** — Visite guidée pour les nouveaux utilisateurs via React Joyride
- **Demandes d'achats** — Système de gestion de demandes entre membres d'un groupe

---

## Stack technique

### Frontend
| Technologie | Rôle |
|---|---|
| React 19 | Bibliothèque UI principale |
| Vite | Build ultra-rapide |
| React Router DOM | Navigation SPA |
| Framer Motion | Animations fluides |
| Socket.io-client | Notifications temps réel |
| React Joyride | Onboarding interactif |
| jsPDF + jspdf-autotable | Export rapports PDF |
| Heroicons & React Icons | Iconographie |

### Backend
| Technologie | Rôle |
|---|---|
| Node.js + Express.js | Serveur & API REST |
| MongoDB + Mongoose | Base de données |
| Socket.io | Communication temps réel |
| JWT + bcryptjs | Authentification sécurisée |
| Resend | Envoi d'emails (récupération de mot de passe) |
| dotenv | Variables d'environnement |
| Nodemon | Rechargement automatique en dev |
| ESLint | Qualité du code |

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** v18 ou supérieure
- **npm** (inclus avec Node.js)
- **MongoDB** — instance locale ou cluster [MongoDB Atlas](https://www.mongodb.com/atlas)

---

## Installation & démarrage

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-username/fairsplit.git
cd fairsplit
```

### 2. Configurer le backend

```bash
cd serv
npm install
```

Créez un fichier `.env` dans le dossier `serv/` (basez-vous sur `.env.example`) :

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

Lancez le serveur :

```bash
npm run dev
```

### 3. Configurer le frontend

```bash
cd ../client
npm install
npm run dev
```

L'application sera accessible sur **http://localhost:5173**.

---

## Structure du projet
FairSplit/
├── client/                 # Frontend React
│   └── src/
│       ├── api/            # Logique d'appels API
│       ├── context/        # État global (Auth, Toasts…)
│       ├── components/     # Composants réutilisables
│       └── pages/          # Vues / routes
└── serv/                   # Backend Node.js
├── models/             # Schémas MongoDB (Mongoose)
├── routes/             # Définition des routes API
├── controllers/        # Logique métier
└── middleware/         # Auth, gestion d'erreurs

---

> © 2026 FairSplit Inc. — Tous droits réservés.