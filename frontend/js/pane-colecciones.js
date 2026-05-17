/**
 * ============================================================
 * ARCHIVO: js/pane-colecciones.js
 * DESCRIPCIÓN: Módulo de gestión de colecciones.
 * Conectado a MySQL via API REST Node.js
 * ============================================================
 */

const API       = window.parent?.API_URL || 'http://localhost:3000/api';
const getToken  = () => window.parent?.kikaToken || sessionStorage.getItem('kika_token');


/**
 * Construye el HTML completo del pane de Colecciones.
 */
function buildPaneColecciones() {
  const pane = document.getElementById('pane-colecciones');
  if (!pane) return;
  const edit = canEdit('colecciones');

  pane.innerHTML = `
    <div class="page-title">🗂 Módulo Colecciones</div>
    <div class="page-sub">
      Gestión de colecciones ·
      ${edit ? 'Puedes crear, editar y eliminar' : 'Solo consulta'}
    </div>
    ${edit ? `<div style="margin-bottom:14px">
      <button class="btn btn-g" onclick="openColModal()">+ Nueva Colección</button>
    </div>` : ''}
    <div id="col-cards-wrap" class="col-cards">
      <div style="color:var(--tx3);font-style:italic;padding:20px">Cargando...</div>
    </div>`;

  cargarColecciones();
}


/**
 * Carga las colecciones desde la BD y actualiza el estado global.
 */
async function cargarColecciones() {
  try {
    const res  = await fetch(`${API}/colecciones`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.message);

    // Mapear al formato interno del frontend
    COLECCIONES = json.data.map(c => ({
      id:        c.idCOLECCION,
      name:      c.NombreColeccion,
      season:    c.Temporada,
      year:      c.Año,
      createdAt: c.createdAt || '',
      totalRefs: c.totalReferencias || 0
    }));

    renderColecciones();

  } catch (err) {
    const wrap = document.getElementById('col-cards-wrap');
    if (wrap) wrap.innerHTML = `
      <div style="color:var(--red);padding:20px">
        ❌ Error cargando colecciones: ${err.message}
      </div>`;
  }
}


/**
 * Renderiza las tarjetas de colecciones en el grid.
 */
function renderColecciones() {
  const wrap = document.getElementById('col-cards-wrap');
  if (!wrap) return;
  const edit = canEdit('colecciones');

  if (!COLECCIONES.length) {
    wrap.innerHTML = '<div style="color:var(--tx3);font-style:italic;padding:20px">Sin colecciones registradas</div>';
    return;
  }

  wrap.innerHTML = COLECCIONES.map(c => {
    const refs = c.totalRefs || TELAS.filter(t => t.col === c.name).length;
    return `
      <div class="col-card">
        <div class="cc-name">${esc(c.name)}</div>
        <div class="cc-meta">
          ${c.season} ${c.year}${c.desc ? ' · ' + c.desc : ''}
        </div>
        <div class="cc-stat">
          <span class="stat-chip">${refs} referencia(s)</span>
          <span class="stat-chip">${c.createdAt || ''}</span>
        </div>
        <div style="margin-top:12px;display:flex;gap:6px">
          ${edit
            ? `<button class="btn btn-o btn-sm" onclick="openColModal('${c.id}')">✏ Editar</button>
               <button class="btn btn-sm"
                 style="background:var(--rdlt);color:var(--red);border:1px solid #FCA5A5"
                 onclick="deleteCollection('${c.id}')">🗑</button>`
            : `<span class="badge bg">Solo lectura</span>`}
        </div>
      </div>`;
  }).join('');
}


/**
 * Abre el modal para crear o editar una colección.
 */
function openColModal(id = null) {
  editingColId = id;
  const c = id ? COLECCIONES.find(x => x.id == id) : null;

  document.getElementById('col-modal-title').textContent =
    id ? 'Editar Colección' : 'Nueva Colección';

  document.getElementById('cm-name').value   = c?.name   || '';
  document.getElementById('cm-season').value = c?.season || 'PF';
  document.getElementById('cm-year').value   = c?.year   || 2026;
  document.getElementById('cm-desc').value   = c?.desc   || '';

  document.getElementById('col-modal').style.display = 'flex';
}


/**
 * Cierra el modal de colección sin guardar cambios.
 */
function closeColModal() {
  document.getElementById('col-modal').style.display = 'none';
}


/**
 * Guarda la colección nueva o actualiza la existente en la BD.
 */
async function saveCollection() {
  const name   = document.getElementById('cm-name').value.trim();
  const season = document.getElementById('cm-season').value;
  const year   = +document.getElementById('cm-year').value;

  if (!name) {
    toast('⚠ Ingresa el nombre de la colección', 'error');
    return;
  }

  const method = editingColId ? 'PUT' : 'POST';
  const url    = editingColId
    ? `${API}/colecciones/${editingColId}`
    : `${API}/colecciones`;

  try {
    const res  = await fetch(url, {
      method,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ NombreColeccion: name, Temporada: season, Año: year })
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.message);

    addHist(editingColId ? 'Editó colección' : 'Creó colección', 'Colecciones', name);
    toast(editingColId ? '✓ Colección actualizada' : '✓ Colección creada');
    closeColModal();
    await cargarColecciones();

    if (activeTab === 'colecciones')
      goTab('colecciones', document.getElementById('tab-colecciones'));

  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}

async function deleteCollection(id) {
  const c = COLECCIONES.find(x => x.id == id);
  const ok = await window.parent.confirmar(`¿Eliminar colección "${c?.name}"?`, 'danger', 'Eliminar');
  if (!ok) return;

  try {
    const res  = await fetch(`${API}/colecciones/${id}`, {
      method:  'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.message);

    addHist('Eliminó colección', 'Colecciones', c?.name);
    toast('✓ Colección eliminada');
    await cargarColecciones();

    if (activeTab === 'colecciones')
      goTab('colecciones', document.getElementById('tab-colecciones'));

  } catch (err) {
    toast('❌ ' + err.message, 'error');
  }
}
