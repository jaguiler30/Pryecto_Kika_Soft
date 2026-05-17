/**
 * js/utils.js — Funciones utilitarias puras (sin dependencias)
 * Se carga PRIMERO. Todos los demás módulos las usan.
 */

// Convierte cualquier valor a número. Si es inválido retorna 0.
const D = v => parseFloat(v) || 0;

// Convierte porcentaje (15) a decimal (0.15)
const pct = v => D(v) / 100;

// Formatea número como COP sin decimales: 1234567 → "1.234.567"
const fmt = n =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(D(n));

// Alias de fmt para valores USD (redondeados al entero)
const fmtU = n => fmt(Math.round(D(n)));

// Fecha y hora actual en formato colombiano
const now = () =>
  new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

// Escapa caracteres HTML para prevenir XSS
const esc = s =>
  String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Limpia valores numéricos provenientes de Excel.
 * Elimina $, espacios, puntos de miles y convierte coma a punto decimal.
 */
function cleanNum(v) {
  if (v === null || v === undefined || v === '') return '';
  // Si ya es número (SheetJS lo parsea directo), usarlo tal cual
  if (typeof v === 'number') return v;
  // Si es string con formato europeo (punto=miles, coma=decimal)
  const s = String(v).replace(/[$\s]/g, '').replace(/\./g, '').replace(/,/g, '.');
  const n = parseFloat(s);
  return isNaN(n) ? '' : n;
}

/**
 * Muestra una notificación flotante (toast) en esquina inferior derecha.
 * @param {string} msg - Mensaje a mostrar
 * @param {number} ms  - Duración en milisegundos (default 2200)
 */
function toast(msg, ms = 2200) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
}
