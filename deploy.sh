#!/bin/bash

# Script de déploiement pour le bot de signature

# Vérification des dépendances
if ! [ -x "$(command -v docker)" ]; then
  echo "Erreur: Docker n'est pas installé." >&2
  exit 1
fi

if ! [ -x "$(command -v docker-compose)" ]; then
  echo "Erreur: Docker Compose n'est pas installé." >&2
  exit 1
fi

# Vérification du fichier .env
if [ ! -f .env ]; then
  echo "Création du fichier .env à partir de .env.example..."
  cp .env.example .env
  echo "⚠️ Veuillez éditer le fichier .env avec vos propres paramètres avant de continuer."
  exit 1
fi

# Arrêt des containers existants
echo "Arrêt des containers existants..."
docker-compose down

# Construction des images
echo "Construction des images Docker..."
docker-compose build

# Démarrage des services
echo "Démarrage des services..."
docker-compose up -d

# Affichage des logs
echo "Services démarrés! Affichage des logs..."
docker-compose logs -f bot 