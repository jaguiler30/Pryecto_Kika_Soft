const ColeccionModel = require('../models/ColeccionModel');

class ColeccionService {

    static async getAll() {
        return ColeccionModel.getAll();
    }

    static async getById(id) {
        const col = await ColeccionModel.getById(id);
        if (!col) throw new Error('Colección no encontrada');
        return col;
    }

    static async crear(data, usuarioId) {
        const { NombreColeccion, Temporada, Año } = data;
        if (!NombreColeccion) throw new Error('El nombre de la colección es obligatorio');
        if (!Temporada)       throw new Error('La temporada es obligatoria');
        if (!Año)             throw new Error('El año es obligatorio');

        const id = await ColeccionModel.crear({ NombreColeccion, Temporada, Año });
        return ColeccionModel.getById(id);
    }

    static async actualizar(id, data, usuarioId) {
        await ColeccionService.getById(id); // valida que existe
        const { NombreColeccion, Temporada, Año } = data;
        if (!NombreColeccion) throw new Error('El nombre es obligatorio');
        await ColeccionModel.actualizar(id, { NombreColeccion, Temporada, Año });
        return ColeccionModel.getById(id);
    }

static async eliminar(id, usuarioId) {
        await ColeccionService.getById(id); // valida que existe
        return ColeccionModel.eliminar(id);
    }

    static async getPrendas(id) {
        await ColeccionService.getById(id); // valida que la colección existe
        return ColeccionModel.getPrendasByColeccion(id);
    }
}

module.exports = ColeccionService;