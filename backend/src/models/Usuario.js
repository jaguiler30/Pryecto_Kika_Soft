const db = require('../config/db');

// ============================================
// MODEL: Usuario
// Representa la tabla USUARIO de la BD
// Solo sabe leer y escribir en la base de datos
// ============================================
class Usuario {

    constructor(data = {}) {
        this.idUSUARIO = data.idUSUARIO || null;
        this.Nombre    = data.Nombre    || null;
        this.Email     = data.Email     || null;
        this.Password  = data.Password  || null;
        this.Activo    = data.Activo    ?? 1;
        this.Rol       = data.Rol       || null;
        // FIX: el JOIN devuelve r.idROL, no ROL_idROL — aceptamos ambos
        this.ROL_idROL = data.ROL_idROL ?? data.idROL ?? null;
    }

    // ------------------------------------------
    // CREAR un nuevo usuario
    // ------------------------------------------
    async save() {
        const sql = `
            INSERT INTO USUARIO (Nombre, Email, Password, Activo, ROL_idROL)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await db.execute(sql, [
            this.Nombre,
            this.Email,
            this.Password,
            this.Activo,
            this.ROL_idROL,
        ]);
        this.idUSUARIO = result.insertId;
        return this;
    }

    // ------------------------------------------
    // BUSCAR todos los usuarios (con nombre del rol)
    // ------------------------------------------
    static async findAll() {
        const sql = `
            SELECT u.idUSUARIO, u.Nombre, u.Email, u.Activo,
                   r.idROL, r.Nombre AS Rol
            FROM USUARIO u
            INNER JOIN ROL r ON u.ROL_idROL = r.idROL
            ORDER BY u.Nombre ASC
        `;
        const rows = await db.query(sql);
        return rows.map(row => new Usuario(row));
    }

    // ------------------------------------------
    // BUSCAR por ID
    // ------------------------------------------
    static async findById(id) {
        const sql = `
            SELECT u.idUSUARIO, u.Nombre, u.Email, u.Activo,
                   r.idROL, r.Nombre AS Rol
            FROM USUARIO u
            INNER JOIN ROL r ON u.ROL_idROL = r.idROL
            WHERE u.idUSUARIO = ?
        `;
        const rows = await db.query(sql, [id]);
        if (rows.length === 0) return null;
        return new Usuario(rows[0]);
    }

    // ------------------------------------------
    // BUSCAR por Email (para login)
    // ------------------------------------------
    static async findByEmail(email) {
        const sql = `
            SELECT u.idUSUARIO, u.Nombre, u.Email, u.Password,
                   u.Activo, r.idROL, r.Nombre AS Rol
            FROM USUARIO u
            INNER JOIN ROL r ON u.ROL_idROL = r.idROL
            WHERE u.Email = ?
        `;
        const rows = await db.query(sql, [email]);
        if (rows.length === 0) return null;
        return new Usuario(rows[0]);
    }

    // ------------------------------------------
    // ACTUALIZAR usuario
    // ------------------------------------------
    async update() {
        const sql = `
            UPDATE USUARIO
            SET Nombre    = ?,
                Email     = ?,
                Activo    = ?,
                ROL_idROL = ?
            WHERE idUSUARIO = ?
        `;
        await db.execute(sql, [
            this.Nombre,
            this.Email,
            this.Activo,
            this.ROL_idROL,
            this.idUSUARIO,
        ]);
        return this;
    }

    // ------------------------------------------
    // CAMBIAR contraseña (separado por seguridad)
    // ------------------------------------------
    async updatePassword(hashedPassword) {
        const sql = `UPDATE USUARIO SET Password = ? WHERE idUSUARIO = ?`;
        await db.execute(sql, [hashedPassword, this.idUSUARIO]);
    }

    // ------------------------------------------
    // BLOQUEAR / DESBLOQUEAR (Activo: 0 o 1)
    // ------------------------------------------
    static async toggleActivo(id, estado) {
        const sql = `UPDATE USUARIO SET Activo = ? WHERE idUSUARIO = ?`;
        await db.execute(sql, [estado, id]);
    }

    // ------------------------------------------
    // ELIMINAR usuario
    // ------------------------------------------
    static async delete(id) {
        const sql = `DELETE FROM USUARIO WHERE idUSUARIO = ?`;
        await db.execute(sql, [id]);
    }

    // ------------------------------------------
    // toJSON — oculta Password, siempre incluye ROL_idROL
    // ------------------------------------------
    toJSON() {
        return {
            idUSUARIO:  this.idUSUARIO,
            Nombre:     this.Nombre,
            Email:      this.Email,
            Activo:     this.Activo,
            ROL_idROL:  this.ROL_idROL,
            Rol:        this.Rol,
            // Password NUNCA se incluye
        };
    }

} // ← cierre de la clase Usuario

module.exports = Usuario;