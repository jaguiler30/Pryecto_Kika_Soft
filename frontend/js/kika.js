/**
 * kika.js — Utilidades compartidas del frontend
 * -----------------------------------------------
 * Contiene las funciones globales usadas por todos
 * los formularios del sistema:
 *   - Toast (notificaciones visuales)
 *   - Modal de confirmación (reemplaza confirm() nativo)
 *   - Guard de autenticación (protege páginas sin login)
 *   - Helpers de validación de formularios
 */

/* ============================================================
   1. CONFIGURACIÓN GLOBAL
   ============================================================ */

/** URL base del backend. Cambiar en producción. */
const API_URL = 'http://localhost:3000/api';

/** Mapa de id de rol → nombre legible */
const ROLES = {
  1: 'Materia Prima',
  2: 'Costeo',
  3: 'Consulta',
  4: 'Administrador'
};

/* ============================================================
   2. TOAST — notificaciones visuales no bloqueantes
   Uso: toast('Mensaje', 'success' | 'error' | 'info')
   ============================================================ */

/**
 * Muestra una notificación tipo toast en la esquina inferior derecha.
 * @param {string} msg   - Texto a mostrar
 * @param {'success'|'error'|'info'} tipo - Variante visual
 * @param {number} duracion - Milisegundos antes de desaparecer (default 3000)
 */
function toast(msg, tipo = 'success', duracion = 3000) {
  let contenedor = document.getElementById('toastContainer');

  // Crear contenedor si no existe en el DOM
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.id = 'toastContainer';
    contenedor.className = 'toast-container';
    document.body.appendChild(contenedor);
  }

  const iconos = {
    success: 'ri-check-line',
    error:   'ri-error-warning-line',
    info:    'ri-information-line'
  };

  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  el.innerHTML = `<i class="${iconos[tipo] || iconos.info}"></i> ${msg}`;
  contenedor.appendChild(el);

  // Auto-eliminar después de la duración indicada
  setTimeout(() => {
    el.classList.add('hiding');
    setTimeout(() => el.remove(), 300);
  }, duracion);
}

/* ============================================================
   3. MODAL DE CONFIRMACIÓN — reemplaza confirm() nativo
   Uso: const ok = await confirmar('¿Eliminar este usuario?')
   ============================================================ */

/**
 * Muestra un modal de confirmación personalizado.
 * Retorna una promesa que resuelve true (confirmó) o false (canceló).
 * @param {string} mensaje  - Pregunta principal
 * @param {string} tipo     - 'danger' para acciones destructivas, 'warning' para advertencias
 * @param {string} txtOk    - Texto del botón de confirmación
 * @returns {Promise<boolean>}
 */
