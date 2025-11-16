#!/bin/bash

# ✅ SCRIPT DE VÉRIFICATION RAPIDE - Pause Magique
# Ce script vérifie que tout est prêt pour lancer l'app avec Supabase

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🚀 VÉRIFICATION DE L'INITIALISATION SUPABASE          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Compteurs
total=0
success=0

# Fonction pour tester
test_file() {
  total=$((total + 1))
  if [ -f "$1" ] || [ -d "$1" ]; then
    echo -e "${GREEN}✅${NC} $1"
    success=$((success + 1))
  else
    echo -e "${RED}❌${NC} $1 (MANQUANT)"
  fi
}

# Fonction pour tester le contenu
test_content() {
  total=$((total + 1))
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✅${NC} $1 contient '$2'"
    success=$((success + 1))
  else
    echo -e "${RED}❌${NC} $1 manque '$2'"
  fi
}

echo "📋 Vérification des fichiers créés..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_file "src/hooks/useSupabaseConnection.ts"
test_file "src/components/SupabaseConnectionStatus.tsx"
test_file "src/pages/SupabaseInitPage.tsx"
test_file "src/utils/initializeSupabase.ts"
test_file "src/utils/supabaseSetup.ts"
test_file "supabase/migrations/20251116000000_ensure_profiles_table.sql"
test_file "scripts/init-supabase.sh"

echo ""
echo "📝 Vérification du contenu des fichiers clés..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_content "src/App.tsx" "useSupabaseConnection"
test_content "src/App.tsx" "SupabaseConnectionStatus"
test_content "src/main.tsx" "initializeSupabase"
test_content "supabase/migrations/20251116000000_ensure_profiles_table.sql" "CREATE TABLE.*profiles"

echo ""
echo "🔧 Vérification de la configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_content ".env" "VITE_SUPABASE_URL"
test_content ".env" "VITE_SUPABASE_PUBLISHABLE_KEY"

echo ""
echo "📊 Vérification du build..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if npm run build > /tmp/build.log 2>&1; then
  if grep -q "✓ built" /tmp/build.log; then
    echo -e "${GREEN}✅${NC} Build réussit"
    success=$((success + 1))
  else
    echo -e "${RED}❌${NC} Build contient des erreurs"
  fi
else
  echo -e "${RED}❌${NC} Build échoué"
fi
total=$((total + 1))

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    📊 RÉSULTATS                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Tests réussis: ${GREEN}$success/$total${NC}"
echo ""

if [ $success -eq $total ]; then
  echo -e "${GREEN}✅ TOUT EST PRÊT!${NC}"
  echo ""
  echo "🚀 Vous pouvez maintenant lancer:"
  echo "   npm run dev"
  echo ""
  echo "📍 Ou utilisez le script complet:"
  echo "   ./scripts/init-supabase.sh"
  echo ""
  echo "📖 Pour voir la configuration, allez à:"
  echo "   http://localhost:5173/supabase-init"
  echo ""
else
  echo -e "${YELLOW}⚠️  ATTENTION${NC}: $((total - success)) test(s) échoué(s)"
  echo ""
  echo "Vérifiez les fichiers listés ci-dessus"
  echo ""
fi

echo ""
