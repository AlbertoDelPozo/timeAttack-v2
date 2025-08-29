import React, { useState, useCallback, useEffect, createContext, useContext } from "react";
import type { Piloto } from "./types";
import { crearPilotoInicial, recalcularTotales } from './utils';

// Se define la interfaz del contexto para asegurar la tipificación correcta
interface RallyDataContextType {
    pilotos: Piloto[];
    setPilotos: React.Dispatch<React.SetStateAction<Piloto[]>>;
    numPasadas: number;
    numTramos: number;
    startNewRally: (pasadas: number, tramos: number) => void;
    nuevoPilotoNombre: string;
    setNuevoPilotoNombre: React.Dispatch<React.SetStateAction<string>>;
    nuevoPilotoApellido: string;
    setNuevoPilotoApellido: React.Dispatch<React.SetStateAction<string>>;
    nuevoPilotoCategory: string;
    setNuevoPilotoCategory: React.Dispatch<React.SetStateAction<string>>;
    nuevoPilotoCar: string;
    setNuevoPilotoCar: React.Dispatch<React.SetStateAction<string>>;
    isModalOpen: boolean;
    setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    pilotoToDelete: Piloto | null;
    handleTimeChange: (pilotoId: number, pasadaId: number, tramoId: number, tiempo: number | null) => void;
    handleAddPiloto: () => void;
    openModalForDeletion: (piloto: Piloto) => void;
    handleDeletePiloto: () => void;
    selectedPasada: number | null;
    setSelectedPasada: React.Dispatch<React.SetStateAction<number | null>>;
    modoVista: 'edicion' | 'lectura';
    setModoVista: React.Dispatch<React.SetStateAction<'edicion' | 'lectura'>>;
}

// Se crea el contexto, que se utilizará internamente en el proveedor
const RallyDataContext = createContext<RallyDataContextType | undefined>(undefined);

// Este es el hook principal que los componentes usarán para acceder al contexto
export const useRallyData = () => {
    const context = useContext(RallyDataContext);
    if (context === undefined) {
        throw new Error('useRallyData must be used within a RallyDataProvider');
    }
    return context;
};

// Este es el componente proveedor que envuelve la aplicación
export const RallyDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [numPasadas, setNumPasadas] = useState(0);
    const [numTramos, setNumTramos] = useState(0);

    const [pilotos, setPilotos] = useState<Piloto[]>(() => {
        try {
            const savedConfig = localStorage.getItem('rallyConfig');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                setNumPasadas(config.pasadas);
                setNumTramos(config.tramos);
            }
            const savedPilotos = localStorage.getItem('pilotos');
            if (savedPilotos) {
                return JSON.parse(savedPilotos);
            }
        } catch (error) {
            console.error("Error al cargar datos de localStorage:", error);
        }
        return [];
    });

    const [nuevoPilotoNombre, setNuevoPilotoNombre] = useState('');
    const [nuevoPilotoApellido, setNuevoPilotoApellido] = useState('');
    const [nuevoPilotoCategory, setNuevoPilotoCategory] = useState('');
    const [nuevoPilotoCar, setNuevoPilotoCar] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pilotoToDelete, setPilotoToDelete] = useState<Piloto | null>(null);

    const [selectedPasada, setSelectedPasada] = useState<number | null>(0);
    const [modoVista, setModoVista] = useState<'edicion' | 'lectura'>('edicion');

    useEffect(() => {
        localStorage.setItem('pilotos', JSON.stringify(pilotos));
    }, [pilotos]);

    const startNewRally = useCallback((pasadas: number, tramos: number) => {
        setNumPasadas(pasadas);
        setNumTramos(tramos);
        setPilotos([]);
        localStorage.setItem('pilotos', JSON.stringify([]));
        localStorage.setItem('rallyConfig', JSON.stringify({ pasadas, tramos }));
    }, []);

    const handleTimeChange = useCallback((pilotoId: number, pasadaId: number, tramoId: number, tiempo: number | null) => {
        setPilotos(pilotosActuales => {
            const pilotosModificados = pilotosActuales.map(p => {
                if (p.id === pilotoId) {
                    const pilotoActualizado = {
                        ...p,
                        pasadas: p.pasadas.map(pas => {
                            if (pas.id === pasadaId) {
                                return {
                                    ...pas,
                                    tramos: pas.tramos.map(t => {
                                        if (t.id === tramoId) {
                                            return { ...t, tiempo: tiempo };
                                        }
                                        return t;
                                    })
                                };
                            }
                            return pas;
                        })
                    };
                    return recalcularTotales(pilotoActualizado);
                }
                return p;
            });
            return pilotosModificados.sort((a, b) => (a.total - b.total) || a.nombre.localeCompare(b.nombre));
        });
    }, []);

    const handleAddPiloto = useCallback(() => {
        if (nuevoPilotoNombre.trim() === '' || nuevoPilotoApellido.trim() === '') return;
        const nuevoPiloto = crearPilotoInicial(Date.now(), nuevoPilotoNombre, nuevoPilotoApellido, numPasadas, numTramos, nuevoPilotoCategory, nuevoPilotoCar);
        setPilotos([...pilotos, nuevoPiloto]);
        setNuevoPilotoNombre('');
        setNuevoPilotoApellido('');
        setNuevoPilotoCategory('');
        setNuevoPilotoCar('');
    }, [nuevoPilotoNombre, nuevoPilotoApellido, nuevoPilotoCategory, nuevoPilotoCar, pilotos, numPasadas, numTramos]);

    const openModalForDeletion = useCallback((piloto: Piloto) => {
        setPilotoToDelete(piloto);
        setIsModalOpen(true);
    }, []);

    const handleDeletePiloto = useCallback(() => {
        if (pilotoToDelete) {
            setPilotos(pilotosActuales => pilotosActuales.filter(p => p.id !== pilotoToDelete.id));
            setIsModalOpen(false);
            setPilotoToDelete(null);
        }
    }, [pilotoToDelete]);

    const value = {
        pilotos,
        setPilotos,
        numPasadas,
        numTramos,
        startNewRally,
        nuevoPilotoNombre,
        setNuevoPilotoNombre,
        nuevoPilotoApellido,
        setNuevoPilotoApellido,
        nuevoPilotoCategory,
        setNuevoPilotoCategory,
        nuevoPilotoCar,
        setNuevoPilotoCar,
        isModalOpen,
        setIsModalOpen,
        pilotoToDelete,
        handleTimeChange,
        handleAddPiloto,
        openModalForDeletion,
        handleDeletePiloto,
        selectedPasada,
        setSelectedPasada,
        modoVista,
        setModoVista,
    };

    return (
        <RallyDataContext.Provider value={value}>
            {children}
        </RallyDataContext.Provider>
    );
};