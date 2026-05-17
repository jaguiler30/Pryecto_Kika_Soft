const datosMock = [
    {
        fecha: "2026-04-10",
        taller: "Taller 1",
        tipo: "produccion",
        descripcion: "Camisetas",
        cantidad: 100
    },
    {
        fecha: "2026-04-09",
        taller: "Taller 2",
        tipo: "entrega",
        descripcion: "Tela",
        cantidad: 50
    },
    {
        fecha: "2026-04-08",
        taller: "Taller 1",
        tipo: "devolucion",
        descripcion: "Hilo",
        cantidad: 20
    }
];

function consultarDatos() {

    const taller = document.getElementById("filtroTaller").value;
    const fecha = document.getElementById("filtroFecha").value;
    const tipo = document.getElementById("filtroTipo").value;

    let resultados = datosMock.filter(item => {

        return (
            (taller === "" || item.taller === taller) &&
            (fecha === "" || item.fecha === fecha) &&
            (tipo === "" || item.tipo === tipo)
        );

    });

    renderTabla(resultados);
}

function renderTabla(datos) {

    const tbody = document.querySelector("#tablaResultados tbody");
    tbody.innerHTML = "";

    if (datos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">No hay resultados</td></tr>`;
        return;
    }

    datos.forEach(item => {

        const fila = `
            <tr>
                <td>${item.fecha}</td>
                <td>${item.taller}</td>
                <td>${item.tipo}</td>
                <td>${item.descripcion}</td>
                <td>${item.cantidad}</td>
            </tr>
        `;

        tbody.innerHTML += fila;
    });
}