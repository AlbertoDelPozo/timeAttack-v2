// src/PilotoRow.tsx

import React from "react";
import type { Piloto, Pasada } from "./types";

interface PilotoRowProps {
    piloto: Piloto;
    onTimeChange: (pilotoId: number, pasadaId: number, tramoId: number, tiempo: number | null) => void;
    onDeletePiloto: (piloto: Piloto) => void;
    selectedPasada: number | null;
}

const PilotoRow: React.FC<PilotoRowProps> = ({ piloto, onTimeChange, onDeletePiloto, selectedPasada }) => {

    const renderPasadaData = () => {
        // Si no hay pasada seleccionada, mostramos los subtotales de cada pasada y el total final
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
                        <button
                            onClick={() => onDeletePiloto(piloto)}
                            className="p-1 sm:p-2 text-red-600 hover:text-red-900 transition-colors"
                            aria-label="Eliminar piloto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </td>
                </>
            );
        }

        // Si hay una pasada seleccionada, buscamos los datos correspondientes y los mostramos
        const pasadaSeleccionada = piloto.pasadas.find(pasada => pasada.id === selectedPasada) as Pasada;

        return (
            <>
                {pasadaSeleccionada.tramos.map(tramo => (
                    <td key={`${piloto.id}-${pasadaSeleccionada.id}-${tramo.id}`} className="px-1 py-1 sm:px-2 sm:py-2 whitespace-nowrap text-center text-xs sm:text-sm text-gray-500">
                        <input
                            type="number"
                            className="w-12 sm:w-16 text-center border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            value={tramo.tiempo ?? ''}
                            onChange={(e) => onTimeChange(piloto.id, selectedPasada, tramo.id, e.target.value === '' ? null : Number(e.target.value))}
                        />
                    </td>
                ))}
                <td className="px-2 py-2 sm:px-3 sm:py-3 whitespace-nowrap text-center text-sm font-medium text-gray-800 bg-gray-50">
                    {pasadaSeleccionada.subtotal.toFixed(2)}
                </td>
                <td className="px-2 py-2 sm:px-3 sm:py-3 whitespace-nowrap text-center text-sm font-medium">
                    <button
                        onClick={() => onDeletePiloto(piloto)}
                        className="p-1 sm:p-2 text-red-600 hover:text-red-900 transition-colors"
                        aria-label="Eliminar piloto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                </td>
            </>
        );
    };

    return (
        <tr className="hover:bg-gray-100">
            <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {piloto.nombre} {piloto.apellido}
            </td>
            {renderPasadaData()}
        </tr>
    );
};

export default PilotoRow;