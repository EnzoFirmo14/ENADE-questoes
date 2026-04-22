#!/usr/bin/env node
/**
 * Script para injetar variáveis de ambiente no index.html
 * Uso: node scripts/inject-env.js
 * 
 * Lê .env e injeta as variáveis como window.__ENV__
 */

const fs = require('fs');
const path = require('path');

// Ler arquivo .env
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Arquivo .env não encontrado. Execute: cp .env.example .env');
  process.exit(1);
}

// Parse .env
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};

envContent.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (!trimmedLine || trimmedLine.startsWith('#')) return;
  
  const [key, ...valueParts] = trimmedLine.split('=');
  const value = valueParts.join('=').replace(/^["']|["']$/g, '');
  
  if (key) {
    env[key] = value;
  }
});

// Gerar script
const envScript = `<script>
  // Variáveis de ambiente injetadas automaticamente
  window.__ENV__ = ${JSON.stringify(env, null, 2)};
</script>\n`;

// Inserir antes de app.js
const indexPath = path.join(__dirname, '../public/index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf-8');

// Remover script anterior se existir
htmlContent = htmlContent.replace(/<script>\s*\/\/ Variáveis de ambiente injetadas[\s\S]*?<\/script>\n?/g, '');

// Inserir novo script
const appScriptPattern = /<script[^>]*type="module"\s+src="\.\/js\/app\.js"[^>]*><\/script>/;
htmlContent = htmlContent.replace(appScriptPattern, envScript + '<script type="module" src="./js/app.js"></script>');

// Salvar
fs.writeFileSync(indexPath, htmlContent);

console.log('✅ Variáveis de ambiente injetadas no index.html');
console.log('📍 Execute: firebase serve');
