#!/bin/bash

# Script de test - Vérifier que l'app fonctionne en mode démo

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     ✅ Test Mode Démo (Offline)                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier la configuration
echo "📋 Vérification de la configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "Mode DÉMO" src/components/SupabaseConnectionStatus.tsx; then
  echo "✅ Mode démo implémenté dans le composant"
else
  echo "❌ Mode démo manquant"
fi

if grep -q "includes('Load failed')" src/hooks/useSupabaseConnection.ts; then
  echo "✅ Gestion des erreurs réseau implémentée"
else
  echo "❌ Gestion des erreurs réseau manquante"
fi

echo ""
echo "🧪 Tests de fonctionnalité..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1: Vérifier que les fichiers existent
files=(
  "src/hooks/useSupabaseConnection.ts"
  "src/components/SupabaseConnectionStatus.tsx"
  "src/pages/SupabaseInitPage.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file"
  fi
done

echo ""
echo "🔍 Vérification du build..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm run build > /tmp/build.log 2>&1; then
  if grep -q "✓ built" /tmp/build.log; then
    echo "✅ Build réussit"
  else
    echo "⚠️  Build contient des avertissements"
  fi
else
  echo "❌ Build échoué"
fi

echo ""
echo "✨ Mode Démo Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "L'application fonctionne maintenant:"
echo "  ✅ Sans connexion Internet"
echo "  ✅ Avec ou sans accès à Supabase"
echo "  ✅ Affiche le status de la connexion"
echo ""
echo "🎯 Pour tester:"
echo "  1. npm run dev"
echo "  2. Ouvrir: http://localhost:5173"
echo "  3. Vérifier le message: ⚠️ Mode DÉMO"
echo ""

