const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const signatureService = require('../../services/signatureService');
const logger = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('liste-promos')
    .setDescription('Affiche la liste des promotions disponibles pour les signatures'),
    
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      
      const promotions = await signatureService.getPromotions();
      
      if (!promotions || promotions.length === 0) {
        return interaction.editReply({ 
          content: 'Aucune promotion n\'est disponible actuellement.'
        });
      }
      
      // Création d'un embed pour afficher les informations
      const embed = new EmbedBuilder()
        .setTitle('Liste des promotions disponibles')
        .setDescription('Sélectionnez une promotion pour créer un message de signature')
        .setColor('#3498db')
        .setTimestamp();
      
      // Ajout des promotions dans l'embed
      promotions.forEach(promo => {
        embed.addFields({
          name: promo.nom,
          value: `ID: ${promo.uuid}\nFormateurs: ${promo.formateurs.length}\nApprenants: ${promo.apprenants.length}`
        });
      });
      
      // Création du menu de sélection
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select-promotion')
        .setPlaceholder('Sélectionnez une promotion')
        .addOptions(
          promotions.map(promo => ({
            label: promo.nom,
            description: `${promo.apprenants.length} apprenants, ${promo.formateurs.length} formateurs`,
            value: promo.uuid
          }))
        );
      
      const row = new ActionRowBuilder().addComponents(selectMenu);
      
      await interaction.editReply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
      
      logger.info(`${interaction.user.tag} a affiché la liste des promotions`);
    } catch (error) {
      logger.error(`Erreur lors de l'affichage des promotions: ${error.message}`);
      await interaction.editReply({ 
        content: 'Une erreur est survenue lors de la récupération des promotions. Veuillez réessayer plus tard.',
        ephemeral: true
      });
    }
  }
}; 