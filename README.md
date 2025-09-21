# 🏥 Pause Magique - Système de Gestion des Congés Hospitalier

## 📋 Description

**Pause Magique** est une application web complète de gestion des congés et plannings pour un hôpital, développée avec React, TypeScript, et Supabase. L'application propose un système de rôles avancé avec des tableaux de bord spécialisés pour les administrateurs, responsables de service, et agents.

## ✨ Fonctionnalités Principales

### 🔐 Système d'Authentification
- **3 niveaux de rôles** : Admin, Responsable de Service, Agent
- **Connexion sécurisée** avec gestion des sessions
- **Redirection automatique** selon le rôle utilisateur

### 👨‍💼 Dashboard Administrateur
- **Gestion complète des utilisateurs** (création, modification, suppression)
- **Statistiques en temps réel** depuis Supabase
- **Gestion des services** (Médecine, Administration)
- **Migration des données** et diagnostic avancé
- **Calcul automatique des RTT** selon les heures hebdomadaires

### 👩‍⚕️ Dashboard Responsable de Service
- **Gestion de l'équipe** avec vue d'ensemble des agents
- **Validation des demandes de congés** (approbation/refus)
- **Planning hebdomadaire** pour chaque agent (Lundi-Samedi)
- **Calendrier mensuel** de visualisation des congés
- **Statistiques d'équipe** et taux d'approbation

### 👤 Dashboard Agent
- **Profil personnel** avec informations détaillées
- **Demandes de congés** (création, suivi, historique)
- **Planning personnel** affiché par le responsable
- **Calcul automatique des droits** (CA, RTT, Formation)
- **Navigation temporelle** (semaines précédentes/suivantes)

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** avec TypeScript
- **Vite** pour le build et le développement
- **Tailwind CSS** pour le styling
- **Shadcn/ui** pour les composants
- **React Router** pour la navigation
- **Lucide React** pour les icônes

### Backend
- **Supabase** (PostgreSQL + API REST)
- **Row Level Security (RLS)** pour la sécurité
- **Edge Functions** pour la logique métier
- **Authentification Supabase**

### Outils de Développement
- **ESLint** pour la qualité du code
- **TypeScript** pour le typage
- **PostCSS** pour le CSS
- **Git** pour le versioning

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Compte Supabase

### Installation
```bash
# Cloner le repository
git clone https://github.com/votre-username/pause-magique.git
cd pause-magique

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase
```

### Configuration Supabase
1. Créer un projet Supabase
2. Configurer la base de données avec les migrations
3. Activer l'authentification
4. Configurer les politiques RLS
5. Déployer les Edge Functions

### Démarrage
```bash
# Mode développement
npm run dev

# Build de production
npm run build

# Preview de production
npm run preview
```

## 📊 Structure de l'Application

```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI de base
│   ├── UserManagementSupabase.tsx
│   ├── MigrationPanel.tsx
│   ├── DeepDiagnostic.tsx
│   └── WeeklySchedule.tsx
├── pages/              # Pages principales
│   ├── NewLoginPage.tsx
│   ├── AdminDashboard.tsx
│   ├── WorkingManagerDashboard.tsx
│   ├── NewAgentDashboard.tsx
│   └── AgentProfile.tsx
├── utils/              # Utilitaires
└── App.tsx            # Point d'entrée
```

## 🔑 Logins de Test

### Administrateur
- **Username** : `admin`
- **Password** : `password`
- **Accès** : Gestion complète du système

### Responsable de Service
- **Username** : `resp.medecine`
- **Password** : `password`
- **Accès** : Gestion de l'équipe Médecine

### Agents
- **Username** : `agent1` ou `agent3`
- **Password** : `password`
- **Profil** : Nat Danede (Employé)

- **Username** : `agent2`
- **Password** : `password`
- **Profil** : Antoine Rousseau (Médecin)

## 📈 Fonctionnalités Avancées

### Calcul Automatique des RTT
- **38h/semaine** → 18 jours RTT
- **36h/semaine** → 6 jours RTT
- **35h/semaine** → 0 jour RTT

### Heures de Formation
- **Médecins** : 3/8ème des heures hebdomadaires
- **Chefs de Service** : 3/8ème des heures hebdomadaires
- **Autres rôles** : Non applicable

### Types de Congés
- **Congés Annuels (CA)**
- **RTT** (Récupération du Temps de Travail)
- **Formation**
- **ASA** (Autorisation Spéciale d'Absence)
- **Maladie**
- **Enfant malade**

## 🔧 Configuration et Déploiement

### Variables d'Environnement
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Base de Données
- **Table `profiles`** : Profils utilisateurs
- **Table `leave_requests`** : Demandes de congés
- **Table `weekly_schedules`** : Plannings hebdomadaires
- **Politiques RLS** : Sécurité au niveau des lignes

### Edge Functions
- **`admin-login`** : Authentification administrateur
- **`user-management`** : Gestion des utilisateurs

## 📱 Interface Utilisateur

### Design System
- **Couleurs** : Palette médicale (bleus, verts, rouges)
- **Typographie** : Inter (moderne et lisible)
- **Composants** : Shadcn/ui (accessibles et cohérents)
- **Responsive** : Mobile-first design

### Navigation
- **Header** : Navigation principale + profil utilisateur
- **Sidebar** : Menu contextuel selon le rôle
- **Breadcrumbs** : Fil d'Ariane pour l'orientation
- **Modals** : Formulaires et confirmations

## 🚨 Sécurité

### Authentification
- **Sessions sécurisées** avec sessionStorage
- **Validation côté client et serveur**
- **Redirection automatique** si non authentifié

### Autorisation
- **RLS (Row Level Security)** sur toutes les tables
- **Politiques granulaires** par rôle et service
- **Validation des permissions** à chaque requête

### Données Sensibles
- **Chiffrement** des données personnelles
- **Hachage** des mots de passe
- **Audit trail** des modifications

## 🐛 Dépannage

### Problèmes Courants
1. **Erreur de connexion Supabase** : Vérifier les clés API
2. **Données non affichées** : Vérifier les politiques RLS
3. **Erreurs de build** : Nettoyer node_modules et réinstaller
4. **Problèmes de session** : Vider le cache du navigateur

### Logs et Debug
- **Console du navigateur** : Erreurs JavaScript
- **Network tab** : Requêtes API
- **Supabase Dashboard** : Logs de la base de données

## 🤝 Contribution

### Workflow
1. Fork du repository
2. Création d'une branche feature
3. Développement et tests
4. Pull Request vers main

### Standards
- **TypeScript strict** : Typage complet
- **ESLint** : Respect des règles de code
- **Commits conventionnels** : Messages clairs
- **Tests** : Couverture minimale requise

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Équipe

- **Développement** : Équipe Pause Magique
- **Design** : Interface utilisateur médicale
- **Architecture** : Solution scalable et maintenable

## 📞 Support

Pour toute question ou problème :
- **Issues GitHub** : Rapport de bugs
- **Discussions** : Questions et suggestions
- **Email** : support@pausemagique.fr

---

**Pause Magique** - Simplifiez la gestion des congés hospitaliers ! 🏥✨