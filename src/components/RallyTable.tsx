import React, {useState, useCallback, useEffect} from "react";
import type { Piloto, Pasada, Tramo } from "../types";
import PilotoRow from "../PilotoRow"; // Asegúrate de importar PilotoRow

const NUM_PASADAS = 3;
const NUM_TRAMOS_POR_PASADA = 5;

const crearPilotoInicial = (id: number, nombre: string, apellido: string): Piloto => {
    const pasadas: Pasada[] = [];
    for (let i = 0; i < NUM_PASADAS; i++) {
        const tramos: Tramo[] = [];
        for (let j = 0; j < NUM_TRAMOS_POR_PASADA; j++) {
            tramos.push({ id: j, tiempo: null });
        }
        pasadas.push({ id: i, nombre: `Pasada ${i}`, tramos, subtotal: 0 });
    }
    return {
        id: id,
        nombre,
        apellido,
        pasadas,
        total: 0
    };
};

const initialState: Piloto[] = [
    crearPilotoInicial(1, 'Carlos', 'Sainz'),
    crearPilotoInicial(2, 'Sébastien', 'Loeb'),
];

const RallyTable: React.FC = () => {
    const [pilotos, setPilotos] = useState<Piloto[]>(() => {
        // We get the data form localStorage
        const savedPilotos = localStorage.getItem('pilotos');
        //if there is data we parse it, and return it
        if (savedPilotos) {
            return JSON.parse(savedPilotos);
        }
        return initialState;
        }
    );
    const [nuevoPilotoNombre, setNuevoPilotoNombre] = useState('');
    const [nuevoPilotoApellido, setNuevoPilotoApellido] = useState('');

    // Hook to save racers when it changes
    useEffect(() => {
        //We save the data in localStorage
        localStorage.setItem('pilotos', JSON.stringify(pilotos));
    }, [pilotos]);

    const recalcularTotales = (piloto: Piloto): Piloto => {
        let totalGeneral = 0;
        const pasadasActualizadas = piloto.pasadas.map(pasada => {
            const subtotalPasada = pasada.tramos.reduce((acc, tramo) => acc + (tramo.tiempo || 0), 0);
            totalGeneral += subtotalPasada;
            return { ...pasada, subtotal: subtotalPasada };
        });
        return { ...piloto, pasadas: pasadasActualizadas, total: totalGeneral };
    };

    const handleTimeChange = useCallback((pilotoId: number, pasadaId: number, tramoId: number, tiempo: number | null) => {
        setPilotos(pilotosActuales => {
            const pilotosModificados = pilotosActuales.map(p => {
                if (p.id === pilotoId) {
                    const pilotoActualizado = {
                        ...p,
                        pasadas: p.pasadas.map(pas => ({
                            ...pas,
                            tramos: pas.tramos.map(t => ({ ...t }))
                        }))
                    };
                    const pasadaAActualizar = pilotoActualizado.pasadas.find(pas => pas.id === pasadaId);
                    if (pasadaAActualizar) {
                        const tramoAActualizar = pasadaAActualizar.tramos.find(t => t.id === tramoId);
                        if (tramoAActualizar) {
                            tramoAActualizar.tiempo = tiempo;
                        }
                    }
                    return recalcularTotales(pilotoActualizado);
                }
                return p;
            });
            return pilotosModificados.sort((a, b) => a.total - b.total);
        });
    }, [recalcularTotales]);

    const handleAddPiloto = () => {
        if (nuevoPilotoNombre.trim() === '' || nuevoPilotoApellido.trim() === '') return;
        const nuevoPiloto = crearPilotoInicial(Date.now(), nuevoPilotoNombre, nuevoPilotoApellido);
        setPilotos([...pilotos, nuevoPiloto]);
        setNuevoPilotoNombre('');
        setNuevoPilotoApellido('');
    };

    const handleDeletePiloto = useCallback((pilotoId: number) => {
        setPilotos(pilotosActuales => pilotosActuales.filter(p => p.id !== pilotoId));
    }, []);

    const tableHeaders = [];
    for (let i = 0; i < NUM_PASADAS; i++) {
        for (let j = 0; j < NUM_TRAMOS_POR_PASADA; j++) {
            tableHeaders.push(`Tramo ${j + 1} - Pasada ${i + 1}`);
        }
        tableHeaders.push(`Subtotal Pasada ${i + 1}`);
    }

    // Este 'return' debe estar dentro del componente RallyTable
    return (
        <div className="rally-container">
            <h1>Clasificación Rally Slot</h1>
            <table>
                <thead>
                    <tr>
                        <th>Piloto</th>
                        {tableHeaders.map(header => <th key={header}>{header}</th>)}
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {pilotos.map(piloto => (
                        <PilotoRow
                            key={piloto.id}
                            piloto={piloto}
                            onTimeChange={handleTimeChange}
                            onDeletePiloto={handleDeletePiloto}
                        />
                    ))}
                </tbody>
            </table>
            <div className="add-piloto">
                <input 
                    type="text" 
                    value={nuevoPilotoNombre}
                    onChange={(e) => setNuevoPilotoNombre(e.target.value)}
                    placeholder="Nombre del nuevo piloto"
                />
                <input 
                    type="text" 
                    value={nuevoPilotoApellido}
                    onChange={(e) => setNuevoPilotoApellido(e.target.value)}
                    placeholder="Apellido del nuevo piloto"
                />
                <button onClick={handleAddPiloto}>Añadir Piloto</button>
            </div>
        </div>
    );
};

export default RallyTable;