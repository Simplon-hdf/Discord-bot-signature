const { Events } = require('discord.js');
const logger = require('../utils/logger');
const signatureService = require('../services/signatureService');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

// Variables pour stocker les sélections
let selectedPromotionUuid = null;
const selectedApprenants = new Map(); // Clé: messageId, Valeur: tableau d'IDs d'apprenants
const selectedFormateurs = new Map(); // Clé: messageId, Valeur: ID du formateur

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
        
        // Bouton de création de thread de signature
        if (interaction.customId === 'signature-create-button') {
          if (!selectedPromotionUuid) {
            await interaction.followUp({
              content: 'Veuillez d\'abord sélectionner une promotion dans le menu déroulant.',
              flags: 64 // ephemeral
            }).catch(err => logger.error('Erreur lors du followUp pour signature-create-button sans promo:', err));
            return;
          }
          
          try {
            const promotions = await signatureService.getPromotions();
            const selectedPromo = promotions.find(promo => promo.uuid === selectedPromotionUuid);
            
            if (!selectedPromo) {
              await interaction.followUp({
                content: 'Impossible de trouver la promotion sélectionnée.',
                flags: 64 // ephemeral
              }).catch(err => logger.error('Erreur lors du followUp pour promotion non trouvée:', err));
              return;
            }
            
            // Récupérer le canal de forum de la promotion
            let channel;
            try {
              channel = await client.channels.fetch(selectedPromo.channel.snowflake);
            } catch (error) {
              logger.error(`Impossible de trouver le canal avec l'ID ${selectedPromo.channel.snowflake}: ${error.message}`);
              await interaction.followUp({
                content: `Impossible de trouver le canal de la promotion. Vérifiez que l'ID ${selectedPromo.channel.snowflake} est correct.`,
                flags: 64 // ephemeral
              }).catch(err => logger.error('Erreur lors du followUp pour canal non trouvé:', err));
              return;
            }
            
            // Vérifier si c'est un forum
            if (channel.type !== ChannelType.GuildForum) {
              await interaction.followUp({
                content: `Le canal ${channel.name} n'est pas un canal de forum.`,
                flags: 64 // ephemeral
              }).catch(err => logger.error('Erreur lors du followUp pour canal non forum:', err));
              return;
            }
            
            // Message initial pour le thread
            const threadStarterMessage = {
              content: `**Préparation de la signature pour ${selectedPromo.nom}**`,
              embeds: [
                new EmbedBuilder()
                  .setTitle(`🖋️ Thread de Signature - ${selectedPromo.nom}`)
                  .setDescription(`Ce thread a été créé par ${interaction.user.username} pour gérer les signatures de la promotion ${selectedPromo.nom}.`)
                  .setColor('#00a8ff')
                  .setTimestamp()
              ]
            };
            
            // Créer le thread
            const thread = await channel.threads.create({
              name: `Signature - ${selectedPromo.nom}`,
              message: threadStarterMessage, // Message initial obligatoire
              reason: `Création d'un thread de signature pour la promotion ${selectedPromo.nom} par ${interaction.user.tag}`
            });
            
            logger.info(`Thread de signature créé: ${thread.name} (${thread.id})`);
            
            // Créer le message pour les formateurs
            const formateursEmbed = new EmbedBuilder()
              .setTitle(`👨‍🏫 Formateurs → Apprenants: ${selectedPromo.nom}`)
              .setDescription('Utilisez ce message pour envoyer un rappel aux apprenants concernant leurs signatures.')
              .setColor('#27ae60')
              .setFooter({ text: 'Sélectionnez des apprenants puis cliquez sur le bouton pour envoyer un rappel' });
            
            // Créer le menu de sélection des apprenants
            const apprenantsSelectMenu = new StringSelectMenuBuilder()
              .setCustomId('select-apprenants')
              .setPlaceholder('Sélectionnez des apprenants')
              .setMinValues(1)
              .setMaxValues(selectedPromo.apprenants.length)
              .addOptions(
                selectedPromo.apprenants.map(apprenant => ({
                  label: apprenant.nom,
                  value: apprenant.snowflake,
                  description: `Apprenant de ${selectedPromo.nom}`
                }))
              );
            
            // Créer les boutons pour les formateurs
            const sendToSelectedButton = new ButtonBuilder()
              .setCustomId('send-to-selected-apprenants')
              .setLabel('Envoyer aux sélectionnés')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📩');
            
            const sendToAllButton = new ButtonBuilder()
              .setCustomId('send-to-all-apprenants')
              .setLabel('Envoyer à tous')
              .setStyle(ButtonStyle.Success)
              .setEmoji('📬');
            
            const refreshApprenantsButton = new ButtonBuilder()
              .setCustomId('refresh-apprenants-list')
              .setLabel('Rafraîchir')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('🔄');
            
            // Assembler les composants pour les formateurs
            const apprenantsSelectRow = new ActionRowBuilder().addComponents(apprenantsSelectMenu);
            const formateursButtonRow = new ActionRowBuilder().addComponents(
              sendToSelectedButton, 
              sendToAllButton, 
              refreshApprenantsButton
            );
            
            await thread.send({
              embeds: [formateursEmbed],
              components: [apprenantsSelectRow, formateursButtonRow]
            });
            
            // Créer et envoyer le message pour les apprenants
            const apprenantsEmbed = new EmbedBuilder()
              .setTitle(`👨‍🎓 Apprenants → Formateurs: ${selectedPromo.nom}`)
              .setDescription('Utilisez ce message pour envoyer un rappel à un formateur concernant votre signature.')
              .setColor('#e74c3c')
              .setFooter({ text: 'Sélectionnez un formateur puis cliquez sur le bouton pour envoyer un rappel' });
            
            // Créer le menu de sélection des formateurs
            const formateursSelectMenu = new StringSelectMenuBuilder()
              .setCustomId('select-formateurs')
              .setPlaceholder('Sélectionnez un formateur')
              .addOptions([
                // Ajouter les formateurs
                ...selectedPromo.formateurs.map(formateur => ({
                  label: formateur.nom,
                  value: formateur.snowflake,
                  description: `Formateur de ${selectedPromo.nom}`
                })),
                // Ajouter les chargés de projet
                ...selectedPromo.chargesProjet.map(cp => ({
                  label: cp.nom,
                  value: cp.snowflake,
                  description: `Chargé de projet pour ${selectedPromo.nom}`
                }))
              ]);
            
            // Créer les boutons pour les apprenants
            const sendToFormateurButton = new ButtonBuilder()
              .setCustomId('send-to-formateur')
              .setLabel('Envoyer au formateur')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📩');
            
            const refreshFormateursButton = new ButtonBuilder()
              .setCustomId('refresh-formateurs-list')
              .setLabel('Rafraîchir')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('🔄');
            
            // Assembler les composants pour les apprenants
            const formateursSelectRow = new ActionRowBuilder().addComponents(formateursSelectMenu);
            const apprenantsButtonRow = new ActionRowBuilder().addComponents(
              sendToFormateurButton,
              refreshFormateursButton
            );
            
            await thread.send({
              embeds: [apprenantsEmbed],
              components: [formateursSelectRow, apprenantsButtonRow]
            });
            
            await interaction.followUp({
              content: `✅ Le thread de signature pour ${selectedPromo.nom} a été créé avec succès! [Cliquez ici pour y accéder](https://discord.com/channels/${interaction.guildId}/${thread.id})`,
              ephemeral: true
            }).catch(err => logger.error('Erreur lors du followUp pour création de thread réussie:', err));
            
            logger.info(`Thread de signature créé par ${interaction.user.tag} pour la promotion ${selectedPromo.nom}`);
          } catch (error) {
            logger.error(`Erreur lors de la création du thread de signature: ${error.message}`, error);
            await interaction.followUp({
              content: `Une erreur est survenue lors de la création du thread de signature: ${error.message}`,
              ephemeral: true
            }).catch(err => logger.error('Erreur lors du followUp pour erreur de création de thread:', err));
          }
          return;
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
          // On utilise le followUp au lieu de deferReply/editReply pour éviter les conflits
          const selectedFormateur = selectedFormateurs.get(interaction.message.id);
          
          if (!selectedFormateur) {
            await interaction.followUp({
              content: 'Veuillez d\'abord sélectionner un formateur.',
              flags: 64
            }).catch(err => logger.error('Erreur lors du followUp pour formateur non sélectionné:', err));
            return;
          }
          
          try {
            // Tenter de récupérer l'utilisateur
            const user = await client.users.fetch(selectedFormateur).catch(error => {
              logger.error(`Erreur lors de la récupération de l'utilisateur ${selectedFormateur}: ${error.message}`);
              throw new Error(`Impossible de trouver l'utilisateur avec l'ID ${selectedFormateur}.`);
            });
            
            logger.info(`Tentative d'envoi d'un message à ${user.tag} (${selectedFormateur})`);
            
            // Essayer d'envoyer le message
            await user.send({
              content: `**Rappel de signature** 📝\n\n${interaction.user.username} vous rappelle d'autoriser la signature.`
            }).catch(error => {
              logger.error(`Erreur lors de l'envoi du message à ${user.tag}: ${error.message}`);
              if (error.message.includes('Cannot send messages to this user')) {
                throw new Error(`${user.tag} a désactivé les messages privés venant des membres du serveur.`);
              } else {
                throw error;
              }
            });
            
            // Si on arrive ici, c'est que l'envoi a réussi
            logger.info(`Message envoyé avec succès à ${user.tag}`);
            
            // Notifier l'utilisateur du succès
            await interaction.followUp({
              content: `✅ Message envoyé avec succès au formateur ${user.tag}`,
              flags: 64
            }).catch(err => logger.error('Erreur lors du followUp pour succès:', err));
            
            // Enregistrer l'action dans le thread
            await interaction.channel.send({
              content: `📤 ${interaction.user.username} a envoyé un rappel au formateur ${user.tag}.`
            }).catch(err => logger.error('Erreur lors de l\'envoi du message dans le canal:', err));
          } catch (error) {
            // Gérer les erreurs
            logger.error(`Impossible d'envoyer un message au formateur: ${error.message}`);
            
            await interaction.followUp({
              content: `❌ Erreur: ${error.message}`,
              flags: 64
            }).catch(err => logger.error('Erreur lors du followUp pour erreur:', err));
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