const express = require('express');
const path = require('path');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;

// Utiliser uniquement la variable d'environnement pour la clé API
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// Vérification de la présence de la clé API
if (!DEEPGRAM_API_KEY) {
  console.error('ERREUR: Variable d\'environnement DEEPGRAM_API_KEY non définie');
  console.error('Veuillez configurer cette variable dans les paramètres de votre service Render');
  process.exit(1);
}

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Créer un serveur HTTP pour Express
const server = createServer(app);

// Créer un serveur WebSocket
const wss = new WebSocketServer({ server, path: '/websocket' });

// Gérer les connexions WebSocket
wss.on('connection', (ws) => {
  console.log('Nouvelle connexion client WebSocket');
  
  // Créer une connexion WebSocket vers Deepgram
  const deepgramSocket = new WebSocket(
    `wss://api.deepgram.com/v1/listen?punctuate=true&language=fr`, {
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`
      }
    }
  );
  
  deepgramSocket.on('open', () => {
    console.log('Connexion établie avec Deepgram');
    ws.send(JSON.stringify({ type: 'status', message: 'Connexion à Deepgram établie' }));
  });
  
  // Transférer les messages du client vers Deepgram
  ws.on('message', (message) => {
    if (deepgramSocket.readyState === WebSocket.OPEN) {
      try {
        deepgramSocket.send(message);
      } catch (error) {
        console.error('Erreur lors de l\'envoi des données à Deepgram:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Erreur de transmission des données' }));
      }
    }
  });
  
  // Transférer les réponses de Deepgram vers le client
  deepgramSocket.on('message', (message) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
  
  // Gérer la fermeture du WebSocket client
  ws.on('close', () => {
    console.log('Connexion client fermée');
    if (deepgramSocket.readyState === WebSocket.OPEN) {
      deepgramSocket.close();
    }
  });
  
  // Gérer les erreurs du WebSocket client
  ws.on('error', (error) => {
    console.error('Erreur WebSocket client:', error);
  });
  
  // Gérer les erreurs du WebSocket Deepgram
  deepgramSocket.on('error', (error) => {
    console.error('Erreur WebSocket Deepgram:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'error', message: 'Erreur de connexion à Deepgram' }));
      ws.close();
    }
  });
  
  // Gérer la fermeture du WebSocket Deepgram
  deepgramSocket.on('close', (code, reason) => {
    console.log(`Connexion Deepgram fermée: ${code} - ${reason}`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'status', message: 'Connexion à Deepgram fermée' }));
      ws.close();
    }
  });
});

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Vérification de l'état du serveur
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Le serveur fonctionne correctement' });
});

// Démarrer le serveur
server.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});