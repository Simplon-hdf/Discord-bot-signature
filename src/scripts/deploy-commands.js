// Script pour enregistrer les commandes slash auprès de Discord
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Vérifier que les variables d'environnement nécessaires sont définies
const { TOKEN, GUILD_ID, APPLICATION_ID } = process.env;

if (!TOKEN) {
  logger.error('La variable d\'environnement TOKEN n\'est pas définie');
  process.exit(1);
}

if (!GUILD_ID) {
  logger.error('La variable d\'environnement GUILD_ID n\'est pas définie');
  process.exit(1);
}

if (!APPLICATION_ID) {
  logger.error('La variable d\'environnement APPLICATION_ID n\'est pas définie');
  process.exit(1);
}

// Collecter les commandes depuis les fichiers
async function deployCommands() {
  try {
    const commands = [];
    const foldersPath = path.join(__dirname, '..', 'commands');
    const commandFolders = fs.readdirSync(foldersPath);
    
    // Collecter les commandes depuis chaque dossier
    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);
      
      // Vérifier si c'est un dossier
      if (!fs.statSync(commandsPath).isDirectory()) {
        continue;
      }
      
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
      
      // Ajouter chaque commande à la collection
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
          commands.push(command.data.toJSON());
          logger.info(`Ajout de la commande: ${command.data.name}`);
        } else {
          logger.warn(`La commande ${filePath} n'a pas les propriétés "data" ou "execute" requises`);
        }
      }
    }
    
    // Configurer le client REST
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    
    // Déployer les commandes
    logger.info(`Début du déploiement de ${commands.length} commandes slash...`);
    
    // Utiliser l'ID d'application directement
    const data = await rest.put(
      Routes.applicationGuildCommands(APPLICATION_ID, GUILD_ID),
      { body: commands }
    );
    
    logger.info(`Déploiement réussi de ${data.length} commandes slash!`);
  } catch (error) {
    logger.error(`Erreur lors du déploiement des commandes: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter le déploiement
deployCommands(); 