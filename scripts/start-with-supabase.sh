#!/bin/bash

# Script pour lancer l'app avec support Supabase local

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚀 Démarrage de l'Application avec Supabase              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Fonction pour arrêter les processus
cleanup() {
  echo ""
  echo "⏹️  Arrêt des services..."
  kill $MOCK_PID $DEV_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM

# Vérifier si on doit utiliser le mock server
if [ "$1" = "--local" ] || [ "$1" = "--mock" ]; then
  echo "📱 Mode LOCAL (Mock Supabase)"
  echo ""
  
  echo "🎯 Démarrage du Mock Supabase Server..."
  SUPABASE_MOCK_PORT=3001 node mock-supabase.js &
  MOCK_PID=$!
  
  # Attendre que le mock server soit prêt
  sleep 2
  
  # Vérifier que le mock server répond
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Mock Supabase Server démarré sur http://localhost:3001"
  else
    echo "❌ Impossible de démarrer le Mock Server"
    cleanup
  fi
  
  echo ""
  echo "💾 Configuration:"
  echo "   VITE_SUPABASE_URL = http://localhost:3001"
  echo ""
  
  # Démarrer l'app avec l'URL locale
  VITE_SUPABASE_URL="http://localhost:3001" npm run dev &
  DEV_PID=$!
else
  echo "🌐 Mode PRODUCTION (Supabase Cloud)"
  echo ""
  echo "📌 URL: https://jstgllotjifmgjxjsbpm.supabase.co"
  echo ""
  
  # Démarrer l'app normalement
  npm run dev &
  DEV_PID=$!
fi

echo ""
echo "Appuyez sur Ctrl+C pour arrêter"
echo ""

# Attendre les processus
wait $DEV_PID $MOCK_PID 2>/dev/null

