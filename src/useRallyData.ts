// src/useRallyData.ts

import { useState, useCallback, useEffect } from "react";
import type { Piloto } from "./types";
import { crearPilotoInicial, initialState, recalcularTotales } from './utils';

export const useRallyData = () => {
    // Estados
    const [pilotos, setPilotos] = useState<Piloto[]>(() => {
        try {
            const savedPilotos = localStorage.getItem('pilotos');
            if (savedPilotos) {
                return JSON.parse(savedPilotos);
            }
        } catch (error) {
            console.error("Error al cargar datos de localStorage:", error);
        }
        return initialState;
    });

    const [nuevoPilotoNombre, setNuevoPilotoNombre] = useState('');
    const [nuevoPilotoApellido, setNuevoPilotoApellido] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pilotoToDelete, setPilotoToDelete] = useState<Piloto | null>(null);

    const [selectedPasada, setSelectedPasada] = useState<number | null>(0);
    // Efecto para guardar en localStorage
    useEffect(() => {
        localStorage.setItem('pilotos', JSON.stringify(pilotos));
    }, [pilotos]);

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
                                        // Si encontramos el tramo, creamos un nuevo objeto con el tiempo actualizado
                                        if (t.id === tramoId) {
                                            return { ...t, tiempo: tiempo };
                                        }
                                        return t; // Devolvemos el tramo sin cambios
                                    })
                                };
                            }
                            return pas; // Devolvemos la pasada sin cambios
                        })
                    };
                    return recalcularTotales(pilotoActualizado);
                }
                return p;
            });
            // Sigue ordenando los pilotos como lo hacías antes
            return pilotosModificados.sort((a, b) => (a.total - b.total) || a.nombre.localeCompare(b.nombre));
        });
    }, []);

    const handleAddPiloto = useCallback(() => {
        if (nuevoPilotoNombre.trim() === '' || nuevoPilotoApellido.trim() === '') return;
        const nuevoPiloto = crearPilotoInicial(Date.now(), nuevoPilotoNombre, nuevoPilotoApellido);
        setPilotos([...pilotos, nuevoPiloto]);
        setNuevoPilotoNombre('');
        setNuevoPilotoApellido('');
    }, [nuevoPilotoNombre, nuevoPilotoApellido, pilotos]);

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

    // Devolvemos todos los datos y funciones que el componente de la tabla necesita
    return {
        pilotos,
        nuevoPilotoNombre,
        setNuevoPilotoNombre,
        nuevoPilotoApellido,
        setNuevoPilotoApellido,
        isModalOpen,
        setIsModalOpen,
        pilotoToDelete,
        handleTimeChange,
        handleAddPiloto,
        openModalForDeletion,
        handleDeletePiloto,
        selectedPasada,
        setSelectedPasada,
    };
};