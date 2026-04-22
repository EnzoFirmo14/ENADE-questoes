// ============================================
// VARIÁVEIS DE AMBIENTE - CARREGAMENTO
// ============================================
// Este arquivo carrega as variáveis de ambiente
// Fontes (em ordem de prioridade):
// 1. window.__ENV__ (injetado via script HTML)
// 2. localStorage (salvo via config.html)
// 3. import.meta.env (se usando Vite)
// 4. process.env (se usando Node.js build)

/**
 * Obtém uma variável de ambiente
 * Suporta múltiplas fontes para máxima compatibilidade
 */
function getEnv(key, defaultValue = null) {
  // 1. Tentar window.__ENV__ (injetado via HTML script)
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__[key]) {
    return window.__ENV__[key];
  }

  // 2. Tentar localStorage (salvo via config.html durante desenvolvimento)
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(key);
    if (stored) {
      return stored;
    }
  }

  // 3. Tentar import.meta.env (Vite)
  try {
    if (import.meta && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch (_) {}

  // 4. Tentar process.env (Node.js)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }

  // Retornar valor padrão
  return defaultValue;
}

/**
 * Configuração de variáveis de ambiente
 */
export const ENV = {
  // Firebase
  FIREBASE_API_KEY: getEnv('VITE_FIREBASE_API_KEY'),
  FIREBASE_AUTH_DOMAIN: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  FIREBASE_PROJECT_ID: getEnv('VITE_FIREBASE_PROJECT_ID'),
  FIREBASE_STORAGE_BUCKET: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  FIREBASE_MESSAGING_SENDER_ID: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  FIREBASE_APP_ID: getEnv('VITE_FIREBASE_APP_ID'),

  // Admin
  ADMIN_EMAILS: (getEnv('VITE_ADMIN_EMAILS', 'admintop@admin.com'))
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0)
};

/**
 * Valida se as variáveis de ambiente essenciais estão configuradas
 * Retorna true se válido, false caso contrário
 */
export function validateEnv() {
  const requiredEnvs = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID'
  ];

  const missing = requiredEnvs.filter(key => !ENV[key]);

  if (missing.length > 0) {
    console.warn(
      'Variáveis de ambiente faltando:',
      missing.join(', ')
    );
    return false;
  }

  return true;
}

/**
 * Verifica se as variáveis estão configuradas
 */
export function hasEnv() {
  return !!(
    ENV.FIREBASE_API_KEY &&
    ENV.FIREBASE_AUTH_DOMAIN &&
    ENV.FIREBASE_PROJECT_ID
  );
}