# LRN CHAT 🔐

Application de messagerie chiffrée de bout en bout avec un design mobile moderne.

## 🌟 Fonctionnalités

- **Chiffrement AES-256 GCM** : Tous les messages sont chiffrés avec l'API Web Crypto native
- **Design Glassmorphique** : Interface moderne avec effets de verre et animations fluides
- **Mobile-First** : Optimisé pour les appareils mobiles avec un design responsive
- **Conversations Multiples** : Gérez plusieurs conversations avec des clés de chiffrement uniques
- **Stockage Local Sécurisé** : Les messages chiffrés sont stockés localement dans le navigateur
- **Interface Intuitive** : Navigation fluide avec animations et transitions élégantes

## 🚀 Démarrage Rapide

### Installation

1. Clonez le repository :
```bash
git clone https://github.com/LePereFouras/lrnchat.git
cd lrnchat
```

2. Ouvrez `index.html` dans votre navigateur préféré

Aucune installation de dépendances n'est nécessaire ! L'application utilise uniquement des technologies web natives.

### Utilisation

1. **Connexion** : Entrez votre nom d'utilisateur sur l'écran de connexion
2. **Créer une conversation** : Cliquez sur le bouton "+" pour créer une nouvelle conversation
3. **Envoyer des messages** : Sélectionnez une conversation et tapez vos messages
4. **Sécurité** : Tous les messages sont automatiquement chiffrés avec AES-256 GCM

## 🔒 Sécurité

- **Chiffrement de bout en bout** : Utilise l'API Web Crypto pour le chiffrement AES-GCM 256-bit
- **Clés uniques** : Chaque conversation a sa propre clé de chiffrement générée aléatoirement
- **Stockage sécurisé** : Les messages sont stockés chiffrés dans le localStorage
- **Pas de serveur** : Toutes les données restent sur votre appareil

⚠️ **Note** : Cette application est destinée à des fins de démonstration. Pour une utilisation en production, une infrastructure serveur avec synchronisation et authentification appropriée serait nécessaire.

## 🛠️ Technologies

- **HTML5** : Structure sémantique
- **CSS3** : Design moderne avec variables CSS, gradients, et glassmorphisme
- **JavaScript (ES6+)** : Logique applicative orientée objet
- **Web Crypto API** : Chiffrement natif du navigateur

## 📱 Compatibilité

- ✅ Chrome/Edge (recommandé)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile (iOS/Android)

Nécessite un navigateur moderne avec support de l'API Web Crypto.

## 📂 Structure du Projet

```
lrnchat/
├── index.html      # Structure HTML principale
├── styles.css      # Système de design et styles
├── crypto.js       # Module de chiffrement
├── app.js          # Logique de l'application
└── README.md       # Documentation
```

## 🎨 Personnalisation

Vous pouvez personnaliser l'apparence en modifiant les variables CSS dans `styles.css` :

```css
:root {
    --primary-gradient-start: #6366f1;
    --primary-gradient-end: #a855f7;
    --bg-primary: #0a0118;
    --bg-secondary: #1a0b2e;
    /* ... */
}
```

## 📄 Licence

MIT License - Libre d'utilisation pour des projets personnels et commerciaux.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir des issues ou des pull requests.

---

Développé avec ❤️ pour la sécurité et le design moderne.
