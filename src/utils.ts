// src/utils.ts

import type { Piloto, Pasada, Tramo } from "./types";

const NUM_PASADAS = 3;
const NUM_TRAMOS_POR_PASADA = 5;

// Función para crear un piloto con su estructura inicial
export const crearPilotoInicial = (id: number, nombre: string, apellido: string): Piloto => {
    const pasadas: Pasada[] = [];
    for (let i = 0; i < NUM_PASADAS; i++) {
        const tramos: Tramo[] = [];
        for (let j = 0; j < NUM_TRAMOS_POR_PASADA; j++) {
            tramos.push({ id: j, tiempo: null });
        }
        pasadas.push({ id: i, nombre: `Pasada ${i + 1}`, tramos, subtotal: 0 });
    }
    return {
        id: id,
        nombre,
        apellido,
        pasadas,
        total: 0
    };
};

// Datos iniciales de pilotos
export const initialState: Piloto[] = [
    crearPilotoInicial(1, 'Carlos', 'Sainz'),
    crearPilotoInicial(2, 'Sébastien', 'Loeb'),
];

// Función para recalcular los totales de un piloto
export const recalcularTotales = (piloto: Piloto): Piloto => {
    let totalGeneral = 0;
    const pasadasActualizadas = piloto.pasadas.map(pasada => {
        const subtotalPasada = pasada.tramos.reduce((acc, tramo) => acc + (tramo.tiempo || 0), 0);
        totalGeneral += subtotalPasada;
        return { ...pasada, subtotal: subtotalPasada };
    });
    return { ...piloto, pasadas: pasadasActualizadas, total: totalGeneral };
};

// Función para generar los encabezados de la tabla
export const generarTableHeaders = (): string[] => {
    const headers = [];
    for (let i = 0; i < NUM_PASADAS; i++) {
        for (let j = 0; j < NUM_TRAMOS_POR_PASADA; j++) {
            headers.push(`Tramo ${j + 1} - Pasada ${i + 1}`);
        }
        headers.push(`Subtotal Pasada ${i + 1}`);
    }
    return headers;
};