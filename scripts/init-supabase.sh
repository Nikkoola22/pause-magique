#!/bin/bash

# Script d'initialisation Supabase pour pause-magique
# Cet script configure automatiquement la connexion Supabase

echo "🚀 Initialisation de la connexion Supabase..."
echo "=============================================="
echo ""

# Vérifier que supabase-cli est installé
if ! command -v supabase &> /dev/null; then
    echo "⚠️  supabase-cli n'est pas installé"
    echo "   Installation: npm install -g supabase"
    echo ""
fi

# Vérifier que npm est disponible
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas trouvé. Veuillez installer Node.js"
    exit 1
fi

echo "✅ npm trouvé"
echo ""

# Demander si on veut pousser les migrations
read -p "Voulez-vous pousser les migrations Supabase? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📤 Poussée des migrations..."
    supabase db push
    echo ""
fi

# Afficher les URLs utiles
echo "📋 URLs importantes:"
echo "────────────────────"
echo "🌐 Dashboard: https://app.supabase.com/project/jstgllotjifmgjxjsbpm"
echo "🔌 API: https://jstgllotjifmgjxjsbpm.supabase.co"
echo "⚙️  Configuration: http://localhost:5173/supabase-init"
echo ""

# Démarrer le serveur dev
echo "🎯 Démarrage du serveur de développement..."
echo "──────────────────────────────────────────"
npm run dev

