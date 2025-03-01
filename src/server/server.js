const express = require('express');
const logger = require('../utils/logger');

const app = express();
const port = process.env.PORT || 3000;

function startServer() {
    return new Promise((resolve, reject) => {
        try {
            app.use(express.json());

            // Route de base pour vérifier que le serveur fonctionne
            app.get('/health', (req, res) => {
                res.json({ status: 'ok' });
            });

            // Démarrage du serveur
            app.listen(port, () => {
                logger.info(`Serveur Express démarré sur le port ${port}`);
                resolve();
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    startServer,
    app
}; 