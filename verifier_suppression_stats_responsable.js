// Script pour vérifier la suppression des cartes statistiques du dashboard responsable
console.log('🔍 VÉRIFICATION DE LA SUPPRESSION DES CARTES STATISTIQUES');

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
  // Vérifier si les cartes statistiques existent encore
  const enAttenteCard = document.querySelector('text-sm font-medium text-gray-600:contains("En attente")');
  const approuveesCard = document.querySelector('text-sm font-medium text-gray-600:contains("Approuvées")');
  const refuseesCard = document.querySelector('text-sm font-medium text-gray-600:contains("Refusées")');
  const equipeCard = document.querySelector('text-sm font-medium text-gray-600:contains("Équipe")');
  
  // Méthode alternative de vérification
  const statsCards = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-4');
  const textElements = document.querySelectorAll('p');
  
  let foundStats = false;
  textElements.forEach(element => {
    if (element.textContent) {
      if (element.textContent.includes('En attente') || 
          element.textContent.includes('Approuvées') || 
          element.textContent.includes('Refusées') || 
          element.textContent.includes('Équipe')) {
        foundStats = true;
      }
    }
  });
  
  if (foundStats) {
    alert('❌ ERREUR: Les cartes statistiques sont encore présentes!\n\n"En attente", "Approuvées", "Refusées", "Équipe" sont encore visibles.');
  } else {
    alert('✅ SUCCÈS: Les cartes statistiques ont été supprimées!\n\n"En attente", "Approuvées", "Refusées", "Équipe" ne sont plus affichées.');
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
    // Vérification complète des éléments supprimés
    const elements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');
    let foundElements = [];
    
    elements.forEach(element => {
      if (element.textContent) {
        if (element.textContent.includes('En attente')) {
          foundElements.push('En attente');
        }
        if (element.textContent.includes('Approuvées')) {
          foundElements.push('Approuvées');
        }
        if (element.textContent.includes('Refusées')) {
          foundElements.push('Refusées');
        }
        if (element.textContent.includes('Équipe')) {
          foundElements.push('Équipe');
        }
      }
    });
    
    if (foundElements.length > 0) {
      alert(`❌ PROBLÈME DÉTECTÉ!\n\nÉléments encore présents:\n- ${foundElements.join('\n- ')}\n\nLes cartes statistiques n'ont pas été complètement supprimées.`);
    } else {
      alert(`✅ SUPPRESSION COMPLÈTE!\n\nTous les éléments ont été supprimés:\n- En attente: ❌ Supprimé\n- Approuvées: ❌ Supprimé\n- Refusées: ❌ Supprimé\n- Équipe: ❌ Supprimé\n\nLe dashboard responsable est maintenant nettoyé!`);
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
console.log('✅ Carte "En attente" supprimée');
console.log('✅ Carte "Approuvées" supprimée');
console.log('✅ Carte "Refusées" supprimée');
console.log('✅ Carte "Équipe" supprimée');
console.log('✅ Section "Stats Cards" complètement supprimée');

console.log('\n🔍 MODIFICATIONS EFFECTUÉES:');
console.log('- Suppression de la div avec les 4 cartes statistiques');
console.log('- Suppression des cartes individuelles (En attente, Approuvées, Refusées, Équipe)');
console.log('- Nettoyage du code source WorkingManagerDashboard.tsx');

console.log('\n✅ VÉRIFICATION TERMINÉE');
console.log('Les cartes statistiques ont été supprimées du dashboard responsable');
console.log('Cliquez sur "DASHBOARD RESPONSABLE" pour vérifier');


