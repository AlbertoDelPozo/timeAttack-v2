export interface Tramo {
    id: number;
    tiempo: number | null;
}

export interface Pasada {
    id: number;
    nombre: string;
    tramos: Tramo[];
    subtotal: number;
}

export interface Piloto {
    id: number;
    nombre: string;
    apellido: string;
    category: string;
    car: string;
    pasadas: Pasada[];
    total: number;
}