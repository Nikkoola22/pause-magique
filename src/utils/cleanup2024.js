// Script pour supprimer définitivement tous les plannings de 2024
console.log('🗑️ NETTOYAGE DÉFINITIF DES PLANNINGS 2024');

// Récupérer les données actuelles
const localData = localStorage.getItem('weeklySchedules');
if (localData) {
  const parsed = JSON.parse(localData);
  
  // Compter les clés avant nettoyage
  const allKeys = Object.keys(parsed);
  const keys2024 = allKeys.filter(key => key.includes('2024'));
  const keys2025 = allKeys.filter(key => key.includes('2025'));
  
  console.log('📊 AVANT nettoyage:');
  console.log('  - Total clés:', allKeys.length);
  console.log('  - Clés 2024:', keys2024.length);
  console.log('  - Clés 2025:', keys2025.length);
  
  // Supprimer toutes les clés 2024
  keys2024.forEach(key => {
    delete parsed[key];
  });
  
  // Sauvegarder les données nettoyées
  localStorage.setItem('weeklySchedules', JSON.stringify(parsed));
  
  console.log('📊 APRÈS nettoyage:');
  console.log('  - Total clés restantes:', Object.keys(parsed).length);
  console.log('  - Clés 2025 conservées:', Object.keys(parsed).filter(key => key.includes('2025')).length);
  
  console.log('✅ NETTOYAGE TERMINÉ - 2024 supprimé définitivement');
} else {
  console.log('⚠️ Aucune donnée trouvée dans localStorage');
}






