#!/bin/bash

echo "=== DÉBOGAGE DU CONTENEUR DOCKER ==="

# Exécuter un shell dans le conteneur
docker exec -it discord-signature-bot /bin/sh -c '
echo "== Vérification des fichiers =="
ls -la /app
ls -la /app/src

echo "== Vérification du fichier index.js =="
cat /app/src/index.js | head -20

echo "== Vérification des permissions =="
ls -la /app/.env

echo "== Journaux d'\''erreur =="
tail -n 50 /app/logs/error.log 2>/dev/null || echo "Aucun journal d'\''erreur trouvé"
' 