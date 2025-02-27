const { Events } = require('discord.js');
const logger = require('../utils/logger');
const signatureService = require('../services/signatureService');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Variable pour stocker l'UUID de la promotion sélectionnée
let selectedPromotionUuid = null;

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      // Gestion des commandes slash
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          logger.warn(`Commande ${interaction.commandName} non trouvée`);
          return;
        }

        try {
          await command.execute(interaction, client);
        } catch (error) {
          logger.error(`Erreur lors de l'exécution de la commande ${interaction.commandName}:`, error);
          
          const replyOptions = {
            content: 'Une erreur est survenue lors de l\'exécution de cette commande.',
            ephemeral: true
          };
          
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyOptions);
          } else {
            await interaction.reply(replyOptions);
          }
        }
      }
      
      // Gestion des sélections dans les menus
      else if (interaction.isStringSelectMenu()) {
        // Menu de sélection de promotion pour la liste des promos
        if (interaction.customId === 'select-promotion') {
          const selectedPromoUuid = interaction.values[0];
          logger.info(`Promotion sélectionnée: ${selectedPromoUuid}`);
          
          await interaction.reply({
            content: `Vous avez sélectionné la promotion avec l'UUID: ${selectedPromoUuid}. Fonctionnalité en cours de développement.`,
            ephemeral: true
          });
        }
        
        // Menu de sélection de promotion pour le message de configuration
        else if (interaction.customId === 'signature-select-promotion') {
          selectedPromotionUuid = interaction.values[0];
          
          // Trouver la promotion sélectionnée
          const promotions = await signatureService.getPromotions();
          const selectedPromo = promotions.find(promo => promo.uuid === selectedPromotionUuid);
          
          if (!selectedPromo) {
            await interaction.reply({
              content: 'Impossible de trouver la promotion sélectionnée.',
              ephemeral: true
            });
            return;
          }
          
          await interaction.reply({
            content: `Vous avez sélectionné la promotion: ${selectedPromo.nom}. Cliquez sur "Créer" pour générer le thread de signature.`,
            ephemeral: true
          });
        }
      }
      
      // Gestion des clics sur les boutons
      else if (interaction.isButton()) {
        // Bouton de création de thread de signature
        if (interaction.customId === 'signature-create-button') {
          if (!selectedPromotionUuid) {
            await interaction.reply({
              content: 'Veuillez d\'abord sélectionner une promotion dans le menu déroulant.',
              ephemeral: true
            });
            return;
          }
          
          // Trouver la promotion sélectionnée
          const promotions = await signatureService.getPromotions();
          const selectedPromo = promotions.find(promo => promo.uuid === selectedPromotionUuid);
          
          if (!selectedPromo) {
            await interaction.reply({
              content: 'Impossible de trouver la promotion sélectionnée.',
              ephemeral: true
            });
            return;
          }
          
          await interaction.deferReply({ ephemeral: true });
          
          // Ici, la logique de création du thread de signature
          // (sera implémentée ultérieurement)
          logger.info(`Création d'un thread de signature pour la promotion: ${selectedPromo.nom}`);
          
          await interaction.editReply({
            content: `La création du thread de signature pour la promotion ${selectedPromo.nom} est en cours de développement.`,
            ephemeral: true
          });
        }
        
        // Bouton de rafraîchissement de la liste des promotions
        else if (interaction.customId === 'signature-refresh-button') {
          await interaction.deferUpdate();
          
          // Récupérer la liste mise à jour des promotions
          const promotions = await signatureService.getPromotions();
          
          if (!promotions || promotions.length === 0) {
            await interaction.followUp({
              content: 'Aucune promotion n\'est disponible actuellement.',
              ephemeral: true
            });
            return;
          }
          
          // Mettre à jour le menu déroulant
          const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('signature-select-promotion')
            .setPlaceholder('Choisir une promotion')
            .addOptions(
              promotions.map(promo => ({
                label: promo.nom,
                description: `${promo.apprenants.length} apprenants, ${promo.formateurs.length} formateurs`,
                value: promo.uuid
              }))
            );
            
          // Recréer les boutons
          const createButton = new ButtonBuilder()
            .setCustomId('signature-create-button')
            .setLabel('Créer')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅');
            
          const refreshButton = new ButtonBuilder()
            .setCustomId('signature-refresh-button')
            .setLabel('Rafraîchir')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔄');
            
          // Assembler les composants
          const selectRow = new ActionRowBuilder().addComponents(selectMenu);
          const buttonRow = new ActionRowBuilder().addComponents(createButton, refreshButton);
          
          // Mettre à jour le message
          await interaction.message.edit({
            components: [selectRow, buttonRow]
          });
          
          await interaction.followUp({
            content: 'La liste des promotions a été rafraîchie.',
            ephemeral: true
          });
          
          logger.info(`${interaction.user.tag} a rafraîchi la liste des promotions`);
        }
      }
    } catch (error) {
      logger.error('Erreur inattendue lors du traitement de l\'interaction:', error);
      
      // Essayer d'informer l'utilisateur de l'erreur
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'Une erreur inattendue est survenue lors du traitement de votre interaction.',
            ephemeral: true
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: 'Une erreur inattendue est survenue lors du traitement de votre interaction.',
            ephemeral: true
          });
        }
      } catch (replyError) {
        logger.error('Impossible de répondre à l\'interaction après une erreur:', replyError);
      }
    }
  },
}; 