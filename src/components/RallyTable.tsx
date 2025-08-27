// src/RallyTable.tsx

import React, { useMemo } from "react";
import PilotoRow from "../PilotoRow";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal.tsx";
import { useRallyData } from "../useRallyData.ts";

const RallyTable: React.FC = () => {
    const {
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
        modoVista,
        setModoVista,
    } = useRallyData();

    const pasadasDisponibles = pilotos[0]?.pasadas || [];

    const fastestTimes = useMemo(() => {
        if (modoVista === 'edicion' || selectedPasada === null) {
            return {};
        }

        const tiemposPorTramo: { [tramoId: number]: number[] } = {};

        pilotos.forEach(piloto => {
            const pasada = piloto.pasadas.find(p => p.id === selectedPasada);
            if (pasada) {
                pasada.tramos.forEach(tramo => {
                    if (tramo.tiempo !== null) {
                        if (!tiemposPorTramo[tramo.id]) {
                            tiemposPorTramo[tramo.id] = [];
                        }
                        tiemposPorTramo[tramo.id].push(tramo.tiempo);
                    }
                });
            }
        });

        const tiemposMasRapidos: { [tramoId: number]: number } = {};

        for (const tramoId in tiemposPorTramo) {
            if (tiemposPorTramo[tramoId].length > 0) {
                tiemposMasRapidos[tramoId] = Math.min(...tiemposPorTramo[tramoId]);
            }
        }

        return tiemposMasRapidos;
    }, [pilotos, modoVista, selectedPasada]);

    return (
        <div className="flex flex-col items-center p-2 sm:p-4 lg:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">
                Clasificación Rally Slot
            </h1>

            <div className="mb-4 w-full max-w-lg mx-auto flex items-center gap-2">
                <label htmlFor="vista-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Modo:
                </label>
                <select
                    id="vista-select"
                    className="appearance-none block w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={modoVista}
                    onChange={(e) => setModoVista(e.target.value as 'edicion' | 'lectura')}
                >
                    <option value="edicion">Edición</option>
                    <option value="lectura">Solo Lectura</option>
                </select>
            </div>

            <div className="mb-4 w-full max-w-lg mx-auto flex items-center gap-2">
                <label htmlFor="pasada-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Ver:
                </label>
                <div className="relative flex-grow">
                    <select
                        id="pasada-select"
                        className="appearance-none block w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        value={selectedPasada === null ? "" : selectedPasada}
                        onChange={(e) =>
                            setSelectedPasada(e.target.value === "" ? null : Number(e.target.value))
                        }
                    >
                        <option value="">Total General</option>
                        {pasadasDisponibles.map((pasada) => (
                            <option key={pasada.id} value={pasada.id}>
                                {pasada.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto w-full border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                Piloto
                            </th>
                            {selectedPasada === null ? (
                                <>
                                    {pasadasDisponibles.map((pasada) => (
                                        <th key={pasada.id} className="px-2 py-2 sm:px-3 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                            {pasada.nombre}
                                        </th>
                                    ))}
                                    <th className="px-3 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Total
                                    </th>
                                </>
                            ) : (
                                <>
                                    {pilotos[0].pasadas[selectedPasada].tramos.map((_, index) => (
                                        <th key={index} className="px-2 py-2 sm:px-3 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                            Tramo {index + 1}
                                        </th>
                                    ))}
                                    <th className="px-2 py-2 sm:px-3 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Subtotal
                                    </th>
                                </>
                            )}
                            {modoVista === 'edicion' && (
                                <th className="relative px-3 py-2 sm:px-4 sm:py-3">
                                    <span className="sr-only">Eliminar</span>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {pilotos.map((piloto) => (
                            <PilotoRow
                                key={piloto.id}
                                piloto={piloto}
                                onTimeChange={handleTimeChange}
                                onDeletePiloto={openModalForDeletion}
                                selectedPasada={selectedPasada}
                                isReadOnly={modoVista === 'lectura'}
                                fastestTimes={fastestTimes}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {modoVista === 'edicion' && (
                <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-4 w-full max-w-lg mx-auto">
                    <input
                        type="text"
                        className="flex-grow rounded-md border border-gray-300 p-2 text-sm focus:ring focus:ring-blue-200 focus:border-blue-500"
                        value={nuevoPilotoNombre}
                        onChange={(e) => setNuevoPilotoNombre(e.target.value)}
                        placeholder="Nombre"
                    />
                    <input
                        type="text"
                        className="flex-grow rounded-md border border-gray-300 p-2 text-sm focus:ring focus:ring-blue-200 focus:border-blue-500"
                        value={nuevoPilotoApellido}
                        onChange={(e) => setNuevoPilotoApellido(e.target.value)}
                        placeholder="Apellido"
                    />
                    <button
                        onClick={handleAddPiloto}
                        className="w-full sm:w-auto bg-blue-600 text-white font-semibold rounded-md p-2 text-sm transition-colors hover:bg-blue-700 whitespace-nowrap"
                    >
                        Añadir Piloto
                    </button>
                </div>
            )}

            <DeleteConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDeletePiloto}
                pilotoName={
                    pilotoToDelete
                        ? `${pilotoToDelete.nombre} ${pilotoToDelete.apellido}`
                        : ""
                }
            />
        </div>
    );
};

export default RallyTable;