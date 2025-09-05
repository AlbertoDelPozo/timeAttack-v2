import React, { useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import RallyTable from './components/RallyTable';
import ConfigPage from './pages/ConfigPage';
import Navbar from '../src/components/NavBar';
import { RallyDataProvider, useRallyData } from './useRallyData';
import { ThemeProvider } from '../context/ThemeContext';

function App() {
  const navigate = useNavigate();
  const { resetRallyData } = useRallyData(); // Obtiene la función del contexto

  const handleNewRally = useCallback(() => {
    resetRallyData(); // Llama a la nueva función
    navigate('/');
  }, [navigate, resetRallyData]);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <Navbar onNewRally={handleNewRally} />
      <main className="p-4 md:p-8">
        <Routes>
          <Route path="/" element={<ConfigPage />} />
          <Route path="/rally" element={<RallyTable />} />
        </Routes>
      </main>
    </div>
  );
}

const AppProvider = () => (
    <BrowserRouter>
      <ThemeProvider>
        <RallyDataProvider>
          <App />
        </RallyDataProvider>
      </ThemeProvider>
    </BrowserRouter>
);

export default AppProvider;