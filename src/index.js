require('dotenv').config();
const { startBot } = require('./bot/bot');
const { startServer } = require('./server/server');
const logger = require('./utils/logger');

async function main() {
    try {
        // Démarrage du bot Discord
        await startBot();
        
        // Démarrage du serveur Express
        await startServer();
        
        logger.info('Application démarrée avec succès');
    } catch (error) {
        logger.error('Erreur lors du démarrage de l\'application:', error);
        process.exit(1);
    }
}

main(); 