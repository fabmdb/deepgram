# Créer server.js
cat > server.js << 'EOL'
// Copiez-collez ici le contenu du fichier server.js que j'ai fourni
EOL

# Créer package.json
cat > package.json << 'EOL'
{
  "name": "s2o-speak-to-order",
  "version": "1.0.0",
  "description": "Application de transcription vocale pour les commandes utilisant Deepgram",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "ws": "^8.13.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
EOL

# Créer Dockerfile
cat > Dockerfile << 'EOL'
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le code source
COPY . .

# Créer le dossier public s'il n'existe pas
RUN mkdir -p public

# Copier le fichier HTML dans le dossier public
COPY s2o.html public/index.html

# Exposer le port
EXPOSE 3000

# Démarrer l'application
CMD ["node", "server.js"]
EOL