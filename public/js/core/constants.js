// js/core/constants.js

const __ENV = (typeof window !== 'undefined' && window.__ENV__) ? window.__ENV__ : {};

// Admin emails
export const ADMIN_EMAILS = (__ENV.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

// Category colors
export const CATEGORY_COLORS = [
  '#7C3AED', // violet
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
  '#EC4899', // pink
  '#3B82F6', // blue
  '#8B5CF6'  // purple
];

// Course options
export const COURSES = [
  { value: 'ADS', label: 'Análise e Desenvolvimento de Sistemas' },
  { value: 'SI', label: 'Sistemas de Informação' },
  { value: 'EC', label: 'Engenharia da Computação' }
];

// Priority levels
export const PRIORITIES = [
  { value: 'obrigatório', label: 'Obrigatório', color: '#EF4444' },
  { value: 'importante', label: 'Importante', color: '#F59E0B' },
  { value: 'revisar', label: 'Revisar', color: '#3B82F6' },
  { value: 'atenção máxima', label: 'Atenção Máxima', color: '#7C3AED' }
];

// Firebase collection names
export const COLLECTIONS = {
  USERS: 'users',
  CATEGORIES: 'categories',
  FLASHCARDS: 'flashcards',
  CHECKLIST_ITEMS: 'checklist_items'
};

// Error messages (Portuguese)
export const ERRORS = {
  AUTH_REQUIRED: 'Você precisa estar autenticado.',
  ADMIN_REQUIRED: 'Acesso restrito a administradores.',
  NETWORK: 'Erro de conexão. Verifique sua internet.',
  UNKNOWN: 'Ocorreu um erro inesperado. Tente novamente.',
  WEAK_PASSWORD: 'A senha deve ter pelo menos 6 caracteres.',
  EMAIL_IN_USE: 'Este email já está em uso.',
  INVALID_EMAIL: 'Email inválido.',
  WRONG_PASSWORD: 'Senha incorreta.',
  USER_NOT_FOUND: 'Usuário não encontrado.',
  REQUIRES_RECENT_LOGIN: 'Para esta operação, faça login novamente.'
};

// Map Firebase error codes to messages
export const FIREBASE_ERRORS = {
  'auth/email-already-in-use': ERRORS.EMAIL_IN_USE,
  'auth/invalid-email': ERRORS.INVALID_EMAIL,
  'auth/weak-password': ERRORS.WEAK_PASSWORD,
  'auth/wrong-password': ERRORS.WRONG_PASSWORD,
  'auth/user-not-found': ERRORS.USER_NOT_FOUND,
  'auth/requires-recent-login': ERRORS.REQUIRES_RECENT_LOGIN,
  'auth/network-request-failed': ERRORS.NETWORK,
  'permission-denied': ERRORS.ADMIN_REQUIRED
};
