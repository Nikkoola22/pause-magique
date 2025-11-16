import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import initializeSupabase from "./utils/initializeSupabase";

// Initialiser Supabase au démarrage
initializeSupabase().catch(err => {
  console.error('❌ Erreur lors de l\'initialisation:', err);
});

createRoot(document.getElementById("root")!).render(<App />);
