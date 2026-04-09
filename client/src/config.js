/**
 * Configuration de l'URL de l'API
 * Utilise des chemins relatifs pour profiter du proxy Vite en developpement
 * et fonctionner correctement via ngrok sans erreur de loopback.
 */

const getBaseUrl = () => {
  const hostname = window.location.hostname;

  // Si on est en local (dev standard)
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    // On pourrait retourner "http://localhost:5000", 
    // mais utiliser "" (relatif) permet au proxy Vite de fonctionner parfaitement.
    return ""; 
  }

  // Pour ngrok ou toute autre URL publique, on utilise une chaine vide 
  // pour forcer les appels relatifs et eviter les erreurs de "loopback" (CORS).
  return ""; 
};

// En developpement, Vite proxie les appels commencant par "/api" vers le backend.
// En production, le serveur (Nginx/Express) s'occupera de la meme chose.
export const API_URL = getBaseUrl() || window.location.origin;
export const API_BASE = "/api"; 

export default {
  API_URL,
  API_BASE,
};
