// src/components/ConfigPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRallyData } from '../useRallyData';

const ConfigPage: React.FC = () => {
  const [numPasadas, setNumPasadas] = useState(3);
  const [numTramos, setNumTramos] = useState(5);
  const { startNewRally } = useRallyData();
  const navigate = useNavigate();

  const handleStart = () => {
    startNewRally(numPasadas, numTramos);
    navigate('/rally');
  };

  return (
    <div className="d-flex flex-column align-items-center">
      <h1 className="text-center mb-4">Configuración del Rally</h1>
      <div className="card shadow-sm p-4" style={{ maxWidth: '500px' }}>
        <div className="mb-3">
          <label htmlFor="numPasadas" className="form-label">Número de Pasadas</label>
          <input
            id="numPasadas"
            type="number"
            className="form-control"
            value={numPasadas}
            onChange={(e) => setNumPasadas(Number(e.target.value))}
            min="1"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="numTramos" className="form-label">Número de Tramos por Pasada</label>
          <input
            id="numTramos"
            type="number"
            className="form-control"
            value={numTramos}
            onChange={(e) => setNumTramos(Number(e.target.value))}
            min="1"
          />
        </div>
        <button
          className="btn btn-primary mt-3 w-100"
          onClick={handleStart}
        >
          Iniciar Rally
        </button>
      </div>
    </div>
  );
};

export default ConfigPage;