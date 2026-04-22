// ============================================
// CONSTANTES DO APLICATIVO
// ============================================

import { ENV } from './env.js';

/**
 * Emails dos usuários administradores
 * (Carregado de variáveis de ambiente)
 */
export const ADMIN_EMAILS = ENV.ADMIN_EMAILS;

/**
 * Cores disponíveis para categorias
 */
export const CATEGORY_COLORS = [
  '#AFA9EC',
  '#85B7EB',
  '#5DCAA5',
  '#F0997B',
  '#F4C0D1',
  '#97C459',
  '#FAC775',
  '#ED93B1'
];

/**
 * Estilos para cada nível de prioridade
 */
export const PRIO_STYLE = {
  "obrigatório": {
    bg: "#2a1a1a",
    text: "#f87171"
  },
  "importante": {
    bg: "#2a2010",
    text: "#fbbf24"
  },
  "revisar": {
    bg: "#0f1f2e",
    text: "#60a5fa"
  },
  "atenção máxima": {
    bg: "#2a0f1a",
    text: "#f472b6"
  }
};