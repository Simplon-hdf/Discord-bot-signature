const { Client, GatewayIntentBits, Events } = require('discord.js');
const logger = require('../utils/logger');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ]
});

// Ajoutez l'ID de la catégorie ici
const SIGNATURE_CATEGORY_ID = 'your_signature_category_id_here'; // Remplacez par l'ID réel

// Liste de promotions codée en dur
const promotions = [
    { uuid: 'promo-1', name: 'Promotion 1' },
    { uuid: 'promo-2', name: 'Promotion 2' },
    { uuid: 'promo-3', name: 'Promotion 3' }
];

// Fonction pour créer un thread de signature
async function createSignatureThread(channelId) {
    const channel = await client.channels.fetch(channelId);
    if (channel) {
        const thread = await channel.threads.create({
            name: 'Signature Thread',
            autoArchiveDuration: 60,
            reason: 'Création d\'un thread de signature',
            type: 'GUILD_PUBLIC_THREAD', // ou 'GUILD_PRIVATE_THREAD' selon vos besoins
        });
        logger.info(`Thread de signature créé : ${thread.name}`);
    } else {
        logger.error('Channel non trouvé pour créer le thread de signature.');
    }
}

// Événement pour écouter les messages
client.on(Events.MessageCreate, async (message) => {
    if (message.content === '!createSignatureThread') {
        await createSignatureThread(SIGNATURE_CATEGORY_ID);
        message.channel.send('Thread de signature créé !');
    }
    if (message.content === '!getPromotions') {
        try {
            message.channel.send(`Promotions disponibles : ${JSON.stringify(promotions)}`);
        } catch (error) {
            logger.error('Erreur lors de la récupération des promotions:', error);
            message.channel.send('Erreur lors de la récupération des promotions.');
        }
    }
});

async function startBot() {
    client.once('ready', () => {
        logger.info(`Bot connecté en tant que ${client.user.tag}`);
    });

    // Gestion des erreurs
    client.on('error', error => {
        logger.error('Erreur Discord:', error);
    });

    // Connexion du bot
    await client.login(process.env.DISCORD_TOKEN);
}

module.exports = {
    startBot,
    client
};