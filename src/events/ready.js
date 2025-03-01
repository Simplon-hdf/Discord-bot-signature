const { Events } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`Prêt ! Connecté en tant que ${client.user.tag}`);
    
    // Définir le statut du bot
    client.user.setActivity('Signature Bot', { type: 'WATCHING' });
  },
}; 