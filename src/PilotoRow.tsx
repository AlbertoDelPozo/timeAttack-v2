import React from "react";
import type { Piloto } from "./types";

interface PilotoRowProps {
    piloto: Piloto;
    onTimeChange: (pilotoId: number, pasadaId: number, tramoId: number, tiempo: number | null) => void;
    onDeletePiloto: (pilotoId: number) => void;
}

const PilotoRow: React.FC<PilotoRowProps> = ({ piloto, onTimeChange, onDeletePiloto}) => {
    return (
        <tr>
            <td>{piloto.nombre} {piloto.apellido}</td>
            {piloto.pasadas.map(pasada => (
                <React.Fragment key={pasada.id}>
                    {pasada.tramos.map(tramo => (
                        <td key={tramo.id}>
                            <input 
                                type="number"
                                value={tramo.tiempo ?? ''}
                                onChange={(e) => 
                                    onTimeChange(
                                        piloto.id, 
                                        pasada.id, 
                                        tramo.id, 
                                        e.target.value === '' ? null : Number(e.target.value)
                                    )
                                }
                            />
                        </td>
                    ))}
                    <td>{pasada.subtotal.toFixed(2)}</td>
                </React.Fragment>
            ))}
            <td>{piloto.total.toFixed(2)}</td>
            <td>
                <button onClick={() => onDeletePiloto(piloto.id)}>Eliminar</button>
            </td>
        </tr>
    );
};

export default PilotoRow;