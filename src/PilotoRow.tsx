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
                            className="text-center text-nowrap align-middle"
                        >
                            {pasada.subtotal.toFixed(2)}
                        </td>
                    ))}
                    <td className="text-center text-nowrap align-middle table-active fw-bold">
                        {piloto.total.toFixed(2)}
                    </td>
                    <td className="text-center text-nowrap align-middle">
                        {!isReadOnly && (
                            <button
                                onClick={() => onDeletePiloto(piloto)}
                                className="btn btn-sm btn-outline-danger"
                                aria-label="Eliminar piloto"
                            >
                                <TrashIcon style={{ width: '1.25rem', height: '1.25rem' }} />
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
                    
                    const cellClass = `text-center text-nowrap align-middle ${esTiempoMasRapido ? 'table-success fw-bold' : ''}`;
                    
                    return (
                        <td 
                            key={`${piloto.id}-${pasadaSeleccionada.id}-${tramo.id}`} 
                            className={cellClass}
                        >
                            {isReadOnly ? (
                                tramo.tiempo !== null ? tramo.tiempo.toFixed(2) : '-'
                            ) : (
                                <input
                                    type="number"
                                    className="form-control text-center"
                                    value={tramo.tiempo ?? ''}
                                    onChange={(e) => onTimeChange(piloto.id, selectedPasada, tramo.id, e.target.value === '' ? null : Number(e.target.value))}
                                />
                            )}
                        </td>
                    );
                })}
                <td className="text-center text-nowrap align-middle table-active">
                    {pasadaSeleccionada.subtotal.toFixed(2)}
                </td>
                <td className="text-center text-nowrap align-middle">
                    {!isReadOnly && (
                        <button
                            onClick={() => onDeletePiloto(piloto)}
                            className="btn btn-sm btn-outline-danger"
                            aria-label="Eliminar piloto"
                        >
                            <TrashIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                        </button>
                    )}
                </td>
            </>
        );
    };

    return (
        <tr>
            <td className="text-nowrap align-middle">
                {piloto.nombre} {piloto.apellido}
            </td>
            {renderRunData()}
        </tr>
    );
};

export default PilotoRow;