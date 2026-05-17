/**
 * js/auth.js — Módulo de permisos del Costeo integrado en Kika
 *
 * NO gestiona login/logout (eso lo hace Kika).
 * Solo controla qué tabs y acciones puede hacer cada rol.
 *
 * Mapa de roles Kika → rol interno:
 *   4 (Admin)        → 'admin'         → acceso total
 *   1 (Materia Prima)→ 'materia_prima' → telas, insumos, colecciones
 *   2 (Costeo)       → 'finanzas'      → consolidado, canales, consulta
 */


/**
 * Registra una acción en el historial interno del módulo de costeo.
 */
function addHist(action, module, detail = '') {
  HISTORIAL.unshift({
    id:     ID(),
    ts:     now(),
    user:   currentUser?.name || 'Sistema',
    role:   currentUser ? ROLES[currentUser.role]?.label : '',
    action,
    module,
    detail
  });
}


/**
 * Verifica si el usuario activo tiene permiso de edición en un módulo.
 */
function canEdit(module) {
  const r = currentUser?.role;
  if (!r) return false;
  const map = {
    telas:       ['admin', 'materia_prima'],
    insumos:     ['admin', 'materia_prima'],
    consolidado: ['admin', 'finanzas'],
    colecciones: ['admin', 'materia_prima'],
    canales:     ['admin', 'finanzas'],
    fijos:       ['admin', 'materia_prima'],
  };
  return (map[module] || []).includes(r);
}


/**
 * Construye la interfaz del módulo de costeo según el rol activo.
 * Se llama una vez, desde Costeo.html tras inyectar currentUser.
 */
function buildUI() {
  const role = ROLES[currentUser.role];

  // ── Topbar ────────────────────────────────────────────────
  document.getElementById('user-label').textContent =
    `${currentUser.name} · ${role.label}`;
  document.getElementById('role-dot').style.background = role.color;

  const isAdmin   = currentUser.role === 'admin';
  const isFinance = ['admin', 'finanzas'].includes(currentUser.role);

  document.getElementById('trm-box').style.display  = isFinance ? 'flex'        : 'none';
  document.getElementById('btn-demo').style.display = isAdmin   ? 'inline-flex' : 'none';
  document.getElementById('btn-csv').style.display  = isFinance ? 'inline-flex' : 'none';

  // ── Tabs según rol ────────────────────────────────────────
  document.getElementById('tabstrip').innerHTML = TAB_DEFS.map(t => {
    const allowed = role.tabs.includes(t.id);
    return `<button
      class="tab${allowed ? '' : ' locked'}"
      id="tab-${t.id}"
      onclick="${allowed ? `goTab('${t.id}',this)` : 'void(0)'}">
      ${t.icon} ${t.label}
    </button>`;
  }).join('');

  // ── Panes vacíos ──────────────────────────────────────────
  document.getElementById('content').innerHTML =
    TAB_DEFS.map(t => `<div class="pane" id="pane-${t.id}"></div>`).join('');

  // ── Construir panes ───────────────────────────────────────
  buildPaneColecciones();
  buildPaneMateria();
  buildPaneConsolidado();
  buildPaneCanales();
  buildPaneConsulta();
  buildPaneHistorial();

  // ── Activar primer tab permitido ─────────────────────────
  const firstId  = role.tabs[0];
  const firstBtn = document.getElementById('tab-' + firstId);
  if (firstBtn) goTab(firstId, firstBtn);

  // Cargar datos persistidos desde la BD para todos los roles
  // (incluye TELAS, INSUMOS y FIJOS fijos — permite que el Financiero
  //  vea las referencias al entrar sin necesidad de recargar Excel)
  setTimeout(cargarDesdeDB, 150);
}


/**
 * Navega a un tab del módulo de costeo.
 */
function goTab(id, btn) {
  if (!currentUser) return;
  const role = ROLES[currentUser.role];
  if (!role.tabs.includes(id)) return;

  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));

  if (btn) btn.classList.add('active');
  const pane = document.getElementById('pane-' + id);
  if (pane) pane.classList.add('active');

  activeTab = id;

  if (id === 'materia')     { renderTelas(); renderInsumos(); }
  if (id === 'consolidado') { recalc(); poblarSelectorColecciones?.(); }
  if (id === 'historial')   renderHistorial();
  if (id === 'colecciones') renderColecciones();
  if (id === 'canales')     renderCanales();
  if (id === 'consulta')    { renderConsulta(); poblarSelectorConsulta?.(); }
}
