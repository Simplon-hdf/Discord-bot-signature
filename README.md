# 🤖 Discord Signature Bot

![Bot Logo](https://place-hold.it/800x200&text=Discord%20Signature%20Bot&fontsize=30)

> **Un bot Discord élégant pour la gestion des signatures de feuilles de présence digitales**

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.x-blue)](https://discord.js.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue)](https://www.docker.com/)

## ✨ Fonctionnalités

Le bot de signature offre plusieurs fonctionnalités clés pour faciliter la gestion des signatures dans un contexte de formation :

- 📝 **Création de messages de signature** - Génère des messages interactifs avec sélection de promotions
- 🧵 **Gestion des threads de signature** - Crée automatiquement des threads dédiés à chaque promotion
- 👨‍🏫 **Interface formateur** - Permet aux formateurs de sélectionner et contacter les apprenants
- 👨‍🎓 **Interface apprenant** - Permet aux apprenants de contacter les formateurs
- ⏱️ **Anti-spam intelligent** - Système de cooldown pour éviter les abus (5 minutes entre chaque envoi)

## 🛠️ Configuration de l'application Discord

### Création d'une application Discord

1. Rendez-vous sur le [Portail des développeurs Discord](https://discord.com/developers/applications)
2. Cliquez sur **"New Application"** en haut à droite
3. Donnez un nom à votre application (ex: `Signature Bot`) et acceptez les conditions
4. Dans la section **"Bot"** du menu latéral, cliquez sur **"Add Bot"**

### Récupération du token du bot

1. Dans la section **"Bot"**, sous **"TOKEN"**, cliquez sur **"Reset Token"** puis **"Copy"**
   
   ![Token Bot](https://place-hold.it/600x100&text=Copy%20Bot%20Token&fontsize=20)
   
2. Ce token sera utilisé dans votre fichier `.env` (variable `TOKEN`)

### Configuration des intents et permissions nécessaires

1. Sous **"Bot"**, activez les options suivantes :
   - **Presence Intent**
   - **Server Members Intent**
   - **Message Content Intent**

2. Dans **"OAuth2" > "URL Generator"**, sélectionnez les permissions suivantes :
   - `bot`
   - `applications.commands`
   
3. Sous **"Bot Permissions"**, sélectionnez :
   - `Administrator` OU les permissions spécifiques :
     - `Manage Channels`
     - `Manage Threads`
     - `Send Messages`
     - `Create Public Threads`
     - `Send Messages in Threads`
     - `Embed Links`
     - `Read Message History`

4. Copiez l'URL générée et ouvrez-la dans un navigateur pour inviter le bot sur votre serveur

### Récupération de l'ID d'application Discord

1. Dans la section **"General Information"**, copiez l'**"APPLICATION ID"**
2. Utilisez cet ID dans votre fichier `.env` (variable `APPLICATION_ID`)

## 🔍 Récupération des IDs Discord

### Récupération de l'ID du serveur Discord

1. Activez le **"Mode Développeur"** dans Discord : 
   - Paramètres > Avancés > Mode développeur
   
2. Faites un clic droit sur le nom de votre serveur et sélectionnez **"Copier l'identifiant"**
   
   ![Server ID](https://place-hold.it/400x200&text=Copy%20Server%20ID&fontsize=20)
   
3. Utilisez cet ID dans votre fichier `.env` (variable `GUILD_ID`)

### Récupération de l'ID du canal d'administration

1. Faites un clic droit sur le canal destiné à l'administration
2. Sélectionnez **"Copier l'identifiant"**
3. Utilisez cet ID dans votre fichier `.env` (variable `ADMIN_CONFIG_CHANNEL_ID`)

## ⚙️ Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet en vous basant sur `.env.example`.

```env
# Bot Discord - Configuration essentielle
TOKEN=votreTokenDiscord
APPLICATION_ID=votreIDApplication
GUILD_ID=votreIDServeur

# API Configuration
API_BASE_URL=http://localhost:3000
# API_KEY=cléAPISiNécessaire

# Configuration des canaux
ADMIN_CONFIG_CHANNEL_ID=votreIDCanalAdmin

# Serveur Express (API locale)
PORT=4000

# Logs et environnement
LOG_LEVEL=info
NODE_ENV=production
```

### Description des variables

| Variable | Description | Exemple |
|----------|-------------|---------|
| `TOKEN` | Token d'authentification du bot Discord | `MTMzMjI4NDk3Mjk1Nzk2...` |
| `APPLICATION_ID` | ID de l'application Discord | `1332284972957962293` |
| `GUILD_ID` | ID du serveur Discord | `1338499599584722965` |
| `API_BASE_URL` | URL de l'API (locale ou distante) | `http://localhost:3000` |
| `ADMIN_CONFIG_CHANNEL_ID` | ID du canal d'administration | `1344593994616930337` |
| `PORT` | Port pour le serveur API express | `4000` |
| `LOG_LEVEL` | Niveau de détail des logs (`debug`, `info`, `warn`, `error`) | `info` |
| `NODE_ENV` | Environnement (`development` ou `production`) | `production` |

## 🐳 Déploiement avec Docker

### Prérequis

- [Docker](https://www.docker.com/get-started) installé sur votre système
- [Docker Compose](https://docs.docker.com/compose/install/) (inclus avec Docker Desktop)

### Lancement avec Docker Compose

1. Assurez-vous que votre fichier `.env` est correctement configuré
2. Exécutez la commande suivante à la racine du projet :

```bash
docker-compose up -d
```

Pour voir les logs en temps réel :

```bash
docker-compose logs -f bot
```

### Utilisation du script de déploiement

Le projet inclut un script de déploiement simplifié :

```bash
# Rendre le script exécutable (Linux/Mac)
chmod +x deploy.sh

# Lancer le déploiement
./deploy.sh
```

### Commandes Docker utiles

```bash
# Arrêter les services
docker-compose down

# Reconstruire l'image et redémarrer les services
docker-compose up -d --build

# Voir les journaux d'erreur
./docker-debug.sh
```

## 💻 Installation locale (sans Docker)

```bash
# Installer les dépendances
npm install

# Déployer les commandes slash
npm run deploy-commands

# Démarrer le bot
npm start
```

## 🎮 Utilisation du bot

### Commandes disponibles

- `/init-signature` - Crée un message de configuration de signature
- `/liste-promos` - Affiche la liste des promotions disponibles

### Workflow typique

1. Utilisez `/init-signature` dans un canal approprié
2. Sélectionnez une promotion dans le menu déroulant
3. Cliquez sur "Créer" pour générer un thread de signature
4. Dans le thread, les formateurs peuvent envoyer des messages aux apprenants et vice versa
5. Les messages privés sont limités à un toutes les 5 minutes pour éviter le spam

## 🔧 Dépannage

### Problèmes courants

- **Le bot ne répond pas** : Vérifiez que le token est correct et que les intents sont activés
- **Commandes non visibles** : Réexécutez `npm run deploy-commands` pour enregistrer les commandes
- **Erreur EISDIR** : Supprimez le dossier `.bot.lock` s'il existe
- **Cooldown ne fonctionne pas** : Vérifiez les permissions d'écriture dans le dossier `/data`

### Logs

Les logs sont stockés dans le dossier `/logs` :

- `info.log` - Informations générales
- `error.log` - Erreurs et diagnostics

Pour augmenter le niveau de détail des logs, modifiez `LOG_LEVEL=debug` dans le fichier `.env`.

## 🤝 Contribuer

Les contributions sont les bienvenues ! Voici comment procéder :

1. Forkez le dépôt
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'feat: add amazing feature'`)
4. Poussez la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

---

Développé avec ❤️ pour faciliter la vie des formateurs et des apprenants.