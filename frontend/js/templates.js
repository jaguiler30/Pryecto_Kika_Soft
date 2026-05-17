/**
 * ============================================================
 * ARCHIVO: js/templates.js
 * DESCRIPCIÓN: Templates y utilidades HTML de la aplicación.
 *
 * NOTA: El login y el app-shell ya están embebidos directamente
 * en index.html, por lo que NO se necesitan fetch() de partials.
 * Este archivo queda disponible para templates dinámicos futuros.
 * ============================================================
 */

// Namespace global para templates en memoria (sin fetch externo)
window.KVTemplates = {
  historial: null,  // Se construye dinámicamente en pane-historial.js
};
