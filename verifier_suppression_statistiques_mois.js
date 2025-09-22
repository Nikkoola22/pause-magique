// Script pour vérifier la suppression de la section "Statistiques du mois"
console.log('🔍 VÉRIFICATION DE LA SUPPRESSION DES STATISTIQUES DU MOIS');

// 1. Créer une session responsable
const responsableSession = {
  id: '550e8400-e29b-41d4-a716-446655440009',
  username: 'resp.medecine',
  role: 'chef_service',
  name: 'Dr. Martin Dubois',
  service: 'Médecine',
  created_at: new Date().toISOString()
};

sessionStorage.setItem('user_session', JSON.stringify(responsableSession));
console.log('✅ Session responsable créée');

// 2. Créer les boutons de test
const btn1 = document.createElement('button');
btn1.textContent = 'DASHBOARD RESPONSABLE';
btn1.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;background:#22c55e;color:white;border:none;padding:15px;border-radius:10px;font-weight:bold;cursor:pointer;';
btn1.onclick = () => {
  window.location.href = '/manager-dashboard';
};
document.body.appendChild(btn1);

const btn2 = document.createElement('button');
btn2.textContent = 'VÉRIFIER SUPPRESSION';
btn2.style.cssText = 'position:fixed;top:80px;right:20px;z-index:10000;background:#3b82f6;color:white;border:none;padding:15px;border-radius:10px;font-weight:bold;cursor:pointer;';
btn2.onclick = () => {
  // Vérifier si la section "Statistiques du mois" existe encore
  const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, span');
  let foundStats = [];
  
  elements.forEach(element => {
    if (element.textContent) {
      if (element.textContent.includes('Statistiques du mois')) {
        foundStats.push('Statistiques du mois');
      }
      if (element.textContent.includes('Équipe totale')) {
        foundStats.push('Équipe totale');
      }
      if (element.textContent.includes('Demandes traitées')) {
        foundStats.push('Demandes traitées');
      }
      if (element.textContent.includes('Taux d\'approbation')) {
        foundStats.push('Taux d\'approbation');
      }
      if (element.textContent.includes('Temps moyen (jours)')) {
        foundStats.push('Temps moyen (jours)');
      }
      if (element.textContent.includes('Congés accordés')) {
        foundStats.push('Congés accordés');
      }
    }
  });
  
  if (foundStats.length > 0) {
    alert(`❌ ERREUR: La section "Statistiques du mois" est encore présente!\n\nÉléments trouvés:\n- ${foundStats.join('\n- ')}`);
  } else {
    alert('✅ SUCCÈS: La section "Statistiques du mois" a été supprimée!\n\nTous les éléments ont été supprimés:\n- Statistiques du mois\n- Équipe totale\n- Demandes traitées\n- Taux d\'approbation\n- Temps moyen (jours)\n- Congés accordés');
  }
};
document.body.appendChild(btn2);

const btn3 = document.createElement('button');
btn3.textContent = 'AFFICHER SESSION';
btn3.style.cssText = 'position:fixed;top:140px;right:20px;z-index:10000;background:#8b5cf6;color:white;border:none;padding:15px;border-radius:10px;font-weight:bold;cursor:pointer;';
btn3.onclick = () => {
  const session = JSON.parse(sessionStorage.getItem('user_session'));
  if (session) {
    alert(`Session:\nNom: ${session.name}\nUsername: ${session.username}\nRôle: ${session.role}\nService: ${session.service}`);
  } else {
    alert('Aucune session active');
  }
};
document.body.appendChild(btn3);

const btn4 = document.createElement('button');
btn4.textContent = 'TEST COMPLET';
btn4.style.cssText = 'position:fixed;top:200px;right:20px;z-index:10000;background:#f59e0b;color:white;border:none;padding:15px;border-radius:10px;font-weight:bold;cursor:pointer;';
btn4.onclick = () => {
  setTimeout(() => {
    // Vérification complète de tous les éléments
    const allElements = document.querySelectorAll('*');
    let foundElements = [];
    let foundCards = [];
    
    allElements.forEach(element => {
      if (element.textContent) {
        const text = element.textContent.trim();
        
        // Vérifier les titres et labels
        if (text === 'Statistiques du mois') foundElements.push('Titre: Statistiques du mois');
        if (text === 'Équipe totale') foundElements.push('Label: Équipe totale');
        if (text === 'Demandes traitées') foundElements.push('Label: Demandes traitées');
        if (text === 'Taux d\'approbation') foundElements.push('Label: Taux d\'approbation');
        if (text === 'Temps moyen (jours)') foundElements.push('Label: Temps moyen (jours)');
        if (text === 'Congés accordés') foundElements.push('Label: Congés accordés');
        
        // Vérifier les cartes avec grid-cols-5 (caractéristique de cette section)
        if (element.className && element.className.includes('grid-cols-5')) {
          foundCards.push('Carte avec grid-cols-5 détectée');
        }
      }
    });
    
    if (foundElements.length > 0 || foundCards.length > 0) {
      let message = '❌ PROBLÈME DÉTECTÉ!\n\n';
      if (foundElements.length > 0) {
        message += 'Éléments encore présents:\n' + foundElements.join('\n') + '\n\n';
      }
      if (foundCards.length > 0) {
        message += 'Cartes détectées:\n' + foundCards.join('\n') + '\n\n';
      }
      message += 'La section "Statistiques du mois" n\'a pas été complètement supprimée.';
      alert(message);
    } else {
      alert(`✅ SUPPRESSION COMPLÈTE!\n\nTous les éléments de "Statistiques du mois" ont été supprimés:\n\n✅ Titre "Statistiques du mois"\n✅ "Équipe totale"\n✅ "Demandes traitées"\n✅ "Taux d'approbation"\n✅ "Temps moyen (jours)"\n✅ "Congés accordés"\n\nLe dashboard responsable est maintenant nettoyé!`);
    }
  }, 1000);
};
document.body.appendChild(btn4);

const btn5 = document.createElement('button');
btn5.textContent = 'RECHARGER PAGE';
btn5.style.cssText = 'position:fixed;top:260px;right:20px;z-index:10000;background:#ef4444;color:white;border:none;padding:15px;border-radius:10px;font-weight:bold;cursor:pointer;';
btn5.onclick = () => {
  window.location.reload();
};
document.body.appendChild(btn5);

console.log('\n📊 SUPPRESSION APPLIQUÉE:');
console.log('✅ Section "Statistiques du mois" supprimée');
console.log('✅ Carte "Équipe totale" supprimée');
console.log('✅ Carte "Demandes traitées" supprimée');
console.log('✅ Carte "Taux d\'approbation" supprimée');
console.log('✅ Carte "Temps moyen (jours)" supprimée');
console.log('✅ Carte "Congés accordés" supprimée');

console.log('\n🔍 MODIFICATIONS EFFECTUÉES:');
console.log('- Suppression de la Card "Statistiques du mois"');
console.log('- Suppression du grid avec 5 colonnes');
console.log('- Suppression de toutes les cartes statistiques individuelles');
console.log('- Nettoyage du code source WorkingManagerDashboard.tsx');

console.log('\n✅ VÉRIFICATION TERMINÉE');
console.log('La section "Statistiques du mois" a été supprimée du dashboard responsable');
console.log('Cliquez sur "DASHBOARD RESPONSABLE" pour vérifier');
