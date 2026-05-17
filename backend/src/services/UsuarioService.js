const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const Usuario   = require('../models/Usuario');
const Historial = require('../models/Historial');

const SALT_ROUNDS = 10;
const JWT_SECRET  = process.env.JWT_SECRET  || 'clave_secreta_cambiar_en_produccion';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

class UsuarioService {

    // ------------------------------------------
    // LOGIN
    // ------------------------------------------
    static async login(email, password, rolSeleccionado) {
        if (!email || !password)
            throw new Error('Email y contraseña son requeridos');

        const usuario = await Usuario.findByEmail(email);
        if (!usuario)
            throw new Error('Credenciales incorrectas');

        if (!usuario.Activo)
            throw new Error('Usuario bloqueado. Contacte al administrador');

        const passwordValido = await bcrypt.compare(password, usuario.Password);
        if (!passwordValido)
            throw new Error('Credenciales incorrectas');

        const rolId = usuario.ROL_idROL ?? usuario.idROL;

        if (parseInt(rolSeleccionado) !== parseInt(rolId))
            throw new Error('El perfil seleccionado no corresponde a tu usuario');

        const token = jwt.sign(
            { id: usuario.idUSUARIO, nombre: usuario.Nombre, rol: rolId },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        const usuarioSeguro = {
            idUSUARIO:  usuario.idUSUARIO,
            Nombre:     usuario.Nombre,
            Email:      usuario.Email,
            Activo:     usuario.Activo,
            ROL_idROL:  rolId,
            Rol:        usuario.Rol,
        };

        return { usuario: usuarioSeguro, token };
    }

    // ------------------------------------------
    // OBTENER TODOS LOS USUARIOS
    // ------------------------------------------
    static async getAll() {
        return await Usuario.findAll();
    }

    // ------------------------------------------
    // OBTENER USUARIO POR ID
    // ------------------------------------------
    static async getById(id) {
        const usuario = await Usuario.findById(id);
        if (!usuario) throw new Error('Usuario no encontrado');
        return usuario;
    }

    // ------------------------------------------
    // CREAR USUARIO
    // ------------------------------------------
    static async crear(data, usuarioQueCreo) {
        if (!data.Nombre || !data.Email || !data.Password || !data.ROL_idROL)
            throw new Error('Nombre, Email, Password y Rol son requeridos');

        const existe = await Usuario.findByEmail(data.Email);
        if (existe) throw new Error('El email ya está registrado');

        const hash = await bcrypt.hash(data.Password, SALT_ROUNDS);

        const nuevo = new Usuario({
            Nombre:    data.Nombre,
            Email:     data.Email,
            Password:  hash,
            Activo:    1,
            ROL_idROL: data.ROL_idROL,
        });
        await nuevo.save();

        await Historial.registrar({
            tabla:          'USUARIO',
            registro_id:    nuevo.idUSUARIO,
            campo:          'creacion',
            valor_anterior: null,
            valor_nuevo:    nuevo.Nombre,
            accion:         'INSERT',
            usuario_id:     usuarioQueCreo,
        });

        return nuevo.toJSON();
    }

    // ------------------------------------------
    // MODIFICAR USUARIO
    // ------------------------------------------
    static async modificar(id, data, usuarioQueModifico) {
        const usuario = await Usuario.findById(id);
        if (!usuario) throw new Error('Usuario no encontrado');

        const nombreAnterior = usuario.Nombre;
        const rolAnterior    = usuario.ROL_idROL;

        usuario.Nombre    = data.Nombre    ?? usuario.Nombre;
        usuario.Email     = data.Email     ?? usuario.Email;
        usuario.ROL_idROL = data.ROL_idROL ?? usuario.ROL_idROL;
        await usuario.update();

        if (data.Nombre && data.Nombre !== nombreAnterior) {
            await Historial.registrar({
                tabla: 'USUARIO', registro_id: id,
                campo: 'Nombre', valor_anterior: nombreAnterior, valor_nuevo: data.Nombre,
                accion: 'UPDATE', usuario_id: usuarioQueModifico,
            });
        }
        if (data.ROL_idROL && data.ROL_idROL !== rolAnterior) {
            await Historial.registrar({
                tabla: 'USUARIO', registro_id: id,
                campo: 'ROL_idROL', valor_anterior: rolAnterior, valor_nuevo: data.ROL_idROL,
                accion: 'UPDATE', usuario_id: usuarioQueModifico,
            });
        }

        return usuario.toJSON();
    }

    // ------------------------------------------
    // CAMBIAR CONTRASEÑA
    // ------------------------------------------
    static async cambiarPassword(id, passwordActual, passwordNueva, usuarioQueModifico) {
        const usuario = await Usuario.findByEmail(
            (await Usuario.findById(id)).Email
        );

        const valido = await bcrypt.compare(passwordActual, usuario.Password);
        if (!valido) throw new Error('La contraseña actual es incorrecta');

        const hash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
        await usuario.updatePassword(hash);

        await Historial.registrar({
            tabla: 'USUARIO', registro_id: id,
            campo: 'Password', valor_anterior: '***', valor_nuevo: '***',
            accion: 'UPDATE', usuario_id: usuarioQueModifico,
        });
    }

    // ------------------------------------------
    // BLOQUEAR USUARIO
    // ------------------------------------------
    static async bloquear(id, usuarioQueBloqueo) {
        const usuario = await Usuario.findById(id);
        if (!usuario) throw new Error('Usuario no encontrado');

        await Usuario.toggleActivo(id, 0);

        await Historial.registrar({
            tabla: 'USUARIO', registro_id: id,
            campo: 'Activo', valor_anterior: '1', valor_nuevo: '0',
            accion: 'UPDATE', usuario_id: usuarioQueBloqueo,
        });
    }

    // ------------------------------------------
    // DESBLOQUEAR USUARIO
    // ------------------------------------------
    static async desbloquear(id, usuarioQueDesbloqueo) {
        const usuario = await Usuario.findById(id);
        if (!usuario) throw new Error('Usuario no encontrado');

        await Usuario.toggleActivo(id, 1);

        await Historial.registrar({
            tabla: 'USUARIO', registro_id: id,
            campo: 'Activo', valor_anterior: '0', valor_nuevo: '1',
            accion: 'UPDATE', usuario_id: usuarioQueDesbloqueo,
        });
    }

    // ------------------------------------------
    // ELIMINAR USUARIO
    // ------------------------------------------
    static async eliminar(id, usuarioQueElimino) {
        const usuario = await Usuario.findById(id);
        if (!usuario) throw new Error('Usuario no encontrado');

        await Historial.registrar({
            tabla: 'USUARIO', registro_id: id,
            campo: 'eliminacion', valor_anterior: usuario.Nombre, valor_nuevo: null,
            accion: 'DELETE', usuario_id: usuarioQueElimino,
        });

        await Usuario.delete(id);
    }
}

module.exports = UsuarioService;