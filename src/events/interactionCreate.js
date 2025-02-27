const { Events } = require('discord.js');
const logger = require('../utils/logger');
const signatureService = require('../services/signatureService');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

// Variables pour stocker les sélections
let selectedPromotionUuid = null;
const selectedApprenants = new Map(); // Clé: messageId, Valeur: tableau d'IDs d'apprenants
const selectedFormateurs = new Map(); // Clé: messageId, Valeur: ID du formateur

// Au début du fichier, ajoutons un verrouillage global
const threadCreationLocks = new Map(); // Pour stocker les verrous par promotion

// SOLUTION D'URGENCE POUR ÉVITER LA CRÉATION MULTIPLE DE THREADS
// Variable pour indiquer si un thread est en cours de création, peu importe la promotion
let isCreatingAnyThread = false;

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // Déterminer le type d'interaction immédiatement
    const isCommand = interaction.isChatInputCommand();
    const isButton = interaction.isButton();
    const isSelectMenu = interaction.isStringSelectMenu();
    
    try {
      // Gestion des commandes slash
      if (isCommand) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
          logger.warn(`Commande ${interaction.commandName} non trouvée`);
          return;
        }

        try {
          await command.execute(interaction, client);
        } catch (error) {
          logger.error(`Erreur lors de l'exécution de la commande ${interaction.commandName}:`, error);
          
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: 'Une erreur est survenue lors de l\'exécution de cette commande.',
              ephemeral: true
            }).catch(err => logger.error('Erreur de réponse après échec de commande:', err));
          } else {
            await interaction.followUp({
              content: 'Une erreur est survenue lors de l\'exécution de cette commande.',
              ephemeral: true
            }).catch(err => logger.error('Erreur de followUp après échec de commande:', err));
          }
        }
        return;
      }
      
      // Gestion des menus de sélection
      if (isSelectMenu) {
        // Menu de sélection de promotion pour la liste des promos
        if (interaction.customId === 'select-promotion') {
          const selectedPromoUuid = interaction.values[0];
          logger.info(`Promotion sélectionnée: ${selectedPromoUuid}`);
          
          try {
            await interaction.followUp({
              content: `Vous avez sélectionné la promotion avec l'UUID: ${selectedPromoUuid}.`,
              ephemeral: true
            });
          } catch (error) {
            logger.error(`Erreur lors du followUp pour select-promotion: ${error.message}`);
          }
          return;
        }
        
        // Menu de sélection de promotion pour le message de configuration
        if (interaction.customId === 'signature-select-promotion') {
          selectedPromotionUuid = interaction.values[0];
          
          // Trouver la promotion sélectionnée
          try {
            const promotions = await signatureService.getPromotions();
            const selectedPromo = promotions.find(promo => promo.uuid === selectedPromotionUuid);
            
            if (!selectedPromo) {
              try {
                await interaction.followUp({
                  content: 'Impossible de trouver la promotion sélectionnée.',
                  ephemeral: true
                });
              } catch (error) {
                logger.error(`Erreur lors du followUp pour promotion non trouvée: ${error.message}`);
              }
              return;
            }
            
            if (!selectedPromo.apprenants || !Array.isArray(selectedPromo.apprenants) || selectedPromo.apprenants.length === 0) {
              try {
                await interaction.followUp({
                  content: `La promotion ${selectedPromo.nom} n'a pas d'apprenants définis.`,
                  ephemeral: true
                });
              } catch (error) {
                logger.error(`Erreur lors du followUp pour apprenants manquants: ${error.message}`);
              }
              return;
            }
            
            if (!selectedPromo.formateurs || !Array.isArray(selectedPromo.formateurs) || selectedPromo.formateurs.length === 0) {
              try {
                await interaction.followUp({
                  content: `La promotion ${selectedPromo.nom} n'a pas de formateurs définis.`,
                  ephemeral: true
                });
              } catch (error) {
                logger.error(`Erreur lors du followUp pour formateurs manquants: ${error.message}`);
              }
              return;
            }
            
            try {
              await interaction.followUp({
                content: `Vous avez sélectionné la promotion: ${selectedPromo.nom}. Cliquez sur "Créer" pour générer le thread de signature.`,
                ephemeral: true
              });
            } catch (error) {
              logger.error(`Erreur lors du followUp pour signature-select-promotion: ${error.message}`);
            }
          } catch (error) {
            logger.error('Erreur lors de la récupération des promotions:', error);
            try {
              await interaction.followUp({
                content: 'Une erreur est survenue lors de la récupération des informations de la promotion.',
                ephemeral: true
              });
            } catch (followUpError) {
              logger.error(`Erreur lors du followUp pour erreur de récupération promo: ${followUpError.message}`);
            }
          }
          return;
        }
        
        // Menu pour la sélection des apprenants (pour les formateurs)
        if (interaction.customId === 'select-apprenants') {
          try {
            // Différer la mise à jour immédiatement
            await interaction.deferUpdate();
            
            const selectedApprenantsArray = interaction.values;
            
            // Stocker les apprenants sélectionnés pour ce message
            selectedApprenants.set(interaction.message.id, selectedApprenantsArray);
            
            // Utiliser followUp après deferUpdate
            await interaction.followUp({
              content: `Vous avez sélectionné ${selectedApprenantsArray.length} apprenant(s)`,
              ephemeral: true
            });
          } catch (error) {
            logger.error(`Erreur lors de la gestion de select-apprenants: ${error.message}`);
          }
          return;
        }
        
        // Menu pour la sélection des formateurs (pour les apprenants)
        if (interaction.customId === 'select-formateurs') {
          try {
            // Différer la mise à jour immédiatement
            await interaction.deferUpdate();
            
            const selectedFormateur = interaction.values[0];
            
            // Stocker le formateur sélectionné pour ce message
            selectedFormateurs.set(interaction.message.id, selectedFormateur);
            
            // Utiliser followUp après deferUpdate
            await interaction.followUp({
              content: `Vous avez sélectionné le formateur avec l'ID: ${selectedFormateur}`,
              ephemeral: true
            });
          } catch (error) {
            logger.error(`Erreur lors de la gestion de select-formateurs: ${error.message}`);
          }
          return;
        }
      }
      
      // Gestion des boutons
      if (isButton) {
        // Bouton pour rafraîchir la liste des promotions
        if (interaction.customId === 'signature-refresh-button') {
          try {
            // Récupérer les promotions à jour
            const promotions = await signatureService.getPromotions();
            
            if (!promotions || promotions.length === 0) {
              try {
                await interaction.followUp({
                  content: "Aucune promotion disponible pour le moment.",
                  ephemeral: true
                });
              } catch (error) {
                logger.error(`Erreur lors du followUp pour aucune promotion: ${error.message}`);
              }
              return;
            }
            
            // Mettre à jour le menu de sélection
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
            
            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            
            // Mise à jour du message
            await interaction.message.edit({
              components: [row1, interaction.message.components[1]]
            });
            
            try {
              await interaction.followUp({
                content: "La liste des promotions a été rafraîchie avec succès!",
                ephemeral: true
              });
            } catch (error) {
              logger.error(`Erreur lors du followUp pour rafraîchissement réussi: ${error.message}`);
            }
          } catch (error) {
            logger.error(`Erreur lors du rafraîchissement des promotions: ${error.message}`);
            try {
              await interaction.followUp({
                content: `Erreur lors du rafraîchissement des promotions: ${error.message}`,
                ephemeral: true
              });
            } catch (followUpError) {
              logger.error(`Erreur lors du followUp pour erreur de rafraîchissement: ${followUpError.message}`);
            }
          }
          return;
        }
        
        // Bouton pour rafraîchir la liste des apprenants ou formateurs
        else if (interaction.customId === 'refresh-apprenants-list' || interaction.customId === 'refresh-formateurs-list') {
          try {
            // Extraire le nom de la promotion du titre du message embed
            const embedTitle = interaction.message.embeds[0].title;
            const promoNom = embedTitle.split(':')[1]?.trim();
            
            if (!promoNom) {
              try {
                await interaction.followUp({
                  content: "Impossible de déterminer la promotion à partir du message.",
                  ephemeral: true
                });
              } catch (error) {
                logger.error(`Erreur lors du followUp pour promotion indéterminée: ${error.message}`);
              }
              return;
            }
            
            // Récupérer les données de la promotion
            const promotions = await signatureService.getPromotions();
            const promo = promotions.find(p => p.nom === promoNom);
            
            if (!promo) {
              try {
                await interaction.followUp({
                  content: `Impossible de trouver la promotion "${promoNom}"`,
                  ephemeral: true
                });
              } catch (error) {
                logger.error(`Erreur lors du followUp pour promotion non trouvée: ${error.message}`);
              }
              return;
            }
            
            // Rafraîchir la liste des apprenants
            if (interaction.customId === 'refresh-apprenants-list') {
              // Vérifier que les apprenants existent
              if (!promo.apprenants || !Array.isArray(promo.apprenants) || promo.apprenants.length === 0) {
                try {
                  await interaction.followUp({
                    content: `La promotion ${promo.nom} n'a pas d'apprenants définis.`,
                    ephemeral: true
                  });
                } catch (error) {
                  logger.error(`Erreur lors du followUp pour apprenants manquants: ${error.message}`);
                }
                return;
              }
              
              // Mettre à jour le menu de sélection des apprenants
              const apprenantsSelectMenu = new StringSelectMenuBuilder()
                .setCustomId('select-apprenants')
                .setPlaceholder('Sélectionnez des apprenants')
                .setMinValues(1)
                .setMaxValues(promo.apprenants.length)
                .addOptions(
                  promo.apprenants.map(apprenant => ({
                    label: apprenant.nom,
                    value: apprenant.snowflake,
                    description: `Apprenant de ${promo.nom}`
                  }))
                );
              
              const newSelectRow = new ActionRowBuilder().addComponents(apprenantsSelectMenu);
              
              // Mettre à jour le message
              await interaction.message.edit({
                components: [newSelectRow, interaction.message.components[1]]
              });
              
              try {
                await interaction.followUp({
                  content: "La liste des apprenants a été rafraîchie avec succès!",
                  ephemeral: true
                });
              } catch (error) {
                logger.error(`Erreur lors du followUp pour rafraîchissement des apprenants: ${error.message}`);
              }
            }
            
            // Rafraîchir la liste des formateurs
            else if (interaction.customId === 'refresh-formateurs-list') {
              // Vérifier que les formateurs existent
              if (!promo.formateurs || !Array.isArray(promo.formateurs) || promo.formateurs.length === 0) {
                try {
                  await interaction.followUp({
                    content: `La promotion ${promo.nom} n'a pas de formateurs définis.`,
                    ephemeral: true
                  });
                } catch (error) {
                  logger.error(`Erreur lors du followUp pour formateurs manquants: ${error.message}`);
                }
                return;
              }
              
              // Mettre à jour le menu de sélection des formateurs
              const formateursSelectMenu = new StringSelectMenuBuilder()
                .setCustomId('select-formateurs')
                .setPlaceholder('Sélectionnez un formateur')
                .addOptions([
                  // Ajouter les formateurs
                  ...promo.formateurs.map(formateur => ({
                    label: formateur.nom,
                    value: formateur.snowflake,
                    description: `Formateur de ${promo.nom}`
                  })),
                  // Ajouter les chargés de projet si présents
                  ...(promo.chargesProjet ? promo.chargesProjet.map(cp => ({
                    label: cp.nom,
                    value: cp.snowflake,
                    description: `Chargé de projet pour ${promo.nom}`
                  })) : [])
                ]);
              
              const newSelectRow = new ActionRowBuilder().addComponents(formateursSelectMenu);
              
              // Mettre à jour le message
              await interaction.message.edit({
                components: [newSelectRow, interaction.message.components[1]]
              });
              
              try {
                await interaction.followUp({
                  content: "La liste des formateurs a été rafraîchie avec succès!",
                  ephemeral: true
                });
              } catch (error) {
                logger.error(`Erreur lors du followUp pour rafraîchissement des formateurs: ${error.message}`);
              }
            }
          } catch (error) {
            logger.error(`Erreur lors du rafraîchissement: ${error.message}`);
            try {
              await interaction.followUp({
                content: `Une erreur est survenue lors du rafraîchissement: ${error.message}`,
                ephemeral: true
              });
            } catch (followUpError) {
              logger.error(`Erreur lors du followUp pour erreur de rafraîchissement: ${followUpError.message}`);
            }
          }
          return;
        }
        
        // Bouton pour créer un thread de signature
        if (interaction.customId === 'signature-create-button') {
          // Bloquer immédiatement les interactions multiples
          await interaction.deferReply({ flags: 64 });
          
          try {
            // Vérifier si une promotion est sélectionnée
            if (!selectedPromotionUuid) {
              await interaction.editReply({
                content: 'Veuillez d\'abord sélectionner une promotion dans le menu.',
                flags: 64
              });
              return;
            }
            
            // Récupérer les données de promotion
            const promotions = await signatureService.getPromotions();
            const selectedPromo = promotions.find(promo => promo.uuid === selectedPromotionUuid);
            
            if (!selectedPromo) {
              await interaction.editReply({
                content: 'Impossible de trouver la promotion sélectionnée.',
                flags: 64
              });
              return;
            }
            
            await interaction.editReply({
              content: `Création du thread pour ${selectedPromo.nom} en cours...`,
              flags: 64
            });
            
            // Vérifier le canal de la promotion
            if (!selectedPromo.channel || !selectedPromo.channel.snowflake) {
              await interaction.editReply({
                content: `La promotion ${selectedPromo.nom} n'a pas de canal défini.`,
                flags: 64
              });
              return;
            }
            
            // Récupérer le canal de forum
            const channel = await client.channels.fetch(selectedPromo.channel.snowflake).catch(err => {
              logger.error(`Erreur lors de la récupération du canal: ${err.message}`);
              throw new Error(`Impossible de trouver le canal avec l'ID ${selectedPromo.channel.snowflake}.`);
            });
            
            if (!channel || channel.type !== ChannelType.GuildForum) {
              await interaction.editReply({
                content: `Le canal pour la promotion ${selectedPromo.nom} n'est pas un forum.`,
                flags: 64
              });
              return;
            }
            
            // Vérifier si un thread existe déjà
            const existingThreads = channel.threads.cache.filter(t => 
              t.name.includes(`Signature - ${selectedPromo.nom}`) && !t.archived
            );
            
            if (existingThreads.size > 0) {
              const threadId = existingThreads.first().id;
              await interaction.editReply({
                content: `Un thread existe déjà pour ${selectedPromo.nom}. [Cliquez ici](https://discord.com/channels/${interaction.guildId}/${threadId})`,
                flags: 64
              });
              return;
            }
            
            // Créer le thread
            const thread = await channel.threads.create({
              name: `Signature - ${selectedPromo.nom}`,
              message: {
                content: `Thread de signatures pour ${selectedPromo.nom}`
              }
            });
            
            logger.info(`Thread créé: ${thread.id}`);
            
            // --- PREMIER MESSAGE: FORMATEURS -> APPRENANTS ---
            await interaction.editReply({
              content: `Thread créé, ajout du message pour les formateurs...`,
              flags: 64
            });
            
            // Filtrer les apprenants valides
            const validApprenants = selectedPromo.apprenants.filter(a => a.snowflake && a.nom);
            
            if (validApprenants.length === 0) {
              throw new Error(`La promotion ${selectedPromo.nom} n'a pas d'apprenants valides.`);
            }
            
            // Créer l'embed pour les formateurs
            const formateursEmbed = new EmbedBuilder()
              .setTitle(`Message aux Apprenants: ${selectedPromo.nom}`)
              .setDescription('Sélectionnez les apprenants auxquels envoyer un rappel.')
              .setColor('#3498db');
            
            // Créer le menu de sélection des apprenants
            const apprenantsSelectMenu = new StringSelectMenuBuilder()
              .setCustomId('select-apprenants')
              .setPlaceholder('Sélectionnez des apprenants')
              .setMinValues(1)
              .setMaxValues(validApprenants.length)
              .addOptions(
                validApprenants.map(a => ({
                  label: a.nom,
                  value: a.snowflake,
                  description: `Apprenant de ${selectedPromo.nom}`
                }))
              );
            
            // Créer les boutons d'action
            const formateursButtonRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('send-to-selected-apprenants')
                .setLabel('Envoyer aux sélectionnés')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📩'),
              new ButtonBuilder()
                .setCustomId('send-to-all-apprenants')
                .setLabel('Envoyer à tous')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('📣'),
              new ButtonBuilder()
                .setCustomId('refresh-apprenants-list')
                .setLabel('Rafraîchir')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄')
            );
            
            // Envoyer le message pour les formateurs
            const message1 = await thread.send({
              embeds: [formateursEmbed],
              components: [
                new ActionRowBuilder().addComponents(apprenantsSelectMenu),
                formateursButtonRow
              ]
            });
            
            logger.info(`Premier message créé: ${message1.id}`);
            
            // --- SECOND MESSAGE: APPRENANTS -> FORMATEURS ---
            await interaction.editReply({
              content: `Ajout du message pour les apprenants...`,
              flags: 64
            });
            
            // Créer l'embed pour les apprenants
            const apprenantsEmbed = new EmbedBuilder()
              .setTitle(`Message aux Formateurs: ${selectedPromo.nom}`)
              .setDescription('Sélectionnez un formateur ou le chargé de projet auquel envoyer un rappel.')
              .setColor('#2ecc71');
            
            // Préparer les options pour le menu des formateurs et CDP
            const staffOptions = [];
            
            // Ajouter les formateurs
            if (selectedPromo.formateurs && Array.isArray(selectedPromo.formateurs)) {
              for (const formateur of selectedPromo.formateurs) {
                if (formateur.snowflake && formateur.nom) {
                  staffOptions.push({
                    label: formateur.nom,
                    value: formateur.snowflake,
                    description: `Formateur pour ${selectedPromo.nom}`
                  });
                }
              }
            }
            
            // Ajouter le chargé de projet s'il existe
            if (selectedPromo.chargeDeProjet && selectedPromo.chargeDeProjet.snowflake) {
              staffOptions.push({
                label: selectedPromo.chargeDeProjet.nom,
                value: selectedPromo.chargeDeProjet.snowflake,
                description: `Chargé de projet pour ${selectedPromo.nom}`
              });
            }
            
            // Vérifier qu'il y a au moins une option
            if (staffOptions.length === 0) {
              throw new Error(`Aucun formateur ou chargé de projet valide pour la promotion ${selectedPromo.nom}`);
            }
            
            // Créer le message pour les apprenants
            const message2 = await thread.send({
              embeds: [apprenantsEmbed],
              components: [
                new ActionRowBuilder().addComponents(
                  new StringSelectMenuBuilder()
                    .setCustomId('select-formateurs')
                    .setPlaceholder('Sélectionnez un formateur ou CDP')
                    .addOptions(staffOptions)
                ),
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId('send-to-formateur')
                    .setLabel('Envoyer au formateur')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📩'),
                  new ButtonBuilder()
                    .setCustomId('refresh-formateurs-list')
                    .setLabel('Rafraîchir')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔄')
                )
              ]
            });
            
            logger.info(`Second message créé: ${message2.id}`);
            
            // Notification finale
            await interaction.editReply({
              content: `✅ Thread de signature créé avec succès pour ${selectedPromo.nom}! [Cliquez ici](https://discord.com/channels/${interaction.guildId}/${thread.id})`,
              flags: 64
            });
          } catch (error) {
            logger.error(`Erreur lors de la création du thread: ${error.message}`);
            await interaction.editReply({
              content: `Une erreur est survenue: ${error.message}`,
              flags: 64
            });
          }
        }
        
        // Bouton pour envoyer un message aux apprenants sélectionnés
        else if (interaction.customId === 'send-to-selected-apprenants') {
          try {
            // Différer la mise à jour et non la réponse
            await interaction.deferUpdate();
            
            // Puis utiliser followUp pour toutes les réponses
            const selectedApprenantsArray = selectedApprenants.get(interaction.message.id) || [];
            
            if (selectedApprenantsArray.length === 0) {
              await interaction.followUp({
                content: 'Veuillez d\'abord sélectionner au moins un apprenant.',
                ephemeral: true
              });
              return;
            }
            
            // Récupérer la promotion à partir du titre du message
            const embedTitle = interaction.message.embeds[0].title;
            const promoNom = embedTitle.split(':')[1].trim();
            
            // Envoyer le message à chaque apprenant sélectionné
            let successCount = 0;
            let errorCount = 0;
            let errorMessages = [];
            let userErrors = []; // Pour stocker les utilisateurs en échec
            let userIds = []; // Pour stocker les IDs des utilisateurs en échec pour les mentions
            
            logger.info(`Tentative d'envoi de messages à ${selectedApprenantsArray.length} apprenant(s)`);
            
            // Message de départ dans le thread
            await interaction.channel.send({
              content: `🔄 ${interaction.user.username} envoie des rappels à ${selectedApprenantsArray.length} apprenant(s)...`
            });
            
            for (const apprenantId of selectedApprenantsArray) {
              try {
                // Essayer de convertir le snowflake en une chaîne si c'est un nombre
                const userId = apprenantId.toString();
                
                // Récupérer l'utilisateur
                const user = await client.users.fetch(userId).catch(err => {
                  logger.error(`Impossible de récupérer l'utilisateur ${userId}: ${err.message}`);
                  throw new Error(`Utilisateur non trouvé avec l'ID ${userId}`);
                });
                
                logger.info(`Tentative d'envoi d'un message à ${user.tag} (${userId})`);
                
                // Essayer d'envoyer le message privé
                try {
                  await user.send({
                    content: `**Rappel de signature** 📝\n\n${interaction.user.username} vous rappelle de vérifier votre signature pour la promotion ${promoNom}.`,
                  });
                  
                  logger.info(`Message envoyé avec succès à ${user.tag}`);
                  successCount++;
                } catch (dmError) {
                  logger.error(`Erreur lors de l'envoi du message à ${user.tag}: ${dmError.message}`);
                  errorCount++;
                  errorMessages.push(`- ${user.tag}: ${dmError.message}`);
                  userErrors.push(user.tag);
                  userIds.push(userId); // Stocker l'ID pour la mention @
                  
                  // Notification immédiate pour chaque échec
                  let errorReason = dmError.message;
                  if (dmError.message.includes('Cannot send messages to this user')) {
                    errorReason = "A désactivé les messages privés venant du serveur";
                  }
                  
                  // Envoyer un message dans le thread pour cet échec spécifique
                  await interaction.channel.send({
                    content: `⚠️ **Échec** : Impossible d'envoyer un message à <@${userId}>\n> Raison : ${errorReason}`
                  });
                }
                
                // Petite pause entre chaque envoi pour éviter le rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));
                
              } catch (error) {
                logger.error(`Erreur avec l'utilisateur ${apprenantId}: ${error.message}`);
                errorCount++;
                errorMessages.push(`- ID ${apprenantId}: ${error.message}`);
                
                // Notification immédiate pour chaque échec d'identification
                await interaction.channel.send({
                  content: `⚠️ **Échec** : Impossible de trouver l'utilisateur avec l'ID **${apprenantId}**\n> Raison : ${error.message}`
                });
              }
            }
            
            // Message de résultat pour l'utilisateur (privé)
            let resultMessage = `✅ Message envoyé avec succès à ${successCount} apprenant(s).`;
            if (errorCount > 0) {
              resultMessage += `\n\n⚠️ Impossible d'envoyer le message à ${errorCount} apprenant(s):`;
              resultMessage += `\n${errorMessages.join('\n')}`;
              resultMessage += `\n\nRaisons possibles:`;
              resultMessage += `\n- L'utilisateur a désactivé les messages privés venant du serveur`;
              resultMessage += `\n- L'ID Discord (snowflake) n'est pas valide`;
              resultMessage += `\n- Le bot n'a pas les permissions nécessaires`;
            }
            
            await interaction.followUp({
              content: resultMessage,
              ephemeral: true
            });
            
            // Message de résumé final dans le thread - VERSION SIMPLIFIÉE AVEC MENTIONS
            let summaryContent = `📊 **Récapitulatif des rappels** par ${interaction.user.username} pour **${promoNom}**\n`;
            summaryContent += `✅ **Réussis :** ${successCount} | `;
            summaryContent += `❌ **Échecs :** ${errorCount}\n`;
            
            if (errorCount > 0) {
              summaryContent += `⚠️ **Utilisateurs n'ayant pas reçu le message :** `;
              summaryContent += userIds.map(id => `<@${id}>`).join(' ');
            }
            
            // Un seul message final
            await interaction.channel.send({
              content: summaryContent
            });
          } catch (error) {
            logger.error(`Erreur lors de l'envoi des messages: ${error}`);
            await interaction.followUp({
              content: `Une erreur est survenue lors de l'envoi des messages: ${error.message}`,
              ephemeral: true
            }).catch(err => logger.error('Erreur de followup après erreur:', err));
          }
        }
        
        // Bouton pour envoyer un message à tous les apprenants
        else if (interaction.customId === 'send-to-all-apprenants') {
          await interaction.deferReply({ flags: 64 });
          
          try {
            // Récupérer la promotion à partir du titre du message
            const embedTitle = interaction.message.embeds[0].title;
            const promoNom = embedTitle.split(':')[1].trim();
            
            const promotions = await signatureService.getPromotions();
            const promo = promotions.find(p => p.nom === promoNom);
            
            if (!promo) {
              await interaction.editReply({
                content: `Impossible de trouver la promotion "${promoNom}"`,
                flags: 64
              });
              return;
            }
            
            // Envoyer le message à tous les apprenants
            let successCount = 0;
            let errorCount = 0;
            
            for (const apprenant of promo.apprenants) {
              try {
                const user = await client.users.fetch(apprenant.snowflake);
                
                logger.info(`Tentative d'envoi d'un message à ${user.tag} (${apprenant.snowflake})`);
                
                await user.send({
                  content: `**Rappel de signature** 📝\n\n${interaction.user.username} vous rappelle de vérifier votre signature pour la promotion ${promoNom}.`,
                  components: []
                })
                .then(() => {
                  logger.info(`Message envoyé avec succès à ${user.tag}`);
                  successCount++;
                })
                .catch(err => {
                  logger.error(`Erreur lors de l'envoi du message à ${user.tag}: ${err.message}`);
                  // Vérifier si c'est un problème de messages privés désactivés
                  if (err.message.includes('Cannot send messages to this user')) {
                    throw new Error(`${user.tag} a désactivé les messages privés venant des membres du serveur.`);
                  } else {
                    throw err;
                  }
                });
              } catch (error) {
                logger.error(`Impossible d'envoyer un message à l'utilisateur ${apprenant.nom} (${apprenant.snowflake}): ${error.message}`);
                errorCount++;
              }
            }
            
            await interaction.editReply({
              content: `✅ Message envoyé avec succès à ${successCount} apprenant(s)${errorCount > 0 ? `\n⚠️ Impossible d'envoyer le message à ${errorCount} apprenant(s)` : ''}`,
              flags: 64
            });
            
            // Enregistrer l'action dans le thread
            await interaction.channel.send({
              content: `📤 ${interaction.user.username} a envoyé un rappel à tous les apprenants (${successCount} réussi, ${errorCount} échec).`
            });
            
          } catch (error) {
            logger.error(`Erreur lors de l'envoi des messages: ${error.message}`);
            await interaction.editReply({
              content: `Une erreur est survenue lors de l'envoi des messages: ${error.message}`,
              flags: 64
            });
          }
        }
        
        // Bouton pour envoyer un message au formateur sélectionné
        else if (interaction.customId === 'send-to-formateur') {
          try {
            // Différer la mise à jour immédiatement
            await interaction.deferUpdate();
            
            // Récupérer le formateur sélectionné
            const selectedFormateur = selectedFormateurs.get(interaction.message.id);
            
            if (!selectedFormateur) {
              await interaction.followUp({
                content: 'Veuillez d\'abord sélectionner un formateur.',
                ephemeral: true
              });
              return;
            }
            
            // Récupérer la promotion à partir du titre du message
            const embedTitle = interaction.message.embeds[0].title;
            const promoNom = embedTitle.split(':')[1].trim();
            
            try {
              // Récupérer l'utilisateur
              const userId = selectedFormateur.toString();
              const user = await client.users.fetch(userId).catch(err => {
                logger.error(`Impossible de récupérer l'utilisateur ${userId}: ${err.message}`);
                throw new Error(`Utilisateur non trouvé avec l'ID ${userId}`);
              });
              
              logger.info(`Tentative d'envoi d'un message à ${user.tag} (${userId})`);
              
              // Trouver le lien vers le canal de signature de la promotion
              const promotions = await signatureService.getPromotions();
              const promo = promotions.find(p => p.nom === promoNom);
              
              let signatureLink = '';
              if (promo && promo.channel && promo.channel.snowflake) {
                signatureLink = `\n\nVous pouvez accéder au forum de signature ici: https://discord.com/channels/${interaction.guildId}/${promo.channel.snowflake}`;
              }
              
              // Essayer d'envoyer le message privé
              try {
                await user.send({
                  content: `**Rappel de signature** 📝\n\n${interaction.user.username} vous rappelle d'autoriser la signature pour la promotion ${promoNom}.${signatureLink}`
                });
                
                logger.info(`Message envoyé avec succès à ${user.tag}`);
                
                // Notifier l'utilisateur du succès
                await interaction.followUp({
                  content: `✅ Message envoyé avec succès au formateur ${user.tag}`,
                  ephemeral: true
                });
                
                // Enregistrer l'action dans le thread
                await interaction.channel.send({
                  content: `📤 ${interaction.user.username} a envoyé un rappel au formateur <@${userId}>.`
                });
              } catch (dmError) {
                logger.error(`Erreur lors de l'envoi du message à ${user.tag}: ${dmError.message}`);
                
                // Déterminer la raison de l'échec
                let errorReason = dmError.message;
                if (dmError.message.includes('Cannot send messages to this user')) {
                  errorReason = "A désactivé les messages privés venant du serveur";
                }
                
                // Notifier l'utilisateur de l'échec
                await interaction.followUp({
                  content: `❌ Impossible d'envoyer un message au formateur ${user.tag}: ${errorReason}`,
                  ephemeral: true
                });
                
                // Enregistrer l'échec dans le thread
                await interaction.channel.send({
                  content: `⚠️ **Échec** : Impossible d'envoyer un message à <@${userId}>\n> Raison : ${errorReason}`
                });
              }
            } catch (error) {
              logger.error(`Erreur avec l'utilisateur formateur ${selectedFormateur}: ${error.message}`);
              
              await interaction.followUp({
                content: `❌ Erreur: ${error.message}`,
                ephemeral: true
              });
              
              // Notification d'échec dans le thread
              await interaction.channel.send({
                content: `⚠️ **Échec** : Impossible de trouver le formateur avec l'ID **${selectedFormateur}**\n> Raison : ${error.message}`
              });
            }
          } catch (error) {
            logger.error(`Erreur lors de l'envoi du message au formateur: ${error}`);
            await interaction.followUp({
              content: `Une erreur est survenue lors de l'envoi du message: ${error.message}`,
              ephemeral: true
            }).catch(err => logger.error('Erreur de followup après erreur:', err));
          }
        }
      }
    } catch (error) {
      logger.error('Erreur inattendue lors du traitement de l\'interaction:', error);
      
      try {
        await interaction.followUp({
          content: 'Une erreur inattendue est survenue lors du traitement de votre interaction.',
          ephemeral: true
        }).catch(err => logger.error('Erreur lors du followUp final pour erreur générale:', err));
      } catch (replyError) {
        logger.error('Impossible de répondre à l\'interaction après une erreur:', replyError);
      }
    }
  },
}; 