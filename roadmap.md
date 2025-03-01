# Roadmap - Bot Discord Signature

## 1. Intégration API
- [ ] Implémenter la récupération des promotions
  - Tests: Format des données, gestion des erreurs HTTP, mock API
- [ ] Implémenter la récupération des détails d'une promotion
  - Tests: Validation des snowflakes, structure des données, mock API
- [ ] Gérer les erreurs et retries API
  - Tests: Timeout, retry policy, rate limiting

## 2. Interface Discord.js
- [ ] Créer le select menu des promotions
  - Tests: Rendu des options, événements de sélection, timeouts
- [ ] Créer les embeds de messages
  - Tests: Format des embeds, limites Discord, mise en page
- [ ] Implémenter les boutons d'action
  - Tests: États des boutons, handlers d'événements, cooldowns
- [ ] Gérer les permissions des composants
  - Tests: Rôles utilisateurs, permissions Discord, états désactivés

## 3. Système de Signature
- [ ] Implémenter le flux formateur → apprenants
  - Tests: Sélection multiple, validation des rôles, messages
- [ ] Implémenter le flux apprenant → formateur
  - Tests: Sélection unique, validation des rôles, messages
- [ ] Gérer les timers anti-spam
  - Tests: Délais, persistance, reset des timers
- [ ] Gérer les notifications privées
  - Tests: DMs fermés, file d'attente, confirmation

## 4. Gestion des Canaux
- [ ] Implémenter la création des canaux
  - Tests: Permissions Discord, nommage, catégories
- [ ] Configurer les permissions
  - Tests: Hiérarchie des rôles, overwrites, héritage
- [ ] Gérer les états (actif/pause)
  - Tests: Transitions d'états, persistance, concurrence
- [ ] Créer les messages d'accueil
  - Tests: Formatage, mentions, boutons initiaux

## 5. Monitoring
- [ ] Implémenter le système de logs
  - Tests: Format des logs, rotation, niveaux de log
- [ ] Gérer les erreurs Discord et API
  - Tests: Types d'erreurs, recovery, fallbacks
- [ ] Mettre en place les retries
  - Tests: Backoff exponentiel, limites de tentatives
- [ ] Formater les messages d'erreur utilisateur
  - Tests: Clarté des messages, localisation, contexte