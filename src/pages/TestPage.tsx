import { useState } from "react";

const TestPage = () => {
  const [session, setSession] = useState<any>(null);

  const checkSession = () => {
    const userSession = sessionStorage.getItem('user_session');
    if (userSession) {
      setSession(JSON.parse(userSession));
    } else {
      setSession(null);
    }
  };

  const clearSession = () => {
    sessionStorage.removeItem('user_session');
    setSession(null);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Page de Test - Session</h1>
      
      <div className="space-y-4">
        <button 
          onClick={checkSession}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Vérifier la session
        </button>
        
        <button 
          onClick={clearSession}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Effacer la session
        </button>
        
        {session && (
          <div className="bg-green-100 p-4 rounded">
            <h2 className="font-bold">Session trouvée :</h2>
            <pre>{JSON.stringify(session, null, 2)}</pre>
          </div>
        )}
        
        {!session && (
          <div className="bg-red-100 p-4 rounded">
            <p>Aucune session trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPage;






