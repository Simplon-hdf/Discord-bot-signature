const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const signatureService = require('../../services/signatureService');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('init-signature')
    .setDescription('Initialise le système de signature pour une promotion'),

  async execute(interaction) {
    try {
      // Répondre immédiatement pour éviter le timeout
      await interaction.deferReply();
      
      // Vérifier le canal d'administration
      const adminChannelId = process.env.ADMIN_CONFIG_CHANNEL_ID;
      const isAdminChannel = interaction.channelId === adminChannelId;
      
      if (!isAdminChannel) {
        return interaction.editReply({
          content: `Cette commande ne peut être utilisée que dans le canal d'administration <#${adminChannelId}>`,
          ephemeral: true
        });
      }

      // Récupération des promotions
      const promotions = await signatureService.getPromotions();
      
      if (!promotions || promotions.length === 0) {
        return interaction.editReply({
          content: 'Aucune promotion disponible pour le moment.',
          ephemeral: true
        });
      }

      // Créer l'embed du message de configuration
      const signatureEmbed = new EmbedBuilder()
        .setTitle('🖋️ Configuration des Signatures')
        .setDescription('Utilisez ce message pour configurer et suivre les signatures pour les promotions.')
        .setColor('#00a8ff')
        .setFooter({ text: 'Bot de Signature v1.0' });

      // Créer le menu de sélection des promotions
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('signature-select-promotion')
        .setPlaceholder('Sélectionnez une promotion')
        .addOptions(
          promotions.map(promo => ({
            label: promo.nom,
            value: promo.uuid,
            description: `Configurer les signatures pour ${promo.nom}`
          }))
        );

      // Créer les boutons d'action
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
      const row1 = new ActionRowBuilder().addComponents(selectMenu);
      const row2 = new ActionRowBuilder().addComponents(createButton, refreshButton);

      // Envoyer le message
      await interaction.editReply({
        embeds: [signatureEmbed],
        components: [row1, row2]
      });

      logger.info(`Message de configuration de signature créé par ${interaction.user.tag}`);
    } catch (error) {
      logger.error(`Erreur lors de la création du message de configuration: ${error.message}`, error);
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: `Une erreur est survenue lors de la création du message de configuration: ${error.message}`,
          ephemeral: true
        }).catch(err => logger.error('Erreur lors de l\'édition de la réponse après erreur:', err));
      } else if (!interaction.replied) {
        await interaction.reply({
          content: `Une erreur est survenue lors de la création du message de configuration: ${error.message}`,
          ephemeral: true
        }).catch(err => logger.error('Erreur lors de la réponse après erreur:', err));
      }
    }
  }
}; 