function confirmar(mensaje, tipo = 'danger', txtOk = 'Confirmar') {
  return new Promise((resolve) => {

    // Eliminar modal previo si existe
    const previo = document.getElementById('kikaModal');
    if (previo) previo.remove();

    const colores = {
      danger:  { bg: 'var(--red)',  icon: 'ri-error-warning-line' },
      warning: { bg: 'var(--gold)', icon: 'ri-alert-line' },
      info:    { bg: 'var(--teal)', icon: 'ri-question-line' }
    };
    const cfg = colores[tipo] || colores.info;

    // Construir el modal
    const overlay = document.createElement('div');
    overlay.id = 'kikaModal';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,.45); backdrop-filter: blur(2px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn .15s ease;
    `;

    overlay.innerHTML = `
      <div style="
        background: #fff; border-radius: 14px; padding: 28px 28px 22px;
        max-width: 380px; width: 90%; box-shadow: 0 12px 40px rgba(0,0,0,.18);
        animation: slideUp .18s ease;
      ">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          <div style="
            width:40px;height:40px;border-radius:50%;
            background:${cfg.bg}22;
            display:flex;align-items:center;justify-content:center;flex-shrink:0
          ">
            <i class="${cfg.icon}" style="font-size:20px;color:${cfg.bg}"></i>
          </div>
          <p style="margin:0;font-size:14px;font-weight:600;color:var(--text);line-height:1.5">
            ${mensaje}
          </p>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px">
          <button id="modalCancelar" style="
            padding:8px 18px;border-radius:8px;border:1.5px solid var(--gray-mid);
            background:transparent;cursor:pointer;font-size:13px;font-weight:600;
            color:var(--text-sec);font-family:inherit;transition:.15s
          ">Cancelar</button>
          <button id="modalOk" style="
            padding:8px 18px;border-radius:8px;border:none;
            background:${cfg.bg};color:#fff;cursor:pointer;
            font-size:13px;font-weight:700;font-family:inherit;transition:.15s
          ">${txtOk}</button>
        </div>
      </div>
      <style>
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform:translateY(12px);opacity:0 } to { transform:none;opacity:1 } }
      </style>
    `;

    document.body.appendChild(overlay);

    // Eventos de respuesta
    overlay.querySelector('#modalOk').addEventListener('click', () => {
      overlay.remove();
      resolve(true);
    });
    overlay.querySelector('#modalCancelar').addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });

    // Cerrar al hacer clic fuera del card
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); resolve(false); }
    });
  });
}

/* ============================================================
   4. GUARD DE AUTENTICACIÓN
   Protege cualquier página que requiera sesión activa.
   Llamar al inicio de cada página protegida.
   ============================================================ */

/**
 * Verifica que exista un token JWT válido en sessionStorage.
 * Si no hay sesión, redirige al login automáticamente.
 * @param {number[]} rolesPermitidos - Array de ids de rol que pueden ver esta página.
 *                                     Si está vacío, cualquier rol autenticado puede entrar.
 * @returns {{ token, usuario, rol } | null} Datos de sesión o null si redirigió
 */
function requireAuth(rolesPermitidos = []) {
  const token   = sessionStorage.getItem('kika_token');
  const usuario = JSON.parse(sessionStorage.getItem('kika_usuario') || 'null');
  const rol     = parseInt(sessionStorage.getItem('kika_rol'));

  // Sin token → login
  if (!token || !usuario) {
    _redirigirLogin();
    return null;
  }

  // Verificar expiración del token (sin librería — decodifica el payload JWT)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      sessionStorage.clear();
      _redirigirLogin('Tu sesión ha expirado. Inicia sesión nuevamente.');
      return null;
    }
  } catch {
    // Token malformado
    sessionStorage.clear();
    _redirigirLogin();
    return null;
  }

  // Verificar rol si se especificaron restricciones
  if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(rol)) {
    _redirigirLogin('No tienes permiso para acceder a esta sección.');
    return null;
  }

  return { token, usuario, rol };
}

/**
 * Redirige al login. Si está dentro de un iframe, redirige el padre.
 * @param {string} [msg] - Mensaje opcional para mostrar en el login
 * @private
 */
function _redirigirLogin(msg = '') {
  const destino = window.parent !== window
    ? window.parent   // dentro de un iframe → redirigir página padre
    : window;

  // Calcular ruta relativa al login según la profundidad del archivo actual
  const depth   = window.location.pathname.split('/').filter(Boolean).length;
  const base    = depth > 2 ? '../'.repeat(depth - 1) : '';
  const loginUrl = `${base}index.html${msg ? '?msg=' + encodeURIComponent(msg) : ''}`;

  destino.location.href = loginUrl;
}

/**
 * Obtiene el token JWT.
 * Primero intenta leerlo del padre (cuando está en un iframe),
 * luego del sessionStorage.
 * @returns {string}
 */
function getToken() {
  return window.parent?.kikaToken || sessionStorage.getItem('kika_token') || '';
}

/* ============================================================
   5. HELPERS DE FORMULARIOS
   ============================================================ */

/**
 * Marca un campo como inválido y muestra su mensaje de error.
 * @param {string} id  - Id del campo (sin prefijo "err-")
 * @param {string} msg - Mensaje de error
 */
function setErr(id, msg) {
  const campo = document.getElementById(id);
  const error = document.getElementById('err-' + id);
  if (campo) campo.classList.add('error');
  if (error) { error.textContent = msg; error.style.display = 'block'; }
}

/**
 * Limpia todos los estados de error dentro de un formulario.
 * @param {HTMLFormElement} form
 */
function limpiarErrores(form) {
  if (!form) return;
  form.querySelectorAll('.field-input, .field-input').forEach(el => el.classList.remove('error'));
  form.querySelectorAll('.field-error, .error-msg').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
    el.classList.remove('show');
  });
}

/**
 * Modal de entrada de texto — reemplaza prompt() nativo.
 * @param {string} mensaje     - Pregunta al usuario
 * @param {string} placeholder - Texto de ayuda en el input
 * @returns {Promise<string|null>} Texto ingresado o null si canceló
 */
function pedirTexto(mensaje, placeholder = '') {
  return new Promise((resolve) => {
    const previo = document.getElementById('kikaPrompt');
    if (previo) previo.remove();

    const overlay = document.createElement('div');
    overlay.id = 'kikaPrompt';
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;
      background:rgba(0,0,0,.45);backdrop-filter:blur(2px);
      display:flex;align-items:center;justify-content:center;
      animation:fadeIn .15s ease;
    `;

    overlay.innerHTML = `
      <div style="
        background:#fff;border-radius:14px;padding:28px 28px 22px;
        max-width:380px;width:90%;box-shadow:0 12px 40px rgba(0,0,0,.18);
        animation:slideUp .18s ease;
      ">
        <p style="margin:0 0 14px;font-size:14px;font-weight:600;color:var(--text)">
          ${mensaje}
        </p>
        <input id="kikaPromptInput" type="text" placeholder="${placeholder}"
          style="width:100%;height:40px;padding:0 12px;border:1.5px solid var(--gray-mid);
                 border-radius:8px;font-family:inherit;font-size:14px;
                 background:var(--gray-lt);box-sizing:border-box;">
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px">
          <button id="kikaPromptCancelar" style="
            padding:8px 18px;border-radius:8px;border:1.5px solid var(--gray-mid);
            background:transparent;cursor:pointer;font-size:13px;font-weight:600;
            color:var(--text-sec);font-family:inherit;
          ">Cancelar</button>
          <button id="kikaPromptOk" style="
            padding:8px 18px;border-radius:8px;border:none;
            background:var(--teal);color:#fff;cursor:pointer;
            font-size:13px;font-weight:700;font-family:inherit;
          ">Aceptar</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector('#kikaPromptInput');
    input.focus();

    overlay.querySelector('#kikaPromptOk').addEventListener('click', () => {
      const val = input.value.trim();
      overlay.remove();
      resolve(val || null);
    });
    overlay.querySelector('#kikaPromptCancelar').addEventListener('click', () => {
      overlay.remove();
      resolve(null);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        overlay.remove();
        resolve(val || null);
      }
      if (e.key === 'Escape') {
        overlay.remove();
        resolve(null);
      }
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { overlay.remove(); resolve(null); }
    });
  });
}

window.confirmar  = confirmar;
window.pedirTexto = pedirTexto;
