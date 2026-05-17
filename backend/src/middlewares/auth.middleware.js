const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_cambiar_en_produccion';

// ============================================
// MIDDLEWARE: authMiddleware
// Verifica el JWT en cada petición protegida
// Si el token es válido, agrega req.usuario
// ============================================
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token)
        return res.status(401).json({ ok: false, message: 'Token requerido' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded; // { id, nombre, rol }
        next();
    } catch (err) {
        return res.status(403).json({ ok: false, message: 'Token inválido o expirado' });
    }
};

// ============================================
// MIDDLEWARE: rolesMiddleware
// Restringe acceso según el rol del usuario
// Uso: rolesMiddleware(1, 4) — solo admin y rol 1
// ============================================
const rolesMiddleware = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario)
            return res.status(401).json({ ok: false, message: 'No autenticado' });

        if (!rolesPermitidos.includes(req.usuario.rol))
            return res.status(403).json({ ok: false, message: 'No tienes permiso para esta acción' });

        next();
    };
};

module.exports = { authMiddleware, rolesMiddleware };
