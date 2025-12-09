# LRN CHAT 🔐

**Application de messagerie chiffrée end-to-end full-stack** avec frontend web, application mobile, et backend partagé.

## 🌟 Fonctionnalités

### Chiffrement & Sécurité
- **Chiffrement AES-256 GCM end-to-end** : Tous les messages sont chiffrés côté client
- **Signal Protocol ready** : Infrastructure prête pour chiffrement avancé
- **Stockage sécurisé des clés** : IndexedDB (web) et Secure Store (mobile)
- **Authentification JWT** : Tokens sécurisés avec bcrypt pour les mots de passe

### Plateformes
- **Application Web** : React + Vite, design glassmorphique moderne
- **Application Mobile** : React Native Expo (iOS & Android)
- **Backend partagé** : Node.js + Express + Socket.IO + PostgreSQL

### Fonctionnalités Chat
- **Temps réel** : WebSockets bidirectionnels pour messagerie instantanée
- **Conversations multiples** : Direct et groupes
- **Indicateurs de frappe** : Typing indicators en temps réel
- **Historique de messages** : Synchronisé entre tous les appareils
- **Recherche d'utilisateurs** : Trouver et démarrer des conversations

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- npm ou yarn

### Option 1 : Docker (Recommandé)

```bash
# Clone le repository
git clone https://github.com/LePereFouras/lrnchat.git
cd lrnchat

# Démarrer PostgreSQL et Redis avec Docker
docker-compose up postgres redis -d

# Installer et démarrer le backend
cd backend
cp .env.example .env
# Éditer .env avec vos configurations
npm install
npx prisma migrate dev
npm run dev

# Dans un nouveau terminal - Frontend Web
cd ../web
npm install
npm run dev

# Dans un nouveau terminal - Mobile (optionnel)
cd ../mobile
npm install
npx expo start
```

### Option 2 : Installation Manuelle

#### 1. Backend

```bash
cd backend

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env :
# - DATABASE_URL : connexion PostgreSQL
# - REDIS_URL : connexion Redis
# - JWT_SECRET : clé secrète aléatoire

# Installer les dépendances
npm install

# Générer Prisma Client et migrer la base de données
npx prisma generate
npx prisma migrate dev

# Démarrer le serveur
npm run dev
# Le serveur démarre sur http://localhost:3000
```

#### 2. Frontend Web

```bash
cd web

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
# L'application web s'ouvre sur http://localhost:5173
```

#### 3. Application Mobile

```bash
cd mobile

# Installer les dépendances
npm install

# Mettre à jour l'URL du backend
# Dans src/contexts/AuthContext.js et src/services/socketService.js
# Remplacer "http://localhost:3000" par l'IP de votre machine

# Démarrer Expo
npx expo start

# Scanner le QR code avec Expo Go sur votre mobile
```

## 📂 Structure du Projet

```
lrnchat/
├── backend/                  # Backend Node.js
│   ├── prisma/              # Schéma de base de données
│   │   └── schema.prisma
│   ├── routes/              # Routes API REST
│   │   ├── authRoutes.js
│   │   ├── conversationRoutes.js
│   │   └── userRoutes.js
│   ├── middleware/          # Middleware Express
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── server.js            # Point d'entrée principal
│   └── socketHandler.js     # Gestion WebSocket
│
├── web/                     # Frontend Web React
│   ├── src/
│   │   ├── contexts/        # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── pages/           # Pages de l'application
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ConversationsPage.jsx
│   │   │   └── ChatPage.jsx
│   │   ├── services/        # Services
│   │   │   ├── cryptoService.js
│   │   │   └── socketService.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
│
├── mobile/                  # Application Mobile React Native
│   ├── src/
│   │   ├── contexts/        # React contexts
│   │   │   └── AuthContext.js
│   │   ├── screens/         # Écrans de l'application
│   │   │   ├── LoginScreen.js
│   │   │   ├── ConversationsScreen.js
│   │   │   └── ChatScreen.js
│   │   └── services/        # Services
│   │       ├── cryptoService.js
│   │       ├── socketService.js
│   │       └── secureStorage.js
│   ├── App.js
│   └── app.json
│
├── docker-compose.yml       # Configuration Docker
└── README.md
```

