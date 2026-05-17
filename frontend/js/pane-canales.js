/**
 * ============================================================
 * ARCHIVO: js/pane-canales.js
 * ============================================================
 */

function buildPaneCanales() {
  const pane = document.getElementById('pane-canales');
  if (!pane) return;

  const canSee = ['admin', 'finanzas'].includes(currentUser?.role);
  if (!canSee) {
    pane.innerHTML = `
      <div class="access-denied">
        <div class="ad-icon">🔒</div>
        <h3>Acceso restringido</h3>
        <p>Solo Administrador y Jefe de Finanzas pueden
           gestionar los canales de venta.</p>
      </div>`;
    return;
  }

  if (!CANALES.length) {
    CANALES = [
      {
        id: ID(), name: 'USA — LLC', activo: true,
        params: { export: 15, arancel: 10, amerindias: 3, factoring: 4, ten11: 15, rtMkup: 2.4 }
      },
      {
        id: ID(), name: 'Latinoamérica', activo: false,
        params: { export: 12, arancel: 8,  amerindias: 2, factoring: 3, ten11: 10, rtMkup: 2.2 }
      },
      {
        id: ID(), name: 'E-Commerce', activo: false,
        params: { export: 8,  arancel: 0,  amerindias: 0, factoring: 3.7, ten11: 0, rtMkup: 2.0 }
      },
    ];
  }

  const edit = canEdit('canales');

  pane.innerHTML = `
    <div class="page-title">🏪 Módulo Canal de Venta</div>
    <div class="page-sub">
      Configura los parámetros de exportación, aranceles y markup
      por canal de distribución ·
      ${edit ? 'Puedes crear y editar canales' : 'Solo consulta'}
    </div>

    <div style="background:var(--bllt);border:1px solid #BFDBFE;border-radius:var(--r2);
                padding:12px 16px;margin-bottom:16px;font-size:12px;color:var(--blue)">
      <b>¿Cómo funciona?</b> Cada canal tiene sus propios porcentajes.
      El canal marcado como <b>Activo</b> define los parámetros que se
      aplican en el Consolidado de Precios. Activa un canal para ver
      cómo cambian los precios finales según el destino de venta.
    </div>

    ${edit
      ? `<div style="margin-bottom:14px;display:flex;gap:8px">
           <button class="btn btn-g" onclick="addCanal()">+ Nuevo Canal</button>
           <button class="btn btn-g" onclick="guardarCanales()"
             style="background:#1a6b7c">
             💾 Guardar en BD
           </button>
         </div>`
      : ''}

    <div class="canal-grid" id="canal-grid"></div>`;

  renderCanales();
}


function renderCanales() {
  const grid = document.getElementById('canal-grid');
  if (!grid) return;
  const edit = canEdit('canales');

  const fields = [
    ['export',     'Exportación %',  'Costos de transporte y agente de exportación'],
    ['arancel',    'Aranceles %',     'Impuesto de importación en el país destino'],
    ['amerindias', 'Amerindias %',    'Costo de bodega y distribución Amerindias'],
    ['factoring',  'Factoring %',     'Costo financiero de cobrar la cartera'],
    ['ten11',      '10Eleven %',      'Comisión del showroom / agente comercial'],
    ['rtMkup',     'RT Markup ×',     'Multiplicador de precio mayorista a minorista'],
  ];

  grid.innerHTML = CANALES.map(c => `
    <div class="canal-card ${c.activo ? 'active-canal' : ''}">
      <div class="canal-name">
        ${esc(c.name)}
        <span class="badge ${c.activo ? 'bg' : 'ba'}">
          ${c.activo ? '✓ Activo' : 'Inactivo'}
        </span>
      </div>

      ${fields.map(([k, label, tooltip]) => `
        <div class="canal-field" title="${tooltip}">
          <label>${label}</label>
          ${edit
            ? `<input type="number" step=".1" value="${c.params[k]}"
                      onchange="updateCanal('${c.id}','${k}',this.value)">`
            : `<span style="font-family:var(--mono);font-size:12px">${c.params[k]}</span>`}
        </div>`).join('')}

      ${edit ? `
        <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-o btn-sm" onclick="toggleCanal('${c.id}')">
            ${c.activo ? '⏸ Desactivar' : '▶ Activar'}
          </button>
          ${c.activo
            ? `<button class="btn btn-g btn-sm"
                       onclick="aplicarCanalAlConsolidado('${c.id}')">
                 📊 Aplicar al Consolidado
               </button>`
            : ''}
          <button class="btn btn-sm"
                  style="background:var(--rdlt);color:var(--red);border:1px solid #FCA5A5"
                  onclick="deleteCanal('${c.id}')">🗑</button>
        </div>` : ''}
    </div>`).join('');
}


async function addCanal() {
  const nombre = await window.parent.pedirTexto('Nombre del nuevo canal de venta:', 'Ej: Europa');
  if (!nombre) return;

  CANALES.push({
    id: ID(), name: nombre, activo: false,
    params: { export: 15, arancel: 10, amerindias: 3, factoring: 4, ten11: 15, rtMkup: 2.4 }
  });

  addHist('Creó canal de venta', 'Canales', nombre);
  renderCanales();
  toast('✓ Canal creado');
}


function updateCanal(id, field, val) {
  const c = CANALES.find(x => x.id === id);
  if (c) c.params[field] = D(val);
  addHist('Editó parámetro canal', 'Canales', `${field} = ${val}`);
  renderCanales();
}


function toggleCanal(id) {
  CANALES.forEach(c => c.activo = false);
  const c = CANALES.find(x => x.id === id);
  if (c) c.activo = true;

  addHist('Activó canal de venta', 'Canales', c?.name);
  renderCanales();
  toast(`✓ Canal "${c?.name}" activado`);
}


function aplicarCanalAlConsolidado(id) {
  const c = CANALES.find(x => x.id === id);
  if (!c) return;

  const mapping = {
    export:     'p-exp',
    arancel:    'p-aran',
    amerindias: 'p-amer',
    factoring:  'p-fact',
    ten11:      'p-10e',
    rtMkup:     'p-rt',
  };

  let applied = 0;
  Object.entries(mapping).forEach(([cField, inputId]) => {
    const el = document.getElementById(inputId);
    if (el) { el.value = c.params[cField]; applied++; }
  });

  if (applied > 0) {
    recalc();
    addHist('Aplicó canal al Consolidado', 'Canales', c.name);
    toast(`✓ Parámetros de "${c.name}" aplicados al Consolidado`);
  } else {
    toast('⚠ Abre el Tab Consolidado primero para aplicar el canal');
  }
}


async function deleteCanal(id) {
  const c = CANALES.find(x => x.id === id);
  const ok = await window.parent.confirmar(`¿Eliminar canal "${c?.name}"?`, 'danger', 'Eliminar');
  if (!ok) return;

  CANALES = CANALES.filter(x => x.id !== id);
  addHist('Eliminó canal de venta', 'Canales', c?.name);
  renderCanales();
  toast('✓ Canal eliminado');
}


async function guardarCanales() {
  const API   = window.parent?.API_URL || 'http://localhost:3000/api';
  const token = window.parent?.kikaToken || sessionStorage.getItem('kika_token');

  try {
    const res  = await fetch(`${API}/canales/guardar`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ canales: CANALES })
    });
    const json = await res.json();
    if (json.ok) toast('✓ Canales guardados en BD');
    else toast('❌ ' + json.message, 'error');
  } catch (err) {
    toast('❌ Error de conexión', 'error');
  }
}
