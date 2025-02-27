const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const signatureService = require('../../services/signatureService');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('init-signature')
    .setDescription('Initialise le message de création de threads de signature')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });
      
      // Récupérer le canal d'administration depuis les variables d'environnement
      const adminChannelId = process.env.ADMIN_CONFIG_CHANNEL_ID;
      
      if (!adminChannelId) {
        return interaction.editReply({
          content: 'La variable d\'environnement ADMIN_CONFIG_CHANNEL_ID n\'est pas définie.',
          ephemeral: true
        });
      }
      
      const adminChannel = await client.channels.fetch(adminChannelId).catch(() => null);
      
      if (!adminChannel) {
        return interaction.editReply({
          content: `Impossible de trouver le canal d'administration avec l'ID ${adminChannelId}.`,
          ephemeral: true
        });
      }
      
      // Récupérer la liste des promotions
      const promotions = await signatureService.getPromotions();
      
      if (!promotions || promotions.length === 0) {
        return interaction.editReply({
          content: 'Aucune promotion n\'est disponible actuellement.',
          ephemeral: true
        });
      }
      
      // Créer l'embed pour le message
      const embed = new EmbedBuilder()
        .setTitle('🔔 Création de thread de signature')
        .setDescription('Utilisez ce message pour créer un thread de signature pour une promotion.')
        .setColor('#3498db')
        .addFields(
          { name: 'Instructions', value: '1. Sélectionnez une promotion dans le menu déroulant.\n2. Cliquez sur "Créer" pour générer le thread de signature.\n3. Si la liste des promotions a changé, utilisez "Rafraîchir".' }
        )
        .setFooter({ text: 'Bot de signature - v1.0' })
        .setTimestamp();
        
      // Créer le menu de sélection des promotions
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
        
      // Créer les boutons
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
      
      // Envoyer le message dans le canal d'administration
      await adminChannel.send({
        embeds: [embed],
        components: [selectRow, buttonRow]
      });
      
      // Informer l'utilisateur que le message a été créé
      await interaction.editReply({
        content: `Le message de configuration des signatures a été créé dans le canal <#${adminChannelId}>.`,
        ephemeral: true
      });
      
      logger.info(`${interaction.user.tag} a créé un message de configuration des signatures dans le canal ${adminChannel.name}`);
    } catch (error) {
      logger.error(`Erreur lors de la création du message de configuration: ${error.message}`);
      await interaction.editReply({
        content: 'Une erreur est survenue lors de la création du message de configuration.',
        ephemeral: true
      });
    }
  }
}; 