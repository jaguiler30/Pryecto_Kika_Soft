/**
 * ============================================================
 * ARCHIVO: js/pane-historial.js
 * DESCRIPCIÓN: Módulo de Historial de Cambios.
 * Registra y muestra todas las acciones realizadas en el sistema.
 * Permite filtrar por módulo y usuario, y exportar a CSV.
 * Accesible para todos los roles (solo lectura).
 * Depende de: utils.js, state.js, auth.js
 * ============================================================
 */

// Íconos y colores por módulo para identificar visualmente cada acción
const MOD_ICONS = {
  Login:       '🔑',
  Colecciones: '🗂',
  Telas:       '📐',
  Insumos:     '🪡',
  Consolidado: '📊',
  Canales:     '🏪',
  Consulta:    '🔍',
  Sistema:     '⚙',
};

const MOD_COLORS = {
  Login:       '#FEF3C7',
  Colecciones: '#D8F3DC',
  Telas:       '#DBEAFE',
  Insumos:     '#EDE9FE',
  Consolidado: '#FCF0E8',
  Canales:     '#FEE2E2',
  Consulta:    '#E0F2FE',
  Sistema:     '#F4F1EB',
};


/**
 * Construye el HTML del pane de Historial.
 * Incluye filtros por módulo y usuario, y botón de exportación.
 */
function buildPaneHistorial() {
  const pane = document.getElementById('pane-historial');
  if (!pane) return;

  const moduleOptions = Object.keys(MOD_ICONS).map(m =>
    `<option value="${m}">${MOD_ICONS[m]} ${m}</option>`
  ).join('');

  const fallbackTemplate = `
    <div class="page-title">📋 Módulo Historial de Cambios</div>
    <div class="page-sub">
      Registro completo de todas las acciones realizadas en el sistema.
      Solo lectura — no se puede modificar el historial.
    </div>
    <div style="display:flex;gap:10px;align-items:flex-end;margin-bottom:14px;flex-wrap:wrap">
      <div class="fg">
        <label>Filtrar por módulo</label>
        <select id="hist-filter-mod" onchange="renderHistorial()"
                style="height:30px;padding:0 8px;border:1px solid var(--bd);border-radius:var(--r);font-size:12px">
          <option value="">Todos los módulos</option>
          ${moduleOptions}
        </select>
      </div>
      <div class="fg">
        <label>Filtrar por usuario</label>
        <input id="hist-filter-user" placeholder="Nombre del usuario…" oninput="renderHistorial()"
               style="height:30px;padding:0 8px;border:1px solid var(--bd);border-radius:var(--r);font-size:12px;width:180px">
      </div>
      <div style="align-self:flex-end;font-size:11px;color:var(--tx3)" id="hist-count">0 registros</div>
      <button class="btn btn-o btn-sm" style="align-self:flex-end" onclick="exportHistorial()">⬇ Exportar CSV</button>
    </div>
    <div class="card"><div id="historial-list"></div></div>`;

  // Siempre usar el template local (los partials externos ya no se usan)
  pane.innerHTML = fallbackTemplate;

  renderHistorial();
}


/**
 * Renderiza la lista de registros del historial.
 * Aplica los filtros activos de módulo y usuario.
 * Cada registro muestra: ícono, acción, detalle, rol, usuario y hora.
 */
function renderHistorial() {
  const list   = document.getElementById('historial-list');
  const countEl= document.getElementById('hist-count');
  if (!list) return;

  // Leer filtros activos
  const modFilter  = (document.getElementById('hist-filter-mod')?.value  || '').toLowerCase();
  const userFilter = (document.getElementById('hist-filter-user')?.value || '').toLowerCase();

  // Aplicar filtros
  let rows = HISTORIAL;
  if (modFilter)  rows = rows.filter(h => h.module.toLowerCase() === modFilter);
  if (userFilter) rows = rows.filter(h => h.user.toLowerCase().includes(userFilter));

  // Actualizar contador
  if (countEl) countEl.textContent = `${rows.length} registro(s)`;

  // Sin registros
  if (!rows.length) {
    list.innerHTML = `
      <div style="padding:24px;text-align:center;
                  color:var(--tx3);font-style:italic">
        Sin registros${modFilter || userFilter ? ' para los filtros aplicados' : ''}
      </div>`;
    return;
  }

  // Renderizar filas del historial
  list.innerHTML = rows.map(h => {
    // Color del badge según rol del usuario
    const badgeClass = h.role === 'Administrador'     ? 'bg'
                     : h.role === 'Jefe de Finanzas'  ? 'bb'
                     : h.role === 'Jefe Materia Prima' ? 'ba'
                     : 'bp'; // Jefe de Diseño = púrpura

    return `
      <div class="hist-row">
        <!-- Ícono de módulo -->
        <div class="hist-icon"
             style="background:${MOD_COLORS[h.module] || '#F4F1EB'}">
          ${MOD_ICONS[h.module] || '📝'}
        </div>

        <!-- Descripción de la acción -->
        <div class="hist-body">
          <div class="hist-action">${esc(h.action)}</div>
          <div class="hist-detail">
            ${h.detail ? esc(h.detail) + ' · ' : ''}
            <span class="badge ${badgeClass}">${esc(h.role || '')}</span>
            ${esc(h.user)}
          </div>
        </div>

        <!-- Fecha y hora -->
        <div class="hist-meta">${h.ts}</div>
      </div>`;
  }).join('');
}


/**
 * Exporta el historial completo (o filtrado) a un archivo CSV.
 * Compatible con Excel gracias al BOM UTF-8.
 */
function exportHistorial() {
  const modFilter  = document.getElementById('hist-filter-mod')?.value  || '';
  const userFilter = document.getElementById('hist-filter-user')?.value || '';

  let rows = HISTORIAL;
  if (modFilter)  rows = rows.filter(h => h.module.toLowerCase() === modFilter.toLowerCase());
  if (userFilter) rows = rows.filter(h => h.user.toLowerCase().includes(userFilter.toLowerCase()));

  const hdr  = 'Fecha,Usuario,Rol,Módulo,Acción,Detalle\n';
  const body = rows.map(h =>
    `"${h.ts}","${h.user}","${h.role}","${h.module}","${h.action}","${h.detail}"`
  ).join('\n');

  const blob = new Blob(['\ufeff' + hdr + body], {
    type: 'text/csv;charset=utf-8'
  });
  const a = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'KV_Historial.csv';
  a.click();

  toast('✓ Historial exportado');
}
