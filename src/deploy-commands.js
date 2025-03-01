const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Récupération des commandes
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[AVERTISSEMENT] La commande à ${filePath} manque de propriétés "data" ou "execute" requises.`);
    }
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Fonction principale pour le déploiement des commandes
(async () => {
  try {
    console.log(`Début du rafraîchissement de ${commands.length} commandes d'application (/).`);
    
    // IMPORTANT: Si nous avons le CLIENT_ID et le GUILD_ID, nous procédons au nettoyage complet des commandes
    if (process.env.CLIENT_ID && process.env.GUILD_ID) {
      
      // 1. D'abord, supprimer toutes les commandes existantes pour s'assurer qu'il n'y a pas de doublons
      console.log('Suppression de toutes les commandes existantes...');
      
      // Commandes globales
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: [] }
      );
      
      // Commandes de serveur
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: [] }
      );
      
      console.log('Toutes les commandes existantes ont été supprimées.');
      
      // 2. Enregistrer les nouvelles commandes
      console.log('Enregistrement des nouvelles commandes...');
      
      // Utiliser un enregistrement spécifique au serveur
      const data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      
      console.log(`${data.length} commandes ont été enregistrées avec succès.`);
    } else {
      console.error('CLIENT_ID ou GUILD_ID manquant dans les variables d\'environnement. Impossible de déployer les commandes.');
    }
  } catch (error) {
    console.error('Erreur lors du déploiement des commandes:', error);
  }
})(); 