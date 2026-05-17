/**
 * js/state.js — Estado global del módulo de Costeo integrado en Kika
 *
 * Roles internos mapeados desde Kika:
 *   'admin'         ← Kika rol 4 (Administrador) — acceso total
 *   'materia_prima' ← Kika rol 1 (Materia Prima)  — telas, insumos, colecciones
 *   'finanzas'      ← Kika rol 2 (Costeo)          — consolidado, canales, consulta
 *
 * El rol 3 (Consulta) de Kika NO tiene acceso a este módulo.
 */

// ── Sesión y navegación ──────────────────────────────────────
let currentUser  = null;  // { name, role, token } — inyectado desde Costeo.html
let activeTab    = null;
let editingColId = null;

// ── Estado del Módulo Consulta ───────────────────────────────
let consultaSelected = null;
let consultaQuery    = '';

// ── Generador de IDs únicos en memoria ───────────────────────
let _uid = 1;
const ID = () => '_' + (_uid++);

// ── Base de datos en memoria ─────────────────────────────────
let COLECCIONES = [];
let TELAS       = [];
let INSUMOS     = [];
let FIJOS       = [];
let CANALES     = [];
let HISTORIAL   = [];

// ── Roles internos del módulo de Costeo ──────────────────────
const ROLES = {
  admin: {
    label: 'Administrador',
    color: '#FFD166',
    tabs: ['colecciones','materia','consolidado','canales','consulta','historial']
  },
  materia_prima: {
    label: 'Jefe Materia Prima',
    color: '#52B788',
    tabs: ['colecciones','materia','consulta','historial']
  },
  finanzas: {
    label: 'Costeo / Finanzas',
    color: '#93C5FD',
    tabs: ['colecciones','consolidado','canales','consulta','historial']
  },
};

// ── Definición de tabs ───────────────────────────────────────
const TAB_DEFS = [
  { id: 'colecciones', icon: '🗂',  label: 'Colecciones'        },
  { id: 'materia',     icon: '📐',  label: 'Telas & Confección' },
  { id: 'consolidado', icon: '📊',  label: 'Consolidado'        },
  { id: 'canales',     icon: '🏪',  label: 'Canal de Venta'     },
  { id: 'consulta',    icon: '🔍',  label: 'Consulta'           },
  { id: 'historial',   icon: '📋',  label: 'Historial'          },
];