const logger = require('../utils/logger');

/**
 * Service pour interagir avec l'API de signature
 */
class SignatureService {
  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    this.apiTimeout = 5000; // timeout de 5 secondes
  }

  /**
   * Récupère la liste des promotions depuis l'API
   * @returns {Promise<Array>} Les promotions disponibles
   */
  async getPromotions() {
    logger.info('Récupération des promotions depuis l\'API');
    
    // Utiliser une promesse pour gérer le timeout correctement
    return new Promise(async (resolve, reject) => {
      // Configurer un timeout
      const timeoutId = setTimeout(() => {
        reject(new Error('La requête API a expiré après 5 secondes'));
      }, this.apiTimeout);
      
      try {
        // Exécuter la requête API
        const response = await fetch(`${this.apiBaseUrl}/signature/promotions`);
        
        // Annuler le timeout
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`L'API a retourné une erreur: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log("RÉPONSE API BRUTE:", JSON.stringify(responseData));
        logger.info(`Données reçues de l'API: ${JSON.stringify(responseData)}`);
        
        // Vérifier la structure de la réponse et extraire les promotions
        if (!responseData || !responseData.data || !responseData.data.promotions || !Array.isArray(responseData.data.promotions)) {
          throw new Error('Format de réponse API incorrect. La réponse doit contenir data.promotions[]');
        }
        
        const promotions = responseData.data.promotions;
        logger.info(`${promotions.length} promotions récupérées avec succès`);
        resolve(promotions);
      } catch (error) {
        // Annuler le timeout en cas d'erreur
        clearTimeout(timeoutId);
        
        logger.error(`Erreur lors de la récupération des promotions: ${error.message}`);
        // Résoudre avec un tableau vide au lieu de rejeter la promesse
        resolve([]);
      }
    });
  }
}

module.exports = new SignatureService(); 