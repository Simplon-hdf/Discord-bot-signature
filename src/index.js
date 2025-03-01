require('dotenv').config();
const { Client } = require('./client');
const logger = require('./utils/logger');
const path = require('path');
const fs = require('fs');

// VERROU D'INSTANCE UNIQUE
const lockFile = path.join(__dirname, '../.bot.lock');

// Vérifier si le bot est déjà en cours d'exécution
if (fs.existsSync(lockFile)) {
  // Vérifier si c'est un dossier
  const stat = fs.statSync(lockFile);
  if (stat.isDirectory()) {
    // Si c'est un dossier, le supprimer
    fs.rmdirSync(lockFile, { recursive: true });
    logger.warn(`Suppression du dossier .bot.lock qui causait une erreur`);
  } else {
    // C'est un fichier, lire le PID
    const pid = fs.readFileSync(lockFile, 'utf8');
    logger.error(`Le bot semble déjà être en cours d'exécution (PID: ${pid}). Si ce n'est pas le cas, supprimez le fichier .bot.lock`);
    process.exit(1);
  }
}

// Créer le fichier de verrouillage avec le PID actuel
fs.writeFileSync(lockFile, process.pid.toString());

// Supprimer le fichier de verrouillage à la sortie du processus
process.on('exit', () => {
  try {
    fs.unlinkSync(lockFile);
    logger.info('Fichier de verrouillage supprimé');
  } catch (err) {
    // Ignorer les erreurs lors de la suppression
  }
});

// Faire la même chose pour les autres signaux de terminaison
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
  process.on(signal, () => {
    logger.info(`Signal ${signal} reçu, arrêt en cours...`);
    try {
      fs.unlinkSync(lockFile);
      logger.info('Fichier de verrouillage supprimé');
    } catch (err) {
      // Ignorer les erreurs lors de la suppression
    }
    process.exit(0);
  });
});

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

// S'assurer que les gestionnaires d'événements ne sont pas enregistrés plusieurs fois
client.removeAllListeners();

// Puis charger les événements
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  
  console.log(`Événement enregistré: ${event.name}`);
} 