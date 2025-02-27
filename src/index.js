require('dotenv').config();
const { Client } = require('./client');
const logger = require('./utils/logger');

// Vérifier que les variables d'environnement essentielles sont définies
if (!process.env.TOKEN) {
  logger.error('Le token Discord n\'est pas défini dans les variables d\'environnement');
  process.exit(1);
}

// Créer et démarrer le client Discord
const client = new Client();

// Démarrer le bot
client.start().catch(error => {
  logger.error(`Erreur au démarrage du bot: ${error.message}`);
  process.exit(1);
});

// Gérer les erreurs non capturées
process.on('unhandledRejection', error => {
  logger.error(`Promesse rejetée non gérée: ${error.message}`, error);
});

process.on('uncaughtException', error => {
  logger.error(`Exception non capturée: ${error.message}`, error);
  process.exit(1);
}); 