const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Gestionnaire de cooldown pour limiter l'utilisation des fonctionnalités
 */
class CooldownManager {
  constructor() {
    // Chemin vers le fichier de stockage des cooldowns
    this.filePath = path.join(__dirname, '../../data/cooldowns.json');
    
    // Map: userId_actionType => timestamp
    this.cooldowns = new Map();
    
    // Durée du cooldown en millisecondes (5 minutes)
    this.cooldownDuration = 5 * 60 * 1000;
    
    // Créer le dossier data s'il n'existe pas
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Charger les cooldowns existants
    this.loadCooldowns();
    
    // Programmer la sauvegarde automatique toutes les 30 secondes
    setInterval(() => this.saveCooldowns(), 30000);
  }

  /**
   * Charger les cooldowns depuis le fichier
   */
  loadCooldowns() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        const cooldownsObj = JSON.parse(data);
        
        // Convertir l'objet en Map
        Object.keys(cooldownsObj).forEach(key => {
          this.cooldowns.set(key, cooldownsObj[key]);
        });
        
        logger.info(`Cooldowns chargés: ${this.cooldowns.size} entrées`);
      } else {
        logger.info('Aucun fichier de cooldown existant trouvé, création d\'un nouveau fichier');
        this.saveCooldowns();
      }
    } catch (error) {
      logger.error(`Erreur lors du chargement des cooldowns: ${error.message}`);
    }
  }

  /**
   * Sauvegarder les cooldowns dans le fichier
   */
  saveCooldowns() {
    try {
      // Nettoyer les cooldowns expirés avant de sauvegarder
      this.cleanupExpiredCooldowns();
      
      // Convertir Map en objet pour la sérialisation JSON
      const cooldownsObj = {};
      this.cooldowns.forEach((value, key) => {
        cooldownsObj[key] = value;
      });
      
      fs.writeFileSync(this.filePath, JSON.stringify(cooldownsObj, null, 2));
      logger.debug(`Cooldowns sauvegardés: ${this.cooldowns.size} entrées`);
    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde des cooldowns: ${error.message}`);
    }
  }

  /**
   * Nettoyer les cooldowns expirés
   */
  cleanupExpiredCooldowns() {
    const now = Date.now();
    const expiredKeys = [];
    
    this.cooldowns.forEach((timestamp, key) => {
      if (now - timestamp >= this.cooldownDuration) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.cooldowns.delete(key));
    if (expiredKeys.length > 0) {
      logger.debug(`${expiredKeys.length} cooldowns expirés ont été supprimés`);
    }
  }

  /**
   * Vérifie si un utilisateur est en cooldown pour une action spécifique
   * @param {string} userId - ID de l'utilisateur Discord
   * @param {string} actionType - Type d'action (ex: 'send-dm-formateur')
   * @returns {boolean} - True si l'utilisateur est en cooldown
   */
  isOnCooldown(userId, actionType) {
    logger.debug(`Vérification du cooldown pour l'utilisateur ${userId} et l'action ${actionType}`);
    const key = `${userId}_${actionType}`;
    const lastUsage = this.cooldowns.get(key);
    
    if (!lastUsage) {
      logger.debug(`Pas de cooldown trouvé pour ${key}`);
      return false;
    }
    
    const now = Date.now();
    const isOnCd = (now - lastUsage) < this.cooldownDuration;
    logger.debug(`Cooldown pour ${key}: ${isOnCd ? 'actif' : 'inactif'}`);
    return isOnCd;
  }

  /**
   * Obtient le temps restant avant la fin du cooldown
   * @param {string} userId - ID de l'utilisateur Discord
   * @param {string} actionType - Type d'action
   * @returns {number} - Temps restant en secondes, 0 si pas de cooldown
   */
  getRemainingCooldown(userId, actionType) {
    const key = `${userId}_${actionType}`;
    const lastUsage = this.cooldowns.get(key);
    
    if (!lastUsage) return 0;
    
    const now = Date.now();
    const elapsed = now - lastUsage;
    
    if (elapsed >= this.cooldownDuration) return 0;
    
    // Convertir en secondes et arrondir
    return Math.ceil((this.cooldownDuration - elapsed) / 1000);
  }

  /**
   * Enregistre l'utilisation d'une action par un utilisateur
   * @param {string} userId - ID de l'utilisateur Discord
   * @param {string} actionType - Type d'action
   */
  setOnCooldown(userId, actionType) {
    const key = `${userId}_${actionType}`;
    this.cooldowns.set(key, Date.now());
    logger.info(`Cooldown défini pour ${userId} (${actionType})`);
    
    // Sauvegarder immédiatement
    this.saveCooldowns();
  }

  /**
   * Formater le temps restant en format lisible
   * @param {number} seconds - Temps en secondes
   * @returns {string} - Temps formaté (ex: "2m 30s")
   */
  formatTimeRemaining(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }
}

// Exporter une instance unique
module.exports = new CooldownManager(); 