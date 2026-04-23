// scripts/inject-env.js
// Gera public/js/env.js a partir do arquivo .env

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const outDir = path.join(rootDir, 'public', 'js');
const outFile = path.join(outDir, 'env.js');

// Carrega o .env
if (!fs.existsSync(envPath)) {
  console.warn('[inject-env] Arquivo .env não encontrado em', envPath);
} else {
  dotenv.config({ path: envPath });
}

// Mapeia variáveis expostas no front
const ENV = {
  VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || '',
  VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || '',
  VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '',
  VITE_ADMIN_EMAILS: process.env.VITE_ADMIN_EMAILS || ''
};

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const fileContents =
  `// Arquivo gerado automaticamente por scripts/inject-env.js\n` +
  `// NÃO edite este arquivo manualmente. Altere o .env na raiz do projeto.\n\n` +
  `window.__ENV__ = ${JSON.stringify(ENV, null, 2)};\n`;

fs.writeFileSync(outFile, fileContents, 'utf8');

console.log('[inject-env] public/js/env.js gerado com sucesso.');