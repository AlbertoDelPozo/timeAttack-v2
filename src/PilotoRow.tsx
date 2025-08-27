// src/PilotoRow.tsx

import React from "react";
import type { Piloto, Pasada } from "./types";
import { TrashIcon } from '@heroicons/react/24/outline';

interface PilotoRowProps {
    piloto: Piloto;
    onTimeChange: (pilotoId: number, pasadaId: number, tramoId: number, tiempo: number | null) => void;
    onDeletePiloto: (piloto: Piloto) => void;
    selectedPasada: number | null;
    isReadOnly: boolean;
    fastestTimes: { [tramoId: number]: number };
}

// Función auxiliar para redondear a 2 decimales y evitar errores de precisión
const roundToTwoDecimals = (num: number): number => {
    return Math.round(num * 100) / 100;
};

const PilotoRow: React.FC<PilotoRowProps> = ({ piloto, onTimeChange, onDeletePiloto, selectedPasada, isReadOnly, fastestTimes }) => {

    const renderRunData = () => {
        if (selectedPasada === null) {
            return (
                <>
                    {piloto.pasadas.map(pasada => (
                        <td 
                            key={`pasada-subtotal-${pasada.id}`} 
                            className="px-2 py-2 sm:px-3 sm:py-3 whitespace-nowrap text-center text-sm font-medium text-gray-800 bg-gray-50"
                        >
                            {pasada.subtotal.toFixed(2)}
                        </td>
                    ))}
                    <td className="px-2 py-2 sm:px-3 sm:py-3 whitespace-nowrap text-center text-sm sm:text-base font-bold text-gray-900 bg-gray-100">
                        {piloto.total.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 sm:px-3 sm:py-3 whitespace-nowrap text-center text-sm font-medium">
                        {!isReadOnly && (
                            <button
                                onClick={() => onDeletePiloto(piloto)}
                                className="p-1 sm:p-2 text-red-600 hover:text-red-900 transition-colors"
                                aria-label="Eliminar piloto"
                            >
                                <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                        )}
                    </td>
                </>
            );
        }

        const pasadaSeleccionada = piloto.pasadas.find(pasada => pasada.id === selectedPasada) as Pasada;

        return (
            <>
                {pasadaSeleccionada.tramos.map(tramo => {
                    const esTiempoMasRapido = isReadOnly && 
                                              tramo.tiempo !== null && 
                                              roundToTwoDecimals(tramo.tiempo) === roundToTwoDecimals(fastestTimes[tramo.id]);
                    
                    return (
                        <td 
                            key={`${piloto.id}-${pasadaSeleccionada.id}-${tramo.id}`} 
                            className={`px-1 py-1 sm:px-2 sm:py-2 whitespace-nowrap text-center text-xs sm:text-sm
                                ${esTiempoMasRapido ? 'bg-green-200 font-bold text-gray-900' : 'text-gray-500'}
                            `}
                        >
                            {isReadOnly ? (
                                tramo.tiempo !== null ? tramo.tiempo.toFixed(2) : '-'
                            ) : (
                                <input
                                    type="number"
                                    className="w-12 sm:w-16 text-center border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    value={tramo.tiempo ?? ''}
                                    onChange={(e) => onTimeChange(piloto.id, selectedPasada, tramo.id, e.target.value === '' ? null : Number(e.target.value))}
                                />
                            )}
                        </td>
                    );
                })}
                <td className="px-2 py-2 sm:px-3 sm:py-3 whitespace-nowrap text-center text-sm font-medium text-gray-800 bg-gray-50">
                    {pasadaSeleccionada.subtotal.toFixed(2)}
                </td>
                <td className="px-2 py-2 sm:px-3 sm:py-3 whitespace-nowrap text-center text-sm font-medium">
                    {!isReadOnly && (
                        <button
                            onClick={() => onDeletePiloto(piloto)}
                            className="p-1 sm:p-2 text-red-600 hover:text-red-900 transition-colors"
                            aria-label="Eliminar piloto"
                        >
                            <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                    )}
                </td>
            </>
        );
    };

    return (
        <tr className="hover:bg-gray-100">
            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {piloto.nombre} {piloto.apellido}
            </td>
            {renderRunData()}
        </tr>
    );
};

export default PilotoRow;