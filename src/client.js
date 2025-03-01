const { Client: DiscordClient, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

class Client extends DiscordClient {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
      ]
    });

    // Collections pour stocker les commandes et les événements
    this.commands = new Collection();
  }

  /**
   * Démarrer le bot
   */
  async start() {
    try {
      // Charger les événements
      await this.loadEvents();
      
      // Charger les commandes
      await this.loadCommands();
      
      // Connecter le bot à Discord
      await this.login(process.env.TOKEN);
      
      logger.info(`Bot connecté en tant que ${this.user.tag}`);
    } catch (error) {
      logger.error(`Erreur lors du démarrage du bot: ${error.message}`);
      throw error;
    }
  }

  /**
   * Charger les gestionnaires d'événements
   */
  async loadEvents() {
    try {
      const eventsPath = path.join(__dirname, 'events');
      const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
      
      for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        
        if (event.once) {
          this.once(event.name, (...args) => event.execute(...args, this));
        } else {
          this.on(event.name, (...args) => event.execute(...args, this));
        }
        
        logger.info(`Événement chargé: ${event.name}`);
      }
      
      logger.info(`Chargement de ${eventFiles.length} événements terminé`);
    } catch (error) {
      logger.error(`Erreur lors du chargement des événements: ${error.message}`);
      throw error;
    }
  }

  /**
   * Charger les commandes slash
   */
  async loadCommands() {
    try {
      const foldersPath = path.join(__dirname, 'commands');
      const commandFolders = fs.readdirSync(foldersPath);
      let commandCount = 0;
      
      for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        
        // Vérifier si c'est un dossier
        if (!fs.statSync(commandsPath).isDirectory()) {
          continue;
        }
        
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
          const filePath = path.join(commandsPath, file);
          const command = require(filePath);
          
          // Vérifier que la commande a les propriétés requises
          if ('data' in command && 'execute' in command) {
            this.commands.set(command.data.name, command);
            commandCount++;
            logger.info(`Commande chargée: ${command.data.name}`);
          } else {
            logger.warn(`La commande ${filePath} n'a pas les propriétés "data" ou "execute" requises`);
          }
        }
      }
      
      logger.info(`Chargement de ${commandCount} commandes terminé`);
    } catch (error) {
      logger.error(`Erreur lors du chargement des commandes: ${error.message}`);
      throw error;
    }
  }
}

module.exports = { Client }; 