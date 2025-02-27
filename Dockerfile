FROM node:18-alpine

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm ci --only=production

# Création des dossiers nécessaires
RUN mkdir -p logs

# Copie de TOUS les fichiers sources, pas seulement le dossier src
COPY . .

# Configuration des permissions
RUN chown -R node:node /app
USER node

# Commande par défaut
CMD ["node", "src/index.js"] 