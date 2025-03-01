# Product Backlog - Bot Discord Signature

## Epic 1: Récupération des Données
### User Stories
- [ ] En tant que bot Discord, je veux pouvoir récupérer la liste des promotions
  - Critères: 
    - Format adapté pour Discord.js select menu
    - Données minimales (UUID + nom)
    - Gestion des erreurs API
    - Retry en cas d'échec

- [ ] En tant que bot Discord, je veux pouvoir récupérer les détails d'une promotion
  - Critères:
    - Données pour le canal signature
      - Snowflakes Discord (CDP, formateurs, apprenants)
      - Noms des participants
      - UUID du forum
    - Gestion des erreurs API
    - Retry en cas d'échec

## Epic 2: Interface de Signature
### User Stories
- [ ] En tant que bot Discord, je veux pouvoir créer l'interface de sélection de promotion
  - Critères: 
    - Select menu Discord.js
    - Message embed avec instructions
    - Gestion des timeouts
    - Feedback utilisateur

- [ ] En tant que bot Discord, je veux pouvoir créer l'interface de signature
  - Critères:
    - Boutons d'action Discord.js
    - Message embed avec statuts
    - Gestion des permissions par rôle
    - Feedback visuel des actions

## Epic 3: Gestion des Interactions
### User Stories
- [ ] En tant que formateur, je veux pouvoir demander des signatures
  - Critères:
    - Select menu pour choisir les apprenants
    - Timer anti-spam (5 minutes)
    - Message privé aux apprenants
    - Feedback dans le canal

- [ ] En tant qu'apprenant, je veux pouvoir demander une signature
  - Critères:
    - Select menu pour choisir le formateur
    - Timer anti-spam (5 minutes)
    - Message privé au formateur
    - Feedback dans le canal

## Epic 4: Gestion des Canaux
### User Stories
- [ ] En tant que bot Discord, je veux pouvoir créer un canal de signature
  - Critères:
    - Création du canal avec permissions
    - Message d'accueil avec instructions
    - Interface de signature initialisée
    - Gestion des erreurs Discord

- [ ] En tant que bot Discord, je veux pouvoir gérer l'état du canal
  - Critères:
    - Toggle actif/pause
    - Mise à jour des messages
    - Gestion des permissions
    - Feedback des changements

## Epic 5: Logging et Monitoring
### User Stories
- [ ] En tant que bot Discord, je veux pouvoir logger les interactions
  - Critères:
    - Log des demandes de signature
    - Log des créations de canaux
    - Log des changements d'état
    - Format standardisé

- [ ] En tant que bot Discord, je veux pouvoir gérer les erreurs
  - Critères:
    - Capture des erreurs Discord
    - Capture des erreurs API
    - Messages d'erreur utilisateur
    - Log des erreurs techniques 