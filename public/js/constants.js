// js/constants.js

// lê variáveis de ambiente injetadas no window.__ENV__
const __ENV = (typeof window !== 'undefined' && window.__ENV__) ? window.__ENV__ : {};

// e-mails que têm permissão de admin
export const ADMIN_EMAILS = (__ENV.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

// cores usadas nas categorias do painel admin
export const CATEGORY_COLORS = [
  '#7C6EF5', // roxo
  '#22D992', // verde
  '#F59E42', // laranja
  '#F56565', // vermelho
  '#4FD1C5', // turquesa
  '#ED64A6', // rosa
  '#4299E1', // azul
  '#9F7AEA'  // lilás
];