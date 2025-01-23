# Discord-bot-signature

Bot Discord de signature avec environnement CI/CD automatisé.

## 🔧 Configuration requise

### Secrets GitHub Actions

- DOCKERHUB_USERNAME    # Username Docker Hub
- DOCKERHUB_TOKEN       # Token Docker Hub
- VPS_HOST             # IP du VPS
- VPS_USERNAME         # User SSH
- VPS_SSH_KEY          # Clé SSH
- DISCORD_TOKEN        # Token bot prod
- DISCORD_TOKEN_DEV    # Token bot dev

## 🚀 Environnements

### Production
- Branche: `main`
- Image: `discord-bot:latest`
- Container: `discord-bot`

### Développement
- Branche: `deploy-dev`
- Image: `discord-bot-dev:latest`
- Container: `discord-bot-dev`

## 📦 Déploiement

Le déploiement est automatique via GitHub Actions :
- Push sur `main` → déploie en production
- Push sur `deploy-dev` → déploie en développement

## 🛠️ Commandes utiles

### Gestion des branches
    git checkout -b deploy-dev
    git push -u origin deploy-dev

### Gestion Docker
    docker ps
    docker logs discord-bot
    docker logs discord-bot-dev

## 📁 Structure du projet

    .
    ├── .github/workflows/   # Pipeline CI/CD
    │   └── deploy.yml      # Configuration du déploiement
    ├── Dockerfile          # Configuration Docker
    ├── package.json        # Dépendances Node.js
    └── .gitignore         # Fichiers ignorés par Git 