// src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RallyTable from './components/RallyTable';
import ConfigPage from './pages/ConfigPage';
// Se importa el proveedor del contexto, no el contexto en sí mismo
import { RallyDataProvider } from './useRallyData';
import 'bootstrap/dist/css/bootstrap.min.css';
import DarkModeButton from './components/DarkModeButton';

function App() {
  return (
    <BrowserRouter>
      {/* Se envuelve la aplicación en el proveedor */}
      <RallyDataProvider>
        <div className="container mt-4">
          <div className="d-flex justify-content-end mb-3">
            <DarkModeButton />
          </div>
          <Routes>
            <Route path="/" element={<ConfigPage />} />
            <Route path="/rally" element={<RallyTable />} />
          </Routes>
        </div>
      </RallyDataProvider>
    </BrowserRouter>
  );
}

export default App;