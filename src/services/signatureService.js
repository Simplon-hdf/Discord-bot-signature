const promotionsFixture = require('../../tests/signPromotionFixture.json');
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
    try {
      logger.info('Tentative de récupération des promotions depuis l\'API');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);
      
      try {
        const response = await fetch(`${this.apiBaseUrl}/signature/promotions`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        logger.info(`${data.promotions.length} promotions récupérées avec succès`);
        return data.promotions;
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('La requête a expiré (timeout)');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      logger.warn(`Impossible d'accéder à l'API: ${error.message}`);
      logger.info('Utilisation des données mockées');
      
      // Fallback sur les données mockées
      return promotionsFixture.promotions;
    }
  }
}

module.exports = new SignatureService(); 