// js/constants.js
const __ENV = (typeof window !== 'undefined' && window.__ENV__) ? window.__ENV__ : {};

export const ADMIN_EMAILS = (__ENV.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);