## 🛠️ Technologies

### Backend
- **Node.js** + **Express** : Serveur API REST
- **Socket.IO** : WebSockets temps réel
- **Prisma** : ORM pour PostgreSQL
- **PostgreSQL** : Base de données relationnelle
- **Redis** : Cache et sessions
- **JWT** : Authentification
- **bcrypt** : Hashing de mots de passe

### Frontend Web
- **React 18** : Framework UI
- **Vite** : Build tool ultra-rapide
- **React Router** : Navigation
- **React Query** : Gestion d'état serveur
- **Socket.IO Client** : WebSockets
- **Axios** : Client HTTP

### Mobile
- **React Native** : Framework mobile
- **Expo** : Outils de développement
- **React Navigation** : Navigation
- **Expo Secure Store** : Stockage sécurisé
- **react-native-quick-crypto** : Crypto natif

## 🔒 Sécurité & Chiffrement

### Flux de Chiffrement

1. **Génération de clés** : Chaque conversation génère une clé AES-256 unique
2. **Chiffrement local** : Messages chiffrés sur l'appareil avant envoi
3. **Transmission** : Contenu chiffré + IV envoyés via WebSocket
4. **Stockage** : Messages stockés chiffrés dans PostgreSQL
5. **Déchiffrement** : Messages déchiffrés côté client à la réception

### Schéma de Base de Données

```sql
Users
├── id (UUID)
├── username (unique)
├── email
├── passwordHash (bcrypt)
└── lastSeen

Conversations
├── id (UUID)
├── name
├── type (DIRECT/GROUP)
└── createdAt

Messages
├── id (UUID)
├── conversationId
├── senderId
├── encryptedContent (chiffré)
├── iv (initialization vector)
├── timestamp
├── deliveredAt
└── readAt

ConversationMembers
└── (relation many-to-many)

EncryptionKeys
└── (Signal Protocol keys)
```

## 📱 Utilisation

### Web & Mobile

1. **S'inscrire** : Créer un compte avec nom d'utilisateur et mot de passe
2. **Se connecter** : Authentification avec JWT
3. **Créer une conversation** : Rechercher un utilisateur et démarrer une conversation
4. **Envoyer des messages** : Messages chiffrés automatiquement avant envoi
5. **Temps réel** : Messages apparaissent instantanément sur tous les appareils

## 🚢 Déploiement

### Backend

Recommandations :
- **Railway** : `railway up` (avec PostgreSQL et Redis intégrés)
- **Render** : Déploiement automatique via Git
- **DigitalOcean** : App Platform avec bases de données managées
- **Heroku** : Avec addons Heroku Postgres et Redis

### Frontend Web

```bash
cd web
npm run build
# Déployer le dossier dist/ sur Vercel, Netlify, ou Cloudflare Pages
```

### Mobile

```bash
cd mobile
# Build avec EAS (Expo Application Services)
npm install -g eas-cli
eas build --platform all
```

## 🧪 Tests

```bash
# Backend
cd backend
npm test

# Web
cd web
npm test
```

## 📄 API Endpoints

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter

### Conversations
- `GET /api/conversations` - Liste des conversations
- `POST /api/conversations` - Créer une conversation
- `GET /api/conversations/:id/messages` - Historique des messages

### Utilisateurs
- `GET /api/users/search?q=username` - Rechercher des utilisateurs
- `GET /api/users/me` - Profil actuel

### WebSocket Events
- `conversation:join` - Rejoindre une conversation
- `message:send` - Envoyer un message
- `message:new` - Recevoir un message
- `typing:start` / `typing:stop` - Indicateurs de frappe
- `user:status` - Statut en ligne/hors ligne

## 🎨 Design

Le design s'inspire du glassmorphisme avec :
- Gradients colorés (#6366f1 → #a855f7)
- Effets de transparence et flou
- Animations fluides
- Mode sombre par défaut
- Design responsive mobile-first

## 📝 Licence

MIT License

## 🤝 Contribution

Les contributions sont bienvenues ! N'hésitez pas à ouvrir des issues ou des pull requests.

---

**Créé avec ❤️ pour la vie privée et la sécurité**