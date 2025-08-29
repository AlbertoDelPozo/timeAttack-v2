import type { Piloto, Pasada, Tramo } from "./types";

// Esta función solo necesita el número de tramos
export const crearPasadaInicial = (id: number, nombre: string, numTramos: number): Pasada => {
    const tramos: Tramo[] = [];
    for (let j = 0; j < numTramos; j++) {
        tramos.push({ id: j, tiempo: null });
    }
    return { id, nombre, tramos, subtotal: 0 };
};

// Esta función utiliza category y car, y llama a crearPasadaInicial correctamente
export const crearPilotoInicial = (
    id: number,
    nombre: string,
    apellido: string,
    numPasadas: number,
    numTramos: number,
    category: string,
    car: string
): Piloto => {
    const pasadas: Pasada[] = [];
    for (let i = 0; i < numPasadas; i++) {
        // Solo pasamos los 3 argumentos que crearPasadaInicial espera
        pasadas.push(crearPasadaInicial(i, `Pasada ${i + 1}`, numTramos));
    }
    return {
        id: id,
        nombre,
        apellido,
        category,
        car,
        pasadas,
        total: 0
    };
};

export const recalcularTotales = (piloto: Piloto): Piloto => {
    let totalGeneral = 0;
    const pasadasActualizadas = piloto.pasadas.map(pasada => {
        const subtotalPasada = pasada.tramos.reduce((acc, tramo) => acc + (tramo.tiempo || 0), 0);
        totalGeneral += subtotalPasada;
        return { ...pasada, subtotal: subtotalPasada };
    });
    return { ...piloto, pasadas: pasadasActualizadas, total: totalGeneral };